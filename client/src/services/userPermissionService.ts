import { createClient } from '@supabase/supabase-js';
import { UserProfile, Permission, PERMISSION_GROUPS } from '../types/permissions';

// 🔗 مصدر البيانات: Supabase
// =========================

export interface SupabaseUserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  permissions: Permission[];
  project_ids?: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  role_in_project?: string;
  joined_at: string;
  is_active: boolean;
}

// تكوين Supabase (يفترض أن يكون في متغيرات البيئة)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 🔧 خدمات إدارة المستخدمين
// ===========================

export class UserPermissionService {
  /**
   * الحصول على ملف المستخدم الكامل
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // الحصول على بيانات المستخدم الأساسية
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('خطأ في الحصول على ملف المستخدم:', userError);
        return null;
      }

      // الحصول على مشاريع المستخدم
      const { data: projectMembers, error: projectError } = await supabase
        .from('project_members')
        .select(`
          project_id,
          role_in_project,
          projects (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (projectError) {
        console.error('خطأ في الحصول على مشاريع المستخدم:', projectError);
      }

      // تنسيق البيانات
      const projects = projectMembers?.map(pm => ({
        project_id: pm.project_id,
        project_name: (pm.projects as any)?.name || 'مشروع غير معروف',
        role_in_project: pm.role_in_project
      })) || [];

      const userProfileFormatted: UserProfile = {
        id: userProfile.id,
        full_name: userProfile.full_name,
        role: userProfile.role,
        permissions: userProfile.permissions || this.getDefaultPermissions(userProfile.role),
        project_ids: projects.map(p => p.project_id),
        created_at: userProfile.created_at,
        projects: projects
      };

      return userProfileFormatted;
    } catch (error) {
      console.error('خطأ غير متوقع في الحصول على ملف المستخدم:', error);
      return null;
    }
  }

  /**
   * تحديث صلاحيات المستخدم
   */
  static async updateUserPermissions(
    userId: string, 
    permissions: Permission[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('خطأ في تحديث الصلاحيات:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ غير متوقع في تحديث الصلاحيات:', error);
      return false;
    }
  }

  /**
   * تحديث دور المستخدم
   */
  static async updateUserRole(
    userId: string, 
    role: 'admin' | 'manager' | 'user' | 'viewer'
  ): Promise<boolean> {
    try {
      const defaultPermissions = this.getDefaultPermissions(role);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: role,
          permissions: defaultPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('خطأ في تحديث الدور:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ غير متوقع في تحديث الدور:', error);
      return false;
    }
  }

  /**
   * إضافة المستخدم إلى مشروع
   */
  static async addUserToProject(
    userId: string, 
    projectId: string, 
    roleInProject?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          user_id: userId,
          project_id: projectId,
          role_in_project: roleInProject || 'member',
          joined_at: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        console.error('خطأ في إضافة المستخدم للمشروع:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ غير متوقع في إضافة المستخدم للمشروع:', error);
      return false;
    }
  }

  /**
   * إزالة المستخدم من مشروع
   */
  static async removeUserFromProject(
    userId: string, 
    projectId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('project_id', projectId);

      if (error) {
        console.error('خطأ في إزالة المستخدم من المشروع:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('خطأ غير متوقع في إزالة المستخدم من المشروع:', error);
      return false;
    }
  }

  /**
   * الحصول على جميع المستخدمين
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('خطأ في الحصول على المستخدمين:', error);
        return [];
      }

      return users.map(user => ({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        permissions: user.permissions || this.getDefaultPermissions(user.role),
        project_ids: user.project_ids || [],
        created_at: user.created_at,
        projects: []
      }));
    } catch (error) {
      console.error('خطأ غير متوقع في الحصول على المستخدمين:', error);
      return [];
    }
  }

  /**
   * الحصول على أعضاء مشروع محدد
   */
  static async getProjectMembers(projectId: string): Promise<UserProfile[]> {
    try {
      const { data: members, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role_in_project,
          user_profiles (
            id,
            full_name,
            role,
            permissions,
            created_at
          )
        `)
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) {
        console.error('خطأ في الحصول على أعضاء المشروع:', error);
        return [];
      }

      return members.map(member => {
        const userProfile = member.user_profiles as any;
        return {
          id: userProfile.id,
          full_name: userProfile.full_name,
          role: userProfile.role,
          permissions: userProfile.permissions || this.getDefaultPermissions(userProfile.role),
          project_ids: [projectId],
          created_at: userProfile.created_at,
          projects: [{
            project_id: projectId,
            project_name: '',
            role_in_project: member.role_in_project
          }]
        };
      });
    } catch (error) {
      console.error('خطأ غير متوقع في الحصول على أعضاء المشروع:', error);
      return [];
    }
  }

  /**
   * الحصول على الصلاحيات الافتراضية لدور معين
   */
  static getDefaultPermissions(role: 'admin' | 'manager' | 'user' | 'viewer'): Permission[] {
    switch (role) {
      case 'admin':
        return PERMISSION_GROUPS.ADMIN;
      case 'manager':
        return PERMISSION_GROUPS.MANAGER;
      case 'user':
        return PERMISSION_GROUPS.USER;
      case 'viewer':
        return PERMISSION_GROUPS.VIEWER;
      default:
        return PERMISSION_GROUPS.VIEWER;
    }
  }

  /**
   * التحقق من صلاحية محددة للمستخدم
   */
  static hasPermission(userProfile: UserProfile | null, permission: Permission): boolean {
    if (!userProfile) return false;
    
    // المدير العام له جميع الصلاحيات
    if (userProfile.role === 'admin') return true;
    
    return userProfile.permissions.includes(permission);
  }

  /**
   * التحقق من إمكانية الوصول لمشروع محدد
   */
  static canAccessProject(userProfile: UserProfile | null, projectId: string): boolean {
    if (!userProfile) return false;
    
    // المدير والمدير العام يمكنهما الوصول لجميع المشاريع
    if (userProfile.role === 'admin' || userProfile.role === 'manager') return true;
    
    return userProfile.project_ids?.includes(projectId) || 
           userProfile.projects?.some(p => p.project_id === projectId) || false;
  }

  /**
   * إنشاء ملف مستخدم جديد
   */
  static async createUserProfile(
    userId: string,
    fullName: string,
    role: 'admin' | 'manager' | 'user' | 'viewer' = 'user'
  ): Promise<UserProfile | null> {
    try {
      const permissions = this.getDefaultPermissions(role);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role: role,
          permissions: permissions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('خطأ في إنشاء ملف المستخدم:', error);
        return null;
      }

      return {
        id: data.id,
        full_name: data.full_name,
        role: data.role,
        permissions: data.permissions,
        project_ids: [],
        created_at: data.created_at,
        projects: []
      };
    } catch (error) {
      console.error('خطأ غير متوقع في إنشاء ملف المستخدم:', error);
      return null;
    }
  }
}

// 🎣 React Hooks لإدارة الصلاحيات
// =================================

export { UserPermissionService as UserService };
