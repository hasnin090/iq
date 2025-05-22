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
    return date.toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // تم إلغاء وظيفة تصدير PDF بسبب مشاكل في عرض النص العربي
  
  // تصدير المعاملات إلى Excel
  const exportToExcel = () => {
    // إنشاء مصفوفة من بيانات المعاملات معدلة للتصدير مع تضمين جميع التفاصيل
    const data = transactions.map((transaction, index) => ({
      'الرقم': index + 1,
      'التاريخ والوقت': formatDateTime(transaction.date),
      'العنوان': getCustomTransactionDescription(transaction),
      'التفاصيل': transaction.description || 'لا يوجد تفاصيل',
      'المشروع': getProjectName(transaction.projectId),
      'النوع': transaction.type === 'income' ? 'ايراد' : 'مصروف',
      'المبلغ': formatCurrency(transaction.amount), // استخدام دالة تنسيق العملة
      'القيمة الرقمية': transaction.amount, // القيمة الرقمية للمبلغ (للفرز والحسابات)
      'نوع الصندوق': isAdminFundTransaction(transaction) 
        ? 'صندوق رئيسي' 
        : isProjectFundingTransaction(transaction) 
          ? 'تمويل مشروع' 
          : 'صرف مشروع',
      'حالة المرفقات': transaction.fileUrl ? 'يوجد مرفق' : 'لا يوجد مرفقات',
      'رابط المرفق': transaction.fileUrl || 'لا يوجد',
      'نوع الملف': transaction.fileType || 'لا يوجد',
      'معرف المعاملة': transaction.id,
    }));

    // العناوين المستخدمة في ملف Excel
    const headers = [
      'الرقم', 
      'التاريخ والوقت', 
      'العنوان', 
      'التفاصيل', 
      'المشروع', 
      'النوع', 
      'المبلغ',
      'القيمة الرقمية', 
      'نوع الصندوق', 
      'حالة المرفقات',
      'رابط المرفق',
      'نوع الملف',
      'معرف المعاملة'
    ];

    // إنشاء ورقة عمل جديدة
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

    // تعديل عرض الأعمدة
    const wscols = [
      { wch: 8 },    // عرض عمود الرقم
      { wch: 20 },   // عرض عمود التاريخ
      { wch: 40 },   // عرض عمود العنوان
      { wch: 40 },   // عرض عمود التفاصيل
      { wch: 20 },   // عرض عمود المشروع
      { wch: 15 },   // عرض عمود النوع
      { wch: 15 },   // عرض عمود المبلغ (المنسق)
      { wch: 12 },   // عرض عمود القيمة الرقمية
      { wch: 15 },   // عرض عمود نوع الصندوق
      { wch: 15 },   // عرض عمود حالة المرفقات
      { wch: 50 },   // عرض عمود رابط المرفق
      { wch: 15 },   // عرض عمود نوع الملف
      { wch: 12 },   // عرض عمود معرف المعاملة
    ];
    worksheet['!cols'] = wscols;

    // تنسيق أنماط الخلايا للترويسة
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:M1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1'; // عنوان الخلية في العمود C، الصف 1
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true, color: { rgb: '0000FF' } }, // خط عريض وأزرق
        fill: { fgColor: { rgb: 'E6F0FF' } }, // خلفية زرقاء فاتحة
        alignment: { horizontal: 'center', vertical: 'center' }, // محاذاة للوسط
        border: { // إطار حول الخلية
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }

    // إخفاء عمود القيمة الرقمية (سيظهر فقط في التصدير لأغراض المعالجة)
    worksheet['!cols'][7].hidden = true;
    worksheet['!cols'][12].hidden = true;

    // إنشاء كتاب عمل جديد وإضافة ورقة العمل إليه
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'المعاملات المالية');

    // إنشاء اسم الملف مع التاريخ الحالي
    const now = new Date();
    const dateString = format(now, 'yyyy-MM-dd-HHmmss');
    const fileName = `transactions_${dateString}.xlsx`;

    // تصدير كتاب العمل إلى ملف Excel
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير المعاملات المالية إلى ملف Excel بنجاح (${transactions.length} معاملة)`,
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
        <div className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-3">
          {/* عدد العمليات المالية */}
          <div className="flex items-center">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg font-bold text-sm ml-2 flex items-center">
              <i className="fas fa-clipboard-list ml-1.5"></i>
              إجمالي العمليات: 
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-lg font-bold">
              {transactions.length}
            </span>
          </div>
          
          {/* أزرار التصدير */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="px-3 py-2 bg-secondary dark:bg-gray-700 rounded-lg text-neutral-light dark:text-gray-200 border border-secondary-light dark:border-gray-600 hover:border-primary-light dark:hover:border-gray-500 transition-all"
            >
              <i className="fas fa-print mr-2"></i> طباعة
            </Button>
            {/* تم إلغاء وظيفة تصدير PDF بسبب مشاكل في عرض النص العربي */}
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="px-3 py-2 bg-secondary dark:bg-gray-700 rounded-lg text-neutral-light dark:text-gray-200 border border-secondary-light dark:border-gray-600 hover:border-primary-light dark:hover:border-gray-500 transition-all"
            >
              <i className="fas fa-file-excel mr-2"></i> Excel
            </Button>
          </div>
        </div>
        
        <div id="transactions-content">
          {viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {transactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className={`p-5 rounded-lg border h-full flex flex-col shadow-sm relative ${
                    isAdminFundTransaction(transaction)
                      ? 'bg-indigo-50 border-blue-200 dark:bg-indigo-950/30 dark:border-blue-900' // صندوق رئيسي
                      : isProjectFundingTransaction(transaction)
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900' // تمويل مشروع
                        : index % 2 === 0 
                          ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/70 dark:border-gray-700' // صفوف زوجية
                          : 'bg-white border-blue-100 dark:bg-gray-800 dark:border-blue-900/20' // صفوف فردية
                  } hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-150`}
                >
                  {/* رقم المعاملة (الترقيم) بحجم أصغر ومظهر أنيق - لون أزرق */}
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 rounded-full flex items-center justify-center text-[10px] font-bold border border-blue-200/50 dark:border-blue-800/30 z-10 shadow-sm">
                    {index + 1}
                  </div>
                
                  {/* الجزء العلوي للبطاقة - التاريخ والعلامات */}
                  <div className="flex justify-between items-start mb-3 mt-3">
                    <span className="text-sm bg-gray-50 dark:bg-gray-900/50 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-700 flex items-center">
                      <i className="fas fa-calendar-alt ml-1.5 text-gray-500 dark:text-gray-400"></i>
                      {formatDateTime(transaction.date)}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {isAdminFundTransaction(transaction) && (
                        <span className="px-2 py-1 text-[10px] rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center border border-blue-200 dark:border-blue-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M2 12h20"></path>
                          </svg>
                          صندوق رئيسي
                        </span>
                      )}
                      {isProjectFundingTransaction(transaction) && (
                        <span className="px-2 py-1 text-[10px] rounded-lg bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center border border-green-200 dark:border-green-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"></path>
                          </svg>
                          تمويل مشروع
                        </span>
                      )}
                      <span className={`px-2 py-1 text-[10px] rounded-lg flex items-center border ${
                        transaction.type === 'income' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                          </svg>
                        )}
                        {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                      </span>
                    </div>
                  </div>
                  
                  {/* وصف المعاملة */}
                  <div className="min-h-[60px] mb-2">
                    <p className="font-medium text-sm leading-5 line-clamp-3">{getCustomTransactionDescription(transaction)}</p>
                  </div>
                  
                  {/* تفاصيل المعاملة - إذا وجدت */}
                  {transaction.description && (
                    <div className="mb-3 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">التفاصيل:</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{transaction.description}</p>
                    </div>
                  )}
                  
                  {/* معلومات المشروع */}
                  <p className="text-xs bg-gray-50 dark:bg-gray-900/40 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 mb-3 border border-gray-100 dark:border-gray-700 flex items-center">
                    <i className="fas fa-folder ml-1.5 text-gray-500 dark:text-gray-400"></i>
                    المشروع: {getProjectName(transaction.projectId)}
                  </p>
                  
                  {/* عرض المرفق إذا وجد */}
                  {transaction.fileUrl && (
                    <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">المرفقات:</span>
                      <button 
                        onClick={() => window.open(transaction.fileUrl, '_blank')}
                        className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none text-xs flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        عرض المرفق
                      </button>
                    </div>
                  )}
                  
                  {/* المبلغ والأزرار */}
                  <div className="flex justify-between items-center mt-auto">
                    <span className={`text-lg font-bold px-3 py-1.5 rounded-lg border ${
                      transaction.type === 'income' 
                        ? 'text-success bg-success/5 dark:bg-success/10 border-success/20' 
                        : 'text-destructive bg-destructive/5 dark:bg-destructive/10 border-destructive/20'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex gap-1.5">
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                            onClick={() => handleEditClick(transaction)}
                          >
                            <i className="fas fa-edit ml-1"></i>
                            تعديل
                          </button>
                          <button 
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                            onClick={() => handleDeleteClick(transaction)}
                          >
                            <i className="fas fa-trash-alt ml-1"></i>
                            حذف
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary dark:divide-gray-600 border-collapse">
                <thead className="bg-blue-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-16">#</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-36">التاريخ والوقت</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">التفاصيل</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-24">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-32">المبلغ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-32">المرفقات</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider w-40">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-light dark:divide-gray-600">
                  {transactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id}
                      className={`${
                        isAdminFundTransaction(transaction)
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20' // صندوق رئيسي
                          : isProjectFundingTransaction(transaction)
                            ? 'bg-green-50/50 dark:bg-green-950/20' // تمويل مشروع
                            : index % 2 === 0 
                              ? 'bg-gray-50/50 dark:bg-gray-800/50' // صفوف زوجية
                              : 'bg-white/75 dark:bg-gray-900/30' // صفوف فردية
                      } hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-150`}
                    >
                      {/* رقم المعاملة (الترقيم) بحجم أصغر - لون أزرق */}
                      <td className="px-4 py-3 text-center text-xs font-bold border-r border-blue-50/50 dark:border-blue-900/10">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-800/30 shadow-sm text-[10px]">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light dark:text-gray-300 border-r border-blue-50/50 dark:border-blue-900/10">
                        <span className="font-medium">{formatDateTime(transaction.date)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light dark:text-gray-300 max-w-[150px] border-r border-blue-50/50 dark:border-blue-900/10">
                        <span className="font-medium">{getCustomTransactionDescription(transaction)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light dark:text-gray-300 max-w-[200px] border-r border-blue-50/50 dark:border-blue-900/10">
                        <div className="line-clamp-2">
                          {transaction.description || <span className="text-gray-400 dark:text-gray-500 italic">لا يوجد تفاصيل</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light dark:text-gray-300 border-r border-blue-50/50 dark:border-blue-900/10">
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
                      <td className="px-4 py-3 whitespace-nowrap border-r border-blue-50/50 dark:border-blue-900/10">
                        <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-success/10 text-success border border-success/20' 
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          {transaction.type === 'income' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M5 12l7 7 7-7"/>
                            </svg>
                          )}
                          {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm border-r border-blue-50/50 dark:border-blue-900/10 ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      } font-bold`}>
                        <div className="flex items-center justify-end">
                          <span className="px-2 py-1 rounded bg-opacity-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-blue-50/50 dark:border-blue-900/10">
                        {transaction.fileUrl ? (
                          <button 
                            onClick={() => window.open(transaction.fileUrl, '_blank')}
                            className="text-blue-600 hover:underline focus:outline-none flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            عرض المرفق
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2 justify-end">
                          {user?.role === 'admin' && (
                            <>
                              <button 
                                className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                                onClick={() => handleEditClick(transaction)}
                              >
                                <i className="fas fa-edit ml-1"></i>
                                تعديل
                              </button>
                              <button 
                                className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium flex items-center shadow-sm transition-all duration-150 hover:shadow"
                                onClick={() => handleDeleteClick(transaction)}
                              >
                                <i className="fas fa-trash-alt ml-1"></i>
                                حذف
                              </button>
                            </>
                          )}
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
