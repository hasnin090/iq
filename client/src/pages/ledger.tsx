import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const expenseTypeSchema = z.object({
  name: z.string().min(1, "اسم نوع المصروف مطلوب"),
  description: z.string().optional(),
});

type ExpenseTypeForm = z.infer<typeof expenseTypeSchema>;

interface ExpenseType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LedgerEntry {
  id: number;
  date: string;
  transactionId: number;
  expenseTypeId: number | null;
  amount: number;
  description: string;
  projectId: number | null;
  entryType: string;
  createdAt: string;
}

interface LedgerSummary {
  classified: {
    total: number;
    count: number;
    entries: LedgerEntry[];
  };
  general_expense: {
    total: number;
    count: number;
    entries: LedgerEntry[];
  };
  grandTotal: number;
}

export default function LedgerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<ExpenseTypeForm>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // جلب أنواع المصروفات
  const { data: expenseTypes = [], isLoading: expenseTypesLoading } = useQuery({
    queryKey: ["/api/expense-types"],
  });

  // جلب ملخص دفتر الأستاذ
  const { data: ledgerSummary, isLoading: summaryLoading } = useQuery<LedgerSummary>({
    queryKey: ["/api/ledger/summary"],
  });

  // جلب مدخلات دفتر الأستاذ
  const { data: ledgerEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/ledger"],
  });

  // إضافة نوع مصروف جديد
  const createExpenseTypeMutation = useMutation({
    mutationFn: (data: ExpenseTypeForm) => 
      fetch("/api/expense-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger/summary"] });
      toast({
        title: "نجح الحفظ",
        description: "تم إضافة نوع المصروف بنجاح",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة نوع المصروف",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseTypeForm) => {
    createExpenseTypeMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  if (expenseTypesLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">دفتر الأستاذ العام</h1>
          <p className="text-muted-foreground">نظام تصنيف المصروفات والمتفرقات</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة نوع مصروف
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة نوع مصروف جديد</DialogTitle>
              <DialogDescription>
                إضافة نوع مصروف جديد للتصنيف التلقائي
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم نوع المصروف *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: راتب، مصروف عام، وقود" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea placeholder="وصف نوع المصروف..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createExpenseTypeMutation.isPending}
                  >
                    {createExpenseTypeMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ملخص التصنيف */}
      {ledgerSummary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المصروفات المصنفة</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(ledgerSummary.classified.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {ledgerSummary.classified.count} معاملة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المصروفات العامة</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(ledgerSummary.general_expense?.total || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {ledgerSummary.general_expense?.count || 0} معاملة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(ledgerSummary.grandTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {ledgerSummary.classified.count + (ledgerSummary.general_expense?.count || 0)} معاملة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">الملخص</TabsTrigger>
          <TabsTrigger value="expense-types">أنواع المصروفات</TabsTrigger>
          <TabsTrigger value="entries">دفتر الأستاذ</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {ledgerSummary && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* المصروفات المصنفة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    المصروفات المصنفة
                  </CardTitle>
                  <CardDescription>
                    المصروفات التي تم تصنيفها حسب النوع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ledgerSummary.classified.entries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-green-600">{formatCurrency(entry.amount)}</p>
                        </div>
                      </div>
                    ))}
                    {ledgerSummary.classified.entries.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        و {ledgerSummary.classified.entries.length - 5} معاملة أخرى...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* المصروفات العامة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    المصروفات العامة
                  </CardTitle>
                  <CardDescription>
                    المصروفات غير المصنفة حسب النوع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ledgerSummary.general_expense.entries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-orange-600">{formatCurrency(entry.amount)}</p>
                        </div>
                      </div>
                    ))}
                    {ledgerSummary.general_expense.entries.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        و {ledgerSummary.general_expense.entries.length - 5} معاملة أخرى...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expense-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أنواع المصروفات المتاحة</CardTitle>
              <CardDescription>
                إدارة أنواع المصروفات للتصنيف التلقائي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(expenseTypes as ExpenseType[]).map((type: ExpenseType) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? "default" : "secondary"}>
                          {type.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(type.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجلات دفتر الأستاذ</CardTitle>
              <CardDescription>
                جميع المدخلات في دفتر الأستاذ العام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التصنيف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ledgerEntries as LedgerEntry[]).slice(0, 20).map((entry: LedgerEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell>
                        {entry.expenseTypeId ? (
                          <Badge variant="default">محدد</Badge>
                        ) : (
                          <Badge variant="secondary">غير محدد</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.entryType === "classified" ? "default" : "secondary"}
                        >
                          {entry.entryType === "classified" ? "مصنف" : "متفرق"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(ledgerEntries as LedgerEntry[]).length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  عرض 20 من أصل {(ledgerEntries as LedgerEntry[]).length} سجل
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}