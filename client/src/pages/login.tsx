import React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calculator, TrendingUp, FileText, Users, Shield } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* الجانب الأيسر - معلومات النظام */}
        <div className="hidden lg:block space-y-8">
          <div className="text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">نظام المحاسبة العربي</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              نظام محاسبة متكامل لإدارة المشاريع والمالية
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-center gap-4 p-4 bg-white/60 rounded-lg backdrop-blur">
              <Calculator className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">محاسبة شاملة</h3>
                <p className="text-gray-600 text-sm">إدارة المعاملات والمصروفات بدقة</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/60 rounded-lg backdrop-blur">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">تقارير تفصيلية</h3>
                <p className="text-gray-600 text-sm">تحليلات مالية متقدمة ورؤى استراتيجية</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/60 rounded-lg backdrop-blur">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">إدارة المستندات</h3>
                <p className="text-gray-600 text-sm">حفظ وتنظيم جميع الوثائق المالية</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/60 rounded-lg backdrop-blur">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900">إدارة المشاريع</h3>
                <p className="text-gray-600 text-sm">متابعة المشاريع والفرق والمهام</p>
              </div>
            </div>
          </div>
        </div>

        {/* الجانب الأيمن - نموذج تسجيل الدخول */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4 lg:hidden">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">نظام المحاسبة</h1>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">تسجيل الدخول</CardTitle>
              <CardDescription className="text-gray-600">
                ادخل بياناتك للوصول إلى النظام
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="اسم المستخدم" 
                            className="h-12 text-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
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
                            type="password" 
                            placeholder="كلمة المرور" 
                            className="h-12 text-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري تسجيل الدخول...
                      </div>
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>
                </form>
              </Form>

              {/* معلومات التجريب */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">حسابات تجريبية</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  للتجربة والاطلاع على النظام:
                </p>
                
                <div className="space-y-2">
                  <div className="text-xs text-blue-600 font-mono bg-white/70 p-2 rounded">
                    <strong>المدير:</strong> admin / admin123
                  </div>
                  <div className="text-xs text-blue-600 font-mono bg-white/70 p-2 rounded">
                    <strong>مدير المشاريع:</strong> manager / manager123
                  </div>
                  <div className="text-xs text-blue-600 font-mono bg-white/70 p-2 rounded">
                    <strong>مستخدم عادي:</strong> user / user123
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  نظام المحاسبة العربي | جميع الحقوق محفوظة 2025
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
