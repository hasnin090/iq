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
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
        {/* شريط ثابت في أعلى الصفحة للنسخة المكتبية */}
        <div className={`hidden md:flex justify-between items-center py-4 px-6 bg-white dark:bg-gray-800 shadow-sm mb-4 ${isScrolled ? 'shadow-md' : ''}`}>
          <h1 className="text-lg font-semibold text-[hsl(var(--primary))] dark:text-white">{getPageTitle()}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle 
              className="bg-blue-50 dark:bg-gray-700 rounded-lg w-9 h-9 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none transform hover:scale-105" 
              iconClassName="text-[hsl(var(--primary))] dark:text-white h-5 w-5"
            />
            <UserMenu />
          </div>
        </div>
        
        {/* شريط متحرك للأجهزة المحمولة */}
        {isMobile && (
          <div className={`fixed top-0 left-0 right-0 z-20 px-6 py-3 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))/10] dark:bg-[hsl(var(--primary))/20] flex items-center justify-center">
              <i className={`fas fa-${location === '/' ? 'home' : 
                            location === '/transactions' ? 'money-bill-wave' : 
                            location === '/projects' ? 'project-diagram' : 
                            location === '/documents' ? 'file-alt' : 
                            location === '/reports' ? 'chart-bar' : 
                            location === '/activities' ? 'history' : 
                            location === '/users' ? 'users' : 
                            location === '/settings' ? 'cog' : 'question'} 
                            text-[hsl(var(--primary))] dark:text-white`}></i>
            </div>
            <h1 className="text-lg font-semibold text-[hsl(var(--primary))] dark:text-white">{getPageTitle()}</h1>
            <UserMenu />
          </div>
        )}
        
        {/* حاشية في الأعلى لمنع تداخل المحتوى مع العناصر الثابتة */}
        <div className={`${isMobile ? 'h-20' : ''}`}></div>
        
        {/* المحتوى الرئيسي */}
        <div className="main-content-container fade-in px-4 sm:px-6 md:px-8 py-4 max-w-[1600px] mx-auto">
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
        
        {/* مساحة إضافية في الأسفل للهواتف المحمولة */}
        {isMobile && <div className="h-20"></div>}
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
