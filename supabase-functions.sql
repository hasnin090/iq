-- إنشاء دالة ملخص دفتر الأستاذ
CREATE OR REPLACE FUNCTION get_ledger_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'classified', (
            SELECT json_build_object(
                'total', COALESCE(SUM(amount), 0),
                'count', COUNT(*),
                'entries', COALESCE(json_agg(
                    json_build_object(
                        'id', id,
                        'date', date,
                        'description', description,
                        'amount', amount,
                        'projectId', project_id,
                        'entryType', entry_type,
                        'transactionId', transaction_id,
                        'expenseTypeId', expense_type_id,
                        'createdAt', created_at
                    ) ORDER BY date DESC
                ) FILTER (WHERE id IS NOT NULL), '[]'::json)
            )
            FROM ledger_entries 
            WHERE entry_type = 'classified'
        ),
        'general_expense', (
            SELECT json_build_object(
                'total', COALESCE(SUM(amount), 0),
                'count', COUNT(*),
                'entries', COALESCE(json_agg(
                    json_build_object(
                        'id', id,
                        'date', date,
                        'description', description,
                        'amount', amount,
                        'projectId', project_id,
                        'entryType', entry_type,
                        'transactionId', transaction_id,
                        'expenseTypeId', expense_type_id,
                        'createdAt', created_at
                    ) ORDER BY date DESC
                ) FILTER (WHERE id IS NOT NULL), '[]'::json)
            )
            FROM ledger_entries 
            WHERE entry_type = 'general'
        ),
        'grandTotal', (
            SELECT COALESCE(SUM(amount), 0)
            FROM ledger_entries
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- دالة تصنيف المعاملات تلقائياً
CREATE OR REPLACE FUNCTION classify_transaction(transaction_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
    transaction_record transactions%ROWTYPE;
    expense_type_record expense_types%ROWTYPE;
    entry_type_val VARCHAR(20) := 'general';
    result JSON;
BEGIN
    -- جلب المعاملة
    SELECT * INTO transaction_record 
    FROM transactions 
    WHERE id = transaction_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Transaction not found');
    END IF;
    
    -- البحث عن نوع المصروف المناسب
    IF transaction_record.expense_type_id IS NOT NULL THEN
        SELECT * INTO expense_type_record 
        FROM expense_types 
        WHERE id = transaction_record.expense_type_id AND is_active = true;
        
        IF FOUND THEN
            entry_type_val := 'classified';
        END IF;
    END IF;
    
    -- إدراج أو تحديث مدخل دفتر الأستاذ
    INSERT INTO ledger_entries (
        date,
        description,
        amount,
        debit_amount,
        credit_amount,
        entry_type,
        project_id,
        transaction_id,
        expense_type_id,
        account_name,
        entry_date,
        created_at
    ) VALUES (
        transaction_record.date,
        transaction_record.description,
        transaction_record.amount,
        CASE WHEN transaction_record.type = 'expense' THEN transaction_record.amount ELSE 0 END,
        CASE WHEN transaction_record.type = 'income' THEN transaction_record.amount ELSE 0 END,
        entry_type_val,
        transaction_record.project_id,
        transaction_record.id,
        transaction_record.expense_type_id,
        CASE WHEN expense_type_record.name IS NOT NULL THEN expense_type_record.name ELSE 'مصروف عام' END,
        transaction_record.date::TEXT,
        NOW()
    )
    ON CONFLICT (transaction_id) DO UPDATE SET
        date = EXCLUDED.date,
        description = EXCLUDED.description,
        amount = EXCLUDED.amount,
        debit_amount = EXCLUDED.debit_amount,
        credit_amount = EXCLUDED.credit_amount,
        entry_type = EXCLUDED.entry_type,
        expense_type_id = EXCLUDED.expense_type_id,
        account_name = EXCLUDED.account_name,
        updated_at = NOW();
    
    RETURN json_build_object(
        'success', true,
        'entry_type', entry_type_val,
        'account_name', CASE WHEN expense_type_record.name IS NOT NULL THEN expense_type_record.name ELSE 'مصروف عام' END
    );
END;
$$ LANGUAGE plpgsql;

-- دالة حساب إحصائيات المشروع
CREATE OR REPLACE FUNCTION get_project_stats(project_id_param INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'name', p.name,
        'budget', p.budget,
        'spent', (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE project_id = p.id AND type = 'expense'
        ),
        'income', (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE project_id = p.id AND type = 'income'
        ),
        'remaining', p.budget - (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE project_id = p.id AND type = 'expense'
        ),
        'transaction_count', (
            SELECT COUNT(*)
            FROM transactions 
            WHERE project_id = p.id
        ),
        'document_count', (
            SELECT COUNT(*)
            FROM documents 
            WHERE project_id = p.id
        ),
        'status', p.status,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) INTO result
    FROM projects p
    WHERE p.id = project_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- دالة البحث في المعاملات
CREATE OR REPLACE FUNCTION search_transactions(
    search_term TEXT DEFAULT NULL,
    project_id_param INTEGER DEFAULT NULL,
    expense_type_id_param INTEGER DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL,
    transaction_type VARCHAR(20) DEFAULT NULL,
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_count INTEGER;
BEGIN
    -- حساب العدد الكلي
    SELECT COUNT(*) INTO total_count
    FROM transactions t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN expense_types et ON t.expense_type_id = et.id
    WHERE 
        (search_term IS NULL OR t.description ILIKE '%' || search_term || '%')
        AND (project_id_param IS NULL OR t.project_id = project_id_param)
        AND (expense_type_id_param IS NULL OR t.expense_type_id = expense_type_id_param)
        AND (date_from IS NULL OR t.date >= date_from)
        AND (date_to IS NULL OR t.date <= date_to)
        AND (transaction_type IS NULL OR t.type = transaction_type);
    
    -- جلب النتائج
    SELECT json_build_object(
        'data', json_agg(
            json_build_object(
                'id', t.id,
                'type', t.type,
                'amount', t.amount,
                'description', t.description,
                'date', t.date,
                'project', CASE WHEN p.id IS NOT NULL THEN json_build_object('id', p.id, 'name', p.name) ELSE NULL END,
                'expenseType', CASE WHEN et.id IS NOT NULL THEN json_build_object('id', et.id, 'name', et.name) ELSE NULL END,
                'fileUrl', t.file_url,
                'fileType', t.file_type,
                'createdAt', t.created_at
            ) ORDER BY t.date DESC, t.id DESC
        ),
        'total', total_count,
        'hasMore', total_count > (offset_param + limit_param)
    ) INTO result
    FROM transactions t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN expense_types et ON t.expense_type_id = et.id
    WHERE 
        (search_term IS NULL OR t.description ILIKE '%' || search_term || '%')
        AND (project_id_param IS NULL OR t.project_id = project_id_param)
        AND (expense_type_id_param IS NULL OR t.expense_type_id = expense_type_id_param)
        AND (date_from IS NULL OR t.date >= date_from)
        AND (date_to IS NULL OR t.date <= date_to)
        AND (transaction_type IS NULL OR t.type = transaction_type)
    LIMIT limit_param OFFSET offset_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- دالة تحديث رصيد المشروع
CREATE OR REPLACE FUNCTION update_project_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث رصيد المشروع عند إضافة/تعديل/حذف معاملة
    IF TG_OP = 'DELETE' THEN
        UPDATE projects 
        SET spent = (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE project_id = OLD.project_id AND type = 'expense'
        ),
        updated_at = NOW()
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE projects 
        SET spent = (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions 
            WHERE project_id = NEW.project_id AND type = 'expense'
        ),
        updated_at = NOW()
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات
DROP TRIGGER IF EXISTS update_project_balance_trigger ON transactions;
CREATE TRIGGER update_project_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_project_balance();

-- محفز تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المحفز على جميع الجداول
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_types_updated_at ON expense_types;
CREATE TRIGGER update_expense_types_updated_at BEFORE UPDATE ON expense_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
