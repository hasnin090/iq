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
import Documents from "@/pages/documents";
import Reports from "@/pages/reports";
import Activities from "@/pages/activities";
import Settings from "@/pages/settings";

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
      <main className="flex-1 min-h-screen transition-all duration-300 ml-0 md:mr-72 bg-[hsl(var(--background))] dark:bg-gray-900 dark:text-gray-100">
        {/* تم إزالة الأشرطة القديمة واستبدالها بشريط علوي مركزي في مكون Sidebar */}
        
        {/* حاشية في الأعلى لمنع تداخل المحتوى مع العناصر الثابتة */}
        <div className={`${isMobile ? 'h-20' : 'h-20'}`}></div>
        
        {/* المحتوى الرئيسي - تم تصغيره أكثر وتحسينه للعرض العمودي في الشاشات الصغيرة */}
        <div className="main-content-container fade-in px-2 sm:px-3 md:px-4 lg:px-5 py-2 max-w-[1100px] mx-auto pb-mobile-nav w-full">
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden flex flex-col">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/projects" component={Projects} />
              <Route path="/users" component={Users} />
              <Route path="/documents" component={Documents} />
              <Route path="/reports" component={Reports} />
              <Route path="/activities" component={Activities} />
              <Route path="/settings" component={Settings} />
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
