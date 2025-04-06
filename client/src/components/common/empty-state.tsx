// مكون حالة فارغة عام
import React from 'react';
import { 
  FileQuestion, Users, LayoutDashboard, 
  FilePlus2, CreditCard, Briefcase 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

type EmptyStateType = 'documents' | 'users' | 'projects' | 'transactions' | 'dashboard' | 'general';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ 
  type = 'general',
  title,
  description,
  action
}: EmptyStateProps) {
  // تحديد العنوان والوصف والأيقونة استنادًا إلى النوع
  let icon = <FileQuestion className="h-12 w-12 mb-4 text-muted-foreground" />;
  let defaultTitle = 'لا توجد بيانات';
  let defaultDescription = 'لم يتم العثور على أي محتوى لعرضه.';
  
  switch (type) {
    case 'documents':
      icon = <FilePlus2 className="h-12 w-12 mb-4 text-primary" />;
      defaultTitle = 'لا توجد مستندات';
      defaultDescription = 'لم يتم تحميل أي مستندات بعد. قم بتحميل مستند جديد للبدء.';
      break;
    case 'users':
      icon = <Users className="h-12 w-12 mb-4 text-primary" />;
      defaultTitle = 'لا يوجد مستخدمين';
      defaultDescription = 'لم يتم إضافة أي مستخدمين بعد. قم بإضافة مستخدم جديد للبدء.';
      break;
    case 'projects':
      icon = <Briefcase className="h-12 w-12 mb-4 text-primary" />;
      defaultTitle = 'لا توجد مشاريع';
      defaultDescription = 'لم يتم إنشاء أي مشاريع بعد. قم بإنشاء مشروع جديد للبدء.';
      break;
    case 'transactions':
      icon = <CreditCard className="h-12 w-12 mb-4 text-primary" />;
      defaultTitle = 'لا توجد معاملات';
      defaultDescription = 'لم يتم تسجيل أي معاملات بعد. قم بإضافة معاملة جديدة للبدء.';
      break;
    case 'dashboard':
      icon = <LayoutDashboard className="h-12 w-12 mb-4 text-primary" />;
      defaultTitle = 'لوحة المعلومات فارغة';
      defaultDescription = 'قم بإضافة بيانات لعرض الإحصائيات والرسوم البيانية.';
      break;
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-card border border-dashed rounded-xl">
      {icon}
      <h3 className="text-lg font-medium text-center">
        {title || defaultTitle}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mt-2 mb-4">
        {description || defaultDescription}
      </p>
      
      {action && (
        action.href ? (
          <Button asChild variant="default">
            <Link to={action.href}>
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button variant="default" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}