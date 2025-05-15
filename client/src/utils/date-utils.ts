// مكتبة أدوات التعامل مع التواريخ
import { format, formatDistance, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

/**
 * تنسيق التاريخ بالشكل المطلوب
 * استخدام التقويم الميلادي بدلاً من الهجري
 * @param dateString التاريخ كسلسلة نصية
 * @param formatStr نمط التنسيق
 * @param useGregorian استخدام التقويم الميلادي (true) أو الهجري (false)
 * @returns التاريخ بعد التنسيق
 */
export const formatDate = (
  dateString: string, 
  formatStr: string = 'yyyy/MM/dd',
  useGregorian: boolean = true
) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  // استخدم اللغة الإنجليزية للتقويم الميلادي، والعربية للتقويم الهجري
  const locale = useGregorian ? enUS : ar;
  return format(date, formatStr, { locale });
};

/**
 * تنسيق التاريخ مع الوقت
 * @param dateString التاريخ كسلسلة نصية
 * @param useGregorian استخدام التقويم الميلادي (true) أو الهجري (false)
 * @returns التاريخ والوقت بعد التنسيق
 */
export const formatDateTime = (dateString: string, useGregorian: boolean = true) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const locale = useGregorian ? enUS : ar;
  return format(date, 'yyyy/MM/dd HH:mm', { locale });
};

/**
 * الحصول على تاريخ نسبي (منذ ...)
 * @param dateString التاريخ كسلسلة نصية
 * @returns المدة النسبية منذ التاريخ
 */
export const getRelativeTime = (dateString: string) => {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: ar
  });
};

/**
 * تحويل التاريخ إلى كائن Date
 * @param dateString التاريخ كسلسلة نصية
 * @returns كائن تاريخ
 */
export const parseDate = (dateString: string) => {
  return parseISO(dateString);
};