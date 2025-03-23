import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DocumentForm } from '@/components/document-form';
import { DocumentList } from '@/components/document-list';
import { queryClient } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Filter {
  projectId?: number;
}

export default function Documents() {
  const [filter, setFilter] = useState<Filter>({});
  
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents', filter],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey;
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  const handleDocumentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
  };
  
  return (
    <div className="space-y-8 py-6">
      <h2 className="text-2xl font-bold text-primary-light pb-2 border-b border-neutral-dark border-opacity-20">إدارة المستندات</h2>
      
      {/* Document Form */}
      <DocumentForm 
        projects={projects || []} 
        onSubmit={handleDocumentUpdated} 
        isLoading={projectsLoading}
      />
      
      {/* Filter */}
      <div className="bg-secondary-light rounded-xl shadow-card p-6">
        <h3 className="text-lg font-bold text-primary-light mb-4">تصفية المستندات</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-64">
            <Label htmlFor="filterProject" className="block text-sm font-medium text-neutral mb-1">المشروع</Label>
            <Select 
              onValueChange={(value) => handleFilterChange({ projectId: value ? parseInt(value) : undefined })}
              value={filter.projectId?.toString() || ""}
            >
              <SelectTrigger id="filterProject" className="w-full px-4 py-2 h-auto rounded-lg bg-secondary border border-secondary-light focus:border-primary-light focus:outline-none text-neutral-light">
                <SelectValue placeholder="كل المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل المشاريع</SelectItem>
                {!projectsLoading && projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Document List */}
      <DocumentList 
        documents={documents || []} 
        projects={projects || []} 
        isLoading={documentsLoading || projectsLoading}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </div>
  );
}
