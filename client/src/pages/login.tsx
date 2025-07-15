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
import { Building2, Calculator, TrendingUp, FileText, Users, Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية متحركة بألوان دافئة */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 via-green-600/8 to-teal-600/8"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/15 rounded-full mix-blend-multiply filter blur-2xl opacity-80 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-green-400/15 rounded-full mix-blend-multiply filter blur-2xl opacity-80 animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-88 h-88 bg-teal-400/15 rounded-full mix-blend-multiply filter blur-2xl opacity-80 animate-pulse animation-delay-4000"></div>
      
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        
        {/* الجانب الأيسر - معلومات الشركة والنظام */}
        <div className="hidden lg:block space-y-8 pr-8">
          {/* شعار وعنوان الشركة */}
          <div className="text-center lg:text-right">              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">✓</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-green-800 bg-clip-text text-transparent">
                  شركة طريق العامرة
                </h1>
                <p className="text-lg font-medium text-emerald-700 mt-1">للمقاولات والاستثمار</p>
              </div>
            </div>
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">نظام الإدارة المتكامل</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                منصة شاملة لإدارة المشاريع والمالية والموارد البشرية مع أحدث التقنيات وأعلى معايير الأمان
              </p>
            </div>
          </div>

          {/* مميزات النظام */}
          <div className="grid gap-4">
            <div className="group flex items-center gap-4 p-6 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-md border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">إدارة مالية متطورة</h3>
                <p className="text-gray-600">تتبع دقيق للمعاملات والميزانيات مع تقارير تفصيلية</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-6 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-md border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">تحليلات ذكية</h3>
                <p className="text-gray-600">رؤى استراتيجية وتنبؤات مالية بتقنية الذكاء الاصطناعي</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-6 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-md border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">أرشفة إلكترونية</h3>
                <p className="text-gray-600">حفظ وإدارة المستندات بنظام أمان متعدد المستويات</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-6 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-md border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">إدارة المشاريع</h3>
                <p className="text-gray-600">متابعة شاملة للمشاريع والفرق مع جدولة زمنية متقدمة</p>
              </div>
            </div>
          </div>
        </div>

        {/* الجانب الأيمن - نموذج تسجيل الدخول */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-emerald-50/40"></div>
            <div className="relative z-10">
              <CardHeader className="text-center pb-8 pt-8">
                {/* شعار الشركة للموبايل */}
                <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs text-white font-bold">✓</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">شركة طريق العامرة</h1>
                    <p className="text-sm text-emerald-600">للمقاولات والاستثمار</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 bg-clip-text text-transparent">
                    تسجيل الدخول
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    ادخل بياناتك للوصول إلى نظام الإدارة
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-8 pb-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                              <Input 
                                type="email"
                                placeholder="البريد الإلكتروني" 
                                className="h-14 text-lg pr-12 bg-white/50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-300"
                                {...field} 
                              />
                            </div>
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
                            <div className="relative group">
                              <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="كلمة المرور" 
                                className="h-14 text-lg pr-12 pl-12 bg-white/50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-300"
                                {...field} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          جاري تسجيل الدخول...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          دخول آمن
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* معلومات التجريب */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900 text-lg">حسابات تجريبية</span>
                  </div>
                  <p className="text-sm text-emerald-700 font-medium">
                    للتجربة والاطلاع على النظام:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm text-emerald-800 bg-white/80 p-4 rounded-lg border border-emerald-300 hover:bg-white/95 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                         onClick={() => {
                           form.setValue('email', 'admin@example.com');
                           form.setValue('password', 'admin123');
                         }}>
                      <div className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">👑</span>
                        المدير العام
                      </div>
                      <div className="font-mono text-xs bg-emerald-100 px-2 py-1 rounded">admin@example.com | admin123</div>
                      <div className="text-xs text-teal-600 mt-2 font-medium">← اضغط للملء التلقائي</div>
                    </div>
                    <div className="text-sm text-emerald-800 bg-white/80 p-4 rounded-lg border border-emerald-300 hover:bg-white/95 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                         onClick={() => {
                           form.setValue('email', 'manager@example.com');
                           form.setValue('password', 'manager123');
                         }}>
                      <div className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">📋</span>
                        مدير المشاريع
                      </div>
                      <div className="font-mono text-xs bg-emerald-100 px-2 py-1 rounded">manager@example.com | manager123</div>
                      <div className="text-xs text-teal-600 mt-2 font-medium">← اضغط للملء التلقائي</div>
                    </div>
                    <div className="text-sm text-emerald-800 bg-white/80 p-4 rounded-lg border border-emerald-300 hover:bg-white/95 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                         onClick={() => {
                           form.setValue('email', 'user@example.com');
                           form.setValue('password', 'user123');
                         }}>
                      <div className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        مستخدم عادي
                      </div>
                      <div className="font-mono text-xs bg-emerald-100 px-2 py-1 rounded">user@example.com | user123</div>
                      <div className="text-xs text-teal-600 mt-2 font-medium">← اضغط للملء التلقائي</div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    <strong className="text-emerald-700">شركة طريق العامرة للمقاولات والاستثمار</strong><br />
                    جميع الحقوق محفوظة © 2025
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
