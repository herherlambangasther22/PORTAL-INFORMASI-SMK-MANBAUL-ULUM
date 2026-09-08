import React, { useState, useMemo } from 'react';
import { Student, Teacher, AttendanceLog, Schedule } from '../types';
import { 
  getWeekDays, 
  getMonthDays, 
  getSemesterDays, 
  calculatePersonRecap, 
  exportAttendanceToColoredExcel, 
  INDONESIAN_MONTH_NAMES,
  INDONESIAN_DAY_NAMES,
  PersonAttendanceRecap
} from '../utils/attendanceReportHelper';
import { 
  getClassTjktScheduleOnDay,
  getTeacherTjktScheduleOnDay,
  filterDatesByTjktSchedule,
  getClassTjktWeeklySummary
} from '../utils/tjktScheduleHelper';
import { 
  DownloadIcon, 
  ClockIcon, 
  UserIcon, 
  SearchIcon, 
  TeacherIcon,
  StudentIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from './icons/Icons';

interface AttendanceRecapMatrixProps {
  students: Student[];
  teachers: Teacher[];
  attendanceLog: AttendanceLog;
  onUpdateLog: (log: AttendanceLog) => void;
  activeCategory: 'student' | 'teacher';
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  schedule: Schedule;
}

type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'semester';

export const AttendanceRecapMatrix: React.FC<AttendanceRecapMatrixProps> = ({
  students,
  teachers,
  attendanceLog,
  activeCategory,
  selectedClass,
  onSelectClass,
  schedule
}) => {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('weekly');
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [semesterChoice, setSemesterChoice] = useState<'ganjil' | 'genap'>('ganjil');
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isTeacher = activeCategory === 'teacher';

  // 1. Raw date generation for period
  const rawDates: Date[] = useMemo(() => {
    if (periodMode === 'daily') {
      return [referenceDate];
    } else if (periodMode === 'weekly') {
      return getWeekDays(referenceDate);
    } else if (periodMode === 'monthly') {
      return getMonthDays(selectedYear, selectedMonth, false);
    } else {
      return getSemesterDays(academicYear, semesterChoice);
    }
  }, [periodMode, referenceDate, selectedMonth, selectedYear, academicYear, semesterChoice]);

  // 2. Filter dates to STRICTLY match TJKT schedule for the selected class/category
  const activeDates: Date[] = useMemo(() => {
    // When a specific class is selected (e.g. X, XI, XII), only show dates where that class has TJKT!
    // For 'Semua' or Teacher, show dates where any TJKT lesson exists in the schedule
    const filtered = filterDatesByTjktSchedule(schedule, selectedClass, rawDates, isTeacher, 1);
    // If daily mode and not a TJKT day, still return the day so the user can see it has no TJKT
    if (periodMode === 'daily') {
      return [referenceDate];
    }
    return filtered;
  }, [schedule, selectedClass, rawDates, isTeacher, periodMode, referenceDate]);

  // 3. Weekly schedule info helper for banner
  const tjktSummary = useMemo(() => {
    if (isTeacher) {
      return {
        title: 'Jadwal Mengajar Kejuruan TJKT (Kajur: Herlambang Lasena, S.T.)',
        details: 'Senin (4 JP), Selasa (4 JP), Rabu (4 JP), Sabtu (4 JP) • Total 16 JP/Minggu'
      };
    }
    if (selectedClass === 'Semua') {
      return {
        title: 'Jadwal Mata Pelajaran Kejuruan TJKT (Seluruh Tingkat)',
        details: 'Kelas X (Senin & Sabtu: 4 JP) • Kelas XI (Senin, Selasa, Rabu: 6 JP) • Kelas XII (Selasa, Rabu, Sabtu: 6 JP)'
      };
    }
    const info = getClassTjktWeeklySummary(schedule, selectedClass);
    return {
      title: `Jadwal Mata Pelajaran TJKT - Kelas ${selectedClass}`,
      details: `${info.daysDescription} • Total ${info.totalWeeklyJp} JP/Minggu`
    };
  }, [isTeacher, selectedClass, schedule]);

  // 4. Period label for table title and Excel export
  const periodLabel = useMemo(() => {
    if (periodMode === 'daily') {
      return `Harian (${referenceDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})`;
    } else if (periodMode === 'weekly') {
      const startStr = rawDates[0]?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '';
      const endStr = rawDates[rawDates.length - 1]?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) || '';
      return `Mingguan TJKT (${startStr} s/d ${endStr})`;
    } else if (periodMode === 'monthly') {
      return `Bulan ${INDONESIAN_MONTH_NAMES[selectedMonth]} ${selectedYear} (Jadwal TJKT)`;
    } else {
      return `Semester ${semesterChoice === 'ganjil' ? 'Ganjil' : 'Genap'} ${academicYear}/${academicYear + 1} (Jadwal TJKT)`;
    }
  }, [periodMode, referenceDate, rawDates, selectedMonth, selectedYear, academicYear, semesterChoice]);

  // 5. Filter person list by class and query
  const currentPersonList = useMemo(() => {
    if (!isTeacher) {
      return students.filter(s => {
        const matchClass = selectedClass === 'Semua' || s.class === selectedClass;
        const matchQuery = !searchQuery || 
          s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.nis.includes(searchQuery) ||
          s.nisn.includes(searchQuery);
        return matchClass && matchQuery;
      });
    } else {
      return teachers.filter(t => {
        const matchQuery = !searchQuery || 
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.nip && t.nip.includes(searchQuery));
        return matchQuery;
      });
    }
  }, [isTeacher, students, teachers, selectedClass, searchQuery]);

  // 6. Compute recaps for each person strictly based on active TJKT dates
  const personRecaps: PersonAttendanceRecap[] = useMemo(() => {
    return currentPersonList.map(person => {
      // Pass activeDates (uniform list) and schedule so every person has identical date column alignment
      return calculatePersonRecap(person, activeDates, attendanceLog, schedule);
    });
  }, [currentPersonList, activeDates, attendanceLog, schedule]);

  // 7. Aggregate summary calculation
  const aggregateSummary = useMemo(() => {
    let totalMasuk = 0;
    let totalTepatWaktu = 0;
    let totalTerlambat = 0;
    let totalTidakMasuk = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpha = 0;
    let totalExpectedSlots = 0;

    personRecaps.forEach(r => {
      totalMasuk += r.summary.masuk;
      totalTepatWaktu += r.summary.tepatWaktu;
      totalTerlambat += r.summary.terlambat;
      totalTidakMasuk += r.summary.tidakMasuk;
      totalSakit += r.summary.sakit;
      totalIzin += r.summary.izin;
      totalAlpha += r.summary.alpha;
      totalExpectedSlots += r.summary.totalHariEfektif;
    });

    const avgPercentage = totalExpectedSlots > 0 ? (totalMasuk / totalExpectedSlots) * 100 : 0;

    return {
      totalPersons: personRecaps.length,
      totalMasuk,
      totalTepatWaktu,
      totalTerlambat,
      totalTidakMasuk,
      totalSakit,
      totalIzin,
      totalAlpha,
      avgPercentage,
      totalMeetings: activeDates.length
    };
  }, [personRecaps, activeDates]);

  // 7.5 Column Groups for Matrix Table View
  const columnGroups = useMemo(() => {
    if (periodMode === 'daily' || periodMode === 'weekly') {
      return activeDates.map(d => {
        const dayNum = d.getDate().toString().padStart(2, '0');
        const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
        return {
          id: `${d.getFullYear()}-${monthNum}-${dayNum}`,
          title: INDONESIAN_DAY_NAMES[d.getDay()],
          subtitle: `${dayNum}/${monthNum}/${d.getFullYear()}`,
          dates: [d]
        };
      });
    } else if (periodMode === 'monthly') {
      // Group activeDates by Week in Month (Minggu 1: 1-7, Minggu 2: 8-14, Minggu 3: 15-21, Minggu 4: 22-28, Minggu 5: 29-end)
      const weeksMap: { [key: string]: Date[] } = {};
      activeDates.forEach(d => {
        const dateNum = d.getDate();
        let weekNum = Math.ceil(dateNum / 7);
        if (weekNum > 5) weekNum = 5;
        const key = `Minggu ${weekNum}`;
        if (!weeksMap[key]) weeksMap[key] = [];
        weeksMap[key].push(d);
      });

      return Object.keys(weeksMap).map(wKey => {
        const dates = weeksMap[wKey];
        const firstD = dates[0];
        const lastD = dates[dates.length - 1];
        const rangeStr = dates.length > 1 
          ? `${firstD.getDate()}-${lastD.getDate()} ${INDONESIAN_MONTH_NAMES[selectedMonth].slice(0, 3)}`
          : `${firstD.getDate()} ${INDONESIAN_MONTH_NAMES[selectedMonth].slice(0, 3)}`;
        return {
          id: wKey,
          title: wKey,
          subtitle: `${rangeStr} (${dates.length} Hari)`,
          dates
        };
      });
    } else {
      // Group activeDates by Month in Semester
      const monthsMap: { [key: string]: { monthName: string, dates: Date[] } } = {};
      activeDates.forEach(d => {
        const mIdx = d.getMonth();
        const mName = INDONESIAN_MONTH_NAMES[mIdx];
        if (!monthsMap[mName]) {
          monthsMap[mName] = { monthName: mName, dates: [] };
        }
        monthsMap[mName].dates.push(d);
      });

      return Object.keys(monthsMap).map(mName => {
        const item = monthsMap[mName];
        return {
          id: mName,
          title: mName,
          subtitle: `${item.dates.length} Hari TJKT`,
          dates: item.dates
        };
      });
    }
  }, [periodMode, activeDates, selectedMonth]);

  // 8. Excel Export Handler
  const handleExportExcel = () => {
    exportAttendanceToColoredExcel({
      title: 'LAPORAN REKAPITULASI ABSENSI MATA PELAJARAN TJKT',
      subtitle: `SMK Manbaul Ulum - Mata Pelajaran Kejuruan TJKT (${tjktSummary.details})`,
      periodLabel,
      classLabel: isTeacher ? 'Guru Pengajar TJKT' : `Kelas ${selectedClass}`,
      dates: activeDates,
      recaps: personRecaps,
      filename: `Rekap_Absensi_TJKT_${isTeacher ? 'Guru' : `Kelas_${selectedClass}`}_${periodMode}`
    });
  };

  // Helper date shift for daily / weekly
  const shiftPeriod = (direction: number) => {
    const next = new Date(referenceDate);
    if (periodMode === 'daily') {
      next.setDate(next.getDate() + direction);
    } else if (periodMode === 'weekly') {
      next.setDate(next.getDate() + (direction * 7));
    }
    setReferenceDate(next);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* 1. JADWAL TJKT BANNER */}
      <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-blue-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl">
            <ClockIcon className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-blue-100">
                {tjktSummary.title}
              </h3>
            </div>
            <p className="text-[11px] text-blue-200/90 font-medium mt-0.5">
              {tjktSummary.details}
            </p>
          </div>
        </div>

        {/* Quick Class Selector in Banner */}
        {!isTeacher && (
          <div className="flex items-center gap-1 bg-blue-950/80 p-1 rounded-xl border border-blue-800">
            {['Semua', 'X', 'XI', 'XII'].map(cls => (
              <button
                key={cls}
                type="button"
                onClick={() => onSelectClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-300 hover:bg-blue-800/50'
                }`}
              >
                {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. PERIOD CONTROLS & EXCEL BUTTON */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Period Mode Tabs (Harian, Mingguan, Bulanan, Semester dengan Icon Kalender Tahunan) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPeriodMode('daily')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              periodMode === 'daily'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Harian TJKT</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('weekly')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              periodMode === 'weekly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Mingguan</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('monthly')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              periodMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Bulanan</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodMode('semester')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              periodMode === 'semester'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {/* Annual Calendar Icon */}
            <span className="text-sm">📅</span>
            <span>1 Semester</span>
          </button>
        </div>

        {/* Center: Dynamic Period Selectors */}
        <div className="flex items-center gap-2">
          {(periodMode === 'daily' || periodMode === 'weekly') && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                title="Periode Sebelumnya"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>

              <span className="px-2 text-xs font-bold text-slate-800">
                {periodMode === 'daily'
                  ? referenceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : `Minggu ke ${referenceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
              </span>

              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                title="Periode Berikutnya"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setReferenceDate(new Date())}
                className="ml-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-bold text-blue-700 hover:bg-blue-50"
              >
                Hari Ini
              </button>
            </div>
          )}

          {periodMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {INDONESIAN_MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodMode === 'semester' && (
            <div className="flex items-center gap-2">
              <select
                value={semesterChoice}
                onChange={e => setSemesterChoice(e.target.value as 'ganjil' | 'genap')}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ganjil">Semester Ganjil (Jul - Des)</option>
                <option value="genap">Semester Genap (Jan - Jun)</option>
              </select>
              <select
                value={academicYear}
                onChange={e => setAcademicYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>TA {y}/{y + 1}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Excel Export Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Unduh Excel Rekap TJKT</span>
          </button>
        </div>
      </div>

      {/* 3. RECAP METRICS DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Terdaftar</p>
          <p className="text-xl font-black text-slate-800 mt-0.5">{aggregateSummary.totalPersons}</p>
          <p className="text-[9px] text-blue-600 font-bold mt-0.5">{activeDates.length} Hari TJKT</p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Total Masuk</p>
          <p className="text-xl font-black text-emerald-700 mt-0.5">{aggregateSummary.totalMasuk}</p>
          <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Sesi TJKT</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Tepat Waktu</p>
          <p className="text-xl font-black text-slate-800 mt-0.5">{aggregateSummary.totalTepatWaktu}</p>
          <p className="text-[9px] text-emerald-600 font-bold mt-0.5">≤ 07:15 WIB</p>
        </div>

        {/* TERLAMBAT: Kuning Muda */}
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-900">Terlambat</p>
          <p className="text-xl font-black text-amber-950 mt-0.5">{aggregateSummary.totalTerlambat}</p>
          <p className="text-[9px] text-amber-700 font-medium mt-0.5">&gt; 07:15 WIB</p>
        </div>

        {/* SAKIT: Kuning Saja Sesuai Permintaan */}
        <div className="p-3 bg-yellow-100 border-2 border-yellow-400 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-yellow-950">Sakit</p>
          <p className="text-xl font-black text-yellow-950 mt-0.5">{aggregateSummary.totalSakit}</p>
          <p className="text-[9px] text-yellow-800 font-bold mt-0.5">Surat Dokter</p>
        </div>

        {/* IZIN: Kuning ke-oranyean Sesuai Permintaan */}
        <div className="p-3 bg-amber-100 border-2 border-amber-500 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-950">Izin</p>
          <p className="text-xl font-black text-amber-950 mt-0.5">{aggregateSummary.totalIzin}</p>
          <p className="text-[9px] text-amber-800 font-bold mt-0.5">Izin Wali</p>
        </div>

        {/* ALPHA: Merah Saja Sesuai Permintaan */}
        <div className="p-3 bg-red-100 border-2 border-red-600 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-900">Alpha</p>
          <p className="text-xl font-black text-red-950 mt-0.5">{aggregateSummary.totalAlpha}</p>
          <p className="text-[9px] text-red-800 font-bold mt-0.5">Tanpa Keterangan</p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-800">Kehadiran</p>
          <p className="text-xl font-black text-blue-700 mt-0.5">{aggregateSummary.avgPercentage.toFixed(1)}%</p>
          <p className="text-[9px] text-blue-600 font-semibold mt-0.5">Sesuai Jam TJKT</p>
        </div>
      </div>

      {/* 4. SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
          {isTeacher ? <TeacherIcon className="w-4 h-4 text-blue-600" /> : <StudentIcon className="w-4 h-4 text-blue-600" />}
          <span>
            Menampilkan {personRecaps.length} {isTeacher ? 'Guru Pengajar' : 'Siswa TJKT'}
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa atau guru..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 5. MAIN RECAP MATRIX TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Table Header Info Bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Matriks Presensi: {periodLabel}</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold border border-blue-200">
                {activeDates.length} Pertemuan TJKT
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Setiap kolom hanya menampilkan hari dan jam mata pelajaran kejuruan TJKT yang aktif.
            </p>
          </div>

          {/* Color Legend Badge row: Sakit (Kuning), Izin (Kuning ke-oranyean), Alpha (Merah) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              🟢 Hadir
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              Terlambat (&gt;07:15)
            </span>
            <span className="px-2 py-0.5 rounded bg-yellow-300 text-yellow-950 border border-yellow-400 font-black">
              🟡 Sakit (Kuning)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 border border-amber-500 font-black">
              🟠 Izin (Kuning ke-oranyean)
            </span>
            <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black">
              🔴 Alpha (Merah)
            </span>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-x-auto max-h-[620px] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-20 bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
              {/* Row 1: Group Headers */}
              <tr>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 text-center w-10">No</th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 min-w-[180px]">Nama Lengkap</th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 w-24 text-center">Kelas</th>

                {/* Days/Weeks/Months span */}
                <th colSpan={columnGroups.length} className="py-2 px-3 border-r border-slate-800 text-center bg-blue-900">
                  {periodMode === 'daily' || periodMode === 'weekly' 
                    ? 'Daftar Pertemuan Sesuai Jadwal Mata Pelajaran TJKT'
                    : periodMode === 'monthly' 
                      ? 'Rekapitulasi Kehadiran Mingguan (Bulan Ini)' 
                      : 'Rekapitulasi Kehadiran Bulanan (1 Semester)'}
                </th>

                {/* Total Recap span */}
                <th colSpan={9} className="py-2 px-3 text-center bg-slate-950">
                  Total Rekapitulasi Kehadiran TJKT
                </th>
              </tr>

              {/* Row 2: Sub-headers for each day/week/month and recap columns */}
              <tr className="bg-slate-800 text-[9px]">
                {columnGroups.map((grp) => {
                  return (
                    <th key={grp.id} className="py-1.5 px-2 border-r border-slate-700 text-center min-w-[95px]">
                      <div className="font-black text-blue-100">{grp.title}</div>
                      <div className="text-[8px] text-slate-300 font-mono font-normal">{grp.subtitle}</div>
                    </th>
                  );
                })}

                {/* Recap Columns */}
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-blue-950 text-blue-200 min-w-[50px]" title="Total Pertemuan Terjadwal">
                  Total Hari
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-emerald-900 text-emerald-200 min-w-[50px]" title="Total Masuk (Tepat Waktu + Terlambat)">
                  Total Masuk
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-emerald-700 text-emerald-100 min-w-[50px]" title="Tepat Waktu">
                  Tepat Waktu
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-amber-500 text-slate-950 font-black min-w-[55px]" title="Terlambat">
                  Terlambat
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-slate-700 text-slate-200 min-w-[50px]" title="Tidak Masuk (Sakit + Izin + Alpha)">
                  Tidak Masuk
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-yellow-400 text-yellow-950 font-black min-w-[45px]" title="Sakit (Kuning)">
                  Sakit
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-amber-500 text-amber-950 font-black min-w-[45px]" title="Izin (Kuning ke-oranyean)">
                  Izin
                </th>
                <th className="py-1.5 px-2 border-r border-slate-700 text-center bg-red-600 text-white font-black min-w-[50px]" title="Alpha / Tanpa Keterangan (Merah)">
                  Alpha
                </th>
                <th className="py-1.5 px-2 text-center bg-blue-900 text-blue-200 min-w-[55px]" title="Persentase Kehadiran TJKT">
                  % Hadir
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {personRecaps.length === 0 ? (
                <tr>
                  <td colSpan={10 + columnGroups.length} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa atau guru untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                personRecaps.map((recap, idx) => {
                  return (
                    <tr key={recap.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 text-[10px]">
                            {recap.person.photoUrl ? (
                              <img src={recap.person.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              recap.name.charAt(0)
                            )}
                          </div>
                          <span className="truncate">{recap.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600 font-semibold border-r border-slate-200">
                        {recap.classNameOrRole}
                      </td>

                      {/* MATRIX COLUMNS */}
                      {columnGroups.map((grp, gIdx) => {
                        if (periodMode === 'daily' || periodMode === 'weekly') {
                          const dateObj = grp.dates[0];
                          const dayRecord = recap.days.find(d => 
                            d.date.getFullYear() === dateObj.getFullYear() &&
                            d.date.getMonth() === dateObj.getMonth() &&
                            d.date.getDate() === dateObj.getDate()
                          );

                          const st = dayRecord?.status || 'Belum Absen';
                          const isNoSchedule = st === 'Tidak Ada Jadwal';
                          const isLate = st === 'Terlambat';
                          const isAlpha = st === 'Alpha';
                          const isHadir = st === 'Hadir';
                          const isSakit = st === 'Sakit';
                          const isIzin = st === 'Izin';

                          let cellBg = "bg-white text-slate-500";
                          let badgeBg = "bg-slate-100 text-slate-600";

                          if (isNoSchedule) {
                            cellBg = "bg-slate-50/50 text-slate-400";
                            badgeBg = "bg-slate-100 text-slate-400 border border-slate-200 font-normal";
                          } else if (isLate) {
                            cellBg = "bg-amber-50 text-amber-950 font-bold";
                            badgeBg = "bg-amber-200 text-amber-950 border border-amber-400";
                          } else if (isAlpha) {
                            cellBg = "bg-red-50 text-red-950 font-black";
                            badgeBg = "bg-red-600 text-white font-black";
                          } else if (isHadir) {
                            cellBg = "bg-emerald-50/60 text-emerald-950";
                            badgeBg = "bg-emerald-100 text-emerald-800 border border-emerald-300";
                          } else if (isSakit) {
                            cellBg = "bg-yellow-50 text-yellow-950 font-bold";
                            badgeBg = "bg-yellow-300 text-yellow-950 border border-yellow-400 font-bold";
                          } else if (isIzin) {
                            cellBg = "bg-amber-50 text-amber-950 font-bold";
                            badgeBg = "bg-amber-400 text-amber-950 border border-amber-500 font-bold";
                          }

                          return (
                            <td key={gIdx} className={`py-1.5 px-1 text-center border-r border-slate-200 text-[10px] ${cellBg}`}>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-tight ${badgeBg}`}>
                                {isNoSchedule ? '-' : isLate ? 'TERLAMBAT' : isAlpha ? 'ALPHA' : st}
                              </span>
                              {!isNoSchedule && (isHadir || isLate) && dayRecord && (
                                <div className="text-[7.5px] font-mono text-slate-700 mt-0.5 leading-tight">
                                  <div>M: {dayRecord.checkInTime}</div>
                                  {dayRecord.checkOutTime !== '-' && (
                                    <div className="text-blue-700 font-bold">P: {dayRecord.checkOutTime}</div>
                                  )}
                                </div>
                              )}
                              {!isNoSchedule && isLate && dayRecord && dayRecord.latenessMinutes > 0 && (
                                <div className="text-[7px] text-amber-900 font-bold leading-tight">
                                  +{dayRecord.latenessMinutes}m
                                </div>
                              )}
                            </td>
                          );
                        } else {
                          // Bulanan or Semester Mode: Aggregate attended days in this group
                          let attendedCount = 0;
                          let scheduledCount = 0;
                          grp.dates.forEach(gDate => {
                            const found = recap.days.find(d => 
                              d.date.getFullYear() === gDate.getFullYear() &&
                              d.date.getMonth() === gDate.getMonth() &&
                              d.date.getDate() === gDate.getDate()
                            );
                            if (found && found.status !== 'Tidak Ada Jadwal') {
                              scheduledCount++;
                              if (found.status === 'Hadir' || found.status === 'Terlambat') {
                                attendedCount++;
                              }
                            }
                          });

                          return (
                            <td key={gIdx} className="py-2 px-2 text-center border-r border-slate-200 text-xs font-bold">
                              {scheduledCount > 0 ? (
                                <span className={`inline-block px-2 py-1 rounded text-[11px] font-extrabold ${
                                  attendedCount > 0 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {attendedCount} Hari
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[11px] font-normal">-</span>
                              )}
                            </td>
                          );
                        }
                      })}

                      {/* RECAP SUMMARY COLUMNS (EXACTLY 9 COLUMNS) */}
                      <td className="py-2 px-2 text-center font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200">
                        {recap.summary.totalHariEfektif}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-emerald-700 bg-emerald-50/40 border-r border-slate-200">
                        {recap.summary.masuk}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-800 bg-emerald-50/20 border-r border-slate-200">
                        {recap.summary.tepatWaktu}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-950 bg-amber-50 border-r border-amber-200">
                        {recap.summary.terlambat}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-700 bg-slate-100 border-r border-slate-200">
                        {recap.summary.tidakMasuk}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-yellow-950 bg-yellow-100 border-r border-yellow-300">
                        {recap.summary.sakit}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-amber-950 bg-amber-100 border-r border-amber-300">
                        {recap.summary.izin}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-white bg-red-600 border-r border-red-700">
                        {recap.summary.alpha}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-blue-700">
                        {recap.summary.persentaseKehadiran.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* TOTAL / RATA-RATA FOOTER ROW */}
            <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-950 sticky bottom-0 z-20">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider font-black text-slate-200 border-r border-slate-800">
                  RATA-RATA / TOTAL KESELURUHAN:
                </td>
                {columnGroups.map((grp, gIdx) => (
                  <td key={gIdx} className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-800">
                    -
                  </td>
                ))}
                <td className="py-2.5 px-2 text-center font-black bg-blue-950 text-blue-200 border-r border-slate-800">
                  {personRecaps.length > 0 ? Math.round(personRecaps.reduce((acc, c) => acc + c.summary.totalHariEfektif, 0) / personRecaps.length) : 0}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-emerald-900 text-emerald-200 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.masuk, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-emerald-800 text-emerald-100 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.tepatWaktu, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-amber-500 text-slate-950 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.terlambat, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-slate-700 text-slate-200 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.tidakMasuk, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-yellow-400 text-yellow-950 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.sakit, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-amber-500 text-amber-950 border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.izin, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-red-600 text-white border-r border-slate-800">
                  {personRecaps.reduce((acc, c) => acc + c.summary.alpha, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black bg-blue-900 text-blue-100">
                  {aggregateSummary.avgPercentage.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
