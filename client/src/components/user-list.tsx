import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  active: boolean;
}

interface UserListProps {
  users: User[];
  isLoading: boolean;
  onUserUpdated: () => void;
  currentUserId: number | undefined;
}

export function UserList({ users, isLoading, onUserUpdated, currentUserId }: UserListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/users/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم بنجاح",
      });
      onUserUpdated();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المستخدم",
      });
    },
  });
  
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
    setDeleteDialogOpen(false);
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary">مدير</Badge>;
      case 'user':
        return <Badge className="bg-secondary">مستخدم</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'viewReports': return 'عرض التقارير';
      case 'manageProjects': return 'إدارة المشاريع';
      case 'manageTransactions': return 'إدارة المعاملات المالية';
      case 'manageDocuments': return 'إدارة المستندات';
      default: return permission;
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
  
  if (users.length === 0) {
    return (
      <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
        <p className="text-muted-foreground">لا يوجد مستخدمين حتى الآن</p>
        <p className="text-sm text-muted mt-2">أضف مستخدم جديد باستخدام النموذج أعلاه</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-secondary-light rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">اسم المستخدم</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الاسم الكامل</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">البريد الإلكتروني</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحية</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الصلاحيات</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-DEFAULT uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-light">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-light">
                    {user.username}
                    {currentUserId === user.id && (
                      <span className="text-xs text-primary-light mr-2">(أنت)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-light">
                    {user.role === 'admin' ? (
                      <span className="text-xs">جميع الصلاحيات</span>
                    ) : user.permissions && user.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {getPermissionText(permission)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs">لا توجد صلاحيات</span>
                    )}
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
                        onClick={() => handleDeleteClick(user)}
                        disabled={currentUserId === user.id}
                        title={currentUserId === user.id ? "لا يمكن حذف المستخدم الحالي" : ""}
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
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
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
