import { UserAccount, SuiteModule, AuthSession, SecurityAuditLog } from '../types';

export const ACCOUNTS_STORAGE_KEY = 'schoolPortalAccounts_v2';
export const SESSIONS_STORAGE_KEY = 'schoolPortalActiveSessions_v2';
export const AUDIT_LOGS_STORAGE_KEY = 'schoolPortalAuditLogs_v2';

export const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc-admin-main',
    username: 'admin',
    password: 'admin123',
    displayName: 'Administrator Utama',
    role: 'admin',
    allowedModules: ['info', 'teacher', 'student', 'data-quiz'],
    isActive: true,
    createdAt: '2026-08-01 08:00:00',
    note: 'Super Admin - Hak akses penuh ke Portal Informasi, Scan Guru, Scan Siswa, dan Data Quiz'
  },
  {
    id: 'acc-operator-info',
    username: 'portal',
    password: 'portal123',
    displayName: 'Operator Portal Info',
    role: 'operator',
    allowedModules: ['info'],
    isActive: true,
    createdAt: '2026-08-01 08:00:00',
    note: 'Pengelola Data Akademik, Kurikulum, dan Guru/Siswa'
  },
  {
    id: 'acc-operator-teacher',
    username: 'guru',
    password: 'guru123',
    displayName: 'Operator Scan Guru',
    role: 'teacher',
    allowedModules: ['teacher'],
    isActive: true,
    createdAt: '2026-08-01 08:00:00',
    note: 'Petugas Piket Terminal Presensi Guru'
  },
  {
    id: 'acc-operator-student',
    username: 'siswa',
    password: 'siswa123',
    displayName: 'Operator Kiosk Siswa',
    role: 'kiosk',
    allowedModules: ['student'],
    isActive: true,
    createdAt: '2026-08-01 08:00:00',
    note: 'Petugas Standby Kiosk Presensi Siswa Mandiri'
  }
];

export const getAccounts = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  } catch (error) {
    console.error('Failed to load accounts:', error);
    return DEFAULT_ACCOUNTS;
  }
};

export const saveAccounts = (accounts: UserAccount[]): void => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save accounts:', error);
  }
};

export const saveAccount = (account: UserAccount): { success: boolean; message: string } => {
  try {
    const accounts = getAccounts();
    const cleanUsername = account.username.trim().toLowerCase();
    
    if (!cleanUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }
    if (!account.password) {
      return { success: false, message: 'Password tidak boleh kosong.' };
    }
    if (!account.allowedModules || account.allowedModules.length === 0) {
      return { success: false, message: 'Wajib memilih minimal satu modul akses.' };
    }

    // Check duplicate username (case-insensitive) except current account id
    const isDuplicate = accounts.some(a => a.id !== account.id && a.username.trim().toLowerCase() === cleanUsername);
    if (isDuplicate) {
      return { success: false, message: `Username "${account.username}" sudah digunakan oleh akun lain.` };
    }

    const index = accounts.findIndex(a => a.id === account.id);
    let updated: UserAccount[];
    if (index >= 0) {
      updated = [...accounts];
      updated[index] = { ...account, username: cleanUsername };
    } else {
      updated = [{ ...account, username: cleanUsername, createdAt: new Date().toLocaleString('id-ID') }, ...accounts];
    }

    saveAccounts(updated);
    return { success: true, message: 'Akun berhasil disimpan.' };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan sistem saat menyimpan akun.' };
  }
};

export const deleteAccount = (accountId: string): { success: boolean; message: string } => {
  try {
    const accounts = getAccounts();
    const accountToDelete = accounts.find(a => a.id === accountId);
    
    if (!accountToDelete) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }

    // Ensure at least 1 active admin account remains
    const activeAdmins = accounts.filter(a => a.isActive && a.role === 'admin' && a.id !== accountId);
    if (accountToDelete.role === 'admin' && activeAdmins.length === 0) {
      return { success: false, message: 'Tidak dapat menghapus akun admin terakhir. Sistem membutuhkan minimal satu Administrator aktif.' };
    }

    const updated = accounts.filter(a => a.id !== accountId);
    saveAccounts(updated);
    return { success: true, message: `Akun "${accountToDelete.username}" berhasil dihapus.` };
  } catch (error) {
    return { success: false, message: 'Gagal menghapus akun.' };
  }
};

export const resetAccountsToDefault = (): UserAccount[] => {
  saveAccounts(DEFAULT_ACCOUNTS);
  return DEFAULT_ACCOUNTS;
};

export const getAuditLogs = (): SecurityAuditLog[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addAuditLog = (log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void => {
  try {
    const current = getAuditLogs();
    const newLog: SecurityAuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    const updated = [newLog, ...current].slice(0, 100); // keep last 100 logs
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to log audit:', e);
  }
};

export const clearAuditLogs = (): void => {
  try {
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
  } catch (e) {}
};

// Sessions Management
export const getActiveSessions = (): Record<SuiteModule, AuthSession | null> => {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    info: null,
    teacher: null,
    student: null,
    'data-quiz': null
  };
};

export const getSession = (module: SuiteModule): AuthSession | null => {
  const sessions = getActiveSessions();
  return sessions[module] || null;
};

export const saveSession = (session: AuthSession): void => {
  try {
    const sessions = getActiveSessions();
    sessions[session.activeModule] = session;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

export const clearSession = (module: SuiteModule): void => {
  try {
    const sessions = getActiveSessions();
    const current = sessions[module];
    if (current) {
      addAuditLog({
        username: current.username,
        module,
        status: 'LOGOUT',
        details: `Sesi modul ${module} dikunci/diakhiri`
      });
    }
    sessions[module] = null;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};

export const clearAllSessions = (): void => {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  } catch (e) {}
};

export const authenticate = (
  usernameInput: string,
  passwordInput: string,
  targetModule: SuiteModule,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; account?: UserAccount; error?: string } => {
  const accounts = getAccounts();
  const cleanUsername = usernameInput.trim().toLowerCase();

  if (!cleanUsername || !passwordInput) {
    return { success: false, error: 'Silakan isi username dan password lengkap.' };
  }

  const account = accounts.find(a => a.username.trim().toLowerCase() === cleanUsername);

  if (!account) {
    addAuditLog({
      username: usernameInput,
      module: targetModule,
      status: 'FAILED',
      details: 'Username tidak ditemukan'
    });
    return { success: false, error: 'Username atau password yang Anda masukkan salah.' };
  }

  if (!account.isActive) {
    addAuditLog({
      username: account.username,
      module: targetModule,
      status: 'FAILED',
      details: 'Akun berstatus nonaktif'
    });
    return { success: false, error: 'Akun ini sedang dinonaktifkan oleh administrator.' };
  }

  if (account.password !== passwordInput) {
    addAuditLog({
      username: account.username,
      module: targetModule,
      status: 'FAILED',
      details: 'Password salah'
    });
    return { success: false, error: 'Username atau password yang Anda masukkan salah.' };
  }

  // Check if account has permission for targetModule
  const hasPermission = account.allowedModules.includes(targetModule) || account.role === 'admin';
  if (!hasPermission) {
    const moduleNames: Record<SuiteModule, string> = {
      info: 'Portal Informasi',
      teacher: 'Scan Station Guru',
      student: 'Scan Station Siswa',
      'data-quiz': 'Database & Data Quiz'
    };
    addAuditLog({
      username: account.username,
      module: targetModule,
      status: 'FAILED',
      details: `Akses ditolak ke modul ${moduleNames[targetModule]}`
    });
    return {
      success: false,
      error: `Akun "${account.username}" tidak memiliki hak akses untuk membuka ${moduleNames[targetModule]}. Hubungi Admin.`
    };
  }

  // Update last login
  const updatedAccounts = accounts.map(a => 
    a.id === account.id ? { ...a, lastLogin: new Date().toLocaleString('id-ID') } : a
  );
  saveAccounts(updatedAccounts);

  // Create session
  const session: AuthSession = {
    accountId: account.id,
    username: account.username,
    displayName: account.displayName || account.username,
    role: account.role,
    allowedModules: account.allowedModules,
    activeModule: targetModule,
    loginTimestamp: Date.now(),
    rememberMe
  };

  saveSession(session);

  addAuditLog({
    username: account.username,
    module: targetModule,
    status: 'SUCCESS',
    details: `Login berhasil sebagai ${account.displayName}`
  });

  return { success: true, session, account };
};
