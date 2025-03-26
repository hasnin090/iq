import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { 
  users, 
  Permission,
  Role,
  User,
  PERMISSIONS,
  ROLES
} from '@shared/schema';

/**
 * وظيفة تجلب جميع الصلاحيات المخصصة لدور معين
 * @param role الدور المراد جلب صلاحياته
 * @returns مصفوفة من الصلاحيات
 */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
  const perms = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role));
  
  return perms.map(p => p.permission);
}

/**
 * وظيفة تتحقق ما إذا كان الدور يملك صلاحية محددة
 * @param role الدور المراد التحقق منه
 * @param permission الصلاحية المطلوبة
 * @returns حالة وجود الصلاحية للدور
 */
export async function hasRolePermission(role: Role, permission: Permission): Promise<boolean> {
  const [perm] = await db
    .select()
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.role, role),
        eq(rolePermissions.permission, permission)
      )
    );
  
  return !!perm;
}

/**
 * وظيفة تجلب جميع صلاحيات المستخدم (من الدور والصلاحيات الإضافية)
 * @param userId معرف المستخدم
 * @returns مصفوفة من الصلاحيات
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  // جلب معلومات المستخدم
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    return [];
  }
  
  // جلب صلاحيات الدور
  const rolePerms = await getRolePermissions(user.role);
  
  // دمج صلاحيات الدور مع الصلاحيات الإضافية
  const customPerms = user.customPermissions as Permission[];
  const allPermissions = [...rolePerms];
  
  // إضافة الصلاحيات الإضافية إن وجدت
  if (customPerms && Array.isArray(customPerms)) {
    customPerms.forEach(perm => {
      if (!allPermissions.includes(perm)) {
        allPermissions.push(perm);
      }
    });
  }
  
  return allPermissions;
}

/**
 * وظيفة تتحقق ما إذا كان المستخدم يملك صلاحية محددة
 * @param userId معرف المستخدم
 * @param permission الصلاحية المطلوبة
 * @returns حالة وجود الصلاحية للمستخدم
 */
export async function hasUserPermission(userId: number, permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * وظيفة تضيف صلاحية إضافية للمستخدم
 * @param userId معرف المستخدم
 * @param permission الصلاحية المراد إضافتها
 * @returns المستخدم بعد التحديث
 */
export async function addCustomPermissionToUser(userId: number, permission: Permission): Promise<User | null> {
  // جلب المستخدم
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    return null;
  }
  
  const currentPermissions = user.customPermissions as Permission[] || [];
  
  // التحقق من عدم وجود الصلاحية مسبقاً
  if (!currentPermissions.includes(permission)) {
    const updatedPermissions = [...currentPermissions, permission];
    
    // تحديث المستخدم
    const [updatedUser] = await db
      .update(users)
      .set({ customPermissions: updatedPermissions })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  return user;
}

/**
 * وظيفة تزيل صلاحية إضافية من المستخدم
 * @param userId معرف المستخدم
 * @param permission الصلاحية المراد إزالتها
 * @returns المستخدم بعد التحديث
 */
export async function removeCustomPermissionFromUser(userId: number, permission: Permission): Promise<User | null> {
  // جلب المستخدم
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    return null;
  }
  
  const currentPermissions = user.customPermissions as Permission[] || [];
  
  // إزالة الصلاحية إن وجدت
  const updatedPermissions = currentPermissions.filter(p => p !== permission);
  
  // تحديث المستخدم فقط إذا تغيرت الصلاحيات
  if (currentPermissions.length !== updatedPermissions.length) {
    const [updatedUser] = await db
      .update(users)
      .set({ customPermissions: updatedPermissions })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  return user;
}

/**
 * وظيفة تضيف صلاحية لدور محدد
 * @param role الدور
 * @param permission الصلاحية المراد إضافتها
 * @returns حالة نجاح العملية
 */
export async function addPermissionToRole(role: Role, permission: Permission): Promise<boolean> {
  try {
    const hasPermission = await hasRolePermission(role, permission);
    
    if (!hasPermission) {
      await db.insert(rolePermissions).values({
        role,
        permission
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error adding permission to role:', error);
    return false;
  }
}

/**
 * وظيفة تزيل صلاحية من دور محدد
 * @param role الدور
 * @param permission الصلاحية المراد إزالتها
 * @returns حالة نجاح العملية
 */
export async function removePermissionFromRole(role: Role, permission: Permission): Promise<boolean> {
  try {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.permission, permission)
        )
      );
    
    return true;
  } catch (error) {
    console.error('Error removing permission from role:', error);
    return false;
  }
}

/**
 * وظيفة تقوم بإعداد الصلاحيات الافتراضية للأدوار
 */
export async function setupDefaultRolePermissions(): Promise<void> {
  try {
    // إعداد صلاحيات المدير (جميع الصلاحيات)
    const adminPermissions: Permission[] = [
      'view_dashboard',
      'manage_users',
      'view_users',
      'manage_projects',
      'view_projects',
      'manage_project_transactions',
      'view_project_transactions',
      'manage_transactions',
      'view_transactions',
      'manage_documents',
      'view_documents',
      'view_reports',
      'view_activity_logs',
      'manage_settings'
    ];
    
    // إعداد صلاحيات المدير
    for (const permission of adminPermissions) {
      await addPermissionToRole('admin', permission);
    }
    
    // إعداد صلاحيات المشرف
    const managerPermissions: Permission[] = [
      'view_dashboard',
      'view_users',
      'manage_projects',
      'view_projects',
      'manage_project_transactions',
      'view_project_transactions',
      'manage_transactions',
      'view_transactions',
      'manage_documents',
      'view_documents',
      'view_reports'
    ];
    
    for (const permission of managerPermissions) {
      await addPermissionToRole('manager', permission);
    }
    
    // إعداد صلاحيات المستخدم العادي
    const userPermissions: Permission[] = [
      'view_dashboard',
      'view_projects',
      'manage_project_transactions',
      'view_project_transactions',
      'manage_transactions',
      'view_transactions',
      'manage_documents',
      'view_documents'
    ];
    
    for (const permission of userPermissions) {
      await addPermissionToRole('user', permission);
    }
    
    // إعداد صلاحيات المشاهد
    const viewerPermissions: Permission[] = [
      'view_dashboard',
      'view_projects',
      'view_project_transactions',
      'view_transactions',
      'view_documents'
    ];
    
    for (const permission of viewerPermissions) {
      await addPermissionToRole('viewer', permission);
    }
    
    console.log('تم إعداد الصلاحيات الافتراضية للأدوار بنجاح');
  } catch (error) {
    console.error('حدث خطأ أثناء إعداد الصلاحيات الافتراضية للأدوار:', error);
  }
}