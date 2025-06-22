import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Database, FileText, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface FileStatus {
  totalTransactions: number;
  transactionsWithFiles: number;
  oldFormatFiles: number;
  newFormatFiles: number;
  missingFiles: number;
}

interface MigrationResult {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
}

export default function FileMigration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // جلب حالة الملفات
  const { data: fileStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/files/status'],
    queryFn: () => apiRequest('/api/files/status')
  }) as { data: FileStatus | undefined, isLoading: boolean };

  // طلب نقل الملفات
  const migrateMutation = useMutation({
    mutationFn: () => apiRequest('/api/files/migrate', 'POST'),
    onSuccess: (data: MigrationResult) => {
      toast({
        title: "اكتمل النقل",
        description: `تم نقل ${data.migratedFiles} ملف من أصل ${data.totalFiles}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/status'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في النقل",
        description: "حدث خطأ أثناء نقل الملفات",
      });
    }
  });

  // طلب تنظيف الملفات
  const cleanupMutation = useMutation({
    mutationFn: () => apiRequest('/api/files/cleanup', 'POST'),
    onSuccess: (data: { cleanedFiles: number }) => {
      toast({
        title: "اكتمل التنظيف",
        description: `تم حذف ${data.cleanedFiles} ملف قديم`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files/status'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطأ في التنظيف",
        description: "حدث خطأ أثناء تنظيف الملفات",
      });
    }
  });

  const handleMigrate = () => {
    migrateMutation.mutate();
  };

  const handleCleanup = () => {
    cleanupMutation.mutate();
  };

  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/files/status'] });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">جاري تحميل حالة الملفات...</p>
        </div>
      </div>
    );
  }

  const migrationProgress = fileStatus ? 
    (fileStatus.newFormatFiles / Math.max(fileStatus.transactionsWithFiles, 1)) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">نقل الملفات إلى التخزين السحابي</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وترحيل الملفات القديمة إلى أنظمة التخزين السحابية
          </p>
        </div>
        <Button onClick={refreshStatus} variant="outline" size="sm">
          <RefreshCw className="ml-1 h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* إحصائيات الملفات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                <p className="text-xl font-semibold">{fileStatus?.totalTransactions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">معاملات مع مرفقات</p>
                <p className="text-xl font-semibold">{fileStatus?.transactionsWithFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">ملفات سحابية</p>
                <p className="text-xl font-semibold">{fileStatus?.newFormatFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">ملفات قديمة</p>
                <p className="text-xl font-semibold">{fileStatus?.oldFormatFiles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط التقدم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            تقدم النقل إلى التخزين السحابي
          </CardTitle>
          <CardDescription>
            نسبة الملفات التي تم نقلها إلى التخزين السحابي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>التقدم</span>
              <span>{Math.round(migrationProgress)}%</span>
            </div>
            <Progress value={migrationProgress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{fileStatus?.newFormatFiles || 0} ملف في السحابة</span>
              <span>{fileStatus?.oldFormatFiles || 0} ملف قديم</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حالة الملفات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>حالة الملفات</CardTitle>
            <CardDescription>تفاصيل حالة الملفات في النظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>ملفات بالتنسيق الجديد</span>
              <Badge variant="default" className="bg-green-500">
                {fileStatus?.newFormatFiles || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>ملفات بالتنسيق القديم</span>
              <Badge variant="secondary">
                {fileStatus?.oldFormatFiles || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>ملفات مفقودة</span>
              <Badge variant="destructive">
                {fileStatus?.missingFiles || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات النقل</CardTitle>
            <CardDescription>أدوات إدارة نقل الملفات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleMigrate}
              disabled={migrateMutation.isPending || !fileStatus?.oldFormatFiles}
              className="w-full"
            >
              {migrateMutation.isPending ? (
                <>
                  <RefreshCw className="ml-1 h-4 w-4 animate-spin" />
                  جاري النقل...
                </>
              ) : (
                <>
                  <CloudUpload className="ml-1 h-4 w-4" />
                  نقل الملفات القديمة ({fileStatus?.oldFormatFiles || 0})
                </>
              )}
            </Button>

            <Button 
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending || migrationProgress < 100}
              variant="outline"
              className="w-full"
            >
              {cleanupMutation.isPending ? (
                <>
                  <RefreshCw className="ml-1 h-4 w-4 animate-spin" />
                  جاري التنظيف...
                </>
              ) : (
                <>
                  <Trash2 className="ml-1 h-4 w-4" />
                  تنظيف الملفات القديمة
                </>
              )}
            </Button>

            {migrationProgress === 100 && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                تم نقل جميع الملفات إلى التخزين السحابي
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تحذيرات ونصائح */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">تحذيرات ونصائح</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• تأكد من أن التخزين السحابي يعمل بشكل صحيح قبل بدء النقل</p>
          <p>• عملية النقل قد تستغرق وقتاً حسب حجم وعدد الملفات</p>
          <p>• لا تقم بتنظيف الملفات القديمة إلا بعد التأكد من نجاح النقل</p>
          <p>• سيتم الاحتفاظ بنسخة احتياطية من الملفات في النظام الأساسي</p>
        </CardContent>
      </Card>
    </div>
  );
}