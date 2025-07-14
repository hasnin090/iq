import { memo, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabaseApi } from '@/lib/supabase-api';

interface DatabaseStatusState {
  isConnected: boolean;
  responseTime?: number;
  lastChecked: Date;
  isLoading: boolean;
}

export const DatabaseStatus = memo(() => {
  const [status, setStatus] = useState<DatabaseStatusState>({
    isConnected: false,
    lastChecked: new Date(),
    isLoading: true
  });

  const checkDatabaseStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const startTime = Date.now();
      const dbStatus = await supabaseApi.getDatabaseStatus();
      const responseTime = Date.now() - startTime;
      
      const isConnected = dbStatus.status === 'connected';

      setStatus({
        isConnected,
        responseTime,
        lastChecked: new Date(),
        isLoading: false
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        lastChecked: new Date(),
        isLoading: false
      });
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    if (status.isLoading) {
      return {
        color: 'text-yellow-500 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: 'fas fa-spinner fa-spin',
        text: 'فحص...',
        tooltip: 'جاري فحص حالة الاتصال بقاعدة البيانات'
      };
    }

    if (status.isConnected) {
      const responseTime = status.responseTime || 0;
      let color = 'text-green-500 dark:text-green-400';
      let performance = 'ممتاز';
      
      if (responseTime > 1000) {
        color = 'text-orange-500 dark:text-orange-400';
        performance = 'بطيء';
      } else if (responseTime > 500) {
        color = 'text-yellow-500 dark:text-yellow-400';
        performance = 'متوسط';
      }

      return {
        color,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: 'fas fa-database',
        text: 'متصل',
        tooltip: `قاعدة البيانات متصلة\nالاستجابة: ${responseTime}ms (${performance})\nآخر فحص: ${status.lastChecked.toLocaleTimeString('ar-SA')}`
      };
    }

    return {
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: 'fas fa-exclamation-triangle',
      text: 'منقطع',
      tooltip: `فشل الاتصال بقاعدة البيانات\nآخر محاولة: ${status.lastChecked.toLocaleTimeString('ar-SA')}`
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={checkDatabaseStatus}
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