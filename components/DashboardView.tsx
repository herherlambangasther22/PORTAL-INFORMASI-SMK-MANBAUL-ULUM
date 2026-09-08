
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './Card';
import { AppData, School, Subject, Teacher, AttendanceLog, Notification, CalendarEvent, SchedulePeriod, SchoolInfo } from '../types';
import { CalendarIcon, StudentIcon, TeacherIcon, SubjectIcon, HomeIcon, ScheduleIcon, UserIcon, ClockIcon, MenuIcon, CoffeeIcon, BookOpenIcon, BroadcastIcon, CalendarDaysIcon, ChevronUpIcon, ChevronDownIcon, UploadIcon } from './icons/Icons';
import { Clock } from './Clock';
import { NotificationBell } from './NotificationBell';
import { getSubjectIcon, getSubjectColorClass } from './icons/SubjectIcons';
import { imageFileToBase64 } from '../utils';

// Helper: Mendapatkan total menit dari jam "HH.mm" atau "HH:mm"
const getMinutes = (timeStr: string): number => {
    const parts = timeStr.replace('.', ':').split(':').map(Number);
    return (parts[0] * 60) + (parts[1] || 0);
};

// Helper: Mendapatkan waktu saat ini dalam WIB (Menit & Nama Hari)
const getWIBStatus = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const hour = parseInt(getPart('hour'));
    const minute = parseInt(getPart('minute'));
    const dayName = getPart('weekday');
    
    const dayMap: Record<string, string> = {
        'Monday': 'Senin', 'Tuesday': 'Selasa', 'Wednesday': 'Rabu', 
        'Thursday': 'Kamis', 'Friday': "Jum'at", 'Saturday': 'Sabtu', 'Sunday': 'Minggu'
    };

    return {
        totalMinutes: (hour * 60) + minute,
        dayIndo: dayMap[dayName] || 'Senin',
        dateStr: `${getPart('year')}-${getPart('month')}-${getPart('day')}`
    };
};

interface DashboardViewProps {
  appData: AppData;
  attendanceLog: AttendanceLog;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
  calendarEvents: CalendarEvent[];
  activeSchool: School; 
  onUpdateSchoolInfo?: (school: School, newInfo: SchoolInfo) => Promise<void>;
}

const StatCard: React.FC<{ icon: React.FC<any>; title: string; value: string | number; color: string }> = ({ icon: Icon, title, value, color }) => (
    <Card className="p-4 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1">
        <div className={`p-3 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{value}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        </div>
    </Card>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ appData, attendanceLog, onMenuClick, notifications, onNotificationsOpen, calendarEvents, activeSchool, onUpdateSchoolInfo }) => {
    const [clockMode, setClockMode] = useState<'analog' | 'digital'>('analog');
    const [now, setNow] = useState(new Date());
    const [isTeacherListExpanded, setIsTeacherListExpanded] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    // LOGIKA JADWAL SPESIFIK UNIT DENGAN DETEKSI HARI LIBUR
    const { currentPeriod, status, displayDay, todayStr, holidayName } = useMemo(() => {
        const wib = getWIBStatus();
        const activeDay = wib.dayIndo; // HARI INI SESUNGGUHNYA (Minggu tetap Minggu)
        
        // 1. Cek Hari Libur Nasional (Calendar Events warna merah)
        const todayEvent = calendarEvents.find(e => e.date === wib.dateStr && e.color === 'red');
        
        if (activeDay === 'Minggu' || todayEvent) {
             return { 
                currentPeriod: null, 
                status: 'holiday', // Status Baru: Holiday
                displayDay: activeDay, 
                todayStr: wib.dateStr,
                holidayName: todayEvent ? todayEvent.title : 'Hari Minggu'
            };
        }

        const schoolSchedule = appData[activeSchool]?.schedule?.[activeDay] || [];
        
        if (schoolSchedule.length === 0) {
            return { 
                currentPeriod: null, 
                status: 'no-schedule', 
                displayDay: activeDay, 
                todayStr: wib.dateStr, 
                holidayName: null 
            };
        }

        let foundPeriod = null;
        let currentStatus: 'ongoing' | 'break' | 'before' | 'after' | 'no-schedule' | 'holiday' = 'after';

        for (let i = 0; i < schoolSchedule.length; i++) {
            const period = schoolSchedule[i];
            const [startStr, endStr] = period.time.split(' - ');
            const startMins = getMinutes(startStr);
            const endMins = getMinutes(endStr);
            if (wib.totalMinutes >= (startMins - 5) && wib.totalMinutes < endMins) {
                foundPeriod = period;
                break;
            }
        }

        if (!foundPeriod) {
            const firstPeriod = schoolSchedule[0];
            if (firstPeriod) {
                const [start] = firstPeriod.time.split(' - ');
                if (wib.totalMinutes < getMinutes(start)) currentStatus = 'before';
            }
        } else {
            const special = ['ISTIRAHAT', 'ISHOMA', 'TADARUS'];
            const isBreak = Object.values(foundPeriod.classes).some((e: any) => special.includes(e.subjectCode));
            currentStatus = isBreak ? 'break' : 'ongoing';
        }

        return { 
            currentPeriod: foundPeriod,
            status: currentStatus, 
            displayDay: activeDay, 
            todayStr: wib.dateStr,
            holidayName: null
        };
    }, [now, appData, activeSchool, calendarEvents]);

    // LOGIKA BARU: Statistik Agenda (Bulan Ini & Mendatang)
    const statsAgenda = useMemo(() => {
        // Ambil Bulan & Tahun dari todayStr (WIB)
        const [currentYear, currentMonth] = todayStr.split('-').map(Number);
        
        // 1. Hitung Agenda Bulan Ini
        const thisMonthCount = calendarEvents.filter(e => {
            const [ey, em] = e.date.split('-').map(Number);
            return ey === currentYear && em === currentMonth;
        }).length;

        // 2. List Agenda Mendatang (Hari ini + Masa Depan)
        const upcoming = calendarEvents
            .filter(e => e.date >= todayStr) // Filter tanggal >= hari ini (String comparison ISO YYYY-MM-DD works)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5); // Ambil 5 terdekat

        return { thisMonthCount, upcoming };
    }, [calendarEvents, todayStr]);

    const teacherMap = useMemo(() => {
        const map = new Map();
        appData[activeSchool].teachers.forEach(t => map.set(t.id, t.name));
        return map;
    }, [appData, activeSchool]);

    const subjectMap = useMemo(() => {
        const map = new Map();
        appData[activeSchool].subjects.forEach(s => map.set(s.code, s.name));
        return map;
    }, [appData, activeSchool]);

    const todaysTeachers = useMemo(() => {
        if (status === 'holiday') return []; // Kosongkan guru piket jika libur

        const onDuty = new Map<number, Teacher & { schoolUnit: string }>();
        const sched = appData[activeSchool]?.schedule?.[displayDay] || [];
        
        sched.forEach(p => Object.values(p.classes).forEach((e: any) => {
            if (e.teacherCode && !onDuty.has(e.teacherCode)) {
                const teacher = appData[activeSchool].teachers.find(t => t.id === e.teacherCode);
                if (teacher) onDuty.set(teacher.id, { ...teacher, schoolUnit: activeSchool.toUpperCase() });
            }
        }));
        
        return Array.from(onDuty.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [displayDay, appData, activeSchool, status]);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdateSchoolInfo) return;
        try {
            const base64 = await imageFileToBase64(file, 5 * 1024 * 1024);
            const currentInfo = appData[activeSchool].schoolInfo;
            await onUpdateSchoolInfo(activeSchool, { ...currentInfo, logoUrl: base64 });
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Gagal mengunggah logo.');
        }
    };

    const renderScheduleContent = () => {
        const statusConfig: any = {
            'ongoing': { text: 'Sedang Berlangsung', icon: <BroadcastIcon className="w-5 h-5 text-green-600 animate-subtle-blink" /> },
            'before': { text: 'Persiapan Masuk', icon: <ClockIcon className="w-10 h-10 text-blue-600" /> },
            'break': { text: 'Waktu Istirahat', icon: <CoffeeIcon className="w-5 h-5 text-amber-700" /> },
            'after': { text: 'Waktu Pulang', icon: <ScheduleIcon className="w-10 h-10 text-slate-400" /> },
            'no-schedule': { text: 'Tidak Ada Jadwal', icon: <ScheduleIcon className="w-10 h-10 text-slate-400" /> },
            'holiday': { text: holidayName || 'Hari Libur', icon: <CalendarIcon className="w-10 h-10 text-red-500" /> },
        };

        // Kunci Animasi Unik: Menggabungkan status, periode (jika ada), dan hari.
        // Ini memaksa React untuk merender ulang komponen (unmount/mount) saat kunci berubah, memicu animasi CSS.
        const transitionKey = currentPeriod 
            ? `period-${currentPeriod.period}-${currentPeriod.time}-${displayDay}` 
            : `status-${status}-${displayDay}`;

        if (status === 'holiday' || !currentPeriod) {
             const currentStatus = status === 'holiday' ? 'holiday' : (status === 'after' || status === 'no-schedule' || status === 'before') ? status : 'no-schedule';
             return (
                <div key={transitionKey} className="flex flex-col items-center justify-center text-center text-slate-500 py-6 animate-slide-up-fade">
                    <div className="mb-2 opacity-80">{statusConfig[currentStatus].icon}</div>
                    <p className={`font-black text-xs uppercase tracking-widest ${status === 'holiday' ? 'text-red-500' : ''}`}>{statusConfig[currentStatus].text}</p>
                    {status === 'holiday' && <p className="text-[10px] mt-1 font-medium">Tidak ada kegiatan belajar mengajar.</p>}
                </div>
            );
        }

        const classNames = Object.keys(currentPeriod.classes);
        const firstClassEntry = currentPeriod.classes[classNames[0]];
        const isBreak = ['ISTIRAHAT', 'ISHOMA', 'TADARUS'].includes(firstClassEntry?.subjectCode);
        const breakIcons: { [key: string]: React.FC<any> } = { 'ISTIRAHAT': CoffeeIcon, 'ISHOMA': CoffeeIcon, 'TADARUS': BookOpenIcon };
        const BreakIcon = isBreak ? breakIcons[firstClassEntry.subjectCode] : null;

        return (
             <div key={transitionKey} className="w-full flex flex-col items-center justify-start text-center pt-0 animate-slide-up-fade">
                <div className="flex items-center gap-2 mb-2 text-slate-700">
                    {statusConfig[status].icon}
                    <h3 className="text-sm font-black uppercase tracking-tighter">{statusConfig[status].text}</h3>
                </div>
                <p className="font-black text-2xl sm:text-3xl text-slate-800 mb-3 tracking-tighter leading-none">{currentPeriod.time}</p>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
                    {isBreak ? (
                         <div className="col-span-full">
                            <Card type="pressed" className="py-6 px-6 bg-blue-50/50">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-3">
                                        {BreakIcon && <BreakIcon className="w-8 h-8 text-blue-900" />}
                                        <span className="font-black text-blue-900 text-xl tracking-widest uppercase">{firstClassEntry.subjectCode}</span>
                                    </div>
                                </div>
                            </Card>
                         </div>
                    ) : (
                        classNames.sort((a,b) => {
                            const order: any = { 'X': 1, 'XI': 2, 'XII': 3, 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6 };
                            return (order[a] || 0) - (order[b] || 0);
                        }).map(className => {
                            const entry = currentPeriod.classes[className];
                            const SubjectIconComponent = getSubjectIcon(entry.subjectCode, activeSchool);
                            const subjectColor = getSubjectColorClass(entry.subjectCode, activeSchool);
                            const subjectName = subjectMap.get(entry.subjectCode) || entry.subjectCode;
                            const teacherName = entry.teacherCode ? teacherMap.get(entry.teacherCode) : 'Guru Piket';
                            return (
                                <Card key={className} type="pressed" className="p-3 flex flex-col items-center gap-1.5 border-t-[3px] border-blue-900 shadow-sm bg-white/40">
                                    <div className="px-2 py-0.5 text-[9px] font-black text-white bg-slate-800 rounded-full">KLS {className}</div>
                                    <div className={`p-2 rounded-lg bg-white/60 shadow-sm`}>
                                        <SubjectIconComponent className={`w-6 h-6 ${subjectColor}`} />
                                    </div>
                                    <div className="w-full overflow-hidden">
                                        <p className="font-black text-[11px] text-slate-800 truncate leading-tight uppercase">{subjectName}</p>
                                        <p className="text-[8px] font-bold text-slate-400 truncate mt-0.5 uppercase">{teacherName}</p>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                 </div>
             </div>
        );
    };
    
    // STATS SPESIFIK UNIT
    const totalStudents = appData[activeSchool].students.length;
    const totalTeachers = appData[activeSchool].teachers.length;
    const totalSubjects = appData[activeSchool].subjects.length;
    const schoolLogo = appData[activeSchool].schoolInfo.logoUrl;

    return (
        <div className="flex flex-col gap-6 h-full animate-fade-in">
            {/* Header Panel */}
            <Card className="p-4 sm:p-6 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden"><MenuIcon className="w-6 h-6 text-slate-700" /></button>
                        <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
                            <HomeIcon className="w-8 h-8 text-blue-500"/>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tighter">Dashboard</h1>
                            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest mt-1">{appData[activeSchool].schoolInfo.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end w-full sm:w-auto gap-4">
                        {/* LOGO SEKOLAH DENGAN FITUR UPLOAD */}
                        <div className="relative group w-10 h-10 sm:w-12 sm:h-12 p-1.5 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] flex items-center justify-center overflow-hidden border border-slate-200/50">
                            {schoolLogo ? (
                                <img src={schoolLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                            ) : (
                                <BookOpenIcon className="w-6 h-6 text-slate-300" />
                            )}
                            {onUpdateSchoolInfo && (
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-300">
                                    <UploadIcon className="w-5 h-5 text-white" />
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/png, image/jpeg" 
                                        onChange={handleLogoChange}
                                    />
                                </label>
                            )}
                        </div>
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </Card>
            
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard icon={UserIcon} title="Siswa" value={totalStudents} color="text-amber-500" />
                    <StatCard icon={TeacherIcon} title="Tenaga Pendidik" value={totalTeachers} color="text-blue-900" />
                    <StatCard icon={SubjectIcon} title="Mata Pelajaran" value={totalSubjects} color="text-indigo-500" />
                    {/* UPDATED: Menggunakan Agenda Bulan Ini */}
                    <StatCard icon={CalendarIcon} title="Agenda Bulan Ini" value={statsAgenda.thisMonthCount} color="text-pink-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 flex-1 min-h-0">
                    <div className="lg:col-span-1 flex flex-col gap-6 sm:gap-8">
                        <Card className="p-4 sm:p-5 flex flex-col">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5"><ClockIcon className="w-5 h-5 text-violet-500" /><h2 className="text-base font-black text-slate-800 uppercase tracking-tighter">Waktu</h2></div>
                                <div className="flex flex-row gap-1 bg-[#e0e5ec] p-1 rounded-xl shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)]">
                                    <button onClick={() => setClockMode('analog')} className={`py-1 px-3 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all duration-300 ${clockMode === 'analog' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-600'}`}>Analog</button>
                                    <button onClick={() => setClockMode('digital')} className={`py-1 px-3 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all duration-300 ${clockMode === 'digital' ? 'bg-[#1e3a8a] text-white shadow-md' : 'text-slate-600'}`}>Digital</button>
                                </div>
                            </div>
                            <Clock mode={clockMode} />
                        </Card>
                        <Card className="p-4 sm:p-5 flex flex-col">
                            <div className="flex items-center gap-2.5 mb-4"><TeacherIcon className="w-5 h-5 text-blue-900" /><h2 className="text-base font-black text-slate-800 uppercase tracking-tighter">Kehadiran Guru</h2></div>
                            <div className="space-y-3">
                                {todaysTeachers.length > 0 ? todaysTeachers.slice(0, 4).map((teacher) => {
                                    const todaysRecord = attendanceLog[todayStr] || {};
                                    const record = todaysRecord[teacher.id];
                                    const status = typeof record === 'object' ? record.status : (record || 'Alpha');
                                    const timestamp = typeof record === 'object' ? record.timestamp : '';

                                    const style: any = { Hadir: 'bg-blue-100 text-blue-900', Sakit: 'bg-amber-100 text-amber-800', Izin: 'bg-blue-100 text-blue-800', Alpha: 'bg-red-100 text-red-800' };
                                    return (
                                        <Card type="pressed" key={teacher.id} className="p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-full bg-white shadow-inner flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                                                        {teacher.photoUrl ? <img src={teacher.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-slate-400" />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="font-black text-xs text-slate-800 truncate leading-none uppercase">{teacher.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest">UNIT</p>
                                                            {timestamp && <span className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5"><ClockIcon className="w-2 h-2"/> {timestamp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${style[status] || style.Alpha}`}>{status === 'Alpha' ? 'BELUM' : status}</span>
                                            </div>
                                        </Card>
                                    );
                                }) : <p className="text-center text-slate-400 italic py-6 text-[10px] font-bold uppercase tracking-widest">Tidak ada jadwal aktif {displayDay}</p>}
                            </div>
                            {todaysTeachers.length > 4 && (
                                <div className="mt-3 text-center border-t border-slate-300/30 pt-2">
                                    <button onClick={() => setIsTeacherListExpanded(!isTeacherListExpanded)} className="py-1.5 px-4 rounded-full text-[8px] font-black uppercase tracking-widest transition-all duration-300 bg-slate-200/50 text-slate-500 hover:text-blue-900 flex items-center gap-1.5 mx-auto">
                                        {isTeacherListExpanded ? <><ChevronUpIcon className="w-3 h-3" /> Ringkas</> : <><ChevronDownIcon className="w-3 h-3" /> Semua ({todaysTeachers.length})</>}
                                    </button>
                                </div>
                            )}
                        </Card>
                    </div>
                    
                    <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8 min-h-0">
                        <Card className="p-4 sm:p-5 flex flex-col border-none shadow-[15px_15px_30px_#d1d9e6,-15px_-15px_30px_#ffffff] rounded-[2rem]">
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 flex-shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <ScheduleIcon className="w-6 h-6 text-cyan-500"/>
                                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Jadwal Harian</h2>
                                </div>
                                <div className={`flex items-center gap-3 p-1.5 pl-4 rounded-full border ${status === 'holiday' ? 'bg-red-100/40 border-red-200/40' : 'bg-blue-100/40 border-blue-200/40'}`}>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(todayStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    <div className={`px-3 py-0.5 text-[9px] font-black text-white rounded-full shadow-sm uppercase tracking-widest ${status === 'holiday' ? 'bg-red-600' : 'bg-[#1e3a8a]'}`}>{displayDay}</div>
                                </div>
                            </div>
                            <div className="w-full flex-1">{renderScheduleContent()}</div>
                        </Card>

                        <Card className="p-4 sm:p-5 flex flex-col flex-1 min-h-[150px]">
                            <div className="flex items-center gap-2.5 mb-4"><CalendarDaysIcon className="w-5 h-5 text-pink-500" /><h2 className="text-base font-black text-slate-800 uppercase tracking-tighter">Agenda Mendatang</h2></div>
                            <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
                                {/* UPDATED: Menampilkan statsAgenda.upcoming (bukan hanya hari ini) */}
                                {statsAgenda.upcoming.length > 0 ? statsAgenda.upcoming.map((event, index) => {
                                    const isToday = event.date === todayStr;
                                    const dateObj = new Date(event.date);
                                    const dateLabel = isToday 
                                        ? "HARI INI" 
                                        : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                                    return (
                                        <Card key={index} type="pressed" className="p-3 text-left border-l-[3px] border-l-pink-500 bg-white/40">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className="font-black text-[10px] text-slate-800 uppercase tracking-tight leading-tight line-clamp-2">{event.title}</p>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isToday ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-500'} whitespace-nowrap`}>
                                                    {dateLabel}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-bold leading-normal uppercase opacity-70 truncate">{event.description}</p>
                                        </Card>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-6 opacity-20">
                                        <CalendarIcon className="w-10 h-10 text-slate-400 mb-1"/>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Agenda Kosong</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d9e6; border-radius: 10px; }
            `}</style>
        </div>
    );
};
