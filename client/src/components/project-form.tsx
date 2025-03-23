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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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
      return apiRequest('POST', '/api/projects', data);
    },
    onSuccess: () => {
      toast({
        title: "تمت العملية بنجاح",
        description: "تم حفظ المشروع بنجاح",
      });
      form.reset({
        name: "",
        description: "",
        startDate: new Date(),
        status: "active",
      });
      onSubmit();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ المشروع",
      });
    },
  });
  
  function onFormSubmit(data: ProjectFormValues) {
    mutation.mutate(data);
  }
  
  return (
    <div className="bg-secondary-light rounded-xl shadow-card p-6">
      <h3 className="text-lg font-bold text-primary-light mb-4">إضافة مشروع جديد</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المشروع</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="أدخل اسم المشروع"
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
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاريخ البدء</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light text-right justify-between items-center"
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
                    <SelectTrigger className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
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
                <FormLabel>وصف المشروع</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="أدخل وصف المشروع"
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
              ) : "حفظ المشروع"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
