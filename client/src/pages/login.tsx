import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
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
      await login(values.username, values.password);
    } catch (error) {
      console.error('Login error:', error);
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
