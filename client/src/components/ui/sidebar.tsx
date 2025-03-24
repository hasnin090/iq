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
      {/* زر القائمة المتنقلة - مع تحسين التصميم */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-50 bg-white rounded-full w-14 h-14 flex items-center justify-center text-[hsl(var(--primary))] shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 focus:outline-none md:hidden transform hover:scale-105 active:scale-95 border border-blue-100"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
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
          
          <nav className="space-y-3 mt-8">
            <Link
              href="/"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-home"></i>
              </div>
              <span>لوحة التحكم</span>
            </Link>
            
            <Link
              href="/transactions"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/transactions" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/transactions" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <span>الحسابات</span>
            </Link>
            
            <Link
              href="/projects"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/projects" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/projects" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-project-diagram"></i>
              </div>
              <span>المشاريع</span>
            </Link>
            
            {user?.role === "admin" && (
              <Link
                href="/users"
                className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                  location === "/users" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/users" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-users"></i>
                </div>
                <span>المستخدمين</span>
              </Link>
            )}
            
            <Link
              href="/documents"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/documents" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/documents" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-file-alt"></i>
              </div>
              <span>المستندات</span>
            </Link>
            
            <Link
              href="/reports"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/reports" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/reports" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-chart-bar"></i>
              </div>
              <span>التقارير</span>
            </Link>
            
            <Link
              href="/activities"
              className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                location === "/activities" 
                  ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                  : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
              } transition-all duration-200`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/activities" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                <i className="fas fa-history"></i>
              </div>
              <span>سجل النشاطات</span>
            </Link>
            
            {user?.role === "admin" && (
              <Link
                href="/settings"
                className={`flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl ${
                  location === "/settings" 
                    ? "bg-[hsl(var(--primary))] text-white font-semibold shadow-md" 
                    : "text-[hsl(var(--primary))] hover:bg-blue-50 hover:scale-105"
                } transition-all duration-200`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${location === "/settings" ? "bg-white/20 text-white" : "bg-blue-100"}`}>
                  <i className="fas fa-cog"></i>
                </div>
                <span>الإعدادات</span>
              </Link>
            )}
            
            <div className="pt-6 mt-8 border-t border-blue-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-reverse space-x-4 px-5 py-3.5 rounded-xl text-[hsl(var(--destructive))] hover:bg-red-50 hover:scale-105 transition-all duration-200 text-right"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shadow-sm">
                  <i className="fas fa-sign-out-alt text-lg"></i>
                </div>
                <span className="font-medium">تسجيل خروج</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
