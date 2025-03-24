import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/project-form';
import { ProjectList } from '@/components/project-list';
import { queryClient } from '@/lib/queryClient';

export default function Projects() {
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
    <div className="py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المشاريع</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة وتتبع مشاريع الشركة وحالتها</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Project List */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm fade-in">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-folder-open text-[hsl(var(--primary))]"></i>
              <span>قائمة المشاريع</span>
            </h3>
            <ProjectList 
              projects={projects || []} 
              isLoading={isLoading}
              onProjectUpdated={handleProjectUpdated}
            />
          </div>
        </div>
        
        <div>
          {/* Project Form */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm sticky top-4 fade-in">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-plus-circle text-[hsl(var(--primary))]"></i>
              <span>إضافة مشروع جديد</span>
            </h3>
            <ProjectForm onSubmit={handleProjectUpdated} />
          </div>
        </div>
      </div>
    </div>
  );
}
