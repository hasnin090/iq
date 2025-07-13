import React, { 
  createContext, 
  useState, 
  useEffect, 
  ReactNode,
  useContext
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => null,
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

  // تحقق من جلسة المستخدم مرة واحدة فقط عند تحميل التطبيق
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      if (!isMounted) return;
      
      try {
        // التحقق من جلسة Supabase الحالية
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          // تحويل مستخدم Supabase إلى تنسيق التطبيق
          const user: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'user',
            permissions: session.user.user_metadata?.permissions || ['view_basic']
          };
          
          if (isMounted) {
            setUser(user);
            localStorage.setItem('auth_user', JSON.stringify(user));
          }
        } else {
          // محاولة استخدام البيانات المحلية كحل احتياطي
          const storedUser = localStorage.getItem('auth_user');
          if (storedUser && isMounted) {
            try {
              const foundUser = JSON.parse(storedUser);
              setUser(foundUser);
            } catch (err) {
              localStorage.removeItem('auth_user');
            }
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // إعداد listener لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          const user: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'user',
            permissions: session.user.user_metadata?.permissions || ['view_basic']
          };
          
          setUser(user);
          localStorage.setItem('auth_user', JSON.stringify(user));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      }
    );
    
    // تأخير بسيط لتجنب التحديث السريع للحالة
    const timer = setTimeout(checkSession, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting Supabase login for:', email);
      
      // محاولة تسجيل الدخول عبر Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        
        // في حالة فشل Supabase، نجرب النظام التجريبي المحلي
        const demoUsers = [
          {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            name: 'المدير العام',
            role: 'admin',
            permissions: ['manage_all']
          },
          {
            id: '2',
            username: 'manager',
            email: 'manager@example.com', 
            password: 'manager123',
            name: 'مدير المشاريع',
            role: 'manager',
            permissions: ['view_reports', 'manage_projects']
          },
          {
            id: '3',
            username: 'user',
            email: 'user@example.com',
            password: 'user123',
            name: 'المستخدم العادي',
            role: 'user',
            permissions: ['view_basic']
          }
        ];
        
        // البحث عن المستخدم باستخدام email أو username
        const demoUser = demoUsers.find(u => 
          (u.email === email || u.username === email) && u.password === password
        );
        
        if (demoUser) {
          const { password: _, ...userResponse } = demoUser;
          
          setUser(userResponse);
          localStorage.setItem('auth_user', JSON.stringify(userResponse));
          
          toast({
            title: "تم تسجيل الدخول (وضع تجريبي)",
            description: `مرحباً ${userResponse.name}`,
          });
          
          return userResponse;
        }
        
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message || "بيانات الدخول غير صحيحة",
          variant: "destructive",
        });
        return null;
      }
      
      if (data.user) {
        // تحويل مستخدم Supabase إلى تنسيق التطبيق
        const user: User = {
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'user',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'مستخدم',
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'user',
          permissions: data.user.user_metadata?.permissions || ['view_basic']
        };
        
        setUser(user);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${user.name}`,
        });
        
        return user;
      }
      
      return null;
      
    } catch (error) {
      console.error('Login network error:', error);
      
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. للتجربة: admin@example.com/admin123",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      // تنفيذ تسجيل الدخول باستخدام Google
      toast({
        title: "قريباً",
        description: "تسجيل الدخول بـ Google سيكون متاحاً قريباً",
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الدخول بـ Google",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      // تسجيل الخروج من Supabase
      await supabase.auth.signOut();
      
      // تنظيف البيانات المحلية
      setUser(null);
      localStorage.removeItem('auth_user');
      
      toast({
        title: "تم تسجيل الخروج",
        description: "إلى اللقاء",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // في حالة فشل تسجيل الخروج من Supabase، نظف البيانات المحلية على الأقل
      setUser(null);
      localStorage.removeItem('auth_user');
      
      toast({
        title: "تم تسجيل الخروج",
        description: "إلى اللقاء",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Export useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
