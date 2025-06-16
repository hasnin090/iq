import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  SaveIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeOffIcon, 
  InfoIcon, 
  UserIcon, 
  ShieldIcon, 
  LockIcon 
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  active: boolean;
}

interface UserListProps {
  users: User[];
  isLoading: boolean;
  onUserUpdated: () => void;
  currentUserId: number | undefined;
}

// مخطط بيانات تعديل المستخدم
const userEditSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يحتوي على الأقل 3 أحرف"),
  role: z.enum(["admin", "user", "viewer"], {
    required_error: "الصلاحية مطلوبة",
  }),
  permissions: z.array(z.string()).optional(),
  password: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

const permissions = [
  { id: "viewReports", label: "عرض التقارير", icon: <EyeIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "manageProjects", label: "إدارة المشاريع", icon: <KeyIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "manageTransactions", label: "إدارة المعاملات المالية", icon: <KeyIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "viewOnly", label: "صلاحيات المشاهدة فقط", icon: <EyeOffIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "hideRevenue", label: "إخفاء الإيرادات", icon: <EyeOffIcon className="h-3.5 w-3.5 ml-1.5 text-red-400" /> },
  { id: "manageDocuments", label: "إدارة المستندات", icon: <ShieldIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
];

interface UserEditFormProps {
  user: User;
  onSubmit: (data: Partial<User>) => void;
  isLoading: boolean;
}

function UserEditForm({ user, onSubmit, isLoading }: UserEditFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(user.role === "user");
  
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      role: user.role as "admin" | "user" | "viewer",
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      password: "",
    },
  });

  function onFormSubmit(data: UserEditFormValues) {
    // إذا كانت كلمة المرور فارغة، قم بحذفها من البيانات المرسلة
    if (!data.password) {
      delete data.password;
    }
    
    onSubmit(data);
  }

  // تحديث دور المستخدم وعرض/إخفاء الصلاحيات
  const handleRoleChange = (role: string) => {
    form.setValue("role", role as "admin" | "user" | "viewer");
    setShowPermissions(role === "user" || role === "viewer");
    
    // إعادة تعيين الصلاحيات حسب الدور
    if (role === "admin") {
      form.setValue("permissions", []);
    } else if (role === "viewer") {
      form.setValue("permissions", ["viewOnly"]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 mt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full rounded-lg bg-white border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  disabled={isLoading}
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
              <FormLabel className="flex items-center">
                كلمة المرور (اختياري)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-blue-50 text-blue-900 border-blue-200">
                      <p>اتركها فارغة إذا لم ترغب بتغيير كلمة المرور</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div className="flex space-x-space-x-reverse space-x-2">
                <FormControl>
                  <div className="relative flex-1">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="اتركها فارغة للاحتفاظ بكلمة المرور الحالية"
                      className="w-full rounded-lg bg-white border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 pr-10"
                      disabled={isLoading}
                    />
                    <LockIcon className="absolute top-2.5 right-3 h-5 w-5 text-slate-400" />
                    <button
                      type="button"
                      className="absolute top-2.5 left-3 h-5 w-5 text-slate-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الصلاحية</FormLabel>
              <Select 
                onValueChange={handleRoleChange} 
                value={field.value} 
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-10 rounded-lg bg-white border border-blue-100 hover:border-blue-300">
                    <SelectValue placeholder="اختر الصلاحية" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  <SelectItem value="admin" className="flex items-center">
                    <div className="flex items-center">
                      <ShieldIcon className="h-4 w-4 ml-2 text-red-500" />
                      مدير
                    </div>
                  </SelectItem>
                  <SelectItem value="user" className="flex items-center">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 ml-2 text-blue-500" />
                      مستخدم
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer" className="flex items-center">
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 ml-2 text-gray-500" />
                      مشاهدة فقط
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-gray-600 dark:text-gray-400">
                {field.value === "admin" 
                  ? "المدير لديه صلاحيات كاملة للنظام" 
                  : field.value === "viewer"
                  ? "مشاهدة فقط - إمكانية عرض البيانات بدون تعديل"
                  : "المستخدم يحتاج لتحديد صلاحيات محددة"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPermissions && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <FormLabel className="mb-2 block font-medium text-gray-800 dark:text-gray-200">الصلاحيات:</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions.map((permission) => (
                <FormField
                  key={permission.id}
                  control={form.control}
                  name="permissions"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={permission.id}
                        className="flex flex-row items-center space-x-reverse space-x-2 space-y-0 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FormControl>
                          <Checkbox
                            checked={Array.isArray(field.value) && field.value.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              const currentPermissions = Array.isArray(field.value) ? field.value : [];
                              return checked
                                ? field.onChange([...currentPermissions, permission.id])
                                : field.onChange(
                                    currentPermissions.filter((value) => value !== permission.id)
                                  );
                            }}
                            className="border-blue-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer flex items-center text-gray-700 dark:text-gray-300">
                          {permission.icon}
                          {permission.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <SaveIcon className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function UserList({ users, isLoading, onUserUpdated, currentUserId }: UserListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/users/${id}`, 'DELETE', undefined);
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم بنجاح",
      });
      onUserUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المستخدم",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: {id: number, userData: Partial<User>}) => {
      return apiRequest(`/api/users/${data.id}`, 'PUT', data.userData);
    },
    onSuccess: () => {
      toast({
        title: "تم التعديل بنجاح",
        description: "تم تعديل بيانات المستخدم بنجاح",
      });
      setEditDialogOpen(false);
      onUserUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تعديل المستخدم",
      });
    },
  });
  
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditDialogOpen(true);
  };
  
  const handleUserUpdate = (userData: Partial<User>) => {
    if (userToEdit) {
      updateMutation.mutate({
        id: userToEdit.id,
        userData
      });
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary">مدير</Badge>;
      case 'user':
        return <Badge className="bg-secondary">مستخدم</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'viewReports': return 'عرض التقارير';
      case 'manageProjects': return 'إدارة المشاريع';
      case 'manageTransactions': return 'إدارة المعاملات المالية';
      case 'manageDocuments': return 'إدارة المستندات';
      default: return permission;
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا يوجد مستخدمين حتى الآن</p>
        <p className="text-sm text-muted mt-2">أضف مستخدم جديد باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      {/* جدول للشاشات المتوسطة والكبيرة */}
      <div className="hidden md:block bg-secondary-light rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary">
            <thead>
              <tr>
                <th scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">اسم المستخدم</th>
                <th scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الاسم الكامل</th>
                <th scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحية</th>
                <th scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحيات</th>
                <th scope="col" className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-light">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm text-neutral-light">
                    {user.username}
                    {currentUserId === user.id && (
                      <span className="text-xs text-primary-light mr-2">(أنت)</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-neutral-light">
                    {user.name}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-neutral-light">
                    {user.role === 'admin' ? (
                      <span className="text-xs">جميع الصلاحيات</span>
                    ) : user.permissions && user.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {getPermissionText(permission)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs">لا توجد صلاحيات</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">
                    <div className="flex space-x-reverse space-x-2">
                      <button 
                        className="text-primary-light hover:text-primary-dark transition-colors p-1 rounded-full hover:bg-blue-50"
                        onClick={() => handleEditClick(user)}
                        title="تعديل المستخدم"
                      >
                        <UserIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-destructive hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                        onClick={() => handleDeleteClick(user)}
                        disabled={currentUserId === user.id}
                        title={currentUserId === user.id ? "لا يمكن حذف المستخدم الحالي" : "حذف المستخدم"}
                      >
                        <ShieldIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* بطاقات للشاشات الصغيرة */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {users.map((user) => (
          <div 
            key={user.id}
            className="bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))/70] flex items-center justify-center shadow-sm ml-2.5">
                  <UserIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center">
                    {user.username}
                    {currentUserId === user.id && (
                      <span className="text-xs text-primary-light mr-1.5 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.5 rounded-md">(أنت)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.name}</div>
                </div>
              </div>
              {getRoleBadge(user.role)}
            </div>
            
            {/* الصلاحيات */}
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">الصلاحيات:</span>
              {user.role === 'admin' ? (
                <div className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md inline-block">
                  جميع الصلاحيات
                </div>
              ) : user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {getPermissionText(permission)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 px-2 py-1 rounded-md inline-block">
                  لا توجد صلاحيات
                </div>
              )}
            </div>
            
            {/* أزرار الإجراءات */}
            <div className="flex justify-end gap-2 mt-2 border-t dark:border-gray-700 pt-3">
              {/* زر التعديل تم إخفاؤه من نافذة المدير (admin) والإبقاء عليه للآخرين */}
              {user.role !== 'admin' && (
                <button 
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                  onClick={() => handleEditClick(user)}
                >
                  <UserIcon className="h-3.5 w-3.5 ml-1.5" />
                  تعديل
                </button>
              )}
              {currentUserId !== user.id && (
                <button 
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                  onClick={() => handleDeleteClick(user)}
                >
                  <ShieldIcon className="h-3.5 w-3.5 ml-1.5" />
                  حذف
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-red-600 dark:text-red-400 flex items-center">
              <ShieldIcon className="h-5 w-5 ml-2 text-red-500 dark:text-red-400" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-sm py-1.5 px-3">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 text-sm py-1.5 px-3"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 ml-2 text-blue-600 dark:text-blue-400" />
                تعديل المستخدم
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              قم بتعديل بيانات المستخدم ثم اضغط على حفظ لإكمال العملية.
            </DialogDescription>
          </DialogHeader>
          
          {userToEdit && (
            <UserEditForm 
              user={userToEdit} 
              onSubmit={handleUserUpdate} 
              isLoading={updateMutation.isPending} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
