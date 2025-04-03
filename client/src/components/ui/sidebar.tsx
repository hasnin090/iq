import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

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

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
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

      {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها في الهواتف */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* زر ثابت لفتح القائمة الجانبية */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 z-50 bg-[hsl(var(--primary))] rounded-lg w-8 h-8 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none md:hidden transform hover:scale-105 active:scale-95 touch-target ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        <div className="w-4 h-3 flex flex-col justify-between">
          <span className="h-0.5 w-full bg-white rounded-full"></span>
          <span className="h-0.5 w-full bg-white rounded-full"></span>
          <span className="h-0.5 w-full bg-white rounded-full"></span>
        </div>
      </button>
      
      {/* زر ثابت لتبديل الوضع المظلم/الفاتح في الهاتف */}
      <div className={`fixed top-4 right-14 z-50 md:hidden ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <ThemeToggle 
          className="bg-[hsl(var(--primary))] rounded-lg w-8 h-8 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none transform hover:scale-105 active:scale-95 touch-target"
          iconClassName="h-4 w-4 text-white"
        />
      </div>

      {/* شريط تنقل متحرك للهاتف */}
      {isMobile && !isOpen && (
        <div className="mobile-navbar">
          <Link href="/" className={`mobile-nav-item ${location === "/" ? "active" : ""}`}>
            <i className="fas fa-home mobile-nav-icon"></i>
            <span>الرئيسية</span>
          </Link>
          <Link href="/transactions" className={`mobile-nav-item ${location === "/transactions" ? "active" : ""}`}>
            <i className="fas fa-money-bill-wave mobile-nav-icon"></i>
            <span>الحسابات</span>
          </Link>
          <Link href="/projects" className={`mobile-nav-item ${location === "/projects" ? "active" : ""}`}>
            <i className="fas fa-project-diagram mobile-nav-icon"></i>
            <span>المشاريع</span>
          </Link>
          <Link href="/documents" className={`mobile-nav-item ${location === "/documents" ? "active" : ""}`}>
            <i className="fas fa-file-alt mobile-nav-icon"></i>
            <span>المستندات</span>
          </Link>
          {user?.role === "admin" && (
            <Link href="/settings" className={`mobile-nav-item ${location === "/settings" ? "active" : ""}`}>
              <i className="fas fa-cog mobile-nav-icon"></i>
              <span>الإدارة</span>
            </Link>
          )}
        </div>
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-[85%] sm:w-80 md:w-72 bg-white dark:bg-gray-800 border-l border-blue-100 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 flex flex-col`}
        style={{
          borderTopLeftRadius: isMobile ? '16px' : '0',
          borderBottomLeftRadius: isMobile ? '16px' : '0',
        }}
      >
        <div className="p-5 md:p-6 flex-grow">
          {/* Header with app logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-md">
                <i className="fas fa-calculator text-xl text-white"></i>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">نظام المحاسبة</h1>
            </div>
            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))/80] w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transform transition-transform hover:scale-110 active:scale-95 shadow touch-target"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          {/* User profile card */}
          {user && (
            <div className="mb-6 bg-blue-50 dark:bg-gray-700 p-4 rounded-2xl border border-blue-100 dark:border-gray-600 shadow-md relative overflow-hidden zoom-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--primary))/5] to-transparent dark:from-[hsl(var(--primary))/10] dark:to-transparent"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-md">
                  <i className="fas fa-user text-lg sm:text-xl text-white"></i>
                </div>
                <div>
                  <div className="text-[hsl(var(--primary))] dark:text-white font-medium text-base sm:text-lg">{user.name}</div>
                  <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] dark:text-gray-300 mt-1 flex items-center">
                    <i className="fas fa-circle text-[6px] mr-2 text-[hsl(var(--primary))]"></i>
                    <span>{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</span>
                  </div>
                </div>
              </div>
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
                className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                  location === "/" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600 hover:scale-102"
                } transition-all duration-200 transform`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/" ? "bg-white/20 text-white" : "bg-blue-100 dark:bg-gray-600"}`}>
                  <i className="fas fa-home"></i>
                </div>
                <span className="text-sm sm:text-base">لوحة التحكم</span>
              </Link>
              
              <Link
                href="/transactions"
                className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                  location === "/transactions" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                } transition-all duration-200 transform`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/transactions" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <span className="text-sm sm:text-base">الحسابات</span>
              </Link>
              
              <Link
                href="/projects"
                className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                  location === "/projects" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                } transition-all duration-200 transform`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/projects" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-project-diagram"></i>
                </div>
                <span className="text-sm sm:text-base">المشاريع</span>
              </Link>
              
              <Link
                href="/documents"
                className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                  location === "/documents" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                } transition-all duration-200 transform`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/documents" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-file-alt"></i>
                </div>
                <span className="text-sm sm:text-base">المستندات</span>
              </Link>
              
              <Link
                href="/reports"
                className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                  location === "/reports" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                } transition-all duration-200 transform`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/reports" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-chart-bar"></i>
                </div>
                <span className="text-sm sm:text-base">التقارير</span>
              </Link>
            </nav>
          </div>
          
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
                    <i className="fas fa-users"></i>
                  </div>
                  <span className="text-sm sm:text-base">المستخدمين</span>
                </Link>
                
                <Link
                  href="/settings"
                  className={`flex items-center space-x-reverse space-x-3 px-3 py-2.5 rounded-xl no-flicker touch-target ${
                    location === "/settings" 
                      ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                      : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-102"
                  } transition-all duration-200 transform`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center no-flicker ${location === "/settings" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                    <i className="fas fa-cog"></i>
                  </div>
                  <span className="text-sm sm:text-base">الإعدادات</span>
                </Link>
              </nav>
            </div>
          )}
          
          {/* Logout button - زر تسجيل الخروج */}
          <div className="pt-4 mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-xl text-[hsl(var(--destructive))] dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-102 transition-all duration-200 text-right bg-red-50/30 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 no-flicker touch-target"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-sm no-flicker">
                <i className="fas fa-sign-out-alt text-lg text-red-500 dark:text-red-300"></i>
              </div>
              <span className="font-medium text-sm sm:text-base">تسجيل خروج</span>
            </button>
          </div>
        </div>
        
        {/* Dark mode toggle button - زر تبديل الوضع المظلم/الفاتح */}
        <div className="px-5 py-3 mb-1 flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center shadow-sm">
              <i className="fas fa-palette text-[hsl(var(--primary))] dark:text-white"></i>
            </div>
            <span className="text-sm text-[hsl(var(--primary))] dark:text-white font-medium">وضع الألوان</span>
          </div>
          <ThemeToggle 
            className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm hover:shadow hover:bg-blue-100 dark:bg-gray-700 dark:border-gray-600"
            iconClassName="h-5 w-5 text-[hsl(var(--primary))] dark:text-white"
          />
        </div>
          
        {/* Footer with app version - تذييل مع إصدار التطبيق */}
        <div className="p-4 text-center text-xs text-gray-500 border-t border-blue-100 dark:border-gray-700 dark:text-gray-400">
          <p>نظام Code-01 - الإصدار 1.0.2</p>
          <p className="mt-1">© 2025 جميع الحقوق محفوظة</p>
        </div>
      </aside>
    </>
  );
}
