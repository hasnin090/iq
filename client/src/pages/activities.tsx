import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Activity, User, FileText, Settings, FolderOpen, Eye, Edit, Trash2, LogIn, LogOut, Plus, Clock, Filter } from 'lucide-react';

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
      
      if (filterParams && typeof filterParams === 'object') {
        const fp = filterParams as any;
        if (fp.entityType) params.append('entityType', String(fp.entityType));
        if (fp.userId) params.append('userId', String(fp.userId));
      }
      
      const response = await fetch(`/api/activity-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    }
  });
  
  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
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
    if (!users || !Array.isArray(users)) return 'غير معروف';
    const user = users.find((u: any) => u.id === userId);
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
      case 'create': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'update': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'delete': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'login': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'logout': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="w-3 h-3" />;
      case 'update': return <Edit className="w-3 h-3" />;
      case 'delete': return <Trash2 className="w-3 h-3" />;
      case 'login': return <LogIn className="w-3 h-3" />;
      case 'logout': return <LogOut className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'transaction': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'project': return <FolderOpen className="w-4 h-4 text-green-600" />;
      case 'user': return <User className="w-4 h-4 text-purple-600" />;
      case 'document': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'setting': return <Settings className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">سجل النشاطات</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">تتبع جميع العمليات والأنشطة في النظام</p>
        </div>
      </div>
      
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
            <Filter className="w-5 h-5" />
            تصفية سجل النشاطات
          </CardTitle>
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
                  {!usersLoading && Array.isArray(users) && users.map((user: any) => (
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
            <Card key={log.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* أيقونة نوع العنصر */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {getEntityIcon(log.entityType)}
                  </div>
                  
                  {/* المحتوى الرئيسي */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`${getActionColor(log.action)} border text-xs font-medium flex items-center gap-1`}
                      >
                        {getActionIcon(log.action)}
                        {getActionText(log.action)}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getEntityTypeText(log.entityType)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                      {log.details}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>بواسطة: {getUserName(log.userId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد سجلات نشاط</h3>
            <p className="text-gray-500 dark:text-gray-400">لا توجد سجلات نشاط متطابقة مع معايير التصفية المحددة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
