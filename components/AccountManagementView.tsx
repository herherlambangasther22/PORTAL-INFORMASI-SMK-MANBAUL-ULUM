import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { UserAccount, SuiteModule, SecurityAuditLog, Notification } from '../types';
import { 
    getAccounts, 
    saveAccount, 
    deleteAccount, 
    resetAccountsToDefault, 
    getAuditLogs, 
    clearAuditLogs,
    clearAllSessions
} from '../utils/authManager';
import { 
    ShieldCheckIcon, 
    LockIcon, 
    KeyIcon, 
    UserPlusIcon, 
    UserIcon, 
    EditIcon, 
    TrashIcon, 
    EyeIcon, 
    EyeSlashIcon, 
    CheckCircleIcon, 
    XIcon, 
    SearchIcon, 
    TeacherIcon, 
    StudentIcon, 
    InfoIcon,
    DownloadIcon,
    UploadIcon,
    MenuIcon,
    BellIcon,
    ClockIcon,
    SparklesIcon
} from './icons/Icons';
import { PORTAL_NAME } from '../constants';

interface AccountManagementViewProps {
    onMenuClick: () => void;
    notifications: Notification[];
    onNotificationsOpen: () => void;
    activeSchool?: string;
    onResetAllData?: () => Promise<void> | void;
}

export const AccountManagementView: React.FC<AccountManagementViewProps> = ({
    onMenuClick,
    notifications,
    onNotificationsOpen,
    onResetAllData
}) => {
    const [accounts, setAccounts] = useState<UserAccount[]>(() => getAccounts());
    const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(() => getAuditLogs());
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterModule, setFilterModule] = useState<string>('all');

    // Modal state for Add / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

    // Form inputs
    const [formDisplayName, setFormDisplayName] = useState('');
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formShowPassword, setFormShowPassword] = useState(false);
    const [formRole, setFormRole] = useState<'admin' | 'operator' | 'teacher' | 'kiosk'>('operator');
    const [formModules, setFormModules] = useState<SuiteModule[]>(['info']);
    const [formIsActive, setFormIsActive] = useState(true);
    const [formNote, setFormNote] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    // Visible password peek state for account table items: Set of account IDs
    const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

    // Factory Reset / Hapus Seluruh Data state
    const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
    const [resetConfirmationInput, setResetConfirmationInput] = useState('');
    const [isResettingAll, setIsResettingAll] = useState(false);

    // Feedback Toast / Alert
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const refreshData = () => {
        setAccounts(getAccounts());
        setAuditLogs(getAuditLogs());
    };

    // Handler to download backup before wiping
    const handleDownloadBackupBeforeWipe = () => {
        try {
            const allStorageData: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    try {
                        allStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null');
                    } catch {
                        allStorageData[key] = localStorage.getItem(key);
                    }
                }
            }
            const blob = new Blob([JSON.stringify(allStorageData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_darurat_smkmu_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Cadangan darurat berhasil diunduh.');
        } catch (err) {
            showToast('Gagal membuat unduhan cadangan.', 'error');
        }
    };

    // Handler to execute complete wipe & factory reset
    const handleExecuteFactoryReset = async () => {
        if (resetConfirmationInput.trim().toUpperCase() !== 'RESET') {
            showToast('Ketik kata "RESET" dengan benar untuk mengonfirmasi.', 'error');
            return;
        }

        setIsResettingAll(true);
        try {
            // Clear all auth sessions
            clearAllSessions();

            // Clear all local storage and session storage
            localStorage.clear();
            sessionStorage.clear();

            if (onResetAllData) {
                await onResetAllData();
            } else {
                window.location.reload();
            }
        } catch (err) {
            // Fallback hard clear
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    // Filtered accounts
    const filteredAccounts = useMemo(() => {
        return accounts.filter(acc => {
            const matchesSearch = 
                acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                acc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (acc.note || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = filterRole === 'all' || acc.role === filterRole;
            const matchesModule = filterModule === 'all' || acc.allowedModules.includes(filterModule as SuiteModule) || acc.role === 'admin';

            return matchesSearch && matchesRole && matchesModule;
        });
    }, [accounts, searchQuery, filterRole, filterModule]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = accounts.length;
        const active = accounts.filter(a => a.isActive).length;
        const hasInfo = accounts.filter(a => a.allowedModules.includes('info') || a.role === 'admin').length;
        const hasTeacher = accounts.filter(a => a.allowedModules.includes('teacher') || a.role === 'admin').length;
        const hasStudent = accounts.filter(a => a.allowedModules.includes('student') || a.role === 'admin').length;
        return { total, active, hasInfo, hasTeacher, hasStudent };
    }, [accounts]);

    const handleOpenAddModal = () => {
        setEditingAccount(null);
        setFormDisplayName('');
        setFormUsername('');
        setFormPassword('');
        setFormShowPassword(false);
        setFormRole('operator');
        setFormModules(['info']);
        setFormIsActive(true);
        setFormNote('');
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (acc: UserAccount) => {
        setEditingAccount(acc);
        setFormDisplayName(acc.displayName);
        setFormUsername(acc.username);
        setFormPassword(acc.password);
        setFormShowPassword(false);
        setFormRole(acc.role);
        setFormModules([...acc.allowedModules]);
        setFormIsActive(acc.isActive);
        setFormNote(acc.note || '');
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleGenerateRandomPassword = () => {
        const chars = 'abcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let pass = '';
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormPassword(pass);
        setFormShowPassword(true);
    };

    const handleToggleModuleInForm = (mod: SuiteModule) => {
        if (formModules.includes(mod)) {
            if (formModules.length === 1) {
                setFormError('Setiap akun wajib memiliki minimal satu modul akses.');
                return;
            }
            setFormModules(formModules.filter(m => m !== mod));
        } else {
            setFormModules([...formModules, mod]);
        }
        setFormError(null);
    };

    const handleSaveAccountForm = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formUsername.trim()) {
            setFormError('Username tidak boleh kosong.');
            return;
        }
        if (!formPassword) {
            setFormError('Password tidak boleh kosong.');
            return;
        }
        if (formModules.length === 0) {
            setFormError('Pilih minimal satu modul izin akses.');
            return;
        }

        const accountToSave: UserAccount = {
            id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
            username: formUsername.trim().toLowerCase(),
            password: formPassword,
            displayName: formDisplayName.trim() || formUsername.trim(),
            role: formRole,
            allowedModules: formModules,
            isActive: formIsActive,
            createdAt: editingAccount ? editingAccount.createdAt : new Date().toLocaleString('id-ID'),
            lastLogin: editingAccount?.lastLogin,
            note: formNote.trim()
        };

        const result = saveAccount(accountToSave);
        if (result.success) {
            refreshData();
            setIsModalOpen(false);
            showToast(editingAccount ? `Akun "${formUsername}" berhasil diperbarui.` : `Akun baru "${formUsername}" berhasil ditambahkan.`);
        } else {
            setFormError(result.message);
        }
    };

    const handleDeleteAccount = (acc: UserAccount) => {
        const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus akun "${acc.username}" (${acc.displayName})?`);
        if (!confirmDelete) return;

        const res = deleteAccount(acc.id);
        if (res.success) {
            refreshData();
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
    };

    const handleToggleActiveStatus = (acc: UserAccount) => {
        // Prevent deactivating last admin
        if (acc.role === 'admin' && acc.isActive) {
            const otherActiveAdmins = accounts.filter(a => a.isActive && a.role === 'admin' && a.id !== acc.id);
            if (otherActiveAdmins.length === 0) {
                showToast('Tidak dapat menonaktifkan akun admin terakhir.', 'error');
                return;
            }
        }

        const updated: UserAccount = { ...acc, isActive: !acc.isActive };
        saveAccount(updated);
        refreshData();
        showToast(`Akun "${acc.username}" kini ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    };

    const toggleRevealPassword = (id: string) => {
        setRevealedPasswords(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleResetDefaults = () => {
        const confirmReset = window.confirm(
            'PERINGATAN: Apakah Anda yakin ingin mereset seluruh akun login ke pengaturan bawaan (default)? Semua akun kustom akan digantikan dengan akun bawaan (admin, portal, guru, siswa).'
        );
        if (!confirmReset) return;

        resetAccountsToDefault();
        clearAllSessions();
        refreshData();
        showToast('Seluruh akun dan sesi login telah direset ke pengaturan standar bawaan.');
    };

    const handleExportAccounts = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `backup-akun-smkmu-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('File backup data akun berhasil diunduh.');
    };

    const handleImportAccounts = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].username && parsed[0].password) {
                    localStorage.setItem('schoolPortalAccounts_v2', JSON.stringify(parsed));
                    refreshData();
                    showToast(`Berhasil mengimpor ${parsed.length} akun pengguna.`);
                } else {
                    showToast('Format file JSON akun tidak valid.', 'error');
                }
            } catch (err) {
                showToast('Gagal membaca file JSON cadangan.', 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-slide-up-fade">
            
            {/* Top Bar / Header */}
            <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                        onClick={onMenuClick}
                        className="p-2.5 rounded-2xl bg-[#e0e5ec] text-slate-700 shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] lg:hidden hover:text-slate-900 transition-all cursor-pointer shrink-0"
                        title="Buka Menu"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight truncate">
                                Manajemen Akses & Keamanan Login
                            </h1>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                            Kelola kredensial username, kata sandi, dan hak akses modul Portal Informasi, Scan Guru, dan Scan Siswa
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons - Aligned flush to the right edge */}
                <div className="w-full lg:w-auto flex flex-wrap items-center justify-end gap-2.5 shrink-0 lg:ml-auto">
                    <button
                        onClick={handleOpenAddModal}
                        className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-[4px_4px_10px_#bec3c9,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer flex items-center gap-2 transition-all active:scale-98"
                    >
                        <UserPlusIcon className="w-4 h-4" />
                        <span>Tambah Akun</span>
                    </button>

                    <button
                        onClick={handleExportAccounts}
                        className="p-2.5 rounded-2xl bg-[#e0e5ec] text-slate-700 hover:text-slate-900 shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all"
                        title="Ekspor / Backup Akun JSON"
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>

                    <label 
                        className="p-2.5 rounded-2xl bg-[#e0e5ec] text-slate-700 hover:text-slate-900 shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all"
                        title="Impor Akun dari File JSON"
                    >
                        <UploadIcon className="w-4 h-4" />
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleImportAccounts} 
                            className="hidden" 
                        />
                    </label>

                    <button
                        onClick={handleResetDefaults}
                        className="px-3.5 py-2.5 rounded-2xl bg-[#e0e5ec] text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all"
                        title="Kembalikan semua akun ke default pabrik"
                    >
                        Reset Default
                    </button>
                </div>
            </div>

            {/* Toast feedback */}
            {toastMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-scale-up ${
                    toastMessage.type === 'success' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-rose-600 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        {toastMessage.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
                        <span>{toastMessage.text}</span>
                    </div>
                    <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 1. STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Card className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Akun</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                        <span className="text-xs text-slate-500 font-semibold">User</span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Akun Aktif</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
                        <span className="text-xs text-emerald-600 font-semibold">Aktif</span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Akses Portal Info</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-blue-700">{stats.hasInfo}</span>
                        <span className="text-xs text-blue-600 font-semibold">Akun</span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Akses Scan Guru</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-emerald-700">{stats.hasTeacher}</span>
                        <span className="text-xs text-emerald-600 font-semibold">Akun</span>
                    </div>
                </Card>

                <Card className="p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Akses Kiosk Siswa</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-amber-700">{stats.hasStudent}</span>
                        <span className="text-xs text-amber-600 font-semibold">Akun</span>
                    </div>
                </Card>
            </div>

            {/* 2. FILTER & SEARCH CONTROLS */}
            <Card className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    
                    {/* Search Input */}
                    <div className="sm:col-span-6 relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400">
                            <SearchIcon className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari username, nama pengguna, atau catatan..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-medium placeholder-slate-400 border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600">
                                <XIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Role */}
                    <div className="sm:col-span-3">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#e0e5ec] text-slate-700 text-xs font-bold border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none"
                        >
                            <option value="all">Semua Peran / Role</option>
                            <option value="admin">Administrator (Super Admin)</option>
                            <option value="operator">Operator Portal Info</option>
                            <option value="teacher">Petugas Presensi Guru</option>
                            <option value="kiosk">Operator Kiosk Siswa</option>
                        </select>
                    </div>

                    {/* Filter Module */}
                    <div className="sm:col-span-3">
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#e0e5ec] text-slate-700 text-xs font-bold border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none"
                        >
                            <option value="all">Semua Izin Modul</option>
                            <option value="info">Modul Portal Info</option>
                            <option value="teacher">Modul Scan Station Guru</option>
                            <option value="student">Modul Scan Station Siswa</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* 3. ACCOUNTS LIST TABLE / CARDS */}
            <Card className="p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <KeyIcon className="w-5 h-5 text-rose-600" />
                        <span>Daftar Akun Pengguna Terdaftar</span>
                        <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full ml-1">
                            {filteredAccounts.length}
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                <th className="pb-3 pl-2">Pengguna / Identitas</th>
                                <th className="pb-3">Username & Password</th>
                                <th className="pb-3">Peran / Role</th>
                                <th className="pb-3">Izin Akses Modul</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Login Terakhir</th>
                                <th className="pb-3 pr-2 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                                        Tidak ada data akun yang cocok dengan filter pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((acc) => {
                                    const isRevealed = revealedPasswords.has(acc.id);
                                    return (
                                        <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                                            
                                            {/* Name & Avatar */}
                                            <td className="py-3.5 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-black shadow-xs shrink-0 uppercase">
                                                        {acc.displayName.charAt(0) || acc.username.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm">{acc.displayName}</div>
                                                        {acc.note && (
                                                            <div className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={acc.note}>
                                                                {acc.note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Username & Password */}
                                            <td className="py-3.5">
                                                <div className="space-y-1">
                                                    <div className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">
                                                        @{acc.username}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                                                            {isRevealed ? acc.password : '••••••••'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRevealPassword(acc.id)}
                                                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                                            title={isRevealed ? 'Sembunyikan password' : 'Lihat password'}
                                                        >
                                                            {isRevealed ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    acc.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                        : acc.role === 'operator'
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                        : acc.role === 'teacher'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {acc.role === 'admin' && 'Super Admin'}
                                                    {acc.role === 'operator' && 'Operator Info'}
                                                    {acc.role === 'teacher' && 'Petugas Guru'}
                                                    {acc.role === 'kiosk' && 'Petugas Kiosk'}
                                                </span>
                                            </td>

                                            {/* Allowed Modules */}
                                            <td className="py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {(acc.role === 'admin' || acc.allowedModules.includes('info')) && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                                                            <InfoIcon className="w-3 h-3" /> Info
                                                        </span>
                                                    )}
                                                    {(acc.role === 'admin' || acc.allowedModules.includes('teacher')) && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                                            <TeacherIcon className="w-3 h-3" /> Guru
                                                        </span>
                                                    )}
                                                    {(acc.role === 'admin' || acc.allowedModules.includes('student')) && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                                                            <StudentIcon className="w-3 h-3" /> Siswa
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Active Status */}
                                            <td className="py-3.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActiveStatus(acc)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                                                        acc.isActive 
                                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                    }`}
                                                    title="Klik untuk mengubah status aktif/nonaktif"
                                                >
                                                    {acc.isActive ? '● Aktif' : '○ Nonaktif'}
                                                </button>
                                            </td>

                                            {/* Last Login */}
                                            <td className="py-3.5 text-slate-500 text-[11px]">
                                                {acc.lastLogin ? (
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3 text-slate-400" />
                                                        {acc.lastLogin}
                                                    </span>
                                                ) : (
                                                    <span className="italic text-slate-400">Belum pernah login</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 pr-2 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(acc)}
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                                        title="Edit Akun"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAccount(acc)}
                                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                                        title="Hapus Akun"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 4. SECURITY AUDIT LOGS */}
            <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-black text-slate-800">
                            Riwayat Aktivitas Autentikasi (Audit Log)
                        </h3>
                    </div>
                    {auditLogs.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                clearAuditLogs();
                                refreshData();
                                showToast('Riwayat audit log berhasil dibersihkan.');
                            }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                            Bersihkan Log
                        </button>
                    )}
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
                    {auditLogs.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 italic">
                            Belum ada catatan aktivitas login terbaru.
                        </div>
                    ) : (
                        auditLogs.map((log) => (
                            <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${
                                        log.status === 'SUCCESS' ? 'bg-emerald-500' : log.status === 'FAILED' ? 'bg-rose-500' : 'bg-slate-400'
                                    }`} />
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            <span>@{log.username}</span>
                                            <span className={`text-[9px] px-2 py-0.2 rounded font-black uppercase ${
                                                log.status === 'SUCCESS' 
                                                    ? 'bg-emerald-100 text-emerald-800' 
                                                    : log.status === 'FAILED'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {log.status}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">[{log.module}]</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {log.details}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {new Date(log.timestamp).toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* 5. ZONA PEMELIHARAAN: HAPUS & RESET TOTAL SELURUH DATA APLIKASI */}
            <Card className="p-4 sm:p-6 border border-rose-200/90 bg-rose-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                                <TrashIcon className="w-5 h-5" />
                            </span>
                            <h3 className="text-base font-black text-rose-800">
                                Zona Pemeliharaan: Hapus & Reset Seluruh Data Aplikasi
                            </h3>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                            Fitur ini akan mengosongkan seluruh memori lokal aplikasi (Data Siswa, Data Guru, Rekam Log Presensi, Foto & Biometrik Wajah, Kode RFID & QR, Jadwal Pelajaran, Nilai, E-Learning, Akun Pengguna Tambahan, dan Riwayat Snapshot) agar aplikasi kembali bersih seperti baru pertama kali diinstal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setResetConfirmationInput('');
                            setIsResetAllModalOpen(true);
                        }}
                        className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-[4px_4px_10px_#bec3c9,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98 shrink-0"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Hapus Seluruh Data</span>
                    </button>
                </div>
            </Card>

            {/* 6. MODAL FORM: ADD / EDIT ACCOUNT */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg bg-[#e0e5ec] rounded-3xl p-6 sm:p-8 shadow-[20px_20px_60px_#1e293b80,-20px_-20px_60px_#ffffff20] border border-white/40 my-auto animate-scale-up">
                        
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                                    {editingAccount ? <EditIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                                </span>
                                <h3 className="text-lg font-black text-slate-800">
                                    {editingAccount ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-xl bg-[#e0e5ec] text-slate-500 hover:text-slate-900 shadow-[2px_2px_5px_#bec3c9,-2px_-2px_5px_#ffffff] transition-colors cursor-pointer"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 shrink-0 text-rose-500" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveAccountForm} className="space-y-4">
                            
                            {/* Display Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Nama Lengkap / Identitas Pengguna
                                </label>
                                <input
                                    type="text"
                                    value={formDisplayName}
                                    onChange={(e) => setFormDisplayName(e.target.value)}
                                    placeholder="Contoh: Pak Budi (Guru Piket)"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-medium border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                                />
                            </div>

                            {/* Username & Password in 2 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Username <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formUsername}
                                        onChange={(e) => setFormUsername(e.target.value)}
                                        placeholder="huruf kecil, cth: budi123"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-bold font-mono border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Password <span className="text-rose-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateRandomPassword}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                        >
                                            + Acak Sandi
                                        </button>
                                    </div>
                                    <div className="relative flex items-center">
                                        <input
                                            type={formShowPassword ? 'text' : 'password'}
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            placeholder="Masukkan kata sandi"
                                            required
                                            className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-bold font-mono border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormShowPassword(!formShowPassword)}
                                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        >
                                            {formShowPassword ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Peran / Role
                                </label>
                                <select
                                    value={formRole}
                                    onChange={(e) => {
                                        const r = e.target.value as any;
                                        setFormRole(r);
                                        // Auto adjust module presets
                                        if (r === 'admin') setFormModules(['info', 'teacher', 'student']);
                                        else if (r === 'operator') setFormModules(['info']);
                                        else if (r === 'teacher') setFormModules(['teacher']);
                                        else if (r === 'kiosk') setFormModules(['student']);
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-bold border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none"
                                >
                                    <option value="admin">Administrator (Super Admin - Akses Seluruh Modul)</option>
                                    <option value="operator">Operator Portal Informasi (Akademik & Kurikulum)</option>
                                    <option value="teacher">Petugas Presensi Guru (Terminal Scan Guru)</option>
                                    <option value="kiosk">Operator Kiosk Siswa (Terminal Scan Siswa)</option>
                                </select>
                            </div>

                            {/* Allowed Modules Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Hak Akses Modul Aplikasi
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    
                                    {/* Portal Info Module */}
                                    <div 
                                        onClick={() => handleToggleModuleInForm('info')}
                                        className={`p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                                            formModules.includes('info')
                                                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                                                : 'bg-white/40 border-slate-300 text-slate-600 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <input 
                                                type="checkbox" 
                                                checked={formModules.includes('info')} 
                                                readOnly 
                                                className="w-3.5 h-3.5 text-blue-600 rounded" 
                                            />
                                            <span className="font-black text-xs">Portal Info</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-tight">
                                            Data Sekolah, Siswa, Guru, dan Jadwal
                                        </p>
                                    </div>

                                    {/* Teacher Portal Module */}
                                    <div 
                                        onClick={() => handleToggleModuleInForm('teacher')}
                                        className={`p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                                            formModules.includes('teacher')
                                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                                                : 'bg-white/40 border-slate-300 text-slate-600 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <input 
                                                type="checkbox" 
                                                checked={formModules.includes('teacher')} 
                                                readOnly 
                                                className="w-3.5 h-3.5 text-emerald-600 rounded" 
                                            />
                                            <span className="font-black text-xs">Scan Guru</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-tight">
                                            Terminal Presensi Guru (RFID/QR/Wajah)
                                        </p>
                                    </div>

                                    {/* Student Kiosk Module */}
                                    <div 
                                        onClick={() => handleToggleModuleInForm('student')}
                                        className={`p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                                            formModules.includes('student')
                                                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                                                : 'bg-white/40 border-slate-300 text-slate-600 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <input 
                                                type="checkbox" 
                                                checked={formModules.includes('student')} 
                                                readOnly 
                                                className="w-3.5 h-3.5 text-amber-600 rounded" 
                                            />
                                            <span className="font-black text-xs">Kiosk Siswa</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-tight">
                                            Kiosk Presensi Mandiri Siswa SMK Manbaul Ulum
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Catatan / Keterangan Khusus
                                </label>
                                <input
                                    type="text"
                                    value={formNote}
                                    onChange={(e) => setFormNote(e.target.value)}
                                    placeholder="Contoh: Akun khusus laptop piket lantai 1"
                                    className="w-full px-3.5 py-2 rounded-xl bg-[#e0e5ec] text-slate-800 text-xs font-medium border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none"
                                />
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={formIsActive}
                                        onChange={(e) => setFormIsActive(e.target.checked)}
                                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Akun Aktif (Dapat Login)</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-300">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-600 hover:text-slate-900 text-xs font-bold shadow-[2px_2px_5px_#bec3c9,-2px_-2px_5px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-[4px_4px_10px_#bec3c9,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all active:scale-98"
                                >
                                    {editingAccount ? 'Simpan Perubahan' : 'Tambah Akun'}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* 7. MODAL KONFIRMASI HAPUS & RESET TOTAL DATA APLIKASI */}
            {isResetAllModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg bg-[#e0e5ec] rounded-3xl p-6 sm:p-8 shadow-[20px_20px_60px_#1e293b90,-20px_-20px_60px_#ffffff20] border border-rose-300 my-auto animate-scale-up">
                        
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                                    <TrashIcon className="w-6 h-6" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-black text-rose-900">
                                        Konfirmasi Reset Total Aplikasi
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Tindakan ini permanen dan tidak dapat dibatalkan
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsResetAllModalOpen(false)}
                                className="p-2 rounded-xl bg-[#e0e5ec] text-slate-500 hover:text-slate-900 shadow-[2px_2px_5px_#bec3c9,-2px_-2px_5px_#ffffff] transition-colors cursor-pointer"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Detail Peringatan */}
                        <div className="p-4 rounded-2xl bg-rose-100/70 border border-rose-200 text-rose-900 text-xs space-y-2 mb-4">
                            <p className="font-bold">
                                Seluruh data berikut akan dihapus bersih dari browser:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                                <li>Seluruh Data Pokok Siswa, Kelas, & NISN</li>
                                <li>Seluruh Data Guru, NIP, & Mata Pelajaran</li>
                                <li>Seluruh Rekam Log Presensi & Riwayat Kehadiran</li>
                                <li>Seluruh Pendaftaran Biometrik Wajah & Foto Profil</li>
                                <li>Seluruh Kode Kartu RFID & QR Code Terdaftar</li>
                                <li>Seluruh Materi E-Learning & Rekap Nilai Akademik</li>
                                <li>Seluruh Jadwal Pelajaran & Kalender Kegiatan</li>
                                <li>Seluruh Akun Tambahan & Sesi Login Aktif</li>
                                <li>Seluruh Snapshot Titik Pemulihan Lokal</li>
                            </ul>
                        </div>

                        {/* Opsi Unduh Cadangan Darurat Dulu */}
                        <div className="mb-4 p-3 rounded-2xl bg-white/60 border border-slate-200 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Amankan Data Terlebih Dahulu?</p>
                                <p className="text-[10px] text-slate-500">Unduh salinan JSON sebelum menghapus.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadBackupBeforeWipe}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                                <DownloadIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Unduh Cadangan</span>
                            </button>
                        </div>

                        {/* Input Teks Konfirmasi */}
                        <div className="space-y-1.5 mb-5">
                            <label className="block text-xs font-bold text-slate-700">
                                Ketik kata <span className="font-mono text-rose-600 font-black">RESET</span> untuk mengonfirmasi penghapusan:
                            </label>
                            <input
                                type="text"
                                value={resetConfirmationInput}
                                onChange={(e) => setResetConfirmationInput(e.target.value)}
                                placeholder="Ketik RESET"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[#e0e5ec] text-rose-900 text-sm font-black font-mono tracking-wider border-none shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                            />
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-300">
                            <button
                                type="button"
                                onClick={() => setIsResetAllModalOpen(false)}
                                disabled={isResettingAll}
                                className="px-4 py-2.5 rounded-xl bg-[#e0e5ec] text-slate-600 hover:text-slate-900 text-xs font-bold shadow-[2px_2px_5px_#bec3c9,-2px_-2px_5px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteFactoryReset}
                                disabled={resetConfirmationInput.trim().toUpperCase() !== 'RESET' || isResettingAll}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider shadow-[4px_4px_10px_#bec3c9,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer transition-all active:scale-98 flex items-center gap-2"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>{isResettingAll ? 'Sedang Menghapus...' : 'Ya, Hapus Semua Data'}</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};
