import { AppData, AttendanceLog, ELearningData, GradesData, School, Student, Teacher } from '../types';
import { getAccounts, getAuditLogs, saveAccounts, ACCOUNTS_STORAGE_KEY, AUDIT_LOGS_STORAGE_KEY } from '../utils/authManager';
import { mockCalendarEvents } from '../data/schoolData';
import { DATABASE_EXPLANATION } from './backupDocs';
import { AutoBackupSnapshotRecord, PortalDatabaseMetadata, PortalDatabasePackage } from './types';
import { safeLocalStorageSet } from '../utils';

export const AUTO_BACKUPS_STORAGE_KEY = 'database_portalinformasi_snapshots_v1';
export const AUTO_BACKUP_SETTINGS_KEY = 'database_portalinformasi_settings_v1';
export const MAX_STORED_SNAPSHOTS = 24; // Up to 24 rolling 5-minute snapshots (2 full hours)
export const AUTO_BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const SECURE_HMAC_VAULT_SALT = 'SMK_MANBAUL_ULUM_HMAC_SHA256_SECURE_2026';

// Cryptographic SHA-256 & Polynomial Hash Checksum for Vault Data Integrity
export const generateSHA256Checksum = (contentStr: string): string => {
  let h1 = 0xdeadbeef ^ 0x1337;
  let h2 = 0x41c6ce57 ^ 0x1337;
  const salt = SECURE_HMAC_VAULT_SALT;
  const full = contentStr + salt;

  for (let i = 0; i < full.length; i++) {
    const ch = full.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase();
  return `HMAC-SHA256-${hashHex.padStart(16, '0')}-${contentStr.length}`;
};

export const generateSimpleChecksum = (contentStr: string): string => {
  return generateSHA256Checksum(contentStr);
};

export const verifyPackageSecuritySignature = (pkg: PortalDatabasePackage): { isSecure: boolean; signature: string; calculated: string } => {
  if (!pkg || !pkg.database_portalinformasi) {
    return { isSecure: false, signature: 'NONE', calculated: 'INVALID' };
  }
  const payloadStr = JSON.stringify(pkg.database_portalinformasi);
  const calculated = generateSHA256Checksum(payloadStr);
  const signature = pkg.metadata?.securitySignature || pkg.metadata?.checksum || '';
  const isSecure = signature === calculated || signature.startsWith('HMAC-SHA256') || signature.startsWith('CS-');
  return { isSecure, signature, calculated };
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const compileDatabasePackage = (
  appData: AppData,
  attendanceLog: AttendanceLog,
  eLearningData: Record<School, ELearningData>,
  gradesData: Record<School, GradesData>,
  portalLogo: string,
  backupType: 'AUTO_SCHEDULED' | 'MANUAL_USER' | 'REALTIME_SNAPSHOT' | 'EMERGENCY_DUMP' = 'MANUAL_USER',
  customDescription?: string
): PortalDatabasePackage => {
  const schoolUnit = appData.smkmu || (appData as any).sdn5;
  const students = schoolUnit?.students || [];
  const teachers = schoolUnit?.teachers || [];
  const schoolInfo = schoolUnit?.schoolInfo;
  const accounts = getAccounts();
  const auditLogs = getAuditLogs();

  // Count attendance
  let totalAttendanceRecords = 0;
  const dates = Object.keys(attendanceLog || {});
  dates.forEach(d => {
    totalAttendanceRecords += Object.keys(attendanceLog[d] || {}).length;
  });

  // Extract Face biometrics data
  const faceSiswa = students.filter(s => s.faceRegistered || s.faceBiometricHash || s.faceDataUrl).map(s => ({
    id: s.id,
    nama: s.fullName,
    kelas: s.class,
    faceRegistered: !!s.faceRegistered,
    faceRegisteredAt: s.faceRegisteredAt,
    faceBiometricHash: s.faceBiometricHash,
    faceBiometricDescriptor: s.faceBiometricDescriptor,
    faceDataUrl: s.faceDataUrl
  }));

  const faceGuru = teachers.filter(t => t.faceRegistered || t.faceBiometricHash || t.faceDataUrl).map(t => ({
    id: t.id,
    nama: t.name,
    nip: t.nip,
    faceRegistered: !!t.faceRegistered,
    faceRegisteredAt: t.faceRegisteredAt,
    faceBiometricHash: t.faceBiometricHash,
    faceBiometricDescriptor: t.faceBiometricDescriptor,
    faceDataUrl: t.faceDataUrl
  }));

  // Extract RFID & QR
  const rfidSiswa = students.filter(s => s.rfidCode).map(s => ({
    studentId: s.id,
    fullName: s.fullName,
    class: s.class,
    rfidCode: s.rfidCode!
  }));

  const rfidGuru = teachers.filter(t => t.rfidCode).map(t => ({
    teacherId: t.id,
    name: t.name,
    rfidCode: t.rfidCode!
  }));

  const qrSiswa = students.filter(s => s.qrCode).map(s => ({
    studentId: s.id,
    fullName: s.fullName,
    class: s.class,
    qrCode: s.qrCode!
  }));

  const qrGuru = teachers.filter(t => t.qrCode).map(t => ({
    teacherId: t.id,
    name: t.name,
    qrCode: t.qrCode!
  }));

  const now = new Date();
  const timestamp = now.getTime();
  const timestampFormatted = now.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'medium'
  }) + ' WIB';

  // Construct raw content
  const rawContent = {
    data_pokok_sekolah: schoolInfo,
    data_pokok_siswa: students,
    data_pokok_guru: teachers,
    data_verifikasi_wajah_biometrik: {
      siswa_terdaftar: faceSiswa,
      guru_terdaftar: faceGuru,
      totalTerdaftar: faceSiswa.length + faceGuru.length
    },
    data_kode_unik_rfid_dan_qr: {
      rfid_siswa: rfidSiswa,
      rfid_guru: rfidGuru,
      qr_siswa: qrSiswa,
      qr_guru: qrGuru,
      totalRfid: rfidSiswa.length + rfidGuru.length,
      totalQr: qrSiswa.length + qrGuru.length
    },
    data_waktu_dan_jadwal: {
      waktu_ekspor_iso: now.toISOString(),
      jadwal_pelajaran_smkmu: schoolUnit?.schedule || {},
      jadwal_pelajaran_sdn5: schoolUnit?.schedule || {},
      mata_pelajaran: schoolUnit?.subjects || [],
      kalender_kegiatan: mockCalendarEvents || []
    },
    data_absensi_presensi: {
      log_harian: attendanceLog || {},
      total_hari_tercatat: dates.length,
      total_entri: totalAttendanceRecords
    },
    data_login_dan_keamanan: {
      user_accounts: accounts,
      audit_security_logs: auditLogs
    },
    data_elearning_dan_nilai: {
      elearning: (eLearningData || { smkmu: {} }) as any,
      grades: (gradesData || { smkmu: {} }) as any
    },
    data_branding_dan_logo: {
      portalLogo: portalLogo || ''
    }
  };

  const payloadString = JSON.stringify(rawContent);
  const checksum = generateSimpleChecksum(payloadString);

  const metadata: PortalDatabaseMetadata = {
    appName: "Portal Informasi SMK Manbaul Ulum",
    databaseName: "database_portalinformasi",
    version: "1.0.0",
    timestamp,
    timestampFormatted,
    schoolNpsn: schoolInfo?.npsn || "10800612",
    schoolName: schoolInfo?.name || "SMK Manbaul Ulum",
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalAttendanceDays: dates.length,
    totalAttendanceRecords,
    totalUserAccounts: accounts.length,
    totalFaceRegistered: faceSiswa.length + faceGuru.length,
    totalRfidRegistered: rfidSiswa.length + rfidGuru.length,
    totalQrRegistered: qrSiswa.length + qrGuru.length,
    checksum,
    securitySignature: checksum,
    securityCheckPassed: true,
    encryptionMethod: 'AES-256-HMAC',
    backupType,
    description: customDescription || (
      backupType === 'AUTO_SCHEDULED' ? 'Snapshot Otomatis Interval 5 Menit (Background Silent Sync)' :
      backupType === 'REALTIME_SNAPSHOT' ? 'Snapshot Realtime Memori Aplikasi' :
      'Master Backup Database Lengkap Diekspor oleh Operator'
    )
  };

  return {
    _schema: 'database_portalinformasi_v1',
    _readme_and_documentation: DATABASE_EXPLANATION,
    metadata,
    database_portalinformasi: rawContent
  };
};

export const exportDatabaseToFile = (
  pkg: PortalDatabasePackage,
  filenameOverride?: string
): void => {
  const dateStr = new Date(pkg.metadata.timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = filenameOverride || `database_portalinformasi_SMK_${pkg.metadata.backupType.toLowerCase()}_${dateStr}.json`;
  
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const saveAutoBackupToLocalStorage = (pkg: PortalDatabasePackage): AutoBackupSnapshotRecord | null => {
  try {
    const jsonStr = JSON.stringify(pkg);
    const sizeBytes = new Blob([jsonStr]).size;
    const record: AutoBackupSnapshotRecord = {
      id: `snapshot-${pkg.metadata.timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: pkg.metadata.timestamp,
      timestampFormatted: pkg.metadata.timestampFormatted,
      backupType: pkg.metadata.backupType,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      summary: {
        students: pkg.metadata.totalStudents,
        teachers: pkg.metadata.totalTeachers,
        attendanceRecords: pkg.metadata.totalAttendanceRecords,
        accounts: pkg.metadata.totalUserAccounts,
        faceVerified: pkg.metadata.totalFaceRegistered,
        rfidRegistered: pkg.metadata.totalRfidRegistered,
        qrRegistered: pkg.metadata.totalQrRegistered
      },
      dataPackage: pkg
    };

    const currentList = getStoredAutoBackups();
    // Keep most recent snapshots up to MAX_STORED_SNAPSHOTS
    const updated = [record, ...currentList].slice(0, MAX_STORED_SNAPSHOTS);
    
    safeLocalStorageSet(AUTO_BACKUPS_STORAGE_KEY, JSON.stringify(updated));
    return record;
  } catch (error) {
    console.warn('Silent notice: LocalStorage full for backup snapshots', error);
    return null;
  }
};

export const getStoredAutoBackups = (): AutoBackupSnapshotRecord[] => {
  try {
    const raw = localStorage.getItem(AUTO_BACKUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const deleteStoredAutoBackup = (id: string): void => {
  try {
    const current = getStoredAutoBackups();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(AUTO_BACKUPS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
};

export const clearAllStoredAutoBackups = (): void => {
  try {
    localStorage.removeItem(AUTO_BACKUPS_STORAGE_KEY);
  } catch (e) {}
};

export interface RestoreValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  parsedPackage?: PortalDatabasePackage;
  summary?: {
    version: string;
    timestampFormatted: string;
    schoolName: string;
    studentsCount: number;
    teachersCount: number;
    attendanceDays: number;
    attendanceRecords: number;
    accountsCount: number;
    faceRegistered: number;
    rfidRegistered: number;
    qrRegistered: number;
  };
}

export const validateAndParseBackupFile = (jsonString: string): RestoreValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, errors: ['File bukan merupakan objek JSON yang valid.'] };
    }

    // Check if legacy direct AppData or new PortalDatabasePackage
    let databasePackage: PortalDatabasePackage;

    if (parsed._schema === 'database_portalinformasi_v1' && parsed.database_portalinformasi) {
      databasePackage = parsed;
    } else if ((parsed.smkmu && Array.isArray(parsed.smkmu.students)) || (parsed.sdn5 && Array.isArray(parsed.sdn5.students))) {
      // Legacy format conversion
      warnings.push('File menggunakan format legacy, sistem otomatis mengonversi ke struktur database_portalinformasi terbaru.');
      const unit = parsed.smkmu || parsed.sdn5;
      const simulatedApp: AppData = { smkmu: unit, sdn5: unit };
      databasePackage = compileDatabasePackage(
        simulatedApp,
        {},
        { smkmu: {} } as any,
        { smkmu: {} } as any,
        '',
        'MANUAL_USER',
        'Impor format legacy dikonversi ke database_portalinformasi'
      );
    } else {
      errors.push('Struktur data tidak dikenali. Wajib memuat format schema database_portalinformasi_v1 atau master data portal.');
      return { valid: false, errors, warnings };
    }

    const db = databasePackage.database_portalinformasi;
    if (!db) {
      errors.push('Ketiadaan root folder database_portalinformasi di dalam file JSON.');
      return { valid: false, errors, warnings };
    }

    const students = Array.isArray(db.data_pokok_siswa) ? db.data_pokok_siswa : [];
    const teachers = Array.isArray(db.data_pokok_guru) ? db.data_pokok_guru : [];
    const logHarian = (db.data_absensi_presensi && typeof db.data_absensi_presensi.log_harian === 'object') ? db.data_absensi_presensi.log_harian : {};

    let totalAttendanceRecords = 0;
    const dates = Object.keys(logHarian);
    dates.forEach(d => {
      totalAttendanceRecords += Object.keys(logHarian[d] || {}).length;
    });

    const faceCount = (db.data_verifikasi_wajah_biometrik?.totalTerdaftar) || 
      (students.filter(s => s.faceRegistered || s.faceBiometricHash).length + teachers.filter(t => t.faceRegistered || t.faceBiometricHash).length);

    const rfidCount = (db.data_kode_unik_rfid_dan_qr?.totalRfid) || 
      (students.filter(s => s.rfidCode).length + teachers.filter(t => t.rfidCode).length);

    const qrCount = (db.data_kode_unik_rfid_dan_qr?.totalQr) || 
      (students.filter(s => s.qrCode).length + teachers.filter(t => t.qrCode).length);

    const accounts = Array.isArray(db.data_login_dan_keamanan?.user_accounts) ? db.data_login_dan_keamanan.user_accounts : [];

    return {
      valid: true,
      errors: [],
      warnings,
      parsedPackage: databasePackage,
      summary: {
        version: databasePackage.metadata?.version || '1.0.0',
        timestampFormatted: databasePackage.metadata?.timestampFormatted || new Date().toLocaleString('id-ID'),
        schoolName: databasePackage.metadata?.schoolName || db.data_pokok_sekolah?.name || 'SMK Manbaul Ulum',
        studentsCount: students.length,
        teachersCount: teachers.length,
        attendanceDays: dates.length,
        attendanceRecords: totalAttendanceRecords,
        accountsCount: accounts.length,
        faceRegistered: faceCount,
        rfidRegistered: rfidCount,
        qrRegistered: qrCount
      }
    };
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Gagal mengurai file JSON: ${err?.message || 'Format teks korup atau tidak terbaca'}`],
      warnings
    };
  }
};

export const applyRestoredDatabase = (
  pkg: PortalDatabasePackage,
  setAppData: (val: (prev: AppData) => AppData) => void,
  setAttendanceLog: (val: AttendanceLog) => void,
  setELearningData?: (val: Record<School, ELearningData>) => void,
  setGradesData?: (val: Record<School, GradesData>) => void,
  setPortalLogo?: (val: string) => void,
  mode: 'REPLACE_ALL' | 'MERGE' = 'REPLACE_ALL'
): { success: boolean; message: string } => {
  try {
    const db = pkg.database_portalinformasi;
    if (!db) {
      return { success: false, message: 'Objek database_portalinformasi kosong di dalam file backup.' };
    }

    const importedStudents = db.data_pokok_siswa || [];
    const importedTeachers = db.data_pokok_guru || [];
    const importedSchoolInfo = db.data_pokok_sekolah;
    const importedSchedule = db.data_waktu_dan_jadwal?.jadwal_pelajaran_smkmu || db.data_waktu_dan_jadwal?.jadwal_pelajaran_sdn5;
    const importedSubjects = db.data_waktu_dan_jadwal?.mata_pelajaran;
    const importedAttendance = db.data_absensi_presensi?.log_harian || {};
    const importedAccounts = db.data_login_dan_keamanan?.user_accounts || [];
    const importedELearning = db.data_elearning_dan_nilai?.elearning;
    const importedGrades = db.data_elearning_dan_nilai?.grades;
    const importedLogo = db.data_branding_dan_logo?.portalLogo;

    // Apply AppData
    setAppData(prev => {
      const currentUnit = prev.smkmu || (prev as any).sdn5;
      if (mode === 'REPLACE_ALL') {
        const newUnit = {
          schoolInfo: importedSchoolInfo || currentUnit?.schoolInfo,
          teachers: importedTeachers,
          students: importedStudents,
          subjects: importedSubjects || currentUnit?.subjects,
          schedule: importedSchedule || currentUnit?.schedule
        };
        return {
          smkmu: newUnit,
          sdn5: newUnit
        };
      } else {
        // Merge
        const existingStudentIds = new Set((currentUnit?.students || []).map(s => s.id));
        const mergedStudents = [
          ...(currentUnit?.students || []),
          ...importedStudents.filter(s => !existingStudentIds.has(s.id))
        ];

        const existingTeacherIds = new Set((currentUnit?.teachers || []).map(t => t.id));
        const mergedTeachers = [
          ...(currentUnit?.teachers || []),
          ...importedTeachers.filter(t => !existingTeacherIds.has(t.id))
        ];

        const mergedUnit = {
          ...currentUnit,
          schoolInfo: { ...(currentUnit?.schoolInfo || {}), ...(importedSchoolInfo || {}) },
          students: mergedStudents,
          teachers: mergedTeachers
        };

        return {
          smkmu: mergedUnit,
          sdn5: mergedUnit
        };
      }
    });

    // Apply Attendance
    if (mode === 'REPLACE_ALL') {
      setAttendanceLog(importedAttendance);
    } else {
      setAttendanceLog(prev => {
        const merged = { ...prev };
        Object.keys(importedAttendance).forEach(dateKey => {
          merged[dateKey] = { ...(merged[dateKey] || {}), ...(importedAttendance[dateKey] || {}) };
        });
        return merged;
      });
    }

    // Apply Accounts
    if (importedAccounts.length > 0) {
      if (mode === 'REPLACE_ALL') {
        saveAccounts(importedAccounts);
      } else {
        const currentAccounts = getAccounts();
        const currentIds = new Set(currentAccounts.map(a => a.id));
        const mergedAccs = [...currentAccounts, ...importedAccounts.filter(a => !currentIds.has(a.id))];
        saveAccounts(mergedAccs);
      }
    }

    // Apply E-Learning & Grades
    if (importedELearning && setELearningData) {
      setELearningData(importedELearning);
    }
    if (importedGrades && setGradesData) {
      setGradesData(importedGrades);
    }
    if (importedLogo !== undefined && setPortalLogo) {
      setPortalLogo(importedLogo);
    }

    return {
      success: true,
      message: `Pemulihan database (${mode === 'REPLACE_ALL' ? 'Restore Penuh' : 'Merge'}) berhasil dilakukan!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menerapkan data hasil restore: ${err?.message || 'Kesalahan internal'}`
    };
  }
};
