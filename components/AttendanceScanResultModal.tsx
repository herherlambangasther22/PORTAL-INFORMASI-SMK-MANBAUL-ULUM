import React from 'react';
import { Student, Teacher } from '../types';
import { 
    CheckCircleIcon, 
    ClockIcon, 
    InfoIcon, 
    RfidCardIcon, 
    UserIcon 
} from './icons/Icons';

export interface AttendanceScanResultData {
    personType: 'student' | 'teacher';
    student?: Student;
    teacher?: Teacher;
    time: string;           // e.g. "07:08:45 WIB"
    fullDate?: string;      // e.g. "Kamis, 27 Agustus 2026"
    status: 'success' | 'already' | 'checkout';
    isLate: boolean;
    latenessMinutes?: number;
    methodUsed: string;     // 'RFID' | 'QR' | 'Wajah'
    rfidCode?: string;
    checkInTime?: string;
    checkOutTime?: string;
}

interface AttendanceScanResultModalProps {
    result: AttendanceScanResultData;
    onClose?: () => void;
}

export const AttendanceScanResultModal: React.FC<AttendanceScanResultModalProps> = ({ result }) => {
    const isStudent = result.personType === 'student';
    const photoUrl = isStudent ? result.student?.photoUrl : result.teacher?.photoUrl;
    const name = isStudent ? (result.student?.fullName || 'Siswa') : (result.teacher?.name || 'Guru');
    const classOrNip = isStudent 
        ? `Kelas ${result.student?.class || '-'}` 
        : (result.teacher?.subjectsTaught?.join(', ') || 'Guru Pengajar');
    const subDetail = isStudent 
        ? 'SMK Manbaul Ulum'
        : 'Tenaga Pendidik TJKT';

    const isSuccessOnTime = result.status === 'success' && !result.isLate;
    const isSuccessLate = result.status === 'success' && result.isLate;
    const isCheckout = result.status === 'checkout';
    const isAlreadyScanned = result.status === 'already';

    return (
        <div className="w-full max-w-sm mx-auto bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-4 shadow-2xl flex flex-col items-center animate-scale-up text-center relative overflow-hidden my-auto">
            
            {/* HEADER METODE SCAN */}
            <div className="w-full mb-3 pb-2 border-b border-slate-200 flex items-center justify-between text-left">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <RfidCardIcon className="w-4 h-4 text-slate-900" />
                    <span>PRESENSI {result.methodUsed}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {result.rfidCode ? `RFID: ${result.rfidCode}` : 'TERLOKASI'}
                </span>
            </div>

            {/* 1. NAMA SISWA & 2. KELAS / NIP CARD */}
            <div className="flex items-center gap-3 w-full text-left bg-slate-50 p-2.5 rounded-xl border border-slate-300 mb-3">
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {photoUrl ? (
                        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-8 h-8 text-slate-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                        {isStudent ? 'Siswa SMK Manbaul Ulum' : 'Guru / Tenaga Pendidik'}
                    </span>
                    {/* 1. NAMA SISWA / GURU */}
                    <h2 className="text-base font-black text-slate-900 uppercase truncate leading-tight">
                        {name}
                    </h2>
                    {/* 2. KELAS / NIP */}
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {classOrNip}
                    </p>
                    <p className="text-[10px] font-medium text-slate-600 truncate">
                        {subDetail}
                    </p>
                </div>
            </div>

            {/* 3. WAKTU ABSENSI */}
            <div className="w-full bg-white border border-slate-300 rounded-xl p-2.5 mb-3 flex items-center justify-between text-left">
                <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">3. WAKTU ABSENSI</span>
                    <span className="text-sm font-black text-slate-900 font-mono tracking-wide">{result.time}</span>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">TANGGAL</span>
                    <span className="text-xs font-bold text-slate-800">{result.fullDate || 'Hari Ini'}</span>
                </div>
            </div>

            {/* KETERANGAN STATUS ABSENSI */}
            {isSuccessOnTime && (
                <div className="w-full bg-blue-600 text-white rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left border border-blue-700">
                    <CheckCircleIcon className="w-6 h-6 text-white flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black tracking-wide uppercase">TEPAT WAKTU</p>
                        <p className="text-[10px] text-blue-100 font-medium leading-snug">
                            Absensi berhasil dicatat sesuai jadwal pelajaran
                        </p>
                    </div>
                </div>
            )}

            {isSuccessLate && (
                <div className="w-full bg-rose-600 text-white rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left border border-rose-700">
                    <ClockIcon className="w-6 h-6 text-white flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black tracking-wide uppercase">
                            TERLAMBAT {result.latenessMinutes ? `(+${result.latenessMinutes} MIN)` : ''}
                        </p>
                        <p className="text-[10px] text-rose-100 font-medium leading-snug">
                            Absensi dicatat melebihi batas jam masuk ({result.latenessMinutes ? `Terlambat ${result.latenessMinutes} menit` : 'Terlambat'})
                        </p>
                    </div>
                </div>
            )}

            {isCheckout && (
                <div className="w-full bg-blue-600 text-white rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left border border-blue-700">
                    <CheckCircleIcon className="w-6 h-6 text-white flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black tracking-wide uppercase">ABSENSI PULANG BERHASIL</p>
                        <p className="text-[10px] text-blue-100 font-medium leading-snug">
                            Jam Pulang: <span className="font-bold text-white font-mono">{result.time}</span>
                            {result.checkInTime ? ` • Jam Masuk: ${result.checkInTime}` : ''}
                        </p>
                        <p className="text-[9px] text-blue-200 mt-0.5">
                            Selamat beristirahat dan hati-hati di perjalanan pulang!
                        </p>
                    </div>
                </div>
            )}

            {isAlreadyScanned && (
                <div className="w-full bg-white text-slate-900 rounded-xl p-3 flex items-center gap-2.5 shadow-sm text-left border-2 border-rose-500">
                    <InfoIcon className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black tracking-wide uppercase text-rose-600">
                            ANDA SUDAH MELAKUKAN ABSENSI
                        </p>
                        <p className="text-[11px] text-slate-700 font-bold leading-snug mt-0.5">
                            Sudah tercatat absensi hari ini pada pukul <span className="text-rose-600 font-mono font-black underline">{result.time}</span>.
                        </p>
                        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                            Sistem mencegah pencatatan ganda untuk identitas yang sama.
                        </p>
                    </div>
                </div>
            )}

            {/* PROGRESS TIMER BAR */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-slate-900 h-full animate-[shrink_3.5s_linear_forwards] w-full"></div>
            </div>
        </div>
    );
};
