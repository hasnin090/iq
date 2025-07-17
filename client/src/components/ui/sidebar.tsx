import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { supabaseApi } from "@/lib/supabase-api";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppHeader } from "@/components/ui/app-header";
import { useQuery } from "@tanstack/react-query";

// تعريف واجهة المشروع
interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
  progress?: number;
  createdBy?: number;
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // فتح قسم الحسابات تلقائياً عند زيارة إحدى صفحاته
  useEffect(() => {
    if (location === "/transactions" || location === "/receivables") {
      setIsAccountsOpen(true);
    }
  }, [location]);

  // فتح قسم الإعدادات تلقائياً عند زيارة إحدى صفحاته
  useEffect(() => {
    const settingsRoutes = [
      "/settings", "/database-management", "/hybrid-storage", 
      "/file-migration", "/whatsapp-integration"
    ];
    if (settingsRoutes.includes(location)) {
      setIsSettingsOpen(true);
    }
  }, [location]);

// مكون لعرض اسم الشركة أو اسم المشروع النشط
function CompanyName() {
  const { user } = useAuth();
  
  // إذا لم يكن هناك مستخدم، لا نقوم بأي استعلامات
  if (!user) {
    return <span>جاري التحميل...</span>;
  }
  
  const { data: settings, isLoading: isLoadingSettings } = useQuery<{ key: string; value: string }[]>({
    queryKey: ['/api/settings'],
    enabled: !!user, // تفعيل الطلب فقط عند وجود مستخدم
    staleTime: 1000 * 60 * 5, // تخزين البيانات لمدة 5 دقائق قبل إعادة الطلب
    gcTime: 1000 * 60 * 10, // الاحتفاظ بالبيانات في الذاكرة لمدة 10 دقائق (gcTime يحل محل cacheTime)
  });
  
  // جلب المشاريع في نفس المكون ليتمكن من الوصول للمشروع النشط
  const { data: userProjects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/user-projects'],
    enabled: !!user && user.role !== 'admin',
    staleTime: 1000 * 60 * 3, // تخزين البيانات لمدة 3 دقائق قبل إعادة الطلب
  });
  
  // الحصول على المشروع النشط
  const activeProject = useMemo(() => {
    return Array.isArray(userProjects) && userProjects.length > 0 ? userProjects[0] : undefined;
  }, [userProjects]);

  // البحث عن اسم الشركة في أي من المفتاحين - بتحسين الأداء باستخدام useMemo
  const companyName = useMemo(() => {
    if (!settings || !Array.isArray(settings)) return 'مدير النظام';
    
    const companyNameSetting = settings.find((s: {key: string, value: string}) => s.key === 'companyName');
    if (companyNameSetting?.value) {
      return companyNameSetting.value;
    }
    
    const alternativeNameSetting = settings.find((s: {key: string, value: string}) => s.key === 'company_name');
    return alternativeNameSetting?.value || 'مدير النظام';
  }, [settings]);
  
  // في حالة جاري التحميل، نعرض مؤشر تحميل خفيف
  if (isLoadingSettings && user?.role === 'admin') {
    return <span className="opacity-70">جاري التحميل...</span>;
  }
  
  // إذا كان المستخدم مديرًا، يظهر اسم الشركة
  if (user?.role === 'admin') {
    return <span>{companyName}</span>;
  } else if (activeProject) {
    // إذا كان مستخدم عادي ولديه مشروع نشط، يظهر اسم المشروع
    return <span>{activeProject.name}</span>;
  } else if (isLoadingProjects) {
    return <span className="opacity-70">جاري التحميل...</span>;
  } else {
    // إذا لم يكن هناك مشروع نشط
    return <span>مدير المشاريع</span>;
  }
}


  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  
  // جلب المشاريع المتاحة للمستخدم (سيتم تصفيتها في الخلفية بواسطة API)
  const { data: userProjects, isLoading: isLoadingProjects, isError: isProjectsError } = useQuery<Project[]>({
    queryKey: ['user-projects'],
    queryFn: () => supabaseApi.getUserProjects(),
    // فقط جلب المشاريع إذا كان المستخدم موجود وليس مديرًا
    enabled: !!user && user.role !== 'admin',
    staleTime: 1000 * 60 * 3, // تخزين البيانات لمدة 3 دقائق قبل إعادة الطلب
    retry: 1, // محاولة إعادة الطلب مرة واحدة فقط بعد الفشل
  });
  
  // اختيار المشروع النشط - نستخدم المشروع الأول كافتراضي أو نسمح للمستخدم باختيار مشروع معين
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  
  // تعيين المشروع النشط عندما يتم تحميل المشاريع
  useEffect(() => {
    if (userProjects && Array.isArray(userProjects) && userProjects.length > 0 && !activeProjectId) {
      setActiveProjectId(userProjects[0].id);
    }
  }, [userProjects, activeProjectId]);
  
  // الحصول على معلومات المشروع النشط
  const activeProject = Array.isArray(userProjects) ? userProjects.find((p: Project) => p.id === activeProjectId) : undefined;

  // حالة القائمة الجانبية - مفتوحة افتراضيًا في الشاشات الكبيرة فقط
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (!mobileView) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة على الأجهزة المحمولة
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  const handleLogout = () => {
    try {
      // نتخطى الاتصال بالـ API ونستخدم وظيفة logout من سياق المصادقة مباشرة
      logout();
      queryClient.clear();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "شكراً لاستخدامك التطبيق",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الخروج",
        description: "يرجى المحاولة مرة أخرى",
      });
    }
  };

  // استمع لحدث تبديل الشريط الجانبي
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, [isOpen]);

  return (
    <>
      {/* زخرفة الصفحة */}
      <div className="page-decoration"></div>
      <div className="page-decoration-2"></div>
      {/* شريط علوي ثابت */}
      <AppHeader onOpenSidebar={() => setIsOpen(true)} />
      {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها في الهواتف */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      {/* تم إزالة شريط التنقل السفلي وفقًا لطلب المستخدم */}
      <aside
        className={`fixed top-0 right-0 h-full w-[90%] xs:w-[85%] sm:w-80 md:w-72 lg:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-blue-200/50 dark:border-gray-700/50 transform transition-all duration-500 ease-in-out overflow-y-auto shadow-2xl flex flex-col ${
          isMobile 
            ? `z-50 ${isOpen ? "translate-x-0" : "translate-x-full"}` 
            : "z-40 translate-x-0"
        }`}
        style={{
          borderTopLeftRadius: isMobile ? '24px' : '0',
          borderBottomLeftRadius: isMobile ? '24px' : '0',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 50%, rgba(241,245,249,0.95) 100%)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.1), -8px 0 32px rgba(0, 0, 0, 0.05), inset 1px 0 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}
      >
        <div className="p-6 md:p-7 flex-grow">
          {/* Header with app logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] via-blue-500 to-[hsl(var(--primary))/80 flex items-center justify-center shadow-xl relative group overflow-hidden border border-blue-200/30">
                  <i className="fas fa-shield-alt text-xl text-white z-10 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"></i>
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/0 via-blue-600/40 to-blue-600/0 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                </div>
                {/* مؤشر الحالة */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] via-blue-600 to-[hsl(var(--primary))/80]">{user ? <CompanyName /> : "نظام المحاسبة"}</h1>
                <p className="text-xs text-blue-500/80 dark:text-blue-400/80 mt-1 hidden sm:inline-block font-medium">الإصدار المطور 1.0.2</p>
              </div>
            </div>
            
            {/* زر تبديل الوضع المظلم/الفاتح */}
            <button 
              onClick={() => {
                // استخدام وظيفة تبديل السمة من ملف المساعدات
                import('../../lib/theme-utils').then(module => {
                  module.toggleTheme();
                });
              }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-gray-700/80 dark:to-gray-800/80 hover:from-blue-100 hover:to-blue-200/90 dark:hover:from-gray-600 dark:hover:to-gray-700 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300 relative overflow-hidden group border border-blue-200/30 dark:border-gray-600/30"
              aria-label="تبديل الوضع المظلم/الفاتح"
            >
              {/* الأيقونة الرئيسية */}
              <i className="fas fa-moon text-blue-600 dark:text-blue-300 hidden dark:inline-block z-10 text-lg"></i>
              <i className="fas fa-sun text-amber-500 dark:hidden z-10 text-lg"></i>
              
              {/* تأثير الوهج خلف الأيقونة */}
              <div className="absolute inset-0 bg-blue-200/30 dark:bg-blue-900/30 rounded-2xl transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              
              {/* تأثير الدوران عند النقر */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-400/10 to-amber-400/10 dark:from-blue-400/5 dark:to-blue-600/5 opacity-0 group-hover:opacity-100 animate-spin-slow"></div>
              
              {/* وميض خفيف في الوضع الداكن */}
              <div className="absolute inset-0 rounded-2xl hidden dark:block bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
            </button>
          </div>
          
          {/* User profile card */}
          {user && (
            <div className="mb-6 bg-gradient-to-br from-blue-50/90 via-white/60 to-blue-100/80 dark:from-gray-800/90 dark:via-gray-700/60 dark:to-gray-800/80 p-5 rounded-3xl border border-blue-200/40 dark:border-gray-600/40 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden zoom-in group">
              {/* خلفية متحركة */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-blue-600/10 dark:from-blue-400/10 dark:via-transparent dark:to-blue-500/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* تأثير الحواف المضيئة */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* معلومات المستخدم */}
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border-2 border-white/20">
                    <i className="fas fa-user-circle text-2xl text-white"></i>
                  </div>
                  {/* مؤشر الحالة المتقدم */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  {/* توهج حول الصورة الشخصية */}
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="flex-1">
                  <div className="text-blue-700 dark:text-white font-bold text-lg tracking-wide">
                    <CompanyName />
                  </div>
                  <div className="text-sm text-blue-600/80 dark:text-gray-300 mt-1 flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-2 animate-pulse"></div>
                    <span className="font-semibold tracking-wide">{user.name}</span>
                  </div>
                  <div className="text-xs text-blue-500/70 dark:text-blue-400/70 mt-2 flex items-center">
                    <i className="fas fa-shield-alt mr-2 text-blue-500"></i>
                    <span className="px-2 py-1 bg-blue-100/80 dark:bg-blue-900/40 rounded-lg font-medium border border-blue-200/30 dark:border-blue-700/30">
                      {user.role === 'admin' ? 'مدير النظام' : user.role === 'manager' ? 'مدير مشروع' : 'مستخدم'}
                    </span>
                  </div>
                </div>
              </div>

              {/* معلومات المشروع النشط - عرضها فقط للمستخدمين العاديين ومديري المشاريع */}
              {user.role !== 'admin' && activeProject && (
                <div className="mt-4 pt-4 border-t border-blue-200/40 dark:border-gray-600/40 relative z-10">
                  <div className="flex items-center bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-2xl border border-green-200/30 dark:border-green-700/30 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                      <i className="fas fa-folder-open text-lg text-white"></i>
                    </div>
                    <div className="mr-3 flex-1">
                      <div className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center">
                        <span>المشروع النشط</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      </div>
                      <div className="text-xs text-green-600/80 dark:text-green-300/80 mt-1 font-medium truncate">
                        {activeProject.name}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
                      <i className="fas fa-check text-green-600 dark:text-green-400 text-sm"></i>
                    </div>
                  </div>
                </div>
              )}
              
              {/* تأثير النقاط المتحركة */}
              <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400/40 rounded-full animate-ping"></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            </div>
          )}
          
          {/* Main menu section - المحتوى الرئيسي */}
          <div className="mt-6 border border-blue-100 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm bg-blue-50/30 dark:bg-gray-700 slide-in-up">
            <div className="py-2.5 px-4 bg-gradient-to-l from-[hsl(var(--primary))/20] to-[hsl(var(--primary))/5] dark:from-[hsl(var(--primary))/30] dark:to-[hsl(var(--primary))/10] border-b border-blue-100 dark:border-gray-600">
              <h3 className="text-[hsl(var(--primary))] dark:text-white font-semibold text-sm sm:text-base">القائمة الرئيسية</h3>
            </div>
            <nav className="p-2.5 space-y-1.5">
              <Link
                href="/"
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  location === "/" 
                    ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                }`}
              >
                {/* خلفية متدرجة للعنصر النشط */}
                {location === "/" && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                )}
                
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                  location === "/" 
                    ? "bg-white/20 text-white" 
                    : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                }`}>
                  <i className="fas fa-chart-line text-lg"></i>
                </div>
                <span className="text-base font-bold tracking-wide relative z-10">لوحة التحكم</span>
                
                {/* تأثير التوهج للعنصر النشط */}
                {location === "/" && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                )}
                
                {/* تأثير hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              {/* قسم الحسابات القابل للطي */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsAccountsOpen(!isAccountsOpen)}
                  className={`w-full flex items-center justify-between space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    (location === "/transactions" || location === "/receivables")
                      ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  }`}
                >
                  {/* خلفية متدرجة للعنصر النشط */}
                  {(location === "/transactions" || location === "/receivables") && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                  )}
                  
                  <div className="flex items-center space-x-reverse space-x-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                      (location === "/transactions" || location === "/receivables") 
                        ? "bg-white/20 text-white" 
                        : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    }`}>
                      <i className="fas fa-wallet text-lg"></i>
                    </div>
                    <span className="text-base font-bold tracking-wide relative z-10">الحسابات</span>
                  </div>
                  <i className={`fas fa-chevron-${isAccountsOpen ? 'up' : 'down'} text-sm transition-transform duration-300 relative z-10`}></i>
                  
                  {/* تأثير التوهج للعنصر النشط */}
                  {(location === "/transactions" || location === "/receivables") && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                  )}
                  
                  {/* تأثير hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                {/* القائمة الفرعية */}
                <div className={`overflow-hidden transition-all duration-300 ${isAccountsOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="mr-4 space-y-1">
                    <Link
                      href="/transactions"
                      className={`flex items-center space-x-reverse space-x-2 px-4 py-2.5 rounded-xl no-flicker touch-target transition-all duration-200 transform hover:scale-[1.01] relative group ${
                        location === "/transactions" 
                          ? "bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold border-r-3 border-blue-500 shadow-md" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-800/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-700/70 transition-colors duration-200">
                        <i className="fas fa-coins text-sm"></i>
                      </div>
                      <span className="text-sm font-medium">العمليات النقدية</span>
                    </Link>
                    
                    <Link
                      href="/receivables"
                      className={`flex items-center space-x-reverse space-x-2 px-4 py-2.5 rounded-xl no-flicker touch-target transition-all duration-200 transform hover:scale-[1.01] relative group ${
                        location === "/receivables" 
                          ? "bg-orange-100/80 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold border-r-3 border-orange-500 shadow-md" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-orange-50/60 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-700/70 transition-colors duration-200">
                        <i className="fas fa-user text-sm"></i>
                      </div>
                      <span className="text-sm font-medium">المستحقات</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* قسم المشاريع - مخفي للمستخدمين مشاهدة فقط */}
              {user?.role !== 'viewer' && (
                <Link
                  href="/projects"
                  className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    location === "/projects" 
                      ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  }`}
                >
                  {/* خلفية متدرجة للعنصر النشط */}
                  {location === "/projects" && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                  )}
                  
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                    location === "/projects" 
                      ? "bg-white/20 text-white" 
                      : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    <i className="fas fa-project-diagram text-lg"></i>
                  </div>
                  <span className="text-base font-bold tracking-wide relative z-10">المشاريع</span>
                  
                  {/* تأثير التوهج للعنصر النشط */}
                  {location === "/projects" && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                  )}
                  
                  {/* تأثير hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
              
              <Link
                href="/documents"
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  location === "/documents" 
                    ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                }`}
              >
                {/* خلفية متدرجة للعنصر النشط */}
                {location === "/documents" && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                )}
                
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                  location === "/documents" 
                    ? "bg-white/20 text-white" 
                    : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                }`}>
                  <i className="fas fa-file-alt text-lg"></i>
                </div>
                <span className="text-base font-bold tracking-wide relative z-10">الوثائق</span>
                
                {/* تأثير التوهج للعنصر النشط */}
                {location === "/documents" && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                )}
                
                {/* تأثير hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link
                href="/archive"
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  location === "/archive" 
                    ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                }`}
              >
                {/* خلفية متدرجة للعنصر النشط */}
                {location === "/archive" && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                )}
                
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                  location === "/archive" 
                    ? "bg-white/20 text-white" 
                    : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                }`}>
                  <i className="fas fa-archive text-lg"></i>
                </div>
                <span className="text-base font-bold tracking-wide relative z-10">الأرشيف</span>
                
                {/* تأثير التوهج للعنصر النشط */}
                {location === "/archive" && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                )}
                
                {/* تأثير hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              {/* قسم الموظفين - مخصص للمدير فقط */}
              {user?.role === 'admin' && (
                <Link
                  href="/employees"
                  className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    location === "/employees" 
                      ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  }`}
                >
                  {/* خلفية متدرجة للعنصر النشط */}
                  {location === "/employees" && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                  )}
                  
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                    location === "/employees" 
                      ? "bg-white/20 text-white" 
                      : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    <i className="fas fa-users text-lg"></i>
                  </div>
                  <span className="text-base font-bold tracking-wide relative z-10">الموظفين</span>
                  
                  {/* تأثير التوهج للعنصر النشط */}
                  {location === "/employees" && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                  )}
                  
                  {/* تأثير hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}

              {/* قسم التقارير - مخصص للمدير فقط */}
              {user?.role === 'admin' && (
                <Link
                  href="/reports"
                  className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    location === "/reports" 
                      ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  }`}
                >
                  {/* خلفية متدرجة للعنصر النشط */}
                  {location === "/reports" && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                  )}
                  
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                    location === "/reports" 
                      ? "bg-white/20 text-white" 
                      : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    <i className="fas fa-chart-pie text-lg"></i>
                  </div>
                  <span className="text-base font-bold tracking-wide relative z-10">التقارير</span>
                  
                  {/* تأثير التوهج للعنصر النشط */}
                  {location === "/reports" && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                  )}
                  
                  {/* تأثير hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}

              {/* قسم الأعمال المنجزة - مخصص للمدير والمدراء فقط */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Link
                  href="/completed-works"
                  className={`flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl no-flicker touch-target relative group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                    location === "/completed-works" 
                      ? "bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white font-bold shadow-xl shadow-blue-500/25 border border-blue-400/30" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-100/80 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-lg border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                  }`}
                >
                  {/* خلفية متدرجة للعنصر النشط */}
                  {location === "/completed-works" && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 to-blue-600/20 opacity-50 blur-sm"></div>
                  )}
                  
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center no-flicker transition-all duration-300 ${
                    location === "/completed-works" 
                      ? "bg-white/20 text-white" 
                      : "group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    <i className="fas fa-tasks text-lg"></i>
                  </div>
                  <span className="text-base font-bold tracking-wide relative z-10">الأعمال المنجزة</span>
                  
                  {/* تأثير التوهج للعنصر النشط */}
                  {location === "/completed-works" && (
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/40 rounded-full"></div>
                  )}
                  
                  {/* تأثير hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
            </nav>
          </div>
          
          {/* المشاريع المتاحة للمستخدم العادي - User Projects Section */}
          {user && user.role !== "admin" && (
            <div className="mt-4 border border-blue-100 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm bg-blue-50/30 dark:bg-gray-700 slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="py-2.5 px-4 bg-gradient-to-l from-green-500/20 to-green-500/5 dark:from-green-500/30 dark:to-green-500/10 border-b border-blue-100 dark:border-gray-600">
                <h3 className="text-[hsl(var(--primary))] dark:text-white font-semibold text-sm sm:text-base">مشاريعي</h3>
              </div>
              <div className="p-2.5">
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="mr-2 text-sm text-[hsl(var(--muted-foreground))]">جاري التحميل...</span>
                  </div>
                ) : Array.isArray(userProjects) && userProjects.length > 0 ? (
                  <div className="space-y-2">
                    {userProjects.map((project: Project) => (
                      <div key={project.id} className="group relative">
                        <Link
                          href={`/projects/details/${project.id}`}
                          className={`flex items-center justify-between space-x-reverse space-x-2 p-2 rounded-lg ${
                            activeProjectId === project.id
                              ? "bg-blue-100 dark:bg-gray-600 text-[hsl(var(--primary))] font-medium"
                              : "text-[hsl(var(--primary))] hover:bg-blue-50 dark:hover:bg-gray-600"
                          } transition-colors`}
                        >
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-gray-600 flex items-center justify-center">
                              <i className={`fas fa-${activeProjectId === project.id ? 'folder-open' : 'folder'} text-sm`}></i>
                            </div>
                            <span className="text-sm truncate">{project.name}</span>
                          </div>
                          
                          {/* زر تعيين كمشروع نشط */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveProjectId(project.id);
                            }}
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              activeProjectId === project.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100"
                            } transition-opacity`}
                            title="تعيين كمشروع نشط"
                          >
                            <i className="fas fa-check text-[10px]"></i>
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 px-3 text-center">
                    <p className="text-[hsl(var(--muted-foreground))] text-sm">لا توجد مشاريع متاحة</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Administration section - قسم الإدارة */}
          {user?.role === "admin" && (
            <div className="mt-4 border border-blue-100 dark:border-gray-600 rounded-2xl overflow-hidden shadow-sm bg-blue-50/30 dark:bg-gray-700 slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="py-2.5 px-4 bg-gradient-to-l from-[hsl(var(--primary))/20] to-[hsl(var(--primary))/5] dark:from-[hsl(var(--primary))/30] dark:to-[hsl(var(--primary))/10] border-b border-blue-100 dark:border-gray-600">
                <h3 className="text-[hsl(var(--primary))] dark:text-white font-semibold text-sm sm:text-base">الإدارة</h3>
              </div>
              <nav className="p-2.5 space-y-1.5">
                <Link
                  href="/activities"
                  className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                    location === "/activities" 
                      ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                      : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                  } transition-all duration-200 transform`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/activities" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                    <i className="fas fa-history"></i>
                  </div>
                  <span className="text-sm sm:text-base">سجل النشاطات</span>
                </Link>
                
                <Link
                  href="/users"
                  className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                    location === "/users" 
                      ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                      : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                  } transition-all duration-200 transform`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/users" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                    <i className="fas fa-user-cog"></i>
                  </div>
                  <span className="text-sm sm:text-base">المستخدمين</span>
                </Link>
                
                {/* قسم الإعدادات القابل للطي */}
                <div className="space-y-1">
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full flex items-center justify-between space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                      ["/settings", "/database-management", "/hybrid-storage", "/file-migration", "/whatsapp-integration"].includes(location)
                        ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                        : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                    } transition-all duration-200 transform`}
                  >
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${["/settings", "/database-management", "/hybrid-storage", "/file-migration", "/whatsapp-integration"].includes(location) ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                        <i className="fas fa-tools"></i>
                      </div>
                      <span className="text-sm sm:text-base">الإعدادات</span>
                    </div>
                    <i className={`fas fa-chevron-${isSettingsOpen ? 'up' : 'down'} text-xs transition-transform duration-200`}></i>
                  </button>
                  
                  {/* القائمة الفرعية للإعدادات */}
                  <div className={`overflow-hidden transition-all duration-300 ${isSettingsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mr-4 space-y-1">
                      <Link
                        href="/settings"
                        className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg no-flicker touch-target ${
                          location === "/settings" 
                            ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-medium border-r-2 border-[hsl(var(--primary))]" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600"
                        } transition-all duration-200`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-gray-600">
                          <i className="fas fa-cog text-xs"></i>
                        </div>
                        <span className="text-sm">الإعدادات العامة</span>
                      </Link>
                      
                      <Link
                        href="/database-management"
                        className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg no-flicker touch-target ${
                          location === "/database-management" 
                            ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-medium border-r-2 border-[hsl(var(--primary))]" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600"
                        } transition-all duration-200`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 dark:bg-gray-600">
                          <i className="fas fa-database text-xs"></i>
                        </div>
                        <span className="text-sm">إدارة قواعد البيانات</span>
                      </Link>
                      
                      <Link
                        href="/hybrid-storage"
                        className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg no-flicker touch-target ${
                          location === "/hybrid-storage" 
                            ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-medium border-r-2 border-[hsl(var(--primary))]" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600"
                        } transition-all duration-200`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-100 dark:bg-gray-600">
                          <i className="fas fa-cloud text-xs"></i>
                        </div>
                        <span className="text-sm">التخزين الهجين</span>
                      </Link>
                      
                      <Link
                        href="/file-migration"
                        className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg no-flicker touch-target ${
                          location === "/file-migration" 
                            ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-medium border-r-2 border-[hsl(var(--primary))]" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600"
                        } transition-all duration-200`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-gray-600">
                          <i className="fas fa-cloud-upload-alt text-xs"></i>
                        </div>
                        <span className="text-sm">نقل الملفات</span>
                      </Link>
                      
                      <Link
                        href="/whatsapp-integration"
                        className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-lg no-flicker touch-target ${
                          location === "/whatsapp-integration" 
                            ? "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] font-medium border-r-2 border-[hsl(var(--primary))]" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600"
                        } transition-all duration-200`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 dark:bg-gray-600">
                          <i className="fab fa-whatsapp text-xs"></i>
                        </div>
                        <span className="text-sm">تكامل WhatsApp</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </nav>
            </div>
          )}
          
          {/* Logout button - زر تسجيل الخروج */}
          <div className="pt-4 mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-reverse space-x-3 px-4 py-3.5 rounded-2xl text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50/80 hover:to-red-100/80 dark:hover:from-red-900/30 dark:hover:to-red-800/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-right bg-gradient-to-br from-red-50/60 via-white/40 to-red-100/60 dark:from-red-900/20 dark:via-gray-800/40 dark:to-red-900/20 border border-red-200/40 dark:border-red-800/40 no-flicker touch-target relative group shadow-lg hover:shadow-xl transform"
            >
              {/* خلفية متدرجة عند hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/0 via-red-400/5 to-red-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center shadow-md no-flicker transition-all duration-300 group-hover:scale-110 border border-red-200/30 dark:border-red-700/30">
                <i className="fas fa-sign-out-alt text-lg text-red-600 dark:text-red-400"></i>
              </div>
              <span className="font-bold text-base tracking-wide relative z-10">تسجيل خروج</span>
              
              {/* تأثير الإضاءة الجانبية */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        
        {/* Footer with app version - تذييل مع إصدار التطبيق */}
        <div className="p-5 text-center bg-gradient-to-br from-blue-50/60 via-white/40 to-blue-100/60 dark:from-gray-900/60 dark:via-gray-800/40 dark:to-gray-900/60 border-t border-blue-200/30 dark:border-gray-700/30 relative overflow-hidden">
          {/* خلفية متحركة */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <i className="fas fa-shield-alt text-white text-sm"></i>
              </div>
              <span className="mr-2 text-sm font-bold text-blue-700 dark:text-blue-300">نظام Code-01</span>
            </div>
            
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
              الإصدار المطور 1.0.2
            </p>
            <p className="text-xs text-blue-500/60 dark:text-blue-400/60 mt-1.5 flex items-center justify-center">
              <i className="fas fa-copyright text-xs mr-1"></i>
              <span>2025 جميع الحقوق محفوظة</span>
            </p>
            
            {/* نقاط مضيئة صغيرة */}
            <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400/40 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 right-2 w-1 h-1 bg-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </aside>
    </>
  );
}
