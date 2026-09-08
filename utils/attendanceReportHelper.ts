import { Student, Teacher, AttendanceLog, AttendanceRecord, AttendanceStatus, School, Schedule } from '../types';
import { isDateTjktMeetingDay } from './tjktScheduleHelper';

export interface DayAttendanceDetail {
  date: Date;
  dateKey: string;
  dayName: string;
  formattedDate: string;
  status: Exclude<AttendanceStatus, '-'> | 'Belum Absen' | 'Libur' | 'Tidak Ada Jadwal';
  checkInTime: string;
  checkOutTime: string;
  isLate: boolean;
  latenessMinutes: number;
  method: string;
  note: string;
  hasSchedule?: boolean;
}

export interface PersonAttendanceRecap {
  person: Student | Teacher;
  isStudent: boolean;
  id: string | number;
  nisOrNip: string;
  name: string;
  classNameOrRole: string;
  days: DayAttendanceDetail[];
  summary: {
    totalHariEfektif: number;
    masuk: number; // Hadir Total (Tepat Waktu + Terlambat)
    tepatWaktu: number;
    terlambat: number; // Warna Kuning
    tidakMasuk: number; // Sakit + Izin + Alpha
    sakit: number;
    izin: number;
    alpha: number; // Tanpa Keterangan (Warna Merah)
    persentaseKehadiran: number;
  };
  formattedTextRecap: string;
}

// Convert Date to Local YYYY-MM-DD (WIB aligned)
export const toDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INDONESIAN_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Mendapatkan daftar tanggal dalam 1 minggu (Senin - Sabtu)
 */
export const getWeekDays = (referenceDate: Date): Date[] => {
  const curr = new Date(referenceDate);
  const day = curr.getDay(); // 0 = Minggu, 1 = Senin, ...
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Penyesuaian ke hari Senin
  
  const monday = new Date(curr.setDate(diff));
  const weekDays: Date[] = [];
  
  // Ambil 6 hari kerja sekolah: Senin s/d Sabtu
  for (let i = 0; i < 6; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    weekDays.push(nextDay);
  }
  return weekDays;
};

/**
 * Mendapatkan daftar tanggal dalam 1 bulan penuh (Senin - Sabtu)
 */
export const getMonthDays = (year: number, month: number, includeSundays: boolean = false): Date[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (includeSundays || date.getDay() !== 0) { // Lewati hari Minggu secara default untuk sekolah
      days.push(date);
    }
  }
  return days;
};

/**
 * Mendapatkan tanggal dalam 1 Semester
 * Semester Ganjil: 20 Agustus - 31 Desember (Khusus 2026 TA 2026/2027)
 * Semester Genap: 1 Januari - 30 Juni
 */
export const getSemesterDays = (academicYearStart: number, semester: 'ganjil' | 'genap'): Date[] => {
  const days: Date[] = [];
  const startMonth = semester === 'ganjil' ? 6 : 0; // 6 = Juli, 0 = Januari
  const endMonth = semester === 'ganjil' ? 11 : 5;   // 11 = Desember, 5 = Juni
  const year = semester === 'ganjil' ? academicYearStart : academicYearStart + 1;

  for (let m = startMonth; m <= endMonth; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      // Untuk TA 2026 Semester 1 Ganjil, sekolah/semester dimulai tanggal 20 Agustus 2026
      if (academicYearStart === 2026 && semester === 'ganjil') {
        if (m < 7) continue; // Skip Juli
        if (m === 7 && d < 20) continue; // Skip 1 - 19 Agustus
      }
      if (date.getDay() !== 0) { // Lewati Hari Minggu
        days.push(date);
      }
    }
  }
  return days;
};

/**
 * Evaluasi status absensi individual untuk satu tanggal
 */
export const evaluateDayAttendance = (
  person: Student | Teacher,
  date: Date,
  log: AttendanceLog
): DayAttendanceDetail => {
  const dateKey = toDateKey(date);
  const dayIndex = date.getDay();
  const dayName = INDONESIAN_DAY_NAMES[dayIndex];
  const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

  const record: AttendanceRecord | undefined = log[dateKey]?.[person.id] || log[dateKey]?.[String(person.id)];

  if (!record) {
    return {
      date,
      dateKey,
      dayName,
      formattedDate,
      status: 'Belum Absen',
      checkInTime: '-',
      checkOutTime: '-',
      isLate: false,
      latenessMinutes: 0,
      method: '-',
      note: ''
    };
  }

  const rawStatus = typeof record === 'object' ? record.status : (record as any);
  const checkIn = record.checkInTime || record.timestamp || '-';
  const checkOut = record.checkOutTime || '-';
  const method = record.method || 'Digital Scan';
  const note = record.note || '';

  // Hitung keterlambatan otomatis berdasarkan jam masuk jika tidak eksplisit
  let isLate = !!record.isLate;
  let latenessMinutes = record.latenessMinutes || 0;

  if (rawStatus === 'Terlambat') {
    isLate = true;
  } else if (rawStatus === 'Hadir' && checkIn !== '-') {
    const timeClean = checkIn.replace(/[^\d:]/g, '');
    const [h, m] = timeClean.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      if (h > 7 || (h === 7 && m > 15)) {
        isLate = true;
        latenessMinutes = (h - 7) * 60 + (m - 15);
      }
    }
  }

  // Tentukan status definitif
  let finalStatus: Exclude<AttendanceStatus, '-'> = rawStatus;
  if (isLate && rawStatus === 'Hadir') {
    finalStatus = 'Terlambat';
  }

  return {
    date,
    dateKey,
    dayName,
    formattedDate,
    status: finalStatus,
    checkInTime: checkIn,
    checkOutTime: checkOut,
    isLate,
    latenessMinutes,
    method,
    note
  };
};

/**
 * Menghitung rekapitulasi data absensi per orang untuk daftar tanggal tertentu
 */
export const calculatePersonRecap = (
  person: Student | Teacher,
  dates: Date[],
  log: AttendanceLog,
  schedule?: Schedule
): PersonAttendanceRecap => {
  const isStudent = 'class' in person;
  const name = 'fullName' in person ? person.fullName : person.name;
  const nisOrNip = 'nis' in person ? person.nis : (person.nip || String(person.id));
  const classNameOrRole = isStudent ? `Kelas ${person.class}` : 'Guru Pengajar';

  const dayDetails: DayAttendanceDetail[] = dates.map(d => {
    if (schedule) {
      const scheduled = isDateTjktMeetingDay(
        schedule,
        isStudent ? person.class : classNameOrRole,
        d,
        !isStudent,
        typeof person.id === 'number' ? person.id : Number(person.id) || 1
      );
      if (!scheduled) {
        const dateKey = toDateKey(d);
        const dayIndex = d.getDay();
        const dayName = INDONESIAN_DAY_NAMES[dayIndex];
        const formattedDate = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        return {
          date: d,
          dateKey,
          dayName,
          formattedDate,
          status: 'Tidak Ada Jadwal',
          checkInTime: '-',
          checkOutTime: '-',
          isLate: false,
          latenessMinutes: 0,
          method: '-',
          note: '',
          hasSchedule: false
        };
      }
    }
    const evaluated = evaluateDayAttendance(person, d, log);
    return { ...evaluated, hasSchedule: true };
  });

  let masuk = 0;
  let tepatWaktu = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let alpha = 0;
  let totalHariEfektif = 0;

  dayDetails.forEach(d => {
    if (d.status === 'Tidak Ada Jadwal' || d.hasSchedule === false) {
      return;
    }

    totalHariEfektif++;

    switch (d.status) {
      case 'Hadir':
        masuk++;
        tepatWaktu++;
        break;
      case 'Terlambat':
        masuk++;
        terlambat++;
        break;
      case 'Sakit':
        sakit++;
        break;
      case 'Izin':
        izin++;
        break;
      case 'Alpha':
        alpha++;
        break;
      case 'Belum Absen':
        // Jika hari sudah lewat dan belum ada catatan di hari kerja
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkD = new Date(d.date);
        checkD.setHours(0, 0, 0, 0);
        
        // Aplikasi aktif dimulai dari hari Rabu, 09 September 2026
        const activeStart = new Date(2026, 8, 9);
        
        // Hanya hitung Alpha jika tanggal terjadi SETELAH/SAMA DENGAN 09 September 2026 dan sebelum hari ini
        if (checkD >= activeStart && checkD < today && d.date.getDay() !== 0) {
          alpha++;
        }
        break;
    }
  });

  const tidakMasuk = sakit + izin + alpha;
  const persentaseKehadiran = totalHariEfektif > 0 ? (masuk / totalHariEfektif) * 100 : 0;

  // Bangun format teks
  const textSegments = dayDetails.map(d => {
    let statusText = String(d.status).toUpperCase();
    if (d.status === 'Terlambat') {
      statusText = `TERLAMBAT (${d.checkInTime}${d.checkOutTime !== '-' ? ` - Pulang: ${d.checkOutTime}` : ''})`;
    } else if (d.status === 'Hadir') {
      statusText = `HADIR (${d.checkInTime}${d.checkOutTime !== '-' ? ` - Pulang: ${d.checkOutTime}` : ''})`;
    } else if (d.status === 'Belum Absen') {
      statusText = 'BELUM ABSEN';
    } else if (d.status === 'Tidak Ada Jadwal') {
      statusText = 'TIDAK ADA JADWAL';
    }
    return `${d.dayName.toUpperCase()} (${d.formattedDate}) - ${statusText}`;
  });

  const formattedTextRecap = `${name.toUpperCase()} : ${textSegments.join(' | ')}`;

  return {
    person,
    isStudent,
    id: person.id,
    nisOrNip,
    name,
    classNameOrRole,
    days: dayDetails,
    summary: {
      totalHariEfektif,
      masuk,
      tepatWaktu,
      terlambat,
      tidakMasuk,
      sakit,
      izin,
      alpha,
      persentaseKehadiran
    },
    formattedTextRecap
  };
};

/**
 * EXCEL EXPORTER DENGAN PEWARNAAN OTOMATIS:
 * - Terlambat: Warna Kuning (#FFFF00 / #FEF08A)
 * - Alpha / Tanpa Keterangan: Warna Merah (#FF4D4D)
 * - Bolos: Warna Merah (#F87171)
 * - Hadir: Warna Hijau (#D1FAE5)
 * - Sakit: Warna Kuning Muda (#FEF3C7)
 * - Izin: Warna Biru Muda (#DBEAFE)
 * - Total Rekapitulasi: Masuk, Tidak Masuk, Tanpa Keterangan, Terlambat, Tepat Waktu, Bolos
 */
export const exportAttendanceToColoredExcel = (params: {
  title: string;
  subtitle: string;
  periodLabel: string;
  classLabel: string;
  dates: Date[];
  recaps: PersonAttendanceRecap[];
  filename: string;
}) => {
  const { title, subtitle, periodLabel, classLabel, dates, recaps, filename } = params;

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" 
        xmlns:x="urn:schemas-microsoft-com:office:excel" 
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Rekap Absensi</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Calibri, Arial, sans-serif; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #999999; padding: 6px 8px; font-size: 11pt; text-align: center; vertical-align: middle; }
      
      .title-row { font-size: 14pt; font-weight: bold; text-align: left; border: none; }
      .meta-row { font-size: 11pt; font-weight: bold; text-align: left; border: none; }
      
      .th-header { background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; }
      .th-sub { background-color: #3B82F6; color: #FFFFFF; font-weight: bold; font-size: 10pt; }
      .th-recap { background-color: #0F172A; color: #FFFFFF; font-weight: bold; }
      
      /* Pewarnaan Status Sesuai Ketentuan */
      .cell-late { background-color: #FEF9C3 !important; color: #854D0E !important; font-weight: bold; } /* TERLAMBAT */
      .cell-sakit { background-color: #FEF08A !important; color: #854D0E !important; font-weight: bold; } /* SAKIT = KUNING */
      .cell-izin { background-color: #F59E0B !important; color: #FFFFFF !important; font-weight: bold; } /* IZIN = KUNING KE-ORANYEAN */
      .cell-alpha { background-color: #DC2626 !important; color: #FFFFFF !important; font-weight: bold; } /* ALPHA = MERAH */
      
      .cell-hadir { background-color: #DCFCE7 !important; color: #166534 !important; font-weight: bold; } /* HADIR = HIJAU */
      .cell-empty { background-color: #F8FAFC !important; color: #94A3B8; }
      
      .col-recap-late { background-color: #FEF9C3; font-weight: bold; color: #854D0E; }
      .col-recap-sakit { background-color: #FEF08A; font-weight: bold; color: #854D0E; }
      .col-recap-izin { background-color: #FBBF24; font-weight: bold; color: #78350F; }
      .col-recap-alpha { background-color: #FCA5A5; font-weight: bold; color: #991B1B; }
      .col-recap-hadir { background-color: #BBF7D0; font-weight: bold; color: #166534; }
      
      .text-left { text-align: left; }
    </style>
  </head>
  <body>
    <table>
      <tr>
        <td colspan="${3 + dates.length + 9}" class="title-row">${title}</td>
      </tr>
      <tr>
        <td colspan="${3 + dates.length + 9}" class="meta-row">${subtitle}</td>
      </tr>
      <tr>
        <td colspan="${3 + dates.length + 9}" class="meta-row">Periode: ${periodLabel} | Filter: ${classLabel}</td>
      </tr>

      <!-- Table Headers -->
      <tr>
        <th rowspan="2" class="th-header" style="width: 40px;">No</th>
        <th rowspan="2" class="th-header" style="width: 240px; text-align: left;">Nama Lengkap</th>
        <th rowspan="2" class="th-header" style="width: 120px;">Kelas / Peran</th>

        <!-- Kolom Hari & Tanggal -->
        <th colspan="${dates.length}" class="th-header" style="background-color: #2563EB;">Daftar Kehadiran Harian Siswa & Guru (Jam Masuk - Jam Pulang)</th>

        <!-- Kolom Total Rekapitulasi -->
        <th colspan="9" class="th-recap">TOTAL REKAPITULASI KEHADIRAN SISWA & GURU</th>
      </tr>

      <tr>
        ${dates.map(d => {
          const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
          const dayNum = d.getDate().toString().padStart(2, '0');
          const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
          const dateStr = `${dayNum}/${monthNum}/${d.getFullYear()}`;
          return `<th class="th-sub" style="min-width: 85px; mso-number-format:'\\@';">${dayName}<br/><span style="font-size: 8.5pt; font-weight: normal; mso-number-format:'\\@';">${dateStr}</span></th>`;
        }).join('')}

        <!-- Sub-headers Rekap Total Kehadiran Wajib -->
        <th class="th-recap" style="font-size: 10pt; min-width: 60px;">Total Hari</th>
        <th class="th-recap" style="background-color: #059669; font-size: 10pt; min-width: 65px;">Total Masuk</th>
        <th class="th-recap" style="background-color: #10B981; font-size: 10pt; min-width: 65px;">Tepat Waktu</th>
        <th class="th-recap" style="background-color: #EAB308; color: #000; font-size: 10pt; min-width: 65px;">Terlambat</th>
        <th class="th-recap" style="background-color: #475569; font-size: 10pt; min-width: 65px;">Tidak Masuk</th>
        <th class="th-recap" style="background-color: #D97706; font-size: 10pt; min-width: 50px;">Sakit</th>
        <th class="th-recap" style="background-color: #2563EB; font-size: 10pt; min-width: 50px;">Izin</th>
        <th class="th-recap" style="background-color: #DC2626; font-size: 10pt; min-width: 65px;">Tanpa Keterangan</th>
        <th class="th-recap" style="background-color: #1E293B; font-size: 10pt; min-width: 75px;">% Hadir</th>
      </tr>

      <!-- Table Body -->
      ${recaps.map((r, idx) => {
        return `
          <tr>
            <td>${idx + 1}</td>
            <td class="text-left" style="font-weight: bold;">${r.name}</td>
            <td>${r.classNameOrRole}</td>

            <!-- Data Hari Per Hari Siswa -->
            ${r.days.map(day => {
              let cellClass = 'cell-empty';
              let textDisplay = '-';

              if (day.status === 'Hadir') {
                cellClass = 'cell-hadir';
                textDisplay = `Hadir<br/><span style="font-size: 8.5pt; font-weight: normal;">${day.checkInTime}${day.checkOutTime !== '-' ? ` - ${day.checkOutTime}` : ''}</span>`;
              } else if (day.status === 'Terlambat') {
                cellClass = 'cell-late'; // WARNA KUNING
                textDisplay = `TERLAMBAT<br/><span style="font-size: 8.5pt; font-weight: normal;">${day.checkInTime} (+${day.latenessMinutes}m)${day.checkOutTime !== '-' ? `<br/>Plg: ${day.checkOutTime}` : ''}</span>`;
              } else if (day.status === 'Sakit') {
                cellClass = 'cell-sakit';
                textDisplay = `SAKIT${day.note ? `<br/><span style="font-size: 8.5pt;">${day.note}</span>` : ''}`;
              } else if (day.status === 'Izin') {
                cellClass = 'cell-izin';
                textDisplay = `IZIN${day.note ? `<br/><span style="font-size: 8.5pt;">${day.note}</span>` : ''}`;
              } else if (day.status === 'Alpha') {
                cellClass = 'cell-alpha'; // WARNA MERAH
                textDisplay = `ALPHA<br/><span style="font-size: 8pt;">Tanpa Ket</span>`;
              } else {
                cellClass = 'cell-empty';
                textDisplay = `-`;
              }

              return `<td class="${cellClass}">${textDisplay}</td>`;
            }).join('')}

            <!-- Data Rekapitulasi Akumulasi Total -->
            <td style="font-weight: bold;">${r.summary.totalHariEfektif}</td>
            <td class="col-recap-hadir">${r.summary.masuk}</td>
            <td style="color: #059669; font-weight: bold;">${r.summary.tepatWaktu}</td>
            <td class="col-recap-late">${r.summary.terlambat}</td>
            <td style="color: #475569; font-weight: bold;">${r.summary.tidakMasuk}</td>
            <td style="color: #D97706; font-weight: bold;">${r.summary.sakit}</td>
            <td style="color: #2563EB; font-weight: bold;">${r.summary.izin}</td>
            <td class="col-recap-alpha">${r.summary.alpha}</td>
            <td style="font-weight: bold; background-color: #F1F5F9;">${r.summary.persentaseKehadiran.toFixed(1)}%</td>
          </tr>
        `;
      }).join('')}

      <!-- Total Rata-Rata Kelas -->
      <tr style="background-color: #E2E8F0; font-weight: bold;">
        <td colspan="3" style="text-align: right; font-size: 11pt; padding: 8px;">RATA-RATA / TOTAL KESELURUHAN:</td>
        ${dates.map(() => `<td>-</td>`).join('')}
        <td style="font-weight: bold;">${recaps.length > 0 ? (recaps.reduce((acc, c) => acc + c.summary.totalHariEfektif, 0) / recaps.length).toFixed(0) : 0}</td>
        <td style="background-color: #BBF7D0; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.masuk, 0)}</td>
        <td style="color: #059669; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.tepatWaktu, 0)}</td>
        <td style="background-color: #FEF08A; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.terlambat, 0)}</td>
        <td style="color: #475569; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.tidakMasuk, 0)}</td>
        <td style="color: #D97706; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.sakit, 0)}</td>
        <td style="color: #2563EB; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.izin, 0)}</td>
        <td style="background-color: #FCA5A5; font-weight: bold;">${recaps.reduce((acc, c) => acc + c.summary.alpha, 0)}</td>
        <td style="background-color: #CBD5E1; font-weight: bold;">
          ${recaps.length > 0 ? (recaps.reduce((acc, c) => acc + c.summary.persentaseKehadiran, 0) / recaps.length).toFixed(1) : 0}%
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

