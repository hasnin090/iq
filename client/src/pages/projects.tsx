import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/project-form';
import { ProjectList } from '@/components/project-list';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export default function Projects() {
  const { user } = useAuth();
  
  interface Project {
    id: number;
    name: string;
    description: string;
    startDate: string;
    status: string;
    progress: number;
  }

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const handleProjectUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  };
  
  return (
    <div className="py-6 px-4 pb-mobile-nav-large">
      {/* عنوان الصفحة مع تصميم أكثر احترافية */}
      <div className="mb-6 md:mb-8 border-b border-border pb-4 bg-gradient-to-l from-background to-muted/30 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))] tracking-tight flex items-center">
              <i className="fas fa-project-diagram text-[hsl(var(--primary))] ml-2 opacity-80"></i>
              إدارة المشاريع
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm sm:text-base max-w-xl">إدارة وتتبع مشاريع الشركة وحالتها ومتابعة تقدمها بشكل مستمر</p>
          </div>
        </div>
      </div>
      
      {/* محتوى الصفحة - بتصميم أكثر احترافية */}
      <div className="space-y-6">
        {user?.role === 'admin' && (
          <div id="add-project-section" className="bg-[hsl(var(--card))] border border-primary/10 p-5 sm:p-6 rounded-xl shadow-sm fade-in">
            <h3 className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))] mb-4 sm:mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-plus-circle text-[hsl(var(--primary))]"></i>
              <span>إضافة مشروع جديد</span>
            </h3>
            <ProjectForm onSubmit={handleProjectUpdated} />
          </div>
        )}
        
        {/* قائمة المشاريع - تم تحسين العرض */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 sm:p-6 rounded-xl shadow-sm fade-in w-full max-w-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-[hsl(var(--primary))] flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-folder-open text-[hsl(var(--primary))]"></i>
              <span>قائمة المشاريع</span>
            </h3>
            <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              {projects?.length || 0} مشروع
            </div>
          </div>
          <ProjectList 
            projects={projects || []} 
            isLoading={isLoading}
            onProjectUpdated={handleProjectUpdated}
          />
        </div>
      </div>
    </div>
  );
}
