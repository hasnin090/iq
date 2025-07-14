// ===================================================================
// دليل إدارة المستخدمين - جانب التطبيق (JavaScript/Node.js)
// User Management - Application Side Guide
// ===================================================================

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// إعداد اتصال قاعدة البيانات
const pool = new Pool({
    user: 'accounting_user',
    host: 'localhost',
    database: 'arabic_accounting_system',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// ===================================================================
// 1. إضافة مستخدم جديد
// ===================================================================

async function createUser(userData) {
    const {
        email,
        password,
        fullName,
        role = 'user',
        phone
    } = userData;

    try {
        // تشفير كلمة المرور
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // التحقق من عدم وجود المستخدم مسبقاً
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('المستخدم موجود مسبقاً');
        }

        // إضافة المستخدم الجديد
        const result = await pool.query(`
            INSERT INTO users (
                email, 
                password_hash, 
                full_name, 
                role, 
                phone, 
                is_active,
                email_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, full_name, role, phone, created_at
        `, [email, passwordHash, fullName, role, phone, true, false]);

        // تسجيل النشاط
        await logActivity(
            1, // ID المدير الذي أضاف المستخدم
            'create',
            'user',
            result.rows[0].id,
            `إضافة مستخدم جديد: ${fullName}`
        );

        return {
            success: true,
            user: result.rows[0],
            message: 'تم إنشاء المستخدم بنجاح'
        };

    } catch (error) {
        console.error('خطأ في إنشاء المستخدم:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 2. تحديث معلومات المستخدم
// ===================================================================

async function updateUser(userId, updateData) {
    try {
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        // بناء الاستعلام ديناميكياً
        Object.entries(updateData).forEach(([key, value]) => {
            if (value !== undefined && key !== 'id') {
                updateFields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        if (updateFields.length === 0) {
            throw new Error('لا توجد بيانات للتحديث');
        }

        // إضافة تحديث الوقت
        updateFields.push(`updated_at = NOW()`);
        values.push(userId);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, email, full_name, role, phone, updated_at
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('المستخدم غير موجود');
        }

        // تسجيل النشاط
        await logActivity(
            userId,
            'update',
            'user',
            userId,
            `تحديث معلومات المستخدم`
        );

        return {
            success: true,
            user: result.rows[0],
            message: 'تم تحديث المستخدم بنجاح'
        };

    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 3. تغيير كلمة المرور
// ===================================================================

async function changePassword(userId, oldPassword, newPassword) {
    try {
        // الحصول على كلمة المرور الحالية
        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new Error('المستخدم غير موجود');
        }

        // التحقق من كلمة المرور القديمة
        const isValidPassword = await bcrypt.compare(
            oldPassword, 
            userResult.rows[0].password_hash
        );

        if (!isValidPassword) {
            throw new Error('كلمة المرور القديمة غير صحيحة');
        }

        // تشفير كلمة المرور الجديدة
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // تحديث كلمة المرور
        await pool.query(`
            UPDATE users 
            SET 
                password_hash = $1,
                updated_at = NOW()
            WHERE id = $2
        `, [newPasswordHash, userId]);

        // تسجيل النشاط
        await logActivity(
            userId,
            'update',
            'user',
            userId,
            'تغيير كلمة المرور'
        );

        return {
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        };

    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 4. إعادة تعيين كلمة المرور
// ===================================================================

async function requestPasswordReset(email) {
    try {
        // التحقق من وجود المستخدم
        const userResult = await pool.query(
            'SELECT id, full_name FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        if (userResult.rows.length === 0) {
            throw new Error('البريد الإلكتروني غير موجود');
        }

        // إنشاء رمز إعادة التعيين
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // ساعة واحدة

        // حفظ الرمز في قاعدة البيانات
        await pool.query(`
            UPDATE users 
            SET 
                reset_token = $1,
                reset_token_expires = $2,
                updated_at = NOW()
            WHERE email = $3
        `, [resetToken, expiresAt, email]);

        // هنا يمكن إرسال البريد الإلكتروني مع الرمز
        // await sendResetEmail(email, resetToken);

        return {
            success: true,
            resetToken, // في الإنتاج، لا نرجع الرمز مباشرة
            message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني'
        };

    } catch (error) {
        console.error('خطأ في طلب إعادة التعيين:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function resetPassword(resetToken, newPassword) {
    try {
        // التحقق من صحة الرمز وانتهاء صلاحيته
        const userResult = await pool.query(`
            SELECT id, email, full_name 
            FROM users 
            WHERE reset_token = $1 
                AND reset_token_expires > NOW()
                AND is_active = true
        `, [resetToken]);

        if (userResult.rows.length === 0) {
            throw new Error('الرمز غير صحيح أو منتهي الصلاحية');
        }

        // تشفير كلمة المرور الجديدة
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // تحديث كلمة المرور وإزالة الرمز
        await pool.query(`
            UPDATE users 
            SET 
                password_hash = $1,
                reset_token = NULL,
                reset_token_expires = NULL,
                updated_at = NOW()
            WHERE id = $2
        `, [passwordHash, userResult.rows[0].id]);

        // تسجيل النشاط
        await logActivity(
            userResult.rows[0].id,
            'update',
            'user',
            userResult.rows[0].id,
            'إعادة تعيين كلمة المرور'
        );

        return {
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح'
        };

    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 5. الحصول على معلومات المستخدمين
// ===================================================================

async function getAllUsers(filters = {}) {
    try {
        let query = `
            SELECT 
                id,
                email,
                full_name,
                role,
                phone,
                is_active,
                email_verified,
                last_login,
                created_at,
                updated_at
            FROM users
        `;

        const conditions = [];
        const values = [];
        let paramCount = 1;

        // إضافة الفلاتر
        if (filters.role) {
            conditions.push(`role = $${paramCount}`);
            values.push(filters.role);
            paramCount++;
        }

        if (filters.isActive !== undefined) {
            conditions.push(`is_active = $${paramCount}`);
            values.push(filters.isActive);
            paramCount++;
        }

        if (filters.search) {
            conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
            values.push(`%${filters.search}%`);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        // إضافة Pagination
        if (filters.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
            paramCount++;
        }

        if (filters.offset) {
            query += ` OFFSET $${paramCount}`;
            values.push(filters.offset);
        }

        const result = await pool.query(query, values);

        return {
            success: true,
            users: result.rows,
            total: result.rows.length
        };

    } catch (error) {
        console.error('خطأ في جلب المستخدمين:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getUserById(userId) {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                email,
                full_name,
                role,
                phone,
                is_active,
                email_verified,
                last_login,
                created_at,
                updated_at
            FROM users 
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            throw new Error('المستخدم غير موجود');
        }

        return {
            success: true,
            user: result.rows[0]
        };

    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 6. تفعيل/إلغاء تفعيل المستخدم
// ===================================================================

async function toggleUserStatus(userId, isActive) {
    try {
        const result = await pool.query(`
            UPDATE users 
            SET 
                is_active = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, email, full_name, is_active
        `, [isActive, userId]);

        if (result.rows.length === 0) {
            throw new Error('المستخدم غير موجود');
        }

        // تسجيل النشاط
        await logActivity(
            userId,
            'update',
            'user',
            userId,
            isActive ? 'تفعيل المستخدم' : 'إلغاء تفعيل المستخدم'
        );

        return {
            success: true,
            user: result.rows[0],
            message: isActive ? 'تم تفعيل المستخدم' : 'تم إلغاء تفعيل المستخدم'
        };

    } catch (error) {
        console.error('خطأ في تغيير حالة المستخدم:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 7. إحصائيات المستخدمين
// ===================================================================

async function getUserStats() {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
                COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
                COUNT(CASE WHEN role = 'accountant' THEN 1 END) as accountants,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
                COUNT(CASE WHEN last_login >= CURRENT_DATE THEN 1 END) as logged_in_today
            FROM users
        `);

        return {
            success: true,
            stats: result.rows[0]
        };

    } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===================================================================
// 8. التحقق من الصلاحيات
// ===================================================================

function hasPermission(userRole, requiredRole) {
    const roleHierarchy = {
        'admin': 4,
        'manager': 3,
        'accountant': 2,
        'user': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

function canManageUser(currentUserRole, targetUserRole) {
    // المدير يمكنه إدارة الجميع
    if (currentUserRole === 'admin') return true;
    
    // المدير يمكنه إدارة المحاسبين والمستخدمين فقط
    if (currentUserRole === 'manager') {
        return ['accountant', 'user'].includes(targetUserRole);
    }
    
    return false;
}

// ===================================================================
// 9. دالة مساعدة لتسجيل الأنشطة
// ===================================================================

async function logActivity(userId, action, entityType, entityId, description) {
    try {
        await pool.query(`
            INSERT INTO activity_logs (
                user_id, 
                action, 
                entity_type, 
                entity_id, 
                description
            ) VALUES ($1, $2, $3, $4, $5)
        `, [userId, action, entityType, entityId, description]);
    } catch (error) {
        console.error('خطأ في تسجيل النشاط:', error);
    }
}

// ===================================================================
// 10. دالة التحقق من قوة كلمة المرور
// ===================================================================

function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('يجب أن تحتوي على حرف كبير على الأقل');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('يجب أن تحتوي على حرف صغير على الأقل');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('يجب أن تحتوي على رقم على الأقل');
    }

    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('يجب أن تحتوي على رمز خاص على الأقل (!@#$%^&*)');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ===================================================================
// تصدير الدوال
// ===================================================================

module.exports = {
    createUser,
    updateUser,
    changePassword,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    getUserById,
    toggleUserStatus,
    getUserStats,
    hasPermission,
    canManageUser,
    validatePassword,
    logActivity
};

// ===================================================================
// أمثلة على الاستخدام
// ===================================================================

/*
// إضافة مستخدم جديد
const newUser = await createUser({
    email: 'ahmed@company.com',
    password: 'SecurePass123!',
    fullName: 'أحمد محمد العلي',
    role: 'accountant',
    phone: '+964771234567'
});

// تحديث معلومات المستخدم
const updatedUser = await updateUser(5, {
    full_name: 'أحمد محمد العلي المحدث',
    phone: '+964771234999'
});

// تغيير كلمة المرور
const passwordChanged = await changePassword(5, 'oldPassword', 'NewSecurePass123!');

// الحصول على جميع المستخدمين
const allUsers = await getAllUsers({
    role: 'accountant',
    isActive: true,
    limit: 10,
    offset: 0
});

// إحصائيات المستخدمين
const stats = await getUserStats();
console.log(stats);
*/
