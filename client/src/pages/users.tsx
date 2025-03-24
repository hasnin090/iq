import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { UserForm } from '@/components/user-form';
import { UserList } from '@/components/user-list';
import { queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  
  interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
    active: boolean;
  }
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="py-6 px-4">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستخدمين</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة حسابات المستخدمين والصلاحيات</p>
        </div>
        
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4 ml-2" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };
  
  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستخدمين</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة حسابات المستخدمين والصلاحيات</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* User List */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm fade-in">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-users text-[hsl(var(--primary))]"></i>
              <span>قائمة المستخدمين</span>
            </h3>
            <UserList 
              users={users || []} 
              isLoading={isLoading}
              onUserUpdated={handleUserUpdated}
              currentUserId={user?.id}
            />
          </div>
        </div>
        
        <div>
          {/* User Form */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm sticky top-4 fade-in">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-user-plus text-[hsl(var(--primary))]"></i>
              <span>إضافة مستخدم جديد</span>
            </h3>
            <UserForm onSubmit={handleUserUpdated} />
          </div>
        </div>
      </div>
    </div>
  );
}
