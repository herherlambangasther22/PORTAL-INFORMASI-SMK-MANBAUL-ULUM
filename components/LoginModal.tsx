import React, { useState, useEffect, useRef } from 'react';
import { SuiteModule, AuthSession } from '../types';
import { authenticate } from '../utils/authManager';
import { 
    SchoolIcon, 
    LockIcon, 
    UserIcon, 
    EyeIcon, 
    EyeSlashIcon, 
    ShieldCheckIcon, 
    KeyIcon,
    ChevronLeftIcon,
    TeacherIcon,
    StudentIcon,
    InfoIcon,
    PaperPenIcon
} from './icons/Icons';
import { PORTAL_NAME } from '../constants';

interface LoginModalProps {
    targetModule: SuiteModule;
    portalLogo?: string;
    onSuccess: (session: AuthSession) => void;
    onCancel?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
    targetModule,
    portalLogo,
    onSuccess,
    onCancel
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const usernameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto focus input on mount
        setTimeout(() => {
            usernameInputRef.current?.focus();
        }, 150);
    }, [targetModule]);

    const moduleMeta = {
        info: {
            title: 'Portal Informasi Terpadu',
            subtitle: 'Autentikasi Hak Akses Manajemen Data Sekolah',
            badge: 'MODUL ADMINISTRASI',
            icon: InfoIcon,
            color: 'text-blue-600',
            bgBadge: 'bg-blue-100 text-blue-800 border-blue-200',
            btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
            accentRing: 'focus:ring-blue-500/30 focus:border-blue-500'
        },
        teacher: {
            title: 'Scan Station Guru',
            subtitle: 'Autentikasi Petugas Operator Presensi Guru',
            badge: 'TERMINAL GURU',
            icon: TeacherIcon,
            color: 'text-emerald-600',
            bgBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            accentRing: 'focus:ring-emerald-500/30 focus:border-emerald-500'
        },
        student: {
            title: 'Scan Station Siswa',
            subtitle: 'Autentikasi Operator Kiosk Presensi Mandiri Siswa',
            badge: 'KIOSK SISWA',
            icon: StudentIcon,
            color: 'text-amber-600',
            bgBadge: 'bg-amber-100 text-amber-800 border-amber-200',
            btnBg: 'bg-slate-900 hover:bg-slate-800 text-white',
            accentRing: 'focus:ring-amber-500/30 focus:border-amber-500'
        },
        'data-quiz': {
            title: 'Database & Data Quiz',
            subtitle: 'Autentikasi Hak Akses Evaluasi & Rekapitulasi Quiz',
            badge: 'DATABASE QUIZ',
            icon: PaperPenIcon,
            color: 'text-blue-600',
            bgBadge: 'bg-blue-100 text-blue-800 border-blue-200',
            btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
            accentRing: 'focus:ring-blue-500/30 focus:border-blue-500'
        }
    }[targetModule];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        setTimeout(() => {
            const res = authenticate(username, password, targetModule, rememberMe);
            setIsLoading(false);
            if (res.success && res.session) {
                onSuccess(res.session);
            } else {
                setErrorMsg(res.error || 'Autentikasi gagal. Periksa kembali username dan password Anda.');
            }
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-md bg-[#e0e5ec] rounded-3xl p-6 sm:p-8 shadow-[20px_20px_60px_#1e293b80,-20px_-20px_60px_#ffffff20] border border-white/40 my-auto animate-scale-up">
                
                {/* Top Return / Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        type="button"
                        onClick={onCancel || (() => { window.location.hash = ''; })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e0e5ec] text-slate-600 hover:text-slate-900 text-xs font-bold shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span>Menu Suite</span>
                    </button>

                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${moduleMeta.bgBadge}`}>
                        {moduleMeta.badge}
                    </span>
                </div>

                {/* Brand Logo & Icon */}
                <div className="text-center mb-6">
                    <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-[#e0e5ec] p-2.5 shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center relative">
                        {portalLogo ? (
                            <img src={portalLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <SchoolIcon className="w-10 h-10 text-blue-900" />
                        )}
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-white shadow-xs border border-slate-200">
                            <moduleMeta.icon className={`w-4 h-4 ${moduleMeta.color}`} />
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                        {moduleMeta.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        {moduleMeta.subtitle}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 shadow-2xs animate-wiggle">
                        <ShieldCheckIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 font-medium leading-relaxed">
                            {errorMsg}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 pl-1">
                            Username
                        </label>
                        <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <input
                                ref={usernameInputRef}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Masukkan username"
                                required
                                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[#e0e5ec] text-slate-800 placeholder-slate-400 text-sm font-medium border-none shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 ${moduleMeta.accentRing} transition-all`}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5 pl-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Kata Sandi (Password)
                            </label>
                        </div>
                        <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <LockIcon className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan kata sandi"
                                required
                                className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-[#e0e5ec] text-slate-800 placeholder-slate-400 text-sm font-medium border-none shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 ${moduleMeta.accentRing} transition-all`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                            >
                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember me option */}
                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-600">Ingat sesi di perangkat ini</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-[4px_4px_10px_#bec3c9,-4px_-4px_10px_#ffffff] active:shadow-[inset_2px_2px_4px_#bec3c9,inset_-2px_-2px_4px_#ffffff] cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 ${moduleMeta.btnBg} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <KeyIcon className="w-4 h-4" />
                                <span>Buka Akses Modul</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-300/60 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {PORTAL_NAME} • SISTEM KEAMANAN TERPADU
                    </p>
                </div>

            </div>
        </div>
    );
};
