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
      {/* زر القائمة المتنقلة - الآن على اليمين ليتناسب مع ظهور القائمة */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-50 bg-primary rounded-full w-12 h-12 flex items-center justify-center text-white shadow-lg hover:bg-primary-light transition-all focus:outline-none md:hidden"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>
      
      {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها في الهواتف */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-sidebar-background to-primary transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 flex-grow">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">نظام المحاسبة</h1>
            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          {user && (
            <div className="mb-6 bg-white bg-opacity-10 p-3 rounded-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
                <div>
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-xs text-white text-opacity-70">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</div>
                </div>
              </div>
            </div>
          )}
          
          <nav className="space-y-1">
            <Link
              href="/"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-home w-6 text-center"></i>
              <span>لوحة التحكم</span>
            </Link>
            <Link
              href="/transactions"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/transactions" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-money-bill-wave w-6 text-center"></i>
              <span>الحسابات</span>
            </Link>
            <Link
              href="/projects"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/projects" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-project-diagram w-6 text-center"></i>
              <span>المشاريع</span>
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/users"
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                  location === "/users" 
                    ? "bg-white bg-opacity-20 text-white" 
                    : "text-white hover:bg-white hover:bg-opacity-10"
                } transition-all`}
              >
                <i className="fas fa-users w-6 text-center"></i>
                <span>المستخدمين</span>
              </Link>
            )}
            <Link
              href="/documents"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/documents" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-file-alt w-6 text-center"></i>
              <span>المستندات</span>
            </Link>
            <Link
              href="/reports"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/reports" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-chart-bar w-6 text-center"></i>
              <span>التقارير</span>
            </Link>
            <Link
              href="/activities"
              className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                location === "/activities" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "text-white hover:bg-white hover:bg-opacity-10"
              } transition-all`}
            >
              <i className="fas fa-history w-6 text-center"></i>
              <span>سجل النشاطات</span>
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/settings"
                className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg ${
                  location === "/settings" 
                    ? "bg-white bg-opacity-20 text-white" 
                    : "text-white hover:bg-white hover:bg-opacity-10"
                } transition-all`}
              >
                <i className="fas fa-cog w-6 text-center"></i>
                <span>الإعدادات</span>
              </Link>
            )}
            <hr className="my-4 border-white border-opacity-20" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg text-white hover:bg-destructive transition-all text-right"
            >
              <i className="fas fa-sign-out-alt w-6 text-center"></i>
              <span>تسجيل خروج</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
