import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { 
  loginSchema, 
  insertUserSchema, 
  insertProjectSchema, 
  insertTransactionSchema,
  insertDocumentSchema,
  insertActivityLogSchema,
  insertSettingSchema,
  funds,
  type Transaction
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { backupSystem } from "./backup-system";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
// استيراد وظائف Firebase Storage والتخزين المحلي كنسخة احتياطية
import { uploadFile as firebaseUpload, deleteFile as firebaseDelete } from "./firebase-utils-new"; 
import { uploadFile as localUpload, deleteFile as localDelete } from "./firebase-utils";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// إنشاء متغير يحل محل __dirname مع ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// إعداد multer لمعالجة تحميل الملفات
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // إنشاء مجلد التحميلات إذا لم يكن موجودًا
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // إنشاء اسم فريد للملف
      const uniqueName = `${Date.now()}_${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف (اختياري)
    cb(null, true);
  }
});

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    role: string;
    lastActivity?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const MemoryStoreSession = MemoryStore(session);
  // تسجيل متغير PgStore من وحدة connect-pg-simple
  const PostgreSQLStore = connectPgSimple(session);
  
  // استخدام أبسط إعداد للجلسات للتجربة
  app.use(session({
    secret: "accounting-app-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: { 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax', // يسمح للكوكيز بالانتقال من صفحة لأخرى في نفس الدومين
      secure: false, // تغيير إلى true في بيئة الإنتاج مع HTTPS
      path: '/'
    },
    // استخدام تخزين الذاكرة بشكل مؤقت للتغلب على المشكلة
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // تسجيل معلومات الجلسة للتصحيح
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    next();
  });

  // Authentication middleware with session timeout
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "غير مصرح" });
    }

    // فحص انتهاء صلاحية الجلسة (30 دقيقة من عدم النشاط)
    const now = new Date();
    const lastActivity = req.session.lastActivity ? new Date(req.session.lastActivity) : now;
    const thirtyMinutes = 30 * 60 * 1000; // 30 دقيقة بالميلي ثانية

    if (now.getTime() - lastActivity.getTime() > thirtyMinutes) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
    }

    // تحديث آخر نشاط
    req.session.lastActivity = now.toISOString();
    next();
  };

  // Role-based authorization middleware
  const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.userId || !roles.includes(req.session.role as string)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log('Login attempt:', req.body);
      const credentials = loginSchema.parse(req.body);
      console.log('Valid credentials schema:', credentials);
      
      const user = await storage.getUserByUsername(credentials.username);
      console.log('User found:', user ? { id: user.id, username: user.username, role: user.role } : 'No user found');
      
      if (!user) {
        return res.status(401).json({ message: "معلومات تسجيل الدخول غير صحيحة" });
      }
      
      try {
        const isPasswordValid = await storage.validatePassword(user.password, credentials.password);
        console.log('Password validation result:', isPasswordValid);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: "معلومات تسجيل الدخول غير صحيحة" });
        }
        
        // Store user info in session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.lastActivity = new Date().toISOString();
        // إضافة علامة للإشارة إلى تعديل الجلسة
        (req.session as any).modified = true;
        
        console.log('Session updated:', { 
          userId: req.session.userId, 
          username: req.session.username, 
          role: req.session.role 
        });
        
        // تخزين الجلسة بشكل صريح
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session:', err);
          } else {
            console.log('Session saved successfully with ID:', req.sessionID);
          }
        });
        
        await storage.createActivityLog({
          action: "login",
          entityType: "user",
          entityId: user.id,
          details: "تسجيل دخول",
          userId: user.id
        });
        
        return res.status(200).json({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        });
      } catch (passwordError) {
        console.error('Password validation error:', passwordError);
        return res.status(500).json({ message: "خطأ في التحقق من كلمة المرور" });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
    }
  });

  app.post("/api/auth/logout", authenticate, async (req: Request, res: Response) => {
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      }
      
      if (userId) {
        storage.createActivityLog({
          action: "logout",
          entityType: "user",
          entityId: userId,
          details: "تسجيل خروج",
          userId: userId
        });
      }
      
      res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  app.post("/api/auth/firebase-login", async (req: Request, res: Response) => {
    try {
      // التحقق من بيانات المستخدم القادمة من Firebase
      // في بيئة الإنتاج، يجب التحقق من token مع Firebase Admin SDK
      // لكن في هذا المثال البسيط، سنقبل المعلومات كما هي
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "بريد إلكتروني غير صالح" });
      }
      
      // البحث عن المستخدم بواسطة البريد الإلكتروني
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // إنشاء مستخدم جديد إذا لم يكن موجودًا بالفعل
        const username = email.split('@')[0]; // استخدام جزء من البريد الإلكتروني كاسم مستخدم
        
        // إنشاء مستخدم جديد
        // الحظ أن permissions غير متاح في نوع InsertUser ولكنه متاح في نوع User
        // لذلك نحتاج إلى تعديل كيفية إنشاء المستخدم
        user = await storage.createUser({
          username,
          password: '', // لا نحتاج إلى كلمة مرور مع مصادقة Firebase
          name: name || username,
          email,
          role: 'user',
          // نحذف permissions هنا
          active: true
        });
        
        await storage.createActivityLog({
          action: "register",
          entityType: "user",
          entityId: user.id,
          details: "تسجيل مستخدم جديد عبر Firebase",
          userId: user.id
        });
      }
      
      // حفظ معلومات المستخدم في الجلسة
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      // إضافة علامة للإشارة إلى تعديل الجلسة
      (req.session as any).modified = true;
      
      // تخزين الجلسة بشكل صريح
      req.session.save((err) => {
        if (err) {
          console.error('Error saving Firebase session:', err);
        } else {
          console.log('Firebase session saved successfully with ID:', req.sessionID);
        }
      });
      
      await storage.createActivityLog({
        action: "login",
        entityType: "user",
        entityId: user.id,
        details: "تسجيل دخول عبر Firebase",
        userId: user.id
      });
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error('Firebase login error:', error);
      return res.status(500).json({ message: "خطأ في تسجيل الدخول عبر Firebase" });
    }
  });

  app.get("/api/auth/session", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    
    return res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });
  });

  // Users routes
  app.get("/api/users", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      // Don't return password hashes
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      return res.status(200).json(safeUsers);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في استرجاع المستخدمين" });
    }
  });

  app.post("/api/users", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("بدء إنشاء مستخدم جديد");
      const userData = insertUserSchema.parse(req.body);
      console.log("بيانات المستخدم بعد التحقق من المخطط:", userData);
      
      // Hash password
      userData.password = await bcrypt.hash(userData.password, 10);
      
      // استخراج معرف المشروع قبل إنشاء المستخدم إذا كان موجودًا
      const projectId = userData.projectId;
      delete userData.projectId; // إزالة الحقل غير المستخدم في إنشاء المستخدم
      
      // تأكد من أن مصفوفة الصلاحيات معرّفة
      if (!userData.permissions) {
        userData.permissions = [];
      }
      
      console.log("بيانات المستخدم قبل الإدخال في قاعدة البيانات:", {
        ...userData,
        password: "***مخفية***"
      });
      
      try {
        const user = await storage.createUser(userData);
        console.log("تم إنشاء المستخدم بنجاح:", { id: user.id, username: user.username });
        
        // إذا تم تحديد مشروع، يتم تخصيصه للمستخدم
        if (projectId) {
          try {
            await storage.assignUserToProject({
              userId: user.id,
              projectId: projectId,
              assignedBy: req.session.userId as number
            });
            
            await storage.createActivityLog({
              action: "update",
              entityType: "user_project",
              entityId: user.id,
              details: `تخصيص المستخدم ${user.name} للمشروع رقم ${projectId}`,
              userId: req.session.userId as number
            });
          } catch (err) {
            console.error("خطأ في تخصيص المشروع للمستخدم:", err);
            // استمر بدون توقف عند حدوث خطأ في تخصيص المشروع
          }
        }
        
        await storage.createActivityLog({
          action: "create",
          entityType: "user",
          entityId: user.id,
          details: `إضافة مستخدم جديد: ${user.name}`,
          userId: req.session.userId as number
        });
        
        const { password, ...safeUser } = user;
        return res.status(201).json(safeUser);
      } catch (dbError) {
        console.error("خطأ في قاعدة البيانات عند إنشاء المستخدم:", dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("خطأ كامل عند إنشاء المستخدم:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "خطأ في إنشاء المستخدم" });
    }
  });

  app.put("/api/users/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // التحقق مما إذا كان المستخدم المراد تعديله هو المدير الرئيسي (معرف = 1)
      if (id === 1) {
        // اسمح فقط بتغيير اسم المستخدم أو كلمة المرور أو البريد الإلكتروني، ولكن ليس الدور أو الصلاحيات
        if (userData.role) {
          console.log("محاولة تغيير دور المدير الرئيسي - تم رفضها");
          return res.status(400).json({ message: "لا يمكن تغيير دور المدير الرئيسي للنظام" });
        }
        // إذا كان هناك محاولة لتعديل الصلاحيات، امنعها
        if (userData.permissions) {
          console.log("محاولة تغيير صلاحيات المدير الرئيسي - تم رفضها");
          return res.status(400).json({ message: "لا يمكن تغيير صلاحيات المدير الرئيسي للنظام" });
        }
        // إذا كان هناك محاولة لإلغاء تفعيل حساب المدير، امنعها
        if (userData.active === false) {
          console.log("محاولة إلغاء تفعيل حساب المدير الرئيسي - تم رفضها");
          return res.status(400).json({ message: "لا يمكن إلغاء تفعيل حساب المدير الرئيسي" });
        }
        
        console.log("محاولة تحديث بيانات المدير الرئيسي - السماح فقط بتغيير الاسم وكلمة المرور والبريد الإلكتروني");
      }
      
      // استخراج معرف المشروع قبل تحديث المستخدم إذا كان موجودًا
      const projectId = userData.projectId;
      delete userData.projectId; // إزالة الحقل غير المستخدم في تحديث المستخدم
      
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // إدارة تخصيص المشروع إذا تم تحديده
      if (projectId !== undefined) {
        try {
          // أولاً، نزيل أي علاقات موجودة للمستخدم مع المشاريع الأخرى
          // يمكن تغيير هذا السلوك لاحقًا إذا كان المستخدم يمكن أن ينتمي إلى عدة مشاريع
          
          // إذا كان معرف المشروع قيمة صالحة (ليس صفر أو null)، قم بتخصيص المشروع
          if (projectId) {
            // تحقق إذا كان المستخدم مخصص بالفعل لهذا المشروع
            const hasAccess = await storage.checkUserProjectAccess(id, projectId);
            
            if (!hasAccess) {
              // إذا لم يكن المستخدم مخصصًا بالفعل لهذا المشروع، قم بتخصيصه
              await storage.assignUserToProject({
                userId: id,
                projectId: projectId,
                assignedBy: req.session.userId as number
              });
              
              await storage.createActivityLog({
                action: "update",
                entityType: "user_project",
                entityId: id,
                details: `تخصيص المستخدم ${updatedUser.name} للمشروع رقم ${projectId}`,
                userId: req.session.userId as number
              });
            }
          } else {
            // إذا كان المستخدم يجب أن لا ينتمي إلى أي مشروع، فقم بإزالة جميع العلاقات
            // ملاحظة: يمكن تنفيذ ذلك لاحقًا إذا لزم الأمر
          }
        } catch (err) {
          console.error("خطأ في تخصيص المشروع للمستخدم:", err);
          // استمر بدون توقف عند حدوث خطأ في تخصيص المشروع
        }
      }
      
      await storage.createActivityLog({
        action: "update",
        entityType: "user",
        entityId: id,
        details: `تحديث بيانات المستخدم: ${updatedUser.name}`,
        userId: req.session.userId as number
      });
      
      const { password, ...safeUser } = updatedUser;
      return res.status(200).json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  app.delete("/api/users/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // التحقق من عدم محاولة حذف المستخدم الحالي
      if (id === req.session.userId) {
        return res.status(400).json({ message: "لا يمكن حذف المستخدم الحالي" });
      }
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // لا يمكن حذف المستخدم الرئيسي (الأدمن الأساسي)
      if (id === 1) {
        return res.status(400).json({ message: "لا يمكن حذف المستخدم الرئيسي للنظام" });
      }
      
      try {
        // تنفيذ عملية الحذف
        const result = await storage.deleteUser(id);
        
        if (result) {
          await storage.createActivityLog({
            action: "delete",
            entityType: "user",
            entityId: id,
            details: `حذف المستخدم: ${user.name}`,
            userId: req.session.userId as number
          });
        }
        
        return res.status(200).json({ success: result });
      } catch (err) {
        console.error("خطأ في حذف المستخدم:", err);
        return res.status(500).json({ message: "حدث خطأ أثناء معالجة حذف المستخدم" });
      }
    } catch (error) {
      console.error("خطأ عام في حذف المستخدم:", error);
      return res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Projects routes
  app.get("/api/projects", authenticate, async (req: Request, res: Response) => {
    try {
      // اقتراب مختلف بناءً على دور المستخدم
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // المدير يمكنه رؤية جميع المشاريع
      if (userRole === "admin") {
        const projects = await storage.listProjects();
        return res.status(200).json(projects);
      } else {
        // المستخدم العادي يرى فقط المشاريع المخصصة له
        const projects = await storage.getUserProjects(userId);
        return res.status(200).json(projects);
      }
    } catch (error) {
      console.error("خطأ في استرجاع المشاريع:", error);
      return res.status(500).json({ message: "خطأ في استرجاع المشاريع" });
    }
  });
  
  // إضافة نقطة نهاية جديدة للحصول على المشاريع المخصصة للمستخدم
  app.get("/api/user-projects", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const projects = await storage.getUserProjects(userId);
      return res.status(200).json(projects);
    } catch (error) {
      console.error("خطأ في استرجاع مشاريع المستخدم:", error);
      return res.status(500).json({ message: "خطأ في استرجاع مشاريع المستخدم" });
    }
  });

  app.post("/api/projects", authenticate, async (req: Request, res: Response) => {
    try {
      console.log("Project creation request:", req.body);

      if (!req.body.name || !req.body.description || !req.body.startDate || !req.body.status) {
        return res.status(400).json({ message: "البيانات المطلوبة غير مكتملة" });
      }
      
      const projectData = insertProjectSchema.parse(req.body);
      projectData.createdBy = req.session.userId as number;
      
      console.log("Parsed project data:", projectData);
      
      const project = await storage.createProject(projectData);
      console.log("Created project:", project); // إضافة سجل للمشروع المنشأ
      
      await storage.createActivityLog({
        action: "create",
        entityType: "project",
        entityId: project.id,
        details: `إضافة مشروع جديد: ${project.name}`,
        userId: req.session.userId as number
      });
      
      // التأكد من أن كل البيانات موجودة في الاستجابة
      if (!project.name) {
        console.error("Warning: Project name is missing in the created project");
      }
      
      return res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", error.errors);
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "خطأ في إنشاء المشروع" });
    }
  });

  app.put("/api/projects/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = req.body;
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // Only project creator or admin can update
      if (project.createdBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذا المشروع" });
      }
      
      const updatedProject = await storage.updateProject(id, projectData);
      
      if (updatedProject) {
        await storage.createActivityLog({
          action: "update",
          entityType: "project",
          entityId: id,
          details: `تحديث مشروع: ${updatedProject.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json(updatedProject);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في تحديث المشروع" });
    }
  });

  app.delete("/api/projects/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`محاولة حذف المشروع رقم: ${id} بواسطة المستخدم: ${req.session.userId}, الدور: ${req.session.role}`);
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // التحقق مما إذا كان المشروع مرتبط بأي معاملات مالية
      const projectTransactions = await storage.getTransactionsByProject(id);
      if (projectTransactions.length > 0) {
        return res.status(400).json({ 
          message: "لا يمكن حذف المشروع لأنه يحتوي على معاملات مالية مرتبطة به",
          transactionsCount: projectTransactions.length
        });
      }
      
      // التحقق مما إذا كان المشروع مرتبط بصندوق
      const projectFund = await storage.getFundByProject(id);
      if (projectFund) {
        try {
          // حذف الصندوق المرتبط بالمشروع
          console.log(`محاولة حذف الصندوق المرتبط بالمشروع: ${projectFund.id}`);
          
          const [deletedFund] = await db.delete(funds)
            .where(eq(funds.id, projectFund.id))
            .returning();
          
          console.log(`تم حذف الصندوق المرتبط بالمشروع: ${JSON.stringify(deletedFund)}`);
        } catch (error) {
          console.error("خطأ أثناء حذف الصندوق المرتبط بالمشروع:", error);
          return res.status(400).json({ 
            message: "لا يمكن حذف الصندوق المرتبط بالمشروع. يرجى التحقق من أنه لا توجد معاملات مرتبطة به",
            fundId: projectFund.id,
            error: error instanceof Error ? error.message : "خطأ غير معروف"
          });
        }
      }
      
      // حذف أي مستندات مرتبطة بالمشروع
      const projectDocuments = await storage.getDocumentsByProject(id);
      for (const document of projectDocuments) {
        await storage.deleteDocument(document.id);
      }
      
      // إزالة أي مستخدمين مرتبطين بالمشروع
      const projectUsers = await storage.getProjectUsers(id);
      for (const user of projectUsers) {
        await storage.removeUserFromProject(user.id, id);
      }
      
      // بعد التحقق من عدم وجود أي عناصر مرتبطة، يمكننا حذف المشروع
      const result = await storage.deleteProject(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "project",
          entityId: id,
          details: `حذف مشروع: ${project.name}`,
          userId: req.session.userId as number
        });
        
        return res.status(200).json({ success: true, message: "تم حذف المشروع بنجاح" });
      } else {
        return res.status(500).json({ message: "فشل في حذف المشروع لسبب غير معروف" });
      }
    } catch (error) {
      console.error("خطأ في حذف المشروع:", error);
      return res.status(500).json({ 
        message: "خطأ في حذف المشروع", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  // Transactions routes
  app.get("/api/transactions", authenticate, async (req: Request, res: Response) => {
    try {
      let transactions = await storage.listTransactions();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      const withAttachments = req.query.withAttachments === 'true';
      
      // المدير يمكنه رؤية جميع المعاملات، المستخدم العادي يرى فقط معاملات المشاريع التي لديه وصول إليها
      if (userRole !== "admin") {
        // احصل على قائمة المشاريع المسموح للمستخدم بالوصول إليها
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        // فلترة المعاملات بحيث تظهر فقط:
        // معاملات المشاريع التي يملك المستخدم وصولاً إليها، واستبعاد معاملات الصندوق الرئيسي تماماً
        transactions = transactions.filter(t => 
          t.projectId && projectIds.includes(t.projectId)
        );
      }
      
      // Filter by project if specified
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      if (projectId) {
        // إذا كان المستخدم غير مدير، تحقق من وصوله للمشروع
        if (userRole !== "admin") {
          const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
          if (!hasAccess) {
            return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذا المشروع" });
          }
        }
        transactions = transactions.filter(t => t.projectId === projectId);
      }
      
      // Filter by type if specified
      const type = req.query.type as string | undefined;
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      // فلترة حسب وجود مرفقات
      if (withAttachments) {
        transactions = transactions.filter(t => t.fileUrl && t.fileUrl.trim() !== '');
      }
      
      // إخفاء معلومات المرفقات للمستخدمين غير المصرح لهم
      if (userRole !== "admin") {
        transactions = transactions.map(transaction => {
          // إذا كان المستخدم ليس منشئ المعاملة، أخف معلومات المرفق
          if (transaction.createdBy !== userId) {
            return {
              ...transaction,
              fileUrl: null,
              fileType: null
            };
          }
          return transaction;
        });
      }
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("خطأ في استرجاع المعاملات:", error);
      return res.status(500).json({ message: "خطأ في استرجاع المعاملات" });
    }
  });

  // إضافة middleware لمعالجة الملفات المرفقة للمعاملات
  app.post("/api/transactions", authenticate, upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log("Transaction creation request:", req.body);
      console.log("File attachment:", req.file);

      if (!req.body.date || !req.body.amount || !req.body.type || !req.body.description) {
        // إزالة الملف المؤقت إذا وجد
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }

      // تحويل قيمة المشروع من none إلى undefined
      if (req.body.projectId === "none" || req.body.projectId === "") {
        req.body.projectId = undefined;
      }
      
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      const amount = Number(req.body.amount);
      const type = req.body.type as string;
      const expenseType = req.body.expenseType as string || "مصروف عام";
      const description = req.body.description as string;
      const projectId = req.body.projectId ? Number(req.body.projectId) : undefined;
      
      // التحقق من صلاحيات المستخدم
      // 1. إذا لم يتم تحديد مشروع، فقط المدير يمكنه إنشاء معاملات عامة
      if (!projectId && userRole !== "admin") {
        return res.status(403).json({ 
          message: "غير مصرح للمستخدم العادي بإنشاء معاملات بدون تحديد مشروع"
        });
      }
      
      // 2. إذا تم تحديد مشروع وكان المستخدم غير مدير، يجب التحقق من وصوله للمشروع
      if (projectId && userRole !== "admin") {
        try {
          const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
          if (!hasAccess) {
            console.log(`المستخدم ${userId} ليس لديه صلاحية للوصول للمشروع ${projectId}`);
            return res.status(403).json({ 
              message: "غير مصرح لك بإنشاء معاملات لهذا المشروع"
            });
          }
          console.log(`المستخدم ${userId} لديه صلاحية للوصول للمشروع ${projectId}`);
        } catch (error) {
          console.error("خطأ في التحقق من صلاحية الوصول للمشروع:", error);
          return res.status(500).json({ 
            message: "خطأ في التحقق من صلاحية الوصول للمشروع"
          });
        }
      }
      
      let result: any;
      
      // معالجة العملية حسب نوعها ووجود مشروع ودور المستخدم
      if (userRole === 'admin') {
        // المدير له حق إجراء معاملات على الصندوق الرئيسي أو المشاريع
        if (type === "income") {
          // عندما يكون النوع "income" - إيراد
          if (projectId) {
            // إذا تم تحديد مشروع مع نوع إيراد، يجب أن يعتبر كمصروف من صندوق المدير
            try {
              // نستخدم وظيفة processDeposit لمعالجة إيداع في المشروع
              // هذه الوظيفة تقوم بخصم المبلغ من صندوق المدير وتسجيله كمصروف
              // ثم تضيف المبلغ إلى صندوق المشروع وتسجله كإيراد
              result = await storage.processDeposit(userId, projectId, amount, description);
              
              // نقوم بإضافة سجل نشاط إضافي لتوضيح أن هذه العملية تمت من قبل المدير
              await storage.createActivityLog({
                action: "create",
                entityType: "transaction",
                entityId: result.transaction.id,
                details: `إيداع في المشروع ${projectId} بقيمة ${amount} من قبل المدير (مصروف من صندوق المدير)`,
                userId
              });
            } catch (error) {
              console.error("خطأ في إيداع مبلغ في المشروع:", error);
              throw error;
            }
          } else {
            // عملية إيراد للصندوق الرئيسي
            result = await storage.processAdminTransaction(userId, type, amount, description);
          }
        } else if (type === "expense") {
          // عمليات مصروفات للمدير يمكن أن تكون على الصندوق الرئيسي أو المشاريع
          if (projectId) {
            // عملية صرف من المشروع
            result = await storage.processWithdrawal(userId, projectId, amount, description);
          } else {
            // عملية صرف من الصندوق الرئيسي
            result = await storage.processAdminTransaction(userId, type, amount, description);
          }
        }
      } else {
        // المستخدم العادي لا يمكنه إجراء معاملات إلا على المشاريع المخصصة له
        if (!projectId) {
          return res.status(400).json({ message: "يجب تحديد مشروع للعملية" });
        }
        
        if (type === "income") {
          // عملية إيداع في المشروع (تستقطع من حساب المدير)
          // هذه العملية تعني أن المستخدم يقوم بتحويل مبلغ من صندوق المدير إلى صندوق المشروع
          result = await storage.processDeposit(userId, projectId, amount, description);
        } else if (type === "expense") {
          // عملية صرف من المشروع مع نوع المصروف
          result = await storage.processWithdrawal(userId, projectId, amount, description, expenseType);
        }
      }
      
      // إذا لم تتم معالجة العملية بأي من الطرق السابقة
      if (!result || !result.transaction) {
        // إذا كان هناك ملف مرفق، نقوم بحذفه
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: "خطأ في معالجة العملية" });
      }
      
      // إذا كان هناك ملف مرفق، نقوم برفعه وتحديث المعاملة
      if (req.file) {
        try {
          // محاولة تحميل الملف إلى Firebase Storage
          const storageFolder = `transactions/${result.transaction.id}`;
          let fileUrl;
          try {
            // محاولة استخدام Firebase أولاً
            fileUrl = await firebaseUpload(req.file.path, `${storageFolder}/${req.file.filename}`);
            console.log("تم رفع الملف المرفق بنجاح باستخدام Firebase Storage:", fileUrl);
          } catch (firebaseError: unknown) {
            // إذا فشل، استخدم التخزين المحلي كخطة بديلة
            console.warn("فشل استخدام Firebase Storage لرفع المرفق، الرجوع إلى التخزين المحلي:", (firebaseError as Error).message);
            fileUrl = await localUpload(req.file.path, `${storageFolder}/${req.file.filename}`);
            console.log("تم رفع الملف المرفق بنجاح باستخدام التخزين المحلي:", fileUrl);
          }
          
          // تحديث المعاملة بعنوان URL للملف المرفق
          await storage.updateTransaction(result.transaction.id, { 
            fileUrl,
            fileType: req.file.mimetype
          });
          
          // تحديث كائن النتيجة بمعلومات الملف
          result.transaction.fileUrl = fileUrl;
          result.transaction.fileType = req.file.mimetype;
          
        } catch (fileError) {
          console.error("خطأ أثناء معالجة الملف المرفق:", fileError);
          // نستمر بإرجاع المعاملة حتى لو فشل رفع الملف
        }
      }
      
      return res.status(201).json(result.transaction);
    } catch (error: any) {
      console.error("Transaction creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", error.errors);
        return res.status(400).json({ message: error.errors[0].message });
      }
      // إعادة رسالة الخطأ من الاستثناء إذا كانت متوفرة
      return res.status(500).json({ message: error.message || "خطأ في إنشاء المعاملة" });
    }
  });

  app.put("/api/transactions/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // التحقق من صحة البيانات المستلمة باستخدام Zod
      const transactionSchema = z.object({
        date: z.string().or(z.date()),
        type: z.enum(["income", "expense"]),
        expenseType: z.string().optional(),
        amount: z.number().positive(),
        description: z.string(),
        projectId: z.number().nullable().optional(),
      });
      
      // التحقق من البيانات وإرجاع أي أخطاء
      let transactionData;
      try {
        transactionData = transactionSchema.parse(req.body);
        console.log("البيانات المدخلة للتحديث:", transactionData);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "بيانات غير صحيحة", 
            errors: validationError.errors.map(e => e.message)
          });
        }
        throw validationError;
      }
      
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // Only transaction creator or admin can update
      if (transaction.createdBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذه المعاملة" });
      }
      
      // تنسيق البيانات (التأكد من أن projectId هو null أو رقم وليس undefined)
      // تحويل البيانات إلى الصيغة المناسبة
      const formattedData = {
        date: new Date(transactionData.date.toString()),
        type: transactionData.type,
        expenseType: transactionData.expenseType,
        amount: transactionData.amount,
        description: transactionData.description,
        projectId: transactionData.projectId === undefined ? null : transactionData.projectId
      };
      
      const updatedTransaction = await storage.updateTransaction(id, formattedData);
      
      if (updatedTransaction) {
        await storage.createActivityLog({
          action: "update",
          entityType: "transaction",
          entityId: id,
          details: `تحديث معاملة: ${updatedTransaction.description}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("خطأ في تحديث المعاملة:", error);
      return res.status(500).json({ message: "خطأ في تحديث المعاملة" });
    }
  });

  app.delete("/api/transactions/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // Only transaction creator or admin can delete
      if (transaction.createdBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذه المعاملة" });
      }
      
      const result = await storage.deleteTransaction(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "transaction",
          entityId: id,
          details: `حذف معاملة: ${transaction.description}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      return res.status(500).json({ message: "خطأ في حذف المعاملة" });
    }
  });

  // نقطة النهاية لإعادة رفع مرفق للمعاملة
  app.post("/api/transactions/:id/reupload-attachment", authenticate, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // التحقق من وجود المعاملة
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        // حذف الملف المؤقت إذا وجد
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // التحقق من صلاحيات المستخدم لتعديل المعاملة
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // فقط المدير أو المسؤول يمكنه إعادة رفع المرفقات
      if (userRole !== 'admin' && userRole !== 'manager') {
        // حذف الملف المؤقت إذا وجد
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: "ليس لديك صلاحية لإعادة رفع مرفقات المعاملات" });
      }
      
      // التأكد من وجود ملف للرفع
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تقديم ملف للرفع" });
      }
      
      // محاولة حذف الملف المرفق السابق إذا وجد
      if (transaction.fileUrl) {
        try {
          console.log(`محاولة حذف الملف السابق: ${transaction.fileUrl}`);
          // محاولة استخدام Firebase Storage للحذف
          try {
            await firebaseDelete(transaction.fileUrl);
            console.log("تم حذف الملف المرفق السابق بنجاح من Firebase Storage");
          } catch (firebaseError: unknown) {
            // إذا فشل، محاولة استخدام التخزين المحلي
            console.warn("فشل حذف الملف من Firebase Storage، محاولة الحذف من التخزين المحلي:", (firebaseError as Error).message);
            await localDelete(transaction.fileUrl);
            console.log("تم حذف الملف المرفق السابق بنجاح من التخزين المحلي");
          }
        } catch (fileError) {
          console.error("خطأ في حذف الملف المرفق السابق:", fileError);
          // استمر بعملية الرفع حتى لو فشل حذف الملف السابق
        }
      }
      
      // رفع الملف الجديد
      const storageFolder = `transactions/${id}`;
      let fileUrl;
      try {
        // محاولة استخدام Firebase أولاً
        fileUrl = await firebaseUpload(req.file.path, `${storageFolder}/${req.file.filename}`);
        console.log("تم رفع الملف المرفق الجديد بنجاح باستخدام Firebase Storage:", fileUrl);
      } catch (firebaseError: unknown) {
        // إذا فشل، استخدم التخزين المحلي كخطة بديلة
        console.warn("فشل استخدام Firebase Storage لرفع المرفق الجديد، الرجوع إلى التخزين المحلي:", (firebaseError as Error).message);
        fileUrl = await localUpload(req.file.path, `${storageFolder}/${req.file.filename}`);
        console.log("تم رفع الملف المرفق الجديد بنجاح باستخدام التخزين المحلي:", fileUrl);
      }
      
      // تحديث المعاملة بعنوان URL للملف المرفق الجديد
      const updatedTransaction = await storage.updateTransaction(id, { 
        fileUrl,
        fileType: req.file.mimetype
      });
      
      // حذف الملف المؤقت
      fs.unlinkSync(req.file.path);
      
      // تسجيل نشاط إعادة رفع المرفق
      await storage.createActivityLog({
        action: "update",
        entityType: "transaction",
        entityId: id,
        details: `إعادة رفع مرفق للمعاملة: ${transaction.description}`,
        userId: userId
      });
      
      return res.status(200).json({
        message: "تم إعادة رفع مرفق المعاملة بنجاح",
        transaction: updatedTransaction
      });
      
    } catch (error) {
      console.error("خطأ في إعادة رفع مرفق المعاملة:", error);
      
      // حذف الملف المؤقت في حالة حدوث خطأ
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("خطأ في حذف الملف المؤقت:", unlinkError);
        }
      }
      
      return res.status(500).json({ message: "حدث خطأ أثناء إعادة رفع مرفق المعاملة" });
    }
  });

  // Archive routes - جلب المعاملات المالية المؤرشفة (أكثر من 30 يوم)
  app.get("/api/archive", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // تحديد تاريخ قبل 30 يوم من الآن
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // جلب جميع المعاملات المالية
      let transactions = await storage.listTransactions();
      
      // فلترة المعاملات التي مضى عليها أكثر من 30 يوم
      const archivedTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < thirtyDaysAgo;
      });
      
      // فلترة حسب صلاحيات المستخدم
      let filteredTransactions = archivedTransactions;
      
      if (userRole !== 'admin') {
        // للمستخدمين غير المديرين، عرض المعاملات الخاصة بمشاريعهم فقط
        const userProjects = await storage.getUserProjects(userId);
        const userProjectIds = userProjects.map(p => p.id);
        
        filteredTransactions = archivedTransactions.filter(transaction => 
          transaction.projectId && userProjectIds.includes(transaction.projectId)
        );
      }
      
      return res.status(200).json(filteredTransactions);
    } catch (error) {
      console.error("خطأ في جلب المعاملات المؤرشفة:", error);
      return res.status(500).json({ message: "خطأ في جلب المعاملات المؤرشفة" });
    }
  });

  // Documents routes
  app.get("/api/documents", authenticate, async (req: Request, res: Response) => {
    try {
      let documents = await storage.listDocuments();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // فلترة المستندات بناءً على معيار isManagerDocument
      const isManagerDocument = req.query.isManagerDocument === 'true';
      
      // فلترة المستندات الإدارية أو العادية
      documents = documents.filter(d => !!d.isManagerDocument === isManagerDocument);
      
      // المدير يمكنه رؤية جميع المستندات، المستخدم العادي يرى فقط مستنداته والمستندات المرتبطة بالمشاريع التي لديه وصول إليها
      if (userRole !== "admin" && userRole !== "manager") {
        // إذا كانت المستندات الإدارية والمستخدم ليس مديرًا، فلا يمكنه رؤيتها
        if (isManagerDocument) {
          return res.status(403).json({ message: "غير مصرح لك بالوصول إلى المستندات الإدارية" });
        }
        
        // احصل على قائمة المشاريع المسموح للمستخدم بالوصول إليها
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        // فلترة المستندات بحيث تظهر فقط:
        // 1. المستندات التي قام المستخدم بتحميلها
        // 2. المستندات المرتبطة بالمشاريع التي يملك وصولاً إليها
        // 3. المستندات العامة التي ليست مرتبطة بأي مشروع
        documents = documents.filter(d => 
          d.uploadedBy === userId || 
          (d.projectId && projectIds.includes(d.projectId)) ||
          (!d.projectId) // المستندات العامة غير المرتبطة بمشروع
        );
      }
      
      // Filter by project if specified
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      if (projectId) {
        // إذا كان المستخدم غير مدير، تحقق من وصوله للمشروع
        if (userRole !== "admin" && userRole !== "manager") {
          const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
          if (!hasAccess) {
            return res.status(403).json({ message: "غير مصرح لك بالوصول إلى مستندات هذا المشروع" });
          }
        }
        documents = documents.filter(d => d.projectId === projectId);
      }
      
      return res.status(200).json(documents);
    } catch (error) {
      console.error("خطأ في استرجاع المستندات:", error);
      return res.status(500).json({ message: "خطأ في استرجاع المستندات" });
    }
  });

  // تم نقل إعداد multer إلى بداية الملف

  // مسار تحميل المستندات مع FormData
  app.post("/api/upload-document", authenticate, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم تقديم ملف للتحميل" });
      }

      const { name, description, projectId, isManagerDocument } = req.body;
      const file = req.file;
      const userId = req.session.userId as number;
      
      // التحقق من صلاحية المستخدم للمستندات الإدارية
      const userRole = req.session.role as string;
      if (isManagerDocument === 'true' && userRole !== "admin" && userRole !== "manager") {
        // حذف الملف المؤقت
        fs.unlinkSync(file.path);
        return res.status(403).json({ 
          message: "غير مصرح لك بإنشاء مستندات إدارية" 
        });
      }
      
      // التحقق من صلاحية المستخدم للوصول للمشروع إذا تم تحديده
      if (projectId && projectId !== "all") {
        const projectIdNumber = Number(projectId);
        if (userRole !== "admin" && userRole !== "manager") {
          const hasAccess = await storage.checkUserProjectAccess(userId, projectIdNumber);
          if (!hasAccess) {
            // حذف الملف المؤقت
            fs.unlinkSync(file.path);
            return res.status(403).json({ 
              message: "ليس لديك صلاحية للوصول إلى هذا المشروع" 
            });
          }
        }
      }
      
      // تهيئة البيانات للمستند
      const documentData = {
        name: name,
        description: description || "",
        projectId: projectId && projectId !== "all" ? Number(projectId) : undefined,
        fileUrl: file.path, // سيتم تحديثه بعد رفع الملف إلى Firebase
        fileType: file.mimetype,
        uploadDate: new Date(),
        uploadedBy: userId,
        isManagerDocument: isManagerDocument === 'true'
      };
      
      try {
        // محاولة تحميل الملف إلى Firebase Storage
        const storageFolder = `documents/${userId}`;
        let fileUrl;
        try {
          // محاولة استخدام Firebase أولاً
          fileUrl = await firebaseUpload(file.path, `${storageFolder}/${file.filename}`);
          console.log("تم رفع الملف بنجاح باستخدام Firebase Storage:", fileUrl);
        } catch (firebaseError: unknown) {
          // إذا فشل، استخدم التخزين المحلي كخطة بديلة
          console.warn("فشل استخدام Firebase Storage، الرجوع إلى التخزين المحلي:", (firebaseError as Error).message);
          fileUrl = await localUpload(file.path, `${storageFolder}/${file.filename}`);
          console.log("تم رفع الملف بنجاح باستخدام التخزين المحلي:", fileUrl);
        }
        
        // تحديث مسار الملف بعنوان URL من Firebase
        documentData.fileUrl = fileUrl;
        
        // إضافة المستند إلى قاعدة البيانات
        const document = await storage.createDocument(documentData as any);
        
        // حذف الملف المؤقت بعد الرفع الناجح
        fs.unlinkSync(file.path);
        
        // تسجيل نشاط إضافة المستند
        await storage.createActivityLog({
          action: "create",
          entityType: "document",
          entityId: document.id,
          details: `إضافة مستند جديد: ${document.name}`,
          userId: userId
        });
        
        return res.status(201).json(document);
      } catch (error) {
        // حذف الملف المؤقت في حالة حدوث خطأ
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        console.error("خطأ في رفع الملف:", error);
        return res.status(500).json({ message: "حدث خطأ أثناء معالجة الملف" });
      }
    } catch (error) {
      console.error("خطأ عام في رفع المستند:", error);
      return res.status(500).json({ message: "خطأ في رفع المستند" });
    }
  });

  app.post("/api/documents", authenticate, async (req: Request, res: Response) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      documentData.uploadedBy = req.session.userId as number;
      documentData.uploadDate = new Date();
      
      // التحقق من صلاحية المستخدم للمستندات الإدارية
      const userRole = req.session.role as string;
      if (documentData.isManagerDocument === true && userRole !== "admin" && userRole !== "manager") {
        return res.status(403).json({ 
          message: "غير مصرح لك بإنشاء مستندات إدارية" 
        });
      }
      
      // التحقق من صلاحية المستخدم للوصول للمشروع إذا تم تحديده
      if (documentData.projectId) {
        const projectId = Number(documentData.projectId);
        if (userRole !== "admin" && userRole !== "manager") {
          const hasAccess = await storage.checkUserProjectAccess(documentData.uploadedBy, projectId);
          if (!hasAccess) {
            return res.status(403).json({ 
              message: "غير مصرح لك بإضافة مستندات لهذا المشروع" 
            });
          }
        }
      }
      
      const document = await storage.createDocument(documentData);
      
      await storage.createActivityLog({
        action: "create",
        entityType: "document",
        entityId: document.id,
        details: `إضافة مستند جديد: ${document.name}${document.isManagerDocument ? " (إداري)" : ""}`,
        userId: req.session.userId as number
      });
      
      return res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "خطأ في إنشاء المستند" });
    }
  });

  app.delete("/api/documents/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "المستند غير موجود" });
      }
      
      // Only document uploader or admin can delete
      if (document.uploadedBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذا المستند" });
      }
      
      // حذف الملف المرتبط أولاً إذا كان موجودًا
      if (document.fileUrl) {
        try {
          console.log(`بدء عملية حذف الملف المرتبط بالمستند من Firebase Storage: ${document.fileUrl}`);
          // محاولة استخدام Firebase Storage أولاً للحذف
          try {
            await firebaseDelete(document.fileUrl);
            console.log("تم حذف الملف بنجاح من Firebase Storage");
          } catch (firebaseError: unknown) {
            // إذا فشل، نحاول استخدام التخزين المحلي
            console.warn("فشل حذف الملف من Firebase Storage، محاولة الحذف من التخزين المحلي:", (firebaseError as Error).message);
            await localDelete(document.fileUrl);
            console.log("تم حذف الملف بنجاح من التخزين المحلي");
          }
        } catch (fileError) {
          console.error(`خطأ في حذف الملف المرتبط بالمستند: ${fileError}`);
          // نستمر حتى لو فشل حذف الملف
        }
      }
      
      // حذف المستند من قاعدة البيانات
      const result = await storage.deleteDocument(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "document",
          entityId: id,
          details: `حذف مستند: ${document.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error("خطأ في حذف المستند:", error);
      return res.status(500).json({ message: "خطأ في حذف المستند" });
    }
  });

  // Activity Logs routes - للمدير فقط
  app.get("/api/activity-logs", authenticate, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم - فقط المدير يمكنه الوصول إلى سجلات النشاط
      if (req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى سجلات النشاط" });
      }
      
      let logs = await storage.listActivityLogs();
      
      // Filter by user if specified
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      if (userId) {
        logs = logs.filter(log => log.userId === userId);
      }
      
      // Filter by entity type if specified
      const entityType = req.query.entityType as string | undefined;
      if (entityType) {
        logs = logs.filter(log => log.entityType === entityType);
      }
      
      // Sort by timestamp desc
      logs.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      return res.status(200).json(logs);
    } catch (error) {
      console.error("خطأ في استرجاع سجلات النشاط:", error);
      return res.status(500).json({ message: "خطأ في استرجاع سجلات النشاط" });
    }
  });

  // User Projects routes
  app.get("/api/users/:userId/projects", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // التحقق من وجود المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // التحقق من الصلاحيات - يمكن للمستخدم الوصول إلى مشاريعه فقط، بينما يمكن للمدير الوصول إلى مشاريع أي مستخدم
      if (req.session.userId !== userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بالوصول إلى مشاريع هذا المستخدم" });
      }
      
      const projects = await storage.getUserProjects(userId);
      return res.status(200).json(projects);
    } catch (error) {
      console.error("خطأ في استرجاع مشاريع المستخدم:", error);
      return res.status(500).json({ message: "خطأ في استرجاع مشاريع المستخدم" });
    }
  });
  
  // روت جديد للحصول على مشاريع المستخدم الحالي (من الجلسة)
  app.get("/api/user-projects", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      
      // لوجات تشخيصية
      console.log(`جلب مشاريع المستخدم الحالي، معرف المستخدم: ${userId}`);
      
      // الحصول على مشاريع المستخدم
      let projects = [];
      try {
        projects = await storage.getUserProjects(userId);
        console.log(`تم العثور على ${projects.length} مشروع للمستخدم رقم ${userId}`);
      } catch (dbError) {
        console.error("خطأ في قاعدة البيانات أثناء جلب مشاريع المستخدم:", dbError);
        
        // إذا لم نجد أي مشاريع، نعيد مصفوفة فارغة بدلاً من خطأ
        return res.status(200).json([]);
      }
      
      // إعادة المشاريع
      return res.status(200).json(projects);
    } catch (error) {
      console.error("خطأ في جلب مشاريع المستخدم الحالي:", error);
      
      // حتى في حالة حدوث خطأ، نعيد مصفوفة فارغة بدلاً من رمز حالة خطأ
      // لتجنب المشاكل في واجهة المستخدم
      return res.status(200).json([]);
    }
  });

  app.get("/api/projects/:projectId/users", authenticate, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // التحقق من وجود المشروع
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // التحقق إذا كان المستخدم الحالي لديه حق الوصول إلى هذا المشروع
      if (req.session.role !== "admin") {
        const hasAccess = await storage.checkUserProjectAccess(req.session.userId as number, projectId);
        if (!hasAccess) {
          return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذا المشروع" });
        }
      }
      
      const users = await storage.getProjectUsers(projectId);
      return res.status(200).json(users);
    } catch (error) {
      console.error("خطأ في استرجاع مستخدمي المشروع:", error);
      return res.status(500).json({ message: "خطأ في استرجاع مستخدمي المشروع" });
    }
  });

  app.post("/api/user-projects", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { userId, projectId } = req.body;
      
      if (!userId || !projectId) {
        return res.status(400).json({ message: "معرف المستخدم ومعرف المشروع مطلوبان" });
      }
      
      // التحقق من وجود المستخدم والمشروع
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // التحقق إذا كان المستخدم مخصص بالفعل لهذا المشروع
      const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
      if (hasAccess) {
        return res.status(400).json({ message: "المستخدم مخصص بالفعل لهذا المشروع" });
      }
      
      const userProject = await storage.assignUserToProject({
        userId,
        projectId,
        assignedBy: req.session.userId as number
      });
      
      await storage.createActivityLog({
        action: "create",
        entityType: "user_project",
        entityId: userProject.id,
        details: `تخصيص المستخدم ${user.name} للمشروع ${project.name}`,
        userId: req.session.userId as number
      });
      
      return res.status(201).json(userProject);
    } catch (error) {
      console.error("خطأ في تخصيص المشروع للمستخدم:", error);
      return res.status(500).json({ message: "خطأ في تخصيص المشروع للمستخدم" });
    }
  });

  app.delete("/api/user-projects", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { userId, projectId } = req.body;
      
      if (!userId || !projectId) {
        return res.status(400).json({ message: "معرف المستخدم ومعرف المشروع مطلوبان" });
      }
      
      // التحقق من وجود المستخدم والمشروع
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // التحقق إذا كان المستخدم مخصص لهذا المشروع
      const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
      if (!hasAccess) {
        return res.status(400).json({ message: "المستخدم غير مخصص لهذا المشروع" });
      }
      
      const result = await storage.removeUserFromProject(userId, projectId);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "user_project",
          entityId: 0, // لا نملك معرف محدد هنا
          details: `إلغاء تخصيص المستخدم ${user.name} من المشروع ${project.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error("خطأ في إلغاء تخصيص المشروع للمستخدم:", error);
      return res.status(500).json({ message: "خطأ في إلغاء تخصيص المشروع للمستخدم" });
    }
  });

  // Settings routes
  app.get("/api/settings", authenticate, async (req: Request, res: Response) => {
    try {
      const settings = await storage.listSettings();
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في استرجاع الإعدادات" });
    }
  });

  app.put("/api/settings/:key", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "قيمة الإعداد مطلوبة" });
      }
      
      const updatedSetting = await storage.updateSetting(key, value);
      
      if (!updatedSetting) {
        return res.status(404).json({ message: "الإعداد غير موجود" });
      }
      
      await storage.createActivityLog({
        action: "update",
        entityType: "setting",
        entityId: updatedSetting.id,
        details: `تحديث إعداد: ${updatedSetting.key}`,
        userId: req.session.userId as number
      });
      
      return res.status(200).json(updatedSetting);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في تحديث الإعداد" });
    }
  });

  // استرجاع رصيد صندوق المدير
  app.get("/api/admin-fund", authenticate, async (req: Request, res: Response) => {
    try {
      // استرجاع صندوق المدير الرئيسي (معرف=1)
      const adminFundsResult = await db.select().from(funds)
        .where(
          and(
            eq(funds.type, 'admin'),
            eq(funds.ownerId, 1)
          )
        );
        
      const adminFund = adminFundsResult.length > 0 ? adminFundsResult[0] : null;
      
      if (!adminFund) {
        return res.status(200).json({ balance: 0 });
      }
      
      return res.status(200).json({ balance: adminFund.balance });
    } catch (error) {
      console.error("خطأ في استرجاع رصيد صندوق المدير:", error);
      return res.status(500).json({ message: "خطأ في استرجاع رصيد صندوق المدير" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard", authenticate, async (req: Request, res: Response) => {
    try {
      let transactions = await storage.listTransactions();
      let projects = await storage.listProjects();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // استرجاع رصيد صندوق المدير الرئيسي
      let adminFundBalance = 0;
      if (userRole === "admin") {
        const adminFundsResult = await db.select().from(funds)
          .where(
            and(
              eq(funds.type, 'admin'),
              eq(funds.ownerId, 1)
            )
          );
          
        const adminFund = adminFundsResult.length > 0 ? adminFundsResult[0] : null;
        if (adminFund) {
          adminFundBalance = adminFund.balance;
        }
      }

      // استرجاع أرصدة المشاريع
      const projectFunds = await db.select().from(funds)
        .where(eq(funds.type, 'project'));
      
      // إنشاء خريطة تربط المشاريع بأرصدتها
      const projectFundsMap = new Map();
      for (const fund of projectFunds) {
        if (fund.projectId) {
          projectFundsMap.set(fund.projectId, fund.balance);
        }
      }
      
      // تطبيق قيود الوصول للمستخدمين العاديين
      if (userRole !== "admin") {
        // احصل على قائمة المشاريع المسموح للمستخدم بالوصول إليها
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        // فلترة المعاملات بحيث تظهر فقط المعاملات الخاصة بالمشاريع التي يملك المستخدم وصولاً إليها
        // استبعاد معاملات الصندوق الرئيسي (التي لا تحتوي على projectId)
        transactions = transactions.filter(t => 
          t.projectId && projectIds.includes(t.projectId)
        );
        
        // فلترة المشاريع بحيث تظهر فقط المشاريع التي يملك المستخدم وصولاً إليها
        projects = userProjects;
      }
      
      // إضافة معلومات الرصيد للمشاريع
      const projectsWithBalance = projects.map(project => {
        return {
          ...project,
          balance: projectFundsMap.get(project.id) || 0
        };
      });
      
      // تقسيم المعاملات إلى مجموعات للصندوق الرئيسي والمشاريع
      const adminTransactions = transactions.filter(t => t.projectId === null || t.projectId === undefined);
      const projectTransactions = transactions.filter(t => t.projectId !== null && t.projectId !== undefined);
      
      // حساب إجماليات الصندوق الرئيسي
      const adminTotalIncome = adminTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const adminTotalExpenses = adminTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const adminNetProfit = adminTotalIncome - adminTotalExpenses;
      
      // حساب إجماليات المشاريع
      const projectTotalIncome = projectTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const projectTotalExpenses = projectTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const projectNetProfit = projectTotalIncome - projectTotalExpenses;
      
      // الإجماليات الكلية (تستخدم للتوافق القديم إذا لزم الأمر)
      const totalIncome = adminTotalIncome + projectTotalIncome;
      const totalExpenses = adminTotalExpenses + projectTotalExpenses;
      const netProfit = totalIncome - totalExpenses;
      
      // Get recent transactions
      const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      // حساب عدد المشاريع النشطة
      const activeProjects = projects.filter(p => p.status === "active").length;
      
      return res.status(200).json({
        // البيانات الإجمالية للتوافق القديم
        totalIncome,  
        totalExpenses,
        netProfit,
        
        // بيانات الصندوق الرئيسي
        adminTotalIncome,
        adminTotalExpenses,
        adminNetProfit,
        adminFundBalance,
        
        // بيانات المشاريع
        projectTotalIncome,
        projectTotalExpenses,
        projectNetProfit,
        
        // البيانات الأخرى
        activeProjects,
        recentTransactions,
        projects: projectsWithBalance
      });
    } catch (error) {
      console.error("خطأ في استرجاع إحصائيات لوحة التحكم:", error);
      return res.status(500).json({ message: "خطأ في استرجاع إحصائيات لوحة التحكم" });
    }
  });

  // Archive endpoint - المعاملات المؤرشفة (أقدم من 30 يوماً)
  app.get("/api/archive", authenticate, async (req: Request, res: Response) => {
    try {
      let transactions = await storage.listTransactions();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // تحديد التاريخ الحد الفاصل (30 يوماً من اليوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // فلترة المعاملات لتشمل فقط التي هي أقدم من 30 يوماً
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate < thirtyDaysAgo;
      });
      
      // تطبيق قيود الوصول للمستخدمين العاديين (نفس منطق /api/transactions)
      if (userRole !== "admin") {
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        transactions = transactions.filter(t => 
          t.projectId && projectIds.includes(t.projectId)
        );
      }
      
      // فلترة حسب المشروع إذا تم تحديده
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      if (projectId) {
        if (userRole !== "admin") {
          const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
          if (!hasAccess) {
            return res.status(403).json({ message: "غير مصرح لك بالوصول إلى هذا المشروع" });
          }
        }
        transactions = transactions.filter(t => t.projectId === projectId);
      }
      
      // فلترة حسب النوع إذا تم تحديده
      const type = req.query.type as string | undefined;
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      // إخفاء معلومات المرفقات للمستخدمين غير المصرح لهم
      if (userRole !== "admin") {
        transactions = transactions.map(transaction => {
          // إذا كان المستخدم ليس منشئ المعاملة، أخف معلومات المرفق
          if (transaction.createdBy !== userId) {
            return {
              ...transaction,
              fileUrl: null,
              fileType: null
            };
          }
          return transaction;
        });
      }
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("خطأ في استرجاع المعاملات المؤرشفة:", error);
      return res.status(500).json({ message: "خطأ في استرجاع المعاملات المؤرشفة" });
    }
  });

  // Manual archive endpoint - أرشفة المعاملات يدوياً
  app.post("/api/transactions/archive", authenticate, async (req: Request, res: Response) => {
    try {
      const { transactionIds } = req.body;
      
      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({ message: "يجب تحديد معاملات للأرشفة" });
      }
      
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // التحقق من صلاحية المستخدم لأرشفة المعاملات
      for (const transactionId of transactionIds) {
        const transaction = await storage.getTransaction(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: `المعاملة رقم ${transactionId} غير موجودة` });
        }
        
        // التحقق من الصلاحيات
        if (userRole !== "admin" && transaction.createdBy !== userId) {
          return res.status(403).json({ message: "غير مصرح لك بأرشفة هذه المعاملة" });
        }
      }
      
      // أرشفة المعاملات (تحديث حقل archived إلى true)
      const archivedTransactions = [];
      for (const transactionId of transactionIds) {
        const updatedTransaction = await storage.updateTransaction(transactionId, { archived: true });
        if (updatedTransaction) {
          archivedTransactions.push(updatedTransaction);
          
          // إضافة سجل نشاط
          await storage.createActivityLog({
            action: "archive",
            entityType: "transaction",
            entityId: transactionId,
            details: `أرشفة المعاملة: ${updatedTransaction.description}`,
            userId: userId
          });
        }
      }
      
      return res.status(200).json({ 
        message: `تم أرشفة ${archivedTransactions.length} معاملة بنجاح`,
        archivedTransactions 
      });
    } catch (error) {
      console.error("خطأ في أرشفة المعاملات:", error);
      return res.status(500).json({ message: "خطأ في أرشفة المعاملات" });
    }
  });

  // إنشاء نسخة احتياطية شاملة
  app.get("/api/backup/download", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      // جمع جميع البيانات من قاعدة البيانات
      const [users, projects, transactions, documents, activityLogs, settings, funds] = await Promise.all([
        storage.listUsers(),
        storage.listProjects(),
        storage.listTransactions(),
        storage.listDocuments(),
        storage.listActivityLogs(),
        storage.listSettings(),
        storage.listFunds(),
      ]);

      // جمع بيانات الملفات والمستندات
      const fs = await import('fs');
      const path = await import('path');
      
      let filesData = {};
      
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const readDirRecursively = (dir: string, baseDir = dir): any => {
            const items = fs.readdirSync(dir);
            const result: any = {};
            
            for (const item of items) {
              const itemPath = path.join(dir, item);
              const stat = fs.statSync(itemPath);
              
              if (stat.isDirectory()) {
                result[item] = readDirRecursively(itemPath, baseDir);
              } else {
                // قراءة الملف وتحويله إلى base64
                const fileContent = fs.readFileSync(itemPath);
                const relativePath = path.relative(baseDir, itemPath);
                result[item] = {
                  type: 'file',
                  content: fileContent.toString('base64'),
                  size: stat.size,
                  relativePath: relativePath.replace(/\\/g, '/')
                };
              }
            }
            return result;
          };
          
          filesData = readDirRecursively(uploadsDir);
        }
      } catch (fileError) {
        console.warn('Warning: Could not read files directory:', fileError);
        filesData = { error: 'Could not read files directory' };
      }

      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          database: {
            users,
            projects,
            transactions,
            documents,
            activityLogs,
            settings,
            funds
          },
          files: filesData
        },
        metadata: {
          totalTransactions: transactions.length,
          totalDocuments: documents.length,
          totalUsers: users.length,
          totalProjects: projects.length,
          hasFiles: Object.keys(filesData).length > 0
        }
      };

      // تسجيل نشاط إنشاء النسخة الاحتياطية
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: "backup_download",
        entityType: "system",
        entityId: 0,
        details: `تم إنشاء نسخة احتياطية شاملة تتضمن ${transactions.length} معاملة و ${documents.length} مستند`
      });

      // تعيين headers للتنزيل
      const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
      
      res.json(backup);
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ message: "خطأ في إنشاء النسخة الاحتياطية" });
    }
  });

  // استعادة نسخة احتياطية
  app.post("/api/backup/restore", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const backupData = req.body;
      
      if (!backupData || !backupData.data) {
        return res.status(400).json({ message: "بيانات النسخة الاحتياطية غير صحيحة" });
      }

      // التحقق من إصدار النسخة الاحتياطية
      const isNewFormat = backupData.data.database && backupData.data.files;
      let databaseData, filesData;
      
      if (isNewFormat) {
        databaseData = backupData.data.database;
        filesData = backupData.data.files;
      } else {
        // النسخة القديمة - البيانات مباشرة في data
        databaseData = backupData.data;
        filesData = null;
      }

      const { users, projects, transactions, documents, activityLogs, settings, funds } = databaseData;

      // استعادة الإعدادات
      if (settings && Array.isArray(settings)) {
        for (const setting of settings) {
          await storage.updateSetting(setting.key, setting.value);
        }
      }

      // استعادة الملفات إذا كانت موجودة
      let filesRestored = 0;
      if (filesData && typeof filesData === 'object' && !filesData.error) {
        const fs = await import('fs');
        const path = await import('path');
        
        try {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          
          // إنشاء مجلد uploads إذا لم يكن موجوداً
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const restoreFilesRecursively = (filesObj: any, basePath: string) => {
            for (const [name, data] of Object.entries(filesObj)) {
              if (typeof data === 'object' && data !== null) {
                if ((data as any).type === 'file') {
                  // استعادة الملف
                  const fileData = data as any;
                  const fullPath = path.join(basePath, name);
                  
                  // إنشاء المجلد إذا لم يكن موجوداً
                  const dir = path.dirname(fullPath);
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                  }
                  
                  // كتابة الملف
                  const buffer = Buffer.from(fileData.content, 'base64');
                  fs.writeFileSync(fullPath, buffer);
                  filesRestored++;
                } else {
                  // مجلد - استدعاء تكراري
                  const subDir = path.join(basePath, name);
                  if (!fs.existsSync(subDir)) {
                    fs.mkdirSync(subDir, { recursive: true });
                  }
                  restoreFilesRecursively(data, subDir);
                }
              }
            }
          };
          
          restoreFilesRecursively(filesData, uploadsDir);
        } catch (fileError) {
          console.warn('Warning: Could not restore files:', fileError);
        }
      }

      // تسجيل نشاط استعادة النسخة الاحتياطية
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: "backup_restore",
        entityType: "system",
        entityId: 0,
        details: `تم استعادة نسخة احتياطية من تاريخ ${backupData.timestamp}${filesRestored > 0 ? ` مع ${filesRestored} ملف` : ''}`
      });

      res.json({ 
        message: "تم استعادة النسخة الاحتياطية بنجاح",
        timestamp: backupData.timestamp,
        filesRestored: filesRestored,
        metadata: backupData.metadata || {}
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ message: "خطأ في استعادة النسخة الاحتياطية" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
