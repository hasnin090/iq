// ===================================================================
// دمج إدارة المستخدمين مع Supabase API
// User Management Integration with Supabase API
// ===================================================================

// هذا الملف يوضح كيفية إضافة وظائف إدارة المستخدمين إلى supabase-api.ts الحالي

// ===================================================================
// 1. إضافة دوال إدارة المستخدمين إلى supabase-api.ts
// ===================================================================

/*
إضافة هذه الدوال إلى ملف client/src/lib/supabase-api.ts
*/

// دالة إنشاء مستخدم جديد
export const createUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'manager' | 'accountant' | 'user';
  phone?: string;
}) => {
  try {
    // في حالة Demo Mode
    if (IS_DEMO_MODE) {
      const newUser = {
        id: Math.floor(Math.random() * 10000),
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role || 'user',
        phone: userData.phone || '',
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // إضافة إلى البيانات التجريبية
      demoUsers.push(newUser);
      
      return {
        data: newUser,
        error: null
      };
    }

    // استخدام Supabase Auth لإنشاء المستخدم
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: false
    });

    if (authError) throw authError;

    // إضافة بيانات إضافية في جدول المستخدمين
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role || 'user',
          phone: userData.phone || '',
          is_active: true,
          email_verified: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

// دالة تحديث معلومات المستخدم
export const updateUser = async (userId: number, updateData: {
  full_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}) => {
  try {
    if (IS_DEMO_MODE) {
      const userIndex = demoUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('المستخدم غير موجود');
      }

      demoUsers[userIndex] = {
        ...demoUsers[userIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };

      return {
        data: demoUsers[userIndex],
        error: null
      };
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
};

// دالة الحصول على جميع المستخدمين
export const getUsers = async (filters?: {
  role?: string;
  isActive?: boolean;
  search?: string;
}) => {
  try {
    if (IS_DEMO_MODE) {
      let filteredUsers = [...demoUsers];

      if (filters) {
        if (filters.role) {
          filteredUsers = filteredUsers.filter(u => u.role === filters.role);
        }
        if (filters.isActive !== undefined) {
          filteredUsers = filteredUsers.filter(u => u.is_active === filters.isActive);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(u => 
            u.full_name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
          );
        }
      }

      return {
        data: filteredUsers,
        error: null
      };
    }

    let query = supabase.from('users').select('*');

    if (filters) {
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

// دالة الحصول على مستخدم واحد
export const getUser = async (userId: number) => {
  try {
    if (IS_DEMO_MODE) {
      const user = demoUsers.find(u => u.id === userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }
      return { data: user, error: null };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
};

// دالة تفعيل/إلغاء تفعيل المستخدم
export const toggleUserStatus = async (userId: number, isActive: boolean) => {
  try {
    if (IS_DEMO_MODE) {
      const userIndex = demoUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('المستخدم غير موجود');
      }

      demoUsers[userIndex].is_active = isActive;
      demoUsers[userIndex].updated_at = new Date().toISOString();

      return {
        data: demoUsers[userIndex],
        error: null
      };
    }

    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { data: null, error };
  }
};

// دالة حذف المستخدم (إلغاء التفعيل)
export const deleteUser = async (userId: number) => {
  try {
    if (IS_DEMO_MODE) {
      const userIndex = demoUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('المستخدم غير موجود');
      }

      // في Demo Mode نحذف فعلياً من المصفوفة
      demoUsers.splice(userIndex, 1);
      return { data: { success: true }, error: null };
    }

    // في الإنتاج، نفضل إلغاء التفعيل بدلاً من الحذف
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { data: null, error };
  }
};

// دالة إحصائيات المستخدمين
export const getUserStats = async () => {
  try {
    if (IS_DEMO_MODE) {
      const stats = {
        total_users: demoUsers.length,
        active_users: demoUsers.filter(u => u.is_active).length,
        verified_users: demoUsers.filter(u => u.email_verified).length,
        admins: demoUsers.filter(u => u.role === 'admin').length,
        managers: demoUsers.filter(u => u.role === 'manager').length,
        accountants: demoUsers.filter(u => u.role === 'accountant').length,
        regular_users: demoUsers.filter(u => u.role === 'user').length
      };

      return { data: stats, error: null };
    }

    // في Supabase نحتاج إلى استعلام معقد أو استخدام RPC
    const { data, error } = await supabase.rpc('get_user_statistics');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { data: null, error };
  }
};

// ===================================================================
// 2. البيانات التجريبية للمستخدمين
// ===================================================================

const demoUsers = [
  {
    id: 1,
    email: 'admin@company.com',
    full_name: 'أحمد محمد الإداري',
    role: 'admin',
    phone: '+964771234567',
    is_active: true,
    email_verified: true,
    last_login: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    email: 'manager@company.com',
    full_name: 'فاطمة أحمد المديرة',
    role: 'manager',
    phone: '+964771234568',
    is_active: true,
    email_verified: true,
    last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-01-02T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    email: 'accountant@company.com',
    full_name: 'محمد علي المحاسب',
    role: 'accountant',
    phone: '+964771234569',
    is_active: true,
    email_verified: true,
    last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-01-03T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    email: 'user@company.com',
    full_name: 'سارة خالد المستخدمة',
    role: 'user',
    phone: '+964771234570',
    is_active: true,
    email_verified: false,
    last_login: null,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: new Date().toISOString()
  }
];

// ===================================================================
// 3. مكون React لإدارة المستخدمين
// ===================================================================

/*
إنشاء مكون جديد: client/src/components/user-management.tsx
*/

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabase-api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, UserPlus, Edit, Trash2 } from 'lucide-react';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'accountant' | 'user';
  phone: string;
  is_active: boolean;
  email_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب المستخدمين
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', searchTerm, selectedRole],
    queryFn: () => supabaseApi.getUsers({
      search: searchTerm || undefined,
      role: selectedRole || undefined,
      isActive: true
    }).then(res => res.data || []),
    staleTime: 30 * 1000,
  });

  // جلب إحصائيات المستخدمين
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => supabaseApi.getUserStats().then(res => res.data),
    staleTime: 60 * 1000,
  });

  // تحديث المستخدم
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updateData }: { userId: number; updateData: any }) =>
      supabaseApi.updateUser(userId, updateData),
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  // تفعيل/إلغاء تفعيل المستخدم
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      supabaseApi.toggleUserStatus(userId, isActive),
    onSuccess: (data, variables) => {
      toast({
        title: variables.isActive ? "تم التفعيل" : "تم إلغاء التفعيل",
        description: variables.isActive ? "تم تفعيل المستخدم بنجاح" : "تم إلغاء تفعيل المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تغيير الحالة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const getRoleText = (role: string) => {
    const roleTexts = {
      admin: 'مدير عام',
      manager: 'مدير',
      accountant: 'محاسب',
      user: 'مستخدم'
    };
    return roleTexts[role as keyof typeof roleTexts] || role;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{userStats.total_users}</div>
            <div className="text-gray-600">إجمالي المستخدمين</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{userStats.active_users}</div>
            <div className="text-gray-600">المستخدمين النشطين</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{userStats.admins}</div>
            <div className="text-gray-600">المديرين</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{userStats.accountants}</div>
            <div className="text-gray-600">المحاسبين</div>
          </div>
        </div>
      )}

      {/* البحث والفلاتر */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
          <Input
            placeholder="البحث في المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">جميع الأدوار</option>
          <option value="admin">مدير عام</option>
          <option value="manager">مدير</option>
          <option value="accountant">محاسب</option>
          <option value="user">مستخدم</option>
        </select>
      </div>

      {/* جدول المستخدمين */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>آخر تسجيل دخول</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  لا توجد مستخدمين
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleText(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login ? 
                      new Date(user.last_login).toLocaleDateString('ar') : 
                      'لم يسجل دخول'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => 
                            toggleStatusMutation.mutate({
                              userId: user.id,
                              isActive: !user.is_active
                            })
                          }
                        >
                          {user.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ===================================================================
// 4. إضافة المسارات الجديدة
// ===================================================================

/*
إضافة هذا إلى ملف client/src/App.tsx في قسم المسارات:

import { UserManagement } from '@/components/user-management';

// داخل Router
<Route path="/users" element={<UserManagement />} />
*/

// ===================================================================
// نهاية الملف
// ===================================================================
