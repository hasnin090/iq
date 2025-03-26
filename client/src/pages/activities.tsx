import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: string;
  userId: number;
}

interface Filter {
  entityType?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export default function Activities() {
  const [filter, setFilter] = useState<Filter>({});
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // التحقق من صلاحيات المستخدم، إذا لم يكن مدير يتم التوجيه إلى الصفحة الرئيسية
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);
  
  // إذا لم يكن المستخدم مدير، لا نعرض أي محتوى
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  const { data: logs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs', filter],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey;
      const params = new URLSearchParams();
      
      if (filterParams.entityType) params.append('entityType', String(filterParams.entityType));
      if (filterParams.userId) params.append('userId', String(filterParams.userId));
      
      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    }
  });
  
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'yyyy/MM/dd hh:mm a', { locale: ar });
  };
  
  const getUserName = (userId: number) => {
    if (!users) return 'غير معروف';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'غير معروف';
  };
  
  const getActionText = (action: string) => {
    switch (action) {
      case 'create': return 'إضافة';
      case 'update': return 'تحديث';
      case 'delete': return 'حذف';
      case 'login': return 'تسجيل دخول';
      case 'logout': return 'تسجيل خروج';
      default: return action;
    }
  };
  
  const getEntityTypeText = (entityType: string) => {
    switch (entityType) {
      case 'transaction': return 'معاملة مالية';
      case 'project': return 'مشروع';
      case 'user': return 'مستخدم';
      case 'document': return 'مستند';
      case 'setting': return 'إعداد';
      default: return entityType;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-success bg-opacity-20 text-success';
      case 'update': return 'bg-primary bg-opacity-20 text-primary';
      case 'delete': return 'bg-destructive bg-opacity-20 text-destructive';
      case 'login': return 'bg-info bg-opacity-20 text-info';
      case 'logout': return 'bg-warning bg-opacity-20 text-warning';
      default: return 'bg-muted bg-opacity-20 text-muted';
    }
  };
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">سجل النشاطات</h2>
      
      <Card className="bg-secondary-light">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary-light">تصفية سجل النشاطات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-full md:w-64">
              <Label htmlFor="filterEntityType" className="block text-sm font-medium text-neutral mb-1">نوع العنصر</Label>
              <Select 
                onValueChange={(value) => handleFilterChange({ entityType: value || undefined })}
                value={filter.entityType || ""}
              >
                <SelectTrigger id="filterEntityType" className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                  <SelectValue placeholder="كل الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="transaction">معاملة مالية</SelectItem>
                  <SelectItem value="project">مشروع</SelectItem>
                  <SelectItem value="user">مستخدم</SelectItem>
                  <SelectItem value="document">مستند</SelectItem>
                  <SelectItem value="setting">إعداد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="filterUser" className="block text-sm font-medium text-neutral mb-1">المستخدم</Label>
              <Select 
                onValueChange={(value) => handleFilterChange({ userId: value ? parseInt(value) : undefined })}
                value={filter.userId?.toString() || ""}
              >
                <SelectTrigger id="filterUser" className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                  <SelectValue placeholder="كل المستخدمين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المستخدمين</SelectItem>
                  {!usersLoading && users?.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="startDate" className="block text-sm font-medium text-neutral mb-1">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              />
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="endDate" className="block text-sm font-medium text-neutral mb-1">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light"
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {logsLoading ? (
        <div className="text-center py-20">
          <div className="spinner w-8 h-8 mx-auto"></div>
          <p className="mt-4 text-muted">جاري تحميل البيانات...</p>
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-4" id="activitiesList">
          {logs.map((log) => (
            <div key={log.id} className="bg-secondary-light rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-reverse space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                    {getActionText(log.action)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getEntityTypeText(log.entityType)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-sm">{log.details}</p>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                بواسطة: {getUserName(log.userId)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary-light rounded-xl shadow-card p-10 text-center">
          <p className="text-muted-foreground">لا توجد سجلات نشاط متطابقة مع معايير التصفية</p>
        </div>
      )}
    </div>
  );
}
