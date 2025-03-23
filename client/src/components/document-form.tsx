import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload } from 'lucide-react';
import { uploadFile, getFileType, getReadableFileSize } from '@/lib/firebase-storage';
import { useAuth } from '@/hooks/use-auth';

interface Project {
  id: number;
  name: string;
}

interface DocumentFormProps {
  projects: Project[];
  onSubmit: () => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const documentSchema = z.object({
  name: z.string().min(3, "اسم المستند يجب أن يحتوي على الأقل 3 أحرف"),
  description: z.string().optional(),
  projectId: z.string().optional(),
  file: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, "حجم الملف يجب أن يكون أقل من 5 ميجابايت")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      "صيغة الملف غير مدعومة. الصيغ المدعومة: PDF, JPEG, PNG, DOC, DOCX"
    ),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export function DocumentForm({ projects, onSubmit, isLoading }: DocumentFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const { user } = useAuth();
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId: "",
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      form.setValue("file", selectedFile);
    }
  };
  
  const mutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      if (!file) {
        throw new Error("يرجى اختيار ملف للتحميل");
      }
      
      setUploading(true);
      try {
        // تحميل الملف إلى Firebase Storage
        const userId = user?.id || 'unknown';
        const storageFolder = `documents/${userId}`;
        const fileUrl = await uploadFile(file, storageFolder);
        
        // بمجرد اكتمال التحميل، حفظ المعلومات في قاعدة البيانات
        return apiRequest('POST', '/api/documents', {
          name: data.name,
          description: data.description || "",
          projectId: data.projectId ? parseInt(data.projectId) : undefined,
          fileUrl: fileUrl,
          fileType: file.type,
          uploadDate: new Date()
        });
      } finally {
        setUploading(false);
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
      onSubmit();
    },
    onError: (error) => {
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
                      <SelectItem value="">عام</SelectItem>
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
                <FormLabel>الملف</FormLabel>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">تم اختيار: {file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB - {file.type}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          onChange(null);
                        }}
                        className="mt-2"
                        disabled={isLoading || mutation.isPending}
                      >
                        اختيار ملف آخر
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">اضغط لاختيار ملف أو قم بسحب الملف وإفلاته هنا</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPEG, PNG, DOC, DOCX - أقصى حجم 5 ميجابايت
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          handleFileChange(e);
                          onChange(e.target.files?.[0] || null);
                        }}
                        accept=".pdf,.jpeg,.jpg,.png,.doc,.docx"
                        disabled={isLoading || mutation.isPending}
                        {...rest}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isLoading || mutation.isPending}
                      >
                        اختيار ملف
                      </Button>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-center">
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
              ) : "رفع المستند"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
