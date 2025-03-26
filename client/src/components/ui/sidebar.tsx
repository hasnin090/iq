import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Close sidebar on route change on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location]);

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

  return (
    <>
      {/* زر القائمة المتنقلة - تم تحسينه لتجنب الإعاقة البصرية مع إضافة ثلاثة خطوط داخله */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-4 z-50 bg-[hsl(var(--primary))] rounded-lg w-12 h-10 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none md:hidden transform hover:scale-105 active:scale-95 opacity-90 hover:opacity-100"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {isOpen ? (
          <i className="fas fa-times text-lg"></i>
        ) : (
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className="h-0.5 w-full bg-white rounded-full"></span>
            <span className="h-0.5 w-full bg-white rounded-full"></span>
            <span className="h-0.5 w-full bg-white rounded-full"></span>
          </div>
        )}
      </button>
      
      {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها في الهواتف */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white border-l border-blue-100 transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto shadow-xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 flex-grow">
          {/* Header with app logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-md">
                <i className="fas fa-calculator text-xl text-white"></i>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">نظام المحاسبة</h1>
            </div>
            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))/80] w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center transform transition-transform hover:scale-110 active:scale-95 shadow"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          {/* User profile card */}
          {user && (
            <div className="mb-6 bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--primary))/5] to-transparent"></div>
              <div className="flex items-center space-x-4 space-x-reverse relative z-10">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shadow-md">
                  <i className="fas fa-user text-xl text-white"></i>
                </div>
                <div>
                  <div className="text-[hsl(var(--primary))] font-medium text-lg">{user.name}</div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1 flex items-center">
                    <i className="fas fa-circle text-[6px] mr-2 text-[hsl(var(--primary))]"></i>
                    <span>{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Main menu section */}
          <div className="mt-8 border border-blue-100 rounded-2xl overflow-hidden shadow-sm bg-blue-50/30">
            <div className="py-3 px-4 bg-gradient-to-l from-[hsl(var(--primary))/20] to-[hsl(var(--primary))/5] border-b border-blue-100">
              <h3 className="text-[hsl(var(--primary))] font-semibold">القائمة الرئيسية</h3>
            </div>
            <nav className="p-3 space-y-2">
              <Link
                href="/"
                className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                  location === "/" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200 transform`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-home"></i>
                </div>
                <span>لوحة التحكم</span>
              </Link>
              
              <Link
                href="/transactions"
                className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                  location === "/transactions" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200 transform`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/transactions" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <span>الحسابات</span>
              </Link>
              
              <Link
                href="/projects"
                className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                  location === "/projects" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200 transform`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/projects" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-project-diagram"></i>
                </div>
                <span>المشاريع</span>
              </Link>
              
              <Link
                href="/documents"
                className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                  location === "/documents" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200 transform`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/documents" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-file-alt"></i>
                </div>
                <span>المستندات</span>
              </Link>
              
              <Link
                href="/reports"
                className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                  location === "/reports" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200 transform`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/reports" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-chart-bar"></i>
                </div>
                <span>التقارير</span>
              </Link>
            </nav>
          </div>
          
          {/* Administration section */}
          <div className="mt-4 border border-blue-100 rounded-2xl overflow-hidden shadow-sm bg-blue-50/30">
            <div className="py-3 px-4 bg-gradient-to-l from-[hsl(var(--primary))/20] to-[hsl(var(--primary))/5] border-b border-blue-100">
              <h3 className="text-[hsl(var(--primary))] font-semibold">الإدارة</h3>
            </div>
            <nav className="p-3 space-y-2">
              {user?.role === "admin" && (
                <>
                  <Link
                    href="/activities"
                    className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                      location === "/activities" 
                        ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                        : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                    } transition-all duration-200 transform`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/activities" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                      <i className="fas fa-history"></i>
                    </div>
                    <span>سجل النشاطات</span>
                  </Link>
                  
                  <Link
                    href="/users"
                    className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                      location === "/users" 
                        ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                        : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                    } transition-all duration-200 transform`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/users" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                      <i className="fas fa-users"></i>
                    </div>
                    <span>المستخدمين</span>
                  </Link>
                  
                  <Link
                    href="/settings"
                    className={`flex items-center space-x-reverse space-x-4 px-4 py-3 rounded-xl no-flicker ${
                      location === "/settings" 
                        ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                        : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                    } transition-all duration-200 transform`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center no-flicker ${location === "/settings" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                      <i className="fas fa-cog"></i>
                    </div>
                    <span>الإعدادات</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          {/* Logout button */}
          <div className="pt-6 mt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl text-[hsl(var(--destructive))] hover:bg-red-100 hover:scale-105 transition-all duration-200 text-right bg-red-50/30 border border-red-100 no-flicker"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shadow-sm no-flicker">
                <i className="fas fa-sign-out-alt text-lg"></i>
              </div>
              <span className="font-medium">تسجيل خروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
