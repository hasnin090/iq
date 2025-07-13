import React, { 
  createContext, 
  useState, 
  useEffect, 
  ReactNode,
  useContext
} from 'react';
import { useToast } from '@/hooks/use-toast';

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
        // استخدام البيانات المحلية إذا متوفرة
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const foundUser = JSON.parse(storedUser);
            if (isMounted) {
              setUser(foundUser);
              setIsLoading(false);
            }
            return;
          } catch (err) {
            localStorage.removeItem('auth_user');
          }
        }
        
        // للبيئة السحابية - عدم محاولة الاتصال بالخادم في البداية إلا إذا كان هناك token
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          try {
            const response = await fetch('/api/auth/check', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              credentials: 'include',
            });
            
            if (response.ok) {
              const userData = await response.json();
              if (isMounted) {
                setUser(userData);
              }
            } else {
              localStorage.removeItem('auth_token');
            }
          } catch (error) {
            console.log('Auth check failed, continuing with offline mode');
            localStorage.removeItem('auth_token');
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
    
    // تأخير بسيط لتجنب التحديث السريع للحالة
    const timer = setTimeout(checkSession, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', username); // Debug log
      
      // محاولة تسجيل الدخول عبر API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      
      console.log('Login response status:', response.status); // Debug log
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Login successful:', userData); // Debug log
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        // Store a simple auth token for session management
        localStorage.setItem('auth_token', 'demo_' + Date.now());
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${userData.name}`,
        });
        
        return userData;
      } else {
        const errorData = await response.json();
        console.log('Login failed:', errorData); // Debug log
        
        toast({
          title: "خطأ في تسجيل الدخول",
          description: errorData.message || errorData.error || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Login network error:', error);
      
      // في حالة فشل الاتصال، نسمح بدخول demo المحلي
      const demoUsers = [
        {
          id: 1,
          username: 'admin',
          password: 'admin123',
          name: 'المدير العام',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['manage_all']
        },
        {
          id: 2,
          username: 'manager',
          password: 'manager123',
          name: 'مدير المشاريع',
          email: 'manager@example.com',
          role: 'manager',
          permissions: ['view_reports', 'manage_projects']
        },
        {
          id: 3,
          username: 'user',
          password: 'user123',
          name: 'المستخدم العادي',
          email: 'user@example.com',
          role: 'user',
          permissions: ['view_basic']
        }
      ];
      
      const demoUser = demoUsers.find(u => u.username === username && u.password === password);
      
      if (demoUser) {
        const { password: _, ...userResponse } = demoUser;
        
        setUser(userResponse);
        localStorage.setItem('auth_user', JSON.stringify(userResponse));
        localStorage.setItem('auth_token', 'demo_' + Date.now());
        
        toast({
          title: "تم تسجيل الدخول (وضع محلي)",
          description: `مرحباً ${userResponse.name}`,
        });
        
        return userResponse;
      }
      
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. المستخدمون المتاحون: admin/admin123, manager/manager123, user/user123",
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    // محاولة تسجيل الخروج من الخادم
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // تجاهل الخطأ في البيئة السحابية
    });
    
    toast({
      title: "تم تسجيل الخروج",
      description: "إلى اللقاء",
    });
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
