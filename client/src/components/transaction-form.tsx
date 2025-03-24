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
import { CalendarIcon, CoinsIcon, InfoIcon, Loader2, PiggyBankIcon, SaveIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Project {
  id: number;
  name: string;
}

interface TransactionFormProps {
  projects: Project[];
  onSubmit: () => void;
  isLoading: boolean;
}

const transactionSchema = z.object({
  date: z.date({
    required_error: "التاريخ مطلوب",
  }),
  type: z.enum(["income", "expense"], {
    required_error: "نوع العملية مطلوب",
  }),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  projectId: z.string().optional(),
  description: z.string().min(3, "الوصف يجب أن يحتوي على الأقل 3 أحرف"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionForm({ projects, onSubmit, isLoading }: TransactionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      type: "income",
      amount: undefined,
      projectId: "",
      description: "",
    },
  });
  
  const mutation = useMutation({
    mutationFn: (data: TransactionFormValues) => {
      return apiRequest('POST', '/api/transactions', {
        ...data,
        projectId: data.projectId ? parseInt(data.projectId) : undefined
      });
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
  
  // اقتراحات سريعة للوصف حسب النوع
  const descriptionSuggestions = {
    income: [
      "دفعة من العميل",
      "إيراد مبيعات",
      "دفعة مقدمة للمشروع",
      "إيجار مرافق"
    ],
    expense: [
      "شراء مستلزمات مكتبية",
      "رواتب الموظفين",
      "مصاريف نقل",
      "صيانة معدات"
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
                      }} 
                      value={field.value} 
                      disabled={isLoading || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white border border-blue-100 hover:border-blue-300">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income" className="flex items-center gap-2">
                          <div className="flex items-center">
                            <PiggyBankIcon className="h-4 w-4 ml-2 text-green-500" />
                            إيراد
                          </div>
                        </SelectItem>
                        <SelectItem value="expense" className="flex items-center gap-2">
                          <div className="flex items-center">
                            <CoinsIcon className="h-4 w-4 ml-2 text-red-500" />
                            مصروف
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                      <SelectContent>
                        <SelectItem value="">عام (بدون مشروع)</SelectItem>
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
