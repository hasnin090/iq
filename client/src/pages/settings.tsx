import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, Shield, Key, Download, Upload, Database, FileText, HardDrive, AlertTriangle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

// تعريف مخطط (schema) لتغيير كلمة المرور
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف"),
  confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });
  
  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => {
      return apiRequest(`/api/settings/${key}`, 'PUT', { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث الإعدادات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تحديث الإعدادات",
      });
    },
  });
  
  // إضافة mutation لتغيير كلمة المرور
  const passwordChangeMutation = useMutation({
    mutationFn: (data: PasswordChangeValues) => {
      return apiRequest(`/api/users/change-password`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordChangeForm.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تغيير كلمة المرور",
      });
    },
  });
  
  // نموذج تغيير كلمة المرور
  const passwordChangeForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // معالج إرسال نموذج تغيير كلمة المرور
  function onPasswordChangeSubmit(values: PasswordChangeValues) {
    passwordChangeMutation.mutate(values);
  }
  
  const handleSaveSetting = (key: string, value: string) => {
    mutation.mutate({ key, value });
  };

  // دوال النسخ الاحتياطية
  const downloadBackup = async () => {
    try {
      const response = await apiRequest('/api/backup/download', 'GET');
      
      // إنشاء رابط تنزيل
      const blob = new Blob([JSON.stringify(response, null, 2)], { 
        type: 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تنزيل النسخة الاحتياطية بنجاح",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        const response = await apiRequest('/api/backup/restore', 'POST', backupData);
        
        toast({
          title: "تم استعادة النسخة الاحتياطية",
          description: "تم استعادة البيانات بنجاح",
        });
        
        // إعادة تحميل الصفحة بعد الاستعادة
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في استعادة النسخة الاحتياطية",
        });
      }
    };
    reader.readAsText(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-8 py-6">
        <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">الإعدادات</h2>
        
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4 ml-2" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">الإعدادات</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="general">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="general">إعدادات عامة</TabsTrigger>
          <TabsTrigger value="financial">إعدادات مالية</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="security">تغيير كلمة المرور</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="text-center py-20">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            <TabsContent value="general">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات عامة</CardTitle>
                  <CardDescription>
                    إعدادات عامة للنظام مثل اسم الشركة والعنوان
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyName" 
                    label="اسم الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyAddress" 
                    label="عنوان الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="companyPhone" 
                    label="رقم هاتف الشركة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات مالية</CardTitle>
                  <CardDescription>
                    إعدادات خاصة بالنظام المالي مثل العملة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="currency" 
                    label="رمز العملة" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="taxRate" 
                    label="نسبة الضريبة (%)" 
                    type="number"
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle>إعدادات النظام</CardTitle>
                  <CardDescription>
                    إعدادات خاصة بنظام المحاسبة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingField 
                    settings={settings || []} 
                    settingKey="dateFormat" 
                    label="صيغة التاريخ" 
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                  
                  <SettingField 
                    settings={settings || []} 
                    settingKey="sessionTimeout" 
                    label="مهلة انتهاء الجلسة (بالدقائق)" 
                    type="number"
                    onSave={handleSaveSetting}
                    isSaving={mutation.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="ml-2 h-5 w-5 text-primary-light" />
                    النسخ الاحتياطية
                  </CardTitle>
                  <CardDescription>
                    إنشاء واستعادة النسخ الاحتياطية لكامل بيانات النظام
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* تنزيل نسخة احتياطية */}
                  <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Database className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تنزيل نسخة احتياطية</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          إنشاء نسخة احتياطية شاملة تتضمن:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 ml-2" />
                            جميع المعاملات المالية والأرشيف
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 ml-2" />
                            بيانات المشاريع والمستخدمين
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 ml-2" />
                            المستندات والملفات المرفقة
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-600 ml-2" />
                            سجل النشاطات والإعدادات
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Button 
                      onClick={downloadBackup}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل النسخة الاحتياطية
                    </Button>
                  </div>

                  {/* رفع نسخة احتياطية */}
                  <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Upload className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">استعادة نسخة احتياطية</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          استعادة البيانات من نسخة احتياطية سابقة
                        </p>
                        <Alert className="mt-3 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800 dark:text-orange-200">
                            تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية المختارة.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                    
                    <Button 
                      onClick={openFileDialog}
                      variant="outline"
                      className="w-full mt-4 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                    >
                      <Upload className="ml-2 h-4 w-4" />
                      اختيار ملف النسخة الاحتياطية
                    </Button>
                  </div>

                  {/* معلومات إضافية */}
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>ملاحظات مهمة:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• يتم حفظ النسخة الاحتياطية بصيغة JSON</li>
                        <li>• تأكد من حفظ النسخ الاحتياطية في مكان آمن</li>
                        <li>• ننصح بإنشاء نسخة احتياطية بشكل دوري</li>
                        <li>• تحقق من صحة ملف النسخة الاحتياطية قبل الاستعادة</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card className="bg-secondary-light">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="ml-2 h-5 w-5 text-primary-light" />
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription>
                    تغيير كلمة المرور الخاصة بحسابك في النظام
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-4">
                  <Form {...passwordChangeForm}>
                    <form onSubmit={passwordChangeForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
                      <FormField
                        control={passwordChangeForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral font-medium">كلمة المرور الحالية</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="أدخل كلمة المرور الحالية"
                                className="bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-destructive text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordChangeForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral font-medium">كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="أدخل كلمة المرور الجديدة"
                                className="bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-destructive text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordChangeForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral font-medium">تأكيد كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="أدخل كلمة المرور الجديدة مرة أخرى"
                                className="bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-destructive text-sm" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4">
                        <Button 
                          type="submit" 
                          className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all"
                          disabled={passwordChangeMutation.isPending}
                        >
                          {passwordChangeMutation.isPending ? (
                            <>
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              جاري التغيير...
                            </>
                          ) : (
                            <>
                              <Key className="ml-2 h-4 w-4" />
                              تغيير كلمة المرور
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

interface SettingFieldProps {
  settings: Setting[];
  settingKey: string;
  label: string;
  type?: string;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}

function SettingField({ settings, settingKey, label, type = 'text', onSave, isSaving }: SettingFieldProps) {
  const setting = settings.find(s => s.key === settingKey);
  const [value, setValue] = useState(setting?.value || '');
  const [saved, setSaved] = useState(false);
  
  const handleSave = () => {
    onSave(settingKey, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <div className="md:col-span-2">
        <Label htmlFor={settingKey} className="block text-sm font-medium text-neutral mb-1">{label}</Label>
        <Input
          id={settingKey}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
        />
      </div>
      <div>
        <Button
          onClick={handleSave}
          disabled={isSaving || value === setting?.value}
          className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all w-full"
        >
          {isSaving ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="ml-2 h-4 w-4" />
          ) : null}
          حفظ
        </Button>
      </div>
    </div>
  );
}
