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
  "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "text/plain", "text/rtf", "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip", "application/x-zip-compressed", "application/x-rar-compressed",
];

const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.txt,.rtf,.xls,.xlsx,.zip,.rar";

const transactionFormSchema = z.object({
  date: z.date({
    required_error: "الرجاء اختيار تاريخ",
  }),
  type: z.string().min(1, "الرجاء اختيار نوع العملية"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من الصفر"),
  description: z.string().min(1, "الرجاء إدخال الوصف"),
  projectId: z.string().optional(),
  file: z.any().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function TransactionForm({ projects, onSubmit, isLoading }: TransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      type: "income",
      amount: undefined,
      projectId: "",
      description: "",
      file: undefined,
    },
  });

  const { data: userProjects } = useQuery({
    queryKey: ['/api/user-projects'],
    enabled: user?.role !== 'admin',
  });

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const formData = new FormData();
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      formData.append('date', data.date.toISOString());
      formData.append('type', data.type);
      formData.append('amount', data.amount.toString());
      formData.append('description', data.description);
      
      if (data.projectId && data.projectId !== "none") {
        formData.append('projectId', data.projectId);
      }
      
      return fetch('/api/transactions', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create transaction');
        return res.json();
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
        file: undefined,
      });
      setSelectedFile(null);
      onSubmit();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المعاملة المالية",
      });
    },
  });

  function onFormSubmit(data: TransactionFormValues) {
    mutation.mutate(data);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الملف أقل من 10 ميجابايت",
        });
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "نوع الملف غير مدعوم",
          description: "يرجى اختيار ملف بصيغة مدعومة",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const commonAmounts = [
    { value: 100, label: "١٠٠ د.ع" },
    { value: 500, label: "٥٠٠ د.ع" },
    { value: 1000, label: "١٠٠٠ د.ع" },
    { value: 5000, label: "٥٠٠٠ د.ع" }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-800/30 border-2 border-blue-200 dark:border-blue-700 shadow-xl">
          <CardHeader className="pb-6 text-center">
            <CardTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center justify-center gap-3">
              <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full">
                <PiggyBankIcon className="h-7 w-7" />
              </div>
              إضافة عملية مالية جديدة
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* الصف الأول: التاريخ ونوع العملية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      التاريخ
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 justify-start text-right font-medium bg-white dark:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            {field.value ? (
                              <span className="text-gray-900 dark:text-gray-100">
                                {format(field.value, "yyyy/MM/dd")}
                              </span>
                            ) : (
                              <span className="text-gray-500">اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-5 w-5 text-blue-500" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 rounded-xl shadow-xl" align="start">
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
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CoinsIcon className="h-4 w-4" />
                      نوع العملية
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-12 rounded-xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 bg-white dark:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 rounded-xl shadow-xl">
                        <SelectItem value="income" className="text-green-700 dark:text-green-400 font-medium hover:bg-green-50 dark:hover:bg-green-900/30">
                          <div className="flex items-center gap-2">
                            <PiggyBankIcon className="h-4 w-4" />
                            دخل
                          </div>
                        </SelectItem>
                        <SelectItem value="expense" className="text-red-700 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/30">
                          <div className="flex items-center gap-2">
                            <CoinsIcon className="h-4 w-4" />
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

            {/* الصف الثاني: المبلغ والمشروع */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CoinsIcon className="h-4 w-4" />
                      المبلغ (د.ع)
                    </FormLabel>
                    <div className="space-y-3">
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="أدخل المبلغ"
                            className="w-full h-12 rounded-xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 bg-white dark:bg-gray-800 pr-12 transition-all duration-200 shadow-sm hover:shadow-md text-lg font-medium"
                            {...field}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            د.ع
                          </div>
                        </div>
                      </FormControl>
                      
                      {/* اقتراحات سريعة للمبالغ */}
                      <div className="flex flex-wrap gap-2">
                        {commonAmounts.map((amount) => (
                          <Button
                            key={amount.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs rounded-lg border border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                            onClick={() => form.setValue("amount", amount.value)}
                          >
                            {amount.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* حقل المشروع - يظهر حسب الحاجة */}
              {((user?.role === 'admin') || (user?.role !== 'admin' && userProjects && userProjects.length > 1)) && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <InfoIcon className="h-4 w-4" />
                        المشروع
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-12 rounded-xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 bg-white dark:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md">
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-600 rounded-xl shadow-xl">
                          {user?.role === 'admin' && (
                            <SelectItem value="none" className="font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              الصندوق الرئيسي
                            </SelectItem>
                          )}
                          {(user?.role === 'admin' ? projects : userProjects || []).map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()} className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* الصف الثالث: الوصف */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    وصف العملية
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصفاً مفصلاً للعملية المالية"
                      className="w-full min-h-24 rounded-xl border-2 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-400 bg-white dark:bg-gray-800 resize-none transition-all duration-200 shadow-sm hover:shadow-md"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* الصف الرابع: المرفقات */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                مرفق (اختياري)
              </label>
              
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-6 bg-blue-50/50 dark:bg-blue-900/20 transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <input
                      id="file-input"
                      type="file"
                      accept={ACCEPTED_FILE_EXTENSIONS}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      اختر ملف للتحميل
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      الحد الأقصى 10 ميجابايت - PDF, الصور, Word, Excel
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* زر الحفظ */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={mutation.isPending || isLoading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري الحفظ...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <SaveIcon className="h-5 w-5" />
                    حفظ العملية المالية
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}