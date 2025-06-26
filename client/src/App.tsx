import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Projects from "@/pages/projects";
import Users from "@/pages/users";
import Employees from "@/pages/employees";
import Documents from "@/pages/documents";
import Archive from "@/pages/archive";
import Reports from "@/pages/reports";
import Activities from "@/pages/activities";
import Settings from "@/pages/settings";
import Ledger from "@/pages/ledger";
import Receivables from "@/pages/receivables";
import DatabaseManagement from "@/pages/database-management";
import HybridStorageManagement from "@/pages/hybrid-storage-management";
import SupabaseStatus from "@/pages/supabase-status";
import FileMigration from "@/pages/file-migration";
import DeferredPayments from './pages/deferred-payments';
import WhatsAppIntegration from './pages/whatsapp-integration';
import SystemManagement from './pages/system-management';

import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./context/auth-context";
import { Sidebar } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/ui/user-menu";
import { useEffect, useState } from "react";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // تحديد حجم الشاشة وتغييرات الواجهة
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // إضافة متغيرات CSS للاستجابة عبر كامل التطبيق
      document.documentElement.style.setProperty('--screen-width', `${width}px`);
      document.documentElement.style.setProperty('--is-mobile', width < 768 ? '1' : '0');
      document.documentElement.style.setProperty('--is-tablet', width >= 768 && width < 1024 ? '1' : '0');
      document.documentElement.style.setProperty('--is-desktop', width >= 1024 ? '1' : '0');
      
      // تعيين حجم الخط الأساسي استناداً إلى عرض الشاشة
      if (width < 400) {
        document.documentElement.style.fontSize = '14px';
      } else if (width < 768) {
        document.documentElement.style.fontSize = '15px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // مراقبة تمرير الصفحة
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // التأثير البصري لعنوان الصفحة
  const getPageTitle = () => {
    switch (location) {
      case '/': return 'لوحة التحكم';
      case '/transactions': return 'العمليات المالية';
      case '/projects': return 'المشاريع';
      case '/users': return 'المستخدمين';
      case '/documents': return 'المستندات';
      case '/archive': return 'الأرشيف';
      case '/reports': return 'التقارير';
      case '/activities': return 'سجل النشاطات';
      case '/settings': return 'الإعدادات';
      default: return 'الصفحة غير موجودة';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="*" component={() => <Login />} />
      </Switch>
    );
  }
  
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen transition-all duration-300 ml-0 md:mr-72 lg:mr-80 bg-[hsl(var(--background))] dark:bg-gray-900 dark:text-gray-100">
        {/* تم إزالة الأشرطة القديمة واستبدالها بشريط علوي مركزي في مكون Sidebar */}
        
        {/* حاشية في الأعلى لمنع تداخل المحتوى مع العناصر الثابتة */}
        <div className="h-16 xs:h-[4.5rem] sm:h-20"></div>
        
        {/* خلفية زخرفية متدرجة للمحتوى بأكمله */}
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50 via-muted/5 opacity-50 pointer-events-none z-0"></div>
        
        {/* المحتوى الرئيسي - تصميم أكثر احترافية */}
        <div className="main-content-container fade-in px-1 xs:px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 max-w-full sm:max-w-[95%] md:max-w-[92%] lg:max-w-[90%] xl:max-w-[1100px] 2xl:max-w-[1200px] mx-auto pb-mobile-nav w-full relative z-10">
          <div className="backdrop-blur-sm bg-background/70 dark:bg-background/60 rounded-xl border border-border/40 shadow-lg overflow-hidden">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/projects" component={Projects} />
              <Route path="/users" component={Users} />
              <Route path="/employees">
                {user?.role === 'admin' ? <Employees /> : <NotFound />}
              </Route>
              <Route path="/documents" component={Documents} />
              <Route path="/archive" component={Archive} />
              <Route path="/reports">
                {user?.role === 'admin' ? <Reports /> : <NotFound />}
              </Route>
              <Route path="/activities" component={Activities} />
              <Route path="/settings" component={Settings} />
              <Route path="/receivables" component={Receivables} />
              <Route path="/database-management">
                {user?.role === 'admin' ? <DatabaseManagement /> : <NotFound />}
              </Route>
              <Route path="/hybrid-storage">
                {user?.role === 'admin' ? <HybridStorageManagement /> : <NotFound />}
              </Route>
              <Route path="/supabase-status">
                {user?.role === 'admin' ? <SupabaseStatus /> : <NotFound />}
              </Route>
              <Route path="/file-migration">
                {user?.role === 'admin' ? <FileMigration /> : <NotFound />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </div>
        </div>
        
        {/* لم نعد بحاجة إلى مساحة إضافية هنا بسبب استخدام pb-mobile-nav */}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div dir="rtl" lang="ar" className="font-cairo">
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
