/**
 * ATURAN DAN KETENTUAN WAKTU ABSENSI DIGITAL RESMI
 * SMK MANBAUL ULUM - TJKT
 * 
 * DIANAMKAN DENGAN KETAT UNTUK MENJAGA KONSISTENSI INTEGRITAS DATA ABSENSI DIGITAL
 * 
 * 1. SESI JAM 1-2 (07:30 - 09:30 WIB):
 *    - Presensi Masuk Tepat Waktu : 07:00 - 07:30 WIB
 *    - Presensi Masuk Terlambat   : 07:30:01 - 08:00 WIB (Batas Maksimal Absensi Digital Masuk)
 *    - Di Atas 08:00 WIB          : ABSENSI DIGITAL DIKUNCI! Diarahkan ke Absensi Manual oleh Guru.
 *    - Presensi Keluar/Pulang     : Otomatis dibuka pukul 09:30 - 09:45 WIB.
 *    - Scan sebelum 09:30 WIB     : DITOLAK otomatis + Peringatan Suara Alarm/Vokal.
 * 
 * 2. SESI JAM 3-4 (10:00 - 12:00 WIB):
 *    - Presensi Masuk Dibuka      : Pukul 09:45 / 09:50 WIB
 *    - Presensi Masuk Tepat Waktu : 09:45 - 10:00 WIB
 *    - Presensi Masuk Terlambat   : 10:00:01 - 10:30 WIB (Batas Maksimal Absensi Digital Masuk)
 *    - Di Atas 10:30 WIB          : ABSENSI DIGITAL DIKUNCI! Diarahkan ke Absensi Manual oleh Guru.
 *    - Presensi Keluar/Pulang     : Otomatis dibuka pukul 12:00 WIB.
 *    - Scan sebelum 12:00 WIB     : DITOLAK otomatis + Peringatan Suara Alarm/Vokal.
 * 
 * 3. KETERANGAN KHUSUS:
 *    - Sakit, Izin, Alpha DILAKUKAN SECARA MANUAL OLEH GURU/ADMIN.
 *    - Seluruh absensi digital tersinkronisasi 100% dengan Jadwal Pelajaran TJKT per Kelas.
 */

export interface AttendanceTimeWindow {
  sessionKey: 'jam_1_2' | 'jam_3_4';
  label: string;
  scheduleRangeStr: string;
  checkInOpenMinutes: number;      // Menit dari 00:00 (misal 07:00 = 420)
  checkInOnTimeLimitMinutes: number; // Menit dari 00:00 (misal 07:30 = 450)
  checkInMaxLimitMinutes: number;    // Menit dari 00:00 (misal 08:00 = 480)
  checkOutOpenMinutes: number;     // Menit dari 00:00 (misal 09:30 = 570)
  checkOutMaxMinutes: number;      // Menit dari 00:00 (misal 09:59 = 599)
}

export const OFFICIAL_ATTENDANCE_TIME_RULES = {
  SESSION_1: {
    sessionKey: 'jam_1_2' as const,
    label: 'Sesi Jam 1-2 (07:30 - 09:30 WIB)',
    scheduleRangeStr: '07:30 - 09:30 WIB',
    checkInOpenMinutes: 7 * 60 + 0,       // 07:00 WIB = 420 menit
    checkInOnTimeLimitMinutes: 7 * 60 + 30,// 07:30 WIB = 450 menit
    checkInMaxLimitMinutes: 8 * 60 + 0,   // 08:00 WIB = 480 menit
    checkOutOpenMinutes: 9 * 60 + 30,     // 09:30 WIB = 570 menit
    checkOutMaxMinutes: 9 * 60 + 45,      // 09:45 WIB = 585 menit
    descriptions: {
      onTime: '07:00 - 07:30 WIB (Tepat Waktu)',
      late: '07:31 - 08:00 WIB (Terlambat - Batas Maksimal Digital)',
      locked: 'Lewat 08:00 WIB (Absensi Digital Dikunci - Wajib Manual oleh Guru)',
      checkOutWindow: '09:30 - 09:45 WIB (Absensi Keluar/Pulang Sesi 1-2)'
    }
  },
  SESSION_2: {
    sessionKey: 'jam_3_4' as const,
    label: 'Sesi Jam 3-4 (10:00 - 12:00 WIB)',
    scheduleRangeStr: '10:00 - 12:00 WIB',
    checkInOpenMinutes: 9 * 60 + 45,       // 09:45 WIB = 585 menit
    checkInOnTimeLimitMinutes: 10 * 60 + 0, // 10:00 WIB = 600 menit
    checkInMaxLimitMinutes: 10 * 60 + 30,  // 10:30 WIB = 630 menit
    checkOutOpenMinutes: 12 * 60 + 0,      // 12:00 WIB = 720 menit
    checkOutMaxMinutes: 12 * 60 + 30,      // 12:30 WIB = 750 menit
    descriptions: {
      onTime: '09:45 - 10:00 WIB (Tepat Waktu)',
      late: '10:01 - 10:30 WIB (Terlambat - Batas Maksimal Digital)',
      locked: 'Lewat 10:30 WIB (Absensi Digital Dikunci - Wajib Manual oleh Guru)',
      checkOutWindow: '12:00 - 12:30 WIB (Absensi Keluar/Pulang)'
    }
  }
};

/**
 * Helper ringkas konversi Jam:Menit ke Total Menit
 */
export const timeToMinutes = (hour: number, minute: number): number => {
  return hour * 60 + minute;
};

/**
 * Helper format total menit ke string HH:MM WIB
 */
export const minutesToTimeString = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const padH = String(h).padStart(2, '0');
  const padM = String(m).padStart(2, '0');
  return `${padH}:${padM} WIB`;
};
