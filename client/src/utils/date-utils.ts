// مكتبة أدوات التعامل مع التواريخ
import { format, formatDistance, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * تنسيق التاريخ بالشكل المطلوب
 * @param dateString التاريخ كسلسلة نصية
 * @param formatStr نمط التنسيق
 * @returns التاريخ بعد التنسيق
 */
export const formatDate = (dateString: string, formatStr: string = 'yyyy/MM/dd') => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, formatStr, { locale: ar });
};

/**
 * تنسيق التاريخ مع الوقت
 * @param dateString التاريخ كسلسلة نصية
 * @returns التاريخ والوقت بعد التنسيق
 */
export const formatDateTime = (dateString: string) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, 'yyyy/MM/dd HH:mm', { locale: ar });
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