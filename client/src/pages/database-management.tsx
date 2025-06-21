import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Database, 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield,
  ArrowRightLeft,
  RotateCw,
  AlertCircle,
  Cloud,
  Upload,
  Download
} from 'lucide-react';

interface DatabaseHealth {
  primary: boolean;
  backup: boolean;
  active: 'primary' | 'backup' | 'none';
}

interface SupabaseHealth {
  client: boolean;
  database: boolean;
  storage: boolean;
}

export default function DatabaseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // التحقق من صلاحيات المدير
  if (!user || user.role !== 'admin') {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="py-4 md:py-6 px-3 md:px-4 pb-mobile-nav-large">
          <Card className="text-center p-8">
            <CardContent>
              <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold text-muted-foreground mb-2">إدارة قواعد البيانات</h2>
              <p className="text-muted-foreground">هذا القسم مخصص للمديرين فقط</p>
              <p className="text-sm text-muted-foreground mt-2">يحتوي على أدوات إدارة قواعد البيانات الحساسة</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // جلب حالة قواعد البيانات
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/database/health'],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // جلب حالة Supabase
  const { data: supabaseData, isLoading: supabaseLoading, refetch: refetchSupabase } = useQuery({
    queryKey: ['/api/supabase/health'],
    refetchInterval: 30000,
  });

  // تهيئة قاعدة البيانات الاحتياطية
  const initBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/database/init-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في تهيئة قاعدة البيانات الاحتياطية');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تهيئة قاعدة البيانات الاحتياطية",
      });
      refetchHealth();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تهيئة قاعدة البيانات الاحتياطية",
        variant: "destructive",
      });
    },
  });

  // التبديل بين قواعد البيانات
  const switchDatabaseMutation = useMutation({
    mutationFn: async (target: 'primary' | 'backup') => {
      const response = await fetch('/api/database/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      if (!response.ok) throw new Error('فشل في التبديل بين قواعد البيانات');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التبديل بنجاح",
        description: data.message,
      });
      refetchHealth();
      // إعادة تحميل جميع البيانات
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التبديل",
        description: error.message || "فشل في التبديل بين قواعد البيانات",
        variant: "destructive",
      });
    },
  });

  // مزامنة البيانات
  const syncDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/database/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في مزامنة البيانات');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تمت المزامنة",
        description: "تم مزامنة البيانات إلى قاعدة البيانات الاحتياطية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في المزامنة",
        description: error.message || "فشل في مزامنة البيانات",
        variant: "destructive",
      });
    },
  });

  const health: DatabaseHealth = healthData?.health || { primary: false, backup: false, active: 'none' };
  const supabaseHealth: SupabaseHealth = supabaseData?.health || { client: false, database: false, storage: false };

  // Supabase mutations
  const initSupabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في تهيئة Supabase');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تهيئة Supabase",
      });
      refetchSupabase();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تهيئة Supabase",
        variant: "destructive",
      });
    },
  });

  const syncToSupabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في مزامنة البيانات');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تمت المزامنة",
        description: "تم مزامنة البيانات إلى Supabase بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في المزامنة",
        description: error.message || "فشل في مزامنة البيانات",
        variant: "destructive",
      });
    },
  });

  const migrateFilesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase/migrate-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في نقل الملفات');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم نقل الملفات",
        description: `نجح: ${data.results?.success || 0}, فشل: ${data.results?.failed || 0}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في نقل الملفات",
        description: error.message || "فشل في نقل الملفات",
        variant: "destructive",
      });
    },
  });

  const updateUrlsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase/update-file-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('فشل في تحديث الروابط');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث روابط الملفات بنجاح",
      });
      // إعادة تحميل البيانات
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث الروابط",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return (
      <Badge variant={isHealthy ? "default" : "destructive"} className="text-xs">
        {isHealthy ? "متاحة" : "غير متاحة"}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="py-4 md:py-6 px-3 md:px-4 pb-mobile-nav-large">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-2 md:gap-3">
            <Database className="text-[hsl(var(--primary))] w-6 h-6 md:w-8 md:h-8" />
            إدارة قواعد البيانات
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm md:text-base">
            مراقبة والتحكم في قواعد البيانات الرئيسية والاحتياطية
          </p>
        </div>

        {/* حالة النظام */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* قاعدة البيانات الرئيسية */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                قاعدة البيانات الرئيسية
              </CardTitle>
              <CardDescription>القاعدة الأساسية للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.primary)}
                  {getStatusBadge(health.primary)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نشطة:</span>
                <Badge variant={health.active === 'primary' ? "default" : "secondary"}>
                  {health.active === 'primary' ? "نعم" : "لا"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* قاعدة البيانات الاحتياطية */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                قاعدة البيانات الاحتياطية
              </CardTitle>
              <CardDescription>النسخة الاحتياطية للطوارئ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.backup)}
                  {getStatusBadge(health.backup)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نشطة:</span>
                <Badge variant={health.active === 'backup' ? "default" : "secondary"}>
                  {health.active === 'backup' ? "نعم" : "لا"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Supabase */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-600" />
                Supabase
              </CardTitle>
              <CardDescription>التخزين السحابي والنسخ الاحتياطي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">العميل:</span>
                  {getStatusBadge(supabaseHealth.client)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">قاعدة البيانات:</span>
                  {getStatusBadge(supabaseHealth.database)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">التخزين:</span>
                  {getStatusBadge(supabaseHealth.storage)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* حالة النظام العامة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                حالة النظام
              </CardTitle>
              <CardDescription>الوضع العام للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">قاعدة البيانات النشطة:</span>
                  <Badge variant={
                    health.active === 'primary' ? "default" : 
                    health.active === 'backup' ? "destructive" : 
                    "secondary"
                  }>
                    {health.active === 'primary' ? 'الرئيسية' : 
                     health.active === 'backup' ? 'الاحتياطية' : 
                     'لا توجد'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHealth()}
                  disabled={healthLoading}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
                  تحديث الحالة
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-600" />
                حالة Supabase
              </CardTitle>
              <CardDescription>خدمات Supabase المتاحة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex justify-center space-x-2 mb-2">
                    {getStatusIcon(supabaseHealth.client && supabaseHealth.storage)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {supabaseHealth.client && supabaseHealth.storage ? 
                      'Supabase متاح ويعمل' : 
                      'Supabase غير متاح أو يحتاج إعداد'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSupabase()}
                  disabled={supabaseLoading}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${supabaseLoading ? 'animate-spin' : ''}`} />
                  تحديث حالة Supabase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          {/* قاعدة البيانات الرئيسية */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                قاعدة البيانات الرئيسية
              </CardTitle>
              <CardDescription>القاعدة الأساسية للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.primary)}
                  {getStatusBadge(health.primary)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نشطة:</span>
                <Badge variant={health.active === 'primary' ? "default" : "secondary"}>
                  {health.active === 'primary' ? "نعم" : "لا"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* قاعدة البيانات الاحتياطية */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                قاعدة البيانات الاحتياطية
              </CardTitle>
              <CardDescription>النسخة الاحتياطية للطوارئ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.backup)}
                  {getStatusBadge(health.backup)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نشطة:</span>
                <Badge variant={health.active === 'backup' ? "default" : "secondary"}>
                  {health.active === 'backup' ? "نعم" : "لا"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* حالة النظام العامة */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                حالة النظام
              </CardTitle>
              <CardDescription>الوضع العام للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">قاعدة البيانات النشطة:</span>
                  <Badge variant={
                    health.active === 'primary' ? "default" : 
                    health.active === 'backup' ? "destructive" : 
                    "secondary"
                  }>
                    {health.active === 'primary' ? 'الرئيسية' : 
                     health.active === 'backup' ? 'الاحتياطية' : 
                     'لا توجد'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHealth()}
                  disabled={healthLoading}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
                  تحديث الحالة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تحذيرات النظام */}
        {health.active === 'backup' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>تحذير:</strong> النظام يعمل حالياً على قاعدة البيانات الاحتياطية. 
              يُنصح بإصلاح قاعدة البيانات الرئيسية والعودة إليها في أقرب وقت ممكن.
            </AlertDescription>
          </Alert>
        )}

        {health.active === 'none' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>خطأ حرج:</strong> لا توجد قاعدة بيانات متاحة. يرجى التحقق من إعدادات الاتصال فوراً.
            </AlertDescription>
          </Alert>
        )}

        {/* أدوات إدارة قواعد البيانات المحلية */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-xl">أدوات إدارة قواعد البيانات المحلية</CardTitle>
            <CardDescription>إدارة والتحكم في قواعد البيانات الرئيسية والاحتياطية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* تهيئة قاعدة البيانات الاحتياطية */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">تهيئة الاحتياطية</h3>
                <p className="text-xs text-muted-foreground">
                  إعداد قاعدة البيانات الاحتياطية للاستخدام
                </p>
                <Button
                  onClick={() => initBackupMutation.mutate()}
                  disabled={initBackupMutation.isPending || health.backup}
                  className="w-full"
                  size="sm"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {initBackupMutation.isPending ? 'جاري التهيئة...' : 'تهيئة الاحتياطية'}
                </Button>
              </div>

              {/* التبديل إلى الرئيسية */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">التبديل للرئيسية</h3>
                <p className="text-xs text-muted-foreground">
                  العودة إلى قاعدة البيانات الرئيسية
                </p>
                <Button
                  onClick={() => switchDatabaseMutation.mutate('primary')}
                  disabled={switchDatabaseMutation.isPending || !health.primary || health.active === 'primary'}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {switchDatabaseMutation.isPending ? 'جاري التبديل...' : 'للرئيسية'}
                </Button>
              </div>

              {/* التبديل للاحتياطية */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">التبديل للاحتياطية</h3>
                <p className="text-xs text-muted-foreground">
                  التبديل إلى قاعدة البيانات الاحتياطية
                </p>
                <Button
                  onClick={() => switchDatabaseMutation.mutate('backup')}
                  disabled={switchDatabaseMutation.isPending || !health.backup || health.active === 'backup'}
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {switchDatabaseMutation.isPending ? 'جاري التبديل...' : 'للاحتياطية'}
                </Button>
              </div>

              {/* مزامنة البيانات */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">مزامنة البيانات</h3>
                <p className="text-xs text-muted-foreground">
                  نسخ البيانات من الرئيسية للاحتياطية
                </p>
                <Button
                  onClick={() => syncDatabaseMutation.mutate()}
                  disabled={syncDatabaseMutation.isPending || !health.primary || !health.backup}
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  {syncDatabaseMutation.isPending ? 'جاري المزامنة...' : 'مزامنة الآن'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أدوات إدارة Supabase */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Cloud className="w-6 h-6 text-purple-600" />
              أدوات إدارة Supabase
            </CardTitle>
            <CardDescription>إدارة التخزين السحابي ونقل الملفات إلى Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* تهيئة Supabase */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">تهيئة Supabase</h3>
                <p className="text-xs text-muted-foreground">
                  إعداد الاتصال مع خدمات Supabase
                </p>
                <Button
                  onClick={() => initSupabaseMutation.mutate()}
                  disabled={initSupabaseMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  {initSupabaseMutation.isPending ? 'جاري التهيئة...' : 'تهيئة Supabase'}
                </Button>
              </div>

              {/* مزامنة البيانات إلى Supabase */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">مزامنة البيانات</h3>
                <p className="text-xs text-muted-foreground">
                  نسخ جميع البيانات إلى قاعدة بيانات Supabase
                </p>
                <Button
                  onClick={() => syncToSupabaseMutation.mutate()}
                  disabled={syncToSupabaseMutation.isPending || !supabaseHealth.database}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {syncToSupabaseMutation.isPending ? 'جاري المزامنة...' : 'مزامنة البيانات'}
                </Button>
              </div>

              {/* نقل الملفات */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">نقل الملفات</h3>
                <p className="text-xs text-muted-foreground">
                  رفع جميع الملفات المحلية إلى تخزين Supabase
                </p>
                <Button
                  onClick={() => migrateFilesMutation.mutate()}
                  disabled={migrateFilesMutation.isPending || !supabaseHealth.storage}
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {migrateFilesMutation.isPending ? 'جاري النقل...' : 'نقل الملفات'}
                </Button>
              </div>

              {/* تحديث الروابط */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">تحديث الروابط</h3>
                <p className="text-xs text-muted-foreground">
                  تحديث روابط الملفات لتشير إلى Supabase
                </p>
                <Button
                  onClick={() => updateUrlsMutation.mutate()}
                  disabled={updateUrlsMutation.isPending || !supabaseHealth.storage}
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {updateUrlsMutation.isPending ? 'جاري التحديث...' : 'تحديث الروابط'}
                </Button>
              </div>
            </div>

            {/* تحذير مهم */}
            <Alert className="mt-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>مهم:</strong> تأكد من إعداد متغيرات البيئة الخاصة بـ Supabase قبل استخدام هذه الأدوات. 
                يُنصح بعمل نسخة احتياطية محلية قبل نقل الملفات.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg">معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">قاعدة البيانات الرئيسية:</h4>
                <p className="text-muted-foreground">
                  هي قاعدة البيانات الأساسية التي يعمل عليها النظام في الحالة العادية. 
                  تحتوي على جميع البيانات المباشرة والحديثة.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">قاعدة البيانات الاحتياطية:</h4>
                <p className="text-muted-foreground">
                  هي نسخة احتياطية منفصلة تُستخدم في حالة فشل قاعدة البيانات الرئيسية. 
                  يمكن التبديل إليها تلقائياً أو يدوياً لضمان استمرارية العمل.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">المزامنة:</h4>
                <p className="text-muted-foreground">
                  يُنصح بتشغيل المزامنة بانتظام لضمان أن قاعدة البيانات الاحتياطية 
                  تحتوي على أحدث البيانات في حالة الحاجة للتبديل.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}