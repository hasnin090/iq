import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Database, Activity, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabaseApi } from '@/lib/supabase-api';

interface DatabaseStatus {
  status: string;
  message: string;
  tablesExist: boolean;
}

export default function DatabaseManagement() {
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
  const { data: dbStatus, isLoading } = useQuery<DatabaseStatus>({
    queryKey: ['database-status'],
    queryFn: () => supabaseApi.getDatabaseStatus(),
    refetchInterval: 30000,
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
  const backupMutation = useMutation({
    mutationFn: () => makeApiCall('/api/backup/create', { method: 'POST' }),
    onSuccess: (data: any) => {
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: `تم إنشاء النسخة الاحتياطية بنجاح: ${data.backupPath}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ في النسخ الاحتياطي",
        description: error.message,
      });
    },
  });

  const handleCreateBackup = () => {
    backupMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <Database className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">إدارة قواعد البيانات</h1>
        <p className="text-muted-foreground">مراقبة حالة قاعدة البيانات وإدارة النسخ الاحتياطية</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>حالة قاعدة البيانات</CardTitle>
                <CardDescription>معلومات الاتصال وأداء قاعدة البيانات</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {dbStatus?.status === 'connected' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        متصل
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <Badge variant="destructive">
                        {dbStatus?.status === 'demo' ? 'وضع تجريبي' : 'غير متصل'}
                      </Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">حالة الاتصال</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {dbStatus?.tablesExist ? 'الجداول موجودة' : 'الجداول غير موجودة'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">حالة الجداول</p>
              </div>
            </div>
            
            {dbStatus?.message && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">{dbStatus.message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>النسخ الاحتياطي</CardTitle>
                <CardDescription>إدارة النسخ الاحتياطية للنظام</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">إنشاء نسخة احتياطية جديدة</h3>
                <p className="text-sm text-muted-foreground">
                  سيتم إنشاء نسخة احتياطية كاملة من البيانات والملفات
                </p>
              </div>
              <Button onClick={handleCreateBackup} disabled={backupMutation.isPending}>
                {backupMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
                <Download className="h-4 w-4 mr-2" />
                إنشاء نسخة احتياطية
              </Button>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>معلومة</AlertTitle>
              <AlertDescription>
                يتم إنشاء نسخ احتياطية تلقائية كل 12 ساعة. يمكنك إنشاء نسخة احتياطية يدوية في أي وقت.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}