import React, { 
  createContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false, // Changed to false to avoid infinite loading state
  login: async () => null,
  loginWithGoogle: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false
  const { toast } = useToast();

  // تحقق من جلسة المستخدم عند تحميل التطبيق
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/auth/session', undefined);
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.log('No active session');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // استمع لتغييرات المصادقة من Firebase (إذا كان متاحًا)
  useEffect(() => {
    // تحقق من وجود كائن auth
    if (!auth) {
      console.log('Firebase auth not available');
      return () => {}; // إرجاع دالة تنظيف فارغة
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setIsLoading(true);
        
        if (firebaseUser) {
          // المستخدم قد قام بتسجيل الدخول عبر Firebase
          try {
            const idToken = await firebaseUser.getIdToken();
            // إرسال معلومات المستخدم إلى الخادم للتحقق
            const response = await apiRequest('POST', '/api/auth/firebase-login', { 
              token: idToken,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            });
            
            const userData = await response.json();
            setUser(userData);
            
            toast({
              title: "تم تسجيل الدخول بنجاح",
              description: `مرحباً بك ${userData.name}`,
            });
          } catch (apiError) {
            console.error('Server authentication error:', apiError);
            // في حالة فشل التسجيل في الخادم، قم بتسجيل الخروج من Firebase أيضًا
            if (auth) {
              await firebaseSignOut(auth);
            }
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    // تنظيف الاستماع عند إلغاء تحميل المكون
    return () => unsubscribe();
  }, [toast]);

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      
      console.log('Sending login request to server:', { username, password });
      
      // استخدام fetch API مع خيار credentials
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // هذا مهم لإرسال واستقبال ملفات تعريف الارتباط
      });
      
      console.log('Login response status:', response.status);
      
      // إذا كان هناك خطأ، نقرأ النص ونرمي خطأً
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error from server:', errorText);
        throw new Error(errorText || 'فشل تسجيل الدخول');
      }
      
      // قراءة البيانات من الاستجابة
      const userData = await response.json();
      console.log('Login successful, user data:', userData);
      
      // تحديث حالة المستخدم
      setUser(userData);
      
      // إظهار رسالة النجاح
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${userData.name}`,
      });
      
      // التحقق من الجلسة بعد تسجيل الدخول
      setTimeout(async () => {
        try {
          const sessionCheckResponse = await fetch('/api/auth/session', {
            credentials: 'include'
          });
          console.log('Session check after login:', sessionCheckResponse.status, 
            await sessionCheckResponse.text());
        } catch (err) {
          console.error('Failed to check session after login:', err);
        }
      }, 1000);
      
      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.message || 'خطأ في تسجيل الدخول';
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: message,
      });
      // نرجع قيمة فارغة في حالة الخطأ
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة تسجيل الدخول باستخدام جوجل
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      // استخدام دالة تسجيل الدخول من ملف firebase
      const { signInWithGoogle } = await import('@/lib/firebase');
      await signInWithGoogle();
      
      toast({
        title: "جاري تسجيل الدخول بواسطة Google",
        description: "يرجى الانتظار...",
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      const message = error.message || 'خطأ في تسجيل الدخول باستخدام Google';
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // تسجيل الخروج من Firebase إذا كان متاحًا
      if (auth) {
        await firebaseSignOut(auth);
      }
      // تسجيل الخروج من API
      await apiRequest('POST', '/api/auth/logout', undefined);
      setUser(null);
      toast({
        title: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
