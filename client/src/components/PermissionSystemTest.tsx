import React, { useState } from 'react';
import { UserProfile, Permission, PERMISSION_GROUPS, PERMISSION_LABELS } from '../types/permissions';
import { UserPermissionService } from '../services/userPermissionService';
import { checkPermissions, hasPermission, hasAnyPermission } from '../utils/permissions';

// 🧪 اختبار شامل لنظام الصلاحيات
// ===================================

interface TestResult {
  test: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
}

// بيانات اختبار وهمية
const mockUsers: UserProfile[] = [
  {
    id: '1',
    full_name: 'أحمد المدير العام',
    role: 'admin',
    permissions: PERMISSION_GROUPS.ADMIN,
    project_ids: ['proj-1', 'proj-2', 'proj-3'],
    created_at: '2024-01-01',
    projects: [
      { project_id: 'proj-1', project_name: 'مشروع أ', role_in_project: 'owner' },
      { project_id: 'proj-2', project_name: 'مشروع ب', role_in_project: 'owner' },
      { project_id: 'proj-3', project_name: 'مشروع ج', role_in_project: 'owner' }
    ]
  },
  {
    id: '2',
    full_name: 'فاطمة المديرة',
    role: 'manager',
    permissions: PERMISSION_GROUPS.MANAGER,
    project_ids: ['proj-1', 'proj-2'],
    created_at: '2024-01-15',
    projects: [
      { project_id: 'proj-1', project_name: 'مشروع أ', role_in_project: 'manager' },
      { project_id: 'proj-2', project_name: 'مشروع ب', role_in_project: 'manager' }
    ]
  },
  {
    id: '3',
    full_name: 'محمد المستخدم',
    role: 'user',
    permissions: PERMISSION_GROUPS.USER,
    project_ids: ['proj-1'],
    created_at: '2024-02-01',
    projects: [
      { project_id: 'proj-1', project_name: 'مشروع أ', role_in_project: 'member' }
    ]
  },
  {
    id: '4',
    full_name: 'سارة المشاهدة',
    role: 'viewer',
    permissions: PERMISSION_GROUPS.VIEWER,
    project_ids: ['proj-1'],
    created_at: '2024-02-15',
    projects: [
      { project_id: 'proj-1', project_name: 'مشروع أ', role_in_project: 'viewer' }
    ]
  }
];

export function PermissionSystemTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile>(mockUsers[0]);
  const [testing, setTesting] = useState(false);

  // تشغيل جميع الاختبارات
  const runAllTests = () => {
    setTesting(true);
    const results: TestResult[] = [];

    // اختبار صلاحيات المدير العام
    const admin = mockUsers[0];
    results.push(testPermission(admin, 'manage_system', true, 'المدير يملك صلاحية إدارة النظام'));
    results.push(testPermission(admin, 'delete_project', true, 'المدير يملك صلاحية حذف المشاريع'));
    results.push(testPermission(admin, 'view_dashboard', true, 'المدير يملك صلاحية عرض لوحة التحكم'));

    // اختبار صلاحيات المدير
    const manager = mockUsers[1];
    results.push(testPermission(manager, 'create_project', true, 'المدير يملك صلاحية إنشاء مشاريع'));
    results.push(testPermission(manager, 'manage_system', false, 'المدير لا يملك صلاحية إدارة النظام'));
    results.push(testPermission(manager, 'delete_user', false, 'المدير لا يملك صلاحية حذف المستخدمين'));

    // اختبار صلاحيات المستخدم العادي
    const user = mockUsers[2];
    results.push(testPermission(user, 'view_projects', true, 'المستخدم يملك صلاحية عرض المشاريع'));
    results.push(testPermission(user, 'create_project', false, 'المستخدم لا يملك صلاحية إنشاء مشاريع'));
    results.push(testPermission(user, 'edit_user', false, 'المستخدم لا يملك صلاحية تعديل المستخدمين'));

    // اختبار صلاحيات المشاهد
    const viewer = mockUsers[3];
    results.push(testPermission(viewer, 'view_documents', true, 'المشاهد يملك صلاحية عرض المستندات'));
    results.push(testPermission(viewer, 'upload_document', false, 'المشاهد لا يملك صلاحية رفع المستندات'));
    results.push(testPermission(viewer, 'create_transaction', false, 'المشاهد لا يملك صلاحية إنشاء معاملات'));

    // اختبار الصلاحيات المتعددة
    results.push(testMultiplePermissions(admin, ['view_projects', 'create_project'], true, false, 'المدير يملك صلاحيات متعددة (أي منها)'));
    results.push(testMultiplePermissions(user, ['create_project', 'delete_project'], false, false, 'المستخدم لا يملك صلاحيات إدارية'));
    results.push(testMultiplePermissions(manager, ['view_projects', 'create_project'], true, true, 'المدير يملك جميع الصلاحيات المطلوبة'));

    // اختبار الوصول للمشاريع
    results.push(testProjectAccess(admin, 'proj-1', true, 'المدير العام يصل لجميع المشاريع'));
    results.push(testProjectAccess(user, 'proj-1', true, 'المستخدم يصل للمشاريع المخصصة له'));
    results.push(testProjectAccess(user, 'proj-3', false, 'المستخدم لا يصل للمشاريع غير المخصصة'));

    setTestResults(results);
    setTesting(false);
  };

  // اختبار صلاحية واحدة
  const testPermission = (user: UserProfile, permission: Permission, expected: boolean, description: string): TestResult => {
    const actual = hasPermission(user, permission);
    return {
      test: description,
      expected,
      actual,
      passed: actual === expected
    };
  };

  // اختبار صلاحيات متعددة
  const testMultiplePermissions = (user: UserProfile, permissions: Permission[], expected: boolean, requireAll: boolean, description: string): TestResult => {
    const actual = requireAll 
      ? permissions.every(p => hasPermission(user, p))
      : hasAnyPermission(user, permissions);
    return {
      test: description,
      expected,
      actual,
      passed: actual === expected
    };
  };

  // اختبار الوصول للمشاريع
  const testProjectAccess = (user: UserProfile, projectId: string, expected: boolean, description: string): TestResult => {
    const actual = UserPermissionService.canAccessProject(user, projectId);
    return {
      test: description,
      expected,
      actual,
      passed: actual === expected
    };
  };

  // حساب إحصائيات الاختبارات
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧪 اختبار نظام الصلاحيات
        </h1>
        <p className="text-gray-600">
          اختبار شامل لجميع وظائف نظام الصلاحيات والتحقق من صحة عملها
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800">إجمالي الصلاحيات</h3>
          <p className="text-2xl font-bold text-blue-900">{Object.keys(PERMISSION_LABELS).length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800">الاختبارات المنجحة</h3>
          <p className="text-2xl font-bold text-green-900">{passedTests}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800">الاختبارات الفاشلة</h3>
          <p className="text-2xl font-bold text-red-900">{totalTests - passedTests}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-800">معدل النجاح</h3>
          <p className="text-2xl font-bold text-purple-900">{successRate}%</p>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={runAllTests}
          disabled={testing}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? '🔄 جارٍ الاختبار...' : '🚀 تشغيل جميع الاختبارات'}
        </button>
        
        <button
          onClick={() => setTestResults([])}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          🗑️ مسح النتائج
        </button>
      </div>

      {/* عرض المستخدمين للاختبار */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* اختيار المستخدم */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            👤 بيانات المستخدم للاختبار
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر مستخدم:
            </label>
            <select
              value={selectedUser.id}
              onChange={(e) => setSelectedUser(mockUsers.find(u => u.id === e.target.value) || mockUsers[0])}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {mockUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-medium">الاسم:</span> {selectedUser.full_name}
            </div>
            <div>
              <span className="font-medium">الدور:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                selectedUser.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                selectedUser.role === 'user' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedUser.role === 'admin' ? 'مدير عام' :
                 selectedUser.role === 'manager' ? 'مدير' :
                 selectedUser.role === 'user' ? 'مستخدم' : 'مشاهد'}
              </span>
            </div>
            <div>
              <span className="font-medium">عدد الصلاحيات:</span> {selectedUser.permissions.length}
            </div>
            <div>
              <span className="font-medium">المشاريع:</span> {selectedUser.projects.length}
            </div>
          </div>
        </div>

        {/* اختبار صلاحية محددة */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 اختبار صلاحية محددة
          </h3>
          
          <PermissionChecker user={selectedUser} />
        </div>
      </div>

      {/* نتائج الاختبارات */}
      {testResults.length > 0 && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📊 نتائج الاختبارات
          </h3>
          
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 text-lg ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <span className="text-gray-900">{result.test}</span>
                </div>
                <div className="text-sm text-gray-600">
                  متوقع: {result.expected ? 'نعم' : 'لا'} | 
                  فعلي: {result.actual ? 'نعم' : 'لا'}
                </div>
              </div>
            ))}
          </div>

          {/* ملخص النتائج */}
          <div className={`mt-6 p-4 rounded-lg ${
            successRate === 100 ? 'bg-green-50 border border-green-200' :
            successRate >= 80 ? 'bg-yellow-50 border border-yellow-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {successRate === 100 ? '🎉 جميع الاختبارات نجحت!' :
                 successRate >= 80 ? '⚠️ معظم الاختبارات نجحت' :
                 '❌ فشل في عدة اختبارات'}
              </span>
              <span className="text-lg font-bold">
                {passedTests}/{totalTests} ({successRate}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* عرض جميع الصلاحيات */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          📋 جميع الصلاحيات المتاحة
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PERMISSION_LABELS).map(([permission, label]) => {
            const hasAccess = hasPermission(selectedUser, permission as Permission);
            return (
              <div
                key={permission}
                className={`p-3 rounded-lg border ${
                  hasAccess ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{permission}</div>
                  </div>
                  <span className={`text-lg ${hasAccess ? 'text-green-600' : 'text-gray-400'}`}>
                    {hasAccess ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// مكون فحص الصلاحيات التفاعلي
function PermissionChecker({ user }: { user: UserProfile }) {
  const [selectedPermission, setSelectedPermission] = useState<Permission>('view_dashboard');
  const [testResult, setTestResult] = useState<string>('');

  const testPermission = () => {
    const hasAccess = hasPermission(user, selectedPermission);
    const label = PERMISSION_LABELS[selectedPermission];
    
    setTestResult(
      hasAccess 
        ? `✅ ${user.full_name} يملك صلاحية "${label}"`
        : `❌ ${user.full_name} لا يملك صلاحية "${label}"`
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اختر صلاحية للاختبار:
        </label>
        <select
          value={selectedPermission}
          onChange={(e) => setSelectedPermission(e.target.value as Permission)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
            <option key={permission} value={permission}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={testPermission}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
      >
        اختبار الصلاحية
      </button>

      {testResult && (
        <div className={`p-3 rounded-lg ${
          testResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {testResult}
        </div>
      )}
    </div>
  );
}

export default PermissionSystemTest;
