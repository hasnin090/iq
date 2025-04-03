import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // تشغيل الرسوم المتحركة بعد تحميل الصفحة
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 px-4 py-10 md:py-0">
      <div className={`relative transition-all duration-700 transform ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* رقم 404 كبير مع تأثير ظل */}
        <h1 className="text-8xl sm:text-9xl font-black text-[hsl(var(--primary))] opacity-10 text-center absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3 select-none">
          404
        </h1>
        
        {/* بطاقة بيضاء مع تأثير زجاجي */}
        <div className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-blue-100 w-full max-w-md z-10 relative mt-10">
          {/* أيقونة دائرية في الأعلى */}
          <div className="w-20 h-20 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center mx-auto -mt-16 shadow-lg border-4 border-white">
            <i className="fas fa-map-signs text-white text-2xl"></i>
          </div>
          
          {/* محتوى النص */}
          <div className="text-center mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h2>
            <p className="text-gray-600 mb-6">
              عذراً، الصفحة التي تبحث عنها غير متوفرة. ربما تم نقلها أو حذفها أو تغيير عنوانها.
            </p>
            
            {/* زر متحرك للعودة */}
            <Link href="/">
              <button className="button-primary py-2.5 px-6 rounded-xl text-base md:text-lg font-semibold btn-hover-effect inline-flex items-center group" onClick={() => {}}>
                <i className="fas fa-home me-2 group-hover:animate-bounce"></i>
                العودة للصفحة الرئيسية
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* عناصر زخرفية */}
      <div className="absolute top-1/4 right-8 w-20 h-20 bg-blue-500/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 left-8 w-32 h-32 bg-blue-500/5 rounded-full blur-xl"></div>
      
      {/* أيقونات زخرفية متناثرة (تظهر فقط في الشاشات المتوسطة والكبيرة) */}
      <div className="hidden md:block">
        <div className={`absolute top-1/3 right-1/4 text-blue-200 transition-all duration-1000 transform ${isAnimated ? 'translate-y-0 opacity-50' : 'translate-y-6 opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <i className="fas fa-server text-3xl"></i>
        </div>
        <div className={`absolute bottom-1/3 left-1/4 text-blue-200 transition-all duration-1000 transform ${isAnimated ? 'translate-y-0 opacity-50' : 'translate-y-6 opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <i className="fas fa-database text-4xl"></i>
        </div>
        <div className={`absolute top-1/2 left-1/5 text-blue-200 transition-all duration-1000 transform ${isAnimated ? 'translate-y-0 opacity-50' : 'translate-y-6 opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <i className="fas fa-link text-2xl"></i>
        </div>
      </div>
    </div>
  );
}
