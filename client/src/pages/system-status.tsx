import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { supabaseApi } from '@/lib/supabase-api';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function SystemStatus() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    performSystemChecks();
  }, []);

  const performSystemChecks = async () => {
    const systemChecks: SystemCheck[] = [];

    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const appEnv = import.meta.env.VITE_APP_ENV;

    systemChecks.push({
      name: 'متغيرات البيئة - VITE_SUPABASE_URL',
      status: supabaseUrl ? 'success' : 'error',
      message: supabaseUrl ? 'تم العثور على رابط Supabase' : 'رابط Supabase غير موجود',
      details: supabaseUrl || 'يجب إعداد VITE_SUPABASE_URL في متغيرات البيئة'
    });

    systemChecks.push({
      name: 'متغيرات البيئة - VITE_SUPABASE_ANON_KEY',
      status: supabaseKey ? 'success' : 'error',
      message: supabaseKey ? 'تم العثور على مفتاح Supabase' : 'مفتاح Supabase غير موجود',
      details: supabaseKey ? 'المفتاح متوفر' : 'يجب إعداد VITE_SUPABASE_ANON_KEY في متغيرات البيئة'
    });

    systemChecks.push({
      name: 'بيئة التطبيق',
      status: appEnv ? 'success' : 'warning',
      message: appEnv ? `البيئة: ${appEnv}` : 'البيئة غير محددة',
      details: appEnv || 'VITE_APP_ENV غير محدد، سيتم استخدام الإعدادات الافتراضية'
    });

    // Check browser compatibility
    const isModernBrowser = 'fetch' in window && 'localStorage' in window;
    systemChecks.push({
      name: 'متوافقية المتصفح',
      status: isModernBrowser ? 'success' : 'error',
      message: isModernBrowser ? 'المتصفح متوافق' : 'المتصفح غير متوافق',
      details: isModernBrowser ? 'جميع الميزات مدعومة' : 'يجب استخدام متصفح حديث'
    });

    // Check localStorage
    let localStorageWorks = false;
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      localStorageWorks = true;
    } catch (e) {
      localStorageWorks = false;
    }

    systemChecks.push({
      name: 'التخزين المحلي',
      status: localStorageWorks ? 'success' : 'error',
      message: localStorageWorks ? 'التخزين المحلي يعمل' : 'التخزين المحلي لا يعمل',
      details: localStorageWorks ? 'يمكن حفظ بيانات الجلسة' : 'قد تواجه مشاكل في تسجيل الدخول'
    });

    // Check API connectivity
    try {
      const healthCheck = await supabaseApi.healthCheck();
      
      systemChecks.push({
        name: 'الاتصال بـ API',
        status: healthCheck.status === 'healthy' ? 'success' : 'warning',
        message: healthCheck.status === 'healthy' ? 'API يعمل بشكل طبيعي' : 'API في وضع تجريبي',
        details: `البيئة: ${healthCheck.database}`
      });
    } catch (error) {
      systemChecks.push({
        name: 'الاتصال بـ API',
        status: 'warning',
        message: 'لا يمكن الوصول إلى API',
        details: 'سيتم استخدام الوضع التجريبي'
      });
    }

    // Check authentication demo
    const demoCredentials = { username: 'admin', password: 'admin123' };
    systemChecks.push({
      name: 'الحسابات التجريبية',
      status: 'info',
      message: 'متوفرة للاختبار',
      details: `admin/admin123, manager/manager123, user/user123`
    });

    setChecks(systemChecks);
    setIsLoading(false);
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري فحص النظام...</p>
        </div>
      </div>
    );
  }

  const successCount = checks.filter(c => c.status === 'success').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">حالة النظام</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{successCount}</div>
              <div className="text-sm text-green-600">فحوصات ناجحة</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
              <div className="text-sm text-yellow-600">تحذيرات</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{errorCount}</div>
              <div className="text-sm text-red-600">أخطاء</div>
            </div>
          </div>

          {errorCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">النظام جاهز للاستخدام</span>
              </div>
              <p className="text-green-700 mt-2">
                يمكنك الآن استخدام التطبيق. استخدم الحسابات التجريبية للبدء.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{check.name}</h3>
                  <p className="text-gray-700 mt-1">{check.message}</p>
                  {check.details && (
                    <p className="text-sm text-gray-600 mt-2 font-mono bg-white/50 p-2 rounded">
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">روابط مفيدة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/app" 
              className="block p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-medium text-blue-900">الدخول إلى التطبيق</h3>
              <p className="text-blue-700 text-sm mt-1">ابدأ استخدام نظام المحاسبة</p>
            </a>
            <a 
              href="https://github.com/hasnin090/iq" 
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">مستودع GitHub</h3>
              <p className="text-gray-700 text-sm mt-1">الكود المصدري والتوثيق</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
