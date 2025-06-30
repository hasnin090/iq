import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CloudUpload, ArrowUpDown, Loader2, CheckCircle, XCircle, File, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface MigrationStatus {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  inProgress: boolean;
  errors: string[];
  lastMigration?: string;
}

interface FilesStatus {
  localFiles: number;
  cloudFiles: number;
  orphanedFiles: number;
  brokenLinks: number;
}

export default function FileMigration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user has admin permissions
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة. يرجى التواصل مع مدير النظام.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Data queries
  const { data: migrationStatus, isLoading } = useQuery<MigrationStatus>({
    queryKey: ['/api/files/migration-status'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 5000
  });

  const { data: filesStatus } = useQuery<FilesStatus>({
    queryKey: ['/api/files/status'],
    enabled: !!user && user.role === 'admin'
  });

  // API helper function
  const makeApiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
      throw new Error(error.message || 'حدث خطأ في العملية');
    }
    
    return response.json();
  };

  // Mutations
  const startMigrationMutation = useMutation({
    mutationFn: () => makeApiCall('/api/files/migrate', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "تم بدء نقل الملفات",
        description: "سيتم نقل جميع الملفات إلى التخزين السحابي",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/migration-status'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ في نقل الملفات",
        description: error.message,
      });
    },
  });

  const cleanupFilesMutation = useMutation({
    mutationFn: () => makeApiCall('/api/files/cleanup', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: "تم تنظيف الملفات",
        description: "تم حذف الملفات المعطلة وتنظيم النظام",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/status'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ في تنظيف الملفات",
        description: error.message,
      });
    },
  });

  const handleStartMigration = () => {
    startMigrationMutation.mutate();
  };

  const handleCleanupFiles = () => {
    cleanupFilesMutation.mutate();
  };

  const getProgressPercentage = () => {
    if (!migrationStatus || migrationStatus.totalFiles === 0) return 0;
    return Math.round((migrationStatus.migratedFiles / migrationStatus.totalFiles) * 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <CloudUpload className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">نقل الملفات</h1>
        <p className="text-muted-foreground">إدارة نقل الملفات وتنظيفها في النظام</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Migration Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ArrowUpDown className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>حالة نقل الملفات</CardTitle>
                <CardDescription>تقدم عملية نقل الملفات إلى التخزين السحابي</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationStatus?.inProgress ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    جاري النقل
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>تقدم النقل</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>تم نقل: {migrationStatus.migratedFiles} ملف</span>
                    <span>إجمالي: {migrationStatus.totalFiles} ملف</span>
                  </div>
                </div>
                
                {migrationStatus.failedFiles > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>تحذير</AlertTitle>
                    <AlertDescription>
                      فشل نقل {migrationStatus.failedFiles} ملف. تحقق من سجل الأخطاء أدناه.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">بدء نقل الملفات</h3>
                    <p className="text-sm text-muted-foreground">
                      نقل جميع الملفات المحلية إلى التخزين السحابي
                    </p>
                  </div>
                  <Button
                    onClick={handleStartMigration}
                    disabled={startMigrationMutation.isPending}
                  >
                    {startMigrationMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    <CloudUpload className="h-4 w-4 mr-2" />
                    بدء النقل
                  </Button>
                </div>
                
                {migrationStatus?.lastMigration && (
                  <div className="text-sm text-muted-foreground">
                    آخر نقل: {new Date(migrationStatus.lastMigration).toLocaleString('ar-EG')}
                  </div>
                )}
                
                {migrationStatus && migrationStatus.totalFiles > 0 && !migrationStatus.inProgress && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{migrationStatus.migratedFiles}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ملفات منقولة</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{migrationStatus.failedFiles}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ملفات فاشلة</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{migrationStatus.totalFiles}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">إجمالي الملفات</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <File className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>إحصائيات الملفات</CardTitle>
                <CardDescription>نظرة عامة على حالة الملفات في النظام</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filesStatus && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{filesStatus.localFiles}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">ملفات محلية</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{filesStatus.cloudFiles}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">ملفات سحابية</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">{filesStatus.orphanedFiles}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">ملفات يتيمة</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{filesStatus.brokenLinks}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">روابط معطلة</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Cleanup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>تنظيف الملفات</CardTitle>
                <CardDescription>إزالة الملفات المعطلة وتنظيم النظام</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">تنظيف شامل للملفات</h3>
                <p className="text-sm text-muted-foreground">
                  إزالة الروابط المعطلة والملفات اليتيمة وتنظيم البنية
                </p>
              </div>
              <Button
                onClick={handleCleanupFiles}
                disabled={cleanupFilesMutation.isPending}
                variant="outline"
              >
                {cleanupFilesMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
                <TrendingUp className="h-4 w-4 mr-2" />
                تنظيف الملفات
              </Button>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تحذير</AlertTitle>
              <AlertDescription>
                عملية التنظيف ستقوم بحذف الملفات المعطلة والروابط غير الصحيحة. 
                تأكد من إنشاء نسخة احتياطية قبل المتابعة.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Migration Errors */}
        {migrationStatus?.errors && migrationStatus.errors.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle>أخطاء النقل</CardTitle>
                  <CardDescription>الأخطاء التي حدثت أثناء عملية النقل</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {migrationStatus.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}