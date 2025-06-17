import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, Shield, Key, Download, Upload, Database, FileText, HardDrive, AlertTriangle, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

interface AccountCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
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

// تعريف مخطط (schema) لتصنيفات أنواع الحسابات
const accountCategorySchema = z.object({
  name: z.string().min(1, "اسم التصنيف مطلوب"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
type AccountCategoryValues = z.infer<typeof accountCategorySchema>;

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCategory, setEditingCategory] = useState<AccountCategory | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  const { data: settings, isLoading, error } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Account Categories Query
  const { data: accountCategories = [], isLoading: categoriesLoading } = useQuery<AccountCategory[]>({
    queryKey: ['/api/account-categories'],
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // Account Categories Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: AccountCategoryValues) => {
      return apiRequest('/api/account-categories', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      setShowCategoryDialog(false);
      setEditingCategory(null);
      toast({
        title: "تم إنشاء التصنيف",
        description: "تم إنشاء تصنيف الحساب بنجاح",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إنشاء التصنيف",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountCategoryValues> }) => {
      return apiRequest(`/api/account-categories/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      setShowCategoryDialog(false);
      setEditingCategory(null);
      toast({
        title: "تم تحديث التصنيف",
        description: "تم تحديث تصنيف الحساب بنجاح",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحديث التصنيف",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/account-categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      toast({
        title: "تم حذف التصنيف",
        description: "تم حذف تصنيف الحساب بنجاح",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حذف التصنيف",
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

  // نموذج تصنيفات أنواع الحسابات
  const categoryForm = useForm<AccountCategoryValues>({
    resolver: zodResolver(accountCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
    },
  });
  
  // معالج إرسال نموذج تغيير كلمة المرور
  function onPasswordChangeSubmit(values: PasswordChangeValues) {
    passwordChangeMutation.mutate(values);
  }

  // معالج إرسال نموذج تصنيف الحساب
  function onCategorySubmit(values: AccountCategoryValues) {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: values });
    } else {
      createCategoryMutation.mutate(values);
    }
  }

  // فتح حوار إضافة تصنيف جديد
  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: '',
      description: '',
      active: true,
    });
    setShowCategoryDialog(true);
  };

  // فتح حوار تعديل تصنيف
  const handleEditCategory = (category: AccountCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || '',
      active: category.active,
    });
    setShowCategoryDialog(true);
  };

  // حذف تصنيف
  const handleDeleteCategory = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
      deleteCategoryMutation.mutate(id);
    }
  };
  
  const handleSaveSetting = (key: string, value: string) => {
    mutation.mutate({ key, value });
  };

  // mutations للنسخ الاحتياطي
  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest('/api/backup/create', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup/list'] });
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم إنشاء النسخة الاحتياطية بنجاح",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية",
      });
    },
  });

  const createEmergencyBackupMutation = useMutation({
    mutationFn: (operation: string) => apiRequest('/api/backup/emergency', 'POST', { operation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backup/list'] });
      toast({
        title: "تم إنشاء النسخة الاحتياطية الطارئة",
        description: "تم إنشاء النسخة الاحتياطية الطارئة بنجاح",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية الطارئة",
      });
    },
  });

  // query لجلب قائمة النسخ الاحتياطية
  const { data: backupList, isLoading: backupListLoading } = useQuery<{backups: any[]}>({
    queryKey: ['/api/backup/list'],
    enabled: activeTab === 'backup',
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
        <TabsList className="flex w-full justify-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-6 overflow-x-auto min-h-[48px]">
          <TabsTrigger 
            value="general" 
            className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="hidden sm:inline">إعدادات عامة</span>
            <span className="sm:hidden">عام</span>
          </TabsTrigger>
          <TabsTrigger 
            value="financial" 
            className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="hidden sm:inline">إعدادات مالية</span>
            <span className="sm:hidden">مالي</span>
          </TabsTrigger>
          <TabsTrigger 
            value="system" 
            className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="hidden sm:inline">إعدادات النظام</span>
            <span className="sm:hidden">نظام</span>
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="hidden sm:inline">النسخ الاحتياطي</span>
            <span className="sm:hidden">نسخ</span>
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="flex-shrink-0 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="hidden sm:inline">تغيير كلمة المرور</span>
            <span className="sm:hidden">أمان</span>
          </TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="text-center py-20">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 ml-2" />
              <AlertTitle>خطأ في تحميل البيانات</AlertTitle>
              <AlertDescription>
                تعذر تحميل بيانات الإعدادات. يرجى التأكد من تسجيل الدخول بشكل صحيح.
              </AlertDescription>
            </Alert>
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
              <div className="space-y-6">
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

                {/* Account Categories Management */}
                <Card className="bg-secondary-light">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="ml-2 h-5 w-5 text-primary-light" />
                      تصنيفات أنواع الحسابات
                    </CardTitle>
                    <CardDescription>
                      إدارة تصنيفات أنواع الحسابات المستخدمة في تصنيف المصروفات
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">التصنيفات المتاحة</h3>
                        <p className="text-sm text-muted-foreground">
                          يمكنك إضافة أو تعديل أو حذف تصنيفات أنواع الحسابات
                        </p>
                      </div>
                      <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                        <Plus className="ml-2 h-4 w-4" />
                        إضافة تصنيف
                      </Button>
                    </div>

                    {categoriesLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-muted-foreground">جاري تحميل التصنيفات...</p>
                      </div>
                    ) : accountCategories.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تصنيفات</h3>
                        <p className="text-gray-500 mb-4">ابدأ بإضافة تصنيف أول لأنواع الحسابات</p>
                        <Button onClick={handleAddCategory} variant="outline">
                          <Plus className="ml-2 h-4 w-4" />
                          إضافة تصنيف جديد
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">اسم التصنيف</TableHead>
                            <TableHead className="text-right">الوصف</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountCategories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>{category.description || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={category.active ? "default" : "secondary"}>
                                  {category.active ? "نشط" : "غير نشط"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(category.createdAt).toLocaleDateString('ar-SA')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Button 
                        onClick={downloadBackup}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="ml-2 h-4 w-4" />
                        تنزيل نسخة احتياطية
                      </Button>
                      
                      <Button 
                        onClick={() => createBackupMutation.mutate()}
                        disabled={createBackupMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {createBackupMutation.isPending ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Database className="ml-2 h-4 w-4" />
                        )}
                        إنشاء نسخة احتياطية
                      </Button>
                    </div>
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

                  {/* النسخ الاحتياطية الطارئة */}
                  <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">نسخة احتياطية طارئة</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          إنشاء نسخة احتياطية فورية قبل عملية حساسة
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => createEmergencyBackupMutation.mutate("نسخة احتياطية طارئة يدوية")}
                      disabled={createEmergencyBackupMutation.isPending}
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      {createEmergencyBackupMutation.isPending ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="ml-2 h-4 w-4" />
                      )}
                      إنشاء نسخة احتياطية طارئة
                    </Button>
                  </div>

                  {/* قائمة النسخ الاحتياطية المتوفرة */}
                  <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">النسخ الاحتياطية المتوفرة</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          قائمة بالنسخ الاحتياطية المحفوظة في النظام (يتم إنشاء نسخة تلقائية يومياً في الساعة 2:00 صباحاً)
                        </p>
                      </div>
                    </div>
                    
                    {backupListLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        <span className="mr-2 text-gray-500">جاري تحميل قائمة النسخ...</span>
                      </div>
                    ) : backupList && backupList.backups && backupList.backups.length > 0 ? (
                      <div className="space-y-2">
                        {backupList.backups.map((backup: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{backup.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(backup.date).toLocaleString('ar-SA')} • {backup.size ? `${(backup.size / 1024 / 1024).toFixed(2)} MB` : 'غير محدد'}
                              </div>
                            </div>
                            <Database className="h-4 w-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        لا توجد نسخ احتياطية متوفرة
                      </div>
                    )}
                  </div>

                  {/* معلومات إضافية */}
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>نظام النسخ الاحتياطي التلقائي:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• يتم إنشاء نسخة احتياطية تلقائية يومياً في الساعة 2:00 صباحاً</li>
                        <li>• يتم الاحتفاظ بـ 30 نسخة احتياطية (حوالي شهر)</li>
                        <li>• النسخ الأقدم يتم حذفها تلقائياً لتوفير المساحة</li>
                        <li>• يمكن إنشاء نسخ احتياطية يدوية في أي وقت</li>
                        <li>• النسخ الطارئة مناسبة قبل العمليات الحساسة</li>
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

      {/* Account Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'تعديل تصنيف الحساب' : 'إضافة تصنيف جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'قم بتعديل بيانات تصنيف الحساب'
                : 'أدخل بيانات تصنيف الحساب الجديد'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم التصنيف</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: كراسي، كتب، قرطاسية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Input placeholder="وصف مختصر للتصنيف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>حالة التصنيف</FormLabel>
                      <FormDescription>
                        تفعيل أو إلغاء تفعيل التصنيف
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCategoryDialog(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      {editingCategory ? 'جاري التحديث...' : 'جاري الإضافة...'}
                    </>
                  ) : (
                    editingCategory ? 'تحديث' : 'إضافة'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
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
