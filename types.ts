
export type School = 'smkmu';

export type View =
  | 'Dashboard'
  | 'Jadwal Pelajaran'
  | 'Guru Pengajar'
  | 'Data Siswa'
  | 'Data Absensi'
  | 'Kalender Kegiatan'
  | 'Profil Sekolah'
  | 'Keamanan & Akun'
  | 'Database Portal Informasi';

export type SuiteModule = 'info' | 'teacher' | 'student' | 'data-quiz';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'operator' | 'teacher' | 'kiosk';
  allowedModules: SuiteModule[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  note?: string;
}

export interface AuthSession {
  accountId: string;
  username: string;
  displayName: string;
  role: 'admin' | 'operator' | 'teacher' | 'kiosk';
  allowedModules: SuiteModule[];
  activeModule: SuiteModule;
  loginTimestamp: number;
  rememberMe: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: number;
  username: string;
  module: SuiteModule;
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT';
  ipOrDevice?: string;
  details?: string;
}

export interface Teacher {
  id: number;
  name: string;
  nip?: string;
  subjectsTaught: string[];
  photoUrl: string;
  rfidCode?: string;
  qrCode?: string;
  faceDataUrl?: string;
  faceRegistered?: boolean;
  faceRegisteredAt?: string;
  faceBiometricHash?: string;
  faceBiometricDescriptor?: string;
  school?: string;
}

export interface Subject {
  code: string;
  name: string;
}

export interface ScheduleEntry {
  subjectCode: string | 'ISTIRAHAT' | 'ISHOMA' | 'TADARUS';
  teacherCode: number | null;
}

export interface SchedulePeriod {
  time: string;
  period: number | string;
  classes: {
    [className: string]: ScheduleEntry;
  };
}

export type ScheduleDay = SchedulePeriod[];

export interface Schedule {
  [day: string]: ScheduleDay;
}

export interface Student {
  id: string;
  username?: string; // Username khusus login kuis
  password?: string; // Password login kuis
  class: string;
  fullName: string;
  rfidCode?: string; // Kode / UID Kartu RFID (e.g. 1651987146)
  qrCode?: string; // Kode Identifikasi Unik QR Code (Format: SMK-QR-{ID}-{NIS}-{CHECKSUM})
  // Memisahkan dob menjadi birthPlace dan birthDate untuk detail lebih lanjut
  birthPlace?: string;
  birthDate?: string;
  dob: string; // Tetap ada untuk kompatibilitas tampilan lama
  address: string; // Alamat gabungan
  nis: string;
  nisn: string;
  photoUrl: string;
  faceDataUrl?: string; // Data Wajah Biometrik untuk Scan Station
  faceRegistered?: boolean; // Status pendaftaran biometrik wajah di Data Siswa
  faceRegisteredAt?: string; // Waktu pendaftaran biometrik wajah
  faceBiometricHash?: string; // Token / Hash kode biometrik unik
  faceBiometricDescriptor?: string; // Serialized biometrik descriptor (JSON)
  // Detail baru dari Excel
  gender?: 'L' | 'P' | '';
  nik?: string; // NIK Siswa
  religion?: string;
  streetAddress?: string; // Alamat Jalan/Dukuh
  rt?: string;
  rw?: string;
  dusun?: string;
  kelurahan?: string;
  kecamatan?: string;
  postalCode?: string;
  fatherName: string;
  fatherOccupation: string;
  fatherEducation?: string;
  fatherIncome?: string;
  fatherBirthYear?: string;
  fatherNik?: string;
  motherName: string;
  motherOccupation: string;
  motherEducation?: string;
  motherIncome?: string;
  motherBirthYear?: string;
  motherNik?: string;
  previousSchool: string;
}

export interface AccreditationEntry {
  year: string;
  skNumber: string;
  skDate: string;
  skExpiry: string;
  score: string;
  rank: string;
}

export interface SchoolInfo {
  name: string;
  officialName?: string;
  address: string;
  administrativeAddress?: string;
  locationDetails?: string;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  headmaster: string;
  headmasterTitle?: string;
  headmasterHistory?: string;
  npsn?: string;
  email?: string;
  phone?: string;
  website?: string;
  foundation?: string;
  schoolStatus?: string;
  educationForm?: string;
  educationLevel?: string;
  accreditation?: string;
  accreditationDetails?: string;
  operator?: string;
  majorProgram?: string;
  headOfMajor?: string;
  postalCode?: string;
  logoUrl?: string;
  headmasterPhotoUrl?: string;
  vision?: string;
  mission?: string;
  description?: string;
  establishmentDate?: string;
  establishmentDecree?: string;
  operationalDecree?: string;
  coordinates?: string;
  latitude?: string;
  longitude?: string;
  mapsUrl?: string;
  
  // Stats & Utilities (Dynamic Mapping)
  curriculum?: string;
  organization?: string;
  semesterData?: string;
  internetAccess?: string;
  electricSource?: string;
  electricPower?: string;
  landArea?: string;
  
  // Extra pip & student stats info
  pipStats?: {
    studentCount: number;
    totalFunds: string;
    year: string;
  };
  studentStatsUpdate2026?: {
    totalStudents: number;
    date: string;
  };
  studentStats2024_2025?: {
    totalStudents: number;
    male: number;
    female: number;
    rombel: number;
    semester: string;
  };

  // Flexible extra stats
  extraStats?: { label: string; value: string }[];
  
  studentStats?: {
    total: number;
    levels: { [key: string]: number };
  };
  staffStats?: {
    total: number;
    pns: number;
    gtt: number;
    gty: number;
    honor: number;
  };
  accreditationHistory?: AccreditationEntry[];
}

export interface SchoolData {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  subjects: Subject[];
  schedule: Schedule;
  students: Student[];
}

export interface AppData {
  smkmu: SchoolData;
  sdn5?: SchoolData;
}

export interface CalendarEvent {
    date: string;
    title: string;
    description: string;
    color: 'blue' | 'green' | 'red' | 'yellow';
}

export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpha' | 'Bolos' | '-';

export interface AttendanceRecord {
  status: Exclude<AttendanceStatus, '-'>;
  timestamp: string; // Format: "HH:mm" atau "HH:mm:ss"
  checkInTime?: string; // Jam Datang / Masuk (e.g. "06:45:10")
  checkOutTime?: string; // Jam Pulang (e.g. "14:15:30")
  isLate?: boolean; // Apakah siswa terlambat (> 07:15)
  latenessMinutes?: number; // Jumlah menit keterlambatan
  method?: string; // RFID, QR Code, Wajah, Manual Operator
  checkOutMethod?: string; // Metode tap saat pulang
  note?: string; // Keterangan Izin/Sakit/Alpa/Bolos
  scanType?: 'masuk' | 'pulang';
}

export type AttendanceLog = { 
  [date: string]: {
    [personId: string | number]: AttendanceRecord; 
  } 
};

export interface Notification {
  id: string;
  type: 'event' | 'attendance' | 'announcement';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface ELearningContent {
  id: string;
  type: 'material' | 'video' | 'assignment' | 'link';
  title: string;
  description?: string;
  url?: string;
  fileName?: string;
  createdAt: number;
  dueDate?: string;
  points?: number;
  fileType?: 'pdf' | 'docx' | 'xlsx' | 'other';
}

export interface ELearningModule {
  id: string;
  title: string;
  contents: ELearningContent[];
}

export type ELearningData = {
  [className: string]: {
    [subjectCode: string]: ELearningModule[];
  };
};

export interface AcademicGrade {
  studentId: string;
  subjectCode: string;
  tugas: number;
  uh: number;
  pts: number;
  pas: number;
}

export type GradesData = {
  [studentId: string]: {
    [subjectCode: string]: AcademicGrade;
  };
};
