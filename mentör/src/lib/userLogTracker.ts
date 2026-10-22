export interface UserLoginLog {
  id: string;
  username: string;
  role: string;
  loginTime: string; // ISO string
  formattedTime: string; // e.g. "01.08.2026 10:45:12"
  deviceInfo: string;
  ipAddress?: string;
}

const LOCAL_LOGS_KEY = 'mentor_app_user_login_logs';

/**
 * Initial seed login logs so that the administrator immediately sees detailed historic login records.
 */
const SEED_LOGS: UserLoginLog[] = [
  // Serdar Aktaş (Admin)
  {
    id: 'log-seed-1',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    loginTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 15).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Chrome / Windows)',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-seed-2',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Chrome / Windows)',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-seed-3',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Mobil Web (Safari / iOS)',
    ipAddress: '192.168.1.15'
  },
  {
    id: 'log-seed-4',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Chrome / Windows)',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-seed-5',
    username: 'Serdar Aktaş',
    role: 'Yönetici',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Firefox / macOS)',
    ipAddress: '192.168.1.20'
  },
  // Mentör users
  {
    id: 'log-seed-6',
    username: 'Elif Şahin',
    role: 'Mentör',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Chrome / Windows)',
    ipAddress: '192.168.2.44'
  },
  {
    id: 'log-seed-7',
    username: 'Elif Şahin',
    role: 'Mentör',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Web Portalı (Edge / Windows)',
    ipAddress: '192.168.2.44'
  },
  {
    id: 'log-seed-8',
    username: 'Caner Yıldız',
    role: 'Mentör',
    loginTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    formattedTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }),
    deviceInfo: 'Mobil Web (Chrome / Android)',
    ipAddress: '192.168.3.88'
  }
];

/**
 * Get all stored login logs (reads from localStorage or returns seed logs)
 */
export function getAllLoginLogs(): UserLoginLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read login logs from localStorage:', err);
  }

  // If empty or missing, seed initial logs
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(SEED_LOGS));
  } catch (e) {
    console.error('Failed to save seed logs:', e);
  }
  return SEED_LOGS;
}

/**
 * Record a new login event
 */
export function recordUserLogin(username: string, role?: string): UserLoginLog {
  const cleanUsername = username.trim();
  const isAdmin = cleanUsername.toLowerCase().includes('serdar aktaş') || cleanUsername.toLowerCase().includes('serdar aktas');
  const userRole = role || (isAdmin ? 'Yönetici' : 'Mentör');

  const now = new Date();
  const newLog: UserLoginLog = {
    id: 'log-' + now.getTime() + '-' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    role: userRole,
    loginTime: now.toISOString(),
    formattedTime: now.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    deviceInfo: 'Web Portalı (Aktif Oturum)',
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 50 + 10)
  };

  const logs = getAllLoginLogs();
  const updatedLogs = [newLog, ...logs];

  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Failed to save login log:', e);
  }

  return newLog;
}

/**
 * Get login count for a specific username
 */
export function getUserLoginCount(username: string): number {
  const logs = getAllLoginLogs();
  const target = username.trim().toLowerCase();
  return logs.filter(l => l.username.trim().toLowerCase() === target).length;
}

/**
 * Get detailed login logs list for a specific username
 */
export function getUserLogsList(username: string): UserLoginLog[] {
  const logs = getAllLoginLogs();
  const target = username.trim().toLowerCase();
  return logs.filter(l => l.username.trim().toLowerCase() === target);
}

/**
 * Get last login date string for a specific username
 */
export function getUserLastLogin(username: string): string | null {
  const userLogs = getUserLogsList(username);
  if (userLogs.length === 0) return null;
  return userLogs[0].formattedTime;
}

/**
 * Clear all login logs
 */
export function clearAllLoginLogs(): void {
  try {
    localStorage.removeItem(LOCAL_LOGS_KEY);
  } catch (e) {
    console.error('Failed to clear login logs:', e);
  }
}
