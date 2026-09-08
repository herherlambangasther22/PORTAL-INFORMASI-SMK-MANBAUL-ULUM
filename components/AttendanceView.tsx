import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './Card';
import { Student, Teacher, School, AttendanceLog, AttendanceStatus, Schedule, Subject, ScheduleEntry, Notification } from '../types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  DownloadIcon, 
  AttendanceIcon, 
  UserIcon, 
  XIcon, 
  MenuIcon, 
  ClockIcon, 
  TrashIcon, 
  CheckIcon, 
  CheckCircleIcon,
  SearchIcon, 
  TeacherIcon, 
  StudentIcon,
  ExcelIcon,
  RfidCardIcon,
  QrCodeIcon,
  InfoIcon,
  PencilIcon
} from './icons/Icons';
import { NotificationBell } from './NotificationBell';
import { escapeCsvValue } from '../utils';
import { AttendanceRecapMatrix } from './AttendanceRecapMatrix';
import { EditAttendanceModal } from './EditAttendanceModal';
import { calculatePersonRecap, exportAttendanceToColoredExcel } from '../utils/attendanceReportHelper';
import { attendanceSync } from '../utils/attendanceSync';

interface AttendanceViewProps {
  students: Student[];
  teachers: Teacher[];
  schoolType: School;
  attendanceLog: AttendanceLog;
  onUpdateLog: (log: AttendanceLog) => void;
  schedule: Schedule;
  subjects: Subject[];
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

const toLocalYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIndonesianDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getCurrentTimeStr = () => {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
};

const ReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  log: AttendanceLog;
  list: (Student | Teacher)[];
  schoolType: School;
  schedule: Schedule;
  subjects: Subject[];
  onResetAll?: () => void;
}> = ({ isOpen, onClose, log, list, schedule, onResetAll }) => {
  const [reportDate, setReportDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const monthlyReport = useMemo(() => {
    const { month, year } = reportDate;
    type ReportSummary = Record<Exclude<AttendanceStatus, '-'>, number>;
    const report: { person: Student | Teacher; summary: ReportSummary; totalDays: number }[] = [];

    const isTeacherScheduledOnDay = (teacherId: number, date: Date) => {
      const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
      const dayName = dayNames[date.getDay()];
      if (dayName === "Minggu" || !schedule || !schedule[dayName]) return false;

      const daySchedule = schedule[dayName] || [];
      return daySchedule.some(period =>
        Object.values(period.classes).some((entry: ScheduleEntry) =>
          entry.teacherCode === teacherId && !['ISTIRAHAT', 'ISHOMA', 'TADARUS'].includes(entry.subjectCode)
        )
      );
    };

    list.forEach(person => {
      const summary: ReportSummary = { 'Hadir': 0, 'Sakit': 0, 'Izin': 0, 'Alpha': 0 };
      let totalExpectedDays = 0;

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();

        let shouldCountDay = false;
        if ('class' in person) {
          shouldCountDay = dayOfWeek !== 0; // Senin - Sabtu untuk siswa
        } else {
          shouldCountDay = isTeacherScheduledOnDay(person.id, date);
        }

        if (shouldCountDay) {
          totalExpectedDays++;
          const dateKey = toLocalYYYYMMDD(date);
          const record = log[dateKey]?.[person.id] || log[dateKey]?.[String(person.id)];
          const status = typeof record === 'object' ? record?.status : record;

          if (status && status in summary) {
            summary[status as Exclude<AttendanceStatus, '-'>]++;
          }
        }
      }
      report.push({ person, summary, totalDays: totalExpectedDays });
    });
    return report;
  }, [reportDate, log, list, schedule]);

  const handleDownloadMonthly = () => {
    let csvContent = "\ufeff";
    csvContent += escapeCsvValue("REKAPITULASI ABSENSI BULANAN SMK MANBAUL ULUM") + "\n";
    csvContent += escapeCsvValue(`Bulan: ${new Date(0, reportDate.month).toLocaleString('id-ID', { month: 'long' })} ${reportDate.year}`) + "\n\n";

    csvContent += [
      escapeCsvValue("No"),
      escapeCsvValue("Nama Lengkap"),
      escapeCsvValue("Kelas / Peran"),
      escapeCsvValue("Hadir"),
      escapeCsvValue("Sakit"),
      escapeCsvValue("Izin"),
      escapeCsvValue("Alpha"),
      escapeCsvValue("Total Hari Efektif"),
      escapeCsvValue("Persentase Kehadiran (%)")
    ].join(",") + "\n";

    monthlyReport.forEach((item, index) => {
      const { person, summary, totalDays } = item;
      const recordedPresentForPercentage = summary.Hadir + summary.Sakit + summary.Izin;
      const presencePercentage = totalDays > 0 ? ((recordedPresentForPercentage / totalDays) * 100).toFixed(1) : "0.0";

      const className = 'class' in person ? `Kelas ${person.class}` : 'Guru Pengajar';
      const personName = 'fullName' in person ? person.fullName : person.name;

      const row = [
        escapeCsvValue(index + 1),
        escapeCsvValue(personName),
        escapeCsvValue(className),
        escapeCsvValue(summary.Hadir),
        escapeCsvValue(summary.Sakit),
        escapeCsvValue(summary.Izin),
        escapeCsvValue(summary.Alpha),
        escapeCsvValue(totalDays),
        escapeCsvValue(presencePercentage)
      ].join(',');
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Absensi_Bulanan_${reportDate.month + 1}_${reportDate.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card appearance="clean" className="w-full max-w-4xl max-h-[90vh] flex flex-col p-6 bg-white shadow-2xl rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Rekapitulasi Laporan Bulanan</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Ringkasan akumulasi kehadiran bulanan secara rinci</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select 
            value={reportDate.month} 
            onChange={e => setReportDate(d => ({ ...d, month: +e.target.value }))} 
            className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none text-xs font-bold text-slate-700"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={reportDate.year} 
            onChange={e => setReportDate(d => ({ ...d, year: +e.target.value }))} 
            className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none text-xs font-bold text-slate-700"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            {onResetAll && (
              <button
                type="button"
                onClick={onResetAll}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1.5"
                title="Hapus Seluruh Database Riwayat Absensi"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Reset Semua Log</span>
              </button>
            )}
            <button 
              type="button" 
              onClick={handleDownloadMonthly} 
              className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 flex items-center gap-2 active:scale-95"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Unduh Excel Bulanan</span>
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar border border-slate-200 rounded-xl">
          <table className="w-full min-w-max border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Peran / Kelas</th>
                <th className="p-3 text-center">Hadir</th>
                <th className="p-3 text-center">Sakit</th>
                <th className="p-3 text-center">Izin</th>
                <th className="p-3 text-center">Alpha</th>
                <th className="p-3 text-center">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyReport.map(({ person, summary, totalDays }, idx) => {
                const name = 'fullName' in person ? person.fullName : person.name;
                const role = 'class' in person ? `Kelas ${person.class}` : 'Guru';
                const percentage = totalDays > 0 ? (((summary.Hadir + summary.Sakit + summary.Izin) / totalDays) * 100).toFixed(1) : '0';

                return (
                  <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800">{name}</td>
                    <td className="p-3 font-medium text-slate-600">{role}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{summary.Hadir}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{summary.Sakit}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{summary.Izin}</td>
                    <td className="p-3 text-center font-bold text-red-600">{summary.Alpha}</td>
                    <td className="p-3 text-center font-black text-slate-800 bg-slate-50">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  teachers,
  schoolType,
  attendanceLog,
  onUpdateLog,
  schedule,
  subjects,
  onMenuClick,
  notifications,
  onNotificationsOpen,
}) => {
  // Sub-Menu Mode: 'daily_attendance' (Data Absensi Siswa) vs 'recap_attendance' (Rekap Absensi Siswa)
  const [mainSubMenu, setMainSubMenu] = useState<'daily_attendance' | 'recap_attendance'>('daily_attendance');
  // Sub-tab di dalam Data Absensi Siswa: 'digital' (Hasil Absensi Digital & Terdata) vs 'manual' (Absensi Manual Bagi Yang Tidak Masuk)
  const [dailyTab, setDailyTab] = useState<'digital' | 'manual'>('digital');
  const [editingPerson, setEditingPerson] = useState<{ person: Student | Teacher; record: any } | null>(null);

  // Common Filter States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<'student' | 'teacher'>('student');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time Clock for WIB context
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manual Input State
  const [manualStatuses, setManualStatuses] = useState<Record<string | number, Exclude<AttendanceStatus, '-'>>>({});
  const [manualNotes, setManualNotes] = useState<Record<string | number, string>>({});
  const [isSubmittingBatch, setIsSubmittingBatch] = useState<boolean>(false);

  // Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const classes = ['Semua', 'X', 'XI', 'XII'];
  const dateKey = toLocalYYYYMMDD(selectedDate);
  const todayKey = toLocalYYYYMMDD(currentTime);
  const isSelectedDateToday = dateKey === todayKey;

  const dailyLog = attendanceLog[dateKey] || {};

  // Quick Date Navigation
  const changeDate = (days: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const handleSetToday = () => {
    setSelectedDate(new Date());
  };

  // -------------------------------------------------------------
  // DYNAMIC FILTERING ALGORITHMS
  // -------------------------------------------------------------

  // Helper to determine if a person has ALREADY checked in (Digitally via RFID/Face/QR or recorded manually)
  const checkHasAttendanceRecord = (personId: string | number) => {
    const record = dailyLog[personId] ?? dailyLog[String(personId)];
    return record !== undefined && record !== null;
  };

  // Helper to retrieve attendance record
  const getAttendanceRecord = (personId: string | number) => {
    return dailyLog[personId] ?? dailyLog[String(personId)] ?? null;
  };

  // Base list depending on active category & class & search query
  const filteredBaseList = useMemo(() => {
    if (activeCategory === 'student') {
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
  }, [students, teachers, activeCategory, selectedClass, searchQuery]);

  // 1. SUB-MENU "HASIL SELURUH ABSENSI":
  // Lists people who HAVE checked in (either via RFID, Wajah, QR Code, or Operator input) on selected date
  const attendedRecordsList = useMemo(() => {
    return filteredBaseList.map(person => {
      const record = getAttendanceRecord(person.id);
      if (!record) return null;
      return {
        person,
        record
      };
    }).filter((item): item is { person: Student | Teacher; record: any } => item !== null);
  }, [filteredBaseList, dailyLog]);

  // 2. SUB-MENU "ABSENSI MANUAL":
  // HANYA BERISI NAMA SISWA DAN GURU YANG BELUM TERDATA/MELAKUKAN ABSENSI DIGITAL
  const unattendedPersonsList = useMemo(() => {
    return filteredBaseList.filter(person => {
      const hasRecord = checkHasAttendanceRecord(person.id);
      return !hasRecord;
    });
  }, [filteredBaseList, dailyLog]);

  // Digital Attendance breakdown counters
  const digitalVsManualStats = useMemo(() => {
    let rfidCount = 0;
    let faceCount = 0;
    let qrCount = 0;
    let manualCount = 0;

    attendedRecordsList.forEach(({ record }) => {
      const method = typeof record === 'object' ? (record?.method || '') : '';
      const methodLower = method.toLowerCase();
      if (methodLower.includes('rfid')) rfidCount++;
      else if (methodLower.includes('wajah') || methodLower.includes('face')) faceCount++;
      else if (methodLower.includes('qr') || methodLower.includes('barcode')) qrCount++;
      else manualCount++;
    });

    const totalDigital = rfidCount + faceCount + qrCount;
    return { rfidCount, faceCount, qrCount, manualCount, totalDigital };
  }, [attendedRecordsList]);

  // Daily Statistics Counters for selected date
  const dailyStats = useMemo(() => {
    const totalExpected = filteredBaseList.length;
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpha = 0;

    filteredBaseList.forEach(person => {
      const record = getAttendanceRecord(person.id);
      const status = typeof record === 'object' ? record?.status : record;
      if (status === 'Hadir') hadir++;
      else if (status === 'Sakit') sakit++;
      else if (status === 'Izin') izin++;
      else if (status === 'Alpha') alpha++;
    });

    const recordedTotal = hadir + sakit + izin + alpha;
    const belum = Math.max(0, totalExpected - recordedTotal);
    const percentage = totalExpected > 0 ? ((hadir + sakit + izin) / totalExpected) * 100 : 0;

    return { hadir, sakit, izin, alpha, belum, totalExpected, percentage };
  }, [filteredBaseList, dailyLog]);

  // -------------------------------------------------------------
  // ACTIONS: Save Manual Attendance Entry
  // -------------------------------------------------------------
  const handleSaveSingleManualAttendance = (personId: string | number) => {
    const statusVal = manualStatuses[personId] || 'Izin';
    const noteVal = (manualNotes[personId] || '').trim();
    const timeStr = getCurrentTimeStr();

    const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
    if (!newLog[dateKey]) newLog[dateKey] = {};

    newLog[dateKey][personId] = {
      status: statusVal,
      timestamp: `${timeStr} WIB`,
      method: 'Manual Operator',
      note: noteVal || (
        statusVal === 'Alpha' ? 'Tanpa Keterangan' : 
        statusVal === 'Hadir' ? 'Hadir Susulan / Manual' : 
        `Absen Manual (${statusVal})`
      )
    };

    onUpdateLog(newLog);

    // Clean up temporary manual input state for this person
    setManualStatuses(prev => {
      const copy = { ...prev };
      delete copy[personId];
      return copy;
    });
    setManualNotes(prev => {
      const copy = { ...prev };
      delete copy[personId];
      return copy;
    });
  };

  const handleSaveBatchManualAttendance = () => {
    if (unattendedPersonsList.length === 0) return;

    if (!window.confirm(`Simpan input ketidakhadiran manual untuk ${unattendedPersonsList.length} orang pada tanggal ${formatIndonesianDate(selectedDate)}?`)) {
      return;
    }

    setIsSubmittingBatch(true);
    const timeStr = getCurrentTimeStr();
    const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
    if (!newLog[dateKey]) newLog[dateKey] = {};

    unattendedPersonsList.forEach(person => {
      const statusVal = manualStatuses[person.id] || 'Izin';
      const noteVal = (manualNotes[person.id] || '').trim();

      newLog[dateKey][person.id] = {
        status: statusVal,
        timestamp: `${timeStr} WIB`,
        method: 'Manual Operator',
        note: noteVal || (
          statusVal === 'Alpha' ? 'Tanpa Keterangan' : 
          statusVal === 'Hadir' ? 'Hadir Susulan / Manual' : 
          `Absen Manual (${statusVal})`
        )
      };
    });

    onUpdateLog(newLog);
    setManualStatuses({});
    setManualNotes({});
    setIsSubmittingBatch(false);
  };

  // Single Delete / Reset Attendance Entry (Immediately returns person to manual queue)
  const handleDeleteAttendanceEntry = (personId: string | number, personName: string) => {
    if (!window.confirm(`Hapus catatan absensi untuk ${personName} pada tanggal ${formatIndonesianDate(selectedDate)}?\n\nSetelah dihapus, nama ini akan kembali muncul di tab 'Absensi Manual'.`)) {
      return;
    }

    const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
    if (newLog[dateKey]) {
      if (newLog[dateKey][personId] !== undefined) {
        delete newLog[dateKey][personId];
      }
      if (newLog[dateKey][String(personId)] !== undefined) {
        delete newLog[dateKey][String(personId)];
      }
      if (Object.keys(newLog[dateKey]).length === 0) {
        delete newLog[dateKey];
      }
      onUpdateLog(newLog);
    }
  };

  // Reset Entire Day Log
  const handleClearSelectedDateLog = () => {
    const recordsCount = Object.keys(attendanceLog[dateKey] || {}).length;
    if (recordsCount === 0) return;

    if (window.confirm(`HAPUS SELURUH LOG ABSENSI TANGGAL INI?\n\nTanggal: ${formatIndonesianDate(selectedDate)}\nJumlah Data: ${recordsCount} entri.\n\nSetelah dihapus, seluruh siswa & guru akan kembali masuk ke antrean Absensi Manual.`)) {
      const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
      delete newLog[dateKey];
      onUpdateLog(newLog);
    }
  };

  // Reset All Database
  const handleResetAllAttendanceLogs = () => {
    const totalDates = Object.keys(attendanceLog).length;
    if (totalDates === 0) {
      alert("Database riwayat absensi saat ini sudah bersih (0 catatan).");
      return;
    }
    if (window.confirm(`PERINGATAN KRUSIAL: Anda akan menghapus SELURUH riwayat absensi (${totalDates} tanggal) dari Master Database.\n\nLanjutkan?`)) {
      onUpdateLog({});
      setIsReportModalOpen(false);
    }
  };

  // Save edited attendance record from modal
  const handleSaveEditedAttendance = (personId: string | number, updatedRecord: any) => {
    const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
    if (!newLog[dateKey]) newLog[dateKey] = {};
    newLog[dateKey][personId] = updatedRecord;
    onUpdateLog(newLog);
    attendanceSync.broadcastLogUpdate(newLog);
  };

  // -------------------------------------------------------------
  // EXPORT EXCEL DAILY REPORT (WITH AUTOMATIC CELL COLORS: KUNING = TERLAMBAT, MERAH = ALPHA)
  // -------------------------------------------------------------
  const handleExportDailyExcel = () => {
    const recaps = filteredBaseList.map(person => calculatePersonRecap(person, [selectedDate], attendanceLog));
    exportAttendanceToColoredExcel({
      title: 'LAPORAN HASIL ABSENSI HARIAN SISWA & GURU',
      subtitle: 'SMK Manbaul Ulum - Presensi Jam Masuk & Jam Pulang',
      periodLabel: formatIndonesianDate(selectedDate),
      classLabel: activeCategory === 'student' ? `Kelas ${selectedClass}` : 'Seluruh Guru Pengajar',
      dates: [selectedDate],
      recaps,
      filename: `Laporan_Absensi_Harian_${activeCategory}_${dateKey}`
    });
  };

  return (
    <div className="flex flex-col gap-5 h-full animate-fade-in pb-12">
      {/* Modal Bulanan */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        log={attendanceLog}
        list={activeCategory === 'student' ? students : teachers}
        schoolType={schoolType}
        schedule={schedule}
        subjects={subjects}
        onResetAll={handleResetAllAttendanceLogs}
      />

      {/* HEADER UTAMA */}
      <Card className="p-4 sm:p-5 !border-l-[6px] !border-b-[4px] !border-teal-600 !border-t-0 !border-r-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
              <MenuIcon className="w-6 h-6 text-slate-700" />
            </button>
            <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
              <AttendanceIcon className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                Data Absensi Sekolah
              </h1>
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mt-1">
                Rekapitulasi Presensi Digital & Input Ketidakhadiran Operator
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2 sm:gap-3">
            {Object.keys(dailyLog).length > 0 && (
              <button
                type="button"
                onClick={handleClearSelectedDateLog}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Hapus bersih log absensi hari ini"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Hapus Log Hari Ini</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportDailyExcel}
              className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 flex items-center gap-2 active:scale-95 shimmer-active"
            >
              <ExcelIcon className="w-4 h-4" />
              <span>Export Laporan Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 bg-slate-800 text-white shadow-md hover:bg-slate-900"
            >
              Rekap Bulanan
            </button>

            <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
          </div>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* SUB-MENU UTAMA: DATA ABSENSI SISWA vs REKAP ABSENSI SISWA      */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainSubMenu('daily_attendance')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              mainSubMenu === 'daily_attendance'
                ? 'bg-teal-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <AttendanceIcon className="w-4 h-4" />
            <span>Data Absensi Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => setMainSubMenu('recap_attendance')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              mainSubMenu === 'recap_attendance'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Rekap Absensi Siswa</span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-600 px-3 hidden sm:block">
          {mainSubMenu === 'daily_attendance'
            ? 'Presensi harian digital & input manual bagi yang tidak masuk'
            : 'Rekapitulasi berkala (Harian, Mingguan, Bulanan, dan 1 Semester)'}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-MENU 2: REKAP ABSENSI SISWA                                 */}
      {/* ============================================================== */}
      {mainSubMenu === 'recap_attendance' && (
        <AttendanceRecapMatrix
          students={students}
          teachers={teachers}
          attendanceLog={attendanceLog}
          onUpdateLog={onUpdateLog}
          activeCategory={activeCategory}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          schedule={schedule}
        />
      )}

      {/* ============================================================== */}
      {/* SUB-MENU 1: DATA ABSENSI SISWA (DIGITAL & MANUAL TIDAK MASUK)  */}
      {/* ============================================================== */}
      {mainSubMenu === 'daily_attendance' && (
        <>
          {/* FILTER TANGGAL, NAVIGASI WAKTU & INFO CUT-OFF 07:30 WIB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Selector Card */}
        <Card className="p-3 md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl hover:bg-slate-300/50 shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)] active:scale-95"
              title="Hari Sebelumnya"
            >
              <ChevronLeftIcon className="w-5 h-5 text-slate-700" />
            </button>

            <div className="flex-1 text-center sm:text-left px-2">
              <span className="block font-black text-slate-800 text-sm sm:text-base uppercase tracking-tight">
                {formatIndonesianDate(selectedDate)}
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tanggal Terpilih ({dateKey}) {isSelectedDateToday ? '• HARI INI' : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl hover:bg-slate-300/50 shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)] active:scale-95"
              title="Hari Berikutnya"
            >
              <ChevronRightIcon className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSetToday}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                isSelectedDateToday 
                  ? 'bg-teal-600 text-white shadow-sm font-black' 
                  : 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              Hari Ini
            </button>

            <input
              type="date"
              value={dateKey}
              onChange={e => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                }
              }}
              className="py-1.5 px-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
        </Card>

        {/* Kategori Toggle (Siswa vs Guru) */}
        <Card className="p-2 flex items-center justify-center">
          <div className="flex w-full gap-1 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setActiveCategory('student'); setSelectedClass('Semua'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeCategory === 'student' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <StudentIcon className="w-4 h-4" />
              <span>Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveCategory('teacher'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeCategory === 'teacher' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <TeacherIcon className="w-4 h-4" />
              <span>Guru</span>
            </button>
          </div>
        </Card>
      </div>

      {/* STATISTIK RINGKAS HARIAN */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 text-center border-b-2 border-emerald-500">
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{dailyStats.hadir}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hadir</p>
        </Card>

        <Card className="p-3 text-center border-b-2 border-amber-500">
          <p className="text-xl sm:text-2xl font-black text-amber-600">{dailyStats.sakit}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sakit</p>
        </Card>

        <Card className="p-3 text-center border-b-2 border-blue-500">
          <p className="text-xl sm:text-2xl font-black text-blue-600">{dailyStats.izin}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Izin</p>
        </Card>

        <Card className="p-3 text-center border-b-2 border-red-500">
          <p className="text-xl sm:text-2xl font-black text-red-600">{dailyStats.alpha}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alpha</p>
        </Card>

        <Card className="p-3 text-center bg-teal-50 border border-teal-200 col-span-2 sm:col-span-1">
          <p className="text-xl sm:text-2xl font-black text-teal-700">{dailyStats.percentage.toFixed(1)}%</p>
          <p className="text-[10px] text-teal-800 font-black uppercase tracking-wider">Rasio Kehadiran</p>
        </Card>
      </div>

      {/* FILTER SEARCH & KELAS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Class Filter buttons for Students */}
        {activeCategory === 'student' ? (
          <Card className="p-1.5 w-full sm:w-auto">
            <div className="flex flex-wrap gap-1 bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] rounded-xl p-1">
              {classes.map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                    selectedClass === cls ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
                </button>
              ))}
            </div>
          </Card>
        ) : (
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <TeacherIcon className="w-4 h-4 text-teal-600" />
            <span>Pencarian Data Guru Pengajar (SMK Manbaul Ulum)</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Cari nama siswa atau kelas...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] text-xs font-bold text-slate-700 focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS DALAM DATA ABSENSI SISWA: 1. HASIL SELURUH ABSENSI & 2. ABSENSI MANUAL BAGI YANG TIDAK MASUK */}
      <div className="flex flex-wrap gap-2 border-b-2 border-slate-300/50 pb-1 mt-2">
        <button
          type="button"
          onClick={() => setDailyTab('digital')}
          className={`py-3 px-5 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            dailyTab === 'digital'
              ? 'bg-teal-600 text-white shadow-lg translate-y-0.5'
              : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300/70'
          }`}
        >
          <ClockIcon className="w-4 h-4" />
          <span>1. Hasil Seluruh Absensi ({attendedRecordsList.length} Terdata)</span>
        </button>

        <button
          type="button"
          onClick={() => setDailyTab('manual')}
          className={`py-3 px-5 rounded-t-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            dailyTab === 'manual'
              ? 'bg-amber-600 text-white shadow-lg translate-y-0.5'
              : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300/70'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>2. Absensi Manual Bagi Yang Tidak Masuk ({unattendedPersonsList.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: HASIL ABSENSI DIGITAL & TERDATA                        */}
      {/* ============================================================== */}
      {dailyTab === 'digital' && (
        <Card className="p-4 sm:p-5 flex-1 flex flex-col bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-300/50">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <span>Daftar Presensi Harian ({formatIndonesianDate(selectedDate)})</span>
                <span className="text-xs font-bold px-3 py-0.5 bg-teal-100 text-teal-800 rounded-full border border-teal-200">
                  {attendedRecordsList.length} Terdata
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Menampilkan jam masuk/berangkat dan jam pulang {activeCategory === 'student' ? 'siswa' : 'guru'}. Keterlambatan di atas 07:15 WIB otomatis tercatat.
              </p>
            </div>

            {/* Quick breakdown tag & Export Excel */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-emerald-700">Digital: {digitalVsManualStats.totalDigital}</span>
                <span>•</span>
                <span className="text-amber-700">Manual: {digitalVsManualStats.manualCount}</span>
              </div>
              <button
                type="button"
                onClick={handleExportDailyExcel}
                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Unduh Excel Harian</span>
              </button>
            </div>
          </div>

          {attendedRecordsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
              {attendedRecordsList.map(({ person, record }) => {
                const name = 'fullName' in person ? person.fullName : person.name;
                const role = 'class' in person ? `Kelas ${person.class}` : 'Guru Pengajar';
                const idStr = 'nis' in person ? `NIS: ${person.nis}` : (person.nip ? `NIP: ${person.nip}` : `ID: ${person.id}`);
                const status = typeof record === 'object' ? record.status : record;
                const checkIn = (typeof record === 'object' && (record.checkInTime || record.timestamp)) || '-';
                const checkOut = (typeof record === 'object' && record.checkOutTime) || null;
                const isLate = (typeof record === 'object' && record.isLate) || status === 'Terlambat';
                const latenessMinutes = (typeof record === 'object' && record.latenessMinutes) || 0;
                const method = typeof record === 'object' ? (record.method || 'Digital Scan') : 'Digital Scan';
                const note = typeof record === 'object' ? record.note : '';

                // Method badge styling & icon
                const isRfid = method.toLowerCase().includes('rfid');
                const isFace = method.toLowerCase().includes('wajah') || method.toLowerCase().includes('face');
                const isQr = method.toLowerCase().includes('qr') || method.toLowerCase().includes('barcode');
                const isManual = method.toLowerCase().includes('manual');

                // Color themes per status
                let badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
                if (isLate) badgeStyle = "bg-amber-200 text-amber-950 border-amber-400 font-black";
                else if (status === 'Hadir') badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                else if (status === 'Sakit') badgeStyle = "bg-yellow-300 text-yellow-950 border-yellow-400 font-bold";
                else if (status === 'Izin') badgeStyle = "bg-amber-400 text-amber-950 border-amber-500 font-bold";
                else if (status === 'Alpha') badgeStyle = "bg-red-600 text-white font-black";

                return (
                  <div
                    key={person.id}
                    className="p-3.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm flex items-start justify-between gap-3 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 text-sm overflow-hidden flex-shrink-0 border border-slate-300">
                        {person.photoUrl ? (
                          <img src={person.photoUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name.charAt(0)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate uppercase tracking-tight">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-semibold">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{role}</span>
                        </div>

                        {/* Jam Berangkat / Masuk & Jam Pulang */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <ClockIcon className="w-3 h-3 text-slate-400" />
                            <span>Masuk: <strong className="font-mono text-slate-900">{checkIn}</strong></span>
                          </span>

                          <span className="flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <span>Pulang:</span>
                            {checkOut ? (
                              <strong className="font-mono text-blue-700">{checkOut}</strong>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Belum Pulang</span>
                            )}
                          </span>

                          <span className={`flex items-center gap-1 font-black px-2 py-0.5 rounded uppercase tracking-wider text-[9px] ${
                            isRfid ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            isFace ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            isQr ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                            isManual ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {isRfid && <RfidCardIcon className="w-3 h-3 text-indigo-600" />}
                            {isFace && <span>📷</span>}
                            {isQr && <QrCodeIcon className="w-3 h-3 text-teal-600" />}
                            <span>{method}</span>
                          </span>
                        </div>

                        {isLate && latenessMinutes > 0 && (
                          <div className="mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            ⚠️ Terlambat {latenessMinutes} menit dari jadwal pelajaran
                          </div>
                        )}

                        {note && (
                          <p className="mt-2 text-[11px] font-medium text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200 italic">
                            💬 Keterangan: "{note}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${badgeStyle}`}>
                        {isLate ? 'Terlambat' : status}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingPerson({ person, record: typeof record === 'object' ? record : { status: record } })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-all border border-transparent hover:border-teal-200"
                          title="Edit Jam Masuk, Jam Pulang, atau Status Kehadiran"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAttendanceEntry(person.id, name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-70 group-hover:opacity-100"
                          title="Hapus / Reset Absensi (Kembalikan ke antrean Belum Absen)"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center bg-white/40 rounded-2xl border-2 border-dashed border-slate-300">
              <UserIcon className="w-12 h-12 mb-2 opacity-40" />
              <p className="font-bold text-sm uppercase tracking-widest text-slate-600">Belum Ada Data Presensi</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Belum ada {activeCategory === 'student' ? 'siswa' : 'guru'} yang melakukan absensi digital pada tanggal {formatIndonesianDate(selectedDate)}.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: ABSENSI MANUAL BAGI YANG TIDAK MASUK                */}
      {/* ============================================================== */}
      {dailyTab === 'manual' && (
        <Card className="p-4 sm:p-5 flex-1 flex flex-col bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-300/50">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <span>Antrean Absensi Manual</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  {unattendedPersonsList.length} Belum Terdata
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Pencatatan ketidakhadiran (Izin, Sakit, Alpha) atau kehadiran manual bagi yang belum melakukan presensi digital.
              </p>
            </div>

            {unattendedPersonsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  disabled={isSubmittingBatch}
                  onClick={handleSaveBatchManualAttendance}
                  className="py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Simpan Semua Ketidakhadiran</span>
                </button>
              </div>
            )}
          </div>

          {unattendedPersonsList.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
              {unattendedPersonsList.map(person => {
                const name = 'fullName' in person ? person.fullName : person.name;
                const role = 'class' in person ? `Kelas ${person.class}` : 'Guru Pengajar';
                const idStr = 'nis' in person ? `NIS: ${person.nis}` : (person.nip ? `NIP: ${person.nip}` : `ID: ${person.id}`);
                const currentStatus = manualStatuses[person.id] || 'Izin';
                const currentNote = manualNotes[person.id] || '';

                return (
                  <div
                    key={person.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    {/* Person Detail Info */}
                    <div className="flex items-center gap-3 min-w-0 lg:w-1/3">
                      <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-black text-amber-700 text-sm overflow-hidden flex-shrink-0">
                        {person.photoUrl ? (
                          <img src={person.photoUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate uppercase tracking-tight">{name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{role}</p>
                      </div>
                    </div>

                    {/* Status Radio Choice & Note Input */}
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Status Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {(['Izin', 'Sakit', 'Alpha', 'Hadir'] as Exclude<AttendanceStatus, '-'>[]).map(st => {
                          const isSelected = currentStatus === st;
                          let activeColor = "bg-amber-400 text-amber-950 font-bold shadow-sm";
                          if (st === 'Sakit') activeColor = "bg-yellow-300 text-yellow-950 font-bold shadow-sm";
                          else if (st === 'Alpha') activeColor = "bg-red-600 text-white font-black shadow-sm";
                          else if (st === 'Hadir') activeColor = "bg-emerald-600 text-white shadow-sm";

                          const labelText = st === 'Hadir' ? 'Hadir Susulan' : st;

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setManualStatuses(prev => ({ ...prev, [person.id]: st }));
                                // Preset note if empty
                                if (!manualNotes[person.id]) {
                                  if (st === 'Izin') setManualNotes(prev => ({ ...prev, [person.id]: 'Izin (Keperluan Keluarga/Surat)' }));
                                  else if (st === 'Sakit') setManualNotes(prev => ({ ...prev, [person.id]: 'Sakit (Surat Dokter/Keterangan)' }));
                                  else if (st === 'Alpha') setManualNotes(prev => ({ ...prev, [person.id]: 'Tanpa Keterangan' }));
                                  else if (st === 'Hadir') setManualNotes(prev => ({ ...prev, [person.id]: 'Hadir Manual (Lupa Kartu/Terlambat)' }));
                                }
                              }}
                              className={`py-1.5 px-2.5 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${
                                isSelected ? activeColor : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {labelText}
                            </button>
                          );
                        })}
                      </div>

                      {/* Note / Keterangan Text Input */}
                      <input
                        type="text"
                        placeholder={
                          currentStatus === 'Izin' ? "Keterangan Izin (cth: Acara keluarga)..." :
                          currentStatus === 'Sakit' ? "Keterangan Sakit (cth: Demam, ada surat)..." :
                          currentStatus === 'Alpha' ? "Catatan Alpha (cth: Tanpa keterangan)..." :
                          "Catatan hadir susulan / alasan..."
                        }
                        value={currentNote}
                        onChange={e => setManualNotes(prev => ({ ...prev, [person.id]: e.target.value }))}
                        className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 bg-slate-50"
                      />
                    </div>

                    {/* Submit Single Person Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveSingleManualAttendance(person.id)}
                      className="py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Simpan Absen</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center text-emerald-700 bg-emerald-50/60 rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center p-6">
              <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-3" />
              <p className="font-black text-lg uppercase tracking-tight text-emerald-900">
                100% TERPRESENSI DIGITAL / TERVERIFIKASI
              </p>
              <p className="text-xs text-emerald-700 mt-1.5 max-w-lg font-medium leading-relaxed">
                Seluruh {activeCategory === 'student' ? 'siswa' : 'guru'} pada kategori ini telah melakukan absensi secara digital dengan baik (RFID / Wajah / QR Code) atau sudah tercatat oleh operator.
              </p>
              <p className="text-[11px] text-emerald-600/90 mt-2 font-bold bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Tidak ada nama yang tertinggal di antrean absensi manual.
              </p>
            </div>
          )}
        </Card>
      )}
      </>
      )}

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={!!editingPerson}
        onClose={() => setEditingPerson(null)}
        person={editingPerson?.person || null}
        dateKey={dateKey}
        dateFormatted={formatIndonesianDate(selectedDate)}
        initialRecord={editingPerson?.record}
        onSave={handleSaveEditedAttendance}
      />
    </div>
  );
};
