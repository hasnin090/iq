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
import { useEffect, useState } from "react";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // تحديد حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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
      <main className="flex-1 min-h-screen transition-all duration-300 ml-0 md:mr-72 bg-[hsl(var(--background))]">
        {/* شريط ثابت في أعلى الصفحة يعرض عنوان الصفحة الحالية */}
        {isMobile && (
          <div className={`fixed top-0 left-0 right-0 z-20 px-6 py-3 flex items-center justify-center bg-white shadow-sm transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
            <h1 className="text-lg font-semibold text-[hsl(var(--primary))] mr-20">{getPageTitle()}</h1>
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))/10] flex items-center justify-center absolute left-4">
              <i className={`fas fa-${location === '/' ? 'home' : 
                            location === '/transactions' ? 'money-bill-wave' : 
                            location === '/projects' ? 'project-diagram' : 
                            location === '/documents' ? 'file-alt' : 
                            location === '/reports' ? 'chart-bar' : 
                            location === '/activities' ? 'history' : 
                            location === '/users' ? 'users' : 
                            location === '/settings' ? 'cog' : 'question'} 
                            text-[hsl(var(--primary))]`}></i>
            </div>
          </div>
        )}
        
        {/* حاشية في الأعلى لمنع تداخل المحتوى مع العناصر الثابتة */}
        <div className={`${isMobile ? 'h-20' : 'h-6'}`}></div>
        
        {/* المحتوى الرئيسي */}
        <div className="main-content-container fade-in">
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
