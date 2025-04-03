import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`touch-target transition-all duration-300 transform hover:scale-105 active:scale-95 ${className}`}
      aria-label={theme === "light" ? "تفعيل الوضع المظلم" : "تفعيل الوضع الفاتح"}
    >
      {theme === "light" ? (
        <Moon className={`${iconClassName}`} />
      ) : (
        <Sun className={`${iconClassName}`} />
      )}
    </button>
  );
}