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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

// Component for expense type field
function ExpenseTypeField({ transactionType, form }: { transactionType: string; form: any }) {
  if (transactionType !== "expense") return null;
  
  return (
    <FormField
      control={form.control}
      name="expenseType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>نوع المصروف</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
                <SelectValue placeholder="اختر نوع المصروف" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="راتب">راتب</SelectItem>
              <SelectItem value="سلفة">سلفة</SelectItem>
              <SelectItem value="مشتريات">مشتريات</SelectItem>
              <SelectItem value="اجور تشغيلية">اجور تشغيلية</SelectItem>
              <SelectItem value="مصروف عام">مصروف عام</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const transactionFormSchema = z.object({
  date: z.date({
    required_error: "الرجاء اختيار تاريخ",
  }),
  type: z.string().min(1, "الرجاء اختيار نوع العملية"),
  expenseType: z.string().optional(),
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
  const [transactionType, setTransactionType] = React.useState("expense");

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      type: "expense",
      expenseType: "مصروف عام",
      amount: 0,
      projectId: "",
      description: "",
      file: undefined,
    },
  });

  const { data: userProjects } = useQuery({
    queryKey: ['/api/user-projects'],
    enabled: user?.role !== 'admin',
  });

  // تعيين المشروع تلقائياً للمستخدمين العاديين
  React.useEffect(() => {
    if (user?.role !== 'admin' && userProjects && Array.isArray(userProjects) && userProjects.length > 0) {
      form.setValue('projectId', userProjects[0].id.toString());
    }
  }, [userProjects, user?.role, form]);

  // التحقق من وجوب اختيار مشروع للمستخدمين العاديين
  const validateProjectSelection = () => {
    const projectId = form.getValues('projectId');
    
    // إذا كان المستخدم عادي وليس لديه مشروع محدد
    if (user?.role !== 'admin') {
      // إذا لم يتم تعيين مشروع تلقائياً، حاول تعيين المشروع الأول من القائمة
      if ((!projectId || projectId === "" || projectId === "none") && 
          userProjects && Array.isArray(userProjects) && userProjects.length > 0) {
        form.setValue('projectId', userProjects[0].id.toString());
        return true;
      }
      
      // إذا لم يكن هناك مشاريع متاحة للمستخدم
      if (!userProjects || !Array.isArray(userProjects) || userProjects.length === 0) {
        toast({
          variant: "destructive",
          title: "خطأ في البيانات",
          description: "لا توجد مشاريع مخصصة لك. يرجى الاتصال بالمدير",
        });
        return false;
      }
    }
    
    return true;
  };

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      try {
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
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تمت العملية بنجاح",
        description: "تم حفظ المعاملة المالية بنجاح",
      });
      // إعادة تعيين النموذج مع الحفاظ على المشروع للمستخدمين العاديين
      const resetProjectId = user?.role !== 'admin' && userProjects && Array.isArray(userProjects) && userProjects.length > 0 
        ? userProjects[0].id.toString() 
        : "";
        
      form.reset({
        date: new Date(),
        type: "expense",
        amount: 0,
        projectId: resetProjectId,
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
    // التحقق من اختيار المشروع للمستخدمين العاديين
    if (!validateProjectSelection()) {
      return;
    }
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

  return (
    <Card className="border border-blue-100 dark:border-blue-900 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary dark:text-blue-400">
          <PiggyBankIcon className="h-5 w-5" />
          إضافة عملية مالية جديدة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            
            {/* الصف الأول: التاريخ ونوع العملية والمبلغ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 text-right justify-between"
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
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setTransactionType(value);
                      // إعادة تعيين نوع المصروف عند تغيير نوع العملية
                      if (value === "expense") {
                        form.setValue("expenseType", "مصروف عام");
                      } else {
                        form.setValue("expenseType", undefined);
                      }
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">
                          <div className="flex items-center gap-2">
                            <PiggyBankIcon className="h-4 w-4 text-green-500" />
                            دخل
                          </div>
                        </SelectItem>
                        <SelectItem value="expense">
                          <div className="flex items-center gap-2">
                            <CoinsIcon className="h-4 w-4 text-red-500" />
                            مصروف
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const [displayValue, setDisplayValue] = React.useState('');

                  React.useEffect(() => {
                    if (field.value) {
                      setDisplayValue(field.value.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      }));
                    } else {
                      setDisplayValue('');
                    }
                  }, [field.value]);

                  return (
                    <FormItem>
                      <FormLabel>المبلغ (د.ع)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="مثال: 1,000.50"
                          className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 text-left"
                          value={displayValue}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setDisplayValue(value);
                            const numValue = parseFloat(value) || 0;
                            field.onChange(numValue);
                          }}
                          onBlur={() => {
                            if (field.value) {
                              setDisplayValue(field.value.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              }));
                            }
                          }}
                          onFocus={() => {
                            setDisplayValue(field.value ? field.value.toString() : '');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <ExpenseTypeField transactionType={transactionType} form={form} />

            {/* الصف الثاني: المشروع (فقط للمدير أو إذا كان للمستخدم أكثر من مشروع) */}
            {((user?.role === 'admin') || (user?.role !== 'admin' && userProjects && Array.isArray(userProjects) && userProjects.length > 1)) && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-10 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700">
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === 'admin' && (
                          <SelectItem value="none">
                            الصندوق الرئيسي
                          </SelectItem>
                        )}
                        {(user?.role === 'admin' ? projects : (Array.isArray(userProjects) ? userProjects : [])).map((project: any) => (
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
            )}

            {/* الصف الثالث: الوصف */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف العملية</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصفاً مفصلاً للعملية المالية"
                      className="w-full min-h-20 rounded-lg bg-white dark:bg-gray-700 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* الصف الرابع: المرفقات */}
            <div className="space-y-3">
              <label className="text-sm font-medium">مرفق (اختياري)</label>
              
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
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
                      className="h-8 w-8 p-0"
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
            <Button
              type="submit"
              disabled={mutation.isPending || isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              {mutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SaveIcon className="h-4 w-4" />
                  حفظ العملية المالية
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}