import { memo, useMemo } from 'react';
import { useDatabaseStatus } from '@/hooks/use-database-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const DatabaseStatus = memo(() => {
  const { status, isLoading, refresh } = useDatabaseStatus();

  const statusInfo = useMemo(() => {
    if (isLoading) {
      return {
        color: 'text-yellow-500 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: 'fas fa-spinner fa-spin',
        text: 'جاري التحقق...',
        tooltip: 'جاري فحص حالة الاتصال بقاعدة البيانات'
      };
    }

    if (status.isConnected) {
      const responseTime = status.responseTime || 0;
      let responseColor = 'text-green-500 dark:text-green-400';
      let responseText = 'ممتاز';
      
      if (responseTime > 1000) {
        responseColor = 'text-orange-500 dark:text-orange-400';
        responseText = 'بطيء';
      } else if (responseTime > 500) {
        responseColor = 'text-yellow-500 dark:text-yellow-400';
        responseText = 'متوسط';
      }

      return {
        color: responseColor,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: 'fas fa-database',
        text: 'متصل',
        tooltip: `قاعدة البيانات متصلة - الاستجابة: ${responseTime}ms (${responseText})\nآخر فحص: ${status.lastChecked?.toLocaleTimeString('ar-SA', { hour12: false })}`
      };
    }

    return {
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: 'fas fa-exclamation-triangle',
      text: 'منقطع',
      tooltip: `فشل الاتصال بقاعدة البيانات\nالخطأ: ${status.error || 'خطأ غير معروف'}\nآخر محاولة: ${status.lastChecked?.toLocaleTimeString('ar-SA', { hour12: false })}`
    };
  }, [status, isLoading]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={refresh}
            className={`flex items-center space-x-2 space-x-reverse px-2 py-1 rounded-md transition-all duration-300 hover:scale-105 active:scale-95 ${statusInfo.bgColor} ${statusInfo.color} border border-current/20 shadow-sm hover:shadow-md`}
            aria-label="حالة قاعدة البيانات"
          >
            <i className={`${statusInfo.icon} text-xs`}></i>
            <span className="text-xs font-medium hidden sm:inline">
              {statusInfo.text}
            </span>
            {status.responseTime && status.isConnected && (
              <span className="text-xs opacity-75 hidden md:inline">
                ({status.responseTime}ms)
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs text-center whitespace-pre-line"
        >
          {statusInfo.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

DatabaseStatus.displayName = 'DatabaseStatus';