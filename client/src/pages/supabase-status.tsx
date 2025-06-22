import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Cloud, 
  Key,
  ExternalLink,
  Info
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SupabaseHealth {
  client: boolean;
  database: boolean;
  storage: boolean;
  lastCheck: string;
  keyStatus?: {
    urlValid: boolean;
    anonKeyValid: boolean;
    serviceKeyValid: boolean;
  };
}

interface DiagnosisResult {
  url: boolean;
  anonKey: boolean;
  serviceKey: boolean;
  urlFormat: boolean;
  anonKeyTest: boolean;
  serviceKeyTest: boolean;
  databaseAccess: boolean;
  storageAccess: boolean;
  errors: string[];
}

export default function SupabaseStatus() {
  const queryClient = useQueryClient();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/supabase/health'],
    refetchInterval: 30000,
  });

  const { data: diagnosisData, isLoading: diagnosisLoading } = useQuery({
    queryKey: ['/api/supabase/diagnose'],
    enabled: false,
  });

  const initMutation = useMutation({
    mutationFn: () => apiRequest('/api/supabase/init', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase/health'] });
      setLastRefresh(new Date());
    },
  });

  const runDiagnosisMutation = useMutation({
    mutationFn: () => apiRequest('/api/supabase/diagnose', 'GET'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supabase/diagnose'] });
    },
  });

  const health: SupabaseHealth = (healthData as any)?.health || {
    client: false,
    database: false,
    storage: false,
    lastCheck: new Date().toISOString()
  };

  const diagnosis: DiagnosisResult = (diagnosisData as any)?.diagnosis || {} as DiagnosisResult;
  const suggestions: string[] = (diagnosisData as any)?.suggestions || [];

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="gap-2">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  const getOverallStatus = () => {
    if (health.client && health.database && health.storage) {
      return { status: "متصل بالكامل", color: "text-green-600", progress: 100 };
    } else if (health.client && (health.database || health.storage)) {
      return { status: "متصل جزئياً", color: "text-yellow-600", progress: 60 };
    } else if (health.client) {
      return { status: "اتصال أساسي فقط", color: "text-orange-600", progress: 30 };
    } else {
      return { status: "غير متصل", color: "text-red-600", progress: 0 };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">حالة Supabase</h1>
          <p className="text-muted-foreground">
            فحص وإدارة اتصال قاعدة البيانات السحابية
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runDiagnosisMutation.mutate()}
            disabled={diagnosisLoading || runDiagnosisMutation.isPending}
            variant="outline"
          >
            <Info className="h-4 w-4 mr-2" />
            تشخيص تفصيلي
          </Button>
          <Button
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة تهيئة
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            الحالة العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-lg font-medium ${overallStatus.color}`}>
                {overallStatus.status}
              </span>
              <span className="text-sm text-muted-foreground">
                آخر فحص: {new Date(health.lastCheck).toLocaleString('ar-EG')}
              </span>
            </div>
            <Progress value={overallStatus.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Connection Status Details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              العميل
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(health.client, health.client ? "متصل" : "غير متصل")}
            <p className="text-sm text-muted-foreground mt-2">
              اتصال أساسي مع Supabase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              قاعدة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(health.database, health.database ? "متاح" : "غير متاح")}
            <p className="text-sm text-muted-foreground mt-2">
              وصول لقراءة وكتابة البيانات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              التخزين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(health.storage, health.storage ? "متاح" : "غير متاح")}
            <p className="text-sm text-muted-foreground mt-2">
              رفع وتخزين الملفات
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Status */}
      {health.keyStatus && (
        <Card>
          <CardHeader>
            <CardTitle>حالة المفاتيح</CardTitle>
            <CardDescription>
              فحص مفاتيح API المطلوبة للاتصال
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(health.keyStatus.urlValid)}
                <span>رابط المشروع</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(health.keyStatus.anonKeyValid)}
                <span>المفتاح العام</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(health.keyStatus.serviceKeyValid)}
                <span>مفتاح الخدمة</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج التشخيص التفصيلي</CardTitle>
            <CardDescription>
              تحليل شامل لحالة الاتصال والمشاكل المحتملة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">المفاتيح والإعدادات</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.url)}
                    <span>رابط المشروع متوفر</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.urlFormat)}
                    <span>تنسيق الرابط صحيح</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.anonKey)}
                    <span>المفتاح العام متوفر</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.serviceKey)}
                    <span>مفتاح الخدمة متوفر</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">اختبارات الاتصال</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.anonKeyTest)}
                    <span>اختبار المفتاح العام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.serviceKeyTest)}
                    <span>اختبار مفتاح الخدمة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.databaseAccess)}
                    <span>الوصول لقاعدة البيانات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosis.storageAccess)}
                    <span>الوصول للتخزين</span>
                  </div>
                </div>
              </div>
            </div>

            {diagnosis.errors && diagnosis.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">الأخطاء المكتشفة</h4>
                <div className="space-y-1">
                  {diagnosis.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>اقتراحات للحل</CardTitle>
            <CardDescription>
              خطوات مقترحة لحل مشاكل الاتصال
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {suggestion}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              فتح لوحة Supabase
            </Button>
            <Button 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/supabase/health'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث الحالة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}