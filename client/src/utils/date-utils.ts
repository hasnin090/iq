// مكتبة أدوات التعامل مع التواريخ
import { format, formatDistance, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

/**
 * تنسيق التاريخ بالشكل المطلوب - التقويم الميلادي فقط
 * @param dateString التاريخ كسلسلة نصية
 * @param formatStr نمط التنسيق
 * @returns التاريخ بعد التنسيق بالتقويم الميلادي
 */
export const formatDate = (
  dateString: string, 
  formatStr: string = 'dd/MM/yyyy'
) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  // استخدام التقويم الميلادي مع الأرقام العربية
  return date.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * تنسيق التاريخ مع الوقت - التقويم الميلادي فقط
 * @param dateString التاريخ كسلسلة نصية
 * @returns التاريخ والوقت بعد التنسيق بالتقويم الميلادي
 */
export const formatDateTime = (dateString: string) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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