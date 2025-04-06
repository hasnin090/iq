// مكون عنوان القسم
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  buttonText?: string;
  buttonLink?: string;
  onButtonClick?: () => void;
}

export function SectionHeader({
  title,
  description,
  icon,
  className,
  buttonText,
  buttonLink,
  onButtonClick
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {buttonText && (
        buttonLink ? (
          <Button asChild>
            <Link to={buttonLink}>{buttonText}</Link>
          </Button>
        ) : (
          <Button onClick={onButtonClick}>{buttonText}</Button>
        )
      )}
    </div>
  );
}