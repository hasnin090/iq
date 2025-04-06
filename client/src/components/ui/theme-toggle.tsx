import { useState, useEffect } from "react";
import { Moon, Sun, MoonStar } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // تحقق من السمة الحالية عند تحميل المكون
  useEffect(() => {
    // التحقق ما إذا كان المستخدم قد حدد موضوعاً مسبقاً في التخزين المحلي
    const storedTheme = localStorage.getItem("theme");
    
    // التحقق ما إذا كان المتصفح يفضل الوضع المظلم
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // تحديد السمة الافتراضية بناءً على تفضيلات المستخدم أو المتصفح
    const defaultTheme = storedTheme || (prefersDark ? "dark" : "light");
    
    // تطبيق السمة المحفوظة أو الافتراضية
    setTheme(defaultTheme as "light" | "dark");
    applyTheme(defaultTheme as "light" | "dark");
  }, []);

  // تطبيق السمة على الصفحة
  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    
    // إضافة أو إزالة صنف "dark" من عنصر <html>
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // حفظ السمة في التخزين المحلي
    localStorage.setItem("theme", newTheme);
  };

  // تبديل السمة بين الوضع المظلم والفاتح
  const toggleTheme = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newTheme = theme === "light" ? "dark" : "light";
    
    // تطبيق تأثير انتقالي جميل
    setTimeout(() => {
      setTheme(newTheme);
      applyTheme(newTheme);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 150);
  };

  // تحديد الألوان والتأثيرات حسب الوضع الحالي
  const buttonClasses = theme === "light" 
    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
    : "bg-indigo-900/30 hover:bg-indigo-900/40 dark:bg-indigo-950/50 dark:hover:bg-indigo-950/60";
    
  const iconClasses = theme === "light"
    ? "text-blue-600 dark:text-blue-400"
    : "text-indigo-300 dark:text-indigo-200";

  return (
    <button
      onClick={toggleTheme}
      className={`relative overflow-hidden rounded-full touch-target transition-all duration-300 transform hover:scale-105 active:scale-95 ${buttonClasses} ${className}`}
      aria-label={theme === "light" ? "تفعيل الوضع المظلم" : "تفعيل الوضع الفاتح"}
      disabled={isTransitioning}
    >
      {/* تأثير الموجة الدائرية عند النقر */}
      <span className="absolute inset-0 w-full h-full">
        <span className={`absolute inset-0 transform scale-0 rounded-full ${theme === 'light' ? 'bg-blue-200/30' : 'bg-indigo-300/30'} transition-transform duration-500 ease-out ${isTransitioning ? 'scale-[4]' : 'scale-0'}`}></span>
      </span>
      
      {/* الأيقونة مع تأثير دوران عند التغيير */}
      <span className={`inline-flex items-center justify-center transition-transform duration-300 ${isTransitioning ? 'rotate-180' : 'rotate-0'}`}>
        {theme === "light" ? (
          <Moon className={`${iconClassName} ${iconClasses}`} />
        ) : (
          <Sun className={`${iconClassName} ${iconClasses}`} />
        )}
      </span>
    </button>
  );
}