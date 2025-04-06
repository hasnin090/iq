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
    <div className={cn("flex justify-between items-center mb-4 p-2 rounded-lg bg-muted/40", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={sortBy === 'date' ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onSortChange('date')}
        >
          <CalendarIcon className="h-4 w-4 ml-1" />
          <span className="text-xs">التاريخ</span>
        </Button>
        <Button
          variant={sortBy === 'name' ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onSortChange('name')}
        >
          <TextIcon className="h-4 w-4 ml-1" />
          <span className="text-xs">الاسم</span>
        </Button>
        <Button
          variant={sortBy === 'type' ? 'default' : 'ghost'}
          size="sm"
          className="h-8"
          onClick={() => onSortChange('type')}
        >
          <FileIcon className="h-4 w-4 ml-1" />
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
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant={viewType === 'grid' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewTypeChange('grid')}
          title="عرض شبكي"
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewType === 'list' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onViewTypeChange('list')}
          title="عرض قائمة"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}