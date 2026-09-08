import { PortalDatabaseExplanation } from './types';

export const DATABASE_EXPLANATION: PortalDatabaseExplanation = {
  title: "DOKUMENTASI LENGKAP STRUKTUR DATABASE PORTAL INFORMASI (database_portalinformasi)",
  purpose: "Sebagai wadah penyimpanan utama, sinkronisasi real-time, backup otomatis per 5 menit, dan pemulihan (restore) master data lengkap untuk sistem Portal Informasi SMK Manbaul Ulum.",
  databaseDirectory: "database_portalinformasi",
  generatedBy: "Sistem Manajemen Database & Backup Engine SMK Manbaul Ulum",
  createdAt: new Date().toISOString(),
  entities: [
    {
      folder: "database_portalinformasi/data_pokok_siswa",
      entityKey: "data_pokok_siswa",
      name: "Data Pokok Siswa & Biodata Lengkap",
      description: "Menyimpan seluruh master biodata siswa: NIS, NISN, NIK, Nama Lengkap, Kelas (1 s.d 6), Jenis Kelamin, Tempat/Tanggal Lahir, Alamat lengkap (RT/RW/Dusun/Kecamatan), Data Orang Tua (Ayah & Ibu, Pekerjaan, Penghasilan, Pendidikan, NIK Orang Tua), serta sekolah asal.",
      fieldsSummary: ["id", "nis", "nisn", "nik", "fullName", "class", "gender", "dob", "address", "fatherName", "motherName", "rfidCode", "qrCode", "faceBiometricHash"],
      hasBiometrics: true,
      hasRfidQr: true
    },
    {
      folder: "database_portalinformasi/data_pokok_guru",
      entityKey: "data_pokok_guru",
      name: "Data Pokok Guru & Tenaga Pendidik",
      description: "Menyimpan master data guru pengajar: ID Guru, Nama Lengkap beserta gelar, NIP resmi, daftar mata pelajaran yang diampu, foto profil, kartu RFID, dan QR Code unik presensi.",
      fieldsSummary: ["id", "name", "nip", "subjectsTaught", "photoUrl", "rfidCode", "qrCode", "faceBiometricHash"],
      hasBiometrics: true,
      hasRfidQr: true
    },
    {
      folder: "database_portalinformasi/data_verifikasi_wajah_biometrik",
      entityKey: "data_verifikasi_wajah_biometrik",
      name: "Hasil Verifikasi Wajah Biometrik (Face Recognition)",
      description: "Menyimpan data pendaftaran biometrik wajah siswa dan guru untuk kiosk absensi station. Berisi timestamp pendaftaran, hash biometrik unik, token descriptor neural network, dan foto referensi biometrik.",
      fieldsSummary: ["faceRegistered", "faceRegisteredAt", "faceBiometricHash", "faceBiometricDescriptor", "faceDataUrl"],
      hasBiometrics: true,
      hasRfidQr: false
    },
    {
      folder: "database_portalinformasi/data_kode_unik_rfid_dan_qr",
      entityKey: "data_kode_unik_rfid_dan_qr",
      name: "Kode Unik RFID & QR Code Presensi",
      description: "Menyimpan relasi kode identifikasi unik kartu RFID (UID 10 digit, contoh: 1651987146) dan string QR Code berformat terenkripsi checksum (SMK-QR-xxx) untuk seluruh siswa dan guru.",
      fieldsSummary: ["studentId/teacherId", "fullName/name", "rfidCode", "qrCode"],
      hasBiometrics: false,
      hasRfidQr: true
    },
    {
      folder: "database_portalinformasi/data_waktu_dan_jadwal",
      entityKey: "data_waktu_dan_jadwal",
      name: "Data Waktu Aplikasi, Kalender & Jadwal Pelajaran",
      description: "Menyimpan jadwal pelajaran mingguan per kelas (Senin s.d Sabtu), kode jam pelajaran (07:15 - 12:45), mata pelajaran resmi, serta seluruh agenda kalender kegiatan akademik & hari libur nasional.",
      fieldsSummary: ["jadwal_pelajaran_smkmu", "mata_pelajaran", "kalender_kegiatan", "waktu_ekspor_iso"],
      hasBiometrics: false,
      hasRfidQr: false
    },
    {
      folder: "database_portalinformasi/data_absensi_presensi",
      entityKey: "data_absensi_presensi",
      name: "Data Riwayat & Log Absensi Harian",
      description: "Menyimpan riwayat absensi harian dan bulanan seluruh siswa & guru dengan status (Hadir, Sakit, Izin, Alpha), timestamp presensi WIB, metode (RFID, Face Recognition, QR Code, Manual Operator), serta catatan keterangan.",
      fieldsSummary: ["log_harian (tanggal -> id -> { status, timestamp, method, note })", "total_hari_tercatat", "total_entri"],
      hasBiometrics: false,
      hasRfidQr: false
    },
    {
      folder: "database_portalinformasi/data_login_dan_keamanan",
      entityKey: "data_login_dan_keamanan",
      name: "Data Akun Login Aplikasi & Audit Keamanan",
      description: "Menyimpan kredensial akun pengguna (Admin, Operator, Guru, Kiosk), role hak akses modul, status aktif, riwayat login terakhir, dan log audit keamanan terperinci.",
      fieldsSummary: ["user_accounts (id, username, displayName, role, allowedModules, isActive, lastLogin)", "audit_security_logs"],
      hasBiometrics: false,
      hasRfidQr: false
    },
    {
      folder: "database_portalinformasi/data_elearning_dan_nilai",
      entityKey: "data_elearning_dan_nilai",
      name: "E-Learning & Nilai Akademik Siswa",
      description: "Menyimpan materi pembelajaran, video, tautan, tugas, dan rekap nilai akademik (Tugas, UH, PTS, PAS) seluruh siswa per mata pelajaran.",
      fieldsSummary: ["elearning", "grades"],
      hasBiometrics: false,
      hasRfidQr: false
    },
    {
      folder: "database_portalinformasi/data_pokok_sekolah",
      entityKey: "data_pokok_sekolah",
      name: "Profil & Identitas Resmi Sekolah",
      description: "Menyimpan identitas lengkap SMK Manbaul Ulum: NPSN 10800612, SK Pendirian/Operasional, Kepala Sekolah, Akreditasi, Sarana & Prasarana, Titik Koordinat Maps, dan Logo Resmi.",
      fieldsSummary: ["name", "npsn", "headmaster", "address", "accreditation", "studentStats", "staffStats"],
      hasBiometrics: false,
      hasRfidQr: false
    }
  ],
  restoreInstructions: [
    "1. Pastikan file backup berekstensi .json atau .backup_portalinformasi dengan format schema valid ('database_portalinformasi_v1').",
    "2. Sistem akan memvalidasi integritas data, menghitung jumlah siswa, guru, log absensi, dan akun sebelum melakukan restore.",
    "3. Pilih metode: 'Restore Penuh (Timpa Seluruh Data)' untuk mengembalikan kondisi sistem persis saat backup, atau 'Merge/Perbarui' untuk menambah data yang belum ada.",
    "4. Seluruh kode RFID, QR Code, dan deskriptor biometrik wajah akan langsung disinkronisasi ke memori dan Kiosk secara realtime."
  ],
  securityNotice: "File ini memuat seluruh data penting sekolah, biometrik, dan kredensial login. Simpan file backup di tempat yang aman (Google Drive / Harddisk Terenkripsi)."
};
