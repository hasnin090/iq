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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 bg-primary rounded-full w-12 h-12 flex items-center justify-center text-white shadow-lg hover:bg-primary-light transition-all focus:outline-none md:hidden"
      >
        <i className={`fa ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-gradient-to-b from-sidebar-background to-primary transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-8">نظام المحاسبة</h1>
          <nav className="space-y-2">
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
