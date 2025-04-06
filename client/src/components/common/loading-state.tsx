// مكون حالة التحميل
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'جارِ التحميل...', className }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-sm text-muted-foreground text-center">
        {message}
      </p>
    </div>
  );
}