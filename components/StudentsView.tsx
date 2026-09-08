
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { Student, School, Notification, SchoolInfo } from '../types';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, MenuIcon, DownloadIcon, ChevronDownIcon, ChevronUpIcon, ExcelIcon, FaceScanIcon, CameraIcon, XIcon, CalendarIcon, QrCodeIcon } from './icons/Icons';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { StudentForm } from './StudentForm';
import { LoadingSpinner } from './LoadingSpinner';
import { StudentCard, printStudentCardDirectly } from './StudentCard';
import { generateUniqueStudentQr, generateStudentQrDataUrl } from '../utils/qrHelper';
import { extractBiometricFeatures, detectFacePresence, invalidateStudentBiometricCache } from '../utils/faceBiometrics';

// Declare XLSX for global script
declare var XLSX: any;

interface StudentsViewProps {
  students: Student[];
  schoolType: School;
  onAdd: (school: School, studentData: Omit<Student, 'id'>) => Promise<void>;
  onEdit: (school: School, student: Student) => Promise<void>;
  onDelete: (school: School, id: string) => Promise<void>;
  onImportStudents: (school: School, students: Student[]) => Promise<void>;
  isProcessing: boolean;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}
    
const DetailRow: React.FC<{label:string, value:string|undefined}> = ({label, value}) => {
    if (!value || value === '-' || value.trim() === '') return null;
    return (
        <div className="grid grid-cols-3 border-b border-slate-100 py-1.5 text-xs sm:text-sm">
            <strong className="text-slate-500 font-semibold">{label}</strong>
            <span className="col-span-2 text-slate-800 font-medium">{value}</span>
        </div>
    );
};

export const StudentsView: React.FC<StudentsViewProps> = ({ students, schoolType, onAdd, onEdit, onDelete, onImportStudents, isProcessing, onMenuClick, notifications, onNotificationsOpen }) => {
    const baseClasses = ['X', 'XI', 'XII'];
    const classes = [...baseClasses, 'Semua'];
    
    const [selectedClass, setSelectedClass] = useState(baseClasses[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [detailStudent, setDetailStudent] = useState<Student | null>(null);
    const [cardStudent, setCardStudent] = useState<Student | null>(null);
    const [cardPrintTab, setCardPrintTab] = useState<'both' | 'front' | 'back'>('both');
    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
    const [formInstanceKey, setFormInstanceKey] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    
    // Bulk Print States
    const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Camera States
    const [isCapturingFace, setIsCapturingFace] = useState(false);
    const [scanTargetStudent, setScanTargetStudent] = useState<Student | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Unique QR Code Modal & Inspection States
    const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null);
    const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');
    const [isCopiedQr, setIsCopiedQr] = useState<boolean>(false);
    const [detailQrDataUrl, setDetailQrDataUrl] = useState<string>('');

    const openQrModal = async (student: Student) => {
        const qrValue = student.qrCode || generateUniqueStudentQr(student, students);
        const url = await generateStudentQrDataUrl(qrValue, { width: 350, margin: 1 });
        setQrModalStudent({ ...student, qrCode: qrValue });
        setQrModalDataUrl(url);
        setIsCopiedQr(false);
    };

    const handleCopyQrToken = (token: string) => {
        navigator.clipboard.writeText(token);
        setIsCopiedQr(true);
        setTimeout(() => setIsCopiedQr(false), 2500);
    };

    const handleDownloadQrImage = (student: Student, dataUrl: string) => {
        if (!dataUrl) return;
        const link = document.createElement('a');
        link.download = `QR_SMK_${student.class}_${student.fullName.replace(/\s+/g, '_')}_${student.nis || student.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (detailStudent) {
            const qrValue = detailStudent.qrCode || generateUniqueStudentQr(detailStudent, students);
            generateStudentQrDataUrl(qrValue, { width: 200, margin: 1 }).then(url => setDetailQrDataUrl(url));
        } else {
            setDetailQrDataUrl('');
        }
    }, [detailStudent, students]);

    // School Info for Card
    const schoolInfo: SchoolInfo = {
        name: 'SMK MANBAUL ULUM',
        officialName: 'SMK MANBAUL ULUM',
        address: 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan',
        headmaster: 'Muniroh', 
        majorProgram: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
        headOfMajor: 'Herlambang Lasena, S.T.',
        logoUrl: '', 
        vision: 'Mewujudkan lulusan SMK yang unggul, kompeten di bidang Teknik Jaringan Komputer dan Telekomunikasi (TJKT), berkarakter islami, mandiri, serta siap bersaing di dunia industri dan era digital global.',
        mission: '1. Menyelenggarakan pembelajaran kejuruan TJKT berbasis teknologi informasi terkini.\n2. Membekali siswa dengan sertifikasi keahlian jaringan, telekomunikasi, dan administrasi server.\n3. Menanamkan nilai-nilai akhlak mulia dan kedisiplinan kerja profesional.'
    };

    const INITIAL_DISPLAY_LIMIT = 12; 
    
    useEffect(() => {
      const firstClass = 'X';
      setSelectedClass(firstClass);
      setSearchQuery('');
      setExpandedClasses(new Set());
    }, [schoolType]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const studentCounts = useMemo(() => {
        const counts: Record<string, number> = { 'Semua': students.length };
        baseClasses.forEach(c => counts[c] = 0);
        students.forEach(student => {
            counts[student.class] = (counts[student.class] || 0) + 1;
        });
        return counts;
    }, [students, baseClasses]);
    
    const studentsByClass = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        const searchFiltered = lowercasedQuery
            ? students.filter(student =>
                student.fullName.toLowerCase().includes(lowercasedQuery) ||
                student.nis.toLowerCase().includes(lowercasedQuery) ||
                student.nisn.toLowerCase().includes(lowercasedQuery)
              )
            : students;

        const classFiltered = selectedClass !== 'Semua'
            ? searchFiltered.filter(student => student.class === selectedClass)
            : searchFiltered;

        const grouped = classFiltered.reduce((acc, student) => {
            (acc[student.class] = acc[student.class] || []).push(student);
            return acc;
        }, {} as Record<string, Student[]>);

        Object.keys(grouped).forEach(className => {
            grouped[className].sort((a, b) => a.fullName.localeCompare(b.fullName));
        });

        if (selectedClass === 'Semua') {
            const sortedGrouped: { [key: string]: Student[] } = {};
            baseClasses.forEach(className => {
                if (grouped[className]) sortedGrouped[className] = grouped[className];
            });
            return sortedGrouped;
        }

        return grouped;
    }, [students, selectedClass, baseClasses, searchQuery]);
    
    const filteredStudentsForPrint = useMemo(() => {
        // Flatten the grouped structure for bulk printing
        return Object.values(studentsByClass).flat();
    }, [studentsByClass]);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const openAddModal = () => {
        setEditingStudent(null);
        setFormInstanceKey(Date.now());
        setIsModalOpen(true);
    };
    
    const openEditModal = (student: Student) => {
        setEditingStudent(JSON.parse(JSON.stringify(student)));
        setFormInstanceKey(Date.now());
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<Student, 'id'>) => {
        if (editingStudent) {
            await onEdit(schoolType, { ...editingStudent, ...data });
        } else {
            await onAdd(schoolType, { ...data });
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (isProcessing) return;
        if (window.confirm('Hapus data siswa ini? Ini juga akan berdampak pada riwayat absensi dan nilai siswa tersebut.')) {
            await onDelete(schoolType, id);
        }
    };

    const handleExportToExcel = () => {
        const header1 = ['No', 'Nama Lengkap', 'JENJANG', 'KELAS', 'NIPD', 'JK', 'NISN', 'Tempat Lahir', 'Tanggal Lahir', 'NIK', 'Agama', 'Alamat', 'RT', 'RW', 'Dusun', 'Kelurahan', 'Kecamatan', 'Kode Pos', 'Data Ayah', '', '', '', '', '', 'Data Ibu', '', '', '', '', '', 'Sekolah Asal'];
        const header2 = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Nama', 'Tahun Lahir', 'Jenjang Pendidikan', 'Pekerjaan', 'Penghasilan', 'NIK', 'Nama', 'Tahun Lahir', 'Jenjang Pendidikan', 'Pekerjaan', 'Penghasilan', 'NIK', ''];
        const dataRows = students
            .filter(s => selectedClass === 'Semua' ? true : s.class === selectedClass)
            .map((student, index) => [
                index + 1, student.fullName, schoolType.toUpperCase(), student.class, student.nis, student.gender, student.nisn, student.birthPlace, student.birthDate, student.nik, student.religion, student.streetAddress, student.rt, student.rw, student.dusun, student.kelurahan, student.kecamatan, student.postalCode, student.fatherName, student.fatherBirthYear, student.fatherEducation, student.fatherOccupation, student.fatherIncome, student.fatherNik, student.motherName, student.motherBirthYear, student.motherEducation, student.motherOccupation, student.motherIncome, student.motherNik, student.previousSchool
            ]);
        const worksheet = XLSX.utils.aoa_to_sheet([header1, header2, ...dataRows]);
        worksheet['!merges'] = [{ s: { r: 0, c: 18 }, e: { r: 0, c: 23 } }, { s: { r: 0, c: 24 }, e: { r: 0, c: 29 } }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
        XLSX.writeFile(workbook, `data_siswa_${selectedClass}_${schoolType.toUpperCase()}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm(`Sistem akan mensinkronkan data berdasarkan kolom NIPD (NIS). Jika NIS sudah ada, data siswa lama akan diperbarui. Lanjutkan?`)) {
            e.target.value = '';
            return;
        }
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                let headerIndex = -1;
                for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
                    const row = rawRows[i].map(c => String(c || '').toLowerCase().trim());
                    if (row.some(cell => ['nama', 'jenjang', 'kelas', 'nipd'].some(kw => cell.includes(kw)))) {
                        headerIndex = i; break;
                    }
                }
                if (headerIndex === -1) throw new Error("Header kolom wajib tidak ditemukan.");
                const header = rawRows[headerIndex].map(c => String(c || '').toLowerCase().trim());
                const findIdx = (kw: string, after: number = -1) => header.findIndex((h, i) => i > after && h.includes(kw));
                const m = {
                    fullName: findIdx('nama'), jenjang: findIdx('jenjang'), kelas: findIdx('kelas'), nipd: findIdx('nipd'), jk: findIdx('jk'), nisn: findIdx('nisn'), pob: findIdx('tempat lahir'), dob: findIdx('tanggal lahir'), nik: findIdx('nik'), agama: findIdx('agama'), alamat: findIdx('alamat'), rt: findIdx('rt'), rw: findIdx('rw'), dusun: findIdx('dusun'), kelurahan: findIdx('kelurahan'), kecamatan: findIdx('kecamatan'), pos: findIdx('kode pos'),
                    fName: findIdx('nama', findIdx('kode pos')), fNik: findIdx('nik', findIdx('nama', findIdx('kode pos'))),
                    mName: findIdx('nama', findIdx('nik', findIdx('nama', findIdx('kode pos')))),
                    prevSchool: findIdx('asal')
                };
                const newStudents: Student[] = [];
                for (let i = headerIndex + 1; i < rawRows.length; i++) {
                    const row = rawRows[i];
                    const get = (idx: number) => (idx !== -1 && row[idx] !== undefined) ? String(row[idx]).trim() : '';
                    if (!get(m.fullName) || get(m.fullName) === '0' || get(m.fullName) === 'Nama Lengkap') continue;
                    const rowJenjang = get(m.jenjang).toLowerCase();
                    if (rowJenjang && !rowJenjang.includes(schoolType.toLowerCase())) continue;
                    const nis = get(m.nipd);
                    const stableId = nis ? `S-${nis}` : `S-${Date.now()}-${i}`;
                    const studentName = get(m.fullName);
                    const studentClass = get(m.kelas).toUpperCase();
                    const qrCode = generateUniqueStudentQr({
                        id: stableId,
                        nis: nis,
                        nisn: get(m.nisn),
                        fullName: studentName,
                        class: studentClass
                    }, students);

                    newStudents.push({
                        id: stableId, 
                        class: studentClass, 
                        fullName: studentName, 
                        nis: nis, 
                        nisn: get(m.nisn), 
                        qrCode: qrCode,
                        photoUrl: '', 
                        gender: (get(m.jk).toUpperCase().startsWith('L') ? 'L' : 'P'), 
                        birthPlace: get(m.pob), 
                        birthDate: get(m.dob), 
                        dob: [get(m.pob), get(m.dob)].filter(Boolean).join(', '), 
                        nik: get(m.nik), 
                        religion: get(m.agama), 
                        streetAddress: get(m.alamat), 
                        rt: get(m.rt), 
                        rw: get(m.rw), 
                        dusun: get(m.dusun), 
                        kelurahan: get(m.kelurahan), 
                        kecamatan: get(m.kecamatan), 
                        postalCode: get(m.pos), 
                        address: [get(m.alamat), get(m.dusun), get(m.kelurahan)].filter(s => s && s !== '0').join(', '), 
                        fatherName: get(m.fName), 
                        fatherOccupation: '-', 
                        motherName: get(m.mName), 
                        motherOccupation: '-', 
                        previousSchool: get(m.prevSchool)
                    });
                }
                if (newStudents.length > 0) { await onImportStudents(schoolType, newStudents); alert(`BERHASIL: ${newStudents.length} data siswa telah disinkronkan.`); }
            } catch (error) { alert("Gagal memproses file: " + (error instanceof Error ? error.message : "Format tidak sesuai.")); }
            finally { setIsImporting(false); e.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const toggleExpandClass = (className: string) => {
        setExpandedClasses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(className)) newSet.delete(className);
            else newSet.add(className);
            return newSet;
        });
    };

    const handlePrintCard = async () => {
        if (!cardStudent) return;
        const qrValue = cardStudent.qrCode || generateUniqueStudentQr(cardStudent, students);
        const qrUrl = await generateStudentQrDataUrl(qrValue, { width: 350, margin: 1 });
        printStudentCardDirectly(cardStudent, qrUrl, schoolInfo, cardPrintTab);
    };

    const handleBulkPrint = () => {
        if (filteredStudentsForPrint.length === 0) {
            alert("Tidak ada data siswa untuk dicetak.");
            return;
        }
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 1500); // Allow DOM to fully render
    };

    // --- CAMERA & FACE BIOMETRIC REGISTRATION FUNCTIONS ---
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isFaceUploading, setIsFaceUploading] = useState(false);

    const startCamera = async (student: Student) => {
        setScanTargetStudent(student);
        setIsCapturingFace(true);
        
        const strategies = [
            { video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } },
            { video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: { facingMode: facingMode } },
            { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' } },
            { video: true }
        ];

        let stream: MediaStream | null = null;
        for (const constraints of strategies) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream) break;
            } catch (err) {
                // fallback
            }
        }

        if (stream) {
            streamRef.current = stream;
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error(e));
                }
            }, 100);
        } else {
            alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan pada browser atau HP.");
            setIsCapturingFace(false);
            setScanTargetStudent(null);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCapturingFace(false);
        setScanTargetStudent(null);
    };

    const captureFace = async () => {
        if (videoRef.current && scanTargetStudent) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(videoRef.current, 0, 0);

                // Validasi keberadaan wajah manusia sebelum disimpan
                const presence = detectFacePresence(canvas);
                if (!presence.hasFace) {
                    alert("❌ Wajah tidak terdeteksi dengan jelas di kamera. Pastikan wajah menghadap lurus ke kamera dengan pencahayaan yang cukup sebelum mengambil foto.");
                    return;
                }
                
                const base64 = canvas.toDataURL('image/jpeg', 0.88); 
                const nowStr = new Date().toLocaleString('id-ID');
                const biometricHash = `BIO-FACE-${scanTargetStudent.nis || scanTargetStudent.id}-${Date.now().toString(36).toUpperCase()}`;

                // Ekstraksi fitur biometrik visual langsung
                const bioFeatures = await extractBiometricFeatures(canvas);
                const bioDescriptor = bioFeatures ? JSON.stringify(bioFeatures) : undefined;

                const updatedStudent: Student = { 
                    ...scanTargetStudent, 
                    faceDataUrl: base64,
                    faceRegistered: true,
                    faceRegisteredAt: nowStr,
                    faceBiometricHash: biometricHash,
                    faceBiometricDescriptor: bioDescriptor,
                    photoUrl: scanTargetStudent.photoUrl || base64
                };

                invalidateStudentBiometricCache(scanTargetStudent.id);
                onEdit(schoolType, updatedStudent);
                if (detailStudent && detailStudent.id === scanTargetStudent.id) {
                    setDetailStudent(updatedStudent);
                }
                stopCamera();
                alert(`✓ BERHASIL: Biometrik wajah ${scanTargetStudent.fullName} telah didaftarkan dan disimpan ke Master Data Siswa!`);
            }
        }
    };

    const handleUploadFacePhoto = (student: Student, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsFaceUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
                const nowStr = new Date().toLocaleString('id-ID');
                const biometricHash = `BIO-FACE-${student.nis || student.id}-${Date.now().toString(36).toUpperCase()}`;
                
                // Ekstraksi fitur biometrik visual dari foto
                const bioFeatures = await extractBiometricFeatures(base64);
                if (!bioFeatures) {
                    alert('❌ Foto tidak dapat diproses atau wajah tidak terdeteksi. Gunakan foto portrait yang jelas.');
                    setIsFaceUploading(false);
                    return;
                }
                const bioDescriptor = JSON.stringify(bioFeatures);

                const updatedStudent: Student = {
                    ...student,
                    faceDataUrl: base64,
                    faceRegistered: true,
                    faceRegisteredAt: nowStr,
                    faceBiometricHash: biometricHash,
                    faceBiometricDescriptor: bioDescriptor,
                    photoUrl: student.photoUrl || base64
                };
                invalidateStudentBiometricCache(student.id);
                onEdit(schoolType, updatedStudent);
                if (detailStudent && detailStudent.id === student.id) {
                    setDetailStudent(updatedStudent);
                }
                alert(`✓ BERHASIL: Foto biometrik wajah untuk ${student.fullName} berhasil disimpan!`);
            }
            setIsFaceUploading(false);
        };
        reader.onerror = () => {
            alert('Gagal membaca file gambar.');
            setIsFaceUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteFaceBiometric = (student: Student) => {
        if (window.confirm(`Hapus data biometrik wajah untuk ${student.fullName}? Siswa tidak dapat absen wajah sampai didaftarkan kembali.`)) {
            const updatedStudent: Student = {
                ...student,
                faceDataUrl: undefined,
                faceRegistered: false,
                faceRegisteredAt: undefined,
                faceBiometricHash: undefined,
                faceBiometricDescriptor: undefined
            };
            invalidateStudentBiometricCache(student.id);
            onEdit(schoolType, updatedStudent);
            if (detailStudent && detailStudent.id === student.id) {
                setDetailStudent(updatedStudent);
            }
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full animate-fade-in">
             <Modal isOpen={isModalOpen} onClose={isProcessing ? () => {} : closeModal} title={editingStudent ? 'Edit Data Siswa' : `Tambah Siswa Baru`} size="3xl">
                <StudentForm key={formInstanceKey} isModalOpen={isModalOpen} initialData={editingStudent} initialClass={selectedClass !== 'Semua' ? selectedClass : ''} schoolType={schoolType} onSave={handleSave} onCancel={closeModal} isProcessing={isProcessing} isEditMode={!!editingStudent} />
            </Modal>
            
            {/* BULK PRINT MODAL - CLEAN A4 ONLY */}
            <Modal isOpen={isBulkPrintModalOpen} onClose={() => setIsBulkPrintModalOpen(false)} title="Konfirmasi Cetak Massal" size="md">
                <div className="flex flex-col gap-6 p-2">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800 leading-relaxed">
                            Anda akan mencetak <strong>{filteredStudentsForPrint.length}</strong> kartu pelajar. 
                            Data yang dicetak sesuai dengan filter Kelas yang sedang aktif.
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="bg-slate-200 p-2 rounded-lg"><DownloadIcon className="w-5 h-5 text-slate-500" /></div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">Kertas A4 (210 x 297 mm)</p>
                                <p className="text-xs text-slate-500">Kapasitas: 5 Siswa per lembar (Depan & Belakang).</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic px-1">
                            * Pastikan pengaturan printer browser diset ke ukuran A4, Margin Default/None, dan aktifkan "Background Graphics".
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Batal</button>
                        <button onClick={() => { setIsBulkPrintModalOpen(false); handleBulkPrint(); }} className="px-6 py-2.5 rounded-xl bg-[#1e3a8a] text-white font-bold shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2">
                            <DownloadIcon className="w-5 h-5" /> Mulai Cetak
                        </button>
                    </div>
                </div>
            </Modal>

            {/* HIDDEN PRINT AREA FOR BULK PRINTING - OPTIMIZED FOR A4 5 CARDS/PAGE */}
            {isPrinting && (
                <div id="bulk-print-area" className="fixed top-0 left-0 w-full h-full bg-white z-[9999] overflow-auto print:block hidden">
                    <style>{`
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0mm;
                            }
                            body, html {
                                margin: 0;
                                padding: 0;
                                background-color: white;
                                width: 210mm;
                                height: 297mm;
                            }
                            body * {
                                visibility: hidden;
                            }
                            #bulk-print-area, #bulk-print-area * {
                                visibility: visible;
                            }
                            #bulk-print-area {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                            }
                            /* PAGE CONTAINER: EXACT A4 */
                            .print-page {
                                width: 210mm;
                                height: 296.5mm; /* Sedikit dikurangi dari 297mm untuk mencegah auto page break browser */
                                page-break-after: always;
                                break-after: page;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: flex-start;
                                padding-top: 10mm; /* Margin Atas Aman */
                                gap: 3mm; /* Jarak antar baris kartu */
                                overflow: hidden;
                                box-sizing: border-box;
                                background: white;
                            }
                            .print-page:last-child {
                                page-break-after: auto;
                                break-after: auto;
                            }
                            .card-wrapper {
                                display: flex;
                                flex-direction: row;
                                justify-content: center;
                                align-items: center;
                                width: 100%;
                                gap: 4mm; /* Jarak antar sisi Depan-Belakang */
                                break-inside: avoid;
                                page-break-inside: avoid;
                            }
                        }
                    `}</style>
                    
                    {Array.from({ length: Math.ceil(filteredStudentsForPrint.length / 5) }).map((_, pageIndex) => {
                        // A4 Fixed: 5 Siswa per halaman (10 sisi kartu)
                        const itemsPerPage = 5;
                        const startIndex = pageIndex * itemsPerPage;
                        const pageStudents = filteredStudentsForPrint.slice(startIndex, startIndex + itemsPerPage);

                        return (
                            <div key={pageIndex} className="print-page">
                                {pageStudents.map(student => (
                                    <div key={student.id} className="card-wrapper">
                                        <StudentCard student={student} schoolInfo={schoolInfo} isBulk={true} />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FULLSCREEN BIOMETRIC CAMERA MODAL */}
            {isCapturingFace && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in p-4">
                    <div className="relative w-full h-full max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
                        <div className="text-center mb-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black uppercase tracking-wider mb-1">
                                <FaceScanIcon className="w-4 h-4 text-blue-400" />
                                <span>Perekaman Biometrik Wajah Siswa</span>
                            </div>
                            {scanTargetStudent && (
                                <h3 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight">
                                    {scanTargetStudent.fullName} <span className="text-blue-400 text-sm font-bold font-mono">(Kelas {scanTargetStudent.class} • NIS: {scanTargetStudent.nis || '-'})</span>
                                </h3>
                            )}
                        </div>
                        
                        <div className="relative w-full aspect-video max-h-[55vh] bg-slate-950 rounded-3xl overflow-hidden border-4 border-blue-500/60 shadow-2xl flex items-center justify-center">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover scale-x-[-1]"
                            />

                            {/* Futuristic Biometric Frame */}
                            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div className="w-10 h-10 border-t-4 border-l-4 border-blue-400 rounded-tl-xl shadow-[0_0_10px_#3b82f6]"></div>
                                    <div className="w-10 h-10 border-t-4 border-r-4 border-blue-400 rounded-tr-xl shadow-[0_0_10px_#3b82f6]"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="w-10 h-10 border-b-4 border-l-4 border-blue-400 rounded-bl-xl shadow-[0_0_10px_#3b82f6]"></div>
                                    <div className="w-10 h-10 border-b-4 border-r-4 border-blue-400 rounded-br-xl shadow-[0_0_10px_#3b82f6]"></div>
                                </div>
                            </div>

                            {/* Oval Face Tracking Outline */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-blue-400/80 rounded-[50%] pointer-events-none flex items-center justify-center">
                                <div className="w-full h-0.5 bg-blue-400 shadow-[0_0_12px_#3b82f6] animate-pulse"></div>
                            </div>

                            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-black/60 text-blue-200 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg">
                                    Posisikan Wajah Tepat di Tengah Oval • Pencahayaan Cukup
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase backdrop-blur-md border border-white/20 transition-all"
                            >
                                Putar Kamera
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                            <button 
                                onClick={stopCamera} 
                                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <XIcon className="w-4 h-4"/> Batalkan
                            </button>
                            <button 
                                onClick={captureFace} 
                                className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:bg-blue-500 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CameraIcon className="w-5 h-5"/> Rekam & Simpan Biometrik Wajah
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={!!detailStudent} onClose={() => setDetailStudent(null)} title={`Detail: ${detailStudent?.fullName || ''}`} size="2xl">
                {detailStudent && (
                    <div className="relative -mt-4 animate-slide-up-fade">
                        {/* Header Profile */}
                        <div className="bg-slate-200/50 h-28 rounded-t-2xl"></div>
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full shadow-xl border-4 border-[#e0e5ec] bg-slate-200 flex items-center justify-center overflow-hidden">
                            {detailStudent.photoUrl ? <img src={detailStudent.photoUrl} alt={detailStudent.fullName} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-slate-400" />}
                        </div>
                        <div className="text-center pt-20 pb-4 px-4">
                             <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{detailStudent.fullName}</h3>
                             <div className="flex items-center justify-center gap-2 mt-2">
                                <p className="text-slate-500 font-semibold bg-blue-200/60 px-3 py-1 rounded-full text-xs sm:text-sm">Kelas {detailStudent.class}</p>
                                {detailStudent.faceDataUrl ? (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                                        <FaceScanIcon className="w-3.5 h-3.5 text-blue-600"/> Biometrik Wajah Aktif
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                                        <FaceScanIcon className="w-3.5 h-3.5 text-amber-600"/> Belum Daftar Wajah
                                    </span>
                                )}
                             </div>
                        </div>

                        {/* Content Details */}
                        <div className="px-6 pb-6 space-y-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                            
                            {/* Section 1: Biodata */}
                            <div>
                                <h4 className="font-black text-amber-600 mb-2 text-xs uppercase tracking-widest border-b border-amber-200 pb-1">Data Pribadi</h4>
                                <div className="space-y-0.5">
                                    <DetailRow label="NIS / NISN" value={`${detailStudent.nis || '-'} / ${detailStudent.nisn || '-'}`} />
                                    <DetailRow label="NIK Siswa" value={detailStudent.nik} />
                                    <DetailRow label="Jenis Kelamin" value={detailStudent.gender === 'L' ? 'Laki-laki' : detailStudent.gender === 'P' ? 'Perempuan' : '-'} />
                                    <DetailRow label="Tempat, Tanggal Lahir" value={`${detailStudent.birthPlace || ''}, ${detailStudent.birthDate || ''}`} />
                                    <DetailRow label="Agama" value={detailStudent.religion} />
                                    <DetailRow label="Sekolah Asal" value={detailStudent.previousSchool} />
                                </div>
                            </div>

                            {/* Section 2: Alamat */}
                            <div>
                                <h4 className="font-black text-blue-600 mb-2 text-xs uppercase tracking-widest border-b border-blue-200 pb-1">Alamat Lengkap</h4>
                                <div className="space-y-0.5">
                                    <DetailRow label="Jalan / Dukuh" value={detailStudent.streetAddress} />
                                    <DetailRow label="RT / RW" value={`${detailStudent.rt || '-'} / ${detailStudent.rw || '-'}`} />
                                    <DetailRow label="Dusun" value={detailStudent.dusun} />
                                    <DetailRow label="Kelurahan / Desa" value={detailStudent.kelurahan} />
                                    <DetailRow label="Kecamatan" value={detailStudent.kecamatan} />
                                    <DetailRow label="Kode Pos" value={detailStudent.postalCode} />
                                </div>
                            </div>

                            {/* Section 3: Data Orang Tua */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-black text-blue-600 mb-2 text-xs uppercase tracking-widest border-b border-blue-200 pb-1">Data Ayah</h4>
                                    <div className="space-y-0.5">
                                        <DetailRow label="Nama" value={detailStudent.fatherName} />
                                        <DetailRow label="NIK" value={detailStudent.fatherNik} />
                                        <DetailRow label="Tahun Lahir" value={detailStudent.fatherBirthYear} />
                                        <DetailRow label="Pendidikan" value={detailStudent.fatherEducation} />
                                        <DetailRow label="Pekerjaan" value={detailStudent.fatherOccupation} />
                                        <DetailRow label="Penghasilan" value={detailStudent.fatherIncome} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-black text-rose-600 mb-2 text-xs uppercase tracking-widest border-b border-rose-200 pb-1">Data Ibu</h4>
                                    <div className="space-y-0.5">
                                        <DetailRow label="Nama" value={detailStudent.motherName} />
                                        <DetailRow label="NIK" value={detailStudent.motherNik} />
                                        <DetailRow label="Tahun Lahir" value={detailStudent.motherBirthYear} />
                                        <DetailRow label="Pendidikan" value={detailStudent.motherEducation} />
                                        <DetailRow label="Pekerjaan" value={detailStudent.motherOccupation} />
                                        <DetailRow label="Penghasilan" value={detailStudent.motherIncome} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: DATA BIOMETRIK WAJAH (SCAN STATION INTEGRATION) */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
                                <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                                            <FaceScanIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-amber-900 text-xs uppercase tracking-wider">Identitas Biometrik Wajah (Scan Station)</h4>
                                            <p className="text-[10px] text-amber-700 font-semibold">Tersimpan di Master Data • Terintegrasi Otomatis dengan Scan Kiosk</p>
                                        </div>
                                    </div>
                                    {detailStudent.faceDataUrl ? (
                                        <span className="text-[9px] bg-blue-100 text-blue-800 font-black px-2.5 py-0.5 rounded-full uppercase border border-blue-300">
                                            ✓ Terdaftar
                                        </span>
                                    ) : (
                                        <span className="text-[9px] bg-amber-200 text-amber-900 font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-300">
                                            Belum Terdaftar
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-28 h-28 bg-white p-1 rounded-2xl shadow-md border-2 border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                                        {detailStudent.faceDataUrl ? (
                                            <img src={detailStudent.faceDataUrl} alt="Wajah Biometrik" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                                                <FaceScanIcon className="w-8 h-8 opacity-40 mb-1" />
                                                <span className="text-[9px] font-bold uppercase">Belum Ada Foto Wajah</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Status Biometrik:</span>
                                            {detailStudent.faceDataUrl ? (
                                                <p className="text-xs font-bold text-slate-800">
                                                    Wajah siswa telah tersimpan. Terdaftar pada: <span className="font-mono text-blue-700">{detailStudent.faceRegisteredAt || 'Master Database'}</span>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-600 font-medium">
                                                    Siswa belum memiliki data biometrik wajah. Rekam foto wajah melalui kamera atau unggah file foto agar siswa dapat menggunakan fitur Verifikasi Wajah di Scan Station.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                                            <button 
                                                type="button"
                                                onClick={() => startCamera(detailStudent)}
                                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                                            >
                                                <CameraIcon className="w-3.5 h-3.5" />
                                                {detailStudent.faceDataUrl ? 'Ambil Ulang Foto Kamera' : 'Ambil Foto Biometrik Kamera'}
                                            </button>

                                            <label className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95">
                                                <DownloadIcon className="w-3.5 h-3.5 rotate-180" />
                                                <span>{isFaceUploading ? 'Mengunggah...' : 'Unggah File Foto'}</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={(e) => handleUploadFacePhoto(detailStudent, e)} 
                                                    disabled={isFaceUploading}
                                                />
                                            </label>

                                            {detailStudent.faceDataUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFaceBiometric(detailStudent)}
                                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                                    title="Hapus Data Biometrik Wajah"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" /> Hapus
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Identitas Digital, QR Code & RFID Absensi */}
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-amber-50 p-4 rounded-2xl border border-blue-200">
                                <div className="flex items-center justify-between mb-3 border-b border-blue-200/60 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                                            <QrCodeIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-blue-800 text-xs uppercase tracking-wider">Identitas Digital, QR & RFID Absensi</h4>
                                            <p className="text-[10px] text-blue-600 font-semibold">Terenkripsi Unik • Integrated RFID Scanner • Kiosk Ready</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] bg-blue-200/70 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase">100% Valid</span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-md border border-blue-100 flex items-center justify-center flex-shrink-0">
                                        {detailQrDataUrl ? (
                                            <img src={detailQrDataUrl} alt="QR Code Siswa" className="w-full h-full object-contain" />
                                        ) : (
                                            <LoadingSpinner className="w-6 h-6 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Token Unik QR:</span>
                                                <code className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-900 select-all block truncate mt-0.5">
                                                    {detailStudent.qrCode || generateUniqueStudentQr(detailStudent, students)}
                                                </code>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">Kode Unix RFID:</span>
                                                <code className="text-xs font-mono font-bold bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300 text-amber-900 select-all block truncate mt-0.5">
                                                    {detailStudent.rfidCode || 'Belum diatur'}
                                                </code>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                                            <button 
                                                onClick={() => handleCopyQrToken(detailStudent.qrCode || generateUniqueStudentQr(detailStudent, students))}
                                                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                            >
                                                {isCopiedQr ? '✓ Token Tersalin' : 'Salin Token QR'}
                                            </button>
                                            {detailStudent.rfidCode && (
                                                <button 
                                                    onClick={() => handleCopyQrToken(detailStudent.rfidCode || '')}
                                                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                                >
                                                    Salin RFID
                                                </button>
                                            )}
                                            {detailQrDataUrl && (
                                                <button 
                                                    onClick={() => handleDownloadQrImage(detailStudent, detailQrDataUrl)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                                                >
                                                    <DownloadIcon className="w-3.5 h-3.5" /> Unduh QR (PNG)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2 flex items-center justify-center gap-3">
                                <button onClick={() => openQrModal(detailStudent)} className="py-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
                                    <QrCodeIcon className="w-4 h-4"/> Pratinjau QR Digital
                                </button>
                                <button onClick={() => { setDetailStudent(null); setCardStudent(detailStudent); }} className="py-2.5 px-6 rounded-xl bg-slate-800 text-white font-bold text-sm shadow-lg hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95">
                                    <UserIcon className="w-4 h-4"/> Cetak Kartu Pelajar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* DEDICATED QR CODE DIGITAL MODAL */}
            <Modal isOpen={!!qrModalStudent} onClose={() => setQrModalStudent(null)} title={`QR Code Absensi: ${qrModalStudent?.fullName || ''}`} size="md">
                {qrModalStudent && (
                    <div className="p-4 flex flex-col items-center text-center space-y-4 animate-scale-up">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-300 shadow-inner">
                            <QrCodeIcon className="w-7 h-7" />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{qrModalStudent.fullName}</h3>
                            <p className="text-xs font-bold text-blue-700 mt-0.5">Kelas {qrModalStudent.class} • NIS: {qrModalStudent.nis || '-'}</p>
                        </div>

                        {/* High Res QR Frame */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-blue-300 shadow-xl relative group">
                            {qrModalDataUrl ? (
                                <img src={qrModalDataUrl} alt="QR Code Siswa" className="w-56 h-56 object-contain" />
                            ) : (
                                <div className="w-56 h-56 flex items-center justify-center">
                                    <LoadingSpinner className="w-8 h-8 text-blue-600" />
                                </div>
                            )}
                            <div className="mt-2 text-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    Format: SMK MANBAUL ULUM STANDARD
                                </span>
                            </div>
                        </div>

                        {/* Unique Token display */}
                        <div className="w-full bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Unique QR Identification Token</p>
                            <code className="text-xs font-mono font-black text-slate-800 select-all block break-all">
                                {qrModalStudent.qrCode}
                            </code>
                        </div>

                        <div className="w-full flex flex-col sm:flex-row gap-2 pt-2">
                            <button
                                onClick={() => handleCopyQrToken(qrModalStudent.qrCode || '')}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                {isCopiedQr ? '✓ Token Tersalin!' : 'Salin Token'}
                            </button>
                            <button
                                onClick={() => handleDownloadQrImage(qrModalStudent, qrModalDataUrl)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                            >
                                <DownloadIcon className="w-4 h-4" /> Unduh QR (.PNG)
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* CARD PREVIEW MODAL */}
            <Modal isOpen={!!cardStudent} onClose={() => setCardStudent(null)} title="QR Code & Kartu Presensi Peserta Didik / Siswa" size="xl">
                {cardStudent && (
                    <div className="flex flex-col items-center gap-5 p-1 sm:p-2">
                        {/* View/Print Mode Selector Tabs */}
                        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200 no-print w-full max-w-md">
                            <button
                                type="button"
                                onClick={() => setCardPrintTab('both')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Depan & Belakang
                            </button>
                            <button
                                type="button"
                                onClick={() => setCardPrintTab('front')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'front' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Tampak Depan
                            </button>
                            <button
                                type="button"
                                onClick={() => setCardPrintTab('back')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'back' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Tampak Belakang
                            </button>
                        </div>

                        {/* Visual ID Card Preview Container */}
                        <div id="print-area" className="w-full flex items-center justify-center overflow-x-auto py-2">
                            <StudentCard 
                                student={cardStudent} 
                                schoolInfo={schoolInfo} 
                                activeTab={cardPrintTab} 
                            />
                        </div>

                        {/* Direct Print & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-3 w-full border-t border-slate-200 pt-4 no-print">
                            <button
                                type="button"
                                onClick={() => setCardStudent(null)}
                                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintCard}
                                className="py-2.5 px-5 rounded-xl text-xs font-black transition-all bg-slate-900 text-white shadow-md hover:bg-black flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <QrCodeIcon className="w-4 h-4 text-blue-400" />
                                <span>Cetak Kartu Pelajar ({cardPrintTab === 'both' ? 'Depan & Belakang' : cardPrintTab === 'front' ? 'Depan' : 'Belakang'})</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Card className="p-4 sm:p-5 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0 no-print-section">
                 <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    {/* Left Side */}
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                         <div className="flex items-center gap-4">
                             <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden"><MenuIcon className="w-6 h-6 text-slate-700" /></button>
                            <div className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]"><UserIcon className="w-8 h-8 text-amber-500"/></div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Data Siswa</h1>
                                <p className="text-slate-500 text-xs sm:text-sm">Manajemen Master Data & Kartu Pelajar.</p>
                            </div>
                         </div>
                    </div>
                    
                    {/* Right Side - Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                        <button title="Unduh Data" onClick={handleExportToExcel} className="py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 shimmer-active">
                            <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                            <span>Unduh</span>
                        </button>
                        
                        <button title="Tambah Siswa" onClick={openAddModal} disabled={selectedClass === 'Semua' || isProcessing} className="py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 flex items-center justify-center gap-2 disabled:bg-slate-400 shimmer-active">
                            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                            <span>Tambah Siswa</span>
                        </button>

                        <div className="h-8 w-px bg-slate-300 mx-1 hidden sm:block"></div>

                        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Cari Siswa..." />
                        
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </Card>

            <Card className="p-2 no-print-section">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-1 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] w-full">
                    <div className="flex flex-wrap gap-1 flex-1 w-full sm:w-auto justify-center sm:justify-start">
                        {classes.map(className => {
                            const count = studentCounts[className] || 0;
                            return (
                                <button key={className} type="button" onClick={() => setSelectedClass(className)} className={`flex-1 sm:flex-none py-1.5 px-4 text-center rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${ selectedClass === className ? 'bg-[#1e3a8a] text-white shadow-md shimmer-active' : 'text-slate-600 hover:bg-slate-300/50'}`}>
                                    {className} <span className={`ml-1 opacity-60 ${selectedClass === className ? 'text-white' : ''}`}>({count})</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <label title="Sinkron Excel" className={`w-full sm:w-auto py-1.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-blue-900 text-white shadow-md hover:bg-blue-950 cursor-pointer flex items-center justify-center gap-2 shimmer-active whitespace-nowrap ${isImporting ? 'opacity-50' : ''}`}>
                            {isImporting ? <LoadingSpinner className="w-4 h-4" /> : <ExcelIcon className="w-4 h-4 sm:w-5 sm:h-5"/>}
                            <span>Sinkron Excel</span>
                            <input type="file" accept=".xls,.xlsx" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
                        </label>
                        <button 
                            onClick={() => setIsBulkPrintModalOpen(true)} 
                            disabled={filteredStudentsForPrint.length === 0}
                            title="Cetak Massal"
                            className="w-full sm:w-auto py-1.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-indigo-600 text-white shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 shimmer-active whitespace-nowrap disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                            <span>Cetak Massal</span>
                        </button>
                    </div>
                </div>
            </Card>
            
            <Card className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_rgba(255,255,255,0.5)] no-print-section">
                <div className="space-y-5">
                    {Object.keys(studentsByClass).length > 0 ? (
                        Object.entries(studentsByClass).map(([className, classStudents]: [string, Student[]]) => {
                            const isExpanded = expandedClasses.has(className);
                            const visibleStudents = isExpanded ? classStudents : classStudents.slice(0, INITIAL_DISPLAY_LIMIT);
                            return (
                                <div key={className}>
                                    <h2 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-300/70 pb-1 flex justify-between items-center">
                                        Kelas {className}
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{classStudents.length} SISWA</span>
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {visibleStudents.map(student => (
                                            <Card key={student.id} className="p-2.5 group hover:bg-white transition-all border border-transparent hover:border-slate-200/50 cursor-pointer relative" onClick={() => setDetailStudent(student)}>
                                                {student.faceDataUrl && (
                                                    <div className="absolute top-2 right-2 text-blue-500" title="Data Wajah Terdaftar">
                                                        <FaceScanIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                                                        {student.photoUrl ? <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-slate-800 truncate text-xs sm:text-sm" title={student.fullName}>{student.fullName}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mt-0.5">NIS: {student.nis}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); openQrModal(student); }} className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Lihat & Download QR Code Siswa"><QrCodeIcon className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); startCamera(student); }} className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Scan Wajah"><CameraIcon className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setCardStudent(student); }} className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Kartu Pelajar"><UserIcon className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); openEditModal(student); }} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Edit Data"><EditIcon className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Hapus Data"><TrashIcon className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                    {classStudents.length > INITIAL_DISPLAY_LIMIT && (
                                        <div className="mt-4 text-center">
                                            <button onClick={() => toggleExpandClass(className)} className="py-2 px-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-white/60 text-slate-600 hover:text-blue-900 shadow-sm flex items-center gap-1.5 mx-auto">
                                                {isExpanded ? 'Ringkas' : `Lihat Semua (${classStudents.length})`}
                                                {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <UserIcon className="w-16 h-16 opacity-20 mb-2" />
                            <p className="font-bold uppercase tracking-widest text-xs">Data Tidak Ditemukan</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
