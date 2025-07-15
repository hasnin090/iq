import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './guards';
import { PermissionWrapper } from './PermissionWrapper';
import { ActionButton, DashboardCard } from './ui/PermissionComponents';

// 🏗️ نظام إدارة المشاريع المتكامل
// ===================================

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  start_date: string;
  end_date?: string;
  budget: number;
  spent: number;
  owner_id: string;
  team_members: string[];
  created_at: string;
  updated_at: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  budget: number;
  start_date: string;
  end_date: string;
  team_members: string[];
}

// الصفحة الرئيسية للمشاريع
export function ProjectsPage() {
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // هنا نتصل بـ API لجلب المشاريع
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'تطوير نظام المحاسبة',
          description: 'تطوير نظام محاسبة شامل للشركة',
          status: 'active',
          start_date: '2024-01-15',
          end_date: '2024-06-15',
          budget: 50000,
          spent: 25000,
          owner_id: '1',
          team_members: ['2', '3'],
          created_at: '2024-01-15',
          updated_at: '2024-03-01'
        },
        {
          id: '2',
          name: 'تحديث الموقع الإلكتروني',
          description: 'إعادة تصميم وتطوير الموقع الإلكتروني',
          status: 'active',
          start_date: '2024-02-01',
          budget: 30000,
          spent: 15000,
          owner_id: '2',
          team_members: ['3', '4'],
          created_at: '2024-02-01',
          updated_at: '2024-03-01'
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('خطأ في تحميل المشاريع:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="view_projects" userProfile={userProfile}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المشاريع</h1>
            <p className="text-gray-600">عرض وإدارة جميع مشاريع الشركة</p>
          </div>
          
          <PermissionWrapper permission="create_project" userProfile={userProfile}>
            <ActionButton
              label="مشروع جديد"
              permission="create_project"
              variant="primary"
              icon="➕"
              onClick={() => setShowCreateForm(true)}
            />
          </PermissionWrapper>
        </div>

        {/* إحصائيات المشاريع */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="إجمالي المشاريع"
            value={projects.length.toString()}
            icon="📁"
            permission="view_projects"
          />
          <DashboardCard
            title="المشاريع النشطة"
            value={projects.filter(p => p.status === 'active').length.toString()}
            icon="🟢"
            permission="view_projects"
          />
          <DashboardCard
            title="المشاريع المكتملة"
            value={projects.filter(p => p.status === 'completed').length.toString()}
            icon="✅"
            permission="view_projects"
          />
          <DashboardCard
            title="إجمالي الميزانية"
            value={`${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()} ر.س`}
            icon="💰"
            permission="view_projects"
          />
        </div>

        {/* قائمة المشاريع */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">قائمة المشاريع</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onUpdate={loadProjects}
              />
            ))}
          </div>
        </div>

        {/* نموذج إنشاء مشروع جديد */}
        {showCreateForm && (
          <ProjectCreateModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              loadProjects();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// بطاقة عرض المشروع
function ProjectCard({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const { userProfile } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'paused': return 'متوقف';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  const progressPercentage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          
          <p className="text-gray-600 mt-1">{project.description}</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">الميزانية:</span>
              <p className="text-lg font-semibold text-blue-600">
                {project.budget.toLocaleString()} ر.س
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">المصروف:</span>
              <p className="text-lg font-semibold text-red-600">
                {project.spent.toLocaleString()} ر.س
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">المتبقي:</span>
              <p className="text-lg font-semibold text-green-600">
                {(project.budget - project.spent).toLocaleString()} ر.س
              </p>
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>تقدم الإنفاق</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${progressPercentage > 90 ? 'bg-red-600' : progressPercentage > 70 ? 'bg-yellow-600' : 'bg-green-600'}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mr-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
          
          <PermissionWrapper permission="edit_project" userProfile={userProfile}>
            <ActionButton
              label="تعديل"
              permission="edit_project"
              variant="secondary"
              size="sm"
              onClick={() => alert(`تعديل المشروع: ${project.name}`)}
            />
          </PermissionWrapper>
          
          <PermissionWrapper permission="delete_project" userProfile={userProfile}>
            <ActionButton
              label="حذف"
              permission="delete_project"
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                  alert(`حذف المشروع: ${project.name}`);
                }
              }}
            />
          </PermissionWrapper>
        </div>
      </div>

      {/* التفاصيل الإضافية */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">معلومات المشروع</h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">تاريخ البداية:</span> {project.start_date}
                </div>
                {project.end_date && (
                  <div>
                    <span className="font-medium">تاريخ النهاية:</span> {project.end_date}
                  </div>
                )}
                <div>
                  <span className="font-medium">تاريخ الإنشاء:</span> {project.created_at}
                </div>
                <div>
                  <span className="font-medium">آخر تحديث:</span> {project.updated_at}
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">الفريق</h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">مدير المشروع:</span> 
                  <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {project.owner_id}
                  </span>
                </div>
                <div>
                  <span className="font-medium">أعضاء الفريق:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {project.team_members.map(member => (
                      <span key={member} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// نموذج إنشاء مشروع جديد
function ProjectCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    team_members: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المشروع مطلوب';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'وصف المشروع مطلوب';
    }
    
    if (formData.budget <= 0) {
      newErrors.budget = 'الميزانية يجب أن تكون أكبر من صفر';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'تاريخ البداية مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // هنا نرسل البيانات لـ API
      console.log('إنشاء مشروع جديد:', formData);
      
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('تم إنشاء المشروع بنجاح!');
      onSuccess();
    } catch (error) {
      console.error('خطأ في إنشاء المشروع:', error);
      alert('حدث خطأ في إنشاء المشروع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">إنشاء مشروع جديد</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم المشروع *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل اسم المشروع"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وصف المشروع *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل وصف المشروع"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الميزانية (ر.س) *
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.budget ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ البداية *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ النهاية المتوقع
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={formData.start_date}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
