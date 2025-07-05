import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './supabase-config';

const config = getSupabaseConfig();

// إنشاء عميل Supabase
export const supabase = createClient(config.url!, config.anonKey!, {
  auth: config.auth,
  realtime: config.realtime
});

// Helper functions for common operations
export const supabaseHelpers = {
  // Authentication helpers
  auth: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    },
    
    signUp: async (email: string, password: string, metadata?: any) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { data, error };
    },
    
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    
    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    },
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return supabase.auth.onAuthStateChange(callback);
    }
  },
  
  // Database helpers
  db: {
    // Users table operations
    users: {
      getAll: () => supabase.from('users').select('*'),
      getById: (id: number) => supabase.from('users').select('*').eq('id', id).single(),
      create: (user: any) => supabase.from('users').insert(user).select().single(),
      update: (id: number, updates: any) => supabase.from('users').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('users').delete().eq('id', id)
    },
    
    // Projects table operations
    projects: {
      getAll: () => supabase.from('projects').select('*'),
      getById: (id: number) => supabase.from('projects').select('*').eq('id', id).single(),
      create: (project: any) => supabase.from('projects').insert(project).select().single(),
      update: (id: number, updates: any) => supabase.from('projects').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('projects').delete().eq('id', id)
    },
    
    // Transactions table operations
    transactions: {
      getAll: () => supabase.from('transactions').select('*'),
      getById: (id: number) => supabase.from('transactions').select('*').eq('id', id).single(),
      getByProject: (projectId: number) => supabase.from('transactions').select('*').eq('project_id', projectId),
      create: (transaction: any) => supabase.from('transactions').insert(transaction).select().single(),
      update: (id: number, updates: any) => supabase.from('transactions').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('transactions').delete().eq('id', id)
    },
    
    // Expense types operations
    expenseTypes: {
      getAll: () => supabase.from('expense_types').select('*'),
      getActive: () => supabase.from('expense_types').select('*').eq('is_active', true),
      getById: (id: number) => supabase.from('expense_types').select('*').eq('id', id).single(),
      create: (expenseType: any) => supabase.from('expense_types').insert(expenseType).select().single(),
      update: (id: number, updates: any) => supabase.from('expense_types').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('expense_types').delete().eq('id', id)
    },
    
    // Ledger entries operations
    ledgerEntries: {
      getAll: () => supabase.from('ledger_entries').select('*'),
      getByType: (entryType: string) => supabase.from('ledger_entries').select('*').eq('entry_type', entryType),
      getSummary: async () => {
        const { data, error } = await supabase.rpc('get_ledger_summary');
        return { data, error };
      },
      create: (entry: any) => supabase.from('ledger_entries').insert(entry).select().single(),
      update: (id: number, updates: any) => supabase.from('ledger_entries').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('ledger_entries').delete().eq('id', id)
    },
    
    // Documents operations
    documents: {
      getAll: () => supabase.from('documents').select('*'),
      getByProject: (projectId: number) => supabase.from('documents').select('*').eq('project_id', projectId),
      create: (document: any) => supabase.from('documents').insert(document).select().single(),
      update: (id: number, updates: any) => supabase.from('documents').update(updates).eq('id', id).select().single(),
      delete: (id: number) => supabase.from('documents').delete().eq('id', id)
    }
  },
  
  // Storage helpers
  storage: {
    upload: async (bucket: string, path: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      return { data, error };
    },
    
    download: async (bucket: string, path: string) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      return { data, error };
    },
    
    getPublicUrl: (bucket: string, path: string) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      return data.publicUrl;
    },
    
    remove: async (bucket: string, paths: string[]) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      return { data, error };
    }
  },
  
  // Real-time subscriptions
  subscribe: {
    toTable: (table: string, callback: (payload: any) => void) => {
      return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table }, 
          callback
        )
        .subscribe();
    },
    
    toUserChanges: (userId: number, callback: (payload: any) => void) => {
      return supabase
        .channel(`user-${userId}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `created_by=eq.${userId}` },
          callback
        )
        .subscribe();
    }
  }
};

// Export both default client and helpers
export default supabase;
