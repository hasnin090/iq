import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
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
});

type UserFormValues = z.infer<typeof userSchema>;

const permissions = [
  { id: "viewReports", label: "عرض التقارير" },
  { id: "manageProjects", label: "إدارة المشاريع" },
  { id: "manageTransactions", label: "إدارة المعاملات المالية" },
  { id: "manageDocuments", label: "إدارة المستندات" },
];

export function UserForm({ onSubmit }: UserFormProps) {
  const { toast } = useToast();
  const [showPermissions, setShowPermissions] = useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      role: "user",
      permissions: [],
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
    },
  });
  
  function onFormSubmit(data: UserFormValues) {
    mutation.mutate(data);
  }
  
  // Update role and show/hide permissions
  const handleRoleChange = (role: string) => {
    form.setValue("role", role as "admin" | "user");
    setShowPermissions(role === "user");
  };
  
  return (
    <div className="bg-secondary-light rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-primary-light mb-4">إضافة مستخدم جديد</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="أدخل اسم المستخدم"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="أدخل البريد الإلكتروني"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                      disabled={mutation.isPending}
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
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="أدخل كلمة المرور"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الصلاحية</FormLabel>
                <Select 
                  onValueChange={handleRoleChange} 
                  value={field.value} 
                  disabled={mutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                      <SelectValue placeholder="اختر الصلاحية" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">مدير</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  المدير لديه صلاحيات كاملة للنظام
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {showPermissions && (
            <div className="bg-secondary p-4 rounded-lg">
              <FormLabel className="mb-4 block">الصلاحيات:</FormLabel>
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <FormField
                    key={permission.id}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={permission.id}
                          className="flex flex-row items-start space-x-reverse space-x-3 space-y-0 py-1"
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
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
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
          
          <div className="text-center">
            <Button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : "حفظ المستخدم"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
