import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface DatabaseStatus {
  isConnected: boolean;
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

export function useDatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConnected: false,
    lastChecked: new Date()
  });

  // Query to check database status
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['/api/database/status'],
    queryFn: async (): Promise<DatabaseStatus> => {
      const startTime = Date.now();
      try {
        const response = await fetch('/api/database/status', {
          credentials: 'include',
          method: 'GET'
        });

        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        return {
          isConnected: data.connected || false,
          responseTime,
          lastChecked: new Date(),
          error: undefined
        };
      } catch (err) {
        const responseTime = Date.now() - startTime;
        return {
          isConnected: false,
          responseTime,
          lastChecked: new Date(),
          error: err instanceof Error ? err.message : 'خطأ غير معروف'
        };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update status when data changes
  useEffect(() => {
    if (data) {
      setStatus(data);
    } else if (error) {
      setStatus({
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'فشل في الاتصال'
      });
    }
  }, [data, error]);

  // Manual refresh function
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    status,
    isLoading,
    refresh
  };
}