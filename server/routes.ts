import type { Express, Request, Response } from "express";
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
  insertSettingSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    role: string;
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

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    console.log('Auth middleware - Session:', req.session);
    if (!req.session || !req.session.userId) {
      console.log('Unauthorized request - no valid session');
      return res.status(401).json({ message: "غير مصرح" });
    }
    console.log('User authenticated with ID:', req.session.userId);
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
      const userData = insertUserSchema.parse(req.body);
      // Hash password
      userData.password = await bcrypt.hash(userData.password, 10);
      
      // استخراج معرف المشروع قبل إنشاء المستخدم إذا كان موجودًا
      const projectId = userData.projectId;
      delete userData.projectId; // إزالة الحقل غير المستخدم في إنشاء المستخدم
      
      const user = await storage.createUser(userData);
      
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
    } catch (error) {
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
      const projects = await storage.listProjects();
      return res.status(200).json(projects);
    } catch (error) {
      return res.status(500).json({ message: "خطأ في استرجاع المشاريع" });
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

  app.delete("/api/projects/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      // Only project creator or admin can delete
      if (project.createdBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بحذف هذا المشروع" });
      }
      
      const result = await storage.deleteProject(id);
      
      if (result) {
        await storage.createActivityLog({
          action: "delete",
          entityType: "project",
          entityId: id,
          details: `حذف مشروع: ${project.name}`,
          userId: req.session.userId as number
        });
      }
      
      return res.status(200).json({ success: result });
    } catch (error) {
      return res.status(500).json({ message: "خطأ في حذف المشروع" });
    }
  });

  // Transactions routes
  app.get("/api/transactions", authenticate, async (req: Request, res: Response) => {
    try {
      let transactions = await storage.listTransactions();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // المدير يمكنه رؤية جميع المعاملات، المستخدم العادي يرى فقط معاملاته والمشاريع التي لديه وصول إليها
      if (userRole !== "admin") {
        // احصل على قائمة المشاريع المسموح للمستخدم بالوصول إليها
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        // فلترة المعاملات بحيث تظهر فقط:
        // 1. المعاملات التي قام المستخدم بإنشائها
        // 2. المعاملات المرتبطة بالمشاريع التي يملك وصولاً إليها
        transactions = transactions.filter(t => 
          t.createdBy === userId || 
          (t.projectId && projectIds.includes(t.projectId))
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
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("خطأ في استرجاع المعاملات:", error);
      return res.status(500).json({ message: "خطأ في استرجاع المعاملات" });
    }
  });

  app.post("/api/transactions", authenticate, async (req: Request, res: Response) => {
    try {
      console.log("Transaction creation request:", req.body);

      if (!req.body.date || !req.body.amount || !req.body.type || !req.body.description) {
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
        const hasAccess = await storage.checkUserProjectAccess(userId, projectId);
        if (!hasAccess) {
          return res.status(403).json({ 
            message: "غير مصرح لك بإنشاء معاملات لهذا المشروع"
          });
        }
      }
      
      let result: any;
      
      // معالجة العملية حسب نوعها ووجود مشروع
      if (projectId) {
        // إذا كان المشروع محددًا
        if (type === "income") {
          // عملية إيداع في المشروع (تستقطع من حساب المدير)
          result = await storage.processDeposit(userId, projectId, amount, description);
        } else if (type === "expense") {
          // عملية صرف من المشروع
          result = await storage.processWithdrawal(userId, projectId, amount, description);
        }
      } else {
        // عملية للمدير (إيراد أو صرف)
        result = await storage.processAdminTransaction(userId, type, amount, description);
      }
      
      // إذا لم تتم معالجة العملية بأي من الطرق السابقة
      if (!result || !result.transaction) {
        return res.status(400).json({ message: "خطأ في معالجة العملية" });
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
      const transactionData = req.body;
      
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "المعاملة غير موجودة" });
      }
      
      // Only transaction creator or admin can update
      if (transaction.createdBy !== req.session.userId && req.session.role !== "admin") {
        return res.status(403).json({ message: "غير مصرح لك بتحديث هذه المعاملة" });
      }
      
      const updatedTransaction = await storage.updateTransaction(id, transactionData);
      
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

  // Documents routes
  app.get("/api/documents", authenticate, async (req: Request, res: Response) => {
    try {
      let documents = await storage.listDocuments();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // المدير يمكنه رؤية جميع المستندات، المستخدم العادي يرى فقط مستنداته والمستندات المرتبطة بالمشاريع التي لديه وصول إليها
      if (userRole !== "admin") {
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
        if (userRole !== "admin") {
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

  app.post("/api/documents", authenticate, async (req: Request, res: Response) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      documentData.uploadedBy = req.session.userId as number;
      documentData.uploadDate = new Date();
      
      const document = await storage.createDocument(documentData);
      
      await storage.createActivityLog({
        action: "create",
        entityType: "document",
        entityId: document.id,
        details: `إضافة مستند جديد: ${document.name}`,
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

  // Dashboard statistics
  app.get("/api/dashboard", authenticate, async (req: Request, res: Response) => {
    try {
      let transactions = await storage.listTransactions();
      let projects = await storage.listProjects();
      const userId = req.session.userId as number;
      const userRole = req.session.role as string;
      
      // تطبيق قيود الوصول للمستخدمين العاديين
      if (userRole !== "admin") {
        // احصل على قائمة المشاريع المسموح للمستخدم بالوصول إليها
        const userProjects = await storage.getUserProjects(userId);
        const projectIds = userProjects.map(project => project.id);
        
        // فلترة المعاملات بحيث تظهر فقط المعاملات الخاصة بالمستخدم أو بالمشاريع التي يملك وصولاً إليها
        transactions = transactions.filter(t => 
          t.createdBy === userId || 
          (t.projectId && projectIds.includes(t.projectId))
        );
        
        // فلترة المشاريع بحيث تظهر فقط المشاريع التي يملك المستخدم وصولاً إليها
        projects = userProjects;
      }
      
      // Calculate totals
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netProfit = totalIncome - totalExpenses;
      
      // Get recent transactions
      const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      // حساب عدد المشاريع النشطة
      const activeProjects = projects.filter(p => p.status === "active").length;
      
      return res.status(200).json({
        totalIncome,
        totalExpenses,
        netProfit,
        activeProjects,
        recentTransactions
      });
    } catch (error) {
      console.error("خطأ في استرجاع إحصائيات لوحة التحكم:", error);
      return res.status(500).json({ message: "خطأ في استرجاع إحصائيات لوحة التحكم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
