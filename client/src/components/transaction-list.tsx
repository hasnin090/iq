import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/chart-utils';
import html2pdf from 'html2pdf.js';

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

export function TransactionList({ 
  transactions, 
  projects, 
  viewType,
  isLoading,
  onTransactionUpdated 
}: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();
  
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
  
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'عام';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'غير معروف';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  const exportToPdf = () => {
    const element = document.getElementById('transactions-content');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: 'transactions.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير المعاملات المالية إلى ملف PDF بنجاح",
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
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا توجد معاملات مالية حتى الآن</p>
        <p className="text-sm text-muted mt-2">أضف معاملة جديدة باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-secondary-light rounded-xl shadow-card">
        <div className="p-4 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="px-3 py-2 bg-secondary rounded-lg text-neutral-light border border-secondary-light hover:border-primary-light transition-all"
          >
            <i className="fas fa-print mr-2"></i> طباعة
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToPdf}
            className="px-3 py-2 bg-secondary rounded-lg text-neutral-light border border-secondary-light hover:border-primary-light transition-all"
          >
            <i className="fas fa-download mr-2"></i> تنزيل PDF
          </Button>
        </div>
        
        <div id="transactions-content">
          {viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-secondary p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-muted-foreground">{formatDate(transaction.date)}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-success bg-opacity-20 text-success' 
                        : 'bg-destructive bg-opacity-20 text-destructive'
                    }`}>
                      {transaction.type === 'income' ? 'ايراد' : 'مصروف'}
                    </span>
                  </div>
                  <p className="font-medium mb-2">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    المشروع: {getProjectName(transaction.projectId)}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex space-x-reverse space-x-2">
                      <button 
                        className="text-primary-light hover:text-primary-dark transition-colors"
                        onClick={() => {
                          toast({
                            title: "غير متاح",
                            description: "ميزة التعديل غير متاحة في هذا الإصدار",
                          });
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="text-destructive hover:text-red-700 transition-colors"
                        onClick={() => handleDeleteClick(transaction)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary">
                <thead>
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">التاريخ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الوصف</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المشروع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">النوع</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">المبلغ</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-light">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-light">
                        {getProjectName(transaction.projectId)}
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
                        <div className="flex space-x-reverse space-x-2">
                          <button 
                            className="text-primary-light hover:text-primary-dark transition-colors"
                            onClick={() => {
                              toast({
                                title: "غير متاح",
                                description: "ميزة التعديل غير متاحة في هذا الإصدار",
                              });
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="text-destructive hover:text-red-700 transition-colors"
                            onClick={() => handleDeleteClick(transaction)}
                          >
                            <i className="fas fa-trash-alt"></i>
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
    </>
  );
}
