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
  User as FirebaseUser 
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
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // استمع لتغييرات المصادقة من Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setIsLoading(true);
        
        if (firebaseUser) {
          // المستخدم قد قام بتسجيل الدخول عبر Firebase
          const idToken = await firebaseUser.getIdToken();
          
          // إرسال معلومات المستخدم إلى الخادم للتحقق
          try {
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
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          // تحقق إذا كان المستخدم قد قام بتسجيل الدخول عبر الطريقة التقليدية
          try {
            const response = await apiRequest('GET', '/api/auth/session', undefined);
            const userData = await response.json();
            setUser(userData);
          } catch (error) {
            console.log('No active session');
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

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${userData.name}`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.message || 'خطأ في تسجيل الدخول';
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

  // إضافة تسجيل الدخول باستخدام جوجل
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      // استخدام دالة تسجيل الدخول من ملف firebase
      const { signInWithGoogle } = await import('@/lib/firebase');
      await signInWithGoogle();
      
      // نحتاج إلى إرسال البيانات إلى الخادم بعد تسجيل الدخول بنجاح
      // سيتم التعامل مع إعادة التوجيه في useEffect منفصل
      
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
      // تسجيل الخروج من Firebase
      await firebaseSignOut(auth);
      // تسجيل الخروج من API
      await apiRequest('POST', '/api/auth/logout', undefined);
      setUser(null);
      toast({
        title: "تم تسجيل الخروج بنجاح",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
