// شريط جانبي خاص بصفحة المستندات
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  File, 
  FileImage, 
  FileText, 
  FileType, 
  Filter, 
  Image, 
  Search, 
  SlidersHorizontal,
  UploadCloud,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document as DocumentType, Project } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getMainFileType } from '@/utils/file-utils';

interface DocumentSidebarProps {
  documents: DocumentType[];
  projects: Project[];
  filter: any;
  onFilterChange: (newFilter: any) => void;
  onUploadClick: () => void;
  className?: string;
}

export function DocumentSidebar({ 
  documents, 
  projects, 
  filter, 
  onFilterChange, 
  onUploadClick,
  className 
}: DocumentSidebarProps) {
  // استخراج أنواع الملفات المختلفة من المستندات
  const fileTypes = Array.from(new Set(documents.map(doc => getMainFileType(doc.fileType))));
  
  // إحصائيات بسيطة
  const totalDocuments = documents.length;
  const fileTypeStats = fileTypes.map(type => ({
    type,
    count: documents.filter(doc => getMainFileType(doc.fileType) === type).length
  })).sort((a, b) => b.count - a.count);
  
  // استخراج أحدث المستندات
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5);
  
  const clearFilter = () => {
    onFilterChange({});
  };
  
  // مساعدة للحصول على اسم عرض نوع الملف
  const getFileTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'image': return 'صورة';
      case 'pdf': return 'PDF';
      case 'document': return 'مستند';
      case 'spreadsheet': return 'جدول بيانات';
      case 'presentation': return 'عرض تقديمي';
      default: return 'ملف آخر';
    }
  };
  
  // مساعدة للحصول على أيقونة نوع الملف
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'document': return <File className="h-4 w-4" />;
      case 'spreadsheet': return <FileType className="h-4 w-4" />;
      case 'presentation': return <FileImage className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* زر إضافة مستند جديد */}
      <div className="mb-4">
        <Button 
          className="w-full rounded-lg h-12 shadow-sm"
          onClick={onUploadClick}
        >
          <UploadCloud className="ml-2 h-5 w-5" />
          <span>رفع مستند جديد</span>
        </Button>
      </div>
      
      {/* بطاقة البحث */}
      <Card className="shadow-sm border-[hsl(var(--border))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Search className="ml-2 h-4 w-4 text-[hsl(var(--primary))]" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* البحث */}
          <div>
            <Label htmlFor="sideSearchQuery" className="text-xs mb-1.5 block">بحث عن مستند</Label>
            <div className="relative">
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="sideSearchQuery"
                placeholder="اسم المستند أو الوصف..."
                value={filter.searchQuery || ''}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                className="pl-2 pr-8 h-9 text-xs"
              />
            </div>
          </div>
          
          {/* المشروع */}
          <div>
            <Label htmlFor="sideProjectFilter" className="text-xs mb-1.5 block">تصفية حسب المشروع</Label>
            <Select
              value={filter.projectId?.toString() || 'all'}
              onValueChange={(value) => onFilterChange({ projectId: value === 'all' ? undefined : value ? parseInt(value) : undefined })}
            >
              <SelectTrigger id="sideProjectFilter" className="h-9 text-xs">
                <SelectValue placeholder="كل المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المشاريع</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* نوع الملف */}
          <div>
            <Label htmlFor="sideTypeFilter" className="text-xs mb-1.5 block">تصفية حسب نوع الملف</Label>
            <Select
              value={filter.fileType || 'all'}
              onValueChange={(value) => onFilterChange({ fileType: value === 'all' ? undefined : value })}
            >
              <SelectTrigger id="sideTypeFilter" className="h-9 text-xs">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="image">صور</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="document">مستندات</SelectItem>
                <SelectItem value="spreadsheet">جداول بيانات</SelectItem>
                <SelectItem value="presentation">عروض تقديمية</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* التاريخ */}
          <div>
            <Label className="text-xs mb-1.5 block">تصفية حسب تاريخ الرفع</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-right h-9 text-xs font-normal"
                >
                  <Calendar className="ml-2 h-3.5 w-3.5" />
                  {filter.dateRange?.from ? (
                    filter.dateRange.to ? (
                      <>
                        من {format(filter.dateRange.from, "P", { locale: ar })}
                        <br />
                        إلى {format(filter.dateRange.to, "P", { locale: ar })}
                      </>
                    ) : (
                      format(filter.dateRange.from, "P", { locale: ar })
                    )
                  ) : (
                    "اختر التاريخ..."
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  locale={ar}
                  mode="range"
                  initialFocus
                  selected={{ 
                    from: filter.dateRange?.from || undefined, 
                    to: filter.dateRange?.to || undefined
                  }}
                  onSelect={(range) => onFilterChange({ 
                    dateRange: { 
                      from: range?.from, 
                      to: range?.to 
                    } 
                  })}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* مسح الفلتر */}
          {(filter.searchQuery || filter.projectId || filter.fileType || filter.dateRange?.from) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 text-xs h-9"
              onClick={clearFilter}
            >
              <X className="ml-1.5 h-3.5 w-3.5" />
              مسح الفلتر
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* بطاقة الإحصائيات */}
      <Card className="shadow-sm border-[hsl(var(--border))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <SlidersHorizontal className="ml-2 h-4 w-4 text-[hsl(var(--primary))]" />
            إحصائيات المستندات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">إجمالي المستندات: <span className="font-semibold text-foreground">{totalDocuments}</span></div>
          <div className="space-y-1.5">
            {fileTypeStats.map(stat => (
              <div key={stat.type} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getFileTypeIcon(stat.type)}
                  <span className="text-xs">{getFileTypeDisplayName(stat.type)}</span>
                </div>
                <Badge variant="outline" className="text-xs h-5 bg-muted/30">
                  {stat.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* بطاقة أحدث المستندات */}
      <Card className="shadow-sm border-[hsl(var(--border))]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <FileText className="ml-2 h-4 w-4 text-[hsl(var(--primary))]" />
            أحدث المستندات
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <ul className="space-y-2 -mx-3 -mt-1">
            {recentDocuments.map(doc => (
              <li key={doc.id} className="px-3 py-2 hover:bg-muted/40 rounded-md">
                <div className="flex items-center gap-2">
                  {getFileTypeIcon(getMainFileType(doc.fileType))}
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-medium truncate">{doc.name}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(doc.uploadDate), 'dd MMM yyyy', { locale: ar })}
                      </span>
                      <span className="mx-1 text-muted-foreground text-[8px]">•</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {projects?.find(p => p.id === doc.projectId)?.name || 'بدون مشروع'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}