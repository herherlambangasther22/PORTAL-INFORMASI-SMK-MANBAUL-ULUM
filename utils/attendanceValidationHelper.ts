import { Student, Schedule } from '../types';
import { getClassTjktScheduleOnDay, INDONESIAN_DAY_NAMES } from './tjktScheduleHelper';
import { OFFICIAL_ATTENDANCE_TIME_RULES } from '../constants/attendanceTimeRules';

export interface AttendanceValidationResult {
  canAttend: boolean;
  action?: 'masuk' | 'keluar';
  sessionName: 'jam_1_2' | 'jam_3_4' | 'none';
  sessionLabel: string;
  isLate?: boolean;
  latenessMinutes?: number;
  rejectionTitle?: string;
  rejectionReason?: string;
  warningNote?: string;
}

/**
 * Mendapatkan informasi sesi jadwal TJKT siswa pada hari tertentu
 * - Sesi Jam 1-2: 07.30 - 09.30 WIB
 * - Sesi Jam 3-4: 10.00 - 12.00 WIB
 */
export const getStudentTjktSessionForToday = (
  student: Student,
  date: Date,
  schedule: Schedule
): {
  hasClassToday: boolean;
  session: 'jam_1_2' | 'jam_3_4' | 'none';
  sessionLabel: string;
  timeRange: string;
  totalJp: number;
  reason?: string;
} => {
  const dayIndex = date.getDay();
  if (dayIndex === 0) {
    return {
      hasClassToday: false,
      session: 'none',
      sessionLabel: 'Hari Libur',
      timeRange: '-',
      totalJp: 0,
      reason: 'Hari Minggu Libur (Tidak Ada Kegiatan Pembelajaran)'
    };
  }

  const dayName = INDONESIAN_DAY_NAMES[dayIndex];
  const className = student.class || 'X';
  const info = getClassTjktScheduleOnDay(schedule, className, dayName);

  if (!info.hasTjkt || info.totalJp === 0) {
    return {
      hasClassToday: false,
      session: 'none',
      sessionLabel: 'Tidak Ada Jadwal TJKT',
      timeRange: '-',
      totalJp: 0,
      reason: `Tidak ada jadwal pelajaran TJKT hari ini (${dayName}) untuk Kelas ${className}`
    };
  }

  // Tentukan apakah sesi Jam 1-2 atau Jam 3-4 berdasarkan period dan range waktu
  const hasPeriod1or2 = info.periods.some(p => p.period === 1 || p.period === 2 || String(p.period) === '1' || String(p.period) === '2') ||
    info.timeRange.includes('07.30') || info.timeRange.includes('08.30');

  const hasPeriod3or4 = info.periods.some(p => p.period === 3 || p.period === 4 || String(p.period) === '3' || String(p.period) === '4') ||
    info.timeRange.includes('10.00') || info.timeRange.includes('11.00');

  if (hasPeriod1or2 && !hasPeriod3or4) {
    return {
      hasClassToday: true,
      session: 'jam_1_2',
      sessionLabel: 'Sesi Jam 1-2 (07:30 - 09:30 WIB)',
      timeRange: '07.30 - 09.30',
      totalJp: info.totalJp
    };
  }

  if (hasPeriod3or4 && !hasPeriod1or2) {
    return {
      hasClassToday: true,
      session: 'jam_3_4',
      sessionLabel: 'Sesi Jam 3-4 (10:00 - 12:00 WIB)',
      timeRange: '10.00 - 12.00',
      totalJp: info.totalJp
    };
  }

  // Jika memiliki keduanya atau fallback jam sekarang
  const currentHour = date.getHours();
  if (currentHour < 10) {
    return {
      hasClassToday: true,
      session: 'jam_1_2',
      sessionLabel: 'Sesi Jam 1-2 (07:30 - 09:30 WIB)',
      timeRange: '07.30 - 09.30',
      totalJp: info.totalJp
    };
  }

  return {
    hasClassToday: true,
    session: 'jam_3_4',
    sessionLabel: 'Sesi Jam 3-4 (10:00 - 12:00 WIB)',
    timeRange: '10.00 - 12.00',
    totalJp: info.totalJp
  };
};

/**
 * Validasi Ketat Logika Absensi Digital Siswa (Masuk dan Keluar)
 * 
 * Aturan sesuai permintaan:
 * 1. Ada 2 kali absensi: Absensi Masuk dan Absensi Keluar.
 * 2. Untuk Sesi Jam 1-2:
 *    - Waktu masuk maksimal: Jam 08:00 WIB.
 *    - Waktu selesai: Jam 09:30 WIB.
 *    - Absensi jam keluar: Jam 09:30 WIB - Jam 09:59 WIB.
 *    - Kurang dari waktu itu (misal sebelum 09:30 WIB): PERINGATAN "TIDAK BISA MELAKUKAN ABSENSI".
 * 3. Untuk Sesi Jam 3-4 (Jam 10:00 - 12:00):
 *    - Jam masuk maksimal: 10:15 WIB.
 *    - Jam keluar: Jam 12:00 WIB.
 *    - Kurang dari waktu itu (sebelum jam 12:00 WIB): PERINGATAN "TIDAK BISA MELAKUKAN ABSENSI".
 */
export const validateStudentDigitalAttendance = (params: {
  student: Student;
  currentTime: Date;
  schedule: Schedule;
  existingRecord?: any;
  forcedMode?: 'auto' | 'masuk' | 'pulang';
}): AttendanceValidationResult => {
  const { student, currentTime, schedule, existingRecord, forcedMode = 'auto' } = params;

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // 1. Cek sesi kelas siswa hari ini
  const sessionInfo = getStudentTjktSessionForToday(student, currentTime, schedule);

  // Jika siswa tidak punya jadwal TJKT hari ini, tolak agar data rekap 100% akurat dan riil
  if (!sessionInfo.hasClassToday) {
    return {
      canAttend: false,
      sessionName: 'none',
      sessionLabel: sessionInfo.sessionLabel,
      rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
      rejectionReason: sessionInfo.reason || `Tidak ada jadwal pelajaran TJKT hari ini untuk Kelas ${student.class}.`
    };
  }

  const hasCheckIn = !!(existingRecord && (existingRecord.checkInTime || existingRecord.timestamp));
  const hasCheckOut = !!(existingRecord && existingRecord.checkOutTime);

  // Jika siswa sudah lengkap absen masuk DAN absen keluar hari ini
  if (hasCheckIn && hasCheckOut) {
    return {
      canAttend: false,
      sessionName: sessionInfo.session,
      sessionLabel: sessionInfo.sessionLabel,
      rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
      rejectionReason: `Presensi hari ini sudah lengkap (Masuk: ${existingRecord.checkInTime || existingRecord.timestamp}, Keluar: ${existingRecord.checkOutTime}).`
    };
  }

  // ==============================================================
  // KASUS 1: SESI JAM 1-2 (07:30 - 09:30 WIB)
  // ==============================================================
  if (sessionInfo.session === 'jam_1_2') {
    const rules = OFFICIAL_ATTENDANCE_TIME_RULES.SESSION_1;

    // A. JIKA SUDAH ABSEN MASUK -> CEK WAKTU ABSEN KELUAR (09:30 - 09:59 WIB)
    if (hasCheckIn || forcedMode === 'pulang') {
      if (!hasCheckIn && forcedMode === 'pulang') {
        return {
          canAttend: false,
          sessionName: 'jam_1_2',
          sessionLabel: sessionInfo.sessionLabel,
          rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
          rejectionReason: 'Siswa belum melakukan absensi masuk pada Sesi Jam 1-2.'
        };
      }

      // Jam keluar dibuka pukul 09:30 WIB (570 menit) s/d 09:59 WIB (599 menit)
      if (currentTotalMinutes < rules.checkOutOpenMinutes) {
        return {
          canAttend: false,
          sessionName: 'jam_1_2',
          sessionLabel: sessionInfo.sessionLabel,
          rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
          rejectionReason: 'Absensi belum dapat dilakukan sekarang, belum waktunya keluar cuy.'
        };
      }

      if (currentTotalMinutes >= rules.checkOutOpenMinutes && currentTotalMinutes <= rules.checkOutMaxMinutes) {
        return {
          canAttend: true,
          action: 'keluar',
          sessionName: 'jam_1_2',
          sessionLabel: sessionInfo.sessionLabel
        };
      }

      // Jika lewat jam 09:45 WIB
      return {
        canAttend: false,
        sessionName: 'jam_1_2',
        sessionLabel: sessionInfo.sessionLabel,
        rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
        rejectionReason: 'Waktu absensi jam keluar untuk Sesi Jam 1-2 (09:30 - 09:45 WIB) telah berakhir.'
      };
    }

    // B. JIKA BELUM ABSEN MASUK -> CEK WAKTU ABSEN MASUK (MAKSIMAL JAM 08:00 WIB)
    // Cek jika absen sebelum jam buka (07:00 WIB)
    if (currentTotalMinutes < rules.checkInOpenMinutes) {
      return {
        canAttend: false,
        sessionName: 'jam_1_2',
        sessionLabel: sessionInfo.sessionLabel,
        rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
        rejectionReason: 'Belum masuk cuy, coba lagi di jam 07:00.'
      };
    }

    // Batas masuk maksimal digital = 08:00 WIB (480 menit).
    if (currentTotalMinutes <= rules.checkInMaxLimitMinutes) {
      // Masuk sebelum atau tepat jam 07:30 WIB = Tepat Waktu
      // Masuk antara 07:31 - 08:00 WIB = Terlambat
      const isLate = currentTotalMinutes > rules.checkInOnTimeLimitMinutes; // 07:30 WIB
      const latenessMinutes = isLate ? (currentTotalMinutes - rules.checkInOnTimeLimitMinutes) : 0;

      return {
        canAttend: true,
        action: 'masuk',
        sessionName: 'jam_1_2',
        sessionLabel: sessionInfo.sessionLabel,
        isLate,
        latenessMinutes
      };
    }

    // Jika lewat jam 08:00 WIB (misal 08:01 - 09:29 WIB):
    if (currentTotalMinutes < rules.checkOutOpenMinutes) {
      return {
        canAttend: false,
        sessionName: 'jam_1_2',
        sessionLabel: sessionInfo.sessionLabel,
        rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
        rejectionReason: 'Absensi digital masuk dikunci (maksimal pukul 08:00 WIB). Silakan hubungi Guru Pengajar untuk presensi manual.'
      };
    }

    // Jika sudah lewat jam 09:30 dan belum pernah masuk:
    return {
      canAttend: false,
      sessionName: 'jam_1_2',
      sessionLabel: sessionInfo.sessionLabel,
      rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
      rejectionReason: 'Siswa belum pernah melakukan absensi masuk pada Sesi Jam 1-2. Presensi manual oleh Guru Pengajar.'
    };
  }

  // ==============================================================
  // KASUS 2: SESI JAM 3-4 ATAU 10:00 - 12:00 WIB
  // ==============================================================
  if (sessionInfo.session === 'jam_3_4') {
    const rules = OFFICIAL_ATTENDANCE_TIME_RULES.SESSION_2;

    // A. JIKA SUDAH ABSEN MASUK -> CEK WAKTU ABSEN KELUAR (MULAI JAM 12:00 WIB)
    if (hasCheckIn || forcedMode === 'pulang') {
      if (!hasCheckIn && forcedMode === 'pulang') {
        return {
          canAttend: false,
          sessionName: 'jam_3_4',
          sessionLabel: sessionInfo.sessionLabel,
          rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
          rejectionReason: 'Siswa belum melakukan absensi masuk pada Sesi Jam 3-4.'
        };
      }

      // Jam keluar adalah jam 12:00 WIB (720 menit).
      if (currentTotalMinutes < rules.checkOutOpenMinutes) {
        return {
          canAttend: false,
          sessionName: 'jam_3_4',
          sessionLabel: sessionInfo.sessionLabel,
          rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
          rejectionReason: 'Absensi belum dapat dilakukan sekarang, belum waktunya keluar cuy.'
        };
      }

      // Mulai jam 12:00 WIB s/d waktu kepulangan
      return {
        canAttend: true,
        action: 'keluar',
        sessionName: 'jam_3_4',
        sessionLabel: sessionInfo.sessionLabel
      };
    }

    // B. JIKA BELUM ABSEN MASUK -> CEK WAKTU ABSEN MASUK (09:45 - 10:30 WIB)
    // Sesi 3-4 dibuka mulai 09:45 WIB = 585 menit.
    if (currentTotalMinutes < rules.checkInOpenMinutes) {
      return {
        canAttend: false,
        sessionName: 'jam_3_4',
        sessionLabel: sessionInfo.sessionLabel,
        rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
        rejectionReason: 'Belum masuk cuy, coba lagi di jam 09:46.'
      };
    }

    // Jam masuk maksimal adalah 10:30 WIB (630 menit).
    if (currentTotalMinutes <= rules.checkInMaxLimitMinutes) {
      // Masuk sebelum atau tepat jam 10:00 WIB = Tepat Waktu
      // Masuk antara 10:01 - 10:30 WIB = Terlambat
      const isLate = currentTotalMinutes > rules.checkInOnTimeLimitMinutes; // 10:00 WIB
      const latenessMinutes = isLate ? (currentTotalMinutes - rules.checkInOnTimeLimitMinutes) : 0;

      return {
        canAttend: true,
        action: 'masuk',
        sessionName: 'jam_3_4',
        sessionLabel: sessionInfo.sessionLabel,
        isLate,
        latenessMinutes
      };
    }

    // Jika lewat jam 10:30 WIB dan belum jam 12:00 WIB:
    if (currentTotalMinutes < rules.checkOutOpenMinutes) {
      return {
        canAttend: false,
        sessionName: 'jam_3_4',
        sessionLabel: sessionInfo.sessionLabel,
        rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
        rejectionReason: 'Absensi digital masuk dikunci (maksimal pukul 10:30 WIB). Silakan hubungi Guru Pengajar untuk presensi manual.'
      };
    }

    // Jika sudah jam 12:00 dan belum pernah absen masuk:
    return {
      canAttend: false,
      sessionName: 'jam_3_4',
      sessionLabel: sessionInfo.sessionLabel,
      rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
      rejectionReason: 'Siswa belum pernah melakukan absensi masuk pada Sesi Jam 3-4. Presensi manual oleh Guru Pengajar.'
    };
  }

  return {
    canAttend: false,
    sessionName: 'none',
    sessionLabel: 'Di Luar Jadwal',
    rejectionTitle: 'TIDAK BISA MELAKUKAN ABSENSI',
    rejectionReason: 'Waktu presensi tidak sesuai dengan jadwal pelajaran aktif hari ini.'
  };
};
