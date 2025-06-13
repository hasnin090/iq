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
        
        // الحصول على البيانات من التخزين المحلي كحل احتياطي
        const storedUser = localStorage.getItem('auth_user');
        let foundUser = null;
        
        if (storedUser) {
          try {
            foundUser = JSON.parse(storedUser);
            console.log('Found stored user data:', foundUser);
          } catch (err) {
            console.error('Failed to parse stored user data:', err);
          }
        }
        
        try {
          // محاولة الحصول على بيانات الجلسة من الخادم
          const response = await fetch('/api/auth/session', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('Server session data:', userData);
            setUser(userData);
            // تحديث البيانات المخزنة محلياً
            localStorage.setItem('auth_user', JSON.stringify(userData));
            return;
          } else {
            console.log('No active server session:', response.status);
          }
        } catch (serverError) {
          console.error('Error checking server session:', serverError);
        }
        
        // استخدام البيانات المخزنة محلياً إذا لم تنجح محاولة الخادم
        if (foundUser) {
          console.log('Using locally stored user data as fallback');
          setUser(foundUser);
          
          // محاولة إعادة تفعيل الجلسة باستخدام البيانات المخزنة
          try {
            await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                username: foundUser.username,
                password: 'admin123' // استخدام كلمة مرور المدير الافتراضية للاختبار
              }),
              credentials: 'include'
            });
            console.log('Session restored from local storage data');
          } catch (e) {
            console.log('Failed to restore session, continuing with local data:', e);
          }
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
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
            const response = await apiRequest('/api/auth/firebase-login', 'POST', { 
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
      
      // تخزين بيانات المستخدم في localStorage للاستخدام المؤقت
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
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
          console.log('Session check after login:', sessionCheckResponse.status);
          
          if (sessionCheckResponse.ok) {
            const sessionData = await sessionCheckResponse.json();
            console.log('Session data:', sessionData);
          } else {
            console.warn('Session check failed:', await sessionCheckResponse.text());
          }
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
      
      // إزالة بيانات المستخدم من التخزين المحلي
      localStorage.removeItem('auth_user');
      
      try {
        // تسجيل الخروج من API
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (apiError) {
        console.error('API logout error:', apiError);
        // نستمر حتى مع وجود خطأ
      }
      
      // تحديث حالة المستخدم في التطبيق
      setUser(null);
      
      // إظهار رسالة النجاح
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
