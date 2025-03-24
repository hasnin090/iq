import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log('Login form submitted with:', values);
      
      // تنظيف البيانات
      const formData = {
        username: values.username.trim(),
        password: values.password
      };
      
      console.log('Calling auth context login function with:', formData);
      
      // استخدام fetch مباشرة بدلاً من دالة السياق
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      console.log('Login API response:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error:', errorText);
        throw new Error(errorText || 'فشل تسجيل الدخول');
      }
      
      const userData = await response.json();
      console.log('Login successful, user data:', userData);
      
      // تخزين بيانات المستخدم في localStorage
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      // إضافة فحص الجلسة قبل التوجيه
      try {
        console.log('Checking session before redirect...');
        const sessionCheckResponse = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Session check response:', sessionCheckResponse.status);
        
        if (sessionCheckResponse.ok) {
          console.log('Session is valid, proceeding with redirect');
        } else {
          console.warn('Session is not valid but continuing with fallback');
        }
      } catch (sessionError) {
        console.error('Session check failed:', sessionError);
      }
      
      // إعادة تحميل الصفحة للانتقال إلى الصفحة الرئيسية (لوحة التحكم)
      // استخدام window.location.assign لإعادة توجيه أكثر موثوقية
      // وإضافة معلمة إضافية لضمان إعادة تحميل الصفحة
      console.log('توجيه إلى لوحة التحكم...');
      setTimeout(() => {
        window.location.assign('/?auth=' + new Date().getTime());
      }, 1000);
      
    } catch (error) {
      console.error('Login submit error:', error);
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-secondary-light to-secondary flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="w-full max-w-md p-6">
        <div className={`bg-secondary-light bg-opacity-90 rounded-2xl p-8 shadow-2xl border border-opacity-10 backdrop-filter backdrop-blur-md transition-all ${shakeAnimation ? 'shake' : ''}`}>
          <h2 className="text-primary-light text-2xl font-bold text-center mb-6">تسجيل الدخول</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-transparent focus:border-primary focus:bg-opacity-15 text-white outline-none transition-all"
                        placeholder="اسم المستخدم"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-transparent focus:border-primary focus:bg-opacity-15 text-white outline-none transition-all"
                        placeholder="كلمة المرور"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-destructive text-sm" />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full py-3 mt-5 rounded-lg bg-gradient-to-r from-primary to-primary-light text-white font-bold transition-all hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    جاري تسجيل الدخول...
                  </>
                ) : "دخول"}
              </Button>
              
              <div className="mt-6">
                <Separator className="my-4">
                  <span className="px-2 text-sm text-muted-foreground">أو</span>
                </Separator>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 mt-3 border border-muted-foreground bg-white bg-opacity-10 text-neutral-light hover:bg-white hover:bg-opacity-15"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      await loginWithGoogle();
                    } catch (error) {
                      console.error('Google login error:', error);
                      setShakeAnimation(true);
                      setTimeout(() => setShakeAnimation(false), 500);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"
                    />
                  </svg>
                  تسجيل الدخول باستخدام جوجل
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
