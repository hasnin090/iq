/**
 * ملف يحتوي على وظائف مساعدة لإدارة السمة (الوضع الداكن/الفاتح)
 */

/**
 * تهيئة السمة بناءً على تفضيلات المستخدم المحفوظة أو إعدادات النظام
 * يتم استدعاء هذه الوظيفة في بداية تحميل التطبيق
 */
export function initializeTheme(): void {
  // التحقق من وجود تفضيل محفوظ في localStorage
  const storedTheme = localStorage.getItem('theme');
  
  // الحصول على تفضيل النظام (داكن أم فاتح)
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // تحديد السمة المناسبة
  const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  // تطبيق السمة (مع التحقق من نوع القيمة)
  applyTheme(theme as 'dark' | 'light');
  
  // إضافة مستمع لتغييرات تفضيلات النظام
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // إذا لم يكن هناك تفضيل محفوظ، قم بتحديث السمة تلقائيًا
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * تطبيق السمة المحددة (داكن أو فاتح)
 * @param theme السمة المراد تطبيقها ('dark' أو 'light')
 */
export function applyTheme(theme: 'dark' | 'light'): void {
  // تحديث فئة html
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // حفظ التفضيل في localStorage
  localStorage.setItem('theme', theme);
}

/**
 * تبديل السمة الحالية (من داكن إلى فاتح أو العكس)
 * @returns السمة الجديدة بعد التبديل
 */
export function toggleTheme(): 'dark' | 'light' {
  // الحصول على السمة الحالية
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  
  // تبديل السمة
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // تطبيق السمة الجديدة
  applyTheme(newTheme);
  
  // إرجاع السمة الجديدة
  return newTheme;
}

/**
 * الحصول على السمة الحالية المطبقة
 * @returns السمة الحالية ('dark' أو 'light')
 */
export function getCurrentTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}