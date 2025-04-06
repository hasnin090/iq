import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AppHeaderProps {
  onOpenSidebar: () => void;
}

export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState(0);

  // تحديث التاريخ الحالي
  useEffect(() => {
    setCurrentDate(format(new Date(), "eeee، d MMMM yyyy", { locale: ar }));
  }, []);

  // مراقبة موضع التمرير لإضافة تأثير العتامة
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // حساب عتامة الشريط العلوي أثناء التمرير
  const headerOpacity = Math.min(0.9, Math.max(0.6, scrollPosition / 200));
  const headerBlur = Math.min(8, scrollPosition / 30);
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 transition-all duration-300`}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`,
        backdropFilter: `blur(${headerBlur}px)`,
        boxShadow: scrollPosition > 20 ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      {/* زر فتح القائمة الجانبية */}
      <div className="flex items-center">
        <button
          onClick={onOpenSidebar}
          className="relative mr-2 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 transform transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow touch-target"
          aria-label="فتح القائمة"
        >
          <i className="fas fa-stream text-lg"></i>
          
          {/* طبقة تأثير الموجة عند النقر */}
          <span className="absolute inset-0 rounded-full bg-blue-200/30 dark:bg-blue-400/20 transform scale-0 transition-transform duration-500 ease-out hover:scale-[1.2] group-hover:scale-[1.2]"></span>
        </button>
      </div>
      
      {/* التاريخ ومعلومات المستخدم للشاشات المتوسطة والكبيرة فقط */}
      <div className="hidden md:flex flex-col items-center">
        <div className="text-base font-semibold text-blue-600 dark:text-blue-300">
          <i className="fas fa-calendar-day ml-1.5"></i>
          <span>{currentDate}</span>
        </div>
      </div>
      
      {/* تبديل الوضع المظلم وصورة المستخدم */}
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* التاريخ للشاشات الصغيرة فقط */}
        <div className="md:hidden text-xs font-semibold text-blue-600 dark:text-blue-300">
          <span>{format(new Date(), "d MMMM", { locale: ar })}</span>
        </div>
        
        {/* اسم المستخدم للشاشات المتوسطة والكبيرة فقط */}
        {user && (
          <div className="hidden md:flex items-center ml-4">
            <div className="mr-3 text-right">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.role === "admin" ? "مدير النظام" : user.role === "manager" ? "مدير" : "مستخدم"}
              </div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-user-circle text-sm"></i>
            </div>
          </div>
        )}
        
        {/* زر تبديل الوضع المظلم/الفاتح */}
        <ThemeToggle 
          className="w-9 h-9 p-2"
          iconClassName="h-4 w-4"
        />
      </div>
    </header>
  );
}