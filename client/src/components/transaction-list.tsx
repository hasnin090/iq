import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatCurrency } from '@/lib/chart-utils';
import { formatDateTime } from '@/utils/date-utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Trash2, Edit2, FileText, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  projectId?: number;
  fileUrl?: string;
  fileType?: string;
}

interface Project {
  id: number;
  name: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  projects: Project[];
  viewType: 'cards' | 'table';
  isLoading: boolean;
  onTransactionUpdated: () => void;
  isArchiveMode?: boolean;
  selectedTransactions?: number[];
  onToggleSelection?: (transactionId: number) => void;
}

const transactionFormSchema = z.object({
  date: z.date({
    required_error: "الرجاء اختيار تاريخ",
  }),
  type: z.string().min(1, "الرجاء اختيار نوع المعاملة"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من الصفر"),
  description: z.string().min(1, "الرجاء إدخال الوصف"),
  projectId: z.number().nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function TransactionList({ 
  transactions, 
  projects, 
  viewType,
  isLoading,
  onTransactionUpdated,
  isArchiveMode = false,
  selectedTransactions = [],
  onToggleSelection 
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      type: "income",
      amount: 0,
      description: "",
      projectId: null,
    },
  });
  
  useEffect(() => {
    if (transactionToEdit) {
      const type = transactionToEdit.type || "income";
      
      form.reset({
        date: new Date(transactionToEdit.date),
        type: type,
        amount: transactionToEdit.amount,
        description: transactionToEdit.description || "",
        projectId: transactionToEdit.projectId || null,
      });
    }
  }, [transactionToEdit, form]);

  const deleteMutation = useMutation({
    mutationFn: (transactionId: number) => 
      apiRequest(`/api/transactions/${transactionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المعاملة المالية بنجاح.",
      });
      onTransactionUpdated();
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف المعاملة المالية.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; transaction: TransactionFormValues }) => {
      const formattedData = {
        ...data.transaction,
        date: data.transaction.date.toISOString(),
      };
      return apiRequest(`/api/transactions/${data.id}`, { 
        method: 'PUT', 
        body: JSON.stringify(formattedData) 
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المعاملة المالية بنجاح.",
      });
      onTransactionUpdated();
      setEditDialogOpen(false);
      setTransactionToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء محاولة تحديث المعاملة المالية.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditDialogOpen(true);
  };

  const onEditSubmit = (values: TransactionFormValues) => {
    if (!transactionToEdit) return;
    updateMutation.mutate({ id: transactionToEdit.id, transaction: values });
  };

  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return "بدون مشروع";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "مشروع غير معروف";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <i className="fas fa-receipt text-6xl"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isArchiveMode ? "لا توجد معاملات مؤرشفة" : "لا توجد معاملات مالية"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isArchiveMode ? "لم يتم أرشفة أي معاملات بعد" : "ابدأ بإضافة معاملتك المالية الأولى"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary-light dark:bg-gray-800 rounded-xl shadow-card">
        <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div className="flex items-center">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg font-bold text-sm ml-2 flex items-center">
              <i className="fas fa-clipboard-list ml-1.5"></i>
              {transactions.length} معاملة
            </span>
          </div>
        </div>
        
        <div className="px-4 pb-4">
          {viewType === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="transition-all hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isArchiveMode && onToggleSelection && (
                          <button
                            onClick={() => onToggleSelection(transaction.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {selectedTransactions.includes(transaction.id) ? (
                              <CheckSquare className="h-5 w-5" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(transaction.date)}
                      </span>
                    </div>
                    
                    <h3 className="font-medium mb-2">{transaction.description}</h3>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      المشروع: {getProjectName(transaction.projectId)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      
                      {user?.role === 'admin' && !isArchiveMode && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(transaction)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {isArchiveMode && onToggleSelection && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اختيار
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الوصف
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المشروع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    {user?.role === 'admin' && !isArchiveMode && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {isArchiveMode && onToggleSelection && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedTransactions.includes(transaction.id)}
                            onCheckedChange={() => onToggleSelection(transaction.id)}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getProjectName(transaction.projectId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      {user?.role === 'admin' && !isArchiveMode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذه المعاملة المالية؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transactionToDelete) {
                  deleteMutation.mutate(transactionToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المعاملة المالية</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
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
                            variant={"outline"}
                            className={`w-full pl-3 text-right font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ar })
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                    <FormLabel>نوع المعاملة</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المعاملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">دخل</SelectItem>
                        <SelectItem value="expense">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="أدخل المبلغ" 
                        {...field} 
                      />
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
                      <Textarea 
                        placeholder="أدخل وصف المعاملة"
                        className="resize-none"
                        {...field}
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
                    <FormLabel>المشروع (اختياري)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">بدون مشروع</SelectItem>
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

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  )}
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}