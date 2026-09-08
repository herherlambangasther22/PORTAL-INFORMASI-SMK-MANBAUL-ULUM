import { Schedule, ScheduleEntry } from '../types';
import { INDONESIAN_DAY_NAMES } from './attendanceReportHelper';

export { INDONESIAN_DAY_NAMES };

/**
 * Validasi apakah suatu entri mata pelajaran merupakan pelajaran TJKT / Produktif TJKT
 */
export const isTjktSubjectEntry = (entry?: ScheduleEntry | null): boolean => {
  if (!entry || !entry.subjectCode) return false;
  const upper = entry.subjectCode.trim().toUpperCase();
  
  // Kecualikan waktu non-pelajaran & pembiasaan
  if (['', 'TADARUS', 'ISTIRAHAT', 'ISHOMA', 'PD'].includes(upper)) {
    return false;
  }

  // Kode eksplisit TJKT
  if (upper.includes('TJKT')) return true;

  // Diampu oleh Guru Kejuruan TJKT (teacherCode 1 = Herlambang Lasena, S.T. - Kepala Program TJKT)
  if (entry.teacherCode === 1) return true;

  // Kode kejuruan TJKT dari smkmuSubjects:
  // A: Dasar-dasar TJKT, B: AIJ, C: ASJ, D: TLJ, E: Keamanan Jaringan, F: Pemrograman & Otomasi, O: Fiber Optik
  const tjktVocationalCodes = ['TJKT', 'A', 'B', 'C', 'D', 'E', 'F', 'O'];
  return tjktVocationalCodes.includes(upper);
};

export interface TjktClassDaySchedule {
  dayName: string;
  hasTjkt: boolean;
  totalJp: number; // Jumlah Jam Pelajaran (JP)
  timeRange: string; // e.g. "10.00 - 12.00"
  periods: {
    period: number | string;
    time: string;
    subjectCode: string;
    teacherCode: number | null;
  }[];
}

/**
 * Normalisasi nama kelas ke format standar key ('X', 'XI', 'XII')
 */
export const normalizeClassNameKey = (rawClass: string): string => {
  if (!rawClass) return 'X';
  const cleaned = rawClass.trim().toUpperCase();
  if (cleaned === 'SEMUA' || cleaned === 'ALL') return 'Semua';
  if (cleaned.includes('XII') || cleaned.includes('12')) return 'XII';
  if (cleaned.includes('XI') || cleaned.includes('11')) return 'XI';
  if (cleaned.includes('X') || cleaned.includes('10')) return 'X';
  return cleaned;
};

/**
 * Normalisasi nama hari ke format standar key ('Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu')
 */
export const normalizeDayName = (rawDay: string): string => {
  if (!rawDay) return 'Senin';
  const clean = rawDay.trim().toLowerCase();
  if (clean.includes('senin')) return 'Senin';
  if (clean.includes('selasa')) return 'Selasa';
  if (clean.includes('rabu')) return 'Rabu';
  if (clean.includes('kamis')) return 'Kamis';
  if (clean.includes('jumat') || clean.includes("jum'at") || clean.includes('jum')) return "Jum'at";
  if (clean.includes('sabtu')) return 'Sabtu';
  if (clean.includes('minggu')) return 'Minggu';
  return rawDay;
};

/**
 * Mengambil jadwal TJKT untuk kelas tertentu pada hari tertentu (Senin, Selasa, dst)
 */
export const getClassTjktScheduleOnDay = (
  schedule: Schedule,
  className: string,
  dayName: string
): TjktClassDaySchedule => {
  const normDay = normalizeDayName(dayName);
  const normClass = normalizeClassNameKey(className);

  const dayPeriods = schedule?.[normDay] || schedule?.[dayName] || [];
  const tjktPeriods: {
    period: number | string;
    time: string;
    subjectCode: string;
    teacherCode: number | null;
  }[] = [];

  dayPeriods.forEach(p => {
    if (normClass === 'Semua') {
      // Periksa apakah ada salah satu kelas (X, XI, XII) yang ada TJKT
      const hasAny = Object.entries(p.classes || {}).some(([_, entry]) => isTjktSubjectEntry(entry));
      if (hasAny) {
        tjktPeriods.push({
          period: p.period,
          time: p.time,
          subjectCode: 'TJKT',
          teacherCode: 1
        });
      }
    } else {
      let entry = p.classes?.[normClass] || p.classes?.[className];

      if (!entry && p.classes) {
        // Fallback pencocokan key kelas ter-normalisasi
        const foundKey = Object.keys(p.classes).find(k => normalizeClassNameKey(k) === normClass);
        if (foundKey) {
          entry = p.classes[foundKey];
        }
      }

      if (isTjktSubjectEntry(entry)) {
        tjktPeriods.push({
          period: p.period,
          time: p.time,
          subjectCode: entry?.subjectCode || 'TJKT',
          teacherCode: entry?.teacherCode ?? 1
        });
      }
    }
  });

  // JAMINAN SINKRONISASI PRESISI: 
  // Jika entri jadwal kustom belum terisi di state, gunakan pemetaan resmi jadwal TJKT SMK Manbaul Ulum:
  // Senin: XI (Jam 1-2), X (Jam 3-4)
  // Selasa: XII (Jam 1-2), XI (Jam 3-4)
  // Rabu: XI (Jam 1-2), XII (Jam 3-4)
  // Sabtu: XII (Jam 1-2), X (Jam 3-4)
  if (tjktPeriods.length === 0 && normClass !== 'Semua') {
    const classScheduleMapping: Record<string, Record<string, { period: number; time: string }[]>> = {
      'Senin': {
        'XI': [{ period: 1, time: '07.30 - 08.30' }, { period: 2, time: '08.30 - 09.30' }],
        'X':  [{ period: 3, time: '10.00 - 11.00' }, { period: 4, time: '11.00 - 12.00' }]
      },
      'Selasa': {
        'XII': [{ period: 1, time: '07.30 - 08.30' }, { period: 2, time: '08.30 - 09.30' }],
        'XI':  [{ period: 3, time: '10.00 - 11.00' }, { period: 4, time: '11.00 - 12.00' }]
      },
      'Rabu': {
        'XI':  [{ period: 1, time: '07.30 - 08.30' }, { period: 2, time: '08.30 - 09.30' }],
        'XII': [{ period: 3, time: '10.00 - 11.00' }, { period: 4, time: '11.00 - 12.00' }]
      },
      'Sabtu': {
        'XII': [{ period: 1, time: '07.30 - 08.30' }, { period: 2, time: '08.30 - 09.30' }],
        'X':   [{ period: 3, time: '10.00 - 11.00' }, { period: 4, time: '11.00 - 12.00' }]
      }
    };

    const slots = classScheduleMapping[normDay]?.[normClass] || [];
    slots.forEach(slot => {
      tjktPeriods.push({
        period: slot.period,
        time: slot.time,
        subjectCode: 'TJKT',
        teacherCode: 1
      });
    });
  }

  const totalJp = tjktPeriods.length;
  const hasTjkt = totalJp > 0;

  let timeRange = '-';
  if (hasTjkt) {
    const firstTime = tjktPeriods[0].time.split('-')[0]?.trim() || '';
    const lastTime = tjktPeriods[tjktPeriods.length - 1].time.split('-')[1]?.trim() || '';
    timeRange = firstTime && lastTime ? `${firstTime} - ${lastTime}` : tjktPeriods[0].time;
  }

  return {
    dayName: normDay,
    hasTjkt,
    totalJp,
    timeRange,
    periods: tjktPeriods
  };
};

/**
 * Memeriksa apakah guru pengajar mengajar TJKT pada hari tertentu
 */
export const getTeacherTjktScheduleOnDay = (
  schedule: Schedule,
  teacherId: number,
  dayName: string
): TjktClassDaySchedule => {
  const normDay = normalizeDayName(dayName);
  const dayPeriods = schedule?.[normDay] || schedule?.[dayName] || [];
  const tjktPeriods: {
    period: number | string;
    time: string;
    subjectCode: string;
    teacherCode: number | null;
  }[] = [];

  dayPeriods.forEach(p => {
    const teaches = Object.entries(p.classes || {}).some(([_, entry]) => 
      (entry.teacherCode === teacherId || teacherId === 1) && isTjktSubjectEntry(entry)
    );
    if (teaches) {
      tjktPeriods.push({
        period: p.period,
        time: p.time,
        subjectCode: 'TJKT',
        teacherCode: teacherId
      });
    }
  });

  // Fallback untuk hari aktif TJKT (Senin, Selasa, Rabu, Sabtu) untuk guru kejuruan TJKT (teacherId 1)
  if (tjktPeriods.length === 0 && teacherId === 1 && ['Senin', 'Selasa', 'Rabu', 'Sabtu'].includes(normDay)) {
    tjktPeriods.push({ period: 1, time: '07.30 - 08.30', subjectCode: 'TJKT', teacherCode: 1 });
    tjktPeriods.push({ period: 2, time: '08.30 - 09.30', subjectCode: 'TJKT', teacherCode: 1 });
    tjktPeriods.push({ period: 3, time: '10.00 - 11.00', subjectCode: 'TJKT', teacherCode: 1 });
    tjktPeriods.push({ period: 4, time: '11.00 - 12.00', subjectCode: 'TJKT', teacherCode: 1 });
  }

  const totalJp = tjktPeriods.length;
  const hasTjkt = totalJp > 0;

  let timeRange = '-';
  if (hasTjkt) {
    const firstTime = tjktPeriods[0].time.split('-')[0]?.trim() || '';
    const lastTime = tjktPeriods[tjktPeriods.length - 1].time.split('-')[1]?.trim() || '';
    timeRange = firstTime && lastTime ? `${firstTime} - ${lastTime}` : tjktPeriods[0].time;
  }

  return {
    dayName: normDay,
    hasTjkt,
    totalJp,
    timeRange,
    periods: tjktPeriods
  };
};

/**
 * Memeriksa apakah suatu tanggal memiliki jadwal pelajaran TJKT untuk kelas/peran terkait
 */
export const isDateTjktMeetingDay = (
  schedule: Schedule,
  classNameOrCategory: string,
  date: Date,
  isTeacher: boolean = false,
  teacherId: number = 1
): boolean => {
  const dayIndex = date.getDay();
  if (dayIndex === 0) return false; // Minggu selalu libur
  const rawDayName = INDONESIAN_DAY_NAMES[dayIndex];
  const dayName = normalizeDayName(rawDayName);

  if (isTeacher) {
    const sch = getTeacherTjktScheduleOnDay(schedule, teacherId, dayName);
    return sch.hasTjkt;
  }

  const sch = getClassTjktScheduleOnDay(schedule, classNameOrCategory, dayName);
  return sch.hasTjkt;
};

/**
 * Filter daftar tanggal (mingguan/bulanan/semester) agar HANYA menyertakan tanggal
 * yang memiliki jam mata pelajaran TJKT untuk kelas/peran tersebut.
 */
export const filterDatesByTjktSchedule = (
  schedule: Schedule,
  classNameOrCategory: string,
  dates: Date[],
  isTeacher: boolean = false,
  teacherId: number = 1
): Date[] => {
  return dates.filter(d => isDateTjktMeetingDay(schedule, classNameOrCategory, d, isTeacher, teacherId));
};

/**
 * Informasi ringkas jadwal TJKT mingguan untuk kelas
 */
export const getClassTjktWeeklySummary = (schedule: Schedule, className: string): {
  daysDescription: string;
  totalWeeklyJp: number;
  activeDays: string[];
} => {
  const workDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const activeDays: string[] = [];
  let totalWeeklyJp = 0;
  const details: string[] = [];

  workDays.forEach(day => {
    const info = getClassTjktScheduleOnDay(schedule, className, day);
    if (info.hasTjkt) {
      activeDays.push(day);
      totalWeeklyJp += info.totalJp;
      details.push(`${day} (${info.totalJp} JP: ${info.timeRange})`);
    }
  });

  const daysDescription = details.length > 0 
    ? details.join(', ')
    : 'Tidak ada jadwal TJKT yang terdaftar';

  return {
    daysDescription,
    totalWeeklyJp,
    activeDays
  };
};
