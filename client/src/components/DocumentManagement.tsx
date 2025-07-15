import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './guards';
import { PermissionWrapper } from './PermissionWrapper';
import { ActionButton, DashboardCard } from './ui/PermissionComponents';

// 📁 نظام إدارة المستندات والملفات المتكامل
// ===============================================

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'image' | 'other';
  size: number;
  category: string;
  description?: string;
  tags: string[];
  project_id?: string;
  project_name?: string;
  uploaded_by: string;
  upload_date: string;
  last_modified: string;
  access_level: 'public' | 'internal' | 'confidential' | 'restricted';
  download_count: number;
  file_path: string;
  version: number;
  status: 'active' | 'archived' | 'deleted';
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  description: string;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'contracts', name: 'العقود والاتفاقيات', icon: '📋', count: 0, description: 'العقود مع العملاء والموردين' },
  { id: 'financial', name: 'المستندات المالية', icon: '💰', count: 0, description: 'الفواتير والإيصالات والتقارير المالية' },
  { id: 'projects', name: 'مستندات المشاريع', icon: '🏗️', count: 0, description: 'ملفات ووثائق المشاريع' },
  { id: 'hr', name: 'الموارد البشرية', icon: '👥', count: 0, description: 'ملفات الموظفين والسيرة الذاتية' },
  { id: 'legal', name: 'المستندات القانونية', icon: '⚖️', count: 0, description: 'التراخيص والوثائق القانونية' },
  { id: 'reports', name: 'التقارير', icon: '📊', count: 0, description: 'التقارير الدورية والتحليلية' },
  { id: 'certificates', name: 'الشهادات', icon: '🏆', count: 0, description: 'شهادات الجودة والاعتماد' },
  { id: 'general', name: 'عام', icon: '📄', count: 0, description: 'مستندات عامة أخرى' }
];

const FILE_TYPES = {
  pdf: { icon: '📄', color: 'text-red-600' },
  doc: { icon: '📝', color: 'text-blue-600' },
  docx: { icon: '📝', color: 'text-blue-600' },
  xls: { icon: '📊', color: 'text-green-600' },
  xlsx: { icon: '📊', color: 'text-green-600' },
  image: { icon: '🖼️', color: 'text-purple-600' },
  other: { icon: '📁', color: 'text-gray-600' }
};

// الصفحة الرئيسية لإدارة المستندات
export function DocumentManagementPage() {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>(DOCUMENT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, searchTerm]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // محاكاة بيانات المستندات
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'عقد مشروع تطوير النظام.pdf',
          type: 'pdf',
          size: 2048000,
          category: 'contracts',
          description: 'عقد تطوير نظام إدارة المحاسبة',
          tags: ['عقد', 'تطوير', 'نظام'],
          project_id: '1',
          project_name: 'تطوير نظام المحاسبة',
          uploaded_by: 'أحمد محمد',
          upload_date: '2024-03-01',
          last_modified: '2024-03-01',
          access_level: 'confidential',
          download_count: 15,
          file_path: '/uploads/contracts/contract_001.pdf',
          version: 1,
          status: 'active',
          approval_status: 'approved',
          approved_by: 'مدير عام'
        },
        {
          id: '2',
          name: 'فاتورة شراء معدات.xlsx',
          type: 'xlsx',
          size: 512000,
          category: 'financial',
          description: 'فاتورة شراء معدات للمكتب',
          tags: ['فاتورة', 'معدات', 'مشتريات'],
          uploaded_by: 'سارة أحمد',
          upload_date: '2024-03-02',
          last_modified: '2024-03-02',
          access_level: 'internal',
          download_count: 8,
          file_path: '/uploads/financial/invoice_002.xlsx',
          version: 1,
          status: 'active',
          approval_status: 'pending'
        },
        {
          id: '3',
          name: 'تقرير أداء المشروع.docx',
          type: 'docx',
          size: 1024000,
          category: 'reports',
          description: 'تقرير شهري لأداء المشروع',
          tags: ['تقرير', 'أداء', 'شهري'],
          project_id: '1',
          project_name: 'تطوير نظام المحاسبة',
          uploaded_by: 'محمد علي',
          upload_date: '2024-03-03',
          last_modified: '2024-03-03',
          access_level: 'internal',
          download_count: 12,
          file_path: '/uploads/reports/report_003.docx',
          version: 2,
          status: 'active',
          approval_status: 'approved',
          approved_by: 'مدير القسم'
        },
        {
          id: '4',
          name: 'رخصة العمل.pdf',
          type: 'pdf',
          size: 3072000,
          category: 'legal',
          description: 'رخصة العمل التجارية للشركة',
          tags: ['رخصة', 'قانوني', 'تجارية'],
          uploaded_by: 'أحمد محمد',
          upload_date: '2024-01-15',
          last_modified: '2024-01-15',
          access_level: 'restricted',
          download_count: 3,
          file_path: '/uploads/legal/license_004.pdf',
          version: 1,
          status: 'active',
          approval_status: 'approved',
          approved_by: 'مدير عام'
        }
      ];

      // تحديث عدد المستندات في كل فئة
      const updatedCategories = categories.map(category => ({
        ...category,
        count: mockDocuments.filter(doc => doc.category === category.id).length
      }));

      setDocuments(mockDocuments);
      setCategories(updatedCategories);
    } catch (error) {
      console.error('خطأ في تحميل المستندات:', error);
    } finally {
      setLoading(false);
    }
  };

  // فلترة المستندات
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // حساب الإحصائيات
  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
  const pendingApproval = documents.filter(doc => doc.approval_status === 'pending').length;
  const confidentialDocs = documents.filter(doc => doc.access_level === 'confidential').length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="view_documents" userProfile={userProfile}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المستندات والملفات</h1>
            <p className="text-gray-600">تنظيم وإدارة جميع مستندات الشركة</p>
          </div>
          
          <div className="flex space-x-2">
            <PermissionWrapper permission="upload_document" userProfile={userProfile}>
              <ActionButton
                label="رفع ملف"
                permission="upload_document"
                variant="primary"
                icon="📤"
                onClick={() => setShowUploadForm(true)}
              />
            </PermissionWrapper>
            <PermissionWrapper permission="bulk_upload" userProfile={userProfile}>
              <ActionButton
                label="رفع متعدد"
                permission="bulk_upload"
                variant="secondary"
                icon="📁"
                onClick={() => alert('رفع ملفات متعددة')}
              />
            </PermissionWrapper>
          </div>
        </div>

        {/* إحصائيات المستندات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="إجمالي المستندات"
            value={totalDocuments.toString()}
            icon="📁"
            className="border-r-4 border-blue-500"
            permission="view_documents"
          />
          <DashboardCard
            title="حجم التخزين"
            value={formatFileSize(totalSize)}
            icon="💾"
            className="border-r-4 border-green-500"
            permission="view_documents"
          />
          <DashboardCard
            title="في انتظار الموافقة"
            value={pendingApproval.toString()}
            icon="⏳"
            className="border-r-4 border-yellow-500"
            permission="view_documents"
          />
          <DashboardCard
            title="سري"
            value={confidentialDocs.toString()}
            icon="🔒"
            className="border-r-4 border-red-500"
            permission="view_documents"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* فئات المستندات */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">فئات المستندات</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-right px-3 py-2 rounded-md flex items-center justify-between ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>جميع المستندات</span>
                  <span className="text-sm text-gray-500">{totalDocuments}</span>
                </button>
                
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-right px-3 py-2 rounded-md flex items-center justify-between ${
                      selectedCategory === category.id 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* قائمة المستندات */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* شريط البحث والفلاتر */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="البحث في المستندات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">ترتيب حسب</option>
                      <option value="name">الاسم</option>
                      <option value="date">التاريخ</option>
                      <option value="size">الحجم</option>
                    </select>
                    
                    <div className="flex border border-gray-300 rounded-md">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                      >
                        ⊞
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                      >
                        ☰
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* المستندات */}
              <div className="p-4">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📁</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستندات</h3>
                    <p className="text-gray-500">لم يتم العثور على مستندات في هذه الفئة</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(document => (
                      <DocumentCard 
                        key={document.id} 
                        document={document} 
                        onSelect={setSelectedDocument}
                        onUpdate={loadDocuments}
                      />
                    ))}
                  </div>
                ) : (
                  <DocumentList 
                    documents={filteredDocuments}
                    onSelect={setSelectedDocument}
                    onUpdate={loadDocuments}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* نموذج رفع ملف جديد */}
        {showUploadForm && (
          <DocumentUploadModal
            onClose={() => setShowUploadForm(false)}
            onSuccess={() => {
              setShowUploadForm(false);
              loadDocuments();
            }}
          />
        )}

        {/* نموذج تفاصيل المستند */}
        {selectedDocument && (
          <DocumentDetailsModal
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onUpdate={loadDocuments}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// بطاقة عرض المستند (Grid View)
function DocumentCard({ document, onSelect, onUpdate }: { 
  document: Document; 
  onSelect: (doc: Document) => void;
  onUpdate: () => void;
}) {
  const { userProfile } = useAuth();
  const fileType = FILE_TYPES[document.type] || FILE_TYPES.other;

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-orange-100 text-orange-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'public': return 'عام';
      case 'internal': return 'داخلي';
      case 'confidential': return 'سري';
      case 'restricted': return 'مقيد';
      default: return level;
    }
  };

  const handleDownload = () => {
    // هنا نقوم بتحميل الملف
    alert(`تحميل الملف: ${document.name}`);
    onUpdate();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`text-2xl ${fileType.color}`}>
          {fileType.icon}
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccessLevelColor(document.access_level)}`}>
          {getAccessLevelLabel(document.access_level)}
        </span>
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
          {document.name}
        </h4>
        {document.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {document.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{document.formatFileSize(document.size)}</span>
        <span>{document.upload_date}</span>
      </div>

      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {document.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
          {document.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{document.tags.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => onSelect(document)}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          عرض التفاصيل
        </button>
        
        <div className="flex space-x-1">
          <PermissionWrapper permission="download_document" userProfile={userProfile}>
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="تحميل"
            >
              ⬇️
            </button>
          </PermissionWrapper>
          
          <PermissionWrapper permission="edit_document" userProfile={userProfile}>
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              title="تعديل"
            >
              ✏️
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </div>
  );
}

// قائمة المستندات (List View)
function DocumentList({ documents, onSelect, onUpdate }: { 
  documents: Document[]; 
  onSelect: (doc: Document) => void;
  onUpdate: () => void;
}) {
  const { userProfile } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الملف
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الحجم
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              تاريخ الرفع
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              المستوى
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((document) => {
            const fileType = FILE_TYPES[document.type] || FILE_TYPES.other;
            return (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`text-lg ${fileType.color} mr-3`}>
                      {fileType.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {document.name}
                      </div>
                      {document.description && (
                        <div className="text-sm text-gray-500">
                          {document.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {document.formatFileSize(document.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {document.upload_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`}>
                    {document.access_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSelect(document)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      عرض
                    </button>
                    <PermissionWrapper permission="download_document" userProfile={userProfile}>
                      <button className="text-green-600 hover:text-green-900">
                        تحميل
                      </button>
                    </PermissionWrapper>
                    <PermissionWrapper permission="edit_document" userProfile={userProfile}>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        تعديل
                      </button>
                    </PermissionWrapper>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// نموذج رفع مستند جديد
function DocumentUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    tags: '',
    access_level: 'internal' as const,
    project_id: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedFile) newErrors.file = 'يجب اختيار ملف';
    if (!formData.category) newErrors.category = 'فئة المستند مطلوبة';
    if (!formData.access_level) newErrors.access_level = 'مستوى الوصول مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // هنا نرسل الملف والبيانات للـ API
      console.log('رفع مستند جديد:', { formData, file: selectedFile });
      
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('تم رفع المستند بنجاح!');
      onSuccess();
    } catch (error) {
      console.error('خطأ في رفع المستند:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">رفع مستند جديد</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اختيار الملف *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.file ? 'border-red-500' : 'border-gray-300'
              }`}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
            {selectedFile && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">الملف المحدد:</span>
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المستند
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="سيتم استخدام اسم الملف إذا ترك فارغاً"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفئة *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر الفئة</option>
                {DOCUMENT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="وصف مختصر للمستند"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الكلمات المفتاحية
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: عقد، مالي، مشروع (مفصولة بفاصلة)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مستوى الوصول *
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData({ ...formData, access_level: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">عام</option>
                <option value="internal">داخلي</option>
                <option value="confidential">سري</option>
                <option value="restricted">مقيد</option>
              </select>
            </div>
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
              {loading ? 'جارٍ الرفع...' : 'رفع المستند'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// نموذج تفاصيل المستند
function DocumentDetailsModal({ document, onClose, onUpdate }: { 
  document: Document; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const { userProfile } = useAuth();
  const fileType = FILE_TYPES[document.type] || FILE_TYPES.other;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل المستند</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معاينة الملف */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className={`text-6xl ${fileType.color} mb-4`}>
                {fileType.icon}
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">{document.name}</h4>
              <p className="text-sm text-gray-500 mb-4">{formatFileSize(document.size)}</p>
              
              <div className="space-y-2">
                <PermissionWrapper permission="download_document" userProfile={userProfile}>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    تحميل الملف
                  </button>
                </PermissionWrapper>
                
                <PermissionWrapper permission="preview_document" userProfile={userProfile}>
                  <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    معاينة
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          </div>

          {/* تفاصيل المستند */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">معلومات أساسية</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">الفئة:</span>
                  <p className="text-sm font-medium">{DOCUMENT_CATEGORIES.find(c => c.id === document.category)?.name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">مستوى الوصول:</span>
                  <p className="text-sm font-medium">{document.access_level}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">الإصدار:</span>
                  <p className="text-sm font-medium">v{document.version}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">عدد التحميلات:</span>
                  <p className="text-sm font-medium">{document.download_count}</p>
                </div>
              </div>
            </div>

            {document.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">الوصف</h5>
                <p className="text-sm text-gray-600">{document.description}</p>
              </div>
            )}

            {document.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">الكلمات المفتاحية</h5>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">معلومات الرفع</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">رفع بواسطة:</span>
                  <p className="text-sm font-medium">{document.uploaded_by}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">تاريخ الرفع:</span>
                  <p className="text-sm font-medium">{document.upload_date}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">آخر تعديل:</span>
                  <p className="text-sm font-medium">{document.last_modified}</p>
                </div>
                {document.approved_by && (
                  <div>
                    <span className="text-xs text-gray-500">اعتمد بواسطة:</span>
                    <p className="text-sm font-medium">{document.approved_by}</p>
                  </div>
                )}
              </div>
            </div>

            {document.project_name && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">المشروع المرتبط</h5>
                <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  {document.project_name}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            إغلاق
          </button>
          
          <PermissionWrapper permission="edit_document" userProfile={userProfile}>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              تعديل البيانات
            </button>
          </PermissionWrapper>
          
          <PermissionWrapper permission="delete_document" userProfile={userProfile}>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              حذف المستند
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </div>
  );
}
