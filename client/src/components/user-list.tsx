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
  AtSignIcon, 
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
  email: z.string().email("البريد الإلكتروني غير صالح"),
  role: z.enum(["admin", "user"], {
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
      email: user.email,
      role: user.role as "admin" | "user",
      permissions: user.permissions || [],
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
    form.setValue("role", role as "admin" | "user");
    setShowPermissions(role === "user");
    
    // إذا تم تغيير الدور إلى مدير، قم بإعادة تعيين الصلاحيات
    if (role === "admin") {
      form.setValue("permissions", []);
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    className="w-full rounded-lg bg-white border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 pr-10"
                    disabled={isLoading}
                  />
                  <AtSignIcon className="absolute top-2.5 right-3 h-5 w-5 text-slate-400" />
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
                <SelectContent>
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
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === "admin" 
                  ? "المدير لديه صلاحيات كاملة للنظام" 
                  : "المستخدم يحتاج لتحديد صلاحيات محددة"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPermissions && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <FormLabel className="mb-2 block font-medium text-blue-700">الصلاحيات:</FormLabel>
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
                        className="flex flex-row items-center space-x-reverse space-x-2 space-y-0 py-1.5 px-2 rounded-lg hover:bg-blue-100/50"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              const currentPermissions = field.value || [];
                              return checked
                                ? field.onChange([...currentPermissions, permission.id])
                                : field.onChange(
                                    currentPermissions.filter((value) => value !== permission.id)
                                  );
                            }}
                            className="border-blue-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer flex items-center">
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
      return apiRequest('DELETE', `/api/users/${id}`, undefined);
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
      return apiRequest('PUT', `/api/users/${data.id}`, data.userData);
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
      <div className="bg-secondary-light rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">اسم المستخدم</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الاسم الكامل</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">البريد الإلكتروني</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحية</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحيات</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-light">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light">
                    {user.username}
                    {currentUserId === user.id && (
                      <span className="text-xs text-primary-light mr-2">(أنت)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex space-x-reverse space-x-2">
                      <button 
                        className="text-primary-light hover:text-primary-dark transition-colors"
                        onClick={() => handleEditClick(user)}
                        title="تعديل المستخدم"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-destructive hover:text-red-700 transition-colors"
                        onClick={() => handleDeleteClick(user)}
                        disabled={currentUserId === user.id}
                        title={currentUserId === user.id ? "لا يمكن حذف المستخدم الحالي" : "حذف المستخدم"}
                      >
                        <Loader2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
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
