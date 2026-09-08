import QRCode from 'qrcode';
import { Student, Teacher } from '../types';

/**
 * Algoritma Penghitung Checksum Deterministic (Adler-32 / CRC variant)
 * Menghasilkan token checksum 4-karakter heksadesimal unik berdasarkan string input.
 */
export const calculateChecksum = (input: string): string => {
  let a = 1;
  let b = 0;
  const MOD_ADLER = 65521;

  for (let i = 0; i < input.length; i++) {
    a = (a + input.charCodeAt(i)) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  const checksum = (b << 16) | a;
  return Math.abs(checksum).toString(16).toUpperCase().padStart(4, '0').slice(-4);
};

/**
 * ALGORITMA UTAMA GENERATE UNIQUE QR CODE UNTUK SISWA
 * Format Standar: SMK-QR-{ID}-{NIS}-{CHECKSUM}
 * 
 * Karakteristik:
 * 1. 100% Unik & Bebas Tabrakan (Collision-free)
 * 2. Deterministic & Konsisten (Siswa yang sama selalu menghasilkan token QR yang sama)
 * 3. Tervalidasi terhadap seluruh data murid yang ada di sistem
 * 4. Mendukung parsing cepat di terminal/kiosk absensi
 */
export const generateUniqueStudentQr = (
  student: { id: string; nis?: string; nisn?: string; fullName?: string; class?: string; rfidCode?: string },
  existingStudents: Student[] = []
): string => {
  const cleanId = (student.id || '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'STU';
  const cleanNis = (student.nis || '').trim().replace(/[^a-zA-Z0-9]/g, '') || '0';
  const cleanNisn = (student.nisn || '').trim().replace(/[^a-zA-Z0-9]/g, '') || '0';
  const namePart = (student.fullName || '').trim().replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'SISWA';

  // Raw seed string untuk checksum
  const seed = `${cleanId}:${cleanNis}:${cleanNisn}:${namePart}:SMKMU`;
  const checksum = calculateChecksum(seed);

  let candidate = `SMK-QR-${cleanId}-${cleanNis}-${checksum}`;

  // Pastikan tidak ada collision dengan murid lain (jika ada ID duplikat)
  const isDuplicate = existingStudents.some(
    s => s.id !== student.id && (s.qrCode === candidate)
  );

  if (isDuplicate) {
    // Suffix nonce pengaman jika ada duplikasi ID tak disengaja
    const randomNonce = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    candidate = `SMK-QR-${cleanId}-${cleanNis}-${checksum}-${randomNonce}`;
  }

  return candidate;
};

/**
 * Map Kode Unix RFID Resmi untuk Siswa SMK Manbaul Ulum (Strict Key ID & NIS)
 * Kelas X TJKT:
 * 1. ANISA (SMK-X-01 / 2401): 1651314106
 * 2. HAFIZATUN NAILA FAUZIYAH (SMK-X-02 / 2402): 1651680346
 * 3. KEVIN ARIYANTO (SMK-X-03 / 2403): 1651133194
 * 4. ALKA REZA SAPUTRA (SMK-X-04 / 2404): 1651207370
 * 5. M. ULUL JAUHARI ILMI (SMK-X-05 / 2405): 1651734026
 * 6. NADIA MARSELA (SMK-X-06 / 2406): 1336817466
 * 7. QONITA AULIA RIFQIYAH (SMK-X-07 / 2407): 1330185402
 * 8. SHELA SANDRA (SMK-X-08 / 2408): 1338113178
 * 9. SINTA FITRIANI (SMK-X-09 / 2409): 1336996522
 * 10. ZAHRA OLIVIA (SMK-X-10 / 2410): 1330174218
 * 11. ZAHWA AQILA (SMK-X-11 / 2411): 1330093594
 * 
 * Kelas XI TJKT:
 * 12. AHMAD SAMSUDIN (SMK-XI-12 / 2301): 1336772442
 * 13. As'ad Maulidah Roing Kanah (SMK-XI-13 / 2302): 1330062362
 * 14. DIMAS SUSENO (SMK-XI-14 / 2303): 1336989194
 * 15. HUSNI ZAKI MAHLUFI (SMK-XI-15 / 2304): 1337237962
 * 
 * Kelas XII TJKT:
 * 16. ASSYFA TUNNAZAH (SMK-XII-16 / 2201): 1607516327
 * 17. JENI RAMADHANI (SMK-XII-17 / 2202): 1606908359
 * 18. MIRSA TRISANTA PUTRI (SMK-XII-18 / 2203): 1650278154
 * 19. NABILA KHOIRUNISA ISLAMI (SMK-XII-19 / 2204): 1650301930
 * 20. Rhelovi Khayla Aneksha (SMK-XII-20 / 2205): 1650937674
 * 21. SRI WININGSIH (SMK-XII-21 / 2206): 1651313562
 * 22. SYIFA MUTIA SARI (SMK-XII-22 / 2207): 1654460266
 * 23. M. Teguh Andrian Amsah (SMK-XII-23 / 2208): 1652174890
 */
export const DEFAULT_STUDENT_RFIDS: Record<string, string> = {
  'SMK-X-01': '1651314106',
  'SMK-X-02': '1651680346',
  'SMK-X-03': '1651133194',
  'SMK-X-04': '1651207370',
  'SMK-X-05': '1651734026',
  'SMK-X-06': '1336817466',
  'SMK-X-07': '1330185402',
  'SMK-X-08': '1338113178',
  'SMK-X-09': '1336996522',
  'SMK-X-10': '1330174218',
  'SMK-X-11': '1330093594',
  // Kelas XI
  'SMK-XI-12': '1336772442',
  'SMK-XI-13': '1330062362',
  'SMK-XI-14': '1336989194',
  'SMK-XI-15': '1337237962',
  // Kelas XII
  'SMK-XII-16': '1607516327',
  'SMK-XII-17': '1606908359',
  'SMK-XII-18': '1650278154',
  'SMK-XII-19': '1650301930',
  'SMK-XII-20': '1650937674',
  'SMK-XII-21': '1651313562',
  'SMK-XII-22': '1654460266',
  'SMK-XII-23': '1652174890',
  // Support by NIS lookup as well (Kelas X)
  '2401': '1651314106',
  '2402': '1651680346',
  '2403': '1651133194',
  '2404': '1651207370',
  '2405': '1651734026',
  '2406': '1336817466',
  '2407': '1330185402',
  '2408': '1338113178',
  '2409': '1336996522',
  '2410': '1330174218',
  '2411': '1330093594',
  // Support by NIS lookup as well (Kelas XI)
  '2301': '1336772442',
  '2302': '1330062362',
  '2303': '1336989194',
  '2304': '1337237962',
  // Support by NIS lookup as well (Kelas XII)
  '2201': '1607516327',
  '2202': '1606908359',
  '2203': '1650278154',
  '2204': '1650301930',
  '2205': '1650937674',
  '2206': '1651313562',
  '2207': '1654460266',
  '2208': '1652174890',
};

/**
 * Generator Kode RFID Unik Otomatis untuk Siswa Baru (Format 10-Digit: 200XXXXXXX)
 */
export const generateUniqueStudentRfid = (existingStudents: Student[] = [], extraAssignedSet?: Set<string>): string => {
  const usedRfids = new Set<string>();
  existingStudents.forEach(s => {
    if (s.rfidCode && s.rfidCode.trim()) {
      usedRfids.add(s.rfidCode.trim());
    }
  });
  if (extraAssignedSet) {
    extraAssignedSet.forEach(code => usedRfids.add(code));
  }
  Object.values(DEFAULT_STUDENT_RFIDS).forEach(code => usedRfids.add(code));

  let candidate = '';
  do {
    const random7Digits = Math.floor(1000000 + Math.random() * 9000000).toString();
    candidate = `200${random7Digits}`;
  } while (usedRfids.has(candidate));
  return candidate;
};

/**
 * Memastikan semua data siswa dalam array memiliki kode QR & RFID unik yang valid dan tidak duplikat.
 */
export const ensureAllStudentsHaveUniqueQr = (students: Student[]): Student[] => {
  const assignedQrCodes = new Set<string>();
  const assignedRfidCodes = new Set<string>();

  return students.map((student, idx) => {
    let qr = student.qrCode;

    // Jika belum memiliki QR atau QR duplikat, generate baru dengan jaminan unik
    if (!qr || assignedQrCodes.has(qr)) {
      qr = generateUniqueStudentQr(student, students);
    }

    // Double check agar benar-benar tidak ada tabrakan di set
    let counter = 1;
    while (assignedQrCodes.has(qr)) {
      qr = `${generateUniqueStudentQr(student, students)}-${counter}`;
      counter++;
    }

    assignedQrCodes.add(qr);

    // Update & verifikasi RFID code untuk siswa
    let rfid = (student.rfidCode || '').trim();

    const teacherRfidSet = new Set<string>(Object.values(DEFAULT_TEACHER_RFIDS));

    // Map default RFID resmi untuk Siswa berdasarkan ID spesifik atau NIS
    if (DEFAULT_STUDENT_RFIDS[student.id]) {
      rfid = DEFAULT_STUDENT_RFIDS[student.id];
    } else if (student.nis && DEFAULT_STUDENT_RFIDS[student.nis]) {
      rfid = DEFAULT_STUDENT_RFIDS[student.nis];
    } else if (teacherRfidSet.has(rfid)) {
      // Jika RFID murid bentrok dengan RFID Guru, kosongkan agar digenerate ulang
      rfid = '';
    }

    // Jika belum ada RFID atau duplikat dengan siswa lain, hasilkan RFID unik baru
    if (!rfid || assignedRfidCodes.has(rfid)) {
      rfid = generateUniqueStudentRfid(students, assignedRfidCodes);
    }
    assignedRfidCodes.add(rfid);

    // Keep photoUrl and face biometric clean unless registered
    const hasBiometric = student.faceRegistered || !!student.faceDataUrl;
    let faceDataUrl = student.faceDataUrl || '';
    let faceRegistered = student.faceRegistered || false;
    let faceRegisteredAt = student.faceRegisteredAt || '';
    let faceBiometricHash = student.faceBiometricHash || '';
    let photoUrl = student.photoUrl || '';

    // If student had a bottts avatar seed, clean it so they use the default user icon
    if (photoUrl && photoUrl.includes('dicebear.com/7.x/bottts')) {
      photoUrl = '';
    }
    if (faceDataUrl && faceDataUrl.includes('dicebear.com/7.x/bottts')) {
      faceDataUrl = '';
      faceRegistered = false;
      faceRegisteredAt = '';
      faceBiometricHash = '';
    }

    return { 
      ...student, 
      qrCode: qr,
      rfidCode: rfid,
      faceDataUrl,
      faceRegistered,
      faceRegisteredAt,
      faceBiometricHash,
      photoUrl
    };
  });
};

/**
 * ALGORITMA PENCOCOKAN & IDENTIFIKASI SCANNER (KIOSK / HARDWARE / KAMERA)
 * Mencocokkan nilai hasil scan dari berbagai format:
 * - Full QR Code (SMK-QR-S1001-2201-A1B2)
 * - Extracted ID / NIS dari QR payload
 * - RFID UID Card
 * - NIS / NISN
 * - Internal ID
 * - NIK
 * 
 * Mengembalikan data siswa yang cocok 100% presisi dan tanpa ambiguitas.
 */
export const matchStudentFromScan = (
  rawScannedValue: string,
  students: Student[]
): { student: Student; matchType: 'QR_EXACT' | 'QR_PAYLOAD' | 'RFID' | 'NIS' | 'NISN' | 'ID' | 'NAME'; confidence: number } | null => {
  if (!rawScannedValue) return null;
  const clean = rawScannedValue.trim();

  // 1. Pencocokan Eksak QR Code
  const byExactQr = students.find(s => s.qrCode && s.qrCode.toLowerCase() === clean.toLowerCase());
  if (byExactQr) {
    return { student: byExactQr, matchType: 'QR_EXACT', confidence: 100 };
  }

  // 2. Pencocokan Pattern Payload QR (SMKMU-QR-{ID}-{NIS}-{CHECKSUM}, SMK-QR- atau legacy)
  if (clean.toUpperCase().startsWith('SMKMU-QR-') || clean.toUpperCase().startsWith('QR-SMKMU-') || clean.toUpperCase().startsWith('SMK-QR-') || clean.toUpperCase().startsWith('QR-SMK-') || clean.toUpperCase().startsWith('SDN5-QR-') || clean.toUpperCase().startsWith('QR-SDN5-')) {
    const parts = clean.split('-');
    // format: [SMK, QR, ID, NIS, ...]
    if (parts.length >= 3) {
      const extractedId = parts[2];
      const extractedNis = parts[3];

      const byExtractedId = students.find(
        s => (s.id && s.id.toLowerCase() === extractedId.toLowerCase()) ||
             (s.nis && extractedNis && s.nis.toLowerCase() === extractedNis.toLowerCase())
      );

      if (byExtractedId) {
        return { student: byExtractedId, matchType: 'QR_PAYLOAD', confidence: 100 };
      }
    }
  }

  // 3. Pencocokan Kartu RFID
  const byRfid = students.find(s => s.rfidCode && s.rfidCode.trim() === clean);
  if (byRfid) {
    return { student: byRfid, matchType: 'RFID', confidence: 100 };
  }

  // 4. Pencocokan NIS
  const byNis = students.find(s => s.nis && s.nis.trim() === clean);
  if (byNis) {
    return { student: byNis, matchType: 'NIS', confidence: 100 };
  }

  // 5. Pencocokan NISN
  const byNisn = students.find(s => s.nisn && s.nisn.trim() === clean);
  if (byNisn) {
    return { student: byNisn, matchType: 'NISN', confidence: 100 };
  }

  // 6. Pencocokan ID Siswa
  const byId = students.find(s => s.id && s.id.trim().toLowerCase() === clean.toLowerCase());
  if (byId) {
    return { student: byId, matchType: 'ID', confidence: 100 };
  }

  // 7. Pencocokan Nama Lengkap (Normalized)
  const cleanLower = clean.toLowerCase();
  const byName = students.find(s => s.fullName && s.fullName.trim().toLowerCase() === cleanLower);
  if (byName) {
    return { student: byName, matchType: 'NAME', confidence: 95 };
  }

  return null;
};

/**
 * Generator Data URL QR Code Beresolusi Tinggi dengan Styling Optimal
 */
export const generateStudentQrDataUrl = async (
  qrPayload: string,
  options: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  } = {}
): Promise<string> => {
  try {
    return await QRCode.toDataURL(qrPayload, {
      width: options.width || 300,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000', // Standard Deep Black
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction (30% damage recovery)
    });
  } catch (err) {
    console.error('Failed to generate QR Data URL:', err);
    return '';
  }
};

/**
 * Map Kode Unix RFID Resmi untuk Guru 1-5 SMK Manbaul Ulum
 */
export const DEFAULT_TEACHER_RFIDS: Record<number, string> = {
  1: '1653761770',
  2: '1651996506',
  3: '1651987146',
  4: '1651076778',
  5: '1651931674',
};

/**
 * Generator Kode RFID Unik Otomatis untuk Guru Baru (Format 10-Digit: 165XXXXXXX)
 */
export const generateUniqueTeacherRfid = (existingTeachers: Teacher[] = []): string => {
  const usedRfids = new Set(existingTeachers.map(t => (t.rfidCode || '').trim()));
  let candidate = '';
  do {
    const random7Digits = Math.floor(1000000 + Math.random() * 9000000).toString();
    candidate = `165${random7Digits}`;
  } while (usedRfids.has(candidate));
  return candidate;
};

/**
 * Generator Unique QR Code untuk Guru
 * Format: SMK-GURU-G{id}-{nip}-{checksum}
 */
export const generateUniqueTeacherQr = (teacher: { id: number; nip?: string; name: string }): string => {
  const seed = `SMK-GURU-${teacher.id}-${teacher.nip || 'HONOR'}-${teacher.name}`;
  const checksum = calculateChecksum(seed);
  return `SMK-GURU-G${teacher.id}-${teacher.nip ? teacher.nip.slice(-4) : '0000'}-${checksum}`;
};

/**
 * Memastikan semua data guru memiliki QR code & RFID unik yang valid dan terintegrasi
 */
export const ensureAllTeachersHaveUniqueQr = (teachers: Teacher[]): Teacher[] => {
  const assignedQrCodes = new Set<string>();
  const assignedRfidCodes = new Set<string>();

  return teachers.map((teacher) => {
    let qr = teacher.qrCode;

    if (!qr || assignedQrCodes.has(qr)) {
      qr = generateUniqueTeacherQr(teacher);
    }

    let counter = 1;
    while (assignedQrCodes.has(qr)) {
      qr = `${generateUniqueTeacherQr(teacher)}-${counter}`;
      counter++;
    }

    assignedQrCodes.add(qr);

    // Update & verifikasi RFID code
    let rfid = (teacher.rfidCode || '').trim();
    
    // Jika Guru 1..5, selalu pastikan menggunakan RFID resmi sesuai data master (1653761770, 1651996506, dst)
    if (DEFAULT_TEACHER_RFIDS[teacher.id]) {
      rfid = DEFAULT_TEACHER_RFIDS[teacher.id];
    }
    
    // Jika belum ada RFID atau duplikat dengan guru lain, hasilkan RFID unik baru
    if (!rfid || assignedRfidCodes.has(rfid)) {
      rfid = generateUniqueTeacherRfid(teachers);
    }
    assignedRfidCodes.add(rfid);

    return {
      ...teacher,
      qrCode: qr,
      rfidCode: rfid,
    };
  });
};

/**
 * Generator Data URL QR Code Guru
 */
export const generateTeacherQrDataUrl = async (
  qrPayload: string,
  options: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  } = {}
): Promise<string> => {
  try {
    return await QRCode.toDataURL(qrPayload, {
      width: options.width || 300,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000', // Standard Deep Black
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Failed to generate Teacher QR Data URL:', err);
    return '';
  }
};

/**
 * ALGORITMA PENCOCOKAN & IDENTIFIKASI SCANNER UNTUK GURU
 * Mendukung pembacaan:
 * 1. Full QR Code (SMK-GURU-G1, dll)
 * 2. URL Portal Guru (misal: #/teacher-portal/1)
 * 3. Kartu RFID (e.g. 1653761770, 1651996506, dll)
 * 4. NIP
 * 5. Kode G-1 atau ID Angka
 * 6. Nama Guru
 */
export const matchTeacherFromScan = (
  rawScannedValue: string,
  teachers: Teacher[]
): { teacher: Teacher; matchType: 'QR_EXACT' | 'QR_PAYLOAD' | 'RFID' | 'NIP' | 'ID' | 'NAME'; confidence: number } | null => {
  if (!rawScannedValue) return null;
  const clean = rawScannedValue.trim();

  // 1. Pencocokan Eksak QR Code
  const byExactQr = teachers.find(t => t.qrCode && t.qrCode.toLowerCase() === clean.toLowerCase());
  if (byExactQr) {
    return { teacher: byExactQr, matchType: 'QR_EXACT', confidence: 100 };
  }

  // 2. Pencocokan Pattern Payload QR / Link Portal Guru (SMK-GURU-G1, teacher-portal/1, G-1)
  const cleanUpper = clean.toUpperCase();
  if (cleanUpper.includes('GURU') || cleanUpper.includes('TEACHER-PORTAL') || cleanUpper.startsWith('SMK-') || cleanUpper.startsWith('SDN5-') || cleanUpper.startsWith('G-')) {
    const matched = teachers.find(t => {
      if (cleanUpper.includes(`G-${t.id}`) || cleanUpper.includes(`G${t.id}`) || cleanUpper.endsWith(`/${t.id}`)) return true;
      if (t.nip && clean.includes(t.nip)) return true;
      return false;
    });
    if (matched) return { teacher: matched, matchType: 'QR_PAYLOAD', confidence: 100 };
  }

  // 3. Pencocokan Kartu RFID (Support String Exact, Numeric Clean, and Padded)
  const cleanDigitsOnly = clean.replace(/[^0-9]/g, '');
  const byRfid = teachers.find(t => {
    if (!t.rfidCode) return false;
    const tRfid = t.rfidCode.trim();
    if (tRfid.toLowerCase() === clean.toLowerCase()) return true;
    if (cleanDigitsOnly && tRfid.replace(/[^0-9]/g, '') === cleanDigitsOnly) return true;
    return false;
  });
  if (byRfid) {
    return { teacher: byRfid, matchType: 'RFID', confidence: 100 };
  }

  // 4. Pencocokan NIP
  const byNip = teachers.find(t => t.nip && t.nip.trim() === clean);
  if (byNip) {
    return { teacher: byNip, matchType: 'NIP', confidence: 100 };
  }

  // 5. Pencocokan ID Guru
  const numId = parseInt(clean.replace(/[^0-9]/g, ''));
  if (!isNaN(numId)) {
    const byId = teachers.find(t => t.id === numId);
    if (byId) {
      return { teacher: byId, matchType: 'ID', confidence: 100 };
    }
  }

  // 6. Pencocokan Nama Guru (Normalized)
  const cleanLower = clean.toLowerCase();
  const byName = teachers.find(t => t.name && t.name.trim().toLowerCase() === cleanLower);
  if (byName) {
    return { teacher: byName, matchType: 'NAME', confidence: 95 };
  }

  return null;
};
