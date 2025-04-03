import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, InfoIcon, Loader2, SaveIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectFormProps {
  onSubmit: () => void;
}

const projectSchema = z.object({
  name: z.string().min(3, "اسم المشروع يجب أن يحتوي على الأقل 3 أحرف"),
  description: z.string().min(10, "وصف المشروع يجب أن يحتوي على الأقل 10 أحرف"),
  startDate: z.date({
    required_error: "تاريخ البدء مطلوب",
  }),
  status: z.enum(["active", "completed", "paused"], {
    required_error: "حالة المشروع مطلوبة",
  }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      status: "active",
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: ProjectFormValues) => {
      // التأكد من أن اسم المشروع غير فارغ
      if (!data.name || data.name.trim() === '') {
        throw new Error("اسم المشروع مطلوب");
      }
      
      // إضافة نسبة تقدم افتراضية إذا كانت غير موجودة
      const projectData = {
        ...data,
        progress: 0, // بداية المشروع دائماً تكون 0%
        name: data.name.trim() // إزالة المسافات الزائدة
      };
      
      return apiRequest('POST', '/api/projects', projectData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "تمت العملية بنجاح",
        description: `تم حفظ المشروع "${data?.name || 'الجديد'}" بنجاح`,
      });
      form.reset({
        name: "",
        description: "",
        startDate: new Date(),
        status: "active",
      });
      // تحديث القائمة مباشرة
      onSubmit();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المشروع",
      });
      console.error("Error creating project:", error);
    },
  });
  
  function onFormSubmit(data: ProjectFormValues) {
    mutation.mutate(data);
  }
  
  // الاقتراحات السريعة لاسم المشروع
  const projectSuggestions = [
    "مشروع تطوير الموقع",
    "تجديد المكتب",
    "حملة تسويقية",
    "تطوير تطبيق",
    "عرض ترويجي"
  ];
  
  // الاقتراحات السريعة لوصف المشروع
  const descriptionSuggestions = [
    "مشروع لتطوير وتحسين الخدمات المقدمة للعملاء من خلال تنفيذ استراتيجية متكاملة",
    "تطوير البنية التحتية للشركة وتحسين الأداء العام",
    "حملة تسويقية شاملة تهدف إلى زيادة الوعي بالعلامة التجارية وجذب عملاء جدد",
    "مشروع استشاري لتحسين الكفاءة التشغيلية وخفض التكاليف"
  ];
  
  return (
    <Card className="border border-blue-100 dark:border-blue-800 shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-primary dark:text-blue-300">
          <SaveIcon className="h-5 w-5" />
          إضافة مشروع جديد
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        اسم المشروع
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                              <p>أدخل اسم المشروع. يجب أن يكون الاسم واضحًا ومختصرًا.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="أدخل اسم المشروع"
                          className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400"
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {projectSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            onClick={() => form.setValue('name', suggestion)}
                            disabled={mutation.isPending}
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
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ البدء</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 text-right justify-between items-center dark:text-gray-200"
                            disabled={mutation.isPending}
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>حالة المشروع</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 dark:text-gray-200">
                        <SelectValue placeholder="اختر حالة المشروع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    وصف المشروع
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-3.5 w-3.5 mr-1 text-blue-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                          <p>أدخل وصفًا تفصيليًا للمشروع وأهدافه.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="أدخل وصف المشروع"
                      className="w-full rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 dark:text-gray-200 dark:placeholder-gray-400"
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {descriptionSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                        onClick={() => form.setValue('description', suggestion)}
                        disabled={mutation.isPending}
                      >
                        اقتراح {idx + 1}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                    حفظ المشروع
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
