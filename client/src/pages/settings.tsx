import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2, Shield, Download, Upload, Database, HardDrive, Settings as SettingsIcon, Building, Tag, Plus, Edit, Trash2, Cloud, Zap, Link, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';

// Schema definitions
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
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

// Type definitions
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

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Collapsible states for dropdown sections
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isExpenseTypesOpen, setIsExpenseTypesOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AccountCategory | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null);

  // Check if user has admin permissions
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Data queries
  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    enabled: !!user && user.role === 'admin'
  });

  const { data: dbStatus } = useQuery<DatabaseStatus>({
    queryKey: ['/api/database/status'],
    refetchInterval: 30000,
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
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChangeValues) =>
      makeApiCall('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordForm.reset();
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
      toast({
        title: "تم إنشاء التصنيف",
        description: "تم إنشاء تصنيف الحساب بنجاح",
      });
      categoryForm.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
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
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-categories'] });
      toast({
        title: "تم تحديث التصنيف",
        description: "تم تحديث تصنيف الحساب بنجاح",
      });
      categoryForm.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
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
        title: "تم حذف التصنيف",
        description: "تم حذف تصنيف الحساب بنجاح",
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
      toast({
        title: "تم إنشاء نوع المصروف",
        description: "تم إنشاء نوع المصروف بنجاح",
      });
      expenseTypeForm.reset();
      setIsExpenseDialogOpen(false);
      setEditingExpenseType(null);
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
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expense-types'] });
      toast({
        title: "تم تحديث نوع المصروف",
        description: "تم تحديث نوع المصروف بنجاح",
      });
      expenseTypeForm.reset();
      setIsExpenseDialogOpen(false);
      setEditingExpenseType(null);
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
        title: "تم حذف نوع المصروف",
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
    mutationFn: () => makeApiCall('/api/backup/create', { method: 'POST' }),
    onSuccess: (data: any) => {
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: `تم إنشاء النسخة الاحتياطية بنجاح: ${data.backupPath}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ في النسخ الاحتياطي",
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

  const handleCreateBackup = () => {
    backupMutation.mutate();
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await makeApiCall('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      });
      
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
      toast({
        title: "تم حفظ الإعداد",
        description: "تم حفظ الإعداد بنجاح",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الإعداد",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <SettingsIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">إعدادات النظام</h1>
        <p className="text-muted-foreground">إدارة شاملة لجميع إعدادات النظام والحسابات والأمان</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-4">
        {/* General Settings */}
        <Collapsible open={isGeneralOpen} onOpenChange={setIsGeneralOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>الإعدادات العامة</CardTitle>
                      <CardDescription>إعدادات الشركة والمعلومات الأساسية</CardDescription>
                    </div>
                  </div>
                  {isGeneralOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <SettingField 
                    settings={settings}
                    settingKey="company_name"
                    label="اسم الشركة"
                    onSave={handleSaveSetting}
                    isSaving={false}
                  />
                  <SettingField 
                    settings={settings}
                    settingKey="company_address"
                    label="عنوان الشركة"
                    onSave={handleSaveSetting}
                    isSaving={false}
                  />
                  <SettingField 
                    settings={settings}
                    settingKey="company_phone"
                    label="هاتف الشركة"
                    type="tel"
                    onSave={handleSaveSetting}
                    isSaving={false}
                  />
                  <SettingField 
                    settings={settings}
                    settingKey="company_email"
                    label="بريد الشركة الإلكتروني"
                    type="email"
                    onSave={handleSaveSetting}
                    isSaving={false}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Expense Types */}
        <Collapsible open={isExpenseTypesOpen} onOpenChange={setIsExpenseTypesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>أنواع المصاريف</CardTitle>
                      <CardDescription>إدارة تصنيفات المصاريف في النظام</CardDescription>
                    </div>
                  </div>
                  {isExpenseTypesOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">أنواع المصاريف</h3>
                  <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setEditingExpenseType(null);
                          expenseTypeForm.reset({ name: '', description: '' });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة نوع مصروف
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingExpenseType ? 'تعديل نوع المصروف' : 'إضافة نوع مصروف جديد'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingExpenseType 
                            ? 'قم بتعديل بيانات نوع المصروف' 
                            : 'أدخل بيانات نوع المصروف الجديد'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...expenseTypeForm}>
                        <form onSubmit={expenseTypeForm.handleSubmit(onExpenseTypeSubmit)} className="space-y-4">
                          <FormField
                            control={expenseTypeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>اسم نوع المصروف</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="مثال: وقود، صيانة، مكتبية" />
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
                                  <Textarea {...field} placeholder="وصف مختصر لنوع المصروف" />
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* System Status */}
        <Collapsible open={isSystemOpen} onOpenChange={setIsSystemOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>حالة النظام</CardTitle>
                      <CardDescription>مراقبة حالة قاعدة البيانات والاتصالات</CardDescription>
                    </div>
                  </div>
                  {isSystemOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Backup Settings */}
        <Collapsible open={isBackupOpen} onOpenChange={setIsBackupOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>النسخ الاحتياطي</CardTitle>
                      <CardDescription>إدارة النسخ الاحتياطية للنظام</CardDescription>
                    </div>
                  </div>
                  {isBackupOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
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
                        إنشاء نسخة احتياطية
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Integration Settings */}
        <Collapsible open={isIntegrationOpen} onOpenChange={setIsIntegrationOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>إعدادات التكامل</CardTitle>
                      <CardDescription>إدارة التكاملات مع الأنظمة والخدمات الخارجية</CardDescription>
                    </div>
                  </div>
                  {isIntegrationOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Firebase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      تكامل مع خدمات Firebase للمصادقة والتخزين
                    </p>
                    <Badge variant="default">متصل</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Supabase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      تكامل مع Supabase لقاعدة البيانات والتخزين
                    </p>
                    <Badge variant="default">متصل</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">WhatsApp Business</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      استقبال الملفات عبر رسائل WhatsApp
                    </p>
                    <Badge variant="outline">غير مفعل</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Google Drive</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      نسخ احتياطي تلقائي إلى Google Drive
                    </p>
                    <Badge variant="outline">غير مفعل</Badge>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Database Management */}
        <Collapsible open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>إدارة قواعد البيانات</CardTitle>
                      <CardDescription>مراقبة وإدارة قواعد البيانات الأساسية والاحتياطية</CardDescription>
                    </div>
                  </div>
                  {isDatabaseOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">قاعدة البيانات الأساسية</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      PostgreSQL - Neon Database
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">نشط</Badge>
                      {dbStatus && (
                        <span className="text-xs text-muted-foreground">
                          {dbStatus.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">قاعدة البيانات الاحتياطية</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Supabase PostgreSQL
                    </p>
                    <Badge variant="secondary">احتياطي</Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">إجراءات قاعدة البيانات</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      فحص الاتصال
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      مزامنة البيانات
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      تصدير البيانات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Hybrid Storage */}
        <Collapsible open={isStorageOpen} onOpenChange={setIsStorageOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>إدارة التخزين المختلط</CardTitle>
                      <CardDescription>إعدادات التخزين المحلي والسحابي للملفات والمرفقات</CardDescription>
                    </div>
                  </div>
                  {isStorageOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">التخزين المحلي</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      الملفات المحفوظة على الخادم المحلي
                    </p>
                    <Badge variant="default">أساسي</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Supabase Storage</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      تخزين سحابي احتياطي
                    </p>
                    <Badge variant="secondary">احتياطي</Badge>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">Firebase Storage</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      تخزين سحابي ثانوي
                    </p>
                    <Badge variant="outline">ثانوي</Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">إحصائيات التخزين</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">إجمالي الملفات</div>
                      <div className="text-2xl font-bold">1,247</div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">المساحة المستخدمة</div>
                      <div className="text-2xl font-bold">2.4 GB</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">إجراءات التخزين</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm">
                      <Cloud className="h-4 w-4 mr-2" />
                      مزامنة الملفات
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      رفع إلى السحابة
                    </Button>
                    <Button variant="outline" size="sm">
                      <HardDrive className="h-4 w-4 mr-2" />
                      تنظيف الملفات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Supabase Status */}
        <Collapsible open={isSupabaseOpen} onOpenChange={setIsSupabaseOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>حالة Supabase</CardTitle>
                      <CardDescription>مراقبة تفصيلية لخدمات Supabase المتصلة</CardDescription>
                    </div>
                  </div>
                  {isSupabaseOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">قاعدة البيانات</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">الحالة</span>
                        <Badge variant="default">متصل</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">وقت الاستجابة</span>
                        <span className="text-sm font-mono">45ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">آخر مزامنة</span>
                        <span className="text-sm">منذ 5 دقائق</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">التخزين</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">الحالة</span>
                        <Badge variant="default">متصل</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">الملفات المرفوعة</span>
                        <span className="text-sm font-mono">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">المساحة المستخدمة</span>
                        <span className="text-sm">2.4 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">المعايير والإحصائيات</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">المعاملات المزامنة</div>
                      <div className="text-xl font-bold text-green-600">4,532</div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">المشاريع المزامنة</div>
                      <div className="text-xl font-bold text-blue-600">12</div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">المستخدمين المزامنين</div>
                      <div className="text-xl font-bold text-purple-600">8</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">إجراءات Supabase</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm">
                      <Activity className="h-4 w-4 mr-2" />
                      فحص الاتصال
                    </Button>
                    <Button variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      مزامنة فورية
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      استيراد البيانات
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      تصدير البيانات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Security Settings */}
        <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>الأمان وكلمة المرور</CardTitle>
                      <CardDescription>إعدادات الأمان وتغيير كلمة المرور</CardDescription>
                    </div>
                  </div>
                  {isSecurityOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
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
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  // Find the setting value from the array
  const currentSetting = settings.find(s => s.key === settingKey);
  const currentValue = currentSetting?.value || '';

  // Update local state when settings change
  useState(() => {
    setValue(currentValue);
  });

  const handleSave = async () => {
    if (value !== currentValue) {
      await onSave(settingKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`أدخل ${label}`}
        />
        <Button
          onClick={handleSave}
          disabled={isSaving || value === currentValue}
          variant={saved ? "default" : "outline"}
          size="sm"
        >
          {saved ? (
            <Check className="h-4 w-4" />
          ) : (
            "حفظ"
          )}
        </Button>
      </div>
    </div>
  );
}