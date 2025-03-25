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
  
  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', filter],
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey as [string, Filter];
      const params = new URLSearchParams();
      
      if (filterParams.projectId) params.append('projectId', String(filterParams.projectId));
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });
  
  interface Project {
    id: number;
    name: string;
  }
  
  interface Document {
    id: number;
    name: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    uploadDate: string;
    projectId?: number;
    uploadedBy: number;
  }
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const handleFilterChange = (newFilter: Partial<Filter>) => {
    setFilter({ ...filter, ...newFilter });
  };
  
  const handleDocumentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
  };
  
  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--primary))]">إدارة المستندات</h2>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">إدارة وتنظيم مستندات المشاريع والملفات المهمة</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Mobile Document View */}
          <div className="block md:hidden space-y-6 fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))]">المستندات</h3>
              {documents && (
                <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-3 py-1">
                  {documents.length} مستند
                </span>
              )}
            </div>
            
            {documentsLoading ? (
              <div className="text-center py-10 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <div className="spinner w-10 h-10 mx-auto"></div>
                <p className="mt-4 text-[hsl(var(--muted-foreground))]">جاري تحميل المستندات...</p>
              </div>
            ) : documents?.length === 0 ? (
              <div className="text-center py-12 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                <div className="text-5xl mb-4 opacity-20">📁</div>
                <p className="text-[hsl(var(--foreground))] font-medium">لا توجد مستندات</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">قم برفع مستند جديد للبدء</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents?.map((doc: Document) => {
                  const projectName = projects?.find((p: Project) => p.id === doc.projectId)?.name || 'عام';
                  return (
                    <div 
                      key={doc.id} 
                      className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-5 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-[hsl(var(--foreground))]">{doc.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]`}>
                          {doc.fileType}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{doc.description}</p>
                      )}
                      <div className="flex items-center space-x-4 space-x-reverse text-xs text-[hsl(var(--muted-foreground))]">
                        <p className="flex items-center space-x-1 space-x-reverse">
                          <i className="fas fa-folder-open"></i>
                          <span>{projectName}</span>
                        </p>
                        <p className="flex items-center space-x-1 space-x-reverse">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{new Date(doc.uploadDate).toLocaleDateString('ar-SA')}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition-opacity"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <i className="fas fa-eye ml-1"></i>
                          عرض
                        </button>
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium hover:opacity-90 transition-opacity"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.fileUrl;
                            link.download = doc.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <i className="fas fa-download ml-1"></i>
                          تنزيل
                        </button>
                        <button 
                          className="text-xs py-2 px-3 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
                          onClick={async () => {
                            if(confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) {
                              try {
                                // أولاً محاولة حذف الملف من Firebase Storage
                                try {
                                  const { deleteFile } = await import('@/lib/firebase-storage');
                                  if (doc.fileUrl) {
                                    await deleteFile(doc.fileUrl);
                                  }
                                } catch (error) {
                                  console.error("فشل في حذف الملف من التخزين:", error);
                                  // نستمر في الحذف من قاعدة البيانات حتى لو فشل حذف الملف
                                }
                                
                                // ثم حذف السجل من قاعدة البيانات
                                await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
                                handleDocumentUpdated();
                              } catch (error) {
                                alert('حدث خطأ أثناء حذف المستند. يرجى المحاولة مرة أخرى.');
                                console.error(error);
                              }
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt ml-1"></i>
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Desktop Document List */}
          <div className="hidden md:block fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[hsl(var(--primary))]">المستندات</h3>
              {documents && (
                <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-3 py-1">
                  {documents.length} مستند
                </span>
              )}
            </div>
            <DocumentList 
              documents={documents || []} 
              projects={projects || []} 
              isLoading={documentsLoading || projectsLoading}
              onDocumentUpdated={handleDocumentUpdated}
            />
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Document Form */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm fade-in">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-file-upload text-[hsl(var(--primary))]"></i>
              <span>رفع مستند جديد</span>
            </h3>
            <DocumentForm 
              projects={projects || []} 
              onSubmit={handleDocumentUpdated} 
              isLoading={projectsLoading}
            />
          </div>
          
          {/* Filter */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-xl shadow-sm slide-in-right">
            <h3 className="text-xl font-bold text-[hsl(var(--primary))] mb-5 flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-filter text-[hsl(var(--primary))]"></i>
              <span>تصفية المستندات</span>
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filterProject" className="block text-sm font-medium mb-2">حسب المشروع</Label>
                <Select 
                  onValueChange={(value) => handleFilterChange({ projectId: value === "all" ? undefined : parseInt(value) })}
                  value={filter.projectId?.toString() || "all"}
                >
                  <SelectTrigger id="filterProject" className="w-full">
                    <SelectValue placeholder="كل المشاريع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المشاريع</SelectItem>
                    {!projectsLoading && projects?.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
