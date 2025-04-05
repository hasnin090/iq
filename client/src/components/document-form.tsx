import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Upload, File, FileImage, FileText, FileIcon, 
  AlertCircle, CheckCircle, Trash2, UploadCloud, Info 
} from 'lucide-react';
import { 
  uploadFile, 
  getFileType, 
  getReadableFileSize 
} from '@/lib/firebase-storage';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Project {
  id: number;
  name: string;
}

interface DocumentFormProps {
  projects: Project[];
  onSubmit: () => void;
  isLoading: boolean;
  isManagerDocument?: boolean; // إضافة خاصية لتحديد ما إذا كان المستند إدارياً
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [
  // PDF files
  "application/pdf", 
  // Image files
  "image/jpeg", 
  "image/png", 
  "image/jpg", 
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Document files
  "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "text/plain",
  "text/rtf",
  "application/rtf",
  // Spreadsheet files
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Presentation files
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Compressed files
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  // Audio files
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  // Video files
  "video/mp4",
  "video/mpeg",
  "video/quicktime"
];

const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.mp3,.wav,.mp4,.mpeg,.mov";

const documentSchema = z.object({
  name: z.string().min(3, "اسم المستند يجب أن يحتوي على الأقل 3 أحرف"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  file: z
    .any()
    .refine((file) => !!file, "الملف مطلوب")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `حجم الملف يجب أن يكون أقل من ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      `صيغة الملف غير مدعومة. الصيغ المدعومة: ${ACCEPTED_FILE_EXTENSIONS.replaceAll(',', ', ')}`
    ),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export function DocumentForm({ projects, onSubmit, isLoading, isManagerDocument = false }: DocumentFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId: "",
    },
  });
  
  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    form.setValue("file", selectedFile);
    
    // محاولة استخدام اسم الملف كاسم للمستند إذا كان حقل الاسم فارغًا
    if (!form.getValues("name")) {
      // إزالة الامتداد من اسم الملف
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      form.setValue("name", fileName);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const updateUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };
  
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileIcon className="h-12 w-12 text-muted-foreground" />;
    
    if (fileType.includes('pdf')) {
      return <File className="h-12 w-12 text-destructive" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-12 w-12 text-primary" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-12 w-12 text-primary-light" />;
    } else {
      return <FileIcon className="h-12 w-12 text-muted-foreground" />;
    }
  };
  
  const getFileTypeBadge = (fileType?: string) => {
    if (!fileType) return null;
    
    const type = getFileType(fileType);
    
    let color = "";
    switch(type) {
      case 'pdf':
        color = "bg-destructive/10 text-destructive border-destructive/20";
        break;
      case 'image':
        color = "bg-primary/10 text-primary border-primary/20";
        break;
      case 'document':
        color = "bg-primary-light/10 text-primary-light border-primary-light/20";
        break;
      default:
        color = "bg-muted/10 text-muted-foreground border-muted/20";
    }
    
    return (
      <Badge variant="outline" className={`${color} capitalize`}>
        {type}
      </Badge>
    );
  };
  
  const mutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      if (!file) {
        throw new Error("يرجى اختيار ملف للتحميل");
      }
      
      try {
        // تحديث شريط التقدم للإشعار بأن العملية بدأت
        setUploadProgress(5);
        console.log("تحديث نسبة التقدم إلى 5% قبل بدء التحميل");
        
        // إنشاء FormData لرفع الملف عبر REST API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', data.name);
        formData.append('description', data.description || "");
        if (data.projectId && data.projectId !== "all") {
          formData.append('projectId', data.projectId);
        }
        formData.append('isManagerDocument', isManagerDocument.toString());
        
        console.log("معلومات الملف - الاسم:", file.name, "الحجم:", file.size, "النوع:", file.type);
        
        // محاكاة تقدم التحميل
        const simulateProgress = () => {
          let progress = 5;
          const interval = setInterval(() => {
            // زيادة التقدم تدريجياً حتى 90% (سنترك 10% للمعالجة النهائية)
            if (progress < 90) {
              progress += Math.floor(Math.random() * 5) + 1;
              progress = Math.min(progress, 90);
              setUploadProgress(progress);
            } else {
              clearInterval(interval);
            }
          }, 300);
          
          return () => clearInterval(interval);
        };
        
        // بدء محاكاة التقدم
        const stopSimulation = simulateProgress();
        
        try {
          // استخدام Fetch API بدلاً من Firebase Storage مباشرة
          console.log("بدء رفع الملف إلى الخادم...");
          
          const response = await fetch('/api/upload-document', {
            method: 'POST',
            body: formData,
            // لا تضع headers هنا، دع المتصفح يحددها تلقائيًا مع FormData
          });
          
          // إيقاف محاكاة التقدم
          stopSimulation();
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'فشل في رفع الملف' }));
            throw new Error(errorData.message || 'فشل في رفع الملف');
          }
          
          // تحديث التقدم إلى 95%
          setUploadProgress(95);
          
          // الحصول على البيانات الناتجة
          const result = await response.json();
          console.log("تم رفع الملف بنجاح:", result);
          
          // تحديث التقدم إلى 100% للتأكد من اكتمال العملية
          setUploadProgress(100);
          console.log("اكتمل رفع المستند بنجاح");
          
          // مهلة قصيرة للتأكد من أن المستخدم يرى نسبة التقدم 100%
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // نعيد البيانات التي تم استلامها من الخادم
          return result;
        } catch (error) {
          // إيقاف محاكاة التقدم في حالة حدوث خطأ
          stopSimulation();
          console.error("خطأ أثناء رفع الملف:", error);
          throw error;
        }
      } catch (error) {
        // إعادة تعيين شريط التقدم في حالة وجود خطأ
        console.error("خطأ أثناء عملية التحميل:", error);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "تمت العملية بنجاح",
        description: "تم رفع المستند بنجاح",
      });
      form.reset({
        name: "",
        description: "",
        projectId: "",
      });
      setFile(null);
      setUploadProgress(0);
      onSubmit();
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في رفع المستند",
      });
    },
  });
  
  function onFormSubmit(data: DocumentFormValues) {
    mutation.mutate(data);
  }
  
  return (
    <div className="bg-secondary-light rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-primary-light mb-4">رفع مستند جديد</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستند</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="أدخل اسم المستند"
                      className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                      disabled={isLoading || mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      <SelectTrigger className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                        <SelectValue placeholder="اختر المشروع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">عام</SelectItem>
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
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وصف المستند</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="أدخل وصف المستند (اختياري)"
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                    disabled={isLoading || mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="file"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  الملف
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex">
                          <Info className="h-4 w-4 mr-1 text-muted-foreground cursor-help" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          يمكنك رفع ملفات بصيغة PDF أو صور (JPG, PNG) أو مستندات (DOC, DOCX) أو ملفات نصية (TXT) أو جداول بيانات (XLS, XLSX).
                          الحد الأقصى لحجم الملف هو {MAX_FILE_SIZE / 1024 / 1024} ميجابايت.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                    ${isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/80'
                    } 
                    ${mutation.isPending ? 'opacity-60' : ''}
                  `}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center mb-2">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {getReadableFileSize(file.size)}
                          </p>
                          {getFileTypeBadge(file.type)}
                        </div>
                      </div>
                      
                      <div className="flex justify-center mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            onChange(null);
                          }}
                          className="mr-2"
                          disabled={isLoading || mutation.isPending}
                        >
                          <Trash2 className="ml-1 h-4 w-4" />
                          حذف
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading || mutation.isPending}
                        >
                          <Upload className="ml-1 h-4 w-4" />
                          تغيير
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-base font-medium">اضغط لاختيار ملف أو قم بسحب الملف وإفلاته هنا</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          PDF، صور (JPG, PNG, GIF, SVG)، مستندات (DOC, DOCX, TXT, RTF)، أوراق عمل (XLS, XLSX)، عروض تقديمية (PPT, PPTX)، ملفات مضغوطة (ZIP, RAR)، وسائط (MP3, WAV, MP4) - أقصى حجم {MAX_FILE_SIZE / 1024 / 1024} ميجابايت
                        </p>
                      </div>
                      
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          handleInputChange(e);
                          onChange(e.target.files?.[0] || null);
                        }}
                        accept={ACCEPTED_FILE_EXTENSIONS}
                        disabled={isLoading || mutation.isPending}
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="relative"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || mutation.isPending}
                      >
                        <Upload className="ml-2 h-4 w-4" />
                        اختيار ملف
                      </Button>
                    </div>
                  )}
                </div>

                <FormMessage />
                
                {form.formState.errors.file && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>خطأ في الملف</AlertTitle>
                    <AlertDescription>
                      {form.formState.errors.file.message as string}
                    </AlertDescription>
                  </Alert>
                )}
              </FormItem>
            )}
          />
          
          {mutation.isPending && (
            <div className="space-y-2 border-2 border-primary/10 rounded-lg p-3 bg-primary/5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 ml-2 animate-spin text-primary" />
                  <span className="text-sm font-medium text-primary-light">جاري رفع الملف...</span>
                </div>
                <span className="text-sm font-bold text-primary bg-white px-3 py-1 rounded-full shadow-sm border border-primary/10">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-3 bg-white" />
              <p className="text-xs text-center text-muted-foreground mt-1">
                {uploadProgress < 20 ? 'بدء التحميل...' : 
                 uploadProgress < 60 ? 'جاري رفع الملف، يرجى الانتظار...' : 
                 uploadProgress < 90 ? 'اقترب التحميل من الانتهاء...' : 
                 'جاري إكمال العملية...'}
              </p>
            </div>
          )}
          
          <div className="text-center pt-2">
            <Button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              disabled={isLoading || mutation.isPending || !file}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <UploadCloud className="ml-2 h-4 w-4" />
                  رفع المستند
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
