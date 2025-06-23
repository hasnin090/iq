import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, UserPlus, Users, Shield, Eye } from 'lucide-react';

interface Employee {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions: string[];
  salary?: number;
  assignedProjectId?: number;
  assignedProject?: {
    id: number;
    name: string;
  };
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

const employeeFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.string().min(1, "الرجاء اختيار الدور"),
  salary: z.number().min(0, "الراتب يجب أن يكون أكبر من أو يساوي صفر").optional(),
  assignedProjectId: z.number().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

const editEmployeeFormSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  role: z.string().min(1, "الرجاء اختيار الدور"),
  active: z.boolean(),
  salary: z.number().min(0, "الراتب يجب أن يكون أكبر من أو يساوي صفر").optional(),
  assignedProjectId: z.number().optional(),
});

type EditEmployeeFormData = z.infer<typeof editEmployeeFormSchema>;

export default function Employees() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  // جلب الموظفين
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiRequest<Employee[]>('/api/employees', 'GET'),
  });

  // جلب المشاريع
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest<Project[]>('/api/projects', 'GET'),
  });

  // إنشاء موظف جديد
  const createForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'user',
      salary: 0,
      assignedProjectId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => apiRequest('/api/employees', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "تم إنشاء الموظف بنجاح",
        description: "تم إضافة الموظف الجديد إلى النظام",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الموظف",
        description: error.message || "حدث خطأ غير متوقع",
      });
    },
  });

  // تعديل موظف
  const editForm = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      role: 'user',
      active: true,
      salary: 0,
      assignedProjectId: undefined,
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditEmployeeFormData }) =>
      apiRequest(`/api/employees/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      editForm.reset();
      toast({
        title: "تم تحديث الموظف بنجاح",
        description: "تم حفظ التغييرات",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في تحديث الموظف",
        description: error.message || "حدث خطأ غير متوقع",
      });
    },
  });

  // حذف موظف
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/employees/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "تم حذف الموظف بنجاح",
        description: "تم إزالة الموظف من النظام",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في حذف الموظف",
        description: error.message || "حدث خطأ غير متوقع",
      });
    },
  });

  const handleCreateSubmit = (data: EmployeeFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: EditEmployeeFormData) => {
    if (selectedEmployee) {
      editMutation.mutate({ id: selectedEmployee.id, data });
    }
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      username: employee.username,
      name: employee.name,
      email: employee.email || '',
      role: employee.role,
      active: employee.active,
      salary: employee.salary || 0,
      assignedProjectId: employee.assignedProjectId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'مدير النظام',
      manager: 'مدير',
      user: 'مستخدم',
      viewer: 'مشاهد',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل الموظفين...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h1>
            <p className="text-gray-600">إضافة وتعديل وحذف موظفي النظام</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2 space-x-reverse">
          <UserPlus className="h-4 w-4" />
          <span>إضافة موظف جديد</span>
        </Button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {employee.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <p className="text-sm text-gray-600">@{employee.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  {employee.active ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={getRoleColor(employee.role)}>
                  {getRoleName(employee.role)}
                </Badge>
              </div>
              
              {employee.email && (
                <p className="text-sm text-gray-600 truncate">{employee.email}</p>
              )}

              {employee.salary && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">الراتب الشهري:</span>
                  <span className="text-sm font-medium text-green-600">
                    {employee.salary.toLocaleString()} ريال
                  </span>
                </div>
              )}

              {employee.assignedProject && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">المشروع:</span>
                  <span className="text-sm font-medium text-blue-600 truncate">
                    {employee.assignedProject.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">
                  {employee.active ? 'نشط' : 'غير نشط'}
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(employee)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(employee)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد موظفين</h3>
          <p className="text-gray-600 mb-4">ابدأ بإضافة موظف جديد إلى النظام</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            إضافة موظف جديد
          </Button>
        </div>
      )}

      {/* Create Employee Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الكامل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المستخدم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">مستخدم</SelectItem>
                        <SelectItem value="manager">مدير</SelectItem>
                        <SelectItem value="viewer">مشاهد</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب الشهري (ريال)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="أدخل الراتب الشهري"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="assignedProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع المخصص (اختياري)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value ? field.value.toString() : "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون مشروع</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الموظف</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الكامل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المستخدم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="أدخل البريد الإلكتروني" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">مستخدم</SelectItem>
                        <SelectItem value="manager">مدير</SelectItem>
                        <SelectItem value="viewer">مشاهد</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الراتب الشهري (ريال)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="أدخل الراتب الشهري"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="assignedProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع المخصص (اختياري)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value ? field.value.toString() : "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">بدون مشروع</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الموظف "{selectedEmployee?.name}"؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEmployee && deleteMutation.mutate(selectedEmployee.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}