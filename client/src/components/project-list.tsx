import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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
import { Loader2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
  progress: number;
}

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  onProjectUpdated: () => void;
}

export function ProjectList({ projects, isLoading, onProjectUpdated }: ProjectListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/projects/${id}`, undefined);
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المشروع بنجاح",
      });
      onProjectUpdated();
    },
    onError: async (error: any) => {
      // محاولة استخراج رسالة الخطأ من استجابة الخادم
      let errorMessage = "فشل في حذف المشروع";
      
      try {
        if (error.response && error.response.status === 400) {
          // استجابة 400 تعني أن هناك سبب محدد لعدم القدرة على حذف المشروع
          const responseData = await error.response.json();
          
          if (responseData.message) {
            errorMessage = responseData.message;
            
            // إضافة تفاصيل إضافية إذا كانت متوفرة
            if (responseData.transactionsCount) {
              errorMessage += ` (عدد المعاملات المرتبطة: ${responseData.transactionsCount})`;
            }
          }
        }
      } catch (jsonError) {
        console.error("خطأ في معالجة استجابة الخطأ:", jsonError);
      }
      
      toast({
        variant: "destructive",
        title: "تعذر حذف المشروع",
        description: errorMessage,
      });
      
      console.error("خطأ حذف المشروع:", error);
    },
  });
  
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd', { locale: ar });
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'paused': return 'متوقف مؤقتاً';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success bg-opacity-20 text-success';
      case 'paused': return 'bg-warning bg-opacity-20 text-warning';
      case 'completed': return 'bg-info bg-opacity-20 text-info';
      default: return 'bg-muted bg-opacity-20 text-muted';
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
      </div>
    );
  }
  
  if (projects.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا توجد مشاريع حتى الآن</p>
        <p className="text-sm text-muted mt-2">أضف مشروع جديد باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-secondary-light rounded-xl shadow-card overflow-hidden">
            <div className="bg-primary p-4">
              <h3 className="text-lg font-bold text-white tracking-wide">{project.name || 'مشروع جديد'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-foreground">{project.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">تاريخ البدء: <span className="font-medium">{formatDate(project.startDate)}</span></span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-foreground mb-1">التقدم في العمل: <span className="font-medium">{project.progress}%</span></p>
                <div className="w-full h-2 bg-secondary rounded-full">
                  <div 
                    className="h-2 bg-primary-light rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                <button 
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center"
                  onClick={() => {
                    toast({
                      title: "تعديل المشروع",
                      description: `جاري تحميل المشروع: ${project.name}`,
                    });
                    // سيتم استبدال هذا بالتعديل الفعلي للمشروع في الإصدار القادم
                  }}
                >
                  <i className="fas fa-edit ml-1.5"></i>
                  تعديل
                </button>
                <button 
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center"
                  onClick={() => handleDeleteClick(project)}
                >
                  <i className="fas fa-trash-alt ml-1.5"></i>
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المشروع؟ سيتم حذف جميع البيانات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
