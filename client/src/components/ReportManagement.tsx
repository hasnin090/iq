import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './guards';
import { PermissionWrapper } from './PermissionWrapper';
import { ActionButton, DashboardCard } from './ui/PermissionComponents';

// 📊 نظام التقارير والتحليلات المتكامل
// =====================================

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'project' | 'employee' | 'custom';
  description: string;
  category: string;
  parameters: ReportParameter[];
  created_by: string;
  created_at: string;
  last_generated: string;
  access_level: 'public' | 'internal' | 'confidential';
  is_favorite: boolean;
  generation_count: number;
  file_formats: string[];
}

interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'daterange' | 'select' | 'multiselect' | 'text' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  default_value?: any;
}

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'gauge';
  data: any;
  config: any;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
}

const REPORT_CATEGORIES = [
  { id: 'financial', name: 'التقارير المالية', icon: '💰', color: 'green' },
  { id: 'projects', name: 'تقارير المشاريع', icon: '🏗️', color: 'blue' },
  { id: 'hr', name: 'تقارير الموارد البشرية', icon: '👥', color: 'purple' },
  { id: 'operations', name: 'التقارير التشغيلية', icon: '⚙️', color: 'orange' },
  { id: 'analytics', name: 'التحليلات المتقدمة', icon: '📈', color: 'indigo' },
  { id: 'custom', name: 'تقارير مخصصة', icon: '🔧', color: 'gray' }
];

const PREDEFINED_REPORTS: Report[] = [
  {
    id: '1',
    name: 'تقرير الأرباح والخسائر',
    type: 'financial',
    description: 'تقرير شامل للأرباح والخسائر خلال فترة محددة',
    category: 'financial',
    parameters: [
      {
        name: 'date_from',
        label: 'من تاريخ',
        type: 'date',
        required: true
      },
      {
        name: 'date_to',
        label: 'إلى تاريخ',
        type: 'date',
        required: true
      },
      {
        name: 'include_projects',
        label: 'تضمين المشاريع',
        type: 'multiselect',
        required: false,
        options: [
          { value: 'project1', label: 'تطوير نظام المحاسبة' },
          { value: 'project2', label: 'تحديث الموقع الإلكتروني' }
        ]
      }
    ],
    created_by: 'أحمد محمد',
    created_at: '2024-01-15',
    last_generated: '2024-03-15',
    access_level: 'confidential',
    is_favorite: true,
    generation_count: 25,
    file_formats: ['pdf', 'excel', 'csv']
  },
  {
    id: '2',
    name: 'تقرير أداء المشاريع',
    type: 'project',
    description: 'تحليل أداء المشاريع الجارية والمكتملة',
    category: 'projects',
    parameters: [
      {
        name: 'project_status',
        label: 'حالة المشروع',
        type: 'select',
        required: false,
        options: [
          { value: 'all', label: 'جميع الحالات' },
          { value: 'active', label: 'نشط' },
          { value: 'completed', label: 'مكتمل' },
          { value: 'on_hold', label: 'متوقف' }
        ],
        default_value: 'all'
      },
      {
        name: 'date_range',
        label: 'الفترة الزمنية',
        type: 'daterange',
        required: true
      }
    ],
    created_by: 'سارة أحمد',
    created_at: '2024-02-01',
    last_generated: '2024-03-14',
    access_level: 'internal',
    is_favorite: false,
    generation_count: 18,
    file_formats: ['pdf', 'excel']
  },
  {
    id: '3',
    name: 'تقرير الحضور والغياب',
    type: 'employee',
    description: 'تقرير تفصيلي لحضور وغياب الموظفين',
    category: 'hr',
    parameters: [
      {
        name: 'month',
        label: 'الشهر',
        type: 'select',
        required: true,
        options: [
          { value: '2024-01', label: 'يناير 2024' },
          { value: '2024-02', label: 'فبراير 2024' },
          { value: '2024-03', label: 'مارس 2024' }
        ]
      },
      {
        name: 'departments',
        label: 'الأقسام',
        type: 'multiselect',
        required: false,
        options: [
          { value: 'dev', label: 'تطوير البرمجيات' },
          { value: 'marketing', label: 'التسويق' },
          { value: 'hr', label: 'الموارد البشرية' }
        ]
      }
    ],
    created_by: 'محمد علي',
    created_at: '2024-02-15',
    last_generated: '2024-03-10',
    access_level: 'internal',
    is_favorite: true,
    generation_count: 12,
    file_formats: ['pdf', 'excel', 'csv']
  }
];

// الصفحة الرئيسية للتقارير
export function ReportsPage() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>(PREDEFINED_REPORTS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'analytics'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, [selectedCategory]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // هنا نحمل التقارير من API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('خطأ في تحميل التقارير:', error);
    } finally {
      setLoading(false);
    }
  };

  // فلترة التقارير حسب الفئة
  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  // حساب الإحصائيات
  const totalReports = reports.length;
  const favoriteReports = reports.filter(r => r.is_favorite).length;
  const recentlyGenerated = reports.filter(r => {
    const lastGen = new Date(r.last_generated);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastGen > weekAgo;
  }).length;

  return (
    <ProtectedRoute requiredPermission="view_reports" userProfile={userProfile}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
            <p className="text-gray-600">إنشاء وإدارة التقارير والتحليلات التفصيلية</p>
          </div>
          
          <div className="flex space-x-2">
            <PermissionWrapper permission="create_report" userProfile={userProfile}>
              <ActionButton
                label="تقرير جديد"
                permission="create_report"
                variant="primary"
                icon="📊+"
                onClick={() => setShowReportForm(true)}
              />
            </PermissionWrapper>
            <PermissionWrapper permission="export_reports" userProfile={userProfile}>
              <ActionButton
                label="تصدير التقارير"
                permission="export_reports"
                variant="secondary"
                icon="📤"
                onClick={() => alert('تصدير جميع التقارير')}
              />
            </PermissionWrapper>
          </div>
        </div>

        {/* إحصائيات التقارير */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="إجمالي التقارير"
            value={totalReports.toString()}
            icon="📊"
            className="border-r-4 border-blue-500"
            permission="view_reports"
          />
          <DashboardCard
            title="التقارير المفضلة"
            value={favoriteReports.toString()}
            icon="⭐"
            className="border-r-4 border-yellow-500"
            permission="view_reports"
          />
          <DashboardCard
            title="تم إنشاؤها هذا الأسبوع"
            value={recentlyGenerated.toString()}
            icon="🆕"
            className="border-r-4 border-green-500"
            permission="view_reports"
          />
          <DashboardCard
            title="التقارير المجدولة"
            value="5"
            icon="⏰"
            className="border-r-4 border-purple-500"
            permission="view_reports"
          />
        </div>

        {/* تبويبات النظام */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                لوحة المعلومات
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                التقارير
              </button>
              <PermissionWrapper permission="view_analytics" userProfile={userProfile}>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  التحليلات المتقدمة
                </button>
              </PermissionWrapper>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'reports' && (
              <ReportsTab 
                reports={filteredReports}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSelectReport={setSelectedReport}
                onUpdate={loadReports}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </div>
        </div>

        {/* نموذج إنشاء تقرير جديد */}
        {showReportForm && (
          <ReportCreateModal
            onClose={() => setShowReportForm(false)}
            onSuccess={() => {
              setShowReportForm(false);
              loadReports();
            }}
          />
        )}

        {/* نموذج تشغيل التقرير */}
        {selectedReport && (
          <ReportGenerateModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onGenerate={() => {
              setSelectedReport(null);
              alert('تم إنشاء التقرير بنجاح!');
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// تبويب لوحة المعلومات
function DashboardTab() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* خريطة أداء المشاريع */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">أداء المشاريع</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">تطوير نظام المحاسبة</span>
              <span className="text-sm font-medium text-green-600">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">تحديث الموقع الإلكتروني</span>
              <span className="text-sm font-medium text-blue-600">60%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">تطبيق الهاتف المحمول</span>
              <span className="text-sm font-medium text-yellow-600">30%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
        </div>

        {/* الإيرادات الشهرية */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">الإيرادات الشهرية</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">مارس 2024</span>
              <span className="text-lg font-bold text-green-600">125,000 ر.س</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">فبراير 2024</span>
              <span className="text-lg font-medium text-gray-900">98,000 ر.س</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">يناير 2024</span>
              <span className="text-lg font-medium text-gray-900">87,500 ر.س</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">معدل النمو</span>
                <span className="text-sm font-bold text-green-600">+27.6%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية السريعة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">توزيع المصروفات</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
              <span className="text-sm text-gray-600 flex-1">رواتب</span>
              <span className="text-sm font-medium">40%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
              <span className="text-sm text-gray-600 flex-1">تسويق</span>
              <span className="text-sm font-medium">25%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              <span className="text-sm text-gray-600 flex-1">مصاريف إدارية</span>
              <span className="text-sm font-medium">20%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
              <span className="text-sm text-gray-600 flex-1">أخرى</span>
              <span className="text-sm font-medium">15%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">حالة الموظفين</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">حاضر اليوم</span>
              <span className="text-lg font-bold text-green-600">15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">في إجازة</span>
              <span className="text-lg font-medium text-yellow-600">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">غائب</span>
              <span className="text-lg font-medium text-red-600">1</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">معدل الحضور</span>
                <span className="text-sm font-bold text-green-600">94.7%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">التقارير الأكثر استخداماً</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">الأرباح والخسائر</span>
              <span className="text-sm font-medium">25</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">أداء المشاريع</span>
              <span className="text-sm font-medium">18</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">الحضور والغياب</span>
              <span className="text-sm font-medium">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// تبويب التقارير
function ReportsTab({ 
  reports, 
  selectedCategory, 
  onCategoryChange, 
  onSelectReport, 
  onUpdate 
}: {
  reports: Report[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onSelectReport: (report: Report) => void;
  onUpdate: () => void;
}) {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      {/* فلاتر الفئات */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            selectedCategory === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          جميع التقارير
        </button>
        
        {REPORT_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
              selectedCategory === category.id
                ? `bg-${category.color}-100 text-${category.color}-700`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* قائمة التقارير */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <ReportCard 
            key={report.id} 
            report={report} 
            onSelect={onSelectReport}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تقارير</h3>
          <p className="text-gray-500">لم يتم العثور على تقارير في هذه الفئة</p>
        </div>
      )}
    </div>
  );
}

// تبويب التحليلات المتقدمة
function AnalyticsTab() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-600 text-2xl">🔬</span>
          </div>
          <div className="mr-3">
            <h3 className="text-lg font-medium text-blue-900">التحليلات المتقدمة</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>استخدم أدوات التحليل المتقدمة لاستخراج رؤى عميقة من بياناتك</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تحليل الاتجاهات */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">تحليل الاتجاهات المالية</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">نمو الإيرادات (شهرياً)</span>
              <span className="text-sm font-bold text-green-600">+15.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">انخفاض التكاليف</span>
              <span className="text-sm font-bold text-red-600">-8.7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">هامش الربح</span>
              <span className="text-sm font-bold text-blue-600">23.4%</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                عرض التحليل التفصيلي
              </button>
            </div>
          </div>
        </div>

        {/* التنبؤات */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">التنبؤات المالية</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">الإيرادات المتوقعة (الشهر القادم)</span>
              <span className="text-sm font-bold text-green-600">142,000 ر.س</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">المصروفات المتوقعة</span>
              <span className="text-sm font-bold text-orange-600">95,000 ر.س</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">الربح المتوقع</span>
              <span className="text-sm font-bold text-blue-600">47,000 ر.س</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                تحديث النموذج التنبؤي
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* أدوات التحليل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">تحليل البيانات</h4>
          <p className="text-sm text-gray-600 mb-4">تحليل متقدم للبيانات باستخدام الذكاء الاصطناعي</p>
          <PermissionWrapper permission="advanced_analytics" userProfile={userProfile}>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              بدء التحليل
            </button>
          </PermissionWrapper>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">مؤشرات الأداء</h4>
          <p className="text-sm text-gray-600 mb-4">متابعة مؤشرات الأداء الرئيسية (KPIs)</p>
          <PermissionWrapper permission="view_kpis" userProfile={userProfile}>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              عرض المؤشرات
            </button>
          </PermissionWrapper>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">التقارير الفورية</h4>
          <p className="text-sm text-gray-600 mb-4">إنشاء تقارير فورية بنقرة واحدة</p>
          <PermissionWrapper permission="instant_reports" userProfile={userProfile}>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              إنشاء فوري
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </div>
  );
}

// بطاقة التقرير
function ReportCard({ report, onSelect, onUpdate }: { 
  report: Report; 
  onSelect: (report: Report) => void;
  onUpdate: () => void;
}) {
  const { userProfile } = useAuth();

  const getCategoryInfo = (categoryId: string) => {
    return REPORT_CATEGORIES.find(cat => cat.id === categoryId) || REPORT_CATEGORIES[5];
  };

  const categoryInfo = getCategoryInfo(report.category);

  const toggleFavorite = async () => {
    // هنا نرسل طلب لتغيير حالة المفضلة
    alert(`${report.is_favorite ? 'إزالة من' : 'إضافة إلى'} المفضلة: ${report.name}`);
    onUpdate();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{categoryInfo.icon}</span>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
            <p className="text-sm text-gray-500">{categoryInfo.name}</p>
          </div>
        </div>
        
        <button
          onClick={toggleFavorite}
          className={`p-1 rounded ${report.is_favorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
        >
          ⭐
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {report.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>تم إنشاؤه بواسطة:</span>
          <span>{report.created_by}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>آخر تشغيل:</span>
          <span>{report.last_generated}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>مرات التشغيل:</span>
          <span>{report.generation_count}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {report.file_formats.map(format => (
          <span key={format} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {format.toUpperCase()}
          </span>
        ))}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onSelect(report)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          تشغيل التقرير
        </button>
        
        <PermissionWrapper permission="edit_report" userProfile={userProfile}>
          <button className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700">
            تعديل
          </button>
        </PermissionWrapper>
      </div>
    </div>
  );
}

// نموذج إنشاء تقرير جديد
function ReportCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as const,
    category: '',
    description: '',
    access_level: 'internal' as const
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('إنشاء تقرير جديد:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('تم إنشاء التقرير بنجاح!');
      onSuccess();
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">إنشاء تقرير جديد</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم التقرير</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="financial">مالي</option>
                <option value="project">مشروع</option>
                <option value="employee">موظفين</option>
                <option value="custom">مخصص</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر الفئة</option>
                {REPORT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">مستوى الوصول</label>
            <select
              value={formData.access_level}
              onChange={(e) => setFormData({ ...formData, access_level: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">عام</option>
              <option value="internal">داخلي</option>
              <option value="confidential">سري</option>
            </select>
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
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء التقرير'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// نموذج تشغيل التقرير
function ReportGenerateModal({ report, onClose, onGenerate }: { 
  report: Report; 
  onClose: () => void; 
  onGenerate: () => void;
}) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [selectedFormat, setSelectedFormat] = useState(report.file_formats[0]);
  const [loading, setLoading] = useState(false);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters({ ...parameters, [paramName]: value });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      console.log('تشغيل التقرير:', { report: report.id, parameters, format: selectedFormat });
      await new Promise(resolve => setTimeout(resolve, 2000));
      onGenerate();
    } catch (error) {
      console.error('خطأ في تشغيل التقرير:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">تشغيل التقرير: {report.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{report.description}</p>

          {/* معاملات التقرير */}
          {report.parameters.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">معاملات التقرير</h4>
              <div className="space-y-3">
                {report.parameters.map(param => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label} {param.required && '*'}
                    </label>
                    
                    {param.type === 'date' && (
                      <input
                        type="date"
                        value={parameters[param.name] || param.default_value || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={param.required}
                      />
                    )}
                    
                    {param.type === 'select' && (
                      <select
                        value={parameters[param.name] || param.default_value || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={param.required}
                      >
                        <option value="">اختر...</option>
                        {param.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {param.type === 'multiselect' && (
                      <select
                        multiple
                        value={parameters[param.name] || []}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          handleParameterChange(param.name, values);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        size={3}
                      >
                        {param.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* تنسيق الملف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تنسيق الملف</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {report.file_formats.map(format => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء التقرير'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
