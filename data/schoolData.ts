
import { AppData, CalendarEvent, Student, ScheduleDay, SchoolInfo } from '../types';
import { generateUniqueStudentQr } from '../utils/qrHelper';
import { DEFAULT_TJKT_LOGO } from '../assets/images/tjktLogoBase64';

// --- DATA SMK MANBAUL ULUM (JURUSAN TJKT) ---
// GURU PENGAJAR TUNGGAL
export const smkmuTeachers = [
  { 
    id: 1, 
    name: 'Herlambang Lasena, S.T.', 
    nip: '198501012010011001', 
    subjectsTaught: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'], 
    photoUrl: '', 
    rfidCode: '1653761770', 
    qrCode: 'SMK-GURU-G1' 
  }, // Guru Pengajar & Kepala Jurusan TJKT
];

export const smkmuSubjects = [
  { code: 'TJKT', name: 'TJKT (Teknik Jaringan Komputer & Telko)' },
  { code: 'PD', name: 'Pengembangan Diri (PD)' },
  { code: 'A', name: 'Dasar-dasar TJKT' },
  { code: 'B', name: 'Administrasi Infrastruktur Jaringan (AIJ)' },
  { code: 'C', name: 'Administrasi Sistem Jaringan (ASJ)' },
  { code: 'D', name: 'Teknologi Layanan Jaringan (TLJ)' },
  { code: 'E', name: 'Keamanan Jaringan & Cyber Security' },
  { code: 'F', name: 'Pemrograman & Otomasi Jaringan' },
  { code: 'G', name: 'Matematika Kejuruan' },
  { code: 'H', name: 'Bahasa Indonesia' },
  { code: 'I', name: 'Bahasa Inggris Teknik & Bisnis' },
  { code: 'J', name: 'Pendidikan Agama Islam & Budi Pekerti' },
  { code: 'K', name: 'Pendidikan Pancasila & Kewarganegaraan' },
  { code: 'L', name: 'Produk Kreatif & Kewirausahaan (PKK)' },
  { code: 'M', name: 'Proyek IPAS Terapan' },
  { code: 'N', name: 'Pendidikan Jasmani, Olahraga & Kesehatan' },
  { code: 'O', name: 'Fiber Optik & Transmisi Telekomunikasi' },
];

// Helper Rows
const tadarusRow = (classes: string[]): any => ({
  time: '07.15 - 07.30',
  period: '0',
  classes: Object.fromEntries(classes.map(c => [c, { subjectCode: 'TADARUS', teacherCode: null }]))
});

const istirahatRow = (classes: string[]): any => ({
  time: '09.30 - 10.00',
  period: 'ISTIRAHAT',
  classes: Object.fromEntries(classes.map(c => [c, { subjectCode: 'ISTIRAHAT', teacherCode: null }]))
});

const ishomaRow = (classes: string[]): any => ({
  time: '12.00 - 13.00',
  period: 'ISHOMA',
  classes: Object.fromEntries(classes.map(c => [c, { subjectCode: 'ISHOMA', teacherCode: null }]))
});

export const smkmuClasses = ['X', 'XI', 'XII'];

const emptyClasses = { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: '', teacherCode: null } };
const pdClasses = { X: { subjectCode: 'PD', teacherCode: null }, XI: { subjectCode: 'PD', teacherCode: null }, XII: { subjectCode: 'PD', teacherCode: null } };

export const smkmuSchedule = {
  Senin: [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    { time: '08.30 - 09.30', period: 2, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: { X: { subjectCode: 'TJKT', teacherCode: 1 }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: '', teacherCode: null } } },
    { time: '11.00 - 12.00', period: 4, classes: { X: { subjectCode: 'TJKT', teacherCode: 1 }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: '', teacherCode: null } } },
    ishomaRow(smkmuClasses),
    { time: '13.00 - 14.00', period: 5, classes: pdClasses },
  ],
  Selasa: [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    { time: '08.30 - 09.30', period: 2, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    { time: '11.00 - 12.00', period: 4, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    ishomaRow(smkmuClasses),
    { time: '13.00 - 14.00', period: 5, classes: pdClasses },
  ],
  Rabu: [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    { time: '08.30 - 09.30', period: 2, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: 'TJKT', teacherCode: 1 }, XII: { subjectCode: '', teacherCode: null } } },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    { time: '11.00 - 12.00', period: 4, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    ishomaRow(smkmuClasses),
    { time: '13.00 - 14.00', period: 5, classes: pdClasses },
  ],
  Kamis: [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: emptyClasses },
    { time: '08.30 - 09.30', period: 2, classes: emptyClasses },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: emptyClasses },
    { time: '11.00 - 12.00', period: 4, classes: emptyClasses },
    ishomaRow(smkmuClasses),
    { time: '13.00 - 14.00', period: 5, classes: pdClasses },
  ],
  "Jum'at": [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: emptyClasses },
    { time: '08.30 - 09.30', period: 2, classes: emptyClasses },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: emptyClasses },
    ishomaRow(smkmuClasses),
  ],
  Sabtu: [
    tadarusRow(smkmuClasses),
    { time: '07.30 - 08.30', period: 1, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    { time: '08.30 - 09.30', period: 2, classes: { X: { subjectCode: '', teacherCode: null }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: 'TJKT', teacherCode: 1 } } },
    istirahatRow(smkmuClasses),
    { time: '10.00 - 11.00', period: 3, classes: { X: { subjectCode: 'TJKT', teacherCode: 1 }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: '', teacherCode: null } } },
    { time: '11.00 - 12.00', period: 4, classes: { X: { subjectCode: 'TJKT', teacherCode: 1 }, XI: { subjectCode: '', teacherCode: null }, XII: { subjectCode: '', teacherCode: null } } },
    ishomaRow(smkmuClasses),
    { time: '13.00 - 14.00', period: 5, classes: pdClasses },
  ],
};

export const smkmuSchoolInfo: SchoolInfo = {
  name: 'SMK MANBAUL ULUM',
  officialName: 'SMK MANBAUL ULUM',
  address: 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kecamatan Gunung Labuhan, Kabupaten Way Kanan, Provinsi Lampung',
  administrativeAddress: 'Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan, Prov. Lampung',
  locationDetails: 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya',
  village: 'Labuhan Jaya',
  district: 'Gunung Labuhan',
  regency: 'Way Kanan',
  province: 'Lampung',
  postalCode: '34761',
  headmaster: 'Muniroh',
  headmasterTitle: 'Kepala Sekolah',
  headmasterHistory: 'Kepala Sekolah: Muniroh | Guru Pengajar / Kajur TJKT: Herlambang Lasena, S.T.',
  majorProgram: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
  headOfMajor: 'Herlambang Lasena, S.T.',
  npsn: '69956732',
  email: 'smkmanbaululum@gmail.com',
  phone: '081368937075',
  foundation: 'Yayasan Pondok Pesantren Manbaul Ulum',
  schoolStatus: 'Swasta',
  educationForm: 'Sekolah Menengah Kejuruan (SMK)',
  educationLevel: 'Pendidikan Menengah Kejuruan',
  accreditation: 'B',
  accreditationDetails: 'Peringkat B (Terakreditasi BAN-PDM)',
  establishmentDate: '17 Juni 2016',
  establishmentDecree: 'SK/Kemenkumham/2016',
  operationalDecree: '503.15/002/SMK/II.16-WK/2016',
  coordinates: '-4.685200, 104.571400',
  latitude: '-4.685200',
  longitude: '104.571400',
  mapsUrl: 'https://www.google.com/maps?q=-4.685200,104.571400',
  curriculum: 'Kurikulum Merdeka SMK - Konsentrasi Keahlian TJKT',
  organization: 'Pagi / 6 Hari (Senin - Sabtu)',
  semesterData: '2024/2025-2 & Pemutakhiran 2026',
  internetAccess: 'Fiber Optic Dedicated 100 Mbps (Lab Jaringan)',
  electricSource: 'PLN',
  electricPower: '3.500 VA (PLN)',
  landArea: '3.500 m²',
  vision: 'Mewujudkan lulusan SMK Manbaul Ulum yang unggul, profesional, dan kompeten di bidang Teknik Jaringan Komputer dan Telekomunikasi (TJKT), berkarakter islami, mandiri, serta siap kerja di era industri digital dan telekomunikasi global.',
  mission: '1. Menyelenggarakan proses pembelajaran kejuruan Teknik Jaringan Komputer dan Telekomunikasi (TJKT) berbasis kurikulum industri dan standar kompetensi kerja nasional.\n2. Membekali peserta didik dengan keahlian praktis infrastruktur jaringan komputer (LAN/WAN/Wireless), perakitan & instalasi fiber optik, administrasi server Linux/Windows, cloud computing, serta keamanan siber (cybersecurity).\n3. Melaksanakan program sertifikasi keahlian teknisi jaringan komputer dan uji kompetensi kejuruan yang diakui industri dan BNSP.\n4. Membangun kemitraan strategis (Link and Match) dengan Dunia Usaha, Dunia Industri (DUDI), dan Internet Service Provider (ISP) untuk program Praktik Kerja Lapangan (PKL) dan penyaluran lulusan.\n5. Membentuk lulusan yang berakhlak mulia, disiplin kerja tinggi, berjiwa wirausaha teknologi (technopreneurship), dan adaptif terhadap perkembangan teknologi telekomunikasi.',
  description: 'SMK Manbaul Ulum merupakan satuan pendidikan menengah kejuruan swasta yang berlokasi di Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kecamatan Gunung Labuhan, Kabupaten Way Kanan, Provinsi Lampung. Sekolah memiliki program keahlian Teknik Jaringan Komputer dan Telekomunikasi (TJKT) dengan guru pengajar Herlambang Lasena, S.T. Data peserta didik aktif tercatat 23 siswa (7 laki-laki dan 16 perempuan) yang terbagi dalam 3 rombongan belajar: Kelas X, XI, dan XII TJKT.',
  studentStats2024_2025: {
    totalStudents: 23,
    male: 7,
    female: 16,
    rombel: 3,
    semester: '2024/2025-2'
  },
  studentStatsUpdate2026: {
    totalStudents: 23,
    date: 'Semester Genap 2025/2026 (Data Pokok Pendidikan)'
  },
  studentStats: { 
    total: 23, 
    levels: { 'X': 11, 'XI': 4, 'XII': 8 } 
  },
  staffStats: { total: 1, pns: 0, gtt: 0, gty: 1, honor: 0 },
  extraStats: [
    { label: 'Peserta Didik Aktif', value: '23 Siswa' },
    { label: 'Siswa Laki-laki', value: '7 Siswa' },
    { label: 'Siswa Perempuan', value: '16 Siswa' },
    { label: 'Rombongan Belajar', value: '3 Rombel (X, XI, XII)' },
    { label: 'Program Keahlian', value: 'TJKT (Teknik Jaringan Komputer & Telko)' },
    { label: 'Guru Pengajar / Kajur TJKT', value: 'Herlambang Lasena, S.T.' },
    { label: 'Kepala Sekolah', value: 'Muniroh' },
    { label: 'Laboratorium Jaringan & Komputer', value: '2 Ruang Lab Praktik' },
    { label: 'Kecamatan / Kabupaten', value: 'Gunung Labuhan / Way Kanan' }
  ],
  accreditationHistory: [
    {
      year: '2024',
      skNumber: 'Keputusan BAN-PDM Provinsi Lampung',
      skDate: '2024',
      skExpiry: '2029',
      score: 'B',
      rank: 'B'
    }
  ],
  logoUrl: DEFAULT_TJKT_LOGO
};

// Generate Exactly 23 Students from verified roster:
// Kelas X: 11 Siswa (3 Laki-laki, 8 Perempuan)
// Kelas XI: 4 Siswa (3 Laki-laki, 1 Perempuan)
// Kelas XII: 8 Siswa (1 Laki-laki, 7 Perempuan)
// Total: 23 Siswa (7 Laki-laki, 16 Perempuan)
export const generateCleanStudents = (): Student[] => {
  const rawStudentList: Array<{
    name: string;
    gender: 'L' | 'P';
    cls: 'X' | 'XI' | 'XII';
    nis: string;
    nisn: string;
    rfid: string;
    birthDate: string;
    fatherName: string;
    motherName: string;
  }> = [
    // --- KELAS X (11 SISWA: 3 LAKI-LAKI, 8 PEREMPUAN) ---
    { name: 'ANISA', gender: 'P', cls: 'X', nis: '2401', nisn: '0081230101', rfid: '1651314106', birthDate: '12 Mei 2008', fatherName: 'Supardi', motherName: 'Siti Aminah' },
    { name: 'HAFIZATUN NAILA FAUZIYAH', gender: 'P', cls: 'X', nis: '2402', nisn: '0081230102', rfid: '1651680346', birthDate: '24 September 2008', fatherName: 'Rustam', motherName: 'Sumarni' },
    { name: 'KEVIN ARIYANTO', gender: 'L', cls: 'X', nis: '2403', nisn: '0081230103', rfid: '1651133194', birthDate: '05 Januari 2008', fatherName: 'Bambang', motherName: 'Nurhayati' },
    { name: 'ALKA REZA SAPUTRA', gender: 'L', cls: 'X', nis: '2404', nisn: '0081230104', rfid: '1651207370', birthDate: '18 Maret 2008', fatherName: 'Haryanto', motherName: 'Wartini' },
    { name: 'M. ULUL JAUHARI ILMI', gender: 'L', cls: 'X', nis: '2405', nisn: '0081230105', rfid: '1651734026', birthDate: '09 Juli 2008', fatherName: 'Sukirman', motherName: 'Sri Rahayu' },
    { name: 'NADIA MARSELA', gender: 'P', cls: 'X', nis: '2406', nisn: '0081230106', rfid: '1336817466', birthDate: '21 Agustus 2008', fatherName: 'Yanto', motherName: 'Marfuah' },
    { name: 'QONITA AULIA RIFQIYAH', gender: 'P', cls: 'X', nis: '2407', nisn: '0081230107', rfid: '1330185402', birthDate: '14 Oktober 2008', fatherName: 'Slamet', motherName: 'Mursiti' },
    { name: 'SHELA SANDRA', gender: 'P', cls: 'X', nis: '2408', nisn: '0081230108', rfid: '1338113178', birthDate: '02 Februari 2008', fatherName: 'Darsono', motherName: 'Karsih' },
    { name: 'SINTA FITRIANI', gender: 'P', cls: 'X', nis: '2409', nisn: '0081230109', rfid: '1336996522', birthDate: '30 November 2008', fatherName: 'Sunarto', motherName: 'Jumiati' },
    { name: 'ZAHRA OLIVIA', gender: 'P', cls: 'X', nis: '2410', nisn: '0081230110', rfid: '1330174218', birthDate: '11 Desember 2008', fatherName: 'Riyadi', motherName: 'Sutini' },
    { name: 'ZAHWA AQILA', gender: 'P', cls: 'X', nis: '2411', nisn: '0081230111', rfid: '1330093594', birthDate: '19 April 2008', fatherName: 'Gunawan', motherName: 'Endang' },

    // --- KELAS XI (4 SISWA: 3 LAKI-LAKI, 1 PEREMPUAN) ---
    { name: 'AHMAD SAMSUDIN', gender: 'L', cls: 'XI', nis: '2301', nisn: '0071230201', rfid: '1336772442', birthDate: '15 Maret 2007', fatherName: 'Wagiran', motherName: 'Kasiyati' },
    { name: "As'ad Maulidah Roing Kanah", gender: 'P', cls: 'XI', nis: '2302', nisn: '0071230202', rfid: '1330062362', birthDate: '27 Juni 2007', fatherName: 'Priyanto', motherName: 'Sumiati' },
    { name: 'DIMAS SUSENO', gender: 'L', cls: 'XI', nis: '2303', nisn: '0071230203', rfid: '1336989194', birthDate: '08 November 2007', fatherName: 'Suparman', motherName: 'Tukirah' },
    { name: 'HUSNI ZAKI MAHLUFI', gender: 'L', cls: 'XI', nis: '2304', nisn: '0071230204', rfid: '1337237962', birthDate: '03 Februari 2007', fatherName: 'Ahmad Ridwan', motherName: 'Halimah' },

    // --- KELAS XII (8 SISWA: 1 LAKI-LAKI, 7 PEREMPUAN) ---
    { name: 'ASSYFA TUNNAZAH', gender: 'P', cls: 'XII', nis: '2201', nisn: '0061230301', rfid: '1607516327', birthDate: '17 Agustus 2006', fatherName: 'Siswanto', motherName: 'Kartini' },
    { name: 'JENI RAMADHANI', gender: 'P', cls: 'XII', nis: '2202', nisn: '0061230302', rfid: '1606908359', birthDate: '22 Januari 2006', fatherName: 'Subagio', motherName: 'Suwarni' },
    { name: 'MIRSA TRISANTA PUTRI', gender: 'P', cls: 'XII', nis: '2203', nisn: '0061230303', rfid: '1650278154', birthDate: '10 Mei 2006', fatherName: 'Misran', motherName: 'Ponirah' },
    { name: 'NABILA KHOIRUNISA ISLAMI', gender: 'P', cls: 'XII', nis: '2204', nisn: '0061230304', rfid: '1650301930', birthDate: '14 Juli 2006', fatherName: 'Tugiman', motherName: 'Suparni' },
    { name: 'Rhelovi Khayla Aneksha', gender: 'P', cls: 'XII', nis: '2205', nisn: '0061230305', rfid: '1650937674', birthDate: '28 Februari 2006', fatherName: 'Joko Susilo', motherName: 'Suratmi' },
    { name: 'SRI WININGSIH', gender: 'P', cls: 'XII', nis: '2206', nisn: '0061230306', rfid: '1651313562', birthDate: '19 September 2006', fatherName: 'Kuswanto', motherName: 'Siti Fatimah' },
    { name: 'SYIFA MUTIA SARI', gender: 'P', cls: 'XII', nis: '2207', nisn: '0061230307', rfid: '1654460266', birthDate: '06 Oktober 2006', fatherName: 'Triyono', motherName: 'Samiyem' },
    { name: 'M. Teguh Andrian Amsah', gender: 'L', cls: 'XII', nis: '2208', nisn: '0061230308', rfid: '1652174890', birthDate: '17 Agustus 2006', fatherName: 'Hartono', motherName: 'Maryani' },
  ];

  const students: Student[] = rawStudentList.map((item, idx) => {
    const studentId = `SMK-${item.cls}-${String(idx + 1).padStart(2, '0')}`;
    const generatedQr = generateUniqueStudentQr({
      id: studentId,
      nis: item.nis,
      nisn: item.nisn,
      fullName: `${item.name} - Kls ${item.cls} TJKT`,
      rfidCode: item.rfid
    });

    const streetAddress = `Jl. Pamuka Jaya No. ${idx + 1}`;
    const rt = String((idx % 3) + 1);
    const rw = String((idx % 2) + 1);
    const dusun = 'Dusun 01 Labuhan Jaya';
    const kelurahan = 'Labuhan Jaya';
    const kecamatan = 'Gunung Labuhan';
    const postalCode = '34761';
    const address = `${streetAddress}, RT 0${rt}/RW 0${rw}, ${dusun}, ${kelurahan}, ${kecamatan}, Kab. Way Kanan, ${postalCode}`;

    const cleanFirstName = item.name.replace(/^M\.\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const generatedUsername = `${cleanFirstName}${item.nis}`;
    const generatedPassword = `TJKT${item.nis}`;

    return {
      id: studentId,
      username: generatedUsername,
      password: generatedPassword,
      fullName: item.name,
      rfidCode: item.rfid,
      qrCode: generatedQr,
      class: item.cls,
      nis: item.nis,
      nisn: item.nisn,
      photoUrl: '', // Default Empty -> User Icon
      faceDataUrl: '',
      faceRegistered: false,
      previousSchool: item.cls === 'X' ? 'SMPN 1 Gunung Labuhan' : (item.cls === 'XI' ? 'SMP PGRI Gunung Labuhan' : 'MTs Manbaul Ulum'),
      gender: item.gender,
      birthPlace: 'Way Kanan',
      birthDate: item.birthDate,
      dob: `Way Kanan, ${item.birthDate}`,
      address: address,
      nik: `180802${String(100000000000 + idx + 1)}`,
      religion: 'Islam',
      streetAddress: streetAddress,
      rt: `0${rt}`,
      rw: `0${rw}`,
      dusun: dusun,
      kelurahan: kelurahan,
      kecamatan: kecamatan,
      postalCode: postalCode,
      fatherName: item.fatherName,
      fatherOccupation: 'Wiraswasta / Petani',
      fatherEducation: 'SMA/SMK Sederajat',
      fatherIncome: 'Rp. 1.500.000 - Rp. 2.500.000',
      fatherBirthYear: String(1978 + (idx % 6)),
      fatherNik: `180802${String(110000000000 + idx + 1)}`,
      motherName: item.motherName,
      motherOccupation: 'Ibu Rumah Tangga',
      motherEducation: 'SMA/SMK Sederajat',
      motherIncome: '< Rp. 500.000',
      motherBirthYear: String(1982 + (idx % 6)),
      motherNik: `180802${String(220000000000 + idx + 1)}`,
    };
  });

  return students;
};

export const mockStudents = (count: number, classes: string[], startId: number): Student[] => {
  return generateCleanStudents();
};

export const schoolData: AppData = {
  smkmu: {
    schoolInfo: smkmuSchoolInfo,
    teachers: smkmuTeachers,
    subjects: smkmuSubjects,
    schedule: smkmuSchedule,
    students: generateCleanStudents(),
  },
};


export const mockCalendarEvents: CalendarEvent[] = [
    // --- TAHUN 2024 ---
    { date: '2024-01-01', title: 'Tahun Baru 2024 Masehi', description: 'Libur Nasional - Awal Tahun Baru 2024', color: 'red' },
    { date: '2024-02-08', title: 'Isra Mi\'raj Nabi Muhammad SAW', description: 'Hari Besar Islam - 27 Rajab 1445 H', color: 'red' },
    { date: '2024-02-09', title: 'Cuti Bersama Tahun Baru Imlek', description: 'Libur Nasional', color: 'red' },
    { date: '2024-02-10', title: 'Tahun Baru Imlek 2575 Kongzili', description: 'Libur Nasional', color: 'red' },
    { date: '2024-03-11', title: 'Hari Suci Nyepi Tahun Baru Saka 1946', description: 'Libur Nasional', color: 'red' },
    { date: '2024-03-12', title: 'Cuti Bersama Hari Suci Nyepi', description: 'Libur Nasional', color: 'red' },
    { date: '2024-03-29', title: 'Wafat Isa Almasih', description: 'Libur Nasional - Jumat Agung', color: 'red' },
    { date: '2024-03-31', title: 'Hari Paskah', description: 'Libur Nasional', color: 'red' },
    { date: '2024-04-08', title: 'Cuti Bersama Idul Fitri 1445 H', description: 'Persiapan Hari Raya', color: 'red' },
    { date: '2024-04-09', title: 'Cuti Bersama Idul Fitri 1445 H', description: 'Persiapan Hari Raya', color: 'red' },
    { date: '2024-04-10', title: 'Hari Raya Idul Fitri 1445 H', description: '1 Syawal 1445 H - Hari Kemenangan', color: 'red' },
    { date: '2024-04-11', title: 'Hari Raya Idul Fitri 1445 H', description: '2 Syawal 1445 H', color: 'red' },
    { date: '2024-04-12', title: 'Cuti Bersama Idul Fitri 1445 H', description: 'Libur Nasional', color: 'red' },
    { date: '2024-04-15', title: 'Cuti Bersama Idul Fitri 1445 H', description: 'Libur Nasional', color: 'red' },
    { date: '2024-05-01', title: 'Hari Buruh Internasional', description: 'Libur Nasional', color: 'red' },
    { date: '2024-05-02', title: 'Hari Pendidikan Nasional', description: 'Peringatan Nasional (Hardiknas)', color: 'blue' },
    { date: '2024-05-09', title: 'Kenaikan Isa Almasih', description: 'Libur Nasional', color: 'red' },
    { date: '2024-05-10', title: 'Cuti Bersama Kenaikan Isa Almasih', description: 'Libur Nasional', color: 'red' },
    { date: '2024-05-20', title: 'Hari Kebangkitan Nasional', description: 'Peringatan Harkitnas', color: 'blue' },
    { date: '2024-05-23', title: 'Hari Raya Waisak 2568 BE', description: 'Libur Nasional', color: 'red' },
    { date: '2024-05-24', title: 'Cuti Bersama Hari Raya Waisak', description: 'Libur Nasional', color: 'red' },
    { date: '2024-06-01', title: 'Hari Lahir Pancasila', description: 'Libur Nasional', color: 'red' },
    { date: '2024-06-17', title: 'Hari Raya Idul Adha 1445 H', description: '10 Dzulhijjah 1445 H - Hari Raya Qurban', color: 'red' },
    { date: '2024-06-18', title: 'Cuti Bersama Hari Raya Idul Adha', description: 'Libur Nasional', color: 'red' },
    { date: '2024-07-07', title: 'Tahun Baru Islam 1446 H', description: '1 Muharram 1446 H', color: 'red' },
    { date: '2024-08-17', title: 'Hari Kemerdekaan RI ke-79', description: 'Libur Nasional - Dirgahayu Republik Indonesia', color: 'red' },
    { date: '2024-09-16', title: 'Maulid Nabi Muhammad SAW', description: 'Hari Besar Islam - 12 Rabiul Awal 1446 H', color: 'red' },
    { date: '2024-10-01', title: 'Hari Kesaktian Pancasila', description: 'Peringatan Nasional', color: 'blue' },
    { date: '2024-10-22', title: 'Hari Santri Nasional', description: 'Peringatan Nasional Resolusi Jihad', color: 'green' },
    { date: '2024-10-28', title: 'Hari Sumpah Pemuda', description: 'Peringatan Nasional', color: 'blue' },
    { date: '2024-11-10', title: 'Hari Pahlawan', description: 'Peringatan Nasional', color: 'blue' },
    { date: '2024-11-25', title: 'Hari Guru Nasional', description: 'HUT PGRI & Penghargaan Guru', color: 'green' },
    { date: '2024-12-22', title: 'Hari Ibu', description: 'Peringatan Nasional', color: 'blue' },
    { date: '2024-12-25', title: 'Hari Raya Natal', description: 'Libur Nasional', color: 'red' },
    { date: '2024-12-26', title: 'Cuti Bersama Hari Raya Natal', description: 'Libur Nasional', color: 'red' },

    // --- TAHUN 2025 ---
    { date: '2025-01-01', title: 'Tahun Baru 2025 Masehi', description: 'Libur Nasional', color: 'red' },
    { date: '2025-01-27', title: 'Isra Mi\'raj Nabi Muhammad SAW', description: 'Hari Besar Islam - 27 Rajab 1446 H', color: 'red' },
    { date: '2025-01-28', title: 'Cuti Bersama Tahun Baru Imlek', description: 'Libur Nasional', color: 'red' },
    { date: '2025-01-29', title: 'Tahun Baru Imlek 2576 Kongzili', description: 'Libur Nasional', color: 'red' },
    { date: '2025-03-28', title: 'Cuti Bersama Hari Suci Nyepi', description: 'Libur Nasional', color: 'red' },
    { date: '2025-03-29', title: 'Hari Suci Nyepi Tahun Baru Saka 1947', description: 'Libur Nasional', color: 'red' },
    { date: '2025-03-31', title: 'Hari Raya Idul Fitri 1446 H', description: '1 Syawal 1446 H (Estimasi)', color: 'red' },
    { date: '2025-04-01', title: 'Hari Raya Idul Fitri 1446 H', description: '2 Syawal 1446 H (Estimasi)', color: 'red' },
    { date: '2025-04-18', title: 'Wafat Isa Almasih', description: 'Libur Nasional - Jumat Agung', color: 'red' },
    { date: '2025-04-20', title: 'Hari Paskah', description: 'Libur Nasional', color: 'red' },
    { date: '2025-05-01', title: 'Hari Buruh Internasional', description: 'Libur Nasional', color: 'red' },
    { date: '2025-05-02', title: 'Hari Pendidikan Nasional', description: 'Peringatan Hardiknas 2025', color: 'blue' },
    { date: '2025-05-12', title: 'Hari Raya Waisak 2569 BE', description: 'Libur Nasional', color: 'red' },
    { date: '2025-05-13', title: 'Cuti Bersama Hari Raya Waisak', description: 'Libur Nasional', color: 'red' },
    { date: '2025-05-29', title: 'Kenaikan Isa Almasih', description: 'Libur Nasional', color: 'red' },
    { date: '2025-05-30', title: 'Cuti Bersama Kenaikan Isa Almasih', description: 'Libur Nasional', color: 'red' },
    { date: '2025-06-01', title: 'Hari Lahir Pancasila', description: 'Libur Nasional', color: 'red' },
    { date: '2025-06-06', title: 'Hari Raya Idul Adha 1446 H', description: '10 Dzulhijjah 1446 H (Estimasi)', color: 'red' },
    { date: '2025-06-09', title: 'Cuti Bersama Idul Adha', description: 'Libur Nasional', color: 'red' },
    { date: '2025-06-27', title: 'Tahun Baru Islam 1447 H', description: '1 Muharram 1447 H (Estimasi)', color: 'red' },
    { date: '2025-08-17', title: 'Hari Kemerdekaan RI ke-80', description: 'Libur Nasional - Dirgahayu RI', color: 'red' },
    { date: '2025-09-05', title: 'Maulid Nabi Muhammad SAW', description: '12 Rabiul Awal 1447 H (Estimasi)', color: 'red' },
    { date: '2025-10-22', title: 'Hari Santri Nasional', description: 'Peringatan Santri Indonesia', color: 'green' },
    { date: '2025-11-25', title: 'Hari Guru Nasional', description: 'Peringatan Guru Indonesia', color: 'green' },
    { date: '2025-12-25', title: 'Hari Raya Natal', description: 'Libur Nasional', color: 'red' },

    // --- TAHUN 2026 (Estimasi) ---
    { date: '2026-01-01', title: 'Tahun Baru 2026 Masehi', description: 'Libur Nasional', color: 'red' },
    { date: '2026-01-16', title: 'Isra Mi\'raj Nabi Muhammad SAW', description: 'Hari Besar Islam - 27 Rajab 1447 H', color: 'red' },
    { date: '2026-02-17', title: 'Tahun Baru Imlek 2577 Kongzili', description: 'Libur Nasional', color: 'red' },
    { date: '2026-03-19', title: 'Hari Suci Nyepi Saka 1948', description: 'Libur Nasional', color: 'red' },
    { date: '2026-03-20', title: 'Hari Raya Idul Fitri 1447 H', description: '1 Syawal 1447 H (Estimasi)', color: 'red' },
    { date: '2026-03-21', title: 'Hari Raya Idul Fitri 1447 H', description: '2 Syawal 1447 H (Estimasi)', color: 'red' },
    { date: '2026-04-03', title: 'Wafat Isa Almasih', description: 'Jumat Agung', color: 'red' },
    { date: '2026-04-05', title: 'Hari Paskah', description: 'Libur Nasional', color: 'red' },
    { date: '2026-05-01', title: 'Hari Buruh Internasional', description: 'Libur Nasional', color: 'red' },
    { date: '2026-05-02', title: 'Hari Pendidikan Nasional', description: 'Hardiknas 2026', color: 'blue' },
    { date: '2026-05-14', title: 'Kenaikan Isa Almasih', description: 'Libur Nasional', color: 'red' },
    { date: '2026-05-27', title: 'Hari Raya Idul Adha 1447 H', description: '10 Dzulhijjah 1447 H (Estimasi)', color: 'red' },
    { date: '2026-05-31', title: 'Hari Raya Waisak 2570 BE', description: 'Libur Nasional', color: 'red' },
    { date: '2026-06-01', title: 'Hari Lahir Pancasila', description: 'Libur Nasional', color: 'red' },
    { date: '2026-06-16', title: 'Tahun Baru Islam 1448 H', description: '1 Muharram 1448 H (Estimasi)', color: 'red' },
    { date: '2026-08-17', title: 'Hari Kemerdekaan RI ke-81', description: 'Libur Nasional', color: 'red' },
    { date: '2026-08-25', title: 'Maulid Nabi Muhammad SAW', description: '12 Rabiul Awal 1448 H (Estimasi)', color: 'red' },
    { date: '2026-10-22', title: 'Hari Santri Nasional', description: 'Resolusi Jihad PBNU', color: 'green' },
    { date: '2026-11-25', title: 'Hari Guru Nasional', description: 'HUT PGRI Ke-81', color: 'green' },
    { date: '2026-12-25', title: 'Hari Raya Natal', description: 'Libur Nasional', color: 'red' },
];

