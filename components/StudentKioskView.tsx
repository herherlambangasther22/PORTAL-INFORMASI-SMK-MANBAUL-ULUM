import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './Card';
import { AppData, AttendanceLog, Student, CalendarEvent } from '../types';
import { 
    StudentIcon, 
    CheckCircleIcon, 
    XIcon, 
    UserIcon, 
    ClockIcon, 
    LogoutIcon, 
    TargetIcon, 
    ClipboardDocumentCheckIcon, 
    FaceScanIcon, 
    CameraIcon, 
    InfoIcon, 
    RfidCardIcon, 
    RfidSignalIcon, 
    TrashIcon, 
    QrCodeIcon,
    GlobeAltIcon,
    WifiIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    UploadIcon,
    SpeakerWaveIcon
} from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { matchStudentFromScan, matchTeacherFromScan } from '../utils/qrHelper';
import { verifyFaceAgainstStudents, verifyFaceAgainstTeachers, detectFacePresence, FACE_MATCH_THRESHOLD } from '../utils/faceBiometrics';
import { AttendanceScanResultModal, AttendanceScanResultData } from './AttendanceScanResultModal';
import { playAttendanceSound, speakAttendanceGreeting, speakAttendanceCheckout, speakAttendanceRejection, testVoiceAudio } from '../utils/audioFeedback';
import { attendanceSync } from '../utils/attendanceSync';
import { validateStudentDigitalAttendance } from '../utils/attendanceValidationHelper';
import { OFFICIAL_ATTENDANCE_TIME_RULES } from '../constants/attendanceTimeRules';
import { getClassTjktScheduleOnDay, normalizeClassNameKey, normalizeDayName } from '../utils/tjktScheduleHelper';
import { INDONESIAN_DAY_NAMES } from '../utils/attendanceReportHelper';
import jsQR from 'jsqr';

interface StudentKioskProps {
    appData: AppData;
    attendanceLog: AttendanceLog;
    onUpdateLog: (log: AttendanceLog) => void;
    calendarEvents: CalendarEvent[];
    onUpdateStudent?: (student: Student) => void;
    onBulkUpdateStudents?: (students: Student[]) => void;
}

type AttendanceMethod = 'rfid' | 'qr' | 'wajah';

const getWIBNow = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
};

const toWIB_YYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const DefaultPersonAvatar = ({ className = "w-full h-full" }: { className?: string }) => (
    <div className={`${className} bg-[#e0e5ec] shadow-inner flex items-center justify-center overflow-hidden`}>
        <UserIcon className="w-3/5 h-3/5 text-slate-400" />
    </div>
);

export const StudentKioskView: React.FC<StudentKioskProps> = ({ 
    appData, 
    attendanceLog, 
    onUpdateLog 
}) => {
    // 3 Metode Absensi: 'rfid' | 'qr' | 'wajah'
    const [selectedMethod, setSelectedMethod] = useState<AttendanceMethod>('rfid');
    // Mode Presensi: 'auto' (Otomatis: Masuk lalu Pulang), 'masuk' (Khusus Berangkat), 'pulang' (Khusus Pulang)
    const [kioskAttendanceMode, setKioskAttendanceMode] = useState<'auto' | 'masuk' | 'pulang'>('auto');

    const [scanInput, setScanInput] = useState('');
    const [qrScanInput, setQrScanInput] = useState('');
    
    // State Kamera & Scan Biometrik Wajah
    const [isScanningCam, setIsScanningCam] = useState(false);
    const [isCamLoading, setIsCamLoading] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'searching' | 'verifying' | 'detected'>('idle');
    const [faceMatchPercent, setFaceMatchPercent] = useState<number>(0);
    const [faceDetectedStudent, setFaceDetectedStudent] = useState<Student | null>(null);
    const [faceStatusText, setFaceStatusText] = useState<string>('Posisikan Wajah di Depan Kamera');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [faceVerificationError, setFaceVerificationError] = useState<{ title: string; msg: string; highestScore?: number; topCandidate?: string } | null>(null);

    const [activeResult, setActiveResult] = useState<AttendanceScanResultData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<{title: string, msg: string, code?: string} | null>(null);
    const [currentTime, setCurrentTime] = useState(getWIBNow());
    const [cooldown, setCooldown] = useState(false);
    const [audioTestNotice, setAudioTestNotice] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanTimeoutRef = useRef<any>(null); 
    const isFaceProcessingRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getWIBNow()), 1000);
        return () => clearInterval(timer);
    }, []);

    const allStudents = useMemo(() => (appData.smkmu || (appData as any).sdn5)?.students || [], [appData]);

    // Data siswa yang telah terdaftar biometrik wajahnya di Menu Data Siswa
    const enrolledFaceStudents = useMemo(() => {
        return allStudents.filter(s => s.faceRegistered || !!s.faceDataUrl || !!s.photoUrl);
    }, [allStudents]);

    // Network & LAN environment info
    const [networkInfo, setNetworkInfo] = useState(() => attendanceSync.getNetworkEnvironment());
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const photoUploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const updateNet = () => setNetworkInfo(attendanceSync.getNetworkEnvironment());
        window.addEventListener('online', updateNet);
        window.addEventListener('offline', updateNet);
        return () => {
            window.removeEventListener('online', updateNet);
            window.removeEventListener('offline', updateNet);
        };
    }, []);

    // Subscribe to cross-tab / cross-device synchronization in real time
    useEffect(() => {
        const unsubscribe = attendanceSync.subscribe((remoteLog, source) => {
            if (source !== 'local-tab') {
                onUpdateLog(remoteLog);
            }
        });
        return () => unsubscribe();
    }, [onUpdateLog]);

    // Hardware USB/OTG RFID & Barcode Scanner Keystroke Interceptor
    useEffect(() => {
        let keyBuffer = '';
        let lastKeyTime = 0;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && target.tagName === 'INPUT' && target !== inputRef.current && target !== qrInputRef.current) {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 150 && keyBuffer.length > 0) {
                keyBuffer = '';
            }
            lastKeyTime = now;

            if (e.key === 'Enter') {
                if (keyBuffer.trim().length >= 3) {
                    processRfidOrBarcode(keyBuffer.trim(), selectedMethod === 'qr' ? 'QR CODE' : 'RFID');
                    keyBuffer = '';
                    e.preventDefault();
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                keyBuffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [cooldown, selectedMethod, allStudents, attendanceLog]);

    // Audio Feedback for Scan (Loud & Clear Multi-Harmonic Confirmation or Buzzer Alert)
    const playScanBeep = (type: 'success' | 'error' | 'already' | 'reject' = 'success') => {
        playAttendanceSound(type);
    };

    // Auto autofocus & start camera on tab change
    useEffect(() => {
        if (selectedMethod === 'wajah') {
            startCameraScan();
        } else if (selectedMethod === 'qr') {
            startCameraScan();
            if (qrInputRef.current && !cooldown) qrInputRef.current.focus();
        } else if (selectedMethod === 'rfid') {
            stopCameraScan();
            if (inputRef.current && !cooldown) inputRef.current.focus();
        }
    }, [selectedMethod, facingMode]);

    // Keep RFID input focused
    useEffect(() => {
        if (selectedMethod === 'rfid' && !cooldown && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedMethod, cooldown, activeResult]);

    // Re-attach video stream whenever scanner is active to prevent any black screen
    useEffect(() => {
        if (isScanningCam && streamRef.current && videoRef.current) {
            if (videoRef.current.srcObject !== streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
            }
        }
    }, [isScanningCam, selectedMethod, facingMode, activeResult]);

    // Re-focus helper
    const handleGlobalClick = () => {
        if (selectedMethod === 'rfid' && inputRef.current && !cooldown) {
            inputRef.current.focus();
        } else if (selectedMethod === 'qr' && qrInputRef.current && !cooldown) {
            qrInputRef.current.focus();
        }
    };

    // Attendance Log list for today (Synchronized directly with master attendanceLog)
    const recentActivity = useMemo(() => {
        const todayKey = toWIB_YYYYMMDD(currentTime);
        const todayLog = attendanceLog[todayKey] || {};
        
        return Object.entries(todayLog)
            .map(([id, record]) => {
                const rec = (typeof record === 'object' ? record : { status: record }) as any;
                const student = allStudents.find(s => String(s.id) === String(id) || s.nis === id || (s.rfidCode && s.rfidCode === id));
                if (!student) return null;
                return {
                    studentId: id,
                    student,
                    status: rec.status || 'Hadir',
                    timestamp: rec.timestamp || '--:--',
                    checkInTime: rec.checkInTime || rec.timestamp || '--:--',
                    checkOutTime: rec.checkOutTime || null,
                    isLate: rec.isLate || false,
                    latenessMinutes: rec.latenessMinutes || 0,
                    method: rec.method || 'RFID',
                    sessionKey: rec.sessionKey || rec.sessionName || null
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .reverse();
    }, [attendanceLog, currentTime, allStudents]);

    // Grouping Log Absensi per Kelas dengan Urutan Presisi:
    // Kelas yang Memiliki Jam Pelajaran PERTAMA (Sesi Jam 1-2) DI ATAS
    // Kelas yang Memiliki Jam Pelajaran KETIGA (Sesi Jam 3-4) DI BAWAH
    const groupedActivityByClass = useMemo(() => {
        const dayIndex = currentTime.getDay();
        const rawDayName = INDONESIAN_DAY_NAMES[dayIndex] || 'Senin';

        // Kelompokkan log berdasarkan kelas siswa
        const mapByClass: Record<string, typeof recentActivity> = {};
        recentActivity.forEach(log => {
            const rawClass = log.student.class || 'X';
            const normClass = normalizeClassNameKey(rawClass);
            if (!mapByClass[normClass]) mapByClass[normClass] = [];
            mapByClass[normClass].push(log);
        });

        const classGroups = Object.entries(mapByClass).map(([classKey, logs]) => {
            const classSch = getClassTjktScheduleOnDay(appData.schedule, classKey, rawDayName);
            
            // Cek apakah kelas ini memiliki jadwal Sesi Jam 1-2 (Jam 1/2) atau Sesi Jam 3-4 (Jam 3/4)
            const hasSession1InSch = classSch.periods.some(p => Number(p.period) === 1 || Number(p.period) === 2);
            const hasSession2InSch = classSch.periods.some(p => Number(p.period) === 3 || Number(p.period) === 4);

            const hasSession1InLogs = logs.some(l => l.sessionKey === 'jam_1_2');
            const hasSession2InLogs = logs.some(l => l.sessionKey === 'jam_3_4');

            let sessionPriority = 99; // Default
            let sessionBadgeText = 'Sesi Pembelajaran TJKT';

            if (hasSession1InSch || hasSession1InLogs) {
                sessionPriority = 1; // Sesi Jam 1-2 (Jam Pertama) -> DI ATAS
                sessionBadgeText = 'Sesi Jam 1-2 (07:30 - 09:30 WIB)';
            } else if (hasSession2InSch || hasSession2InLogs) {
                sessionPriority = 2; // Sesi Jam 3-4 (Jam Ketiga) -> DI BAWAH
                sessionBadgeText = 'Sesi Jam 3-4 (10:00 - 12:00 WIB)';
            }

            return {
                classKey,
                sessionPriority,
                sessionBadgeText,
                logs
            };
        });

        // Urutkan grup kelas: Prioritas 1 (Jam Pertama) TAMPIL DI ATAS, Prioritas 2 (Jam Ketiga) TAMPIL DI BAWAH
        classGroups.sort((a, b) => {
            if (a.sessionPriority !== b.sessionPriority) {
                return a.sessionPriority - b.sessionPriority;
            }
            return a.classKey.localeCompare(b.classKey);
        });

        return classGroups;
    }, [recentActivity, currentTime, appData.schedule]);

    // Hapus Bersih Seluruh Log Absensi Siswa Hari Ini (Khusus Siswa)
    const handleClearTodayKioskLog = () => {
        const todayKey = toWIB_YYYYMMDD(currentTime);
        if (!attendanceLog[todayKey]) return;

        if (window.confirm(`HAPUS BERSIH LOG ABSENSI SISWA HARI INI (${todayKey})?\n\nSetelah dihapus, seluruh siswa dapat melakukan absensi kembali dari awal secara bersih.`)) {
            const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
            if (newLog[todayKey]) {
                // Hapus HANYA entri milik siswa
                allStudents.forEach(s => {
                    delete newLog[todayKey][s.id];
                    delete newLog[todayKey][`student-${s.id}`];
                    if (s.nis) delete newLog[todayKey][s.nis];
                });
                Object.keys(newLog[todayKey]).forEach(k => {
                    const rec = newLog[todayKey][k] as any;
                    if (rec && (rec.personType === 'student' || rec.studentId)) {
                        delete newLog[todayKey][k];
                    }
                });
                if (Object.keys(newLog[todayKey]).length === 0) {
                    delete newLog[todayKey];
                }
            }
            onUpdateLog(newLog);
            setActiveResult(null);
            setCooldown(false);
        }
    };

    // Hapus Log Absensi Individual untuk Satu Siswa (sehingga siswa tersebut bisa absen ulang)
    const handleDeleteSingleStudentLog = (studentId: string, studentName: string) => {
        const todayKey = toWIB_YYYYMMDD(currentTime);
        if (window.confirm(`Hapus log absensi untuk "${studentName}" hari ini?\n\nSetelah dihapus, siswa ini dapat melakukan absensi ulang.`)) {
            const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
            if (newLog[todayKey]) {
                delete newLog[todayKey][studentId];
                if (Object.keys(newLog[todayKey]).length === 0) {
                    delete newLog[todayKey];
                }
                onUpdateLog(newLog);
            }
        }
    };

    // Unified Attendance Processor (KHUSUS SISWA)
    const processRfidOrBarcode = (rawCode: string, methodUsed: string = 'RFID') => {
        if (!rawCode || cooldown) return;
        const code = rawCode.trim();
        if (!code) return;

        setErrorMessage(null);

        // 1. Cek terlebih dahulu apakah kode dipindai milik GURU -> REJECT LANGSUNG!
        const allTeachers = (appData.smkmu || (appData as any).sdn5)?.teachers || [];
        let matchedTeacher = matchTeacherFromScan(code, allTeachers);
        if (matchedTeacher) {
            playScanBeep('error');
            speakAttendanceRejection(`Identitas terdeteksi sebagai guru ${matchedTeacher.teacher.name}. Silakan gunakan portal guru.`);
            setErrorMessage(`AKSES DITOLAK: Identitas Terdeteksi Sebagai GURU (${matchedTeacher.teacher.name}). Silakan Absen di Portal Guru!`);
            setScanInput('');
            setQrScanInput('');
            setTimeout(() => setErrorMessage(null), 4000);
            return;
        }

        // 2. Cocokkan dengan Siswa
        let matchedStudent = matchStudentFromScan(code, allStudents);
        if (matchedStudent) {
            recordStudentAttendance(matchedStudent.student, methodUsed, code);
            setScanInput('');
            setQrScanInput('');
            return;
        }

        playScanBeep('error');
        speakAttendanceRejection('Identitas siswa tidak terdaftar di sistem.');
        setErrorMessage(`Identitas Siswa Tidak Dikenali: ${code}`);
        setScanInput('');
        setQrScanInput('');
        setTimeout(() => setErrorMessage(null), 3000);
    };

    const recordStudentAttendance = (student: Student, methodUsed: string, scannedCode?: string) => {
        const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
        const fullDateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const todayKey = toWIB_YYYYMMDD(currentTime);
        const todayLog = attendanceLog[todayKey] || {};
        
        // Pengecekan komprehensif log absensi siswa hari ini
        const existingEntry = Object.entries(todayLog).find(([k, val]) => {
            if (k === String(student.id) || k === student.nis || k === student.nisn || k === `student-${student.id}` || (student.rfidCode && k === student.rfidCode)) {
                return true;
            }
            if (val && typeof val === 'object') {
                const rec = val as any;
                if (rec.studentId === student.id || rec.nis === student.nis || (student.rfidCode && rec.rfidCode === student.rfidCode)) {
                    return true;
                }
            }
            return false;
        });

        const existingKey = existingEntry ? existingEntry[0] : student.id;
        const existingRecord = existingEntry ? ((typeof existingEntry[1] === 'object' ? existingEntry[1] : { status: existingEntry[1] }) as any) : undefined;

        // Validasi ketat berdasarkan jadwal mata pelajaran TJKT setiap kelas dan sesi waktu:
        // - Jam 1-2 (07:30 - 09:30): Masuk maks 08:00, Keluar 09:30 - 09:59 (kurang dari waktu itu langsung tolak)
        // - Jam 3-4 (10:00 - 12:00): Masuk maks 10:15, Keluar mulai 12:00 (kurang dari waktu itu langsung tolak)
        const validation = validateStudentDigitalAttendance({
            student,
            currentTime,
            schedule: appData.schedule,
            existingRecord,
            forcedMode: kioskAttendanceMode
        });

        if (!validation.canAttend) {
            playScanBeep('error');
            const reason = validation.rejectionReason || 'Tidak bisa melakukan absensi pada jam ini.';
            speakAttendanceRejection(reason);
            setErrorMessage(`${validation.rejectionTitle || 'TIDAK BISA MELAKUKAN ABSENSI'}: ${reason}`);
            setCooldown(true);
            setTimeout(() => setErrorMessage(null), 5000);
            setTimeout(() => setCooldown(false), 2000);
            return;
        }

        // JIKA LOLOS VALIDASI: ABSEN KELUAR
        if (validation.action === 'keluar') {
            const newLog = { ...attendanceLog };
            if (!newLog[todayKey]) newLog[todayKey] = {};
            newLog[todayKey][existingKey] = {
                ...(existingRecord || {}),
                checkOutTime: timeStr,
                checkOutMethod: methodUsed
            };
            onUpdateLog(newLog);
            attendanceSync.broadcastLogUpdate(newLog);

            playScanBeep('success');
            speakAttendanceCheckout(student);

            setActiveResult({
                personType: 'student',
                student,
                time: `${timeStr} WIB`,
                fullDate: fullDateStr,
                status: 'checkout',
                isLate: existingRecord?.isLate || false,
                latenessMinutes: existingRecord?.latenessMinutes || 0,
                methodUsed,
                checkInTime: existingRecord?.checkInTime || existingRecord?.timestamp,
                checkOutTime: `${timeStr} WIB`,
                rfidCode: scannedCode || student.rfidCode
            });
            setCooldown(true);
            setTimeout(() => setActiveResult(null), 3500);
            setTimeout(() => setCooldown(false), 2000);
            return;
        }

        // JIKA LOLOS VALIDASI: ABSEN MASUK
        const isLate = validation.isLate || false;
        const latenessMinutes = validation.latenessMinutes || 0;

        playScanBeep('success');
        speakAttendanceGreeting(student, isLate, false);
        const newLog = { ...attendanceLog };
        if (!newLog[todayKey]) newLog[todayKey] = {};
        
        newLog[todayKey][student.id] = {
            status: isLate ? 'Terlambat' : 'Hadir',
            timestamp: timeStr,
            checkInTime: timeStr,
            isLate,
            latenessMinutes,
            method: methodUsed,
            scanType: 'masuk',
            session: validation.sessionName,
            sessionLabel: validation.sessionLabel
        } as any;
        
        onUpdateLog(newLog);
        attendanceSync.broadcastLogUpdate(newLog);
        
        setActiveResult({
            personType: 'student',
            student,
            time: `${timeStr} WIB`,
            fullDate: fullDateStr,
            status: 'success',
            isLate,
            latenessMinutes,
            methodUsed,
            checkInTime: `${timeStr} WIB`,
            rfidCode: scannedCode || student.rfidCode
        });
        setCooldown(true);
        setTimeout(() => setActiveResult(null), 3500);
        setTimeout(() => setCooldown(false), 2000);
    };

    const recordAttendance = (student: Student, methodUsed: string, scannedCode?: string) => {
        recordStudentAttendance(student, methodUsed, scannedCode);
    };

    // Instant Photo / File Upload Fallback (Guarantees 100% scanner accessibility on LAN & Mobile)
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setErrorMessage(null);
        setFaceVerificationError(null);
        
        try {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
            
            await new Promise((resolve, reject) => {
                img.onload = () => resolve(true);
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 640;
            canvas.height = img.naturalHeight || 480;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (selectedMethod === 'qr') {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let code = jsQR(imgData.data, imgData.width, imgData.height, {
                    inversionAttempts: "attemptInvert"
                });
                if (code && code.data) {
                    processRfidOrBarcode(code.data, 'FOTO QR SCAN');
                } else {
                    playScanBeep('error');
                    speakAttendanceRejection('Kode QR tidak terdeteksi pada foto.');
                    setErrorMessage('QR Code tidak terdeteksi pada foto/gambar yang dipilih. Coba foto lebih dekat.');
                    setTimeout(() => setErrorMessage(null), 4000);
                }
            } else if (selectedMethod === 'wajah') {
                if (enrolledFaceStudents.length === 0) {
                    playScanBeep('error');
                    speakAttendanceRejection('Belum ada data siswa terdaftar.');
                    setFaceVerificationError({
                        title: "Belum Ada Wajah Terdaftar",
                        msg: "Database biometrik siswa masih kosong. Daftarkan foto siswa di Menu Siswa terlebih dahulu."
                    });
                    setTimeout(() => setFaceVerificationError(null), 4000);
                    return;
                }

                const result = await verifyFaceAgainstStudents(img, enrolledFaceStudents, FACE_MATCH_THRESHOLD);
                if (result.isVerified && result.student) {
                    recordStudentAttendance(result.student, 'FOTO VERIFIKASI WAJAH', result.student.rfidCode || result.student.id);
                } else {
                    playScanBeep('error');
                    speakAttendanceRejection('Wajah tidak cocok dengan data siswa.');
                    setFaceVerificationError({
                        title: "Wajah Tidak Cocok / Dikenali",
                        msg: `Hasil biometrik foto (${result.score}%) di bawah batas ambang (${FACE_MATCH_THRESHOLD}%). Pastikan foto terang & tampak depan.`
                    });
                    setTimeout(() => setFaceVerificationError(null), 4500);
                }
            }
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error('Error processing photo upload:', err);
        } finally {
            e.target.value = '';
        }
    };

    const startCameraScan = async () => {
        setCameraError(null);
        setIsCamLoading(true);
        setErrorMessage(null);
        setIsScanningCam(true);
        setCameraStatus('idle');
        setFaceMatchPercent(0);
        setFaceDetectedStudent(null);
        setFaceStatusText('Menginisialisasi Kamera Scanner...');
        isFaceProcessingRef.current = false;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             setCameraError({
                 title: "Kamera Tidak Didukung",
                 msg: "Perangkat atau browser tidak mendukung akses kamera. Pastikan aplikasi berjalan via HTTPS atau localhost dan berikan izin kamera."
             });
             setIsCamLoading(false);
             setIsScanningCam(false);
             return;
        }

        const strategies = [
            { video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } },
            { video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } } },
            { video: { facingMode: facingMode } },
            { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' } },
            { video: true } 
        ];

        let stream: MediaStream | null = null;

        for (const constraints of strategies) {
            try {
                // @ts-ignore
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream) break;
            } catch (err) {
                // continue fallback
            }
        }

        if (stream) {
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play error:", e));
                };
                videoRef.current.play().catch(() => {});
            }
            setIsCamLoading(false);
            setFaceStatusText('Kamera Aktif. Posisikan QR / Wajah di Depan Kamera.');
        } else {
            setIsCamLoading(false);
            setIsScanningCam(false);
            setCameraError({ 
                title: "Gagal Mengakses Kamera Perangkat", 
                msg: "Izin kamera tidak diberikan atau kamera sedang digunakan oleh aplikasi lain. Pastikan memberikan izin akses kamera pada browser/HP Anda."
            });
        }
    };

    const stopCameraScan = () => {
        if (streamRef.current) { 
            streamRef.current.getTracks().forEach(track => track.stop()); 
            streamRef.current = null; 
        }
        if (videoRef.current) { 
            videoRef.current.srcObject = null; 
        }
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
        }
        isFaceProcessingRef.current = false;
        setIsScanningCam(false);
        setCameraStatus('idle');
        setFaceMatchPercent(0);
        setFaceDetectedStudent(null);
        setFaceStatusText('Kamera Dinonaktifkan');
    };

    // Continuous auto QR scanner frame detection using multi-pass jsQR + BarcodeDetector
    useEffect(() => {
        if (selectedMethod !== 'qr' || !isScanningCam) return;
        
        let isCancelled = false;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const interval = setInterval(async () => {
            if (isCancelled || !videoRef.current || videoRef.current.readyState < 2 || cooldown) return;
            
            // 1. Native BarcodeDetector API if available
            if ('BarcodeDetector' in window) {
                try {
                    // @ts-ignore
                    const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] });
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes && barcodes.length > 0 && !isCancelled && !cooldown) {
                        const rawValue = barcodes[0].rawValue;
                        if (rawValue) {
                            processRfidOrBarcode(rawValue, 'QR CODE');
                            return;
                        }
                    }
                } catch (e) {
                    // Fallback to jsQR multi-pass
                }
            }

            // 2. High-speed multi-pass jsQR decoding
            if (videoRef.current && ctx && !cooldown) {
                try {
                    const video = videoRef.current;
                    const w = video.videoWidth || 640;
                    const h = video.videoHeight || 480;
                    if (w === 0 || h === 0) return;

                    if (canvas.width !== w) canvas.width = w;
                    if (canvas.height !== h) canvas.height = h;
                    ctx.drawImage(video, 0, 0, w, h);
                    const imgData = ctx.getImageData(0, 0, w, h);
                    
                    // Pass 1: Full frame decode
                    let code = jsQR(imgData.data, imgData.width, imgData.height, {
                        inversionAttempts: "attemptInvert",
                    });

                    // Pass 2: Center crop box decode (improves QR recognition for smaller codes / mobile screens)
                    if (!code) {
                        const cropW = Math.floor(w * 0.65);
                        const cropH = Math.floor(h * 0.65);
                        const cropX = Math.floor((w - cropW) / 2);
                        const cropY = Math.floor((h - cropH) / 2);
                        const cropData = ctx.getImageData(cropX, cropY, cropW, cropH);
                        code = jsQR(cropData.data, cropW, cropH, {
                            inversionAttempts: "attemptInvert",
                        });
                    }

                    if (code && code.data && !isCancelled && !cooldown) {
                        processRfidOrBarcode(code.data, 'QR CODE');
                    }
                } catch (err) {
                    // Ignore frame capture error
                }
            }
        }, 250);

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [selectedMethod, isScanningCam, cooldown, allStudents]);

    // AUTOMATIC FACE SCANNING CONTINUOUS LOOP (Auto detect dengan peringatan suara & visual)
    const lastVerificationTimeRef = useRef<number>(0);
    const lastFaceWarningTimeRef = useRef<number>(0);
    const faceUnmatchedStreakRef = useRef<number>(0);

    useEffect(() => {
        if (selectedMethod !== 'wajah' || !isScanningCam) return;

        let isCancelled = false;
        let scanTimer: NodeJS.Timeout | null = null;

        const runAutoFaceScan = async () => {
            if (isCancelled || cooldown || isFaceProcessingRef.current) return;
            if (Date.now() - lastVerificationTimeRef.current < 3500) return;
            if (Date.now() - lastFaceWarningTimeRef.current < 3800) return;
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            // 1. Deteksi apakah ada wajah manusia di depan kamera
            const presence = detectFacePresence(videoRef.current);
            if (!presence.hasFace) {
                faceUnmatchedStreakRef.current = 0;
                setCameraStatus('idle');
                setFaceStatusText('Posisikan Wajah di Depan Kamera');
                return;
            }

            // 2. Wajah terdeteksi di kamera!
            isFaceProcessingRef.current = true;
            setCameraStatus('searching');
            setFaceStatusText('🔍 Menganalisis Biometrik Wajah Siswa...');

            try {
                // A. Jika belum ada satupun siswa yang memiliki foto wajah biometrik
                if (enrolledFaceStudents.length === 0) {
                    faceUnmatchedStreakRef.current++;
                    if (faceUnmatchedStreakRef.current >= 3 && Date.now() - lastFaceWarningTimeRef.current > 4000) {
                        lastFaceWarningTimeRef.current = Date.now();
                        faceUnmatchedStreakRef.current = 0;
                        playScanBeep('error');
                        speakAttendanceRejection('Belum ada data siswa terdaftar.');
                        setCameraStatus('idle');
                        setFaceStatusText('⚠️ Peringatan: Belum Ada Data Wajah Terdaftar di Database Siswa');
                        setFaceVerificationError({
                            title: "Belum Ada Wajah Terdaftar",
                            msg: "Wajah Anda terdeteksi di kamera, namun database biometrik siswa masih kosong. Silakan daftarkan foto wajah siswa di Menu Data Siswa terlebih dahulu."
                        });
                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah di Depan Kamera');
                            isFaceProcessingRef.current = false;
                        }, 4000);
                        return;
                    }
                    isFaceProcessingRef.current = false;
                    return;
                }

                // B. Verifikasi wajah terhadap database siswa terdaftar
                const result = await verifyFaceAgainstStudents(videoRef.current, enrolledFaceStudents, FACE_MATCH_THRESHOLD);
                
                if (isCancelled) {
                    isFaceProcessingRef.current = false;
                    return;
                }

                // C. HASIL COCOK: Siswa Terverifikasi!
                if (result.isVerified && result.student) {
                    lastVerificationTimeRef.current = Date.now();
                    faceUnmatchedStreakRef.current = 0;
                    setCameraStatus('verifying');
                    setFaceMatchPercent(result.score);
                    setFaceDetectedStudent(result.student);
                    setFaceStatusText(`✓ Wajah Terverifikasi: ${result.student.fullName} (${result.score}%)`);

                    // Catat absensi & bunyikan sound sukses
                    recordAttendance(result.student, 'VERIFIKASI WAJAH', result.student.rfidCode || result.student.id);

                    setTimeout(() => {
                        setCameraStatus('idle');
                        setFaceMatchPercent(0);
                        setFaceDetectedStudent(null);
                        setFaceStatusText('Siap untuk Siswa Selanjutnya. Silakan Berdiri di Depan Kamera.');
                        isFaceProcessingRef.current = false;
                    }, 3000);
                    return;
                }

                // D. Cek apakah ini wajah GURU yang keliru scan di Kiosk Siswa
                const allTeachers = (appData.smkmu || (appData as any).sdn5)?.teachers || [];
                if (allTeachers.length > 0) {
                    const teacherCheck = await verifyFaceAgainstTeachers(videoRef.current, allTeachers, FACE_MATCH_THRESHOLD);
                    if (teacherCheck.isVerified && teacherCheck.teacher) {
                        lastFaceWarningTimeRef.current = Date.now();
                        faceUnmatchedStreakRef.current = 0;
                        playScanBeep('error');
                        speakAttendanceRejection(`Identitas terdeteksi sebagai guru ${teacherCheck.teacher.name}. Silakan gunakan portal guru.`);
                        setCameraStatus('idle');
                        setFaceDetectedStudent(null);
                        setFaceMatchPercent(teacherCheck.score);
                        setFaceStatusText(`❌ AKSES DITOLAK: TERDETEKSI WAJAH GURU`);
                        setFaceVerificationError({
                            title: "AKSES DITOLAK (KHUSUS SISWA)",
                            msg: `Wajah Anda terdeteksi sebagai Guru (${teacherCheck.teacher.name}). Silakan melakukan absensi di Portal Absensi Guru.`
                        });

                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah di Depan Kamera');
                            isFaceProcessingRef.current = false;
                        }, 4500);
                        return;
                    }
                }

                // E. WAJAH TIDAK COCOK / TIDAK DIKENALI
                faceUnmatchedStreakRef.current++;
                setFaceMatchPercent(result.score);

                // Jika wajah menatap kamera selama >= 3 sampling berturut-turut dan tetap tidak cocok:
                if (faceUnmatchedStreakRef.current >= 3 && Date.now() - lastFaceWarningTimeRef.current > 4000) {
                    lastFaceWarningTimeRef.current = Date.now();
                    faceUnmatchedStreakRef.current = 0;

                    // BUNYIKAN SOUND PERINGATAN KERAS & SUARA VOCAL!
                    playScanBeep('error');
                    speakAttendanceRejection('Wajah tidak cocok atau belum terdaftar.');
                    setCameraStatus('idle');
                    setFaceDetectedStudent(null);
                    
                    const topScore = result.score;
                    const topName = result.allRankedScores[0]?.student.fullName || 'Tidak Dikenali';

                    setFaceStatusText(`❌ PERINGATAN: WAJAH TIDAK DIKENALI (${topScore}%)`);
                    setFaceVerificationError({
                        title: "Peringatan: Wajah Tidak Dikenali",
                        msg: topScore > 0 
                            ? `Wajah terdeteksi di kamera namun tidak cocok dengan data siswa (Kemiripan ${topScore}% < batas ambang ${FACE_MATCH_THRESHOLD}%). Absensi ditolak.`
                            : "Wajah terdeteksi di kamera namun tidak terdaftar pada Master Data Siswa. Pastikan siswa telah terdaftar dengan foto wajah yang jelas.",
                        highestScore: topScore,
                        topCandidate: topName
                    });

                    setTimeout(() => {
                        setFaceVerificationError(null);
                        setFaceStatusText('Posisikan Wajah di Depan Kamera');
                        isFaceProcessingRef.current = false;
                    }, 4000);
                } else {
                    setFaceStatusText(`Mendeteksi Wajah... (${result.score}% - Posisikan Tegak)`);
                    isFaceProcessingRef.current = false;
                }
            } catch (e) {
                isFaceProcessingRef.current = false;
            }
        };

        scanTimer = setInterval(runAutoFaceScan, 400);

        return () => {
            isCancelled = true;
            if (scanTimer) clearInterval(scanTimer);
        };
    }, [selectedMethod, isScanningCam, cooldown, enrolledFaceStudents, appData]);

    // PROSES SCAN & VERIFIKASI BIOMETRIK WAJAH ASLI REAL-TIME UNTUK ABSENSI
    const triggerDirectFaceAttendance = async () => {
        if (isFaceProcessingRef.current || cooldown) return;
        
        setFaceVerificationError(null);
        setErrorMessage(null);

        // 1. Cek apakah ada data siswa yang telah terdaftar biometrik di Menu Data Siswa
        if (enrolledFaceStudents.length === 0) {
            playScanBeep('error');
            speakAttendanceRejection('Belum ada data siswa terdaftar.');
            setFaceStatusText('⚠️ Belum Ada Data Wajah Terdaftar di Menu Data Siswa');
            setFaceVerificationError({
                title: "Belum Ada Wajah Terdaftar",
                msg: "Tidak ada data wajah siswa terdaftar di Master Data Siswa. Rekam atau unggah foto wajah siswa di Menu Data Siswa terlebih dahulu."
            });
            return;
        }

        // 2. Sumber Frame Kamera Langsung
        let source: HTMLVideoElement | null = null;
        if (videoRef.current && isScanningCam && videoRef.current.readyState >= 2) {
            source = videoRef.current;
        }

        if (!source) {
            if (!isScanningCam) {
                startCameraScan();
            }
            setFaceStatusText('⚠️ Silakan Buka Kamera Terlebih Dahulu');
            return;
        }

        // Cek keberadaan wajah fisik di kamera
        const presence = detectFacePresence(source);
        if (!presence.hasFace) {
            playScanBeep('error');
            speakAttendanceRejection('Posisikan wajah tegak di depan kamera.');
            setFaceStatusText('❌ Tidak Ada Wajah Terdeteksi di Bingkai Kamera');
            setFaceVerificationError({
                title: "Wajah Tidak Terdeteksi",
                msg: "Posisikan wajah Anda tepat di dalam bingkai oval target dan pastikan pencahayaan cukup sebelum melakukan scan."
            });
            return;
        }

        isFaceProcessingRef.current = true;
        setCameraStatus('searching');
        setFaceStatusText('Menganalisis Biometrik Wajah di Depan Kamera...');
        setFaceMatchPercent(35);

        try {
            // Jalankan algoritma verifikasi visual multi-faktor terhadap seluruh data siswa terdaftar
            const result = await verifyFaceAgainstStudents(source, enrolledFaceStudents, FACE_MATCH_THRESHOLD);

            if (result.isVerified && result.student) {
                // HASIL COCOK: Wajah terverifikasi secara sah dengan tingkat kemiripan tinggi (>= 68%)
                setCameraStatus('verifying');
                setFaceMatchPercent(result.score);
                setFaceDetectedStudent(result.student);
                setFaceStatusText(`Mencocokkan Biometrik: ${result.student.fullName}...`);

                setTimeout(() => {
                    setCameraStatus('detected');
                    setFaceStatusText(`✓ Terverifikasi: ${result.student!.fullName} (Kemiripan ${result.score}%)`);
                    recordAttendance(result.student!, 'VERIFIKASI WAJAH', result.student!.rfidCode || result.student!.id);

                    setTimeout(() => {
                        setCameraStatus('idle');
                        setFaceMatchPercent(0);
                        setFaceDetectedStudent(null);
                        setFaceStatusText('Siap untuk Siswa Selanjutnya. Silakan Berdiri di Depan Kamera.');
                        isFaceProcessingRef.current = false;
                    }, 2800);
                }, 600);
            } else {
                // Cek terlebih dahulu apakah ini wajah GURU -> AKAN DITOLAK SEGERA
                const allTeachers = (appData.smkmu || (appData as any).sdn5)?.teachers || [];
                if (allTeachers.length > 0) {
                    const teacherCheck = await verifyFaceAgainstTeachers(source, allTeachers, FACE_MATCH_THRESHOLD);
                    if (teacherCheck.isVerified && teacherCheck.teacher) {
                        playScanBeep('error');
                        speakAttendanceRejection(`Identitas terdeteksi sebagai guru ${teacherCheck.teacher.name}. Silakan gunakan portal guru.`);
                        setCameraStatus('idle');
                        setFaceDetectedStudent(null);
                        setFaceMatchPercent(teacherCheck.score);
                        setFaceStatusText(`❌ AKSES DITOLAK: TERDETEKSI WAJAH GURU`);
                        setFaceVerificationError({
                            title: "AKSES DITOLAK (KHUSUS SISWA)",
                            msg: `Wajah Anda terdeteksi sebagai Guru (${teacherCheck.teacher.name}). Silakan melakukan absensi di Portal Absensi Guru.`
                        });

                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah di Depan Kamera');
                            isFaceProcessingRef.current = false;
                        }, 5000);
                        return;
                    }
                }

                // HASIL DITOLAK: Wajah Berbeda / Tidak Cocok dengan data siswa manapun
                playScanBeep('error');
                speakAttendanceRejection('Wajah tidak cocok dengan data siswa.');
                setCameraStatus('idle');
                setFaceDetectedStudent(null);
                setFaceMatchPercent(result.score);
                
                const topScore = result.score;
                const topName = result.allRankedScores[0]?.student.fullName || 'Tidak Dikenali';

                setFaceStatusText(`❌ Wajah Tidak Cocok (${topScore}% < ${FACE_MATCH_THRESHOLD}%)`);
                setFaceVerificationError({
                    title: "Peringatan: Wajah Tidak Dikenali / Tidak Cocok",
                    msg: topScore > 0 
                        ? `Tingkat kemiripan tertinggi hanya ${topScore}% (dengan ${topName}). Angka ini berada di bawah batas ambang validitas (${FACE_MATCH_THRESHOLD}%). Absensi ditolak karena data wajah tidak cocok.`
                        : "Fitur biometrik tidak dapat menemukan kecocokan wajah. Pastikan wajah menghadap lurus ke arah kamera dengan pencahayaan yang cukup.",
                    highestScore: topScore,
                    topCandidate: topName
                });

                setTimeout(() => {
                    setFaceVerificationError(null);
                    setFaceStatusText('Posisikan Wajah di Depan Kamera');
                    isFaceProcessingRef.current = false;
                }, 5000);
            }
        } catch (err) {
            console.error("Biometric scan error:", err);
            playScanBeep('error');
            setCameraStatus('idle');
            setFaceStatusText('Gagal memproses verifikasi biometrik.');
            isFaceProcessingRef.current = false;
        }
    };

    const handleCameraPlaying = () => {
        if (!isScanningCam) return;
        setFaceStatusText(selectedMethod === 'wajah' ? 'Kamera Siap • Posisikan Wajah di Depan Kamera' : 'Kamera Scanner QR Siap');
    };

    return (
        <div className="h-screen bg-slate-100 text-slate-800 p-3 sm:p-4 flex flex-col font-sans overflow-hidden" onClick={handleGlobalClick}>
            {/* Header Area */}
            <header className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-3 mb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <RfidSignalIcon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase tracking-tight">Terminal Scan Station Siswa</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                                SMK Manbaul Ulum
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                                {allStudents.length} Siswa Terintegrasi
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Network LAN / Public Status Indicator */}
                    <button
                        type="button"
                        onClick={() => setShowNetworkModal(true)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            networkInfo.isOnline
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Klik untuk melihat Status Jaringan LAN / Publik & Info Perangkat"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${networkInfo.isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${networkInfo.isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="hidden sm:inline">{networkInfo.isLan ? 'LAN Siaga' : 'Publik Online'}</span>
                        <span className="sm:hidden">Online</span>
                    </button>

                    {/* Audio & Spoken Voice Test Button */}
                    <button
                        type="button"
                        onClick={() => {
                            testVoiceAudio();
                            setAudioTestNotice(true);
                            setTimeout(() => setAudioTestNotice(false), 3200);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            audioTestNotice
                                ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        title="Klik untuk Menguji Suara Chime & Suara Ucapan Absensi (Membuka Izin Audio Browser Otomatis)"
                    >
                        <SpeakerWaveIcon className={`w-3.5 h-3.5 ${audioTestNotice ? 'text-purple-600 animate-pulse' : 'text-slate-600'}`} />
                        <span className="hidden md:inline">{audioTestNotice ? 'Memutar Suara...' : 'Uji Suara'}</span>
                        <span className="md:hidden">Suara</span>
                    </button>

                    <div className="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm sm:text-base font-semibold font-mono text-slate-800 tracking-tight">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                        </span>
                    </div>

                    <button 
                        type="button"
                        onClick={() => {
                            stopCameraScan();
                            window.location.hash = '';
                        }} 
                        className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 active:bg-rose-800 transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-98 cursor-pointer"
                        title="Keluar dari Scan Station dan kembali ke Menu Suite Utama"
                    >
                        <LogoutIcon className="w-4 h-4 text-white" /> Keluar Kiosk
                    </button>
                </div>
            </header>

            {/* Hidden Input for Instant Photo Snapshot & Offline File Fallback */}
            <input 
                ref={photoUploadInputRef} 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handlePhotoUpload} 
                className="hidden" 
            />

            {/* Network Diagnostic Modal */}
            {showNetworkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-scale-up">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                                    <GlobeAltIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 uppercase">Konektivitas Jaringan & Akses Perangkat</h3>
                                    <p className="text-xs text-slate-500">Akses Multi-Device (Mobile, Tablet, Desktop, & LAN)</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNetworkModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Tipe Jaringan</span>
                                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{networkInfo.isLan ? 'LAN / Lokal Intranet' : 'Jaringan Publik / Internet'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Status Protokol</span>
                                <span className={`font-bold text-sm mt-0.5 block ${networkInfo.isSecure ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {networkInfo.isSecure ? 'HTTPS / Secure Context' : 'HTTP Non-SSL'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Sinkronisasi Realtime</span>
                                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                                    {networkInfo.broadcastChannelSupported ? 'Broadcast Channel Aktif' : 'Storage Polling Siaga'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-slate-500 font-medium block">Kamera WebRTC</span>
                                <span className={`font-bold text-sm mt-0.5 block ${networkInfo.hasCamera ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {networkInfo.hasCamera ? 'Kamera Terdeteksi' : 'Gunakan Foto Snapshot'}
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase">
                                <DevicePhoneMobileIcon className="w-4 h-4 text-slate-700" />
                                <span>Petunjuk Akses dari HP / Laptop Lain di LAN:</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                                <li>Buka browser (Chrome / Safari) dan masukkan URL alamat server (contoh: <code>http://192.168.1.100:3000</code>).</li>
                                <li>Jika browser memblokir kamera live di HTTP, gunakan tombol <strong>"Ambil Foto Langsung"</strong> untuk scan QR / Biometrik tanpa kendala izin.</li>
                                <li>Semua data absensi tersinkronisasi otomatis di seluruh tab dan perangkat.</li>
                            </ul>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={() => setShowNetworkModal(false)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Tutup Info
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                {/* Official Time Rules Information Bar */}
                <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white p-2.5 sm:p-3 rounded-xl mb-3 shadow-md border border-blue-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-700/80 rounded-lg text-emerald-300 shadow-xs">
                            <ClockIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-bold text-white uppercase tracking-wider block text-[11px] sm:text-xs">
                                Ketentuan Resmi Absensi Digital (TJKT):
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-blue-100 font-medium">
                                Sesi Jam 1-2 (07:30 - 09:30): Masuk max 08:00 WIB • Keluar 09:30 - 09:45 WIB | Sesi Jam 3-4 (10:00 - 12:00): Masuk max 10:30 WIB • Keluar 12:00 WIB
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-100 bg-blue-950/70 px-2.5 py-1 rounded-lg border border-blue-600/60 flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Locked: Jam 1-2 (&gt;08:00) | Jam 3-4 (&gt;10:30)</span>
                    </div>
                </div>

                {/* Mode Selector Tabs (RFID / QR / WAJAH) - Warna Disamakan Dengan Panel Pemberitahuan di Atasnya */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            stopCameraScan();
                            setSelectedMethod('rfid');
                        }}
                        className={`p-3 rounded-xl font-semibold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                            selectedMethod === 'rfid' 
                                ? 'bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white border-blue-700 shadow-md hover:from-blue-900 hover:to-indigo-950' 
                                : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50 hover:text-blue-900 shadow-2xs'
                        }`}
                    >
                        <RfidCardIcon className={`w-4 h-4 ${selectedMethod === 'rfid' ? 'text-white' : 'text-blue-700'}`} />
                        <span>1. Scan Kartu RFID</span>
                        {selectedMethod === 'rfid' && <span className="text-[9px] bg-blue-950 text-blue-200 border border-blue-700 px-2 py-0.5 rounded font-medium ml-1">AKTIF</span>}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedMethod('qr');
                        }}
                        className={`p-3 rounded-xl font-semibold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                            selectedMethod === 'qr' 
                                ? 'bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white border-blue-700 shadow-md hover:from-blue-900 hover:to-indigo-950' 
                                : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50 hover:text-blue-900 shadow-2xs'
                        }`}
                    >
                        <QrCodeIcon className={`w-4 h-4 ${selectedMethod === 'qr' ? 'text-white' : 'text-blue-700'}`} />
                        <span>2. Scan QR Code</span>
                        {selectedMethod === 'qr' && <span className="text-[9px] bg-blue-950 text-blue-200 border border-blue-700 px-2 py-0.5 rounded font-medium ml-1">AKTIF</span>}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedMethod('wajah');
                        }}
                        className={`p-3 rounded-xl font-semibold uppercase text-xs sm:text-sm tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                            selectedMethod === 'wajah' 
                                ? 'bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-900 text-white border-blue-700 shadow-md hover:from-blue-900 hover:to-indigo-950' 
                                : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50 hover:text-blue-900 shadow-2xs'
                        }`}
                    >
                        <FaceScanIcon className={`w-4 h-4 ${selectedMethod === 'wajah' ? 'text-white' : 'text-blue-700'}`} />
                        <span>3. Verifikasi Wajah</span>
                        {selectedMethod === 'wajah' && <span className="text-[9px] bg-blue-950 text-blue-200 border border-blue-700 px-2 py-0.5 rounded font-medium ml-1">AKTIF</span>}
                    </button>
                </div>

                {/* RESULT MODAL POPUP OVERLAY */}
                {activeResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-scale-up">
                        <AttendanceScanResultModal 
                            result={activeResult} 
                            onClose={() => {
                                setActiveResult(null);
                                setCooldown(false);
                            }} 
                        />
                    </div>
                )}

                {/* MAIN INTERACTIVE KIOSK VIEW */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 items-stretch">
                        
                        {/* LEFT COLUMN: LOG AKTIVITAS (DIKELOMPOKKAN PER KELAS, SANGAT RAPI, KELAS JAM PERTAMA DI ATAS, KELAS JAM KETIGA DI BAWAH) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0">
                            <div className="flex-1 p-3.5 bg-white border border-blue-200/80 rounded-xl shadow-2xs flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-2.5 flex-shrink-0 border-b border-blue-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-blue-700" />
                                        <div>
                                            <h3 className="text-xs font-bold uppercase text-blue-950 tracking-wider">Log Aktivitas Absensi</h3>
                                            <p className="text-[10px] text-slate-500 font-medium">{recentActivity.length} Siswa Tercatat Hari Ini</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
                                            <span className="text-[8px] font-bold tracking-wider">LIVE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                    {groupedActivityByClass.length > 0 ? groupedActivityByClass.map((group, gIdx) => (
                                        <div key={gIdx} className="bg-slate-50/70 border border-blue-200/70 rounded-xl p-2.5 shadow-2xs">
                                            {/* Header Pengelompokan Kelas (Sesi Jam Pertama di Atas, Jam Ketiga di Bawah) */}
                                            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-blue-100">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 bg-blue-700 text-white font-black text-[10px] rounded uppercase tracking-wider shadow-2xs">
                                                        KELAS {group.classKey}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-blue-900 truncate">
                                                        {group.sessionBadgeText}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                    {group.logs.length} Siswa
                                                </span>
                                            </div>

                                            {/* Daftar Siswa di Kelas Ini */}
                                            <div className="space-y-1.5">
                                                {group.logs.map((log, idx) => (
                                                    <div key={idx} className="group relative flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-blue-50/50 border border-slate-200/90 transition-colors shadow-2xs">
                                                        <div className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                            {log.student?.photoUrl ? <img src={log.student.photoUrl} className="w-full h-full object-cover" /> : <DefaultPersonAvatar />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-[11px] font-bold text-slate-900 truncate uppercase leading-tight">{log.student?.fullName}</p>
                                                                <span className="text-[8px] bg-blue-50 border border-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-semibold uppercase flex-shrink-0">{log.method}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[9px] text-slate-600 mt-0.5 font-medium flex-wrap gap-x-1.5 gap-y-0.5">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    {log.isLate ? (
                                                                        <span className="text-amber-800 bg-amber-100/90 px-1 py-0.2 rounded font-bold border border-amber-300">
                                                                            Terlambat {log.latenessMinutes ? `(+${log.latenessMinutes}m)` : ''}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold border border-emerald-200">Hadir</span>
                                                                    )}
                                                                    <span>• Masuk: <span className="font-mono text-slate-800 font-bold">{log.checkInTime}</span></span>
                                                                    {log.checkOutTime ? (
                                                                        <span>• Keluar: <span className="font-mono text-blue-700 font-bold">{log.checkOutTime}</span></span>
                                                                    ) : (
                                                                        <span className="text-amber-700 font-semibold">• Belum Pulang</span>
                                                                    )}
                                                                </div>
                                                                {log.student?.rfidCode && <span className="text-slate-400 font-mono text-[8px]">[{log.student.rfidCode}]</span>}
                                                            </div>
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium text-center p-6">
                                            Belum ada aktivitas absensi siswa hari ini...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: DISPLAY OF THE CURRENT SELECTED SCANNER ONLY */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
                            
                            {/* 1. RFID SCAN KARTU MODE (HANYA PANEL SCAN KARTU RFID & STATUS - TEMA BIRU APLIKASI & SIMETRIS) */}
                            {selectedMethod === 'rfid' && (
                                <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center items-center border border-blue-200/90 rounded-2xl bg-white shadow-2xs min-h-0 overflow-y-auto custom-scrollbar gap-3 sm:gap-4">
                                    <div className="text-center flex-shrink-0 w-full flex flex-col items-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
                                            <RfidSignalIcon className="w-3.5 h-3.5 text-blue-700 animate-pulse" />
                                            <span>Reader RFID USB Aktif & Siap Siaga</span>
                                        </div>

                                        <h2 className="text-2xl sm:text-3xl font-bold text-blue-950 uppercase leading-none tracking-tight">Scan Kartu RFID Siswa</h2>
                                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1.5">
                                            Tempelkan Kartu Pelajar RFID pada USB Reader Scanner
                                        </p>
                                    </div>

                                    {/* Central RFID Graphic Visual (Tema Biru Aplikasi) */}
                                    <div className="my-1 sm:my-2 flex flex-col items-center justify-center flex-shrink-0">
                                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-blue-50/80 border-2 border-dashed border-blue-300 flex items-center justify-center shadow-inner">
                                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                                <RfidCardIcon className="w-9 h-9 text-white animate-pulse" />
                                            </div>
                                            <div className="absolute -bottom-3 bg-blue-700 text-white px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase shadow-sm border border-blue-500">
                                                TAP KARTU
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Field for USB Scanner Reader */}
                                    <div className="w-full relative max-w-lg flex-shrink-0">
                                        <form onSubmit={(e) => { e.preventDefault(); processRfidOrBarcode(scanInput, 'RFID'); }}>
                                            <input 
                                                ref={inputRef} 
                                                type="text" 
                                                inputMode="none"
                                                autoComplete="off"
                                                value={scanInput} 
                                                onChange={(e) => setScanInput(e.target.value)} 
                                                placeholder="Menunggu Pembacaan Kartu RFID..." 
                                                disabled={cooldown} 
                                                className={`w-full bg-slate-50 border ${errorMessage ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-blue-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20'} p-3.5 sm:p-4 rounded-xl text-blue-950 text-center text-base sm:text-lg font-mono font-bold focus:outline-none placeholder:text-slate-400 transition-all shadow-2xs`} 
                                            />
                                        </form>
                                        {errorMessage && (
                                            <div className="mt-2 text-center animate-shake z-30">
                                                <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold uppercase shadow-xs inline-block">{errorMessage}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Instructions Footer */}
                                    <div className="w-full max-w-lg bg-blue-50/80 p-2.5 sm:p-3 rounded-xl border border-blue-200 text-blue-900 text-[11px] text-center font-medium flex-shrink-0">
                                        <p>💡 Pastikan kartu RFID didekatkan pada sensor reader. Data siswa terhubung langsung secara otomatis dari Portal Data Siswa.</p>
                                    </div>
                                </div>
                            )}

                            {/* 2. SCAN QR CODE MODE (HANYA KAMERA SCANNER QR CODE & USB SCANNER - TEMA BIRU APLIKASI & SIMETRIS) */}
                            {selectedMethod === 'qr' && (
                                <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between items-center border border-blue-200/90 rounded-2xl bg-white shadow-2xs min-h-0 overflow-hidden">
                                    <div className="text-center flex-shrink-0 w-full pt-0.5 flex flex-col items-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                                            <QrCodeIcon className="w-3.5 h-3.5 text-blue-700" />
                                            <span>Scanner QR Code Real-Time</span>
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-blue-950 uppercase leading-none tracking-tight">Scan QR Code Siswa</h2>
                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-1">Arahkan Kartu QR Code Siswa ke Kamera / Scanner USB</p>
                                    </div>

                                    {/* PROPORTIONAL CAMERA VIEWPORT FOR QR SCAN (SIMETRIS, KONSISTEN, TANPA GEPENG) */}
                                    <div className="w-full flex-1 max-w-xl min-h-[200px] max-h-[340px] my-1.5 rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-600/80 relative flex items-center justify-center shadow-lg">
                                        {isCamLoading && (
                                            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2 text-white z-20">
                                                <LoadingSpinner className="text-blue-400 w-8 h-8" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Membuka Kamera Scanner...</span>
                                            </div>
                                        )}

                                        {isScanningCam ? (
                                            <>
                                                <video ref={videoRef} autoPlay playsInline muted onPlaying={handleCameraPlaying} className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'}`} />
                                                
                                                {/* Targeting Frame Box for QR */}
                                                <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between z-10">
                                                    <div className="flex justify-between">
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-l-4 border-blue-400 rounded-tl-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-r-4 border-blue-400 rounded-tr-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-l-4 border-blue-400 rounded-bl-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-r-4 border-blue-400 rounded-br-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                    </div>
                                                </div>

                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-48 sm:h-48 border-2 border-blue-400/90 rounded-2xl pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10">
                                                    <div className="w-full h-1 bg-blue-400 shadow-[0_0_16px_#60a5fa] animate-scan-laser-vertical"></div>
                                                    <span className="mt-auto mb-2 px-2 py-0.5 bg-blue-950/90 rounded-full text-[9px] font-bold text-white uppercase tracking-wider border border-blue-500/40">
                                                        Posisikan QR di Kotak
                                                    </span>
                                                </div>

                                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                                                    <span className="px-2.5 py-1 bg-blue-900/95 text-white border border-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                        AUTO-SCAN QR AKTIF
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-blue-950/80 text-blue-200 border border-blue-700 rounded-md text-[9px] font-medium uppercase tracking-wider">
                                                        Deteksi Otomatis
                                                    </span>
                                                </div>

                                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                                                        className="bg-blue-900/90 hover:bg-blue-800 text-white px-2.5 py-1 rounded text-[10px] font-medium uppercase border border-blue-600 transition-all shadow-sm cursor-pointer"
                                                    >
                                                        Putar Kamera
                                                    </button>
                                                    <button onClick={stopCameraScan} className="bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1 rounded text-[10px] font-semibold uppercase shadow-sm cursor-pointer">
                                                        Tutup
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={startCameraScan} className="w-full h-full flex flex-col items-center justify-center p-6 hover:bg-blue-950/40 transition-all text-white group cursor-pointer">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-900/80 border border-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                                    <CameraIcon className="w-6 h-6 text-blue-300" />
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">Aktifkan Kamera Scanner QR</span>
                                                <span className="text-[10px] text-blue-200 mt-0.5 uppercase font-normal">Klik untuk membuka kamera & deteksi otomatis</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* USB SCANNER / MANUAL CODE INPUT */}
                                    <div className="w-full max-w-xl flex items-center gap-2 mt-1 flex-shrink-0">
                                        <form onSubmit={(e) => { e.preventDefault(); processRfidOrBarcode(qrScanInput, 'QR CODE'); }} className="flex-1">
                                            <input
                                                ref={qrInputRef}
                                                type="text"
                                                value={qrScanInput}
                                                onChange={(e) => setQrScanInput(e.target.value)}
                                                placeholder="Input Kode QR Manual / Scan Barcode Scanner USB..."
                                                className="w-full bg-slate-50 border border-blue-200 py-1.5 px-3 rounded-xl text-center text-xs font-mono font-bold focus:border-blue-600 focus:bg-white focus:outline-none shadow-2xs"
                                            />
                                        </form>

                                        <button
                                            type="button"
                                            onClick={() => photoUploadInputRef.current?.click()}
                                            className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white text-blue-900 hover:bg-blue-50 border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                            title="Ambil Foto QR langsung via kamera HP atau unggah file gambar QR"
                                        >
                                            <UploadIcon className="w-3.5 h-3.5 text-blue-700" /> Foto QR
                                        </button>

                                        {!isScanningCam ? (
                                            <button
                                                type="button"
                                                onClick={startCameraScan}
                                                className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                            >
                                                <CameraIcon className="w-3.5 h-3.5 text-blue-100" /> Buka Kamera
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={stopCameraScan}
                                                className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                                            >
                                                <XIcon className="w-3.5 h-3.5 text-slate-600" /> Tutup Kamera
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 3. VERIFIKASI WAJAH MODE (HANYA KAMERA SCAN WAJAH & STATUS VERIFIKASI - TEMA BIRU APLIKASI & SIMETRIS) */}
                            {selectedMethod === 'wajah' && (
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between items-center border border-blue-200/90 rounded-2xl bg-white shadow-2xs min-h-0 overflow-hidden">
                                    {/* Header Info */}
                                    <div className="text-center flex-shrink-0 w-full pt-0 flex flex-col items-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[9px] font-bold uppercase tracking-wider mb-1">
                                            <FaceScanIcon className="w-3 h-3 text-blue-700" />
                                            <span>Scan Station Wajah • Hands-Free Auto-Scan</span>
                                        </div>

                                        <h2 className="text-lg sm:text-xl font-bold text-blue-950 uppercase leading-none tracking-tight">Absensi Verifikasi Wajah Siswa</h2>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                                            Hadapkan wajah ke kamera • Sistem memindai & mencatat otomatis secara instan
                                        </p>
                                    </div>

                                    {/* DIRECT LIVE CAMERA SCANNER VIEWPORT FOR FACE (PROPORTIONAL 4:3 CAMERA VIEWPORT - ZERO GEPENG) */}
                                    <div className="w-full flex-1 max-w-lg min-h-[200px] max-h-[350px] my-1.5 rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-600/80 relative flex items-center justify-center shadow-lg aspect-[4/3]">
                                        {isCamLoading && (
                                            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-30">
                                                <LoadingSpinner className="text-blue-400 w-8 h-8" />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Menghubungkan Kamera Scan...</span>
                                            </div>
                                        )}

                                        {cameraError && (
                                            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center text-white z-30">
                                                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl mb-2 border border-rose-500/30">
                                                    <XIcon className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-bold text-xs uppercase text-rose-400 mb-1">{cameraError.title}</h4>
                                                <p className="text-[11px] text-slate-300 max-w-md mb-3">{cameraError.msg}</p>
                                                <button onClick={startCameraScan} className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider shadow-sm cursor-pointer">
                                                    Coba Ulang Kamera
                                                </button>
                                            </div>
                                        )}

                                        {/* Biometric Verification Rejection Alert (Wajah Berbeda / Tidak Terdaftar) */}
                                        {faceVerificationError && (
                                            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white z-30 animate-scale-up">
                                                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-2">
                                                    <XIcon className="w-6 h-6" />
                                                </div>
                                                <span className="px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700 font-bold text-[8px] uppercase tracking-wider mb-1">
                                                    Verifikasi Ditolak
                                                </span>
                                                <h4 className="font-bold text-sm uppercase text-rose-300 mb-1 tracking-tight">
                                                    {faceVerificationError.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-300 max-w-md mb-3 leading-relaxed">
                                                    {faceVerificationError.msg}
                                                </p>
                                                <button 
                                                    onClick={() => setFaceVerificationError(null)} 
                                                    className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                                                >
                                                    Coba Lagi
                                                </button>
                                            </div>
                                        )}

                                        {isScanningCam ? (
                                            <>
                                                <video 
                                                    ref={videoRef} 
                                                    autoPlay 
                                                    playsInline 
                                                    muted 
                                                    onPlaying={handleCameraPlaying} 
                                                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'}`} 
                                                />
                                                
                                                {/* Clean Targeting Corners */}
                                                <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between z-10">
                                                    <div className="flex justify-between">
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-l-4 border-blue-400 rounded-tl-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-t-4 border-r-4 border-blue-400 rounded-tr-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-l-4 border-blue-400 rounded-bl-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                        <div className="w-7 h-7 sm:w-9 sm:h-9 border-b-4 border-r-4 border-blue-400 rounded-br-lg shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                                                    </div>
                                                </div>

                                                {/* Center Oval Face Alignment Frame (Sized proportionately to fit nicely inside 4:3 viewport) */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-48 sm:w-44 sm:h-56 border-2 border-dashed border-blue-400/90 rounded-[50%] pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-blue-950/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10">
                                                    <div className="w-full h-1 bg-blue-400 shadow-[0_0_16px_#60a5fa] animate-scan-laser-vertical"></div>
                                                    
                                                    {cameraStatus === 'verifying' && (
                                                        <div className="mt-3 text-center bg-blue-950/95 px-3.5 py-1.5 rounded-xl border border-blue-500/40 shadow-lg">
                                                            <span className="text-[8px] text-blue-200 font-semibold uppercase tracking-wider block">Mencocokkan Biometrik</span>
                                                            <span className="text-sm font-bold font-mono text-white">{faceMatchPercent}%</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Top Status Bar Over Camera */}
                                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                                                    <span className="px-2.5 py-1 bg-blue-900/95 text-white border border-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                        AUTO-SCAN WAJAH AKTIF
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-blue-950/80 text-blue-200 border border-blue-700 rounded-md text-[9px] font-medium uppercase tracking-wider">
                                                        {faceStatusText}
                                                    </span>
                                                </div>

                                                {/* Detected Success Overlay Card */}
                                                {cameraStatus === 'detected' && faceDetectedStudent && (
                                                    <div className="absolute inset-0 bg-slate-950/90 border-2 border-emerald-600 flex flex-col items-center justify-center p-4 text-center z-30 animate-scale-up">
                                                        <div className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-white overflow-hidden shadow-lg mb-2 flex items-center justify-center">
                                                            {faceDetectedStudent.photoUrl ? (
                                                                <img src={faceDetectedStudent.photoUrl} alt={faceDetectedStudent.fullName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <DefaultPersonAvatar />
                                                            )}
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider mb-1">
                                                            Wajah Terverifikasi {faceMatchPercent}%
                                                        </span>
                                                        <h3 className="text-base sm:text-lg font-bold text-white uppercase leading-tight tracking-tight">
                                                            {faceDetectedStudent.fullName}
                                                        </h3>
                                                        <p className="text-[11px] font-medium text-slate-300 uppercase mt-0.5">
                                                            Kelas {faceDetectedStudent.class} • TJKT SMK MU
                                                        </p>
                                                        <div className="mt-2 px-3 py-1 rounded-md bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                            <CheckCircleIcon className="w-3.5 h-3.5" /> Absensi Berhasil Tercatat
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Camera Controls inside overlay */}
                                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                                                        className="bg-blue-900/90 hover:bg-blue-800 text-white px-2.5 py-1 rounded text-[10px] font-medium uppercase border border-blue-600 transition-all shadow-sm cursor-pointer"
                                                        title="Ganti Kamera Depan/Belakang"
                                                    >
                                                        Putar Kamera
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={stopCameraScan} 
                                                        className="bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1 rounded text-[10px] font-semibold uppercase shadow-xs transition-all cursor-pointer"
                                                    >
                                                        Tutup
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={startCameraScan} 
                                                className="w-full h-full flex flex-col items-center justify-center p-6 hover:bg-blue-950/40 transition-all text-white group cursor-pointer"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-blue-900/80 border border-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                                    <FaceScanIcon className="w-6 h-6 text-blue-300" />
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">Aktifkan Kamera Scan Wajah</span>
                                                <span className="text-[10px] text-blue-200 mt-0.5 uppercase font-normal">Klik untuk membuka kamera & deteksi otomatis</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Pure Auto-Scan Info Banner (Tanpa Button Manual - 100% Otomatis & Konsisten) */}
                                    <div className="w-full max-w-lg flex items-center justify-between gap-2 mt-1 flex-shrink-0">
                                        <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                                            <span className="text-[11px] text-slate-600 font-medium truncate">
                                                Auto-scan aktif: Wajah dideteksi otomatis saat berada di depan kamera.
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => photoUploadInputRef.current?.click()}
                                            className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white text-blue-900 hover:bg-blue-50 border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                            title="Ambil Foto wajah langsung via kamera HP atau unggah file foto untuk verifikasi"
                                        >
                                            <UploadIcon className="w-3.5 h-3.5 text-blue-700" /> Foto Wajah
                                        </button>

                                        {!isScanningCam ? (
                                            <button
                                                type="button"
                                                onClick={startCameraScan}
                                                className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                            >
                                                <CameraIcon className="w-3.5 h-3.5 text-blue-100" /> Buka Kamera
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={stopCameraScan}
                                                className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                                            >
                                                <XIcon className="w-3.5 h-3.5 text-slate-600" /> Tutup Kamera
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
            </main>

            <footer className="mt-2 py-1 text-center flex-shrink-0 z-30 border-t border-slate-200 bg-slate-100">
                <p className="text-slate-500 text-[9px] font-medium uppercase tracking-widest">&copy; SMK MANBAUL ULUM • Terminal Scan Station Presensi Siswa</p>
            </footer>

            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
                .animate-shake { animation: shake 0.35s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};
