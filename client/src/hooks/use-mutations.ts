import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MutationConfig {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[];
  onSuccessCallback?: () => void;
}

export function useCustomMutation(config: MutationConfig) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: any) => {
      const response = await fetch(config.endpoint, {
        method: config.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
        throw new Error(error.message || config.errorMessage || 'فشلت العملية');
      }
      
      return response.json();
    },
    onSuccess: () => {
      if (config.successMessage) {
        toast({
          title: "نجحت العملية",
          description: config.successMessage,
        });
      }
      
      if (config.invalidateQueries) {
        config.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      config.onSuccessCallback?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || config.errorMessage || "حدث خطأ أثناء العملية",
        variant: "destructive",
      });
    }
  });
}

export function useDeleteMutation(endpoint: string, successMessage: string, invalidateQueries: string[]) {
  return useCustomMutation({
    endpoint,
    method: 'DELETE',
    successMessage,
    invalidateQueries,
    errorMessage: "فشل في الحذف"
  });
}

export function useUpdateMutation(endpoint: string, successMessage: string, invalidateQueries: string[]) {
  return useCustomMutation({
    endpoint,
    method: 'PUT',
    successMessage,
    invalidateQueries,
    errorMessage: "فشل في التحديث"
  });
}

export function useCreateMutation(endpoint: string, successMessage: string, invalidateQueries: string[]) {
  return useCustomMutation({
    endpoint,
    method: 'POST',
    successMessage,
    invalidateQueries,
    errorMessage: "فشل في الإنشاء"
  });
}