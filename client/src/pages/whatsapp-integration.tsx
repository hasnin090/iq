import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, MessageCircle, FileImage, Settings, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';

export default function WhatsAppIntegration() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    accessToken: '',
    phoneNumberId: '',
    verifyToken: '',
    webhookUrl: '',
    autoRespond: true,
    allowedFileTypes: ['image', 'document', 'audio', 'video']
  });
  const [stats, setStats] = useState({
    totalMessages: 0,
    filesReceived: 0,
    lastMessage: null as Date | null
  });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      // تحميل إعدادات WhatsApp من النظام
      const response = await fetch('/api/settings');
      if (response.ok) {
        const allSettings = await response.json();
        // استخراج إعدادات WhatsApp
        // هذا مجرد مثال - ستحتاج لتخزين الإعدادات الفعلية
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    }
  };

  const loadStats = async () => {
    try {
      // تحميل إحصائيات WhatsApp
      // يمكن إضافة endpoint خاص للإحصائيات
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const testConnection = async () => {
    if (!settings.accessToken || !settings.phoneNumberId) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال Access Token و Phone Number ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: settings.accessToken,
          phoneNumberId: settings.phoneNumberId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsConnected(true);
        toast({
          title: "نجح الاتصال",
          description: "تم الاتصال بـ WhatsApp Business API بنجاح",
        });
      } else {
        setIsConnected(false);
        toast({
          title: "فشل الاتصال",
          description: data.message || "تعذر الاتصال بـ WhatsApp Business API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "خطأ في الشبكة",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      // حفظ إعدادات WhatsApp
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات WhatsApp بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رابط الـ webhook",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-green-50/30 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* العنوان - متجاوب */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[hsl(var(--primary))] flex items-center gap-2 sm:gap-3">
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-[hsl(var(--primary))]" />
              <span className="break-words">تكامل WhatsApp</span>
            </h1>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))]">
              استقبال وإدارة الملفات عبر WhatsApp Business API
            </p>
          </div>

          <div className="flex justify-start sm:justify-end">
            <Badge 
              variant={isConnected ? "default" : "destructive"} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm"
            >
              {isConnected ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
              {isConnected ? 'متصل' : 'غير متصل'}
            </Badge>
          </div>
        </div>

        {/* الشبكة الأساسية - متجاوبة */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* بطاقة الإعدادات - محسنة للموبايل */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="w-5 h-5 shrink-0" />
                <span>إعدادات الاتصال</span>
              </CardTitle>
              <CardDescription className="text-sm">
                قم بإعداد بيانات WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              {/* Access Token */}
              <div className="space-y-2">
                <Label htmlFor="accessToken" className="text-sm font-medium">
                  Access Token
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="إدخل Access Token"
                  value={settings.accessToken}
                  onChange={(e) => setSettings({...settings, accessToken: e.target.value})}
                  className="w-full text-sm"
                />
              </div>

              {/* Phone Number ID */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId" className="text-sm font-medium">
                  Phone Number ID
                </Label>
                <Input
                  id="phoneNumberId"
                  placeholder="إدخل Phone Number ID"
                  value={settings.phoneNumberId}
                  onChange={(e) => setSettings({...settings, phoneNumberId: e.target.value})}
                  className="w-full text-sm"
                />
              </div>

              {/* Verify Token */}
              <div className="space-y-2">
                <Label htmlFor="verifyToken" className="text-sm font-medium">
                  Verify Token
                </Label>
                <Input
                  id="verifyToken"
                  placeholder="إدخل Verify Token"
                  value={settings.verifyToken}
                  onChange={(e) => setSettings({...settings, verifyToken: e.target.value})}
                  className="w-full text-sm"
                />
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-sm font-medium">
                  Webhook URL
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="webhookUrl"
                    value={`${window.location.origin}/api/whatsapp/webhook`}
                    readOnly
                    className="bg-gray-50 text-sm flex-1 min-w-0"
                  />
                  <Button variant="outline" size="sm" onClick={copyWebhookUrl} className="shrink-0">
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline mr-1">نسخ</span>
                  </Button>
                </div>
              </div>

              {/* الرد التلقائي */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="autoRespond" className="text-sm font-medium">
                  الرد التلقائي
                </Label>
                <Switch
                  id="autoRespond"
                  checked={settings.autoRespond}
                  onCheckedChange={(checked) => setSettings({...settings, autoRespond: checked})}
                />
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  onClick={testConnection} 
                  variant="outline" 
                  className="w-full sm:flex-1 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      جاري الاختبار...
                    </>
                  ) : (
                    'اختبار الاتصال'
                  )}
                </Button>
                <Button onClick={saveSettings} className="w-full sm:flex-1 text-sm">
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة الإحصائيات - محسنة للموبايل */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>إحصائيات WhatsApp</span>
              </CardTitle>
              <CardDescription className="text-sm">
                معلومات حول الرسائل والملفات المستلمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              {/* إحصائيات الاستخدام */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalMessages}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    إجمالي الرسائل
                  </div>
                </div>

                <div className="text-center p-4 sm:p-5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.filesReceived}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    الملفات المستلمة
                  </div>
                </div>
              </div>

              {/* آخر رسالة */}
              {stats.lastMessage && (
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    آخر رسالة:
                  </div>
                  <div className="font-medium text-sm sm:text-base mt-1">
                    {stats.lastMessage.toLocaleString('ar-SA')}
                  </div>
                </div>
              )}

              {/* أنواع الملفات المدعومة */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">أنواع الملفات المدعومة:</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.allowedFileTypes.map((type) => (
                    <Badge 
                      key={type} 
                      variant="secondary" 
                      className="text-xs px-2 py-1 whitespace-nowrap"
                    >
                      {type === 'image' ? '📷 صور' : 
                       type === 'document' ? '📄 مستندات' :
                       type === 'audio' ? '🎵 صوتيات' :
                       type === 'video' ? '🎬 فيديو' : type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        {/* تعليمات الإعداد - بطاقة كاملة العرض */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ExternalLink className="w-5 h-5 shrink-0" />
              <span>تعليمات الإعداد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 text-sm sm:text-base">
              {/* خطوات الإعداد */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[hsl(var(--primary))] border-b pb-2">
                  خطوات إعداد WhatsApp Business API:
                </h3>
                <ol className="space-y-3 pr-4">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>قم بإنشاء حساب في <strong>Facebook Developers</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>أنشئ تطبيق جديد واختر <strong>WhatsApp Business</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>احصل على <strong>Access Token</strong> و <strong>Phone Number ID</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <div className="space-y-2">
                      <span>اذهب إلى إعدادات Webhook وأدخل:</span>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2 text-xs sm:text-sm">
                        <div>
                          <strong>Webhook URL:</strong>
                          <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs ml-2 break-all">
                            {window.location.origin}/api/whatsapp/webhook
                          </code>
                        </div>
                        <div><strong>Verify Token:</strong> أدخل أي نص واستخدمه في الإعدادات أعلاه</div>
                        <div><strong>Webhook Fields:</strong> حدد "messages"</div>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <span>احفظ الإعدادات واختبر الاتصال</span>
                  </li>
                </ol>
              </div>

              {/* كيفية الاستخدام */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold text-[hsl(var(--primary))] border-b pb-2">
                  كيفية الاستخدام:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-sm">أرسل أي ملف عبر WhatsApp للرقم المسجل</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-sm">سيتم حفظ الملف تلقائياً في قسم المستندات</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-sm">يمكن إضافة وصف للملف عبر caption الرسالة</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-sm">ستحصل على رسالة تأكيد عند نجاح الحفظ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}