import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/chart-utils';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: string;
  description: string;
  projectId?: number;
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
}

// مخطط نموذج المعاملة
const transactionFormSchema = z.object({
  date: z.date({
    required_error: "الرجاء اختيار تاريخ",
  }),
  type: z.string().min(1, "الرجاء اختيار نوع المعاملة"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من الصفر"),
  description: z.string().min(1, "الرجاء إدخال وصف للمعاملة"),
  projectId: z.number().nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function TransactionList({ 
  transactions, 
  projects, 
  viewType,
  isLoading,
  onTransactionUpdated 
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const { toast } = useToast();
  
  // نموذج التعديل
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      type: "income", // تعيين القيمة الافتراضية إلى "income" بدلاً من ""
      amount: 0,
      description: "",
      projectId: null,
    },
  });
  
  // إعادة تعيين قيم النموذج عند اختيار معاملة للتعديل
  useEffect(() => {
    if (transactionToEdit) {
      // تأكد من أن نوع المعاملة ليس فارغًا
      const type = transactionToEdit.type || "income";
      
      form.reset({
        date: new Date(transactionToEdit.date),
        type: type,
        amount: transactionToEdit.amount,
        description: transactionToEdit.description || "",
        // تأكد من أن قيمة projectId إما رقم أو null وليست undefined
        projectId: transactionToEdit.projectId !== undefined ? transactionToEdit.projectId : null,
      });
    }
  }, [transactionToEdit, form]);
  
  // تعريف mutation لحذف المعاملة
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/transactions/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المعاملة المالية بنجاح",
      });
      onTransactionUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المعاملة المالية",
      });
    },
  });
  
  // تعريف mutation لتحديث المعاملة
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; transaction: TransactionFormValues }) => {
      return apiRequest('PUT', `/api/transactions/${data.id}`, data.transaction);
    },
    onSuccess: () => {
      toast({
        title: "تم التعديل بنجاح",
        description: "تم تعديل المعاملة المالية بنجاح",
      });
      setEditDialogOpen(false);
      onTransactionUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تعديل المعاملة المالية",
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
  
  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  const onEditSubmit = (values: TransactionFormValues) => {
    if (transactionToEdit) {
      // تأكد من صحة البيانات قبل الإرسال
      const formattedData = {
        ...values,
        // التأكد من أن projectId هو null أو رقم صحيح وليس undefined
        projectId: values.projectId === undefined ? null : values.projectId
      };
      
      console.log("تحديث المعاملة - القيم:", formattedData);
      
      updateMutation.mutate({
        id: transactionToEdit.id,
        transaction: formattedData
      });
    }
  };
  
  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'عام';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };
  
  // التحقق ما إذا كانت المعاملة هي من الصندوق الرئيسي
  const isAdminFundTransaction = (transaction: Transaction) => {
    return transaction.projectId === null || transaction.projectId === undefined;
  };
  
  // التحقق ما إذا كانت المعاملة تمثل عملية تغذية للصندوق الرئيسي
  const isAdminFundDeposit = (transaction: Transaction) => {
    return isAdminFundTransaction(transaction) && transaction.type === 'income';
  };
  
  // التحقق ما إذا كانت المعاملة تمثل عملية تغذية للمشروع من الصندوق الرئيسي
  const isProjectFundingTransaction = (transaction: Transaction) => {
    return !isAdminFundTransaction(transaction) && transaction.type === 'income';
  };
  
  // تحديد وصف المعاملة حسب نوع المستخدم والمعاملة
  const { user } = useAuth();
  const getCustomTransactionDescription = (transaction: Transaction) => {
    // إذا كانت عملية الصندوق الرئيسي (بدون مشروع)
    if (isAdminFundTransaction(transaction)) {
      if (transaction.type === 'income') {
        return `إيراد للصندوق الرئيسي: ${transaction.description}`;
      } else {
        return `مصروف من الصندوق الرئيسي: ${transaction.description}`;
      }
    }
    
    // إذا كانت عملية متعلقة بمشروع
    
    // إذا كان المستخدم مديراً
    if (user?.role === 'admin') {
      if (transaction.type === 'income') {
        return `تم تحويل مبلغ إلى مشروع: ${getProjectName(transaction.projectId)}`;
      } else {
        return `تم استلام مبلغ من مشروع: ${getProjectName(transaction.projectId)}`;
      }
    } 
    // إذا كان مستخدم عادي أو مسؤول مشروع
    else {
      if (transaction.type === 'income') {
        return `تم استلام مبلغ من المدير للمشروع`;
      } else {
        return `عملية صرف يومية من المشروع`;
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd HH:mm', { locale: ar });
  };
  
  const exportToPdf = () => {
    const element = document.getElementById('transactions-content');
    if (!element) return;
    
    // نسخ العنصر لإجراء تعديلات على النسخة دون التأثير على الواجهة
    const printElement = element.cloneNode(true) as HTMLElement;
    
    // تحسين تنسيق الجدول للطباعة
    if (viewType === 'table') {
      const tableElement = printElement.querySelector('table');
      if (tableElement) {
        // إضافة تنسيق إضافي للجدول
        tableElement.style.width = '100%';
        tableElement.style.borderCollapse = 'collapse';
        tableElement.style.direction = 'rtl';
        
        // تعديل تنسيق رؤوس الأعمدة
        const headerCells = tableElement.querySelectorAll('th');
        headerCells.forEach(cell => {
          cell.style.backgroundColor = '#f3f4f6';
          cell.style.color = '#111827';
          cell.style.fontWeight = 'bold';
          cell.style.textAlign = 'right';
          cell.style.padding = '8px';
          cell.style.borderBottom = '2px solid #e5e7eb';
        });
        
        // تعديل تنسيق خلايا البيانات
        const dataCells = tableElement.querySelectorAll('td');
        dataCells.forEach(cell => {
          cell.style.padding = '8px';
          cell.style.borderBottom = '1px solid #e5e7eb';
          cell.style.textAlign = 'right';
        });
        
        // إزالة أزرار الإجراءات
        const actionCells = tableElement.querySelectorAll('td:last-child');
        actionCells.forEach(cell => {
          cell.remove();
        });
        
        // إزالة عمود الإجراءات
        const headerRow = tableElement.querySelector('thead tr');
        if (headerRow) {
          const lastHeader = headerRow.lastElementChild;
          if (lastHeader) {
            lastHeader.remove();
          }
        }
      }
    }
    
    const opt = {
      margin: 10,
      filename: 'transactions.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // تغيير الاتجاه إلى أفقي
    };
    
    // استخدام النسخة المعدلة للطباعة
    html2pdf().from(printElement).set(opt).save();
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير المعاملات المالية إلى ملف PDF بنجاح",
    });
  };
  
  // تصدير المعاملات إلى Excel
  const exportToExcel = () => {
    // إنشاء مصفوفة من بيانات المعاملات معدلة للتصدير
    const data = transactions.map(transaction => ({
      'التاريخ والوقت': formatDateTime(transaction.date),
      'الوصف': getCustomTransactionDescription(transaction),
      'المشروع': getProjectName(transaction.projectId),
      'النوع': transaction.type === 'income' ? 'ايراد' : 'مصروف',
      'المبلغ': transaction.amount,
      'نوع الصندوق': isAdminFundTransaction(transaction) 
        ? 'صندوق رئيسي' 
        : isProjectFundingTransaction(transaction) 
          ? 'تمويل مشروع' 
          : 'صرف مشروع'
    }));

    // إنشاء ورقة عمل جديدة
    const worksheet = XLSX.utils.json_to_sheet(data, { 
      header: ['التاريخ والوقت', 'الوصف', 'المشروع', 'النوع', 'المبلغ', 'نوع الصندوق'],
    });

    // تعديل عرض الأعمدة
    const wscols = [
      { wch: 20 },  // عرض عمود التاريخ
      { wch: 40 },  // عرض عمود الوصف
      { wch: 20 },  // عرض عمود المشروع
      { wch: 15 },  // عرض عمود النوع
      { wch: 15 },  // عرض عمود المبلغ
      { wch: 15 },  // عرض عمود نوع الصندوق
    ];
    worksheet['!cols'] = wscols;

    // إنشاء كتاب عمل جديد وإضافة ورقة العمل إليه
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المعاملات المالية');

    // تصدير كتاب العمل إلى ملف Excel
    XLSX.writeFile(workbook, 'transactions.xlsx');
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير المعاملات المالية إلى ملف Excel بنجاح",
    });
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="bg-secondary-light dark:bg-gray-800 rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا توجد معاملات مالية حتى الآن</p>
        <p className="text-sm text-muted mt-2 dark:text-gray-400">أضف معاملة جديدة باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-secondary-light dark:bg-gray-800 rounded-xl shadow-card">
        <div className="p-4 flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="px-3 py-2 bg-secondary dark:bg-gray-700 rounded-lg text-neutral-light dark:text-gray-200 border border-secondary-light dark:border-gray-600 hover:border-primary-light dark:hover:border-gray-500 transition-all"
          >
            <i className="fas fa-print mr-2"></i> طباعة
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToPdf}
            className="px-3 py-2 bg-secondary dark:bg-gray-700 rounded-lg text-neutral-light dark:text-gray-200 border border-secondary-light dark:border-gray-600 hover:border-primary-light dark:hover:border-gray-500 transition-all"
          >
            <i className="fas fa-file-pdf mr-2"></i> PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="px-3 py-2 bg-secondary dark:bg-gray-700 rounded-lg text-neutral-light dark:text-gray-200 border border-secondary-light dark:border-gray-600 hover:border-primary-light dark:hover:border-gray-500 transition-all"
          >
            <i className="fas fa-file-excel mr-2"></i> Excel
          </Button>
        </div>
        
        <div id="transactions-content">
          {viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className={`p-5 rounded-lg border h-full flex flex-col ${
                    isAdminFundTransaction(transaction)
                      ? 'bg-indigo-50 border-blue-200 dark:bg-indigo-950/30 dark:border-blue-900' // صندوق رئيسي
                      : isProjectFundingTransaction(transaction)
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900' // تمويل مشروع
                        : 'bg-secondary border-border' // عمليات أخرى
                  }`}
                >
                  {/* الجزء العلوي للبطاقة - التاريخ والعلامات */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-muted-foreground">{formatDateTime(transaction.date)}</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {isAdminFundTransaction(transaction) && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M2 12h20"></path>
                          </svg>
                          صندوق رئيسي
                        </span>
                      )}
                      {isProjectFundingTransaction(transaction) && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"></path>
                          </svg>
                          تمويل مشروع
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-success bg-opacity-20 text-success' 
                          : 'bg-destructive bg-opacity-20 text-destructive'
                      }`}>
                        {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                      </span>
                    </div>
                  </div>
                  
                  {/* وصف المعاملة */}
                  <div className="min-h-[60px] mb-2">
                    <p className="font-medium text-sm leading-5 line-clamp-3">{getCustomTransactionDescription(transaction)}</p>
                  </div>
                  
                  {/* معلومات المشروع */}
                  <p className="text-xs text-muted-foreground mb-3">
                    المشروع: {getProjectName(transaction.projectId)}
                  </p>
                  
                  {/* المبلغ والأزرار */}
                  <div className="flex justify-between items-center mt-auto">
                    <span className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium flex items-center"
                        onClick={() => handleEditClick(transaction)}
                      >
                        <i className="fas fa-edit ml-1"></i>
                        تعديل
                      </button>
                      <button 
                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium flex items-center"
                        onClick={() => handleDeleteClick(transaction)}
                      >
                        <i className="fas fa-trash-alt ml-1"></i>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary dark:divide-gray-600">
                <thead className="dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">التاريخ والوقت</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">المبلغ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT dark:text-gray-300 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-light dark:divide-gray-600">
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      className={`${
                        isAdminFundTransaction(transaction)
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20' // صندوق رئيسي
                          : isProjectFundingTransaction(transaction)
                            ? 'bg-green-50/50 dark:bg-green-950/20' // تمويل مشروع
                            : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light dark:text-gray-300">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light dark:text-gray-300">
                        {getCustomTransactionDescription(transaction)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light dark:text-gray-300">
                        {isAdminFundTransaction(transaction) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M2 12h20"></path>
                            </svg>
                            صندوق رئيسي
                          </span>
                        ) : isProjectFundingTransaction(transaction) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"></path>
                            </svg>
                            {getProjectName(transaction.projectId)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            {getProjectName(transaction.projectId)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-success bg-opacity-20 text-success' 
                            : 'bg-destructive bg-opacity-20 text-destructive'
                        }`}>
                          {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      } font-bold`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button 
                            className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium flex items-center"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <i className="fas fa-edit ml-1"></i>
                            تعديل
                          </button>
                          <button 
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium flex items-center"
                            onClick={() => handleDeleteClick(transaction)}
                          >
                            <i className="fas fa-trash-alt ml-1"></i>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* مربع حوار حذف معاملة */}
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
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="spinner ml-2"></span>
              ) : null}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* مربع حوار تعديل معاملة */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="mb-4">تعديل معاملة مالية</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* حقل التاريخ */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-2">التاريخ</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="pl-3 text-right font-normal justify-between"
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ar })
                            ) : (
                              <span>اختر تاريخ</span>
                            )}
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقل نوع المعاملة */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المعاملة</FormLabel>
                    <Select
                      dir="rtl"
                      value={field.value || "income"}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المعاملة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="income">إيراد</SelectItem>
                        <SelectItem value="expense">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقل المبلغ */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="أدخل المبلغ"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? "0" : e.target.value;
                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* حقل الوصف */}
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
              
              {/* حقل المشروع */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    <Select
                      dir="rtl"
                      value={field.value !== null && field.value !== undefined ? field.value.toString() : "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(null);
                        } else {
                          field.onChange(Number(value));
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المشروع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="none">عام (بدون مشروع)</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <span className="spinner ml-2"></span>
                  )}
                  حفظ التغييرات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
