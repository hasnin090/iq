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
    <div className="space-y-8 py-4">
      <div className="flex justify-between items-center pb-4 border-b border-[hsl(var(--border))]">
        <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
      </div>
      
      {/* Document Form */}
      <div className="card fade-in">
        <h3 className="text-lg font-bold text-[hsl(var(--primary))] mb-4">رفع مستند جديد</h3>
        <DocumentForm 
          projects={projects || []} 
          onSubmit={handleDocumentUpdated} 
          isLoading={projectsLoading}
        />
      </div>
      
      {/* Filter */}
      <div className="card slide-in-right">
        <h3 className="text-lg font-bold text-[hsl(var(--primary))] mb-4">تصفية المستندات</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-64">
            <Label htmlFor="filterProject" className="block text-sm font-medium mb-1">المشروع</Label>
            <Select 
              onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? undefined : parseInt(value) })}
              value={filter.projectId?.toString() || "all"}
            >
              <SelectTrigger id="filterProject" className="w-full">
                <SelectValue placeholder="كل المشاريع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المشاريع</SelectItem>
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
      
      {/* Documents Summary Cards - Mobile View */}
      <div className="block md:hidden space-y-4 fade-in">
        <h3 className="text-lg font-bold text-[hsl(var(--primary))] px-1">المستندات</h3>
        
        {documentsLoading ? (
          <div className="text-center py-8">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل البيانات...</p>
          </div>
        ) : documents?.length === 0 ? (
          <div className="text-center py-8 bg-[hsl(var(--muted))/10] rounded-xl">
            <p className="text-[hsl(var(--muted-foreground))]">لا توجد مستندات بعد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents?.map((doc) => {
              const projectName = projects?.find(p => p.id === doc.projectId)?.name || 'عام';
              return (
                <div key={doc.id} className="border border-[hsl(var(--border))] rounded-lg p-4 hover:bg-[hsl(var(--accent))/5] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{doc.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]`}>
                      {doc.fileType}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{doc.description}</p>
                  )}
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    <p className="mb-1">المشروع: {projectName}</p>
                    <p className="mb-1">تاريخ الرفع: {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="mt-3 flex space-x-2 space-x-reverse">
                    <button 
                      className="action-button-primary text-xs py-1 px-3"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      عرض
                    </button>
                    <button 
                      className="action-button-secondary text-xs py-1 px-3"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.fileUrl;
                        link.download = doc.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      تنزيل
                    </button>
                    <button 
                      className="action-button-destructive text-xs py-1 px-3"
                      onClick={() => {
                        if(confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) {
                          fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
                            .then(() => handleDocumentUpdated());
                        }
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Document List - Desktop View */}
      <div className="hidden md:block fade-in">
        <DocumentList 
          documents={documents || []} 
          projects={projects || []} 
          isLoading={documentsLoading || projectsLoading}
          onDocumentUpdated={handleDocumentUpdated}
        />
      </div>
    </div>
  );
}
