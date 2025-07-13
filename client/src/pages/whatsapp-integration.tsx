import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MessageSquare, Phone, CheckCircle, XCircle, Loader2, Settings, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabaseApi } from '@/lib/supabase-api';

// Schema definitions
const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().min(1, 'معرف رقم الهاتف مطلوب'),
  accessToken: z.string().min(1, 'رمز الوصول مطلوب'),
  webhookVerifyToken: z.string().min(1, 'رمز التحقق مطلوب'),
  businessAccountId: z.string().min(1, 'معرف الحساب التجاري مطلوب'),
});

interface WhatsAppConfig {
  enabled: boolean;
  phoneNumberId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  businessAccountId?: string;
  webhookUrl?: string;
  lastSync?: string;
}

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber?: string;
  businessName?: string;
  lastMessage?: string;
  messagesReceived: number;
  filesReceived: number;
}

type WhatsAppConfigValues = z.infer<typeof whatsappConfigSchema>;

export default function WhatsAppIntegration() {
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
  const { data: whatsappConfig, isLoading } = useQuery<WhatsAppConfig>({
    queryKey: ['whatsapp-config'],
    queryFn: () => supabaseApi.getWhatsAppConfig(),
    enabled: !!user && user.role === 'admin'
  });

  const { data: whatsappStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp-status'],
    queryFn: () => supabaseApi.getWhatsAppStatus(),
    enabled: !!user && user.role === 'admin' && whatsappConfig?.enabled,
    refetchInterval: 30000
  });

  // Form
  const configForm = useForm<WhatsAppConfigValues>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      phoneNumberId: whatsappConfig?.phoneNumberId || '',
      accessToken: whatsappConfig?.accessToken || '',
      webhookVerifyToken: whatsappConfig?.webhookVerifyToken || '',
      businessAccountId: whatsappConfig?.businessAccountId || '',
    },
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (data: WhatsAppConfigValues) => supabaseApi.updateWhatsAppConfig(data),
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات WhatsApp بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: (enabled: boolean) => supabaseApi.toggleWhatsApp(enabled),
    onSuccess: () => {
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة تكامل WhatsApp",
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => supabaseApi.testWhatsApp(),
    onSuccess: () => {
      toast({
        title: "اختبار ناجح",
        description: "تم اختبار الاتصال بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "فشل الاختبار",
        description: error.message,
      });
    },
  });

  // Event handlers
  function onConfigSubmit(values: WhatsAppConfigValues) {
    updateConfigMutation.mutate(values);
  }

  const handleToggleEnabled = (enabled: boolean) => {
    toggleEnabledMutation.mutate(enabled);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">تكامل WhatsApp</h1>
        <p className="text-muted-foreground">إعداد وإدارة تكامل WhatsApp Business API</p>
      </div>

      {isLoading && (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>حالة التكامل</CardTitle>
                  <CardDescription>نظرة عامة على حالة WhatsApp Business</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={whatsappConfig?.enabled || false}
                  onCheckedChange={handleToggleEnabled}
                  disabled={toggleEnabledMutation.isPending}
                />
                <Badge variant={whatsappConfig?.enabled ? "default" : "secondary"}>
                  {whatsappConfig?.enabled ? "مفعل" : "معطل"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          {whatsappConfig?.enabled && (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {whatsappStatus?.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {whatsappStatus?.connected ? "متصل" : "غير متصل"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">حالة الاتصال</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">
                      {whatsappStatus?.phoneNumber || '--'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <span className="font-medium">
                      {whatsappStatus?.messagesReceived || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">رسائل مستلمة</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">
                      {whatsappStatus?.filesReceived || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">ملفات مستلمة</p>
                </div>
              </div>
              
              {whatsappStatus?.businessName && (
                <div className="mt-4 text-sm text-muted-foreground">
                  اسم النشاط التجاري: {whatsappStatus.businessName}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>إعدادات التكامل</CardTitle>
                <CardDescription>تكوين WhatsApp Business API</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...configForm}>
              <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={configForm.control}
                    name="phoneNumberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={configForm.control}
                    name="businessAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف الحساب التجاري</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="987654321" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={configForm.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز الوصول</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="EAAxxxxxxxxxxxxxxxxxxxx"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={configForm.control}
                  name="webhookVerifyToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز التحقق</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="my_verify_token_123"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {whatsappConfig?.webhookUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رابط Webhook</label>
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm">{whatsappConfig.webhookUrl}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      استخدم هذا الرابط في إعدادات Webhook في Meta Developer Console
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateConfigMutation.isPending}
                  >
                    {updateConfigMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    حفظ الإعدادات
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending || !whatsappConfig?.enabled}
                  >
                    {testConnectionMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                    <Send className="h-4 w-4 mr-2" />
                    اختبار الاتصال
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>تعليمات الإعداد</CardTitle>
                <CardDescription>خطوات تكوين WhatsApp Business API</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>متطلبات التكامل</AlertTitle>
                <AlertDescription>
                  للحصول على تكامل WhatsApp Business API، ستحتاج إلى:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>حساب Meta Business</li>
                    <li>تطبيق مطور في Meta Developer Console</li>
                    <li>رقم هاتف معتمد للأعمال</li>
                    <li>إذن WhatsApp Business API</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h4 className="font-medium">خطوات الإعداد:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. سجل في Meta Developer Console وأنشئ تطبيق جديد</li>
                  <li>2. أضف منتج WhatsApp Business API إلى التطبيق</li>
                  <li>3. احصل على معرف رقم الهاتف ورمز الوصول</li>
                  <li>4. قم بتكوين Webhook باستخدام الرابط المقدم أعلاه</li>
                  <li>5. أدخل البيانات في الحقول أعلاه واحفظ الإعدادات</li>
                  <li>6. اختبر الاتصال للتأكد من صحة الإعداد</li>
                </ol>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">الميزات المتاحة</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• استقبال الرسائل والملفات</li>
                    <li>• ربط الملفات بالمعاملات تلقائياً</li>
                    <li>• إشعارات فورية للرسائل الجديدة</li>
                    <li>• تصنيف تلقائي للمرفقات</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">أنواع الملفات المدعومة</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• الصور (JPG, PNG, GIF)</li>
                    <li>• المستندات (PDF, DOC, XLS)</li>
                    <li>• الصوتيات (MP3, WAV, OGG)</li>
                    <li>• مقاطع الفيديو (MP4, MOV)</li>
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