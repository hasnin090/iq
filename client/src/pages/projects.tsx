import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/project-form';
import { ProjectList } from '@/components/project-list';
import { queryClient } from '@/lib/queryClient';

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const handleProjectUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  };
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">إدارة المشاريع</h2>
      
      {/* Project Form */}
      <ProjectForm onSubmit={handleProjectUpdated} />
      
      {/* Project List */}
      <ProjectList 
        projects={projects || []} 
        isLoading={isLoading}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
}
