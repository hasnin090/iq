import { useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook مركزي لإدارة تحديث الكاش في النظام
 */
export function useCacheManager() {
  
  /**
   * تحديث كاش المعاملات المالية
   */
  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  }, []);

  /**
   * تحديث كاش الموظفين
   */
  const invalidateEmployees = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    queryClient.invalidateQueries({ queryKey: ['/api/employees/by-project'] });
  }, []);

  /**
   * تحديث كاش أنواع المصاريف
   */
  const invalidateExpenseTypes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/expense-types'] });
  }, []);

  /**
   * تحديث كاش المشاريع
   */
  const invalidateProjects = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user-projects'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  }, []);

  /**
   * تحديث كاش المستندات
   */
  const invalidateDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
  }, []);

  /**
   * تحديث شامل للنظام (استخدم بحذر)
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, []);

  /**
   * إضافة معاملة جديدة للكاش المحلي فوراً
   */
  const addTransactionToCache = useCallback((newTransaction: any) => {
    queryClient.setQueryData(['/api/transactions'], (oldData: any) => {
      if (Array.isArray(oldData)) {
        return [newTransaction, ...oldData];
      }
      return [newTransaction];
    });
  }, []);

  /**
   * إزالة معاملة من الكاش المحلي فوراً
   */
  const removeTransactionFromCache = useCallback((transactionId: number) => {
    queryClient.setQueryData(['/api/transactions'], (oldData: any) => {
      if (Array.isArray(oldData)) {
        return oldData.filter((transaction: any) => transaction.id !== transactionId);
      }
      return oldData;
    });
  }, []);

  /**
   * تحديث معاملة في الكاش المحلي فوراً
   */
  const updateTransactionInCache = useCallback((updatedTransaction: any) => {
    queryClient.setQueryData(['/api/transactions'], (oldData: any) => {
      if (Array.isArray(oldData)) {
        return oldData.map((transaction: any) => 
          transaction.id === updatedTransaction.id ? updatedTransaction : transaction
        );
      }
      return oldData;
    });
  }, []);

  /**
   * إعادة جلب البيانات فوراً
   */
  const refetchTransactions = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['/api/transactions'] });
  }, []);

  /**
   * تحديث متقدم للمعاملات (invalidate + refetch)
   */
  const refreshTransactions = useCallback(() => {
    invalidateTransactions();
    refetchTransactions();
  }, [invalidateTransactions, refetchTransactions]);

  return {
    // تحديث الكاش
    invalidateTransactions,
    invalidateEmployees,
    invalidateExpenseTypes,
    invalidateProjects,
    invalidateDocuments,
    invalidateAll,
    
    // تحديث الكاش المحلي
    addTransactionToCache,
    removeTransactionFromCache,
    updateTransactionInCache,
    
    // إعادة جلب البيانات
    refetchTransactions,
    refreshTransactions,
  };
}