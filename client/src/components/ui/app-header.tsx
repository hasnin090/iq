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
  
  // التحقق من الوضع المظلم
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 xs:px-4 md:px-6 py-2 xs:py-3 md:py-4 transition-all duration-300 dark:border-b dark:border-gray-700/50`}
      style={{
        backdropFilter: `blur(${headerBlur}px)`,
        boxShadow: isDarkMode
          ? scrollPosition > 20 ? "0 2px 10px rgba(0, 0, 0, 0.2)" : "none"
          : scrollPosition > 20 ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none",
        background: isDarkMode
          ? `linear-gradient(180deg, rgba(17, 24, 39, ${Math.min(0.98, headerOpacity + 0.1)}) 0%, rgba(31, 41, 55, ${Math.min(0.95, headerOpacity)}) 100%)`
          : `linear-gradient(180deg, rgba(255, 255, 255, ${headerOpacity}) 0%, rgba(248, 250, 252, ${headerOpacity - 0.05}) 100%)`,
      }}
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* زر فتح القائمة الجانبية - ثابت الموضع */}
      <div className="flex items-center">
        <button
          onClick={onOpenSidebar}
          className="sidebar-toggle-button relative mr-2 w-10 h-10 rounded-full bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/40 dark:to-gray-800/50 flex items-center justify-center text-blue-600 dark:text-blue-300 transform transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md border border-blue-100/50 dark:border-blue-800/30 touch-target group overflow-hidden"
          aria-label="فتح القائمة"
        >
          <i className="fas fa-stream text-lg relative z-10"></i>
          
          {/* طبقة تأثير الموجة عند النقر */}
          <span className="absolute inset-0 rounded-full bg-blue-200/30 dark:bg-blue-400/20 transform scale-0 transition-transform duration-500 ease-out group-hover:scale-[1.2]"></span>
          <span className="absolute -inset-2 bg-gradient-to-r from-blue-600/0 via-blue-600/30 to-blue-600/0 dark:from-blue-400/0 dark:via-blue-400/20 dark:to-blue-400/0 opacity-0 group-hover:opacity-100 animate-shimmer"></span>
        </button>
      </div>
      
      {/* التاريخ ومعلومات المستخدم للشاشات المتوسطة والكبيرة فقط */}
      <div className="hidden md:flex flex-col items-center">
        <div className="text-base font-semibold text-blue-600 dark:text-blue-300 transition-colors duration-300">
          <i className="fas fa-calendar-day ml-1.5"></i>
          <span>{currentDate}</span>
        </div>
      </div>
      
      {/* تبديل الوضع المظلم وصورة المستخدم */}
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* التاريخ للشاشات الصغيرة فقط */}
        <div className="md:hidden text-xs xs:text-sm font-semibold text-blue-600 dark:text-blue-300 transition-colors duration-300">
          <span className="hidden xs:inline">{format(new Date(), "d MMMM", { locale: ar })}</span>
          <span className="xs:hidden">{format(new Date(), "d MMM", { locale: ar })}</span>
        </div>
        
        {/* اسم المستخدم للشاشات المتوسطة والكبيرة فقط */}
        {user && (
          <div className="hidden md:flex items-center ml-4">
            <div className="mr-3 text-right">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors duration-300">{user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                <span>{user.role === "admin" ? "مدير النظام" : user.role === "manager" ? "مدير" : "مستخدم"}</span>
              </div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center text-white shadow-sm group relative overflow-hidden">
              <i className="fas fa-user-circle text-sm relative z-10"></i>
              <span className="absolute -inset-1 bg-gradient-to-r from-blue-600/0 via-blue-600/30 to-blue-600/0 dark:from-blue-400/0 dark:via-blue-400/20 dark:to-blue-400/0 opacity-0 group-hover:opacity-100 animate-shimmer"></span>
            </div>
          </div>
        )}
        
        {/* زر تبديل الوضع المظلم/الفاتح */}
        <ThemeToggle 
          className="w-9 h-9 p-2 relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/40 dark:to-gray-800/50 border border-blue-100/50 dark:border-blue-800/30 shadow-sm hover:shadow-md"
          iconClassName="h-4 w-4"
        />
      </div>
    </header>
  );
}