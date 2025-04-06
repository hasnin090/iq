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
      <div className="py-6 px-4 pb-mobile-nav extra-bottom-padding">
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
    <div className="py-4 sm:py-6 px-3 sm:px-4 pb-mobile-nav extra-bottom-padding">
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-l from-blue-600 to-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">إدارة المستخدمين</h2>
          <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">إدارة حسابات المستخدمين والصلاحيات</p>
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
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-[hsl(var(--primary))] mb-4 sm:mb-5 flex items-center space-x-2 space-x-reverse bg-blue-50 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg">
              <i className="fas fa-users text-blue-600 dark:text-blue-400 text-lg sm:text-xl"></i>
              <span className="text-blue-700 dark:text-blue-300">قائمة المستخدمين</span>
            </h3>
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
