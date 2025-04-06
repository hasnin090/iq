import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CalendarIcon, CoinsIcon, InfoIcon, Loader2, PiggyBankIcon, SaveIcon, ArrowRightCircleIcon, Paperclip, FileIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: number;
  name: string;
}

interface TransactionFormProps {
  projects: Project[];
  onSubmit: () => void;
  isLoading: boolean;
}

// تعريف الملفات المقبولة
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  // صيغ الصور
  "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/svg+xml",
  // صيغ المستندات
  "application/pdf", "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "text/plain", "text/rtf", "application/rtf",
  // صيغ جداول البيانات
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // صيغ مضغوطة
  "application/zip", "application/x-zip-compressed", "application/x-rar-compressed",
];

const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.txt,.rtf,.xls,.xlsx,.zip,.rar";

// نستخدم مخطط واحد للجميع حيث أن المشروع سيتم تعيينه تلقائياً للمستخدم العادي
const transactionSchema = z.object({
  date: z.date({
    required_error: "التاريخ مطلوب",
  }),
  type: z.enum(["income", "expense", "project_income"], {
    required_error: "نوع العملية مطلوب",
  }),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  // ليس هناك حاجة لجعل المشروع إلزامي حيث سيتم ضبطه في المخدم
  projectId: z.string().optional(),
  description: z.string().min(3, "الوصف يجب أن يحتوي على الأقل 3 أحرف"),
  // إضافة حقل الملف المرفق (اختياري)
  file: z.any().optional()
    .refine(file => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), 
      file => ({ message: `حجم الملف يجب أن يكون أقل من ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت` }))
    .refine(file => !file || (file instanceof File && ACCEPTED_FILE_TYPES.includes(file.type)), 
      file => ({ message: `صيغة الملف غير مدعومة. الصيغ المدعومة: ${ACCEPTED_FILE_EXTENSIONS}` })),
});

// تحديد نوع النموذج
type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionForm({ projects, onSubmit, isLoading }: TransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // الحصول على مشاريع المستخدم فقط إذا كان مستخدماً عادياً
  const { data: userProjects } = useQuery<Project[]>({
    queryKey: ['/api/users', user?.id, 'projects'],
    queryFn: async () => {
      if (user?.role === 'admin') return []; // المدير يمكنه رؤية جميع المشاريع
      const response = await fetch(`/api/users/${user?.id}/projects`);
      if (!response.ok) throw new Error('Failed to fetch user projects');
      return response.json();
    },
    enabled: !!user && user.role !== 'admin', // فقط إذا كان المستخدم غير مدير
  });

  // تحديد القيمة الافتراضية للمشروع (للمستخدم العادي يكون المشروع المخصص له إذا كان لديه مشروع واحد فقط)
  // نستخدم ثابت فارغ مبدئياً ثم نقوم بتحديثه عند تحميل المشاريع
  const defaultProjectId = "";
  
  // استخدام مخطط واحد موحد للجميع
  const selectedSchema = transactionSchema;
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(selectedSchema),
    defaultValues: {
      date: new Date(),
      type: "income",
      amount: undefined,
      projectId: defaultProjectId,
      description: "",
    },
  });
  
  // تحديث قيمة المشروع الافتراضية عند تحميل مشاريع المستخدم
  React.useEffect(() => {
    if (user?.role !== 'admin' && userProjects?.length === 1) {
      form.setValue('projectId', userProjects[0].id.toString());
    }
  }, [userProjects, user]);

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      // إنشاء FormData إذا كان هناك ملف، وإلا يستخدم الإرسال العادي
      const hasFile = data.file instanceof File;
      
      if (hasFile) {
        // إنشاء FormData لإرسال الملف
        const formDataObj = new FormData();
        
        // إضافة البيانات الأساسية للمعاملة
        formDataObj.append('date', data.date.toISOString());
        formDataObj.append('type', data.type);
        formDataObj.append('amount', data.amount?.toString() || '0');
        formDataObj.append('description', data.description);
        
        // معالجة نوع إيراد المشروع
        if (data.type === 'project_income') {
          // استبدال النوع ب "income" مع الاحتفاظ بمعرف المشروع
          formDataObj.set('type', 'income');
          
          // التأكد من وجود معرف مشروع صالح
          if (!data.projectId || data.projectId === "none") {
            throw new Error("يجب تحديد مشروع عند إضافة إيراد للمشروع");
          }
          
          formDataObj.append('projectId', data.projectId);
        }
        // التعامل مع معرف المشروع حسب نوع المستخدم والعملية
        else if (user?.role === 'admin') {
          if (data.type === 'income') {
            // الإيراد للمدير يذهب للصندوق الرئيسي (لا نضيف معرف مشروع)
          } else if (data.projectId && data.projectId !== "none") {
            // المصروف للمدير مع تحديد مشروع
            formDataObj.append('projectId', data.projectId);
          }
          // وإلا، مصروف بدون تحديد مشروع (لا نضيف معرف مشروع)
        } else {
          // للمستخدم العادي:
          if (userProjects?.length === 1) {
            // إذا كان لديه مشروع واحد فقط، نستخدمه تلقائياً
            formDataObj.append('projectId', userProjects[0].id.toString());
          } else if (data.projectId) {
            // إذا تم تحديد مشروع، نستخدمه
            formDataObj.append('projectId', data.projectId);
          } else {
            // إذا لم يتم تحديد مشروع، هناك خطأ
            throw new Error("يجب تحديد مشروع للعملية");
          }
        }
        
        // إضافة الملف إلى FormData
        if (data.file) {
          formDataObj.append('file', data.file);
        }
        
        // استخدام fetch بدلاً من apiRequest لإرسال FormData
        const response = await fetch('/api/transactions', {
          method: 'POST',
          body: formDataObj,
          // لا نحدد Content-Type لأن المتصفح سيضيفه تلقائياً مع multipart/form-data
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "فشل في حفظ المعاملة المالية");
        }
        
        return await response.json();
      } else {
        // استخدام الطريقة العادية للإرسال بدون ملفات
        // نسخة جديدة من البيانات لتجنب تعديل البيانات الأصلية
        let formData: any = { ...data };
        delete formData.file; // حذف حقل الملف إذا كان فارغاً
        
        // معالجة نوع إيراد المشروع الجديد للمدير (project_income)
        if (formData.type === 'project_income') {
          // في حالة "إيراد للمشروع"، نقوم بتعديل النوع إلى "income" العادي
          formData.type = 'income';
          
          // التأكد من وجود معرف مشروع صالح
          if (!formData.projectId || formData.projectId === "none") {
            throw new Error("يجب تحديد مشروع عند إضافة إيراد للمشروع");
          }
          
          // تحويل معرف المشروع إلى رقم
          formData.projectId = parseInt(formData.projectId);
        }
        // التعامل مع projectId حسب نوع المستخدم ونوع العملية
        else if (user?.role === 'admin') {
          if (formData.type === 'income') {
            // إيراد للمدير يذهب للصندوق الرئيسي دائمًا
            delete formData.projectId;
          } else if (formData.projectId && formData.projectId !== "none") {
            // مصروف للمدير مع تحديد مشروع
            formData.projectId = parseInt(formData.projectId);
          } else {
            // مصروف للمدير بدون تحديد مشروع
            delete formData.projectId;
          }
        } else {
          // للمستخدم العادي:
          if (userProjects?.length === 1) {
            // إذا كان لديه مشروع واحد فقط، استخدمه تلقائيًا
            formData.projectId = parseInt(userProjects[0].id.toString());
          } else if (formData.projectId) {
            // إذا تم تحديد مشروع، استخدمه
            formData.projectId = parseInt(formData.projectId);
          } else {
            // إذا لم يتم تحديد مشروع، نفترض أن هناك خطأ
            throw new Error("يجب تحديد مشروع للعملية");
          }
        }
        
        return apiRequest('POST', '/api/transactions', formData);
      }
    },
    onSuccess: () => {
      toast({
        title: "تمت العملية بنجاح",
        description: "تم حفظ المعاملة المالية بنجاح",
      });
      form.reset({
        date: new Date(),
        type: "income",
        amount: undefined,
        projectId: "",
        description: "",
        file: undefined, // إعادة تعيين حقل الملف أيضاً
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المعاملة المالية",
      });
      console.error("Error creating transaction:", error);
    },
  });
  
  function onFormSubmit(data: TransactionFormValues) {
    mutation.mutate(data);
  }
  
  // اقتراحات سريعة للمبالغ المالية
  const commonAmounts = [
    { value: 100, label: "١٠٠ د.ع" },
    { value: 500, label: "٥٠٠ د.ع" },
    { value: 1000, label: "١٠٠٠ د.ع" },
    { value: 5000, label: "٥٠٠٠ د.ع" }
  ];
  
  // اقتراحات سريعة للوصف حسب النوع والدور
  const descriptionSuggestions = {
    income: user?.role === 'admin' ? [
      // اقتراحات الإيرادات للمدير (تؤكد على أنها للصندوق الرئيسي)
      "إيراد للصندوق الرئيسي",
      "إيداع في الصندوق الرئيسي",
      "دفعة مستلمة للصندوق العام",
      "إيراد مبيعات للصندوق الرئيسي",
      "تمويل وارد للصندوق الرئيسي"
    ] : [
      // اقتراحات الإيرادات للمستخدم العادي (تمويل مشروع)
      "دفعة من العميل للمشروع",
      "تمويل المشروع من قِبل المدير",
      "دفعة مقدمة للمشروع",
      "إيداع في صندوق المشروع",
      "تمويل وارد للمشروع من المدير"
    ],
    expense: user?.role === 'admin' && !form.getValues().projectId ? [
      // مصروفات المدير من الصندوق الرئيسي
      "مصروفات تشغيلية من الصندوق الرئيسي",
      "رواتب الموظفين من الصندوق الرئيسي",
      "مصاريف عامة للإدارة",
      "نفقات إدارية من الصندوق الرئيسي",
      "صيانة مقر الشركة"
    ] : [
      // مصروفات من صندوق المشروع
      "شراء مستلزمات مكتبية للمشروع",
      "رواتب فريق المشروع",
      "مصاريف نقل متعلقة بالمشروع",
      "صيانة معدات المشروع",
      "نفقات تشغيلية للمشروع"
    ],
    project_income: [
      // اقتراحات الإيرادات للمشاريع (من قبل المدير)
      "إيراد مباشر للمشروع",
      "تمويل إضافي للمشروع",
      "دفعة من العميل للمشروع",
      "إيراد مبيعات للمشروع",
      "تمويل وارد للمشروع"
    ]
  };
  
  // الحصول على اقتراحات الوصف بناءً على نوع المعاملة
  const getDescriptionSuggestions = () => {
    const type = form.getValues().type as "income" | "expense" | "project_income";
    return descriptionSuggestions[type] || [];
  };
  
  return (
    <Card className="border border-blue-100 dark:border-blue-900 shadow-md transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary dark:text-blue-400">
          {form.watch("type") === "income" ? (
            <PiggyBankIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
          ) : form.watch("type") === "project_income" ? (
            <ArrowRightCircleIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <CoinsIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
          )}
          إضافة عملية مالية جديدة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 bg-white dark:bg-gray-800">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>التاريخ</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 text-right justify-between items-center"
                            disabled={isLoading || mutation.isPending}
                          >
                            {field.value ? (
                              format(field.value, "yyyy/MM/dd")
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="text-blue-900 dark:text-blue-200"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العملية</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("description", ""); // مسح الوصف عند تغيير النوع
                        
                        // إذا كان المستخدم هو المدير:
                        if (user?.role === 'admin') {
                          if (value === 'income') {
                            // إيراد للصندوق الرئيسي
                            form.setValue("projectId", "none");
                            form.setValue("description", "إيراد للصندوق الرئيسي");
                          } 
                          else if (value === 'project_income') {
                            // إيراد للمشروع
                            // إذا كان هناك مشروع واحد فقط، نختاره تلقائياً
                            if (projects?.length === 1) {
                              form.setValue("projectId", projects[0].id.toString());
                              form.setValue("description", "إيراد مباشر للمشروع");
                            } else {
                              // وإلا نعيد تعيين معرف المشروع ليختار المستخدم
                              form.setValue("projectId", "");
                            }
                          }
                        }
                      }} 
                      value={field.value} 
                      disabled={isLoading || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900">
                        <SelectItem value="income" className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/30">
                          <div className="flex items-center">
                            <PiggyBankIcon className="h-4 w-4 ml-2 text-green-500 dark:text-green-400" />
                            {user?.role === 'admin' ? 'إيراد (للصندوق الرئيسي)' : 'إيراد (للمشروع)'}
                          </div>
                        </SelectItem>
                        {user?.role === 'admin' && (
                          <SelectItem value="project_income" className="flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                            <div className="flex items-center">
                              <ArrowRightCircleIcon className="h-4 w-4 ml-2 text-emerald-500 dark:text-emerald-400" />
                              إيراد للمشروع
                            </div>
                          </SelectItem>
                        )}
                        <SelectItem value="expense" className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <div className="flex items-center">
                            <CoinsIcon className="h-4 w-4 ml-2 text-red-500 dark:text-red-400" />
                            مصروف
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value === 'income' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {user?.role === 'admin' 
                          ? 'سيتم إضافة الإيراد للصندوق الرئيسي فقط'
                          : 'سيتم إضافة الإيراد للمشروع المحدد فقط'}
                      </p>
                    )}
                    {field.value === 'project_income' && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        يجب تحديد المشروع الذي سيتم إضافة الإيراد إليه
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 
              أظهر حقل المشروع في الحالات التالية:
              1. للمستخدم العادي الذي له أكثر من مشروع
              2. للمدير عند اختيار نوع العملية "مصروف" أو "إيراد للمشروع"
              */}
              {((user?.role === 'admin' && ['expense', 'project_income'].includes(form.watch('type'))) || 
                (user?.role !== 'admin' && userProjects && userProjects.length > 1)) && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        المشروع
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                              <p>اختر المشروع المرتبط بالعملية المالية</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={isLoading || mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900">
                          {/* عرض "عام (بدون مشروع)" للمدير دائمًا، ويكون هو الخيار الوحيد للإيرادات */}
                          {user?.role === 'admin' && (
                            <SelectItem value="none" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                الصندوق الرئيسي
                              </div>
                            </SelectItem>
                          )}
                          
                          {/* 
                          عرض قائمة المشاريع المناسبة حسب دور المستخدم ونوع العملية:
                          - للمدير عند اختيار "مصروف": يمكنه اختيار أي مشروع
                          - للمستخدم العادي: عرض فقط المشاريع المخصصة له دائمًا
                          */}
                          {user?.role === 'admin' ? (
                            // للمدير: عرض المشاريع عند اختيار نوع العملية "مصروف" أو "إيراد للمشروع"
                            ['expense', 'project_income'].includes(form.watch('type')) ? (
                              projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()} className="hover:bg-green-50 dark:hover:bg-green-900/30">
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {project.name}
                                  </div>
                                </SelectItem>
                              ))
                            ) : null // لا تعرض المشاريع للمدير عند اختيار "إيراد" للصندوق الرئيسي
                          ) : (
                            // للمستخدم العادي: عرض فقط المشاريع المخصصة له
                            userProjects?.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()} className="hover:bg-green-50 dark:hover:bg-green-900/30">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  {project.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* حقل المبلغ */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      المبلغ (د.ع)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                            <p>أدخل قيمة المبلغ المالي بالدينار</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="أدخل المبلغ"
                        className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 focus:border-blue-300 dark:focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                        disabled={isLoading || mutation.isPending}
                      />
                    </FormControl>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {commonAmounts.map((amount, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                          onClick={() => form.setValue('amount', amount.value)}
                          disabled={isLoading || mutation.isPending}
                        >
                          {amount.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="col-span-1 md:col-span-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      التفاصيل
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                            <p>أدخل وصفًا تفصيليًا للعملية المالية</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="أدخل تفاصيل العملية"
                        className="w-full rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 focus:border-blue-300 dark:focus:border-blue-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                        disabled={isLoading || mutation.isPending}
                      />
                    </FormControl>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {getDescriptionSuggestions().map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                          onClick={() => form.setValue('description', suggestion)}
                          disabled={isLoading || mutation.isPending}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* حقل الملف المرفق */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      الملف المرفق (اختياري)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                            <p>يمكنك إرفاق ملف مع المعاملة المالية (صورة، مستند PDF، الخ)</p>
                            <p className="text-xs mt-1">الحد الأقصى للحجم: 10 ميجابايت</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          id="file-upload"
                          accept={ACCEPTED_FILE_EXTENSIONS}
                          className="sr-only"
                          disabled={isLoading || mutation.isPending}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                          }}
                          {...fieldProps}
                        />
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="file-upload"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/50 cursor-pointer transition-colors"
                          >
                            <Paperclip className="h-4 w-4" />
                            <span>انقر لاختيار ملف</span>
                          </label>
                          
                          {value && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-blue-100 dark:border-blue-900 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <span className="text-sm">
                                  {value instanceof File ? value.name : 'ملف مرفق'}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => onChange(null)}
                                disabled={isLoading || mutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center pt-2">
              <Button 
                type="submit" 
                className={`px-6 py-2 text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                  form.watch("type") === "income" 
                    ? "bg-gradient-to-r from-green-600 to-green-500" 
                    : form.watch("type") === "project_income"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                      : "bg-gradient-to-r from-blue-600 to-blue-500"
                }`}
                disabled={isLoading || mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <SaveIcon className="ml-2 h-4 w-4" />
                    حفظ العملية
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
