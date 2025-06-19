import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, Shield, Download, Upload, Database, HardDrive, Settings as SettingsIcon, Building, Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';

// Schema definitions
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const accountCategorySchema = z.object({
  name: z.string().min(1, 'اسم التصنيف مطلوب'),
  description: z.string().optional(),
});

const expenseTypeSchema = z.object({
  name: z.string().min(1, 'اسم نوع المصروف مطلوب'),
  description: z.string().optional(),
});

// Types
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

interface ExpenseType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseStatus {
  connected: boolean;
  responseTime: number;
}

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
type AccountCategoryValues = z.infer<typeof accountCategorySchema>;
type ExpenseTypeValues = z.infer<typeof expenseTypeSchema>;

interface SettingFieldProps {
  settings: Setting[];
  settingKey: string;
  label: string;
  type?: string;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [editingCategory, setEditingCategory] = useState<AccountCategory | null>(null);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Data fetching
  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: dbStatus } = useQuery<DatabaseStatus>({
    queryKey: ['/api/database/status'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: accountCategories = [] } = useQuery<AccountCategory[]>({
    queryKey: ['/api/account-categories'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: expenseTypes = [] } = useQuery<ExpenseType[]>({
    queryKey: ['/api/expense-types'],
    enabled: !!user && user.role === 'admin'
  });

  // Forms
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const categoryForm = useForm<AccountCategoryValues>({
    resolver: zodResolver(accountCategorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const expenseTypeForm = useForm<ExpenseTypeValues>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // API helper function
  const makeApiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
      throw new Error(error.message || 'حدث خطأ في العملية');
    }
    
    return response.json();
  };

  // Mutations
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      makeApiCall(`/api/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "تم",
        description: "تم حفظ الإعداد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChangeValues) =>
      makeApiCall('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "تم",
        description: "تم تغيير كلمة المرور بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: AccountCategoryValues) =>
      makeApiCall('/api/account-categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      categoryForm.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "تم",
        description: "تم إنشاء التصنيف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountCategoryValues }) =>
      makeApiCall(`/api/account-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      categoryForm.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "تم",
        description: "تم تحديث التصنيف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      makeApiCall(`/api/account-categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      toast({
        title: "تم",
        description: "تم حذف التصنيف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const createExpenseTypeMutation = useMutation({
    mutationFn: (data: ExpenseTypeValues) =>
      makeApiCall('/api/expense-types', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expense-types'] });
      expenseTypeForm.reset();
      setIsExpenseDialogOpen(false);
      setEditingExpenseType(null);
      toast({
        title: "تم",
        description: "تم إنشاء نوع المصروف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const updateExpenseTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseTypeValues }) =>
      makeApiCall(`/api/expense-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expense-types'] });
      expenseTypeForm.reset();
      setIsExpenseDialogOpen(false);
      setEditingExpenseType(null);
      toast({
        title: "تم",
        description: "تم تحديث نوع المصروف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const deleteExpenseTypeMutation = useMutation({
    mutationFn: (id: number) =>
      makeApiCall(`/api/expense-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expense-types'] });
      toast({
        title: "تم",
        description: "تم حذف نوع المصروف بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => makeApiCall('/api/backup', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "تم",
        description: "تم إنشاء النسخة الاحتياطية بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  // Event handlers
  function onPasswordChangeSubmit(values: PasswordChangeValues) {
    changePasswordMutation.mutate(values);
  }

  function onCategorySubmit(values: AccountCategoryValues) {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: values });
    } else {
      createCategoryMutation.mutate(values);
    }
  }

  const handleEditCategory = (category: AccountCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  function onExpenseTypeSubmit(values: ExpenseTypeValues) {
    if (editingExpenseType) {
      updateExpenseTypeMutation.mutate({ id: editingExpenseType.id, data: values });
    } else {
      createExpenseTypeMutation.mutate(values);
    }
  }

  const handleEditExpenseType = (expenseType: ExpenseType) => {
    setEditingExpenseType(expenseType);
    expenseTypeForm.reset({
      name: expenseType.name,
      description: expenseType.description || '',
    });
    setIsExpenseDialogOpen(true);
  };

  const handleSaveSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handleCreateBackup = () => {
    backupMutation.mutate();
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        await makeApiCall('/api/restore', {
          method: 'POST',
          body: JSON.stringify(backupData),
        });
        
        toast({
          title: "تم",
          description: "تم استعادة النسخة الاحتياطية بنجاح",
        });
        
        queryClient.invalidateQueries();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>غير مصرح</AlertTitle>
            <AlertDescription>
              ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent mb-3">
            إعدادات النظام
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            إدارة شاملة ومتقدمة لجميع إعدادات النظام والحسابات والأمان
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Navigation Cards */}
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 h-auto bg-transparent p-0">
            <TabsTrigger 
              value="general" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <SettingsIcon className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium text-center">إعدادات عامة</span>
                </CardContent>
              </Card>
            </TabsTrigger>

            <TabsTrigger 
              value="financial" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <Building className="h-6 w-6 text-orange-500 mb-2" />
                  <span className="text-xs font-medium text-center">إعدادات مالية</span>
                </CardContent>
              </Card>
            </TabsTrigger>

            <TabsTrigger 
              value="expense-types" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <Tag className="h-6 w-6 text-green-500 mb-2" />
                  <span className="text-xs font-medium text-center">أنواع المصاريف</span>
                </CardContent>
              </Card>
            </TabsTrigger>

            <TabsTrigger 
              value="system" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <Database className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-xs font-medium text-center">النظام</span>
                </CardContent>
              </Card>
            </TabsTrigger>

            <TabsTrigger 
              value="backup" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <HardDrive className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="text-xs font-medium text-center">النسخ الاحتياطي</span>
                </CardContent>
              </Card>
            </TabsTrigger>

            <TabsTrigger 
              value="security" 
              className="group h-auto p-0 bg-transparent border-0 data-[state=active]:bg-transparent hover:bg-transparent"
            >
              <Card className="w-full h-24 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group-data-[state=active]:ring-2 group-data-[state=active]:ring-primary group-data-[state=active]:bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-4">
                  <Shield className="h-6 w-6 text-red-500 mb-2" />
                  <span className="text-xs font-medium text-center">الأمان</span>
                </CardContent>
              </Card>
            </TabsTrigger>
          </TabsList>

          {/* Content Area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border min-h-[600px] p-6">
            {isLoading && (
              <div className="text-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحميل البيانات...</p>
              </div>
            )}

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <SettingField
                  settings={settings}
                  settingKey="company_name"
                  label="اسم الشركة"
                  onSave={handleSaveSetting}
                  isSaving={updateSettingMutation.isPending}
                />
                
                <SettingField
                  settings={settings}
                  settingKey="company_address"
                  label="عنوان الشركة"
                  onSave={handleSaveSetting}
                  isSaving={updateSettingMutation.isPending}
                />
                
                <SettingField
                  settings={settings}
                  settingKey="company_phone"
                  label="هاتف الشركة"
                  onSave={handleSaveSetting}
                  isSaving={updateSettingMutation.isPending}
                />
                
                <SettingField
                  settings={settings}
                  settingKey="company_email"
                  label="بريد الشركة الإلكتروني"
                  type="email"
                  onSave={handleSaveSetting}
                  isSaving={updateSettingMutation.isPending}
                />
              </div>
            </TabsContent>

            {/* Financial Settings */}
            <TabsContent value="financial" className="space-y-6">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    تصنيفات الحسابات
                  </CardTitle>
                  <CardDescription>
                    إدارة تصنيفات الحسابات المختلفة في النظام
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">التصنيفات الحالية</h3>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingCategory(null);
                          categoryForm.reset();
                        }}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة تصنيف جديد
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                          </DialogTitle>
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
                                    <Input {...field} />
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
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                              >
                                {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                )}
                                {editingCategory ? 'تحديث' : 'إضافة'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الوصف</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountCategories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={category.active ? "default" : "secondary"}>
                                {category.active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
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
                                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                                  disabled={deleteCategoryMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expense Types */}
            <TabsContent value="expense-types" className="space-y-6">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    أنواع المصاريف
                  </CardTitle>
                  <CardDescription>
                    إدارة أنواع المصاريف المختلفة للتصنيف التلقائي للمعاملات
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">الأنواع الحالية</h3>
                    <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingExpenseType(null);
                          expenseTypeForm.reset();
                        }}>
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة نوع جديد
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingExpenseType ? 'تعديل نوع المصروف' : 'إضافة نوع مصروف جديد'}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <Form {...expenseTypeForm}>
                          <form onSubmit={expenseTypeForm.handleSubmit(onExpenseTypeSubmit)} className="space-y-4">
                            <FormField
                              control={expenseTypeForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>اسم النوع</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={expenseTypeForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الوصف (اختياري)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                disabled={createExpenseTypeMutation.isPending || updateExpenseTypeMutation.isPending}
                              >
                                {(createExpenseTypeMutation.isPending || updateExpenseTypeMutation.isPending) && (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                )}
                                {editingExpenseType ? 'تحديث' : 'إضافة'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الوصف</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseTypes.map((expenseType) => (
                          <TableRow key={expenseType.id}>
                            <TableCell className="font-medium">{expenseType.name}</TableCell>
                            <TableCell>{expenseType.description || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={expenseType.isActive ? "default" : "secondary"}>
                                {expenseType.isActive ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditExpenseType(expenseType)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteExpenseTypeMutation.mutate(expenseType.id)}
                                  disabled={deleteExpenseTypeMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    حالة النظام
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {dbStatus && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <span>حالة قاعدة البيانات</span>
                        <Badge variant={dbStatus.connected ? "default" : "destructive"}>
                          {dbStatus.connected ? 'متصلة' : 'غير متصلة'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <span>وقت الاستجابة</span>
                        <Badge variant="outline">
                          {dbStatus.responseTime}ms
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup Settings */}
            <TabsContent value="backup" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Download className="h-5 w-5" />
                      إنشاء نسخة احتياطية
                    </CardTitle>
                    <CardDescription>
                      إنشاء نسخة احتياطية من جميع بيانات النظام
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Button 
                      onClick={handleCreateBackup}
                      disabled={backupMutation.isPending}
                      className="w-full"
                    >
                      {backupMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      )}
                      <Download className="h-4 w-4 ml-2" />
                      إنشاء نسخة احتياطية
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <Upload className="h-5 w-5" />
                      استعادة نسخة احتياطية
                    </CardTitle>
                    <CardDescription>
                      استعادة البيانات من نسخة احتياطية سابقة
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleRestoreBackup}
                      accept=".json"
                      className="hidden"
                    />
                    <Button 
                      onClick={openFileDialog}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      اختيار ملف للاستعادة
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription>
                    تحديث كلمة مرور حساب المدير
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4 max-w-md">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور الحالية</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                        تغيير كلمة المرور
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function SettingField({ settings, settingKey, label, type = 'text', onSave, isSaving }: SettingFieldProps) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  const setting = settings.find(s => s.key === settingKey);

  useEffect(() => {
    if (setting) {
      setValue(setting.value);
    }
  }, [setting]);

  const handleSave = async () => {
    await onSave(settingKey, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-2">
          <Input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSave}
            disabled={isSaving || !value || value === setting?.value}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              'حفظ'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}