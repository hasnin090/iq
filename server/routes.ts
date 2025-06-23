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
  insertAccountCategorySchema,
  insertDeferredPaymentSchema,
  funds,
  employees,
  type Transaction
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { neon } from '@neondatabase/serverless';
import { backupSystem } from "./backup-system";
import { 
  initializeBackupDatabase, 
  checkDatabasesHealth, 
  switchDatabase, 
  syncDatabaseToBackup 
} from './backup-db-simple';
import {
  initializeSupabase,
  checkSupabaseHealth,
  syncToSupabase,
  copyFilesToSupabase,
  uploadToSupabase,
  deleteFromSupabase
} from './supabase-db';
import {
  initializeSupabaseSimple,
  checkSupabaseSimpleHealth,
  uploadToSupabaseSimple,
  deleteFromSupabaseSimple,
  copyFilesToSupabaseSimple
} from './supabase-simple';
import { diagnoseSupabaseConnection, getSuggestions } from './supabase-diagnostics';
import { 
  setupSupabaseAsMainDatabase, 
  migrateFilesToSupabase, 
  updateFileUrlsToSupabase, 
  checkSupabaseMigrationStatus 
} from './supabase-primary';
import {
  initializeFirebase,
  checkFirebaseHealth,
  uploadToFirebase,
  deleteFromFirebase
} from './firebase-storage';
import { storageManager } from './storage-manager';
import { fileMigration } from './file-migration';
import { databaseCleanup } from './database-cleanup';
import { simpleMigration } from './simple-migration';
import { eq, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
// استيراد وظائف التخزين المحلي
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
  
  // middleware للجلسة (تم إزالة التسجيل المفرط لتحسين الأداء)
  app.use((req, res, next) => {
    next();
  });

  // Authentication middleware with session timeout
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "غير مصرح" });
    }

    // تحديث آخر نشاط بدون فحص انتهاء الصلاحية
    req.session.lastActivity = new Date().toISOString();
    next();
  };

  // مسار لعرض الملفات المحفوظة محلياً مع دعم المجلدات الفرعية
  app.get("/uploads/*", (req: Request, res: Response) => {
    const filePath = req.params[0]; // الحصول على المسار الكامل
    const fullPath = path.join(__dirname, '../uploads', filePath);
    
    // التحقق من الأمان - منع الوصول خارج مجلد uploads
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const requestedPath = path.resolve(fullPath);
    
    if (!requestedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: "مسار غير مسموح" });
    }
    
    // التحقق من وجود الملف
    if (fs.existsSync(requestedPath)) {
      return res.sendFile(requestedPath);
    } else {
      return res.status(404).json({ message: "الملف غير موجود" });
    }
  });

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
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
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
      const employeeId = req.body.employeeId ? Number(req.body.employeeId) : undefined;
      
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

      // التحقق من صحة معاملة الراتب
      if (expenseType === "رواتب" && employeeId) {
        // التحقق من وجود الموظف
        const sql = neon(process.env.DATABASE_URL!);
        const employeeResult = await sql(`SELECT * FROM employees WHERE id = $1 AND active = true`, [employeeId]);
        
        if (employeeResult.length === 0) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ message: "الموظف غير موجود أو غير نشط" });
        }

        const employee = employeeResult[0];
        
        // التحقق من أن الموظف مخصص للمشروع المحدد
        if (projectId && employee.assigned_project_id !== projectId) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ message: "الموظف غير مخصص لهذا المشروع" });
        }

        // التحقق من أن المبلغ يتطابق مع راتب الموظف (مع هامش خطأ صغير)
        if (Math.abs(amount - employee.salary) > 0.01) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({ 
            message: `المبلغ المدخل (${amount}) لا يتطابق مع راتب الموظف (${employee.salary})` 
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
            result = await storage.processDeposit(userId, projectId, amount, description);
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

      // حفظ معرف الموظف إذا كانت معاملة راتب (حتى بدون ملف مرفق)
      if (expenseType === "رواتب" && employeeId) {
        await storage.updateTransaction(result.transaction.id, { employeeId });
        result.transaction.employeeId = employeeId;
      }
      
      // معالجة الملف المرفق - نظام محلي موثوق مع تحسين المسارات
      if (req.file) {
        try {
          // نسخ الملف إلى مجلد منظم
          const targetDir = path.join('./uploads/transactions', result.transaction.id.toString());
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          
          const finalFileName = `${Date.now()}_${req.file.filename}`;
          const finalPath = path.join(targetDir, finalFileName);
          
          // نسخ الملف
          fs.copyFileSync(req.file.path, finalPath);
          
          // حذف الملف المؤقت
          fs.unlinkSync(req.file.path);
          
          // بناء URL الملف
          const fileUrl = `/uploads/transactions/${result.transaction.id}/${finalFileName}`;
          
          // تحديث المعاملة بعنوان URL للملف المرفق
          const updateData: any = { 
            fileUrl,
            fileType: req.file.mimetype
          };
          
          // إضافة معرف الموظف إذا كانت معاملة راتب
          if (expenseType === "رواتب" && employeeId) {
            updateData.employeeId = employeeId;
          }
          
          await storage.updateTransaction(result.transaction.id, updateData);
          
          // تحديث كائن النتيجة بمعلومات الملف
          result.transaction.fileUrl = fileUrl;
          result.transaction.fileType = req.file.mimetype;
          
          console.log(`✅ تم حفظ الملف محلياً: ${fileUrl}`);
          
        } catch (fileError) {
          console.error("خطأ أثناء معالجة الملف المرفق:", fileError);
          // حذف الملف المؤقت في حالة الخطأ
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        }
      }

      // لا يتم تصنيف المعاملة تلقائياً - يجب على المستخدم تحديد نوع المصروف يدوياً
      // التصنيف يحدث فقط عند الذهاب لصفحة الإعدادات واختيار "تصنيف جميع المعاملات"
      
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
        // إذا تم تحديد نوع مصروف، أضف سجل إلى دفتر الأستاذ
        if (formattedData.expenseType && formattedData.expenseType !== 'مصروف عام') {
          try {
            // التحقق من عدم وجود سجل سابق لنفس المعاملة
            const existingEntries = await storage.listLedgerEntries();
            const existingEntry = existingEntries.find(entry => entry.transactionId === updatedTransaction.id);
            
            if (!existingEntry) {
              // البحث عن نوع المصروف أو إنشاؤه إذا لم يكن موجوداً
              let expenseType = await storage.getExpenseTypeByName(formattedData.expenseType);
              
              if (!expenseType) {
                // إنشاء نوع المصروف تلقائياً إذا لم يكن موجوداً
                expenseType = await storage.createExpenseType({
                  name: formattedData.expenseType,
                  description: `نوع مصروف تم إنشاؤه تلقائياً: ${formattedData.expenseType}`,
                  isActive: true
                });
                console.log(`تم إنشاء نوع مصروف جديد تلقائياً: ${formattedData.expenseType}`);
              }
              
              if (expenseType) {
                // إنشاء سجل في دفتر الأستاذ
                await storage.createLedgerEntry({
                  date: new Date(formattedData.date),
                  transactionId: updatedTransaction.id,
                  expenseTypeId: expenseType.id,
                  amount: updatedTransaction.amount,
                  description: updatedTransaction.description || '',
                  projectId: updatedTransaction.projectId,
                  entryType: 'classified'
                });
                
                console.log(`تم إنشاء سجل دفتر الأستاذ للمعاملة ${updatedTransaction.id} مع نوع المصروف ${expenseType.name}`);
              }
            } else {
              // إذا كان السجل موجوداً، تحديث نوع المصروف إذا تغير
              let expenseType = await storage.getExpenseTypeByName(formattedData.expenseType);
              
              if (!expenseType) {
                // إنشاء نوع المصروف تلقائياً إذا لم يكن موجوداً
                expenseType = await storage.createExpenseType({
                  name: formattedData.expenseType,
                  description: `نوع مصروف تم إنشاؤه تلقائياً: ${formattedData.expenseType}`,
                  isActive: true
                });
                console.log(`تم إنشاء نوع مصروف جديد تلقائياً: ${formattedData.expenseType}`);
              }
              
              if (expenseType && existingEntry.expenseTypeId !== expenseType.id) {
                // تحديث سجل دفتر الأستاذ بنوع المصروف الجديد
                await storage.updateLedgerEntry(existingEntry.id, {
                  expenseTypeId: expenseType.id,
                  amount: updatedTransaction.amount,
                  description: updatedTransaction.description || '',
                  date: new Date(formattedData.date)
                });
                console.log(`تم تحديث سجل دفتر الأستاذ للمعاملة ${updatedTransaction.id} بنوع المصروف ${expenseType.name}`);
              }
            }
          } catch (ledgerError) {
            console.error("خطأ في إنشاء/تحديث سجل دفتر الأستاذ:", ledgerError);
            // لا نرمي خطأ هنا لأن تحديث المعاملة نجح
          }
        }
        
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
          await storageManager.deleteFile(transaction.fileUrl);
          console.log("تم حذف الملف المرفق السابق بنجاح");
        } catch (fileError) {
          console.error("خطأ في حذف الملف المرفق السابق:", fileError);
          // استمر بعملية الرفع حتى لو فشل حذف الملف السابق
        }
      }
      
      // رفع الملف الجديد باستخدام نظام التخزين المتطور
      let fileUrl;
      try {
        const storageResult = await storageManager.uploadFile(
          req.file.path,
          `transactions/${id}/${req.file.filename}`,
          req.file.mimetype
        );
        
        if (storageResult.success && storageResult.url) {
          fileUrl = storageResult.url;
          console.log(`✅ تم رفع الملف الجديد بنجاح باستخدام ${storageResult.provider}: ${storageResult.url}`);
        } else {
          throw new Error(storageResult.error || 'فشل في رفع الملف');
        }
      } catch (uploadError) {
        console.error("خطأ في رفع الملف:", uploadError);
        return res.status(500).json({ message: "خطأ في رفع الملف" });
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
          fileUrl = await localUpload(file.path, `${storageFolder}/${file.filename}`);
          } catch (uploadError) {
          console.error("خطأ في رفع الملف:", uploadError);
          return res.status(500).json({ message: "خطأ في رفع الملف" });
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
            await localDelete(document.fileUrl);
            } catch (deleteError) {
            console.error("خطأ في حذف الملف:", deleteError);
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

  // APIs إدارة النسخ الاحتياطي الجديدة
  
  // إنشاء نسخة احتياطية يدوية
  app.post("/api/backup/create", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const backupPath = await backupSystem.createFullBackup();
      
      // تسجيل نشاط إنشاء النسخة الاحتياطية
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: "backup_create",
        entityType: "system",
        entityId: 0,
        details: "تم إنشاء نسخة احتياطية يدوية"
      });

      res.json({ 
        success: true, 
        message: "تم إنشاء النسخة الاحتياطية بنجاح",
        backupPath 
      });
    } catch (error) {
      console.error("خطأ في إنشاء النسخة الاحتياطية:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء إنشاء النسخة الاحتياطية" 
      });
    }
  });

  // قائمة النسخ الاحتياطية المتوفرة
  app.get("/api/backup/list", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const backups = await backupSystem.getAvailableBackups();
      res.json({ success: true, backups });
    } catch (error) {
      console.error("خطأ في جلب قائمة النسخ الاحتياطية:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء جلب قائمة النسخ الاحتياطية" 
      });
    }
  });

  // إنشاء نسخة احتياطية طارئة قبل عملية حساسة
  app.post("/api/backup/emergency", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { operation } = req.body;
      const backupPath = await backupSystem.createEmergencyBackup(operation || "عملية إدارية");
      
      // تسجيل نشاط إنشاء النسخة الاحتياطية الطارئة
      await storage.createActivityLog({
        userId: (req.session as any).userId,
        action: "backup_emergency",
        entityType: "system",
        entityId: 0,
        details: `تم إنشاء نسخة احتياطية طارئة: ${operation || "عملية إدارية"}`
      });

      res.json({ 
        success: true, 
        message: "تم إنشاء النسخة الاحتياطية الطارئة بنجاح",
        backupPath 
      });
    } catch (error) {
      console.error("خطأ في إنشاء النسخة الاحتياطية الطارئة:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء إنشاء النسخة الاحتياطية الطارئة" 
      });
    }
  });

  // ======== أنواع المصروفات ========
  
  // جلب جميع أنواع المصروفات
  app.get("/api/expense-types", authenticate, async (req: Request, res: Response) => {
    try {
      const expenseTypes = await storage.listExpenseTypes();
      return res.status(200).json(expenseTypes);
    } catch (error) {
      console.error("خطأ في جلب أنواع المصروفات:", error);
      return res.status(500).json({ message: "خطأ في جلب أنواع المصروفات" });
    }
  });

  // إنشاء نوع مصروف جديد
  app.post("/api/expense-types", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const expenseType = await storage.createExpenseType(req.body);
      
      await storage.createActivityLog({
        action: "create",
        entityType: "expense_type",
        entityId: expenseType.id,
        details: `إضافة نوع مصروف جديد: ${expenseType.name}`,
        userId: req.session.userId as number
      });
      
      return res.status(201).json(expenseType);
    } catch (error) {
      console.error("خطأ في إنشاء نوع المصروف:", error);
      return res.status(500).json({ message: "خطأ في إنشاء نوع المصروف" });
    }
  });

  // تحديث نوع مصروف
  app.put("/api/expense-types/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedExpenseType = await storage.updateExpenseType(id, req.body);
      
      if (updatedExpenseType) {
        await storage.createActivityLog({
          action: "update",
          entityType: "expense_type",
          entityId: id,
          details: `تحديث نوع مصروف: ${updatedExpenseType.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json(updatedExpenseType);
    } catch (error) {
      console.error("خطأ في تحديث نوع المصروف:", error);
      return res.status(500).json({ message: "خطأ في تحديث نوع المصروف" });
    }
  });

  // حذف نوع مصروف
  app.delete("/api/expense-types/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const expenseType = await storage.getExpenseType(id);
      
      if (!expenseType) {
        return res.status(404).json({ message: "نوع المصروف غير موجود" });
      }
      
      const result = await storage.deleteExpenseType(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "expense_type",
          entityId: id,
          details: `حذف نوع مصروف: ${expenseType.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error("خطأ في حذف نوع المصروف:", error);
      return res.status(500).json({ message: "خطأ في حذف نوع المصروف" });
    }
  });

  // ======== دفتر الأستاذ ========
  
  // جلب جميع مدخلات دفتر الأستاذ
  app.get("/api/ledger", authenticate, async (req: Request, res: Response) => {
    try {
      const entryType = req.query.type as string;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const expenseTypeId = req.query.expenseTypeId ? parseInt(req.query.expenseTypeId as string) : undefined;
      
      let ledgerEntries;
      
      if (entryType) {
        ledgerEntries = await storage.getLedgerEntriesByType(entryType);
      } else if (projectId) {
        ledgerEntries = await storage.getLedgerEntriesByProject(projectId);
      } else if (expenseTypeId) {
        ledgerEntries = await storage.getLedgerEntriesByExpenseType(expenseTypeId);
      } else {
        ledgerEntries = await storage.listLedgerEntries();
      }
      
      return res.status(200).json(ledgerEntries);
    } catch (error) {
      console.error("خطأ في جلب دفتر الأستاذ:", error);
      return res.status(500).json({ message: "خطأ في جلب دفتر الأستاذ" });
    }
  });

  // ترحيل المعاملات المصنفة تلقائياً إلى دفتر الأستاذ
  app.post("/api/ledger/migrate-classified", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log('بدء ترحيل المعاملات المصنفة إلى دفتر الأستاذ...');
      
      // جلب جميع المعاملات
      const allTransactions = await storage.listTransactions();
      
      // تصفية المعاملات التي لها نوع مصروف محدد
      const classifiedTransactions = allTransactions.filter(t => 
        t.expenseType && 
        t.expenseType !== 'مصروف عام' && 
        t.expenseType.trim() !== ''
      );
      
      // جلب السجلات الموجودة في دفتر الأستاذ لتجنب التكرار
      const existingEntries = await storage.listLedgerEntries();
      const existingTransactionIds = new Set(existingEntries.map(entry => entry.transactionId));
      
      let addedCount = 0;
      let skippedCount = 0;
      let notFoundCount = 0;
      const errors: string[] = [];
      
      for (const transaction of classifiedTransactions) {
        // تجاهل المعاملات الموجودة بالفعل في دفتر الأستاذ
        if (existingTransactionIds.has(transaction.id)) {
          skippedCount++;
          continue;
        }
        
        try {
          // البحث عن نوع المصروف
          const expenseTypeName = transaction.expenseType;
          if (!expenseTypeName) continue;
          
          const expenseType = await storage.getExpenseTypeByName(expenseTypeName);
          
          if (expenseType) {
            // إضافة سجل إلى دفتر الأستاذ
            await storage.createLedgerEntry({
              date: new Date(transaction.date),
              transactionId: transaction.id,
              expenseTypeId: expenseType.id,
              amount: transaction.amount,
              description: transaction.description || '',
              projectId: transaction.projectId,
              entryType: 'classified'
            });
            
            addedCount++;
            console.log(`تمت إضافة المعاملة ${transaction.id} إلى دفتر الأستاذ مع نوع المصروف: ${expenseType.name}`);
          } else {
            notFoundCount++;
            errors.push(`لم يتم العثور على نوع المصروف "${transaction.expenseType}" للمعاملة ${transaction.id}`);
          }
        } catch (error) {
          errors.push(`خطأ في معالجة المعاملة ${transaction.id}: ${error}`);
        }
      }
      
      return res.status(200).json({
        message: 'تم إنهاء عملية ترحيل المعاملات',
        summary: {
          totalClassified: classifiedTransactions.length,
          added: addedCount,
          skipped: skippedCount,
          notFound: notFoundCount,
          errors: errors.length
        },
        errors: errors
      });
      
    } catch (error) {
      console.error("خطأ في ترحيل المعاملات:", error);
      return res.status(500).json({ message: "خطأ في ترحيل المعاملات" });
    }
  });

  // تصنيف المعاملات يدوياً إلى دفتر الأستاذ
  app.post("/api/ledger/classify", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { transactionIds, forceAll } = req.body;
      
      if (!transactionIds || !Array.isArray(transactionIds)) {
        return res.status(400).json({ message: "معرفات المعاملات مطلوبة" });
      }
      
      let classifiedCount = 0;
      let skippedCount = 0;
      
      for (const transactionId of transactionIds) {
        try {
          const transaction = await storage.getTransaction(transactionId);
          if (!transaction) {
            skippedCount++;
            continue;
          }
          
          // تصنيف المعاملة مع إجبار إنشاء السجل إذا طُلب ذلك
          await storage.classifyExpenseTransaction(transaction, forceAll || false);
          classifiedCount++;
        } catch (error) {
          console.error(`خطأ في تصنيف المعاملة ${transactionId}:`, error);
          skippedCount++;
        }
      }
      
      await storage.createActivityLog({
        action: "update",
        entityType: "ledger",
        entityId: 0,
        details: `تصنيف يدوي لـ ${classifiedCount} معاملة إلى دفتر الأستاذ`,
        userId: req.session.userId as number
      });
      
      return res.status(200).json({
        message: `تم تصنيف ${classifiedCount} معاملة، تم تخطي ${skippedCount} معاملة`,
        classified: classifiedCount,
        skipped: skippedCount
      });
    } catch (error) {
      console.error("خطأ في التصنيف اليدوي:", error);
      return res.status(500).json({ message: "خطأ في التصنيف اليدوي" });
    }
  });

  // تقرير المصروفات المصنفة مقابل المتفرقات
  app.get("/api/ledger/summary", authenticate, async (req: Request, res: Response) => {
    try {
      const classifiedEntries = await storage.getLedgerEntriesByType('classified');
      const generalExpenseEntries = await storage.getLedgerEntriesByType('general_expense');
      
      const classifiedTotal = classifiedEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const generalExpenseTotal = generalExpenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      const summary = {
        classified: {
          total: classifiedTotal,
          count: classifiedEntries.length,
          entries: classifiedEntries
        },
        general_expense: {
          total: generalExpenseTotal,
          count: generalExpenseEntries.length,
          entries: generalExpenseEntries
        },
        grandTotal: classifiedTotal + generalExpenseTotal
      };
      
      return res.status(200).json(summary);
    } catch (error) {
      console.error("خطأ في جلب ملخص دفتر الأستاذ:", error);
      return res.status(500).json({ message: "خطأ في جلب ملخص دفتر الأستاذ" });
    }
  });

  // جلب الدفعات الآجلة مع تجميعها حسب المستفيد
  app.get("/api/ledger/deferred-payments", authenticate, async (req: Request, res: Response) => {
    try {
      // جلب نوع المصروف للدفعات الآجلة
      const deferredExpenseType = await storage.getExpenseTypeByName('دفعات آجلة');
      if (!deferredExpenseType) {
        return res.status(200).json([]);
      }

      // جلب السجلات المتعلقة بالدفعات الآجلة
      const deferredEntries = await storage.getLedgerEntriesByExpenseType(deferredExpenseType.id);
      
      // تجميع السجلات حسب المستفيد (استخراج اسم المستفيد من الوصف)
      const groupedEntries: { [key: string]: any[] } = {};
      
      deferredEntries.forEach(entry => {
        // استخراج اسم المستفيد من الوصف (دفعة مستحق: اسم المستفيد - قسط...)
        const match = entry.description.match(/دفعة مستحق: (.+?) - قسط/);
        const beneficiaryName = match ? match[1] : 'غير محدد';
        
        if (!groupedEntries[beneficiaryName]) {
          groupedEntries[beneficiaryName] = [];
        }
        groupedEntries[beneficiaryName].push(entry);
      });

      // تحويل إلى تنسيق مناسب للعرض
      const result = Object.keys(groupedEntries).map(beneficiaryName => ({
        beneficiaryName,
        totalAmount: groupedEntries[beneficiaryName].reduce((sum, entry) => sum + entry.amount, 0),
        paymentsCount: groupedEntries[beneficiaryName].length,
        entries: groupedEntries[beneficiaryName].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));

      return res.status(200).json(result);
    } catch (error) {
      console.error("خطأ في جلب الدفعات الآجلة:", error);
      return res.status(500).json({ message: "خطأ في جلب الدفعات الآجلة" });
    }
  });

  // جلب سجل الدفعات لمستحق معين
  app.get("/api/ledger/deferred-payments/:receivableId", authenticate, async (req: Request, res: Response) => {
    try {
      const receivableId = parseInt(req.params.receivableId);
      if (isNaN(receivableId)) {
        return res.status(400).json({ message: "معرف المستحق غير صحيح" });
      }

      // جلب المستحق أولاً للتأكد من وجوده
      const receivable = await storage.getDeferredPayment(receivableId);
      if (!receivable) {
        return res.status(404).json({ message: "المستحق غير موجود" });
      }

      // جلب نوع المصروف للدفعات الآجلة
      const deferredExpenseType = await storage.getExpenseTypeByName('دفعات آجلة');
      if (!deferredExpenseType) {
        return res.status(200).json([]);
      }

      // جلب جميع السجلات للدفعات الآجلة
      const allDeferredEntries = await storage.getLedgerEntriesByExpenseType(deferredExpenseType.id);
      
      // تصفية السجلات الخاصة بهذا المستحق بناءً على اسم المستفيد في الوصف
      const receivableEntries = allDeferredEntries.filter(entry => {
        const match = entry.description.match(/دفعة مستحق: (.+?) - قسط/);
        const beneficiaryName = match ? match[1] : '';
        return beneficiaryName === receivable.beneficiaryName;
      });

      // ترتيب السجلات حسب التاريخ (الأحدث أولاً)
      const sortedEntries = receivableEntries.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return res.status(200).json(sortedEntries);
    } catch (error) {
      console.error("خطأ في جلب سجل الدفعات:", error);
      return res.status(500).json({ message: "خطأ في جلب سجل الدفعات" });
    }
  });

  // ======== تصنيفات أنواع الحسابات ========
  
  // جلب جميع تصنيفات أنواع الحسابات
  app.get("/api/account-categories", authenticate, async (req: Request, res: Response) => {
    try {
      const categories = await storage.listAccountCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error("خطأ في جلب تصنيفات أنواع الحسابات:", error);
      return res.status(500).json({ message: "خطأ في جلب تصنيفات أنواع الحسابات" });
    }
  });

  // إنشاء تصنيف جديد لنوع الحساب
  app.post("/api/account-categories", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAccountCategorySchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });
      
      const category = await storage.createAccountCategory(validatedData);
      
      await storage.createActivityLog({
        action: "create",
        entityType: "account_category",
        entityId: category.id,
        details: `إنشاء تصنيف جديد: ${category.name}`,
        userId: req.session.userId as number
      });
      
      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      console.error("خطأ في إنشاء تصنيف نوع الحساب:", error);
      return res.status(500).json({ message: "خطأ في إنشاء تصنيف نوع الحساب" });
    }
  });

  // تحديث تصنيف نوع الحساب
  app.put("/api/account-categories/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description, active } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "اسم التصنيف مطلوب" });
      }
      
      const updatedCategory = await storage.updateAccountCategory(id, { name, description, active });
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "التصنيف غير موجود" });
      }
      
      await storage.createActivityLog({
        action: "update",
        entityType: "account_category",
        entityId: updatedCategory.id,
        details: `تحديث تصنيف: ${updatedCategory.name}`,
        userId: req.session.userId as number
      });
      
      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("خطأ في تحديث تصنيف نوع الحساب:", error);
      return res.status(500).json({ message: "خطأ في تحديث تصنيف نوع الحساب" });
    }
  });

  // حذف تصنيف نوع الحساب
  app.delete("/api/account-categories/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const category = await storage.getAccountCategory(id);
      if (!category) {
        return res.status(404).json({ message: "التصنيف غير موجود" });
      }
      
      const result = await storage.deleteAccountCategory(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "account_category",
          entityId: id,
          details: `حذف تصنيف: ${category.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error("خطأ في حذف تصنيف نوع الحساب:", error);
      return res.status(500).json({ message: "خطأ في حذف تصنيف نوع الحساب" });
    }
  });

  // Database status endpoint
  app.get("/api/database/status", async (req: Request, res: Response) => {
    try {
      // Test database connection by running a simple query
      const startTime = Date.now();
      const result = await storage.checkTableExists('users');
      const responseTime = Date.now() - startTime;
      
      res.json({
        connected: true,
        responseTime,
        timestamp: new Date().toISOString(),
        tablesAccessible: result
      });
    } catch (error) {
      console.error("Database connection error:", error);
      res.status(500).json({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // ======== الدفعات المؤجلة ========
  
  // جلب جميع الدفعات المؤجلة
  app.get("/api/deferred-payments", authenticate, async (req: Request, res: Response) => {
    try {
      const payments = await storage.listDeferredPayments();
      return res.status(200).json(payments);
    } catch (error) {
      console.error("خطأ في جلب الدفعات المؤجلة:", error);
      return res.status(500).json({ message: "خطأ في جلب الدفعات المؤجلة" });
    }
  });

  // إنشاء دفعة مؤجلة جديدة
  app.post("/api/deferred-payments", authenticate, async (req: Request, res: Response) => {
    try {
      const { dueDate, ...bodyData } = req.body;
      const requestData = {
        ...bodyData,
        userId: req.session.userId,
        remainingAmount: req.body.remainingAmount || req.body.totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null
      };
      
      const validatedData = insertDeferredPaymentSchema.parse(requestData);
      
      const payment = await storage.createDeferredPayment(validatedData);
      
      return res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
      }
      console.error("خطأ في إنشاء الدفعة المؤجلة:", error);
      return res.status(500).json({ message: "خطأ في إنشاء الدفعة المؤجلة" });
    }
  });

  // تسجيل دفعة جزئية
  app.post("/api/deferred-payments/:id/pay", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "مبلغ الدفعة مطلوب ويجب أن يكون أكبر من الصفر" });
      }
      
      const result = await storage.payDeferredPaymentInstallment(id, amount, req.session.userId as number);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error("خطأ في تسجيل الدفعة:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "خطأ في تسجيل الدفعة" });
    }
  });

  // جلب دفعة مؤجلة محددة
  app.get("/api/deferred-payments/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getDeferredPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "الدفعة المؤجلة غير موجودة" });
      }
      
      return res.status(200).json(payment);
    } catch (error) {
      console.error("خطأ في جلب الدفعة المؤجلة:", error);
      return res.status(500).json({ message: "خطأ في جلب الدفعة المؤجلة" });
    }
  });

  // تحديث دفعة مؤجلة
  app.put("/api/deferred-payments/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedPayment = await storage.updateDeferredPayment(id, req.body);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "الدفعة المؤجلة غير موجودة" });
      }
      
      await storage.createActivityLog({
        action: "update",
        entityType: "deferred_payment",
        entityId: id,
        details: `تحديث دفعة مؤجلة: ${updatedPayment.beneficiaryName}`,
        userId: req.session.userId as number
      });
      
      return res.status(200).json(updatedPayment);
    } catch (error) {
      console.error("خطأ في تحديث الدفعة المؤجلة:", error);
      return res.status(500).json({ message: "خطأ في تحديث الدفعة المؤجلة" });
    }
  });

  // حذف دفعة مؤجلة
  app.delete("/api/deferred-payments/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const payment = await storage.getDeferredPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "الدفعة المؤجلة غير موجودة" });
      }
      
      const result = await storage.deleteDeferredPayment(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "deferred_payment",
          entityId: id,
          details: `حذف دفعة مؤجلة: ${payment.beneficiaryName}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error("خطأ في حذف الدفعة المؤجلة:", error);
      return res.status(500).json({ message: "خطأ في حذف الدفعة المؤجلة" });
    }
  });

  const httpServer = createServer(app);
  // ======== إدارة قواعد البيانات الاحتياطية ========
  
  // فحص حالة قواعد البيانات
  app.get("/api/database/health", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const health = await checkDatabasesHealth();
      res.json({ 
        success: true, 
        health,
        message: `قاعدة البيانات النشطة: ${health.active === 'primary' ? 'الرئيسية' : health.active === 'backup' ? 'الاحتياطية' : 'لا توجد'}`
      });
    } catch (error) {
      console.error("خطأ في فحص حالة قواعد البيانات:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء فحص حالة قواعد البيانات" 
      });
    }
  });

  // تهيئة قاعدة البيانات الاحتياطية
  app.post("/api/database/init-backup", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await initializeBackupDatabase();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "database_backup_init",
          entityType: "system",
          entityId: 0,
          details: "تم تهيئة قاعدة البيانات الاحتياطية"
        });
        
        res.json({ 
          success: true, 
          message: "تم تهيئة قاعدة البيانات الاحتياطية بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في تهيئة قاعدة البيانات الاحتياطية" 
        });
      }
    } catch (error) {
      console.error("خطأ في تهيئة قاعدة البيانات الاحتياطية:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء تهيئة قاعدة البيانات الاحتياطية" 
      });
    }
  });

  // التبديل بين قواعد البيانات
  app.post("/api/database/switch", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { target } = req.body;
      
      if (!target || (target !== 'primary' && target !== 'backup')) {
        return res.status(400).json({ 
          success: false, 
          message: "يجب تحديد قاعدة البيانات المستهدفة (primary أو backup)" 
        });
      }
      
      const success = await switchDatabase(target);
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "database_switch",
          entityType: "system",
          entityId: 0,
          details: `تم التبديل إلى قاعدة البيانات ${target === 'primary' ? 'الرئيسية' : 'الاحتياطية'}`
        });
        
        res.json({ 
          success: true, 
          message: `تم التبديل إلى قاعدة البيانات ${target === 'primary' ? 'الرئيسية' : 'الاحتياطية'} بنجاح`,
          activeDatabase: target
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: `فشل في التبديل إلى قاعدة البيانات ${target}` 
        });
      }
    } catch (error) {
      console.error("خطأ في التبديل بين قواعد البيانات:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء التبديل بين قواعد البيانات" 
      });
    }
  });

  // مزامنة البيانات إلى قاعدة البيانات الاحتياطية
  app.post("/api/database/sync", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await syncDatabaseToBackup();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "database_sync",
          entityType: "system",
          entityId: 0,
          details: "تم مزامنة البيانات إلى قاعدة البيانات الاحتياطية"
        });
        
        res.json({ 
          success: true, 
          message: "تم مزامنة البيانات إلى قاعدة البيانات الاحتياطية بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في مزامنة البيانات" 
        });
      }
    } catch (error) {
      console.error("خطأ في مزامنة البيانات:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء مزامنة البيانات" 
      });
    }
  });

  // ======== إدارة Supabase ========
  
  // فحص حالة Supabase
  app.get("/api/supabase/health", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      // استخدام النظام المبسط فقط
      const health = await checkSupabaseSimpleHealth();
      res.json({ 
        success: true, 
        health,
        message: `Supabase متاح: عميل=${health.client}, قاعدة بيانات=${health.database}, تخزين=${health.storage}`
      });
    } catch (error) {
      console.error("خطأ في فحص حالة Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء فحص حالة Supabase" 
      });
    }
  });

  // تشخيص تفصيلي لـ Supabase
  app.get("/api/supabase/diagnose", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const diagnosis = await diagnoseSupabaseConnection();
      const suggestions = getSuggestions(diagnosis);
      
      res.json({
        success: true,
        diagnosis,
        suggestions,
        message: "تشخيص Supabase مكتمل"
      });
    } catch (error: any) {
      console.error("خطأ في تشخيص Supabase:", error);
      res.status(500).json({
        success: false,
        message: `خطأ في تشخيص Supabase: ${error.message}`
      });
    }
  });

  // إعداد Supabase كقاعدة البيانات الرئيسية
  app.post("/api/supabase/setup-as-main", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log('🔄 بدء إعداد Supabase كقاعدة البيانات الرئيسية...');
      
      await setupSupabaseAsMainDatabase();
      
      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "supabase_setup_main",
        entityType: "system",
        entityId: 0,
        details: "تم إعداد Supabase كقاعدة البيانات الرئيسية"
      });

      res.json({
        success: true,
        message: "تم إعداد Supabase كقاعدة البيانات الرئيسية بنجاح"
      });
    } catch (error: any) {
      console.error("خطأ في إعداد Supabase:", error);
      res.status(500).json({
        success: false,
        message: `خطأ في إعداد Supabase: ${error.message}`
      });
    }
  });

  // نقل الملفات إلى Supabase
  app.post("/api/supabase/migrate-files", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log('📁 بدء نقل الملفات إلى Supabase...');
      
      const results = await migrateFilesToSupabase();
      
      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "supabase_migrate_files",
        entityType: "system",
        entityId: 0,
        details: `تم نقل ${results.migratedCount} ملف إلى Supabase`
      });

      res.json({
        success: true,
        results,
        message: `تم نقل ${results.migratedCount} ملف بنجاح`
      });
    } catch (error: any) {
      console.error("خطأ في نقل الملفات:", error);
      res.status(500).json({
        success: false,
        message: `خطأ في نقل الملفات: ${error.message}`
      });
    }
  });

  // تحديث روابط الملفات
  app.post("/api/supabase/update-file-urls", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log('🔗 تحديث روابط الملفات...');
      
      await updateFileUrlsToSupabase();
      
      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "supabase_update_urls",
        entityType: "system",
        entityId: 0,
        details: "تم تحديث روابط الملفات إلى Supabase"
      });

      res.json({
        success: true,
        message: "تم تحديث روابط الملفات بنجاح"
      });
    } catch (error: any) {
      console.error("خطأ في تحديث الروابط:", error);
      res.status(500).json({
        success: false,
        message: `خطأ في تحديث الروابط: ${error.message}`
      });
    }
  });

  // فحص حالة النقل
  app.get("/api/supabase/migration-status", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = await checkSupabaseMigrationStatus();
      
      res.json({
        success: true,
        status,
        message: "تم فحص حالة النقل"
      });
    } catch (error: any) {
      console.error("خطأ في فحص حالة النقل:", error);
      res.status(500).json({
        success: false,
        message: `خطأ في فحص حالة النقل: ${error.message}`
      });
    }
  });

  // تهيئة Supabase
  app.post("/api/supabase/init", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      // استخدام النظام المبسط مباشرة لضمان النجاح
      const success = await initializeSupabaseSimple();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "supabase_init",
          entityType: "system",
          entityId: 0,
          details: "تم تهيئة Supabase بنجاح"
        });
        
        res.json({ 
          success: true, 
          message: "تم تهيئة Supabase بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في تهيئة Supabase - تحقق من مفاتيح API" 
        });
      }
    } catch (error) {
      console.error("خطأ في تهيئة Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء تهيئة Supabase" 
      });
    }
  });

  // مزامنة البيانات إلى Supabase
  app.post("/api/supabase/sync-data", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await syncToSupabase();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "supabase_sync",
          entityType: "system",
          entityId: 0,
          details: "تم مزامنة البيانات إلى Supabase"
        });
        
        res.json({ 
          success: true, 
          message: "تم مزامنة البيانات إلى Supabase بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في مزامنة البيانات" 
        });
      }
    } catch (error) {
      console.error("خطأ في مزامنة البيانات إلى Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء مزامنة البيانات" 
      });
    }
  });

  // نسخ الملفات إلى Supabase
  app.post("/api/supabase/migrate-files", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      // استخدام النظام المبسط أو العادي حسب الحالة
      let results = await Promise.race([
        copyFilesToSupabase(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 10000)
        )
      ]).catch(async () => {
        // في حالة timeout، استخدم النظام المبسط
        console.log('🔄 استخدام النظام المبسط لنسخ الملفات...');
        return await copyFilesToSupabaseSimple();
      });
      
      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "supabase_copy_files",
        entityType: "system",
        entityId: 0,
        details: `نسخ الملفات إلى Supabase - نجح: ${results.success}, فشل: ${results.failed}`
      });
      
      res.json({ 
        success: true, 
        message: `تم نسخ الملفات - نجح: ${results.success}, فشل: ${results.failed}`,
        results
      });
    } catch (error) {
      console.error("خطأ في نقل الملفات إلى Supabase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء نقل الملفات" 
      });
    }
  });

  // تحديث روابط الملفات لتشير إلى Supabase
  app.post("/api/supabase/update-file-urls", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await updateFileUrlsToSupabase();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "supabase_update_urls",
          entityType: "system",
          entityId: 0,
          details: "تم تحديث روابط الملفات لتشير إلى Supabase"
        });
        
        res.json({ 
          success: true, 
          message: "تم تحديث روابط الملفات بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في تحديث روابط الملفات" 
        });
      }
    } catch (error) {
      console.error("خطأ في تحديث روابط الملفات:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء تحديث روابط الملفات" 
      });
    }
  });

  // ======== إدارة Firebase ========
  
  // فحص حالة Firebase
  app.get("/api/firebase/health", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const health = await checkFirebaseHealth();
      res.json({ 
        success: true, 
        health,
        message: `Firebase متاح: مبدئي=${health.initialized}, مصادقة=${health.auth}, تخزين=${health.storage}`
      });
    } catch (error) {
      console.error("خطأ في فحص حالة Firebase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء فحص حالة Firebase" 
      });
    }
  });

  // تهيئة Firebase
  app.post("/api/firebase/init", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const success = await initializeFirebase();
      
      if (success) {
        await storage.createActivityLog({
          userId: req.session.userId as number,
          action: "firebase_init",
          entityType: "system",
          entityId: 0,
          details: "تم تهيئة Firebase"
        });
        
        res.json({ 
          success: true, 
          message: "تم تهيئة Firebase بنجاح" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "فشل في تهيئة Firebase - تحقق من متغيرات البيئة" 
        });
      }
    } catch (error) {
      console.error("خطأ في تهيئة Firebase:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء تهيئة Firebase" 
      });
    }
  });

  // ======== مدير التخزين الهجين ========
  
  // فحص حالة جميع مزودي التخزين
  app.get("/api/storage/status", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = await storageManager.getStorageStatus();
      res.json({ 
        success: true, 
        status,
        message: `التخزين الأساسي: ${status.preferred}, المتاح: ${status.available.join(', ')}`
      });
    } catch (error) {
      console.error("خطأ في فحص حالة التخزين:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء فحص حالة التخزين" 
      });
    }
  });

  // تغيير مزود التخزين المفضل
  app.post("/api/storage/set-preferred", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { provider } = req.body;
      
      if (!provider || !['local', 'firebase', 'supabase'].includes(provider)) {
        return res.status(400).json({ 
          success: false, 
          message: "مزود التخزين غير صالح" 
        });
      }

      storageManager.setPreferredProvider(provider);
      
      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "storage_provider_change",
        entityType: "system",
        entityId: 0,
        details: `تم تغيير مزود التخزين المفضل إلى: ${provider}`
      });
      
      res.json({ 
        success: true, 
        message: `تم تغيير مزود التخزين المفضل إلى: ${provider}` 
      });
    } catch (error) {
      console.error("خطأ في تغيير مزود التخزين:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء تغيير مزود التخزين" 
      });
    }
  });

  // مزامنة ملف عبر مزودات متعددة
  app.post("/api/storage/sync-file", authenticate, authorize(["admin"]), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "لم يتم تحديد ملف" 
        });
      }

      const { targetProviders } = req.body;
      const providers = targetProviders ? JSON.parse(targetProviders) : ['local', 'firebase', 'supabase'];
      
      const results = await storageManager.syncFileAcrossProviders(
        req.file.buffer,
        req.file.originalname,
        providers,
        req.file.mimetype
      );
      
      const successfulUploads = Object.entries(results)
        .filter(([_, result]) => result.success)
        .map(([provider, _]) => provider);

      await storage.createActivityLog({
        userId: req.session.userId as number,
        action: "file_sync",
        entityType: "system",
        entityId: 0,
        details: `تمت مزامنة الملف ${req.file.originalname} عبر: ${successfulUploads.join(', ')}`
      });
      
      res.json({ 
        success: true, 
        results,
        message: `تمت مزامنة الملف عبر ${successfulUploads.length} مزود من أصل ${providers.length}` 
      });
    } catch (error) {
      console.error("خطأ في مزامنة الملف:", error);
      res.status(500).json({ 
        success: false, 
        message: "حدث خطأ أثناء مزامنة الملف" 
      });
    }
  });

  // مسارات إدارة نقل الملفات إلى التخزين السحابي
  
  // الحصول على حالة الملفات
  app.get("/api/files/status", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = await fileMigration.getFilesStatus();
      res.json(status);
    } catch (error) {
      console.error("خطأ في الحصول على حالة الملفات:", error);
      res.status(500).json({ message: "خطأ في الحصول على حالة الملفات" });
    }
  });

  // بدء عملية نقل الملفات
  app.post("/api/files/migrate", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("🔄 بدء عملية نقل الملفات إلى التخزين السحابي...");
      const result = await fileMigration.migrateAllFiles();
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "migrate",
        entityType: "files",
        entityId: 0,
        details: `نقل الملفات: ${result.migratedFiles} نجح، ${result.failedFiles} فشل`,
        userId: req.session.userId as number
      });

      res.json(result);
    } catch (error) {
      console.error("خطأ في نقل الملفات:", error);
      res.status(500).json({ message: "خطأ في نقل الملفات" });
    }
  });

  // تنظيف الملفات القديمة
  app.post("/api/files/cleanup", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("🗑️ بدء تنظيف الملفات القديمة...");
      const cleanedCount = await fileMigration.cleanupOldFiles();
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "cleanup",
        entityType: "files",
        entityId: 0,
        details: `تم حذف ${cleanedCount} ملف قديم`,
        userId: req.session.userId as number
      });

      res.json({ cleanedFiles: cleanedCount });
    } catch (error) {
      console.error("خطأ في تنظيف الملفات:", error);
      res.status(500).json({ message: "خطأ في تنظيف الملفات" });
    }
  });

  // تنظيف قاعدة البيانات من الروابط المعطلة
  app.post("/api/database/cleanup", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("🗑️ بدء تنظيف قاعدة البيانات...");
      const result = await databaseCleanup.cleanupDatabase();
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "cleanup",
        entityType: "database",
        entityId: 0,
        details: `تنظيف قاعدة البيانات: ${result.brokenLinksRemoved} رابط معطل، ${result.validFilesFound} ملف صالح`,
        userId: req.session.userId as number
      });

      res.json(result);
    } catch (error) {
      console.error("خطأ في تنظيف قاعدة البيانات:", error);
      res.status(500).json({ message: "خطأ في تنظيف قاعدة البيانات" });
    }
  });

  // تنظيم الملفات الموجودة
  app.post("/api/files/organize", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("📁 بدء تنظيم الملفات...");
      const result = await databaseCleanup.organizeExistingFiles();
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "organize",
        entityType: "files",
        entityId: 0,
        details: `تنظيم الملفات: ${result.organized} ملف تم تنظيمه`,
        userId: req.session.userId as number
      });

      res.json(result);
    } catch (error) {
      console.error("خطأ في تنظيم الملفات:", error);
      res.status(500).json({ message: "خطأ في تنظيم الملفات" });
    }
  });

  // الحصول على حالة النظام الشاملة
  app.get("/api/system/status", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const systemStatus = await databaseCleanup.getSystemStatus();
      res.json(systemStatus);
    } catch (error) {
      console.error("خطأ في الحصول على حالة النظام:", error);
      res.status(500).json({ message: "خطأ في الحصول على حالة النظام" });
    }
  });

  // التنظيف الشامل المبسط
  app.post("/api/migration/complete", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      console.log("🔄 بدء التنظيف الشامل المبسط...");
      const result = await simpleMigration.performCompleteMigration();
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "migration",
        entityType: "system",
        entityId: 0,
        details: result.summary,
        userId: req.session.userId as number
      });

      res.json(result);
    } catch (error) {
      console.error("خطأ في التنظيف الشامل:", error);
      res.status(500).json({ message: "خطأ في التنظيف الشامل" });
    }
  });

  // حالة النظام المبسطة
  app.get("/api/migration/status", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = await simpleMigration.getSimpleStatus();
      res.json(status);
    } catch (error) {
      console.error("خطأ في الحصول على حالة التنظيف:", error);
      res.status(500).json({ message: "خطأ في الحصول على حالة التنظيف" });
    }
  });

  // ======== إدارة الموظفين ========
  
  // جلب جميع الموظفين
  app.get("/api/employees", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql(`
        SELECT e.*, p.name as project_name 
        FROM employees e 
        LEFT JOIN projects p ON e.assigned_project_id = p.id 
        ORDER BY e.created_at DESC
      `);
      
      const employees = result.map(row => ({
        id: row.id,
        name: row.name,
        salary: row.salary,
        assignedProjectId: row.assigned_project_id,
        assignedProject: row.project_name ? { id: row.assigned_project_id, name: row.project_name } : null,
        active: row.active,
        hireDate: row.hire_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(employees);
    } catch (error) {
      console.error("خطأ في جلب الموظفين:", error);
      res.status(500).json({ message: "خطأ في جلب الموظفين" });
    }
  });

  // جلب الموظفين حسب المشروع
  app.get("/api/employees/by-project/:projectId", authenticate, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const sql = neon(process.env.DATABASE_URL!);
      
      const result = await sql(`
        SELECT e.*, p.name as project_name 
        FROM employees e 
        LEFT JOIN projects p ON e.assigned_project_id = p.id 
        WHERE e.assigned_project_id = $1 AND e.active = true
        ORDER BY e.name ASC
      `, [parseInt(projectId)]);
      
      const employees = result.map(row => ({
        id: row.id,
        name: row.name,
        salary: row.salary,
        assignedProjectId: row.assigned_project_id,
        assignedProject: row.project_name ? { id: row.assigned_project_id, name: row.project_name } : null,
        active: row.active,
        hireDate: row.hire_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(employees);
    } catch (error) {
      console.error("خطأ في جلب موظفي المشروع:", error);
      res.status(500).json({ message: "خطأ في جلب موظفي المشروع" });
    }
  });

  // إنشاء موظف جديد
  app.post("/api/employees", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const { name, salary, assignedProjectId, notes } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "اسم الموظف مطلوب" });
      }
      
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql(`
        INSERT INTO employees (name, salary, assigned_project_id, notes, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, salary || 0, assignedProjectId || null, notes || null, req.session.userId]);
      
      const employee = result[0];
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "create",
        entityType: "employee",
        entityId: employee.id,
        details: `تم إنشاء موظف جديد: ${employee.name}`,
        userId: req.session.userId as number
      });
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("خطأ في إنشاء الموظف:", error);
      res.status(500).json({ message: "خطأ في إنشاء الموظف" });
    }
  });

  // تحديث موظف
  app.put("/api/employees/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { name, salary, assignedProjectId, active, notes } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "اسم الموظف مطلوب" });
      }
      
      const sql = neon(process.env.DATABASE_URL!);
      const result = await sql(`
        UPDATE employees 
        SET name = $1, salary = $2, assigned_project_id = $3, active = $4, notes = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `, [name, salary || 0, assignedProjectId || null, active !== false, notes || null, employeeId]);
      
      if (result.length === 0) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      const employee = result[0];
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "update",
        entityType: "employee",
        entityId: employee.id,
        details: `تم تحديث بيانات الموظف: ${employee.name}`,
        userId: req.session.userId as number
      });
      
      res.json(employee);
    } catch (error) {
      console.error("خطأ في تحديث الموظف:", error);
      res.status(500).json({ message: "خطأ في تحديث الموظف" });
    }
  });

  // حذف موظف
  app.delete("/api/employees/:id", authenticate, authorize(["admin"]), async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      // الحصول على بيانات الموظف قبل الحذف
      const sql = neon(process.env.DATABASE_URL!);
      const employeeResult = await sql(`SELECT * FROM employees WHERE id = $1`, [employeeId]);
      
      if (employeeResult.length === 0) {
        return res.status(404).json({ message: "الموظف غير موجود" });
      }
      
      const employee = employeeResult[0];
      
      // حذف الموظف
      await sql(`DELETE FROM employees WHERE id = $1`, [employeeId]);
      
      // تسجيل النشاط
      await storage.createActivityLog({
        action: "delete",
        entityType: "employee",
        entityId: employeeId,
        details: `تم حذف الموظف: ${employee.name}`,
        userId: req.session.userId as number
      });
      
      res.json({ message: "تم حذف الموظف بنجاح" });
    } catch (error) {
      console.error("خطأ في حذف الموظف:", error);
      res.status(500).json({ message: "خطأ في حذف الموظف" });
    }
  });

  return httpServer;
}
