import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { z } from 'zod';

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for Firebase Functions
app.use(session({
  secret: process.env.SESSION_SECRET || 'arabic-accounting-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'غير مصرح' });
  }
  next();
};

// Basic authentication routes
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple admin login for demo
    if (username === 'admin' && password === 'admin123') {
      req.session.userId = 1;
      req.session.username = 'admin';
      req.session.role = 'admin';
      
      res.json({
        id: 1,
        username: 'admin',
        name: 'مدير النظام',
        role: 'admin'
      });
    } else {
      res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

app.get('/auth/session', (req, res) => {
  if (req.session?.userId) {
    res.json({
      id: req.session.userId,
      username: req.session.username,
      name: 'مدير النظام',
      role: req.session.role
    });
  } else {
    res.status(401).json({ message: 'غير مصرح' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: 'خطأ في تسجيل الخروج' });
    } else {
      res.json({ message: 'تم تسجيل الخروج بنجاح' });
    }
  });
});

// Database status endpoint
app.get('/database/status', async (req, res) => {
  try {
    const startTime = Date.now();
    await sql`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    res.json({
      connected: true,
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic dashboard data
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Return basic dashboard data for Firebase deployment
    res.json({
      totalIncome: 3306000000,
      totalExpenses: 384000000,
      netProfit: 2922000000,
      activeProjects: 15,
      pendingTransactions: 5,
      completedTransactions: 234,
      totalUsers: 3,
      systemHealth: 'جيد'
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات لوحة التحكم' });
  }
});

// Basic projects endpoint
app.get('/projects', requireAuth, async (req, res) => {
  try {
    // Return sample projects data
    res.json([
      {
        id: 30,
        name: 'فندق المصايف',
        description: 'مشروع إنشاء فندق سياحي',
        budget: 5000000000,
        spent: 1200000000,
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2025-12-31',
        createdAt: '2024-01-15T10:00:00.000Z'
      }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المشاريع' });
  }
});

// Basic settings endpoint
app.get('/settings', requireAuth, async (req, res) => {
  try {
    res.json([
      { id: 1, key: 'company_name', value: 'شركة النجاح للمقاولات' },
      { id: 2, key: 'company_address', value: 'الرياض، المملكة العربية السعودية' },
      { id: 3, key: 'company_phone', value: '+966 11 234 5678' },
      { id: 4, key: 'company_email', value: 'info@alnajah.com' }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الإعدادات' });
  }
});

// Basic transactions endpoint
app.get('/transactions', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المعاملات' });
  }
});

// Basic deferred payments endpoint
app.get('/deferred-payments', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب المدفوعات المؤجلة' });
  }
});

// Basic expense types endpoint
app.get('/expense-types', requireAuth, async (req, res) => {
  try {
    res.json([
      { id: 2, name: 'أجور عمال', description: 'رواتب ومكافآت العمال' },
      { id: 3, name: 'مواد البناء', description: 'الإسمنت والحديد والطوب' }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب أنواع المصروفات' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);