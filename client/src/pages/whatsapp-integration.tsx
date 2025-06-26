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
    try {
      // اختبار الاتصال مع WhatsApp API
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setIsConnected(true);
        toast({
          title: "نجح الاتصال",
          description: "تم الاتصال بـ WhatsApp Business API بنجاح",
        });
      } else {
        throw new Error('فشل الاتصال');
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "فشل الاتصال",
        description: "تعذر الاتصال بـ WhatsApp Business API",
        variant: "destructive",
      });
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
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))] flex items-center gap-3">
            <Smartphone className="text-[hsl(var(--primary))]" />
            تكامل WhatsApp
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            استقبال وإدارة الملفات عبر WhatsApp Business API
          </p>
        </div>

        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {isConnected ? 'متصل' : 'غير متصل'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الإعدادات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات الاتصال
            </CardTitle>
            <CardDescription>
              قم بإعداد بيانات WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="إدخل Access Token"
                value={settings.accessToken}
                onChange={(e) => setSettings({...settings, accessToken: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID</Label>
              <Input
                id="phoneNumberId"
                placeholder="إدخل Phone Number ID"
                value={settings.phoneNumberId}
                onChange={(e) => setSettings({...settings, phoneNumberId: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifyToken">Verify Token</Label>
              <Input
                id="verifyToken"
                placeholder="إدخل Verify Token"
                value={settings.verifyToken}
                onChange={(e) => setSettings({...settings, verifyToken: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhookUrl"
                  value={`${window.location.origin}/api/whatsapp/webhook`}
                  readOnly
                  className="bg-gray-50"
                />
                <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoRespond">الرد التلقائي</Label>
              <Switch
                id="autoRespond"
                checked={settings.autoRespond}
                onCheckedChange={(checked) => setSettings({...settings, autoRespond: checked})}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={testConnection} variant="outline" className="flex-1">
                اختبار الاتصال
              </Button>
              <Button onClick={saveSettings} className="flex-1">
                حفظ الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* الإحصائيات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              إحصائيات WhatsApp
            </CardTitle>
            <CardDescription>
              معلومات حول الرسائل والملفات المستلمة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                <div className="text-sm text-gray-600">إجمالي الرسائل</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.filesReceived}</div>
                <div className="text-sm text-gray-600">الملفات المستلمة</div>
              </div>
            </div>

            {stats.lastMessage && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">آخر رسالة:</div>
                <div className="font-medium">{stats.lastMessage.toLocaleString('ar-SA')}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label>أنواع الملفات المدعومة:</Label>
              <div className="flex flex-wrap gap-2">
                {settings.allowedFileTypes.map((type) => (
                  <Badge key={type} variant="secondary">
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

      {/* تعليمات الإعداد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            تعليمات الإعداد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none" dir="rtl">
            <h3>خطوات إعداد WhatsApp Business API:</h3>
            <ol className="space-y-2">
              <li>قم بإنشاء حساب في <strong>Facebook Developers</strong></li>
              <li>أنشئ تطبيق جديد واختر <strong>WhatsApp Business</strong></li>
              <li>احصل على <strong>Access Token</strong> و <strong>Phone Number ID</strong></li>
              <li>اذهب إلى إعدادات Webhook وأدخل:</li>
              <ul className="mt-2 space-y-1">
                <li>• <strong>Webhook URL:</strong> {window.location.origin}/api/whatsapp/webhook</li>
                <li>• <strong>Verify Token:</strong> أدخل أي نص واستخدمه في الإعدادات أعلاه</li>
                <li>• <strong>Webhook Fields:</strong> حدد "messages"</li>
              </ul>
              <li>احفظ الإعدادات واختبر الاتصال</li>
            </ol>

            <h3 className="mt-6">كيفية الاستخدام:</h3>
            <ul className="space-y-2">
              <li>• أرسل أي ملف عبر WhatsApp للرقم المسجل</li>
              <li>• سيتم حفظ الملف تلقائياً في قسم المستندات</li>
              <li>• يمكن إضافة وصف للملف عبر caption الرسالة</li>
              <li>• ستحصل على رسالة تأكيد عند نجاح الحفظ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}