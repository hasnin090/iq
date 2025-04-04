import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AtSignIcon, 
  EyeIcon, 
  EyeOffIcon, 
  FolderIcon,
  InfoIcon, 
  KeyIcon, 
  Loader2, 
  LockIcon, 
  SaveIcon, 
  ShieldIcon, 
  UserIcon, 
  UsersIcon 
} from 'lucide-react';
import { useState } from 'react';

interface UserFormProps {
  onSubmit: () => void;
}

const userSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يحتوي على الأقل 3 أحرف"),
  name: z.string().min(3, "الاسم يجب أن يحتوي على الأقل 3 أحرف"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على الأقل 6 أحرف"),
  role: z.enum(["admin", "user"], {
    required_error: "الصلاحية مطلوبة",
  }),
  permissions: z.array(z.string()).optional(),
  projectId: z.number().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const permissions = [
  { id: "viewReports", label: "عرض التقارير", icon: <EyeIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "manageProjects", label: "إدارة المشاريع", icon: <UsersIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "manageTransactions", label: "إدارة المعاملات المالية", icon: <KeyIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "viewOnly", label: "صلاحيات المشاهدة فقط", icon: <EyeOffIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
  { id: "manageDocuments", label: "إدارة المستندات", icon: <ShieldIcon className="h-3.5 w-3.5 ml-1.5 text-blue-400" /> },
];

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
  progress: number;
}

export function UserForm({ onSubmit }: UserFormProps) {
  const { toast } = useToast();
  const [showPermissions, setShowPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // استعلام لجلب قائمة المشاريع
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: false
  });
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      role: "user",
      permissions: [],
      projectId: undefined,
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: UserFormValues) => {
      return apiRequest('POST', '/api/users', data);
    },
    onSuccess: () => {
      toast({
        title: "تمت العملية بنجاح",
        description: "تم حفظ المستخدم بنجاح",
      });
      form.reset({
        username: "",
        name: "",
        email: "",
        password: "",
        role: "user",
        permissions: [],
        projectId: undefined,
      });
      setShowPermissions(false);
      onSubmit();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المستخدم",
      });
      console.error("Error creating user:", error);
    },
  });
  
  function onFormSubmit(data: UserFormValues) {
    mutation.mutate(data);
  }
  
  // Update role and show/hide permissions
  const handleRoleChange = (role: string) => {
    form.setValue("role", role as "admin" | "user");
    setShowPermissions(role === "user");
    
    // إذا تم تغيير الدور إلى مدير، قم بإعادة تعيين الصلاحيات
    if (role === "admin") {
      form.setValue("permissions", []);
    }
  };
  
  // توليد كلمة مرور عشوائية آمنة
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
    setShowPassword(true);
  };
  
  // اقتراحات بريد إلكتروني
  const emailDomains = ["@example.com", "@gmail.com", "@hotmail.com", "@yahoo.com"];
  
  return (
    <Card className="border border-blue-100 dark:border-blue-800 shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary dark:text-blue-300">
          <UserIcon className="h-5 w-5" />
          إضافة مستخدم جديد
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center dark:text-gray-200">
                        اسم المستخدم
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                              <p>أدخل اسم المستخدم للدخول إلى النظام (بدون مسافات)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder="أدخل اسم المستخدم"
                            className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400 pr-10"
                            disabled={mutation.isPending}
                          />
                          <UserIcon className="absolute top-2.5 right-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل الاسم الكامل"
                        className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400"
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-gray-200">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="email"
                            placeholder="أدخل البريد الإلكتروني"
                            className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400 pr-10"
                            disabled={mutation.isPending}
                          />
                          <AtSignIcon className="absolute top-2.5 right-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                      </FormControl>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {emailDomains.map((domain, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            onClick={() => {
                              const username = form.getValues().username;
                              if (username) {
                                form.setValue('email', username + domain);
                              }
                            }}
                            disabled={mutation.isPending || !form.getValues().username}
                          >
                            {domain}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center dark:text-gray-200">
                      كلمة المرور
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                            <p>يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
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
                            placeholder="أدخل كلمة المرور"
                            className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400 pr-10"
                            disabled={mutation.isPending}
                          />
                          <LockIcon className="absolute top-2.5 right-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                          <button
                            type="button"
                            className="absolute top-2.5 left-3 h-5 w-5 text-slate-400 dark:text-slate-500"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 dark:text-gray-200"
                        onClick={generatePassword}
                        disabled={mutation.isPending}
                      >
                        توليد
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">الصلاحية</FormLabel>
                    <Select 
                      onValueChange={handleRoleChange} 
                      value={field.value} 
                      disabled={mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 dark:text-gray-200">
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
                    <FormDescription className="dark:text-gray-400">
                      {field.value === "admin" 
                        ? "المدير لديه صلاحيات كاملة للنظام" 
                        : "المستخدم يحتاج لتحديد صلاحيات محددة"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* اختيار المشروع المخصص للمستخدم */}
              {form.watch("role") === "user" && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center dark:text-gray-200">
                        المشروع المخصص
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                              <p>يمكن تخصيص مشروع محدد للمستخدم للعمل عليه فقط</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // إذا كانت القيمة "none"، اجعلها undefined وإلا حولها إلى رقم
                          field.onChange(value === "none" ? undefined : parseInt(value));
                        }} 
                        value={field.value?.toString() || "none"} 
                        disabled={mutation.isPending || projectsLoading}
                      >
                        <FormControl>
                          <SelectTrigger 
                            className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 dark:text-gray-200"
                          >
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="flex items-center">
                            <div className="flex items-center">
                              <FolderIcon className="h-4 w-4 ml-2 text-gray-500" />
                              بدون تخصيص
                            </div>
                          </SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()} className="flex items-center">
                              <div className="flex items-center">
                                <FolderIcon className="h-4 w-4 ml-2 text-blue-500" />
                                {project.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="dark:text-gray-400">
                        اختر المشروع الذي سيستطيع المستخدم من الوصول إليه
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {showPermissions && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <FormLabel className="mb-2 block font-medium text-blue-700 dark:text-blue-300">الصلاحيات:</FormLabel>
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
                            className="flex flex-row items-center space-x-reverse space-x-2 space-y-0 py-1.5 px-2 rounded-lg hover:bg-blue-100/50 dark:hover:bg-blue-800/50"
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
                                className="border-blue-300 dark:border-blue-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer flex items-center dark:text-gray-200">
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
            
            <div className="flex justify-center pt-2">
              <Button 
                type="submit" 
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <SaveIcon className="ml-2 h-4 w-4" />
                    حفظ المستخدم
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}