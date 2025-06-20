import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { DeferredPayment, Project } from "@shared/schema";

const addPaymentSchema = z.object({
  beneficiaryName: z.string().min(1, "اسم المستفيد مطلوب"),
  totalAmount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  projectId: z.number().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const payInstallmentSchema = z.object({
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
});

export default function DeferredPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<DeferredPayment | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  const { data: payments = [], isLoading } = useQuery<DeferredPayment[]>({
    queryKey: ["/api/deferred-payments"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const addForm = useForm({
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

  const pendingPayments = payments.filter((p: DeferredPayment) => p.status === 'pending');
  const completedPayments = payments.filter((p: DeferredPayment) => p.status === 'completed');

  const totalPending = pendingPayments.reduce((sum: number, p: DeferredPayment) => sum + p.remainingAmount, 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
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
                      <Select onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="اختر المشروع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <DollarSign className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
                <p className="text-sm text-gray-600">إجمالي المستحقات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{pendingPayments.length}</p>
                <p className="text-sm text-gray-600">دفعات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
                <p className="text-sm text-gray-600">دفعات مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">الدفعات المعلقة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map((payment: DeferredPayment) => {
              const progress = getProgressPercentage(payment.paidAmount, payment.totalAmount);
              return (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{payment.beneficiaryName}</span>
                      <Badge variant="secondary">{progress}%</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>المدفوع: {formatCurrency(payment.paidAmount)}</span>
                        <span>الإجمالي: {formatCurrency(payment.totalAmount)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-gray-600 mt-1">
                        المتبقي: {formatCurrency(payment.remainingAmount)}
                      </p>
                    </div>
                    
                    {payment.projectId && (
                      <p className="text-sm text-gray-600">
                        المشروع: {getProjectName(payment.projectId)}
                      </p>
                    )}
                    
                    {payment.description && (
                      <p className="text-sm text-gray-600">{payment.description}</p>
                    )}
                    
                    {payment.dueDate && (
                      <p className="text-sm text-gray-600">
                        الاستحقاق: {formatDate(new Date(payment.dueDate))}
                      </p>
                    )}
                    
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsPayDialogOpen(true);
                      }}
                    >
                      دفع مبلغ
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Payments */}
      {completedPayments.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">الدفعات المكتملة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedPayments.map((payment: DeferredPayment) => (
              <Card key={payment.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{payment.beneficiaryName}</span>
                    <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">المبلغ: {formatCurrency(payment.totalAmount)}</p>
                  {payment.projectId && (
                    <p className="text-sm text-gray-600">
                      المشروع: {getProjectName(payment.projectId)}
                    </p>
                  )}
                  {payment.completedAt && (
                    <p className="text-sm text-gray-600">
                      تم الإكمال: {formatDate(payment.completedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {payments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد دفعات مؤجلة</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة دفعة مؤجلة جديدة</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة دفعة مؤجلة
            </Button>
          </CardContent>
        </Card>
      )}

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
                        <FormLabel>المبلغ المراد دفعه</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="أدخل المبلغ"
                            max={selectedPayment.remainingAmount}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={payInstallmentMutation.isPending} className="flex-1">
                      {payInstallmentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsPayDialogOpen(false)}>
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