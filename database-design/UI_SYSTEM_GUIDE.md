# 🎛️ واجهات النظام الجديد - دليل المطور

## 🏗️ هيكل النظام الجديد

### 👑 المدير (Admin)
**الصلاحيات**: إدارة كاملة لجميع أجزاء النظام

**الواجهات المطلوبة**:
- 📊 **لوحة التحكم الرئيسية**: إحصائيات شاملة لجميع المشاريع
- 📁 **إدارة المشاريع**: إنشاء، تعديل، حذف المشاريع
- 👥 **إدارة المستخدمين**: إضافة مستخدمين وربطهم بالمشاريع
- 💰 **إدارة المعاملات**: إنشاء، تعديل، حذف جميع المعاملات
- 👷 **إدارة الموظفين**: إضافة وإدارة الموظفين
- 📄 **إدارة المستندات**: عرض وإدارة جميع المستندات
- 💳 **إدارة المستحقات**: عرض وإدارة جميع المستحقات
- 📋 **التقارير**: تقارير شاملة لجميع المشاريع
- ⚙️ **الإعدادات**: إعدادات النظام العامة

### 👤 المستخدم العادي (User)
**الصلاحيات**: عرض وإدخال بيانات مشاريعه المرتبطة فقط

**الواجهات المطلوبة**:
- 📊 **لوحة التحكم**: إحصائيات مشاريعه فقط
- 🏠 **مشروعي**: عرض تفاصيل المشروع المرتبط به
- 💰 **الحسابات**: 
  - 💵 المستحقات (إضافة، عرض)
  - 💸 الدفعات النقدية (إضافة دفعات للمستحقات)
  - 📈 المعاملات المالية (عرض فقط)
- 📄 **المستندات**: رفع وعرض مستندات مشروعه
- 📊 **التقارير**: تقارير محدودة لمشروعه فقط

## 🔐 منطق الصلاحيات

### للمدير:
```sql
-- يمكنه رؤية وإدارة كل شيء
WHERE EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
```

### للمستخدم العادي:
```sql
-- يرى فقط البيانات المرتبطة بمشاريعه
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() 
  AND ur.project_id = [TABLE].project_id
)
```

## 🎨 واجهة المستخدم المقترحة

### 📱 شريط التنقل للمستخدم العادي:
```
🏠 الرئيسية  |  🏗️ مشروعي  |  💰 الحسابات  |  📄 المستندات
```

### 📱 شريط التنقل للمدير:
```
🏠 الرئيسية  |  📁 المشاريع  |  👥 المستخدمين  |  💰 المعاملات  |  👷 الموظفين  |  📄 المستندات  |  📊 التقارير  |  ⚙️ الإعدادات
```

## 📋 صفحات مفصلة للمستخدم العادي

### 1. 🏠 الصفحة الرئيسية (Dashboard)
```typescript
// بيانات لوحة التحكم للمستخدم
interface UserDashboard {
  project: {
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    progress: number;
  };
  recentTransactions: Transaction[];
  pendingReceivables: Receivable[];
  documentsCount: number;
  notifications: Notification[];
}
```

### 2. 🏗️ صفحة مشروعي
```typescript
// تفاصيل المشروع
interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'paused';
  employees: Employee[];
  recentActivity: ActivityLog[];
}
```

### 3. 💰 صفحة الحسابات
#### 💵 المستحقات
```typescript
interface ReceivablesPage {
  receivables: {
    id: string;
    beneficiaryName: string;
    amount: number;
    totalPaid: number;
    remainingAmount: number;
    status: 'pending' | 'partially_paid' | 'paid';
    dueDate: Date;
  }[];
  // إمكانية إضافة مستحق جديد
  canAddNew: true;
}
```

#### 💸 الدفعات النقدية
```typescript
interface PaymentsPage {
  payments: {
    id: string;
    receivableId: string;
    beneficiaryName: string;
    amount: number;
    paymentDate: Date;
    notes: string;
  }[];
  // إمكانية إضافة دفعة جديدة
  canAddPayment: true;
}
```

#### 📈 المعاملات المالية (عرض فقط)
```typescript
interface TransactionsView {
  transactions: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: Date;
    projectName: string;
  }[];
  // عرض فقط - لا يمكن التعديل
  readonly: true;
}
```

### 4. 📄 صفحة المستندات
```typescript
interface DocumentsPage {
  documents: {
    id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    uploadDate: Date;
  }[];
  // إمكانية رفع مستندات جديدة
  canUpload: true;
  // إمكانية حذف مستنداته فقط (يحددها المدير)
  canDelete: boolean;
}
```

## 🔒 قواعد الأمان في Frontend

### React/TypeScript Example:
```typescript
// Hook للتحقق من الصلاحيات
const useUserPermissions = () => {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'admin',
    canCreateProject: user?.role === 'admin',
    canEditTransactions: user?.role === 'admin',
    canUploadDocuments: true, // جميع المستخدمين
    canCreateReceivables: true, // جميع المستخدمين
    canDeleteData: user?.role === 'admin',
  };
};

// استخدام الصلاحيات في المكونات
const TransactionsList = () => {
  const { isAdmin } = useUserPermissions();
  
  return (
    <div>
      {transactions.map(transaction => (
        <TransactionCard 
          key={transaction.id}
          transaction={transaction}
          showEditButton={isAdmin}
          showDeleteButton={isAdmin}
        />
      ))}
    </div>
  );
};
```

## 📊 استعلامات API للمستخدم العادي

### جلب بيانات المشروع:
```sql
SELECT p.*, 
       COUNT(DISTINCT t.id) as transaction_count,
       SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_spent
FROM projects p
LEFT JOIN transactions t ON t.project_id = p.id
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = $1 AND ur.project_id = p.id
)
GROUP BY p.id;
```

### جلب المعاملات (قراءة فقط):
```sql
SELECT t.*, p.name as project_name
FROM transactions t
JOIN projects p ON p.id = t.project_id
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = $1 AND ur.project_id = p.id
)
ORDER BY t.date DESC;
```

### جلب المستحقات:
```sql
SELECT * FROM receivables 
WHERE created_by = $1
ORDER BY created_at DESC;
```

## 🎯 نصائح للتطوير

1. **فصل المكونات**: مكونات منفصلة للمدير والمستخدم العادي
2. **حماية المسارات**: Route Guards للتحقق من الصلاحيات
3. **إخفاء الأزرار**: إخفاء أزرار التعديل/الحذف للمستخدمين العاديين
4. **رسائل واضحة**: رسائل خطأ واضحة عند عدم وجود صلاحية
5. **تحسين UX**: واجهة مبسطة للمستخدم العادي، شاملة للمدير

## ⚠️ نقاط مهمة

- **الأمان**: جميع فحوصات الصلاحيات في قاعدة البيانات (RLS)
- **المرونة**: يمكن للمدير إضافة مستخدمين جدد لأي مشروع
- **البساطة**: واجهة المستخدم العادي مبسطة ومحدودة
- **الشفافية**: المستخدم يرى فقط ما يخص مشروعه
