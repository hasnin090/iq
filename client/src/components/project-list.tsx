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
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المشروع بنجاح",
      });
      onProjectUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المشروع",
      });
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
            <div className="bg-primary-dark p-4">
              <h3 className="text-lg font-bold text-white">{project.name}</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-neutral-light">{project.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral">تاريخ البدء: {formatDate(project.startDate)}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-neutral mb-1">التقدم في العمل</p>
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
