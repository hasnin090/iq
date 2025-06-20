import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  DollarSign, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  CreditCard, 
  CheckCircle, 
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import type { DeferredPayment, Project } from "@shared/schema";

interface Filter {
  projectId?: number;
  status?: string;
  searchQuery?: string;
}

const addPaymentSchema = z.object({
  beneficiaryName: z.string().min(1, "اسم المستفيد مطلوب"),
  totalAmount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  projectId: z.number().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type AddPaymentFormData = z.infer<typeof addPaymentSchema>;

const payInstallmentSchema = z.object({
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
});

export default function DeferredPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<DeferredPayment | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  const { data: payments = [], isLoading } = useQuery<DeferredPayment[]>({
    queryKey: ["/api/deferred-payments", filter],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const addForm = useForm<AddPaymentFormData>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      beneficiaryName: "",
      totalAmount: 0,
      projectId: undefined,
      description: "",
      dueDate: "",
    },
  });

  const payForm = useForm({
    resolver: zodResolver(payInstallmentSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/deferred-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("فشل في إضافة الدفعة المؤجلة");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "تم إضافة الدفعة المؤجلة بنجاح",
        description: "تم إضافة الدفعة الجديدة إلى قائمة المستحقات",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة الدفعة",
        description: error.message,
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
      if (!response.ok) throw new Error("فشل في تسجيل الدفعة");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deferred-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsPayDialogOpen(false);
      setSelectedPayment(null);
      payForm.reset();
      toast({
        title: "تم تسجيل الدفعة بنجاح",
        description: "تم تحديث رصيد الدفعة المؤجلة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const getProgressPercentage = (paid: number, total: number) => {
    return Math.round((paid / total) * 100);
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "غير محدد";
    const project = projects.find((p: Project) => p.id === projectId);
    return project?.name || "مشروع غير معروف";
  };

  // Filter payments based on current filters
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    if (filter.projectId) {
      filtered = filtered.filter(p => p.projectId === filter.projectId);
    }

    if (filter.status) {
      if (filter.status === 'pending') {
        filtered = filtered.filter(p => p.status === 'pending');
      } else if (filter.status === 'completed') {
        filtered = filtered.filter(p => p.status === 'completed');
      }
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.beneficiaryName.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [payments, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const remainingAmount = payments.reduce((sum, p) => sum + p.remainingAmount, 0);

    return {
      totalPayments,
      pendingPayments,
      completedPayments,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">الدفعات المؤجلة</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة المستحقات والأقساط</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 ml-2" />
              إضافة دفعة مؤجلة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg">إضافة دفعة مؤجلة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit((data) => addPaymentMutation.mutate(data))} className="space-y-3">
                <FormField
                  control={addForm.control}
                  name="beneficiaryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">اسم المستفيد</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المستفيد" {...field} className="h-9" />
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
                      <FormLabel className="text-sm font-medium">المبلغ الإجمالي</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="أدخل المبلغ الإجمالي"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="h-9"
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
                      <FormLabel className="text-sm font-medium">المشروع (اختياري)</FormLabel>
                      <Select 
                        value={field.value ? field.value.toString() : "none"} 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="h-9">
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">الوصف (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="وصف إضافي للدفعة" 
                          {...field} 
                          className="min-h-[60px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">تاريخ الاستحقاق (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-2">
                  <Button 
                    type="submit" 
                    disabled={addPaymentMutation.isPending} 
                    className="w-full sm:flex-1 order-1"
                  >
                    {addPaymentMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-full sm:w-auto order-2"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-sm text-gray-600">إجمالي المبالغ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
                <p className="text-sm text-gray-600">المبالغ المدفوعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.remainingAmount)}</p>
                <p className="text-sm text-gray-600">المبالغ المتبقية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث في الدفعات..."
                  value={filter.searchQuery || ""}
                  onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">المشروع</label>
              <Select
                value={filter.projectId?.toString() || "all"}
                onValueChange={(value) => setFilter({ ...filter, projectId: value === "all" ? undefined : Number(value) })}
              >
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select
                value={filter.status || "all"}
                onValueChange={(value) => setFilter({ ...filter, status: value === "all" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>جدول الدفعات المؤجلة</span>
            <Badge variant="secondary">{filteredPayments.length} دفعة</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد دفعات مؤجلة</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة دفعة مؤجلة جديدة</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة دفعة مؤجلة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستفيد</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">المدفوع</TableHead>
                    <TableHead className="text-right">المتبقي</TableHead>
                    <TableHead className="text-right">التقدم</TableHead>
                    <TableHead className="text-right">المشروع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: DeferredPayment) => {
                    const progress = getProgressPercentage(payment.paidAmount, payment.totalAmount);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.beneficiaryName}</TableCell>
                        <TableCell>{formatCurrency(payment.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(payment.paidAmount)}</TableCell>
                        <TableCell>{formatCurrency(payment.remainingAmount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getProjectName(payment.projectId)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'completed' ? 'default' : 'secondary'}
                            className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {payment.status === 'completed' ? 'مكتملة' : 'معلقة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.dueDate ? formatDate(String(payment.dueDate)) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setIsPayDialogOpen(true);
                                }}
                              >
                                <CreditCard className="w-4 h-4 ml-1" />
                                دفع
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Installment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">دفع مبلغ - {selectedPayment?.beneficiaryName}</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">المبلغ المتبقي</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedPayment.remainingAmount)}
                </p>
              </div>
              
              <Form {...payForm}>
                <form onSubmit={payForm.handleSubmit((data) => 
                  payInstallmentMutation.mutate({ id: selectedPayment.id, amount: data.amount })
                )} className="space-y-4">
                  <FormField
                    control={payForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مبلغ الدفعة</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="أدخل مبلغ الدفعة"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-2">
                    <Button 
                      type="submit" 
                      disabled={payInstallmentMutation.isPending} 
                      className="w-full sm:flex-1 order-1"
                    >
                      {payInstallmentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPayDialogOpen(false)}
                      className="w-full sm:w-auto order-2"
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