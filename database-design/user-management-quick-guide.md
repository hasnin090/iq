# دليل سريع: إدارة المستخدمين في النظام الحالي

## 🎯 نظرة عامة

هذا الدليل يوضح كيفية إضافة وتعديل المستخدمين في نظام المحاسبة العربي الحالي، سواء كنت تستخدم قاعدة البيانات مباشرة أو من خلال التطبيق.

## 🔧 الطرق المتاحة

### 1. 🗄️ من خلال قاعدة البيانات مباشرة (SQL)

#### إضافة مستخدم جديد:
```sql
-- إضافة مستخدم عادي
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    phone, 
    is_active
) VALUES (
    'newuser@company.com',
    '$2b$12$example_hashed_password', -- استخدم bcrypt لتشفير كلمة المرور
    'محمد أحمد الجديد',
    'user',
    '+964771234999',
    true
);
```

#### تحديث معلومات المستخدم:
```sql
-- تحديث الاسم والهاتف
UPDATE users 
SET 
    full_name = 'محمد أحمد العلي المحدث',
    phone = '+964771234555',
    updated_at = NOW()
WHERE email = 'newuser@company.com';

-- تغيير الدور
UPDATE users 
SET 
    role = 'accountant',
    updated_at = NOW()
WHERE id = 4;
```

#### عرض المستخدمين:
```sql
-- عرض جميع المستخدمين
SELECT 
    id,
    email,
    full_name,
    role,
    phone,
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;
```

### 2. 💻 من خلال التطبيق (JavaScript/TypeScript)

#### إضافة دوال إدارة المستخدمين إلى `supabase-api.ts`:

```typescript
// إضافة هذه الدوال إلى client/src/lib/supabase-api.ts

export const createUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'manager' | 'accountant' | 'user';
  phone?: string;
}) => {
  try {
    if (IS_DEMO_MODE) {
      const newUser = {
        id: Math.floor(Math.random() * 10000),
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role || 'user',
        phone: userData.phone || '',
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      demoUsers.push(newUser);
      return { data: newUser, error: null };
    }

    // كود Supabase الفعلي هنا
    // ...
  } catch (error) {
    return { data: null, error };
  }
};

export const updateUser = async (userId: number, updateData: any) => {
  // كود التحديث هنا
};

export const getUsers = async (filters?: any) => {
  // كود جلب المستخدمين هنا
};
```

## 🚀 التطبيق السريع على النظام الحالي

### الخطوة 1: إضافة البيانات التجريبية

```typescript
// إضافة هذا إلى client/src/lib/supabase-api.ts

const demoUsers = [
  {
    id: 1,
    email: 'admin@company.com',
    full_name: 'أحمد محمد الإداري',
    role: 'admin',
    phone: '+964771234567',
    is_active: true,
    email_verified: true,
    last_login: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  },
  // المزيد من المستخدمين...
];
```

### الخطوة 2: إضافة الدوال الأساسية

```typescript
// في client/src/lib/supabase-api.ts

export const createUser = async (userData) => {
  if (IS_DEMO_MODE) {
    const newUser = {
      id: Math.floor(Math.random() * 10000),
      ...userData,
      is_active: true,
      created_at: new Date().toISOString()
    };
    demoUsers.push(newUser);
    return { data: newUser, error: null };
  }
  // كود Supabase الفعلي
};

export const getUsers = async () => {
  if (IS_DEMO_MODE) {
    return { data: demoUsers, error: null };
  }
  // كود Supabase الفعلي
};

export const updateUser = async (userId, updateData) => {
  if (IS_DEMO_MODE) {
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      demoUsers[userIndex] = { ...demoUsers[userIndex], ...updateData };
      return { data: demoUsers[userIndex], error: null };
    }
  }
  // كود Supabase الفعلي
};
```

### الخطوة 3: إنشاء مكون إدارة المستخدمين

```bash
# إنشاء ملف جديد
touch client/src/components/user-management.tsx
```

```typescript
// محتوى client/src/components/user-management.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabaseApi } from '@/lib/supabase-api';

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => supabaseApi.getUsers().then(res => res.data || []),
  });

  const createUserMutation = useMutation({
    mutationFn: supabaseApi.createUser,
    onSuccess: () => {
      // إعادة تحميل البيانات
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
      
      {/* قائمة المستخدمين */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? 'نشط' : 'غير نشط'}</td>
                <td>
                  <button>تعديل</button>
                  <button>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### الخطوة 4: إضافة المسار إلى التطبيق

```typescript
// في client/src/App.tsx
import { UserManagement } from '@/components/user-management';

// إضافة المسار
<Route path="/users" element={<UserManagement />} />
```

## 📋 استخدام النظام

### إضافة مستخدم جديد من التطبيق:

```javascript
// مثال على الاستخدام
const newUser = await supabaseApi.createUser({
  email: 'ahmed@company.com',
  password: 'SecurePass123!',
  fullName: 'أحمد محمد العلي',
  role: 'accountant',
  phone: '+964771234567'
});

if (newUser.data) {
  console.log('تم إنشاء المستخدم:', newUser.data);
} else {
  console.error('خطأ:', newUser.error);
}
```

### تحديث مستخدم موجود:

```javascript
const updatedUser = await supabaseApi.updateUser(5, {
  full_name: 'أحمد محمد العلي المحدث',
  phone: '+964771234999',
  role: 'manager'
});
```

### جلب قائمة المستخدمين:

```javascript
const usersResponse = await supabaseApi.getUsers({
  role: 'accountant',
  search: 'أحمد'
});

const users = usersResponse.data || [];
```

## 🔐 نصائح الأمان

### 1. تشفير كلمات المرور:
```javascript
const bcrypt = require('bcryptjs');

// تشفير كلمة المرور
const password = 'userPassword123';
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. التحقق من الصلاحيات:
```javascript
function canManageUsers(currentUserRole) {
  return ['admin', 'manager'].includes(currentUserRole);
}

function canEditUser(currentUserRole, targetUserRole) {
  if (currentUserRole === 'admin') return true;
  if (currentUserRole === 'manager' && targetUserRole !== 'admin') return true;
  return false;
}
```

### 3. تسجيل الأنشطة:
```sql
-- تسجيل إضافة مستخدم جديد
INSERT INTO activity_logs (
    user_id, 
    action, 
    entity_type, 
    entity_id, 
    description
) VALUES (
    1, -- المدير الذي أضاف المستخدم
    'create',
    'user',
    5, -- ID المستخدم الجديد
    'إضافة مستخدم جديد: أحمد محمد'
);
```

## 🎛️ أدوار المستخدمين وصلاحياتهم

| الدور | الصلاحيات |
|--------|------------|
| **admin** | جميع الصلاحيات - إدارة كاملة |
| **manager** | إدارة المشاريع والتقارير والمستخدمين |
| **accountant** | المعاملات المالية والتقارير المالية |
| **user** | عرض البيانات فقط |

## 🚨 نصائح مهمة

1. **لا تحذف المستخدمين** - استخدم `is_active = false` بدلاً من الحذف
2. **شفّر كلمات المرور دائماً** - استخدم bcrypt مع salt rounds 12 على الأقل
3. **سجل جميع الأنشطة** - لتتبع من فعل ماذا ومتى
4. **تحقق من الصلاحيات** - قبل السماح بأي عملية
5. **استخدم HTTPS دائماً** - في الإنتاج

## 📞 إذا واجهت مشاكل

### مشكلة: المستخدم لا يظهر في القائمة
```sql
-- تحقق من وجود المستخدم
SELECT * FROM users WHERE email = 'user@company.com';

-- تحقق من حالة المستخدم
SELECT id, email, is_active FROM users WHERE email = 'user@company.com';
```

### مشكلة: خطأ في تسجيل الدخول
```sql
-- تحقق من كلمة المرور المشفرة
SELECT id, email, password_hash FROM users WHERE email = 'user@company.com';
```

### مشكلة: عدم ظهور الدور الجديد
```sql
-- تحقق من القيود على الأدوار
SELECT role FROM users WHERE id = 5;

-- تحديث الدور إذا لزم الأمر
UPDATE users SET role = 'accountant' WHERE id = 5;
```

---

هذا الدليل يوفر كل ما تحتاجه لإدارة المستخدمين في النظام الحالي! 🎉
