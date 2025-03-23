import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { UserForm } from '@/components/user-form';
import { UserList } from '@/components/user-list';
import { queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-8 py-6">
        <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">إدارة المستخدمين</h2>
        
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
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">إدارة المستخدمين</h2>
      
      {/* User Form */}
      <UserForm onSubmit={handleUserUpdated} />
      
      {/* User List */}
      <UserList 
        users={users || []} 
        isLoading={isLoading}
        onUserUpdated={handleUserUpdated}
        currentUserId={user?.id}
      />
    </div>
  );
}
