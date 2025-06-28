import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Building2,
  CreditCard,
  Trash2,
  Eye,
  Receipt,
  CheckCircle,
  AlertCircle,
  History,
  X,
  BarChart3
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
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
  const [showDetails, setShowDetails] = useState(false);

  const { data: receivables = [], isLoading } = useQuery<DeferredPayment[]>({
    queryKey: ["/api/deferred-payments"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // جلب تفاصيل مستحق معين مع عمليات الدفع
  const { data: receivableDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/deferred-payments", selectedReceivable?.id, "details"],
    queryFn: async () => {
      if (!selectedReceivable?.id) return null;
      const response = await fetch(`/api/deferred-payments/${selectedReceivable.id}/details`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("فشل في تحميل تفاصيل المستحق");
      return response.json();
    },
    enabled: !!selectedReceivable?.id,
    staleTime: 1000 * 60 * 2, // دقيقتان
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

  const mainFormMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (data.operationType === "new_receivable") {
        // Create new receivable with optional initial payment
        const response = await fetch("/api/deferred-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            beneficiaryName: data.beneficiaryName,
            totalAmount: data.totalAmount,
            remainingAmount: data.totalAmount,
            projectId: data.projectId,
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
            userId: user?.id,
            installments: 1,
            paymentFrequency: "monthly",
          }),
        });
        if (!response.ok) throw new Error("فشل في إضافة المستحق");
        
        const newReceivable = await response.json();
        
        // Add initial payment if provided
        if (data.initialPayment && data.initialPayment > 0) {
          const paymentResponse = await fetch(`/api/deferred-payments/${newReceivable.id}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              amount: data.initialPayment,
              userId: user?.id,
              notes: "دفعة أولى"
            }),
          });
          if (!paymentResponse.ok) throw new Error("فشل في تسجيل الدفعة الأولى");
        }
        
        return newReceivable;
      } else if (data.operationType === "payment") {
        // Make payment to existing receivable
        const response = await fetch(`/api/deferred-payments/${data.receivableId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount: data.paymentAmount,
            userId: user?.id,
            notes: data.paymentNotes || "دفعة"
          }),
        });
        if (!response.ok) throw new Error("فشل في تسجيل الدفعة");
        return response.json();
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      mainForm.reset({
        operationType: "new_receivable",
        beneficiaryName: "",
        totalAmount: 0,
        projectId: undefined,
        description: "",
        dueDate: "",
        initialPayment: 0,
        paymentAmount: 0,
        paymentNotes: ""
      });
      toast({
        title: "تم بنجاح",
        description: variables.operationType === "new_receivable" 
          ? "تم تسجيل المستحق الجديد" 
          : "تم تسجيل الدفعة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تنفيذ العملية",
        variant: "destructive",
      });
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/deferred-payments/${id}`, {
        method: "DELETE",
        credentials: "include",
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

  // وظائف مساعدة
  const handleViewDetails = (receivable: DeferredPayment) => {
    setSelectedReceivable(receivable);
    setShowDetails(true);
  };

  const calculateReceivableStats = (details: any) => {
    if (!details || !details.payments) return {
      totalPaid: details?.paidAmount || 0,
      totalPayments: 0,
      remainingAmount: (details?.totalAmount || 0) - (details?.paidAmount || 0),
      completionPercentage: details?.totalAmount > 0 ? Math.round(((details?.paidAmount || 0) / details.totalAmount) * 100) : 0
    };

    const totalPaid = details.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const totalPayments = details.payments.length;
    const remainingAmount = details.totalAmount - totalPaid;
    const completionPercentage = details.totalAmount > 0 ? Math.round((totalPaid / details.totalAmount) * 100) : 0;

    return {
      totalPaid,
      totalPayments,
      remainingAmount,
      completionPercentage
    };
  };

  // Filter receivables based on search and project
  const filteredReceivables = receivables.filter((receivable: DeferredPayment) => {
    const matchesSearch = receivable.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (receivable.description && receivable.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProject = selectedProject === "all" || 
                          (receivable.projectId && receivable.projectId.toString() === selectedProject);
    return matchesSearch && matchesProject;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">المستحقات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">جاري التحميل...</p>
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

      {/* Main Form - Conditional based on operation type */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {operationType === "new_receivable" ? "تسجيل مستحق جديد" : "تسديد دفعة"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...mainForm}>
            <form onSubmit={mainForm.handleSubmit((data) => mainFormMutation.mutate(data))} className="space-y-4">
              {/* Operation Type Selector */}
              <FormField
                control={mainForm.control}
                name="operationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العملية</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر نوع العملية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new_receivable">تسجيل مستحق جديد</SelectItem>
                        <SelectItem value="payment">تسديد دفعة لمستحق موجود</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Receivable Fields */}
              {operationType === "new_receivable" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={mainForm.control}
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
                      control={mainForm.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المبلغ المستحق الكلي</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                placeholder="0"
                                min="1"
                                step="1"
                                className="pl-12 text-right font-mono"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? "" : Number(value));
                                }}
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                                د.ع
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={mainForm.control}
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
                      control={mainForm.control}
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
                    control={mainForm.control}
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

                  <FormField
                    control={mainForm.control}
                    name="initialPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الدفعة الأولى (اختياري)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              placeholder="0"
                              min="0"
                              step="1"
                              className="pl-12 text-right font-mono"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? "" : Number(value));
                              }}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                              د.ع
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Payment Fields */}
              {operationType === "payment" && (
                <>
                  <FormField
                    control={mainForm.control}
                    name="receivableId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المستحق المراد التسديد له</FormLabel>
                        <Select 
                          value={field.value ? field.value.toString() : ""} 
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المستحق" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {receivables
                              .filter((r: DeferredPayment) => r.paidAmount < r.totalAmount)
                              .map((receivable: DeferredPayment) => (
                                <SelectItem key={receivable.id} value={receivable.id.toString()}>
                                  {receivable.beneficiaryName} - متبقي: {(receivable.totalAmount - receivable.paidAmount).toLocaleString()} ج.م
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={mainForm.control}
                      name="paymentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مبلغ الدفعة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                placeholder="0"
                                min="1"
                                step="1"
                                className="pl-12 text-right font-mono"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? "" : Number(value));
                                }}
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                                د.ع
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={mainForm.control}
                      name="paymentNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات الدفعة (اختياري)</FormLabel>
                          <FormControl>
                            <Input placeholder="ملاحظات أو تفاصيل الدفعة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={mainFormMutation.isPending} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {mainFormMutation.isPending ? "جاري المعالجة..." : (
                    operationType === "new_receivable" ? "إضافة المستحق" : "تسجيل الدفعة"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => mainForm.reset()}
                >
                  مسح الحقول
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="ابحث بالاسم أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية بالمشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((project: Project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {receivable.beneficiaryName}
                    </h3>
                    <Badge variant={receivable.paidAmount >= receivable.totalAmount ? "default" : "secondary"}>
                      {receivable.paidAmount >= receivable.totalAmount ? "مكتمل" : "معلق"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReceivableMutation.mutate(receivable.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">المستحق:</span>
                    <span className="font-medium">{receivable.totalAmount.toLocaleString()} دينار عراقي</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">المدفوع:</span>
                    <span className="font-medium">{receivable.paidAmount.toLocaleString()} دينار عراقي</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">المتبقي:</span>
                    <span className="font-medium">
                      {(receivable.totalAmount - receivable.paidAmount).toLocaleString()} دينار عراقي
                    </span>
                  </div>
                </div>

                {receivable.dueDate && (
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">تاريخ الاستحقاق:</span>
                    <span className="text-sm">
                      {new Date(receivable.dueDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                )}

                {receivable.description && (
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-sm text-gray-600">الوصف:</span>
                    <span className="text-sm flex-1">{receivable.description}</span>
                  </div>
                )}

                {receivable.projectId && (
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">المشروع:</span>
                    <span className="text-sm">
                      {projects.find((p: Project) => p.id === receivable.projectId)?.name || "غير محدد"}
                    </span>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(receivable)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    عرض التفاصيل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      mainForm.setValue("operationType", "payment");
                      mainForm.setValue("receivableId", receivable.id);
                    }}
                    className="flex-1"
                    disabled={receivable.paidAmount >= receivable.totalAmount}
                  >
                    <DollarSign className="w-4 h-4 ml-1" />
                    إضافة دفعة
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* نافذة تفاصيل المستحق المحسنة */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-gray-50 dark:bg-gray-900" dir="rtl">
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl">{selectedReceivable?.beneficiaryName}</div>
                <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  سجل تسديد الدفعات المستحقة
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(95vh-120px)] px-1">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4"></div>
                <span className="text-gray-600 dark:text-gray-400">جاري تحميل تفاصيل المدفوعات...</span>
              </div>
            ) : receivableDetails ? (
              <div className="space-y-6">
                {/* بطاقة المعلومات الأساسية المحسنة */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* معلومات المستحق */}
                  <Card className="bg-white dark:bg-gray-800 border-none shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        معلومات المستحق
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">اسم المستفيد:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{receivableDetails.beneficiaryName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">المبلغ الإجمالي:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                            {receivableDetails.totalAmount?.toLocaleString()} د.ع
                          </span>
                        </div>
                        {receivableDetails.dueDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">تاريخ الاستحقاق:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {new Date(receivableDetails.dueDate).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">الحالة:</span>
                          <Badge 
                            variant={receivableDetails.paidAmount >= receivableDetails.totalAmount ? 'default' : 
                                   receivableDetails.paidAmount > 0 ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {receivableDetails.paidAmount >= receivableDetails.totalAmount ? 'مدفوع بالكامل' : 
                             receivableDetails.paidAmount > 0 ? 'مدفوع جزئياً' : 'غير مدفوع'}
                          </Badge>
                        </div>
                      </div>
                      {receivableDetails.description && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm block mb-2">الوصف:</span>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                            {receivableDetails.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">إحصائيات الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const stats = calculateReceivableStats(receivableDetails);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">إجمالي المدفوع:</span>
                            <span className="font-bold text-green-600">{stats.totalPaid.toLocaleString()} دينار عراقي</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">المبلغ المتبقي:</span>
                            <span className="font-bold text-red-600">{stats.remainingAmount.toLocaleString()} دينار عراقي</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">عدد الدفعات:</span>
                            <span className="font-medium">{stats.totalPayments} دفعة</span>
                          </div>
                          <div className="pt-2">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-600">نسبة الإنجاز:</span>
                              <span className="font-bold">{stats.completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stats.completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

                {/* جدول التسديدات المحسن */}
                <Card className="bg-white dark:bg-gray-800 border-none shadow-lg">
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      سجل تسديدات المستحق
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      عرض جميع عمليات التسديد المؤكدة فقط (بدون المدفوعات النقدية العادية)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {receivableDetails.payments && receivableDetails.payments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">م</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">نوع التسديد</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">التاريخ</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">المبلغ</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">الوصف</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">المسؤول</TableHead>
                              <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">الحالة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {receivableDetails.payments.map((payment: any, index: number) => (
                              <TableRow 
                                key={payment.id || index} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700"
                              >
                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      payment.entryType === 'historical_settlement' 
                                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700' 
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                    }
                                  >
                                    {payment.paymentType || (payment.entryType === 'historical_settlement' ? 'تسديد تاريخي' : 'تسديد مؤكد')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {new Date(payment.paymentDate || payment.date || payment.createdAt).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(payment.paymentDate || payment.date || payment.createdAt).toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-right">
                                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                                      {payment.amount?.toLocaleString()}
                                    </span>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">دينار عراقي</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate" title={payment.description || payment.notes}>
                                      {payment.description || payment.notes || 'تسديد مستحق'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {payment.paidBy || payment.userName || 'النظام'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                    مؤكد
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">لا توجد تسديدات</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">لم يتم تسجيل أي تسديدات لهذا المستحق حتى الآن</p>
                        <Button
                          onClick={() => {
                            setShowDetails(false);
                            mainForm.setValue("operationType", "payment");
                            mainForm.setValue("receivableId", selectedReceivable?.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة أول تسديد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* أزرار الإجراءات المحسنة */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      mainForm.setValue("operationType", "payment");
                      mainForm.setValue("receivableId", selectedReceivable?.id);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={selectedReceivable && selectedReceivable.paidAmount >= selectedReceivable.totalAmount}
                  >
                    <DollarSign className="w-4 h-4 ml-1" />
                    إضافة تسديد جديد
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                    className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 ml-1" />
                    إغلاق
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-500">فشل في تحميل تفاصيل المستحق</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}