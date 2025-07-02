import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Upload, Trash2, FileText, Calendar, DollarSign, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const completedWorkSchema = z.object({
  title: z.string().min(1, "عنوان العمل مطلوب"),
  description: z.string().optional(),
  amount: z.number().optional(),
  date: z.string(),
  category: z.string().optional(),
  file: z.any().optional()
});

const documentSchema = z.object({
  title: z.string().min(1, "عنوان المستند مطلوب"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  file: z.any()
});

type CompletedWork = {
  id: number;
  title: string;
  description?: string;
  amount?: number;
  date: string;
  category?: string;
  fileUrl?: string;
  fileType?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
};

type CompletedWorksDocument = {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  category?: string;
  tags?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
};

export default function CompletedWorksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  const workForm = useForm<z.infer<typeof completedWorkSchema>>({
    resolver: zodResolver(completedWorkSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      category: "",
    },
  });

  const documentForm = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
    },
  });

  const { data: works = [], isLoading: worksLoading } = useQuery({
    queryKey: ['/api/completed-works'],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/completed-works-documents'],
  });

  const createWorkMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/completed-works', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('فشل في إنشاء العمل المنجز');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-works'] });
      setWorkDialogOpen(false);
      workForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء العمل المنجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/completed-works-documents', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('فشل في إنشاء المستند');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-works-documents'] });
      setDocumentDialogOpen(false);
      documentForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء المستند بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWorkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/completed-works/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('فشل في حذف العمل المنجز');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-works'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف العمل المنجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/completed-works-documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('فشل في حذف المستند');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/completed-works-documents'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المستند بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onWorkSubmit = (values: z.infer<typeof completedWorkSchema>) => {
    const formData = new FormData();
    formData.append('title', values.title);
    if (values.description) formData.append('description', values.description);
    if (values.amount) formData.append('amount', values.amount.toString());
    formData.append('date', values.date);
    if (values.category) formData.append('category', values.category);
    if (values.file && values.file[0]) {
      formData.append('file', values.file[0]);
    }

    createWorkMutation.mutate(formData);
  };

  const onDocumentSubmit = (values: z.infer<typeof documentSchema>) => {
    if (!values.file || !values.file[0]) {
      toast({
        title: "خطأ",
        description: "يجب تحديد ملف",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    if (values.description) formData.append('description', values.description);
    if (values.category) formData.append('category', values.category);
    if (values.tags) formData.append('tags', values.tags);
    formData.append('file', values.file[0]);

    createDocumentMutation.mutate(formData);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header - محسن للجوال */}
        <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-start">
          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">الأعمال المنجزة</h1>
            <p className="text-sm sm:text-base text-muted-foreground">قسم مستقل للمدير لإدارة الأعمال والمستندات</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة عمل منجز
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-2xl mx-4" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة عمل منجز جديد</DialogTitle>
                </DialogHeader>
                <Form {...workForm}>
                  <form onSubmit={workForm.handleSubmit(onWorkSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={workForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="عنوان العمل المنجز" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={workForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التصنيف</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="تصنيف العمل" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={workForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="وصف تفصيلي للعمل المنجز" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={workForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المبلغ (اختياري)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || ''}
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={workForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التاريخ</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={workForm.control}
                      name="file"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مرفق (اختياري)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              onChange={e => field.onChange(e.target.files)}
                              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setWorkDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={createWorkMutation.isPending}>
                        {createWorkMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Upload className="ml-2 h-4 w-4" />
                  رفع مستند
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-2xl mx-4" dir="rtl">
                <DialogHeader>
                  <DialogTitle>رفع مستند جديد</DialogTitle>
                </DialogHeader>
                <Form {...documentForm}>
                  <form onSubmit={documentForm.handleSubmit(onDocumentSubmit)} className="space-y-4">
                    <FormField
                      control={documentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان المستند</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="عنوان المستند" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={documentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوصف</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="وصف المستند" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={documentForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التصنيف</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="تصنيف المستند" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentForm.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العلامات</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="علامات مفصولة بفاصلة" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={documentForm.control}
                      name="file"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الملف *</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              onChange={e => field.onChange(e.target.files)}
                              accept="*/*"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={createDocumentMutation.isPending}>
                        {createDocumentMutation.isPending ? "جاري الرفع..." : "رفع"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="works" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="works">الأعمال المنجزة</TabsTrigger>
            <TabsTrigger value="documents">المستندات</TabsTrigger>
          </TabsList>

          <TabsContent value="works" className="space-y-4">
            {worksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (works as CompletedWork[]).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أعمال منجزة</h3>
                  <p className="text-gray-500 mb-4">ابدأ بإضافة أول عمل منجز</p>
                  <Button onClick={() => setWorkDialogOpen(true)}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة عمل منجز
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(works as CompletedWork[]).map((work) => (
                  <Card key={work.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg leading-6">{work.title}</CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteWorkMutation.mutate(work.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {work.category && (
                        <Badge variant="secondary" className="w-fit">
                          <Tag className="ml-1 h-3 w-3" />
                          {work.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {work.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="ml-2 h-4 w-4" />
                          {new Date(work.date).toLocaleDateString('ar-SA')}
                        </div>
                        
                        {work.amount && (
                          <div className="flex items-center text-sm text-green-600">
                            <DollarSign className="ml-2 h-4 w-4" />
                            {formatCurrency(work.amount)}
                          </div>
                        )}
                        
                        {work.fileUrl && (
                          <div className="flex items-center text-sm text-blue-600">
                            <FileText className="ml-2 h-4 w-4" />
                            <a href={work.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              عرض المرفق
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {documentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (documents as CompletedWorksDocument[]).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستندات</h3>
                  <p className="text-gray-500 mb-4">ابدأ برفع أول مستند</p>
                  <Button onClick={() => setDocumentDialogOpen(true)}>
                    <Upload className="ml-2 h-4 w-4" />
                    رفع مستند
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(documents as CompletedWorksDocument[]).map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg leading-6">{doc.title}</CardTitle>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doc.category && (
                          <Badge variant="secondary">
                            <Tag className="ml-1 h-3 w-3" />
                            {doc.category}
                          </Badge>
                        )}
                        {doc.fileSize && (
                          <Badge variant="outline">
                            {formatFileSize(doc.fileSize)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {doc.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                      )}
                      
                      {doc.tags && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                        <Button size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="ml-2 h-4 w-4" />
                            عرض
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}