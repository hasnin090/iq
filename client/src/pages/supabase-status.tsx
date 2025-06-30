import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Activity, Zap, Download, Upload, Loader2, CheckCircle, XCircle, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface SupabaseHealth {
  database: {
    connected: boolean;
    responseTime?: number;
    lastCheck?: string;
  };
  storage: {
    connected: boolean;
    available: boolean;
    lastCheck?: string;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'down';
    message?: string;
  };
}

export default function SupabaseStatus() {
  const { user } = useAuth();

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
  const { data: supabaseHealth, isLoading } = useQuery<SupabaseHealth>({
    queryKey: ['/api/supabase/health'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">سليم</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">متدهور</Badge>;
      case 'down':
        return <Badge variant="destructive">معطل</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <Server className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">حالة Supabase</h1>
        <p className="text-muted-foreground">مراقبة صحة وأداء خدمات Supabase</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>الحالة العامة</CardTitle>
                <CardDescription>حالة جميع خدمات Supabase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {supabaseHealth?.overall.status === 'healthy' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : supabaseHealth?.overall.status === 'degraded' ? (
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    خدمات Supabase
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {supabaseHealth?.overall.message || 'جاري التحقق من الحالة...'}
                  </p>
                </div>
              </div>
              {supabaseHealth?.overall.status && getStatusBadge(supabaseHealth.overall.status)}
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Server className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>قاعدة البيانات</CardTitle>
                <CardDescription>حالة اتصال قاعدة بيانات Supabase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(supabaseHealth?.database.connected || false)}
                  <span className="font-medium">
                    {supabaseHealth?.database.connected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">حالة الاتصال</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {supabaseHealth?.database.responseTime ? 
                      `${supabaseHealth.database.responseTime} ms` : 
                      '--'
                    }
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">زمن الاستجابة</p>
              </div>
            </div>
            
            {supabaseHealth?.database.lastCheck && (
              <div className="mt-4 text-sm text-muted-foreground">
                آخر فحص: {new Date(supabaseHealth.database.lastCheck).toLocaleString('ar-EG')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>التخزين السحابي</CardTitle>
                <CardDescription>حالة خدمة تخزين الملفات في Supabase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(supabaseHealth?.storage.connected || false)}
                  <span className="font-medium">
                    {supabaseHealth?.storage.connected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">حالة الاتصال</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(supabaseHealth?.storage.available || false)}
                  <span className="font-medium">
                    {supabaseHealth?.storage.available ? 'متاح' : 'غير متاح'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">إمكانية الرفع</p>
              </div>
            </div>
            
            {supabaseHealth?.storage.lastCheck && (
              <div className="mt-4 text-sm text-muted-foreground">
                آخر فحص: {new Date(supabaseHealth.storage.lastCheck).toLocaleString('ar-EG')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>معلومات الخدمة</CardTitle>
                <CardDescription>تفاصيل استخدام Supabase في النظام</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>خدمات Supabase المستخدمة</AlertTitle>
                <AlertDescription>
                  يستخدم النظام الخدمات التالية من Supabase:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>قاعدة بيانات PostgreSQL كنسخة احتياطية</li>
                    <li>تخزين الملفات كمزود احتياطي</li>
                    <li>مزامنة البيانات التلقائية</li>
                    <li>النسخ الاحتياطي للملفات المهمة</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">المزايا</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• نسخ احتياطية آمنة</li>
                    <li>• مزامنة في الوقت الفعلي</li>
                    <li>• أمان عالي للبيانات</li>
                    <li>• سهولة الاستعادة</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">الاستخدام</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• تخزين احتياطي للمعاملات</li>
                    <li>• نسخ المرفقات المهمة</li>
                    <li>• تزامن إعدادات النظام</li>
                    <li>• أرشفة البيانات القديمة</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}