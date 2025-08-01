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
      <div className="py-6 px-4 pb-mobile-nav-large">
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
    <div className="py-4 sm:py-6 px-3 sm:px-4 pb-mobile-nav-large">
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-l from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-md sm:shadow-lg mb-6 dark:from-[hsl(var(--primary))/90] dark:to-[hsl(var(--primary))/70]">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">إدارة المستخدمين</h2>
          <p className="text-gray-400 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base font-semibold bg-white/15 dark:bg-white/10 py-1 px-3 rounded-md shadow-sm inline-block border border-white/20 dark:border-white/10">
            <i className="fas fa-shield-alt mr-1.5 text-gray-500"></i>
            إدارة حسابات المستخدمين والصلاحيات
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* User Form - في الأعلى */}
        <div className="w-full fade-in">
          <UserForm onSubmit={handleUserUpdated} />
        </div>
        
        {/* User List - في الأسفل */}
        <div className="w-full mt-4 sm:mt-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] sm:border-2 p-4 sm:p-6 rounded-xl shadow-md sm:shadow-lg fade-in">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center space-x-2 space-x-reverse bg-[hsl(var(--primary))/10] dark:bg-[hsl(var(--primary))/20] p-2 sm:p-3 rounded-lg">
                <i className="fas fa-users text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))/80] text-lg sm:text-xl"></i>
                <span className="text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))/90]">قائمة المستخدمين</span>
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                إجمالي المستخدمين: {users?.length || 0}
              </div>
            </div>
            <UserList 
              users={users || []} 
              isLoading={isLoading}
              onUserUpdated={handleUserUpdated}
              currentUserId={user?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
