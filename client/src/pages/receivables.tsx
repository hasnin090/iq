import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  User, 
  Search, 
  CreditCard, 
  Trash2,
  Calendar
} from "lucide-react";
import type { DeferredPayment, Project } from "@shared/schema";

const formSchema = z.object({
  operationType: z.enum(["new_receivable", "payment"], {
    required_error: "يجب تحديد نوع العملية"
  }),
  // Fields for new receivable
  beneficiaryName: z.string().optional(),
  totalAmount: z.number().optional(),
  projectId: z.number().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  initialPayment: z.number().optional(),
  // Fields for payment
  receivableId: z.number().optional(),
  paymentAmount: z.number().optional(),
  paymentNotes: z.string().optional()
}).refine((data) => {
  if (data.operationType === "new_receivable") {
    return data.beneficiaryName && data.beneficiaryName.length > 0 && 
           data.totalAmount && data.totalAmount > 0;
  }
  if (data.operationType === "payment") {
    return data.receivableId && data.paymentAmount && data.paymentAmount > 0;
  }
  return false;
}, {
  message: "البيانات المطلوبة غير مكتملة"
});

type FormData = z.infer<typeof formSchema>;

export default function Receivables() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedReceivable, setSelectedReceivable] = useState<DeferredPayment | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  const { data: receivables = [], isLoading } = useQuery<DeferredPayment[]>({
    queryKey: ["/api/deferred-payments"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const mainForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operationType: "new_receivable",
      beneficiaryName: "",
      totalAmount: 0,
      projectId: undefined,
      description: "",
      dueDate: "",
      initialPayment: 0,
      paymentAmount: 0,
      paymentNotes: ""
    }
  });

  const operationType = mainForm.watch("operationType");

  const addReceivableMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/deferred-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          userId: user?.id,
          installments: 1,
          paymentFrequency: "monthly",
        }),
      });
      if (!response.ok) throw new Error("فشل في إضافة المستحق");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      addForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المستحق الجديد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل المستحق",
        variant: "destructive",
      });
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const response = await fetch(`/api/deferred-payments/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error("فشل في دفع المبلغ");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      setIsPayDialogOpen(false);
      payForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم دفع المبلغ",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في دفع المبلغ",
        variant: "destructive",
      });
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/deferred-payments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("فشل في حذف المستحق");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المستحق",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المستحق",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  // Filter receivables
  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = receivable.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receivable.description && receivable.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProject = selectedProject === "all" || 
      receivable.projectId?.toString() === selectedProject;
    
    return matchesSearch && matchesProject;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">المستحقات</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">تسجيل المستحقات للأشخاص والموردين</p>
      </div>

      {/* Add Receivable Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            تسجيل مستحق جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addReceivableMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="beneficiaryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستفيد</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستفيد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ المستحق</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="أدخل المبلغ المستحق"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المشروع (اختياري)</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : "none"} 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون مشروع</SelectItem>
                          {projects.map((project: Project) => (
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

                <FormField
                  control={addForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="وصف طبيعة المستحق أو العمل المطلوب" 
                        {...field} 
                        className="min-h-[60px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={addReceivableMutation.isPending} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {addReceivableMutation.isPending ? "جاري الإضافة..." : "إضافة المستحق"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => addForm.reset()}
                >
                  مسح الحقول
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث في المستحقات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receivables List */}
      <div className="space-y-4">
        {filteredReceivables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مستحقات مسجلة</h3>
              <p className="text-gray-600 mb-4">استخدم النموذج أعلاه لإضافة مستحق جديد</p>
            </CardContent>
          </Card>
        ) : (
          filteredReceivables.map((receivable: DeferredPayment) => (
            <Card key={receivable.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{receivable.beneficiaryName}</h3>
                  <Badge variant={receivable.status === 'completed' ? 'default' : 'secondary'}>
                    {receivable.status === 'completed' ? 'مكتمل' : 'معلق'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">المبلغ المستحق</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(receivable.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المدفوع</p>
                    <p className="font-semibold text-green-600">{formatCurrency(receivable.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">المتبقي</p>
                    <p className="font-semibold text-red-600">{formatCurrency(receivable.remainingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الاستحقاق</p>
                    <p className="font-semibold">
                      {receivable.dueDate ? new Date(receivable.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </p>
                  </div>
                </div>

                {receivable.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">الوصف</p>
                    <p className="text-sm">{receivable.description}</p>
                  </div>
                )}

                {projects.find(p => p.id === receivable.projectId) && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">المشروع</p>
                    <p className="text-sm font-medium">{projects.find(p => p.id === receivable.projectId)?.name}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {receivable.status !== 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedReceivable(receivable);
                        setIsPayDialogOpen(true);
                      }}
                    >
                      <CreditCard className="w-4 h-4 ml-1" />
                      دفع مبلغ
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReceivableMutation.mutate(receivable.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>دفع مبلغ</DialogTitle>
          </DialogHeader>
          {selectedReceivable && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedReceivable.beneficiaryName}</p>
                <p className="text-sm text-gray-600">المتبقي: {formatCurrency(selectedReceivable.remainingAmount)}</p>
              </div>
              
              <Form {...payForm}>
                <form onSubmit={payForm.handleSubmit((data) => 
                  payInstallmentMutation.mutate({ id: selectedReceivable.id, amount: data.amount })
                )} className="space-y-4">
                  <FormField
                    control={payForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المبلغ المدفوع</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="أدخل المبلغ المدفوع"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={payInstallmentMutation.isPending}
                      className="flex-1"
                    >
                      {payInstallmentMutation.isPending ? "جاري الدفع..." : "دفع"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPayDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}