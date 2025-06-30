import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Cloud, Upload, HardDrive, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';

interface StorageStatus {
  provider: string;
  available: boolean;
  usage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface StorageInfo {
  primary: string;
  backups: string[];
  local: boolean;
  providers: Record<string, StorageStatus>;
}

export default function HybridStorage() {
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
  const { data: storageInfo, isLoading } = useQuery<StorageInfo>({
    queryKey: ['/api/storage/status'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 60000
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'supabase':
        return <Cloud className="h-5 w-5 text-green-500" />;
      case 'firebase':
        return <Upload className="h-5 w-5 text-orange-500" />;
      case 'local':
        return <HardDrive className="h-5 w-5 text-blue-500" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'supabase':
        return 'Supabase';
      case 'firebase':
        return 'Firebase';
      case 'local':
        return 'التخزين المحلي';
      default:
        return provider;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <Cloud className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">التخزين الهجين</h1>
        <p className="text-muted-foreground">إدارة ومراقبة مزودي التخزين المحلي والسحابي</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Storage Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Cloud className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>نظرة عامة على التخزين</CardTitle>
                <CardDescription>إعدادات التخزين الحالية ومزودي الخدمة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageInfo && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">أساسي</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(storageInfo?.primary || 'local')}
                    <span className="font-medium">{getProviderName(storageInfo?.primary || 'local')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">مزود التخزين الأساسي</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">احتياطي</Badge>
                  </div>
                  <div className="space-y-1">
                    {storageInfo?.backups?.map((backup, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {getProviderIcon(backup)}
                        <span className="text-sm">{getProviderName(backup)}</span>
                      </div>
                    )) || (
                      <div className="text-sm text-muted-foreground">لا توجد مزودات احتياطية</div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">مزودات التخزين الاحتياطية</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={storageInfo?.local ? "default" : "secondary"}>
                      {storageInfo?.local ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">التخزين المحلي</span>
                  </div>
                  <p className="text-sm text-muted-foreground">النسخ الاحتياطية المحلية</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Providers Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>حالة مزودي التخزين</CardTitle>
                <CardDescription>معلومات تفصيلية عن كل مزود تخزين</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storageInfo?.providers && Object.entries(storageInfo.providers).map(([provider, status]) => (
                <div key={provider} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider)}
                      <div>
                        <h3 className="font-medium">{getProviderName(provider)}</h3>
                        <p className="text-sm text-muted-foreground">{provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.available ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            متاح
                          </Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <Badge variant="destructive">
                            غير متاح
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {status.usage && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>استخدام التخزين</span>
                        <span>{status.usage.percentage}%</span>
                      </div>
                      <Progress value={status.usage.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>المستخدم: {(status.usage.used / 1024 / 1024).toFixed(2)} MB</span>
                        <span>المتاح: {(status.usage.total / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage Configuration Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>معلومات التكوين</CardTitle>
                <CardDescription>كيفية عمل نظام التخزين الهجين</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>نظام التخزين الهجين</AlertTitle>
                <AlertDescription>
                  يستخدم النظام عدة مزودات تخزين لضمان أمان البيانات:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>التخزين الأساسي: يتم حفظ جميع الملفات الجديدة</li>
                    <li>التخزين الاحتياطي: نسخ تلقائية من الملفات الهامة</li>
                    <li>التخزين المحلي: نسخ احتياطية محلية للطوارئ</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">المزايا</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• أمان عالي للبيانات</li>
                    <li>• استمرارية الخدمة</li>
                    <li>• سرعة في الوصول</li>
                    <li>• مرونة في التكوين</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">آلية العمل</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• تحميل تلقائي للمزود الأساسي</li>
                    <li>• نسخ احتياطي فوري</li>
                    <li>• تبديل تلقائي عند التعطل</li>
                    <li>• مزامنة دورية للبيانات</li>
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