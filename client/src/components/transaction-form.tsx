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
import { AlertTriangle, CalendarIcon, CoinsIcon, InfoIcon, Loader2, PiggyBankIcon, SaveIcon } from 'lucide-react';
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

// نستخدم مخطط واحد للجميع حيث أن المشروع سيتم تعيينه تلقائياً للمستخدم العادي
const transactionSchema = z.object({
  date: z.date({
    required_error: "التاريخ مطلوب",
  }),
  type: z.enum(["income", "expense"], {
    required_error: "نوع العملية مطلوب",
  }),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  // ليس هناك حاجة لجعل المشروع إلزامي حيث سيتم ضبطه في المخدم
  projectId: z.string().optional(),
  description: z.string().min(3, "الوصف يجب أن يحتوي على الأقل 3 أحرف"),
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
    mutationFn: (data: TransactionFormValues) => {
      // نسخة جديدة من البيانات لتجنب تعديل البيانات الأصلية
      let formData: any = { ...data };
      
      // التعامل مع projectId حسب نوع المستخدم ونوع العملية
      if (user?.role === 'admin') {
        // للمدير:
        // 1. إذا كانت العملية "إيراد"، حذف المشروع دائمًا لضمان إضافة الإيراد للصندوق الرئيسي
        // 2. إذا كانت العملية "مصروف"، يتم التعامل حسب المشروع المحدد
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
    ]
  };
  
  // الحصول على اقتراحات الوصف بناءً على نوع المعاملة
  const getDescriptionSuggestions = () => {
    const type = form.getValues().type as "income" | "expense";
    return descriptionSuggestions[type] || [];
  };
  
  return (
    <Card className="border border-blue-100 shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary">
          {form.watch("type") === "income" ? (
            <PiggyBankIcon className="h-5 w-5 text-green-500" />
          ) : (
            <CoinsIcon className="h-5 w-5 text-red-500" />
          )}
          إضافة عملية مالية جديدة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full h-10 rounded-lg bg-white border border-blue-100 hover:border-blue-300 text-right justify-between items-center"
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
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
                        // إذا كان المستخدم هو المدير وتم اختيار إيراد، قم بتعيين projectId إلى "none" تلقائياً
                        if (user?.role === 'admin' && value === 'income') {
                          form.setValue("projectId", "none");
                          // إضافة اقتراح توضيحي للإيراد للصندوق الرئيسي
                          form.setValue("description", "إيراد للصندوق الرئيسي");
                        }
                      }} 
                      value={field.value} 
                      disabled={isLoading || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white border border-blue-100 hover:border-blue-300">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-blue-100">
                        <SelectItem value="income" className="flex items-center gap-2 hover:bg-green-50">
                          <div className="flex items-center">
                            <PiggyBankIcon className="h-4 w-4 ml-2 text-green-500" />
                            {user?.role === 'admin' ? 'إيراد (للصندوق الرئيسي)' : 'إيراد (للمشروع)'}
                          </div>
                        </SelectItem>
                        <SelectItem value="expense" className="flex items-center gap-2 hover:bg-red-50">
                          <div className="flex items-center">
                            <CoinsIcon className="h-4 w-4 ml-2 text-red-500" />
                            مصروف
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value === 'income' && (
                      <p className="text-xs text-green-600 mt-1 flex items-center font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {user?.role === 'admin' 
                          ? 'سيتم إضافة الإيراد للصندوق الرئيسي فقط'
                          : 'سيتم إضافة الإيراد للمشروع المحدد فقط'}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* حقل المبلغ يأخذ العمود الكامل للمستخدم العادي الذي لديه مشروع واحد فقط */}
              <div className={user?.role !== 'admin' && userProjects?.length === 1 ? "col-span-2" : ""}>
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
                            <TooltipContent className="bg-blue-50 text-blue-900 border-blue-200">
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
                          className="w-full h-10 rounded-lg bg-white border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          disabled={isLoading || mutation.isPending}
                        />
                      </FormControl>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {commonAmounts.map((amount, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
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
              
              {/* 
              أظهر حقل المشروع في الحالات التالية:
              1. للمستخدم العادي الذي له أكثر من مشروع
              2. للمدير عند اختيار نوع العملية "مصروف"
              3. للمدير فقط عند اختيار "إيراد" ومع تقييد الخيارات حسب الحالة
              */}
              {((user?.role === 'admin' && form.watch('type') === 'expense') || 
                (user?.role !== 'admin' && userProjects && userProjects.length > 1)) && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المشروع</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={isLoading || mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10 rounded-lg bg-white border border-blue-100 hover:border-blue-300">
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-blue-100">
                          {/* عرض "عام (بدون مشروع)" للمدير دائمًا، ويكون هو الخيار الوحيد للإيرادات */}
                          {user?.role === 'admin' && (
                            <SelectItem value="none" className="hover:bg-blue-50 text-blue-700 font-medium">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                            // للمدير: عرض المشاريع فقط عند اختيار نوع العملية "مصروف"
                            form.watch('type') === 'expense' ? (
                              projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()} className="hover:bg-green-50">
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {project.name}
                                  </div>
                                </SelectItem>
                              ))
                            ) : null // لا تعرض المشاريع للمدير عند اختيار "إيراد"
                          ) : (
                            // للمستخدم العادي: عرض فقط المشاريع المخصصة له
                            userProjects?.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()} className="hover:bg-green-50">
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      {/* لحذف التعليق السابق حيث أصبح الحقل مخفي عندما يختار المدير الإيراد */}
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div>
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
                          <TooltipContent className="bg-blue-50 text-blue-900 border-blue-200">
                            <p>أدخل وصفًا تفصيليًا للعملية المالية</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder="أدخل تفاصيل العملية"
                        className="w-full rounded-lg bg-white border border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        disabled={isLoading || mutation.isPending}
                      />
                    </FormControl>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getDescriptionSuggestions().map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
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
            
            <div className="flex justify-center pt-2">
              <Button 
                type="submit" 
                className={`px-6 py-2 text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                  form.watch("type") === "income" 
                    ? "bg-gradient-to-r from-green-600 to-green-500" 
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
