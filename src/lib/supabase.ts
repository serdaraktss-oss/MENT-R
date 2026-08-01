import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = ((import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || 'https://xeznkvkjdycmiubfyujq.supabase.co';
const SUPABASE_ANON_KEY = ((import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlem5rdmtqZHljbWl1YmZ5dWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzcwNTEsImV4cCI6MjEwMDUxMzA1MX0.7AAUnM9ChqRViDBa6zLSa9AiEb4i29zCbhg0AQ8yoyU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AppUserRecord {
  id?: string;
  username: string;
  password?: string;
  role: string;
  created_at?: string;
}

const LOCAL_USERS_KEY = 'mentor_app_registered_users';

// Helper to get local fallback users
const getLocalUsers = (): AppUserRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local users', err);
  }
  return [
    {
      id: 'admin-1',
      username: 'Serdar Aktaş',
      role: 'Yönetici',
      created_at: new Date().toISOString(),
    }
  ];
};

const saveLocalUser = (newUser: AppUserRecord) => {
  try {
    const existing = getLocalUsers();
    if (!existing.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      const updated = [newUser, ...existing];
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving local user', err);
  }
};

/**
 * Log in a user (Checks Serdar Aktaş admin credentials first, then Supabase app_users table, then local fallback)
 */
export async function loginAppUser(username: string, password: string): Promise<{
  success: boolean;
  user?: AppUserRecord;
  error?: string;
  isNotRegistered?: boolean;
}> {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Kullanıcı adı ve şifre zorunludur.' };
  }

  // 1. Admin account override check
  const lowerName = cleanUsername.toLowerCase();
  if (lowerName === 'serdar aktaş' || lowerName === 'serdar aktas') {
    if (cleanPassword === '12345') {
      return {
        success: true,
        user: {
          id: 'admin-serdar',
          username: 'Serdar Aktaş',
          role: 'Yönetici',
          created_at: new Date().toISOString()
        }
      };
    } else {
      return { success: false, error: 'Yönetici şifresi hatalıdır. (Varsayılan şifre: 12345)' };
    }
  }

  // 2. Query Supabase
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .ilike('username', cleanUsername)
      .limit(1);

    if (!error && data && data.length > 0) {
      const found = data[0];
      if (found.password === cleanPassword) {
        return {
          success: true,
          user: {
            id: found.id,
            username: found.username,
            role: found.role || 'Mentör',
            created_at: found.created_at
          }
        };
      } else {
        return { success: false, error: 'Girdiğiniz şifre hatalı!' };
      }
    }
  } catch (e) {
    console.warn('Supabase query failed, falling back to local storage', e);
  }

  // 3. Fallback to LocalStorage
  const localList = getLocalUsers();
  const matchedLocal = localList.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (matchedLocal) {
    if (matchedLocal.password && matchedLocal.password !== cleanPassword) {
      return { success: false, error: 'Girdiğiniz şifre hatalı!' };
    }
    return { success: true, user: matchedLocal };
  }

  return {
    success: false,
    isNotRegistered: true,
    error: 'Bu kullanıcı adı bulunamadı. Lütfen kayıt olun!'
  };
}

/**
 * Register a new user with username and password
 */
export async function registerAppUser(username: string, password: string): Promise<{
  success: boolean;
  user?: AppUserRecord;
  error?: string;
}> {
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Lütfen kullanıcı adı ve şifre giriniz.' };
  }

  if (cleanUsername.toLowerCase() === 'serdar aktaş' || cleanUsername.toLowerCase() === 'serdar aktas') {
    return { success: false, error: 'Bu kullanıcı adı yönetim hesabıdır, kayıt oluşturulamaz.' };
  }

  const newUserRecord: AppUserRecord = {
    username: cleanUsername,
    password: cleanPassword,
    role: 'Mentör',
    created_at: new Date().toISOString()
  };

  // Try to insert in Supabase
  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .ilike('username', cleanUsername);

    if (existing && existing.length > 0) {
      return { success: false, error: 'Bu kullanıcı adı zaten kayıtlı! Lütfen giriş yapın.' };
    }

    const { data, error } = await supabase
      .from('app_users')
      .insert([
        {
          username: cleanUsername,
          password: cleanPassword,
          role: 'Mentör'
        }
      ])
      .select();

    if (error) {
      console.warn('Supabase insert error, saving locally:', error.message);
      saveLocalUser(newUserRecord);
    } else if (data && data[0]) {
      newUserRecord.id = data[0].id;
      newUserRecord.created_at = data[0].created_at;
      saveLocalUser(newUserRecord);
    }
  } catch (e) {
    console.warn('Supabase registration error, saving locally:', e);
    saveLocalUser(newUserRecord);
  }

  return { success: true, user: newUserRecord };
}

/**
 * Fetch all registered users for Admin (Serdar Aktaş)
 */
export async function fetchAllRegisteredUsers(): Promise<AppUserRecord[]> {
  let supabaseUsers: AppUserRecord[] = [];

  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      supabaseUsers = data;
    }
  } catch (e) {
    console.warn('Could not fetch users from Supabase:', e);
  }

  const localUsers = getLocalUsers();

  // Merge lists without duplicates
  const map = new Map<string, AppUserRecord>();

  // Ensure default admin is present
  map.set('serdar aktaş', {
    id: 'admin-serdar',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    created_at: new Date().toISOString()
  });

  supabaseUsers.forEach(u => map.set(u.username.toLowerCase(), u));
  localUsers.forEach(u => {
    if (!map.has(u.username.toLowerCase())) {
      map.set(u.username.toLowerCase(), u);
    }
  });

  return Array.from(map.values());
}

/**
 * Shared Cloud Data Persistence via Supabase
 * Synchronizes Students, Annual Plans, and YKS Exams across all devices & users.
 */
export async function fetchSharedCloudData<T>(key: string, fallback: T): Promise<T> {
  try {
    // 1. Check Supabase 'app_store' table
    const { data: storeData, error: storeError } = await supabase
      .from('app_store')
      .select('content')
      .eq('key', key)
      .maybeSingle();

    if (!storeError && storeData && storeData.content !== undefined && storeData.content !== null) {
      try {
        localStorage.setItem(`cloud_cache_${key}`, JSON.stringify(storeData.content));
      } catch (e) {}
      return storeData.content as T;
    }

    // 2. Check Supabase 'app_settings' table
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', key)
      .maybeSingle();

    if (!settingsError && settingsData && settingsData.value !== undefined && settingsData.value !== null) {
      const parsed = typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value;
      try {
        localStorage.setItem(`cloud_cache_${key}`, JSON.stringify(parsed));
      } catch (e) {}
      return parsed as T;
    }
  } catch (err) {
    console.warn(`Supabase cloud fetch error for "${key}":`, err);
  }

  // 3. Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(`cloud_cache_${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  return fallback;
}

export async function saveSharedCloudData<T>(key: string, content: T): Promise<boolean> {
  // Save to local cache first
  try {
    localStorage.setItem(`cloud_cache_${key}`, JSON.stringify(content));
  } catch (e) {}

  try {
    // 1. Try upserting to 'app_store'
    const { error: err1 } = await supabase
      .from('app_store')
      .upsert({ key, content, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (!err1) return true;

    // 2. Try upserting to 'app_settings'
    const { error: err2 } = await supabase
      .from('app_settings')
      .upsert({ id: key, value: JSON.stringify(content), updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (!err2) return true;

    console.warn(`Supabase save issue for key ${key}:`, err1?.message || err2?.message);
  } catch (err) {
    console.warn(`Supabase save error for key "${key}":`, err);
  }

  return false;
}

