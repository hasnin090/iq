# 🔐 دليل نظام الصلاحيات المتكامل - React + TypeScript + Supabase

## 📋 فهرس المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البنية والملفات](#البنية-والملفات)
3. [التثبيت والإعداد](#التثبيت-والإعداد)
4. [الاستخدام الأساسي](#الاستخدام-الأساسي)
5. [المكونات الرئيسية](#المكونات-الرئيسية)
6. [أمثلة عملية](#أمثلة-عملية)
7. [أفضل الممارسات](#أفضل-الممارسات)

---

## 🎯 نظرة عامة

نظام صلاحيات شامل ومتقدم للتطبيقات المبنية بـ React وTypeScript باستخدام Supabase كمصدر للمصادقة والبيانات. النظام يدعم:

- **4 أدوار رئيسية**: Admin, Manager, User, Viewer
- **50+ صلاحية مفصلة** لجميع أجزاء التطبيق
- **حماية على مستوى المسارات والمكونات**
- **إدارة المشاريع** مع تحكم دقيق في الوصول
- **واجهة عربية كاملة** مع دعم RTL
- **تكامل كامل مع Supabase**

---

## 📁 البنية والملفات

```
src/
├── types/
│   └── permissions.ts          # تعريف الأنواع والصلاحيات
├── services/
│   └── userPermissionService.ts # خدمات إدارة المستخدمين
├── context/
│   └── AuthContext.tsx         # سياق المصادقة والحالة
├── components/
│   ├── guards.tsx              # مكونات الحماية
│   ├── PermissionWrapper.tsx   # مكونات التغليف
│   └── ui/
│       └── PermissionComponents.tsx # مكونات واجهة جاهزة
├── config/
│   └── routes.ts               # تكوين المسارات
└── hooks/
    └── usePermissions.ts       # React Hooks مخصصة
```

---

## ⚙️ التثبيت والإعداد

### 1. تثبيت المتطلبات

```bash
npm install @supabase/supabase-js
npm install @types/react @types/react-dom
```

### 2. إعداد متغيرات البيئة

```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. إعداد قاعدة البيانات

قم بإنشاء الجداول التالية في Supabase:

```sql
-- جدول ملفات المستخدمين
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'user', 'viewer')) DEFAULT 'user',
  permissions TEXT[],
  project_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- جدول أعضاء المشاريع
CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  role_in_project TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### 4. إعداد التطبيق

```tsx
// App.tsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Router } from './components/Router';

function App() {
  return (
    <AuthProvider>
      <div className="App" dir="rtl">
        <Router />
      </div>
    </AuthProvider>
  );
}

export default App;
```

---

## 🚀 الاستخدام الأساسي

### 1. استخدام سياق المصادقة

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { userProfile, hasPermission, signOut } = useAuth();

  if (hasPermission('view_projects')) {
    return <ProjectList />;
  }

  return <div>ليس لديك صلاحية لعرض المشاريع</div>;
}
```

### 2. حماية المسارات

```tsx
import { ProtectedRoute } from './components/guards';

function App() {
  const { userProfile } = useAuth();

  return (
    <Router>
      <Route path="/login" component={LoginPage} />
      
      <ProtectedRoute 
        path="/admin" 
        requiredPermission="manage_system"
        userProfile={userProfile}
      >
        <AdminDashboard />
      </ProtectedRoute>
      
      <ProtectedRoute 
        path="/projects" 
        requiredPermission="view_projects"
        userProfile={userProfile}
      >
        <ProjectList />
      </ProtectedRoute>
    </Router>
  );
}
```

### 3. حماية عناصر الواجهة

```tsx
import { PermissionWrapper, AdminOnly } from './components/PermissionWrapper';

function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <div>
      <h1>لوحة التحكم</h1>
      
      {/* زر محمي بصلاحية */}
      <PermissionWrapper 
        permission="create_project" 
        userProfile={userProfile}
      >
        <button>إنشاء مشروع جديد</button>
      </PermissionWrapper>

      {/* قسم خاص بالمديرين فقط */}
      <AdminOnly userProfile={userProfile}>
        <div>إعدادات المدير</div>
      </AdminOnly>
    </div>
  );
}
```

---

## 🧩 المكونات الرئيسية

### 1. مكونات الحماية (Guards)

#### `ProtectedRoute`
حماية المسارات بناءً على الصلاحيات:

```tsx
<ProtectedRoute 
  requiredPermission={['view_projects', 'create_project']}
  requireAll={false} // OR logic
  userProfile={userProfile}
  fallback={<div>غير مصرح</div>}
>
  <ProjectDashboard />
</ProtectedRoute>
```

#### `PermissionGuard`
حماية عناصر محددة:

```tsx
<PermissionGuard 
  permission="delete_project"
  userProfile={userProfile}
  showFallback={true}
  fallback={<span>مخفي</span>}
>
  <DeleteButton />
</PermissionGuard>
```

#### `RoleBasedRender`
عرض محتوى مختلف حسب الدور:

```tsx
<RoleBasedRender
  userProfile={userProfile}
  adminContent={<AdminPanel />}
  managerContent={<ManagerPanel />}
  userContent={<UserPanel />}
  viewerContent={<ViewerPanel />}
/>
```

### 2. مكونات التغليف (Wrappers)

#### `PermissionWrapper`
التغليف الأساسي:

```tsx
<PermissionWrapper 
  permission="edit_project"
  userProfile={userProfile}
  className="custom-class"
  wrapperTag="section"
>
  <EditForm />
</PermissionWrapper>
```

#### أدوار محددة

```tsx
{/* مديرين فقط */}
<AdminOnly userProfile={userProfile}>
  <SystemSettings />
</AdminOnly>

{/* مديري المشاريع */}
<ManagerOnly userProfile={userProfile}>
  <ProjectManagement />
</ManagerOnly>

{/* أعضاء مشروع محدد */}
<ProjectMemberOnly userProfile={userProfile} projectId="123">
  <ProjectDetails />
</ProjectMemberOnly>
```

#### `PermissionTabs`
تبويبات محمية:

```tsx
<PermissionTabs
  userProfile={userProfile}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={[
    {
      id: 'overview',
      label: 'نظرة عامة',
      content: <Overview />
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      permission: 'edit_settings',
      content: <Settings />
    }
  ]}
/>
```

### 3. مكونات واجهة جاهزة

#### `ActionButton`
أزرار محمية:

```tsx
<ActionButton
  label="حذف المشروع"
  permission="delete_project"
  variant="danger"
  onClick={handleDelete}
  icon={<DeleteIcon />}
/>
```

#### `DashboardCard`
بطاقات لوحة التحكم:

```tsx
<DashboardCard
  title="إجمالي المشاريع"
  value={projectCount}
  permission="view_projects"
  icon={<ProjectIcon />}
  onClick={() => navigate('/projects')}
/>
```

#### `NavigationMenu`
قائمة تنقل محمية:

```tsx
<NavigationMenu
  items={[
    {
      id: 'projects',
      label: 'المشاريع',
      href: '/projects',
      permission: 'view_projects',
      icon: <ProjectIcon />
    },
    {
      id: 'users',
      label: 'المستخدمين',
      href: '/users',
      role: 'admin' // خاص بالمديرين
    }
  ]}
/>
```

---

## 💡 أمثلة عملية

### 1. صفحة إدارة المستخدمين

```tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from '../components/guards';
import { ActionButton, DashboardCard } from '../components/ui/PermissionComponents';

function UserManagement() {
  const { userProfile, hasPermission } = useAuth();

  return (
    <ProtectedRoute 
      requiredPermission="view_users"
      userProfile={userProfile}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          
          <ActionButton
            label="إضافة مستخدم"
            permission="create_user"
            variant="primary"
            onClick={() => setShowAddModal(true)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="إجمالي المستخدمين"
            value={totalUsers}
            permission="view_users"
            icon={<UsersIcon />}
          />
          
          <DashboardCard
            title="المستخدمين النشطين"
            value={activeUsers}
            permission="view_users"
            icon={<ActiveIcon />}
          />
          
          <DashboardCard
            title="المديرين"
            value={adminCount}
            permission="manage_users"
            icon={<AdminIcon />}
          />
        </div>

        <UserList />
      </div>
    </ProtectedRoute>
  );
}
```

### 2. نظام التنقل الرئيسي

```tsx
import React from 'react';
import { NavigationMenu } from '../components/ui/PermissionComponents';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { userProfile } = useAuth();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      href: '/dashboard',
      icon: <DashboardIcon />,
      permission: 'view_dashboard'
    },
    {
      id: 'projects',
      label: 'المشاريع',
      href: '/projects',
      icon: <ProjectIcon />,
      permission: 'view_projects',
      children: [
        {
          id: 'new-project',
          label: 'مشروع جديد',
          href: '/projects/new',
          permission: 'create_project'
        },
        {
          id: 'project-reports',
          label: 'تقارير المشاريع',
          href: '/projects/reports',
          permission: 'view_reports'
        }
      ]
    },
    {
      id: 'users',
      label: 'المستخدمين',
      href: '/users',
      icon: <UsersIcon />,
      role: 'admin' // خاص بالمديرين فقط
    },
    {
      id: 'accounting',
      label: 'المحاسبة',
      href: '/accounting',
      icon: <CalculatorIcon />,
      permission: 'view_accounting'
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <NavigationMenu 
        items={navigationItems}
        className="h-full"
      />
    </div>
  );
}
```

### 3. إدارة صلاحيات المستخدم

```tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PermissionWrapper, AdminOnly } from '../components/PermissionWrapper';

function UserPermissions({ userId }: { userId: string }) {
  const { userProfile, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState('user');

  const handleRoleChange = async () => {
    const success = await updateUserRole(userId, selectedRole);
    if (success) {
      alert('تم تحديث الدور بنجاح');
    }
  };

  return (
    <AdminOnly userProfile={userProfile}>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">إدارة الصلاحيات</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              الدور
            </label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="viewer">مشاهد</option>
              <option value="user">مستخدم</option>
              <option value="manager">مدير</option>
              <option value="admin">مدير عام</option>
            </select>
          </div>

          <PermissionWrapper 
            permission="assign_permissions"
            userProfile={userProfile}
          >
            <button
              onClick={handleRoleChange}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              حفظ التغييرات
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </AdminOnly>
  );
}
```

---

## 🎯 أفضل الممارسات

### 1. هيكلة الصلاحيات

```typescript
// استخدم أسماء وصفية ومنطقية
const permissions = [
  'view_projects',      // ✅ واضح ومفهوم
  'edit_project_basic', // ✅ محدد ودقيق
  'delete_all_projects' // ✅ يوضح النطاق
];

// تجنب الأسماء العامة
const badPermissions = [
  'access',    // ❌ غير محدد
  'manage',    // ❌ واسع جداً
  'permission' // ❌ غير وصفي
];
```

### 2. تجميع الصلاحيات

```typescript
// استخدم مجموعات منطقية
const PROJECT_PERMISSIONS = [
  'view_projects',
  'create_project',
  'edit_project',
  'delete_project'
];

const FINANCIAL_PERMISSIONS = [
  'view_transactions',
  'create_transaction',
  'approve_transaction'
];
```

### 3. التحقق من الصلاحيات

```tsx
// استخدم التحقق المبكر
function ProjectForm() {
  const { hasPermission } = useAuth();

  // تحقق مبكر من الصلاحية
  if (!hasPermission('edit_project')) {
    return <AccessDenied />;
  }

  return <ProjectFormContent />;
}

// استخدم Loading States
function ProjectList() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PermissionWrapper permission="view_projects" userProfile={userProfile}>
      <ProjectListContent />
    </PermissionWrapper>
  );
}
```

### 4. معالجة الأخطاء

```tsx
function usePermissionActions() {
  const { hasPermission } = useAuth();

  const executeWithPermission = (
    permission: Permission,
    action: () => void,
    fallback?: () => void
  ) => {
    if (hasPermission(permission)) {
      try {
        action();
      } catch (error) {
        console.error('خطأ في تنفيذ العملية:', error);
        alert('حدث خطأ أثناء تنفيذ العملية');
      }
    } else {
      if (fallback) {
        fallback();
      } else {
        alert('ليس لديك صلاحية لتنفيذ هذه العملية');
      }
    }
  };

  return { executeWithPermission };
}
```

### 5. الأداء والتحسين

```tsx
// استخدم useMemo للحسابات المعقدة
function UserDashboard() {
  const { userProfile } = useAuth();

  const allowedMenuItems = useMemo(() => {
    return MENU_ITEMS.filter(item => 
      hasPermission(userProfile, item.requiredPermission)
    );
  }, [userProfile]);

  return <Menu items={allowedMenuItems} />;
}

// استخدم React.memo للمكونات الثقيلة
const PermissionCard = React.memo(({ permission, userProfile, children }) => {
  const hasAccess = hasPermission(userProfile, permission);
  
  if (!hasAccess) return null;
  
  return <div>{children}</div>;
});
```

---

## 🔧 استكشاف الأخطاء

### المشاكل الشائعة وحلولها

1. **المستخدم لا يظهر له المحتوى رغم وجود الصلاحية**
   ```tsx
   // تأكد من تحديث userProfile
   const { refreshProfile } = useAuth();
   useEffect(() => {
     refreshProfile();
   }, []);
   ```

2. **بطء في تحميل الصلاحيات**
   ```tsx
   // استخدم التحميل المتدرج
   const [permissionsLoaded, setPermissionsLoaded] = useState(false);
   
   useEffect(() => {
     if (userProfile?.permissions) {
       setPermissionsLoaded(true);
     }
   }, [userProfile]);
   ```

3. **صلاحيات غير محدثة بعد تغيير الدور**
   ```tsx
   // فرض إعادة تحميل البيانات
   const handleRoleUpdate = async () => {
     await updateUserRole(userId, newRole);
     await refreshProfile(); // إعادة تحميل البيانات
   };
   ```

---

## 📞 الدعم والمساعدة

للحصول على المساعدة أو الإبلاغ عن مشاكل:

1. راجع هذا الدليل أولاً
2. تحقق من console logs للأخطاء
3. تأكد من صحة إعداد Supabase
4. تحقق من صحة RLS policies في قاعدة البيانات

---

## 🎉 خلاصة

نظام الصلاحيات هذا يوفر:

- ✅ **أمان شامل** على جميع مستويات التطبيق
- ✅ **مرونة عالية** في التخصيص والتكوين
- ✅ **تجربة مستخدم ممتازة** مع رسائل واضحة
- ✅ **كود نظيف وقابل للصيانة**
- ✅ **دعم كامل للغة العربية** واتجاه RTL
- ✅ **تكامل سلس مع Supabase**

النظام جاهز للاستخدام الفوري في أي تطبيق React/TypeScript! 🚀
