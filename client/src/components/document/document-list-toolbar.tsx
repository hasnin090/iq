// مكون شريط أدوات قائمة المستندات
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Grid2X2, List, ChevronUp, ChevronDown,
  CalendarIcon, TextIcon, FileIcon
} from 'lucide-react';

interface DocumentListToolbarProps {
  viewType: 'grid' | 'list';
  onViewTypeChange: (viewType: 'grid' | 'list') => void;
  sortBy: 'date' | 'name' | 'type';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'date' | 'name' | 'type') => void;
  onSortOrderToggle: () => void;
  className?: string;
}

export function DocumentListToolbar({
  viewType,
  onViewTypeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderToggle,
  className
}: DocumentListToolbarProps) {
  return (
    <div className={cn("flex flex-wrap justify-between items-center mb-4 p-2 rounded-lg bg-muted/40 dark:bg-muted/20", className)}>
      <div className="flex items-center gap-1 xs:gap-2">
        <Button
          variant={sortBy === 'date' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-2 xs:px-3"
          onClick={() => onSortChange('date')}
        >
          <CalendarIcon className="h-3.5 w-3.5 ml-1" />
          <span className="text-xs">التاريخ</span>
        </Button>
        <Button
          variant={sortBy === 'name' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-2 xs:px-3"
          onClick={() => onSortChange('name')}
        >
          <TextIcon className="h-3.5 w-3.5 ml-1" />
          <span className="text-xs">الاسم</span>
        </Button>
        <Button
          variant={sortBy === 'type' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-2 xs:px-3"
          onClick={() => onSortChange('type')}
        >
          <FileIcon className="h-3.5 w-3.5 ml-1" />
          <span className="text-xs">النوع</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSortOrderToggle}
          title={sortOrder === 'asc' ? 'ترتيب تصاعدي' : 'ترتيب تنازلي'}
        >
          {sortOrder === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center gap-0.5 xs:gap-1 border border-border dark:border-border/40 rounded-md">
        <Button
          variant={viewType === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            "h-7 w-7 rounded-r-none", 
            viewType === 'grid' && "dark:bg-secondary/80"
          )}
          onClick={() => onViewTypeChange('grid')}
          title="عرض شبكي"
        >
          <Grid2X2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={viewType === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            "h-7 w-7 rounded-l-none",
            viewType === 'list' && "dark:bg-secondary/80"
          )}
          onClick={() => onViewTypeChange('list')}
          title="عرض قائمة"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}