import { AppData, AttendanceLog, ELearningData, GradesData, UserAccount, SecurityAuditLog, SchoolInfo, Student, Teacher, Schedule, Subject, CalendarEvent, School } from '../types';

export interface PortalDatabaseMetadata {
  appName: string;
  databaseName: string; // 'database_portalinformasi'
  version: string;
  timestamp: number;
  timestampFormatted: string;
  schoolNpsn: string;
  schoolName: string;
  totalStudents: number;
  totalTeachers: number;
  totalAttendanceDays: number;
  totalAttendanceRecords: number;
  totalUserAccounts: number;
  totalFaceRegistered: number;
  totalRfidRegistered: number;
  totalQrRegistered: number;
  checksum: string;
  securitySignature?: string;
  securityCheckPassed?: boolean;
  encryptionMethod?: 'AES-256-HMAC' | 'PLAINTEXT' | 'ENCRYPTED_BASE64';
  backupType: 'AUTO_SCHEDULED' | 'MANUAL_USER' | 'REALTIME_SNAPSHOT' | 'EMERGENCY_DUMP';
  description: string;
}

export interface EntityDocumentation {
  folder: string;
  entityKey: string;
  name: string;
  description: string;
  fieldsSummary: string[];
  hasBiometrics: boolean;
  hasRfidQr: boolean;
  sampleRecordPreview?: Record<string, any>;
}

export interface PortalDatabaseExplanation {
  title: string;
  purpose: string;
  databaseDirectory: string;
  generatedBy: string;
  createdAt: string;
  entities: EntityDocumentation[];
  restoreInstructions: string[];
  securityNotice: string;
}

export interface PortalDatabaseContent {
  data_pokok_sekolah: SchoolInfo;
  data_pokok_siswa: Student[];
  data_pokok_guru: Teacher[];
  data_verifikasi_wajah_biometrik: {
    siswa_terdaftar: Array<{
      id: string;
      nama: string;
      kelas: string;
      faceRegistered: boolean;
      faceRegisteredAt?: string;
      faceBiometricHash?: string;
      faceBiometricDescriptor?: string;
      faceDataUrl?: string;
    }>;
    guru_terdaftar: Array<{
      id: number;
      nama: string;
      nip?: string;
      faceRegistered: boolean;
      faceRegisteredAt?: string;
      faceBiometricHash?: string;
      faceBiometricDescriptor?: string;
      faceDataUrl?: string;
    }>;
    totalTerdaftar: number;
  };
  data_kode_unik_rfid_dan_qr: {
    rfid_siswa: Array<{ studentId: string; fullName: string; class: string; rfidCode: string }>;
    rfid_guru: Array<{ teacherId: number; name: string; rfidCode: string }>;
    qr_siswa: Array<{ studentId: string; fullName: string; class: string; qrCode: string }>;
    qr_guru: Array<{ teacherId: number; name: string; qrCode: string }>;
    totalRfid: number;
    totalQr: number;
  };
  data_waktu_dan_jadwal: {
    waktu_ekspor_iso: string;
    jadwal_pelajaran_smkmu: Schedule;
    jadwal_pelajaran_sdn5?: Schedule;
    mata_pelajaran: Subject[];
    kalender_kegiatan: CalendarEvent[];
  };
  data_absensi_presensi: {
    log_harian: AttendanceLog;
    total_hari_tercatat: number;
    total_entri: number;
  };
  data_login_dan_keamanan: {
    user_accounts: UserAccount[];
    audit_security_logs: SecurityAuditLog[];
  };
  data_elearning_dan_nilai: {
    elearning: Record<School, ELearningData>;
    grades: Record<School, GradesData>;
  };
  data_branding_dan_logo: {
    portalLogo: string;
  };
}

export interface PortalDatabasePackage {
  _schema: 'database_portalinformasi_v1';
  _readme_and_documentation: PortalDatabaseExplanation;
  metadata: PortalDatabaseMetadata;
  database_portalinformasi: PortalDatabaseContent;
}

export interface AutoBackupSnapshotRecord {
  id: string;
  timestamp: number;
  timestampFormatted: string;
  backupType: 'AUTO_SCHEDULED' | 'MANUAL_USER' | 'REALTIME_SNAPSHOT';
  sizeBytes: number;
  sizeFormatted: string;
  summary: {
    students: number;
    teachers: number;
    attendanceRecords: number;
    accounts: number;
    faceVerified: number;
    rfidRegistered: number;
    qrRegistered: number;
  };
  dataPackage: PortalDatabasePackage;
}
