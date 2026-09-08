import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './Card';
import { AppData, AttendanceLog, Teacher, CalendarEvent } from '../types';
import { 
    TeacherIcon, 
    CheckCircleIcon, 
    XIcon, 
    UserIcon, 
    ClockIcon, 
    LogoutIcon, 
    TargetIcon, 
    FaceScanIcon, 
    CameraIcon, 
    InfoIcon, 
    RfidCardIcon, 
    RfidSignalIcon, 
    TrashIcon, 
    QrCodeIcon,
    BroadcastIcon,
    BoltIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    GlobeAltIcon,
    WifiIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    UploadIcon,
    SpeakerWaveIcon
} from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { matchTeacherFromScan, matchStudentFromScan } from '../utils/qrHelper';
import { verifyFaceAgainstTeachers, verifyFaceAgainstStudents, detectFacePresence, FACE_MATCH_THRESHOLD } from '../utils/faceBiometrics';
import { AttendanceScanResultModal, AttendanceScanResultData } from './AttendanceScanResultModal';
import { playAttendanceSound, speakAttendanceGreeting, speakAttendanceCheckout, speakAttendanceRejection, testVoiceAudio } from '../utils/audioFeedback';
import { attendanceSync } from '../utils/attendanceSync';
import jsQR from 'jsqr';

interface TeacherPortalProps {
    appData: AppData;
    attendanceLog: AttendanceLog;
    onUpdateLog: (log: AttendanceLog) => void;
    calendarEvents?: CalendarEvent[];
    onUpdateTeacher?: (teacher: Teacher) => void;
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

export const TeacherPortalView: React.FC<TeacherPortalProps> = ({ 
    appData, 
    attendanceLog, 
    onUpdateLog,
    calendarEvents = [],
    onUpdateTeacher
}) => {
    // 3 Metode Absensi: 'rfid' | 'qr' | 'wajah'
    const [selectedMethod, setSelectedMethod] = useState<AttendanceMethod>('rfid');

    const [scanInput, setScanInput] = useState('');
    const [qrScanInput, setQrScanInput] = useState('');
    
    // State Kamera & Scan Biometrik Wajah
    const [isScanningCam, setIsScanningCam] = useState(false);
    const [isCamLoading, setIsCamLoading] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'searching' | 'verifying' | 'detected'>('idle');
    const [faceMatchPercent, setFaceMatchPercent] = useState<number>(0);
    const [faceDetectedTeacher, setFaceDetectedTeacher] = useState<Teacher | null>(null);
    const [faceStatusText, setFaceStatusText] = useState<string>('Posisikan Wajah di Depan Kamera');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [faceVerificationError, setFaceVerificationError] = useState<{ title: string; msg: string; highestScore?: number; topCandidate?: string } | null>(null);

    const [activeResult, setActiveResult] = useState<AttendanceScanResultData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<{title: string, msg: string, code?: string} | null>(null);
    const [currentTime, setCurrentTime] = useState(getWIBNow());
    const [cooldown, setCooldown] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
    const [audioTestNotice, setAudioTestNotice] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isFaceProcessingRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getWIBNow()), 1000);
        return () => clearInterval(timer);
    }, []);

    const allTeachers = useMemo(() => (appData.smkmu || (appData as any).sdn5)?.teachers || [], [appData]);

    const enrolledFaceTeachers = useMemo(() => {
        return allTeachers.filter(t => t.faceRegistered || !!t.faceDataUrl || !!t.photoUrl);
    }, [allTeachers]);

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
    }, [cooldown, selectedMethod, allTeachers, attendanceLog]);

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

    // Re-attach video stream whenever scanner is active to guarantee no black screen
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

    const handleGlobalClick = () => {
        if (selectedMethod === 'rfid' && inputRef.current && !cooldown) {
            inputRef.current.focus();
        } else if (selectedMethod === 'qr' && qrInputRef.current && !cooldown) {
            qrInputRef.current.focus();
        }
    };

    // Day info (WIB)
    const dayNameIndo = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        return days[currentTime.getDay()];
    }, [currentTime]);

    const todayDateFormatted = useMemo(() => {
        return currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, [currentTime]);

    const currentTimeString = useMemo(() => {
        return currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/\./g, ':');
    }, [currentTime]);

    // Attendance Log list for today (Synchronized directly with master attendanceLog)
    const todayKey = useMemo(() => toWIB_YYYYMMDD(currentTime), [currentTime]);

    const recentActivity = useMemo(() => {
        const todayLog = attendanceLog[todayKey] || {};
        
        return Object.entries(todayLog)
            .map(([id, record]) => {
                const numId = parseInt(id);
                const teacher = allTeachers.find(t => t.id === numId || `G-${t.id}` === id || `teacher-${t.id}` === id);
                if (!teacher) return null;
                return {
                    teacherId: teacher.id,
                    teacher,
                    status: (record as any).status || 'Hadir',
                    timestamp: (record as any).timestamp || '--:--',
                    method: (record as any).method || 'RFID'
                };
            })
            .filter((item): item is { teacherId: number; teacher: Teacher; status: string; timestamp: string; method: string } => item !== null)
            .reverse();
    }, [attendanceLog, todayKey, allTeachers]);

    // Attendance stats
    const stats = useMemo(() => {
        const total = allTeachers.length;
        const presentCount = recentActivity.length;
        const presentPercent = total > 0 ? Math.round((presentCount / total) * 100) : 0;
        
        let onTimeCount = 0;
        let lateCount = 0;

        recentActivity.forEach(act => {
            const timeParts = act.timestamp.split(':');
            if (timeParts.length >= 2) {
                const hour = parseInt(timeParts[0]);
                const min = parseInt(timeParts[1]);
                // Batas jam masuk guru: 07:15 WIB
                if (hour < 7 || (hour === 7 && min <= 15)) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            } else {
                onTimeCount++;
            }
        });

        const remaining = Math.max(0, total - presentCount);

        return {
            total,
            presentCount,
            presentPercent,
            onTimeCount,
            lateCount,
            remaining
        };
    }, [allTeachers, recentActivity]);

    // Hapus Bersih Seluruh Log Absensi Guru Hari Ini
    const handleClearTodayLog = () => {
        const todayCount = recentActivity.length;
        if (todayCount === 0) return;

        if (window.confirm(`HAPUS BERSIH LOG ABSENSI GURU HARI INI (${todayKey})?\n\nJumlah Data: ${todayCount} guru.\nSetelah dihapus, seluruh guru dapat melakukan absensi kembali dari awal secara bersih.`)) {
            const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
            if (newLog[todayKey]) {
                // Hapus entri yang merupakan id guru atau bertipe teacher
                allTeachers.forEach(t => {
                    delete newLog[todayKey][t.id];
                    delete newLog[todayKey][`G-${t.id}`];
                    delete newLog[todayKey][`teacher-${t.id}`];
                });
                Object.keys(newLog[todayKey]).forEach(k => {
                    if (k.startsWith('G-') || k.startsWith('teacher-')) {
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

    // Hapus Log Absensi Individual untuk Satu Guru
    const handleDeleteSingleTeacherLog = (teacherId: number, teacherName: string) => {
        if (window.confirm(`Hapus log absensi untuk "${teacherName}" hari ini?\n\nSetelah dihapus, guru ini dapat melakukan absensi ulang.`)) {
            const newLog: AttendanceLog = JSON.parse(JSON.stringify(attendanceLog));
            if (newLog[todayKey]) {
                delete newLog[todayKey][teacherId];
                delete newLog[todayKey][`G-${teacherId}`];
                delete newLog[todayKey][`teacher-${teacherId}`];
                if (Object.keys(newLog[todayKey]).length === 0) {
                    delete newLog[todayKey];
                }
                onUpdateLog(newLog);
            }
        }
    };

    // Unified Attendance Processor (KHUSUS GURU)
    const processRfidOrBarcode = (rawCode: string, methodUsed: string = 'RFID') => {
        if (!rawCode || cooldown) return;
        const code = rawCode.trim();
        if (!code) return;

        setErrorMessage(null);

        // 1. Cek terlebih dahulu apakah kode dipindai milik SISWA -> REJECT LANGSUNG!
        const allStudents = (appData.smkmu || (appData as any).sdn5)?.students || [];
        let matchedStudent = matchStudentFromScan(code, allStudents);
        if (matchedStudent) {
            playScanBeep('error');
            speakAttendanceRejection(`Identitas terdeteksi sebagai siswa ${matchedStudent.student.fullName}. Silakan gunakan kiosk siswa.`);
            setErrorMessage(`AKSES DITOLAK: Identitas Terdeteksi Sebagai SISWA (${matchedStudent.student.fullName}). Silakan Absen di Kiosk Siswa!`);
            setScanInput('');
            setQrScanInput('');
            setTimeout(() => setErrorMessage(null), 4000);
            return;
        }

        // 2. Cocokkan dengan GURU
        let matched = matchTeacherFromScan(code, allTeachers);

        if (!matched) {
            playScanBeep('error');
            speakAttendanceRejection('Identitas guru tidak terdaftar di sistem.');
            setErrorMessage(`Identitas Guru Tidak Dikenali: ${code}`);
            setScanInput('');
            setQrScanInput('');
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        recordAttendance(matched.teacher, methodUsed, code);
        setScanInput('');
        setQrScanInput('');
    };

    const recordAttendance = (teacher: Teacher, methodUsed: string, scannedCode?: string) => {
        const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
        const fullDateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        // Cek keterlambatan (> 07:15)
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const isLate = (hour > 7 || (hour === 7 && minute > 15));
        const latenessMinutes = isLate ? ((hour - 7) * 60 + (minute - 15)) : 0;

        const todayLog = attendanceLog[todayKey] || {};

        // Pengecekan komprehensif log absensi guru hari ini
        const existingEntry = Object.entries(todayLog).find(([k, val]) => {
            if (k === String(teacher.id) || k === `G-${teacher.id}` || k === `teacher-${teacher.id}` || k === teacher.nip || (teacher.rfidCode && k === teacher.rfidCode)) {
                return true;
            }
            if (val && typeof val === 'object') {
                const rec = val as any;
                if (rec.teacherId === teacher.id || rec.nip === teacher.nip || (teacher.rfidCode && rec.rfidCode === teacher.rfidCode)) {
                    return true;
                }
            }
            return false;
        });

        if (existingEntry) {
            const existingKey = existingEntry[0];
            const existingRecord = (typeof existingEntry[1] === 'object' ? existingEntry[1] : { status: existingEntry[1] }) as any;
            const hasCheckIn = !!(existingRecord.checkInTime || existingRecord.timestamp);
            const hasCheckOut = !!existingRecord.checkOutTime;

            // Jika sudah ada jam masuk, belum ada jam pulang, dan jam >= 10 atau tengah malam
            if (hasCheckIn && !hasCheckOut && (hour >= 10 || hour === 0)) {
                const newLog = { ...attendanceLog };
                if (!newLog[todayKey]) newLog[todayKey] = {};
                newLog[todayKey][existingKey] = {
                    ...existingRecord,
                    checkOutTime: timeStr,
                    checkOutMethod: methodUsed
                };
                onUpdateLog(newLog);
                attendanceSync.broadcastLogUpdate(newLog);

                playScanBeep('success');
                speakAttendanceCheckout(teacher.name);

                setActiveResult({
                    personType: 'teacher',
                    teacher,
                    time: `${timeStr} WIB`,
                    fullDate: fullDateStr,
                    status: 'checkout',
                    methodUsed,
                    rfidCode: scannedCode || teacher.rfidCode,
                    isLate: existingRecord.isLate || false,
                    latenessMinutes: existingRecord.latenessMinutes || 0,
                    checkInTime: existingRecord.checkInTime || existingRecord.timestamp,
                    checkOutTime: `${timeStr} WIB`
                });
                setCooldown(true);
                setTimeout(() => setActiveResult(null), 3500);
                setTimeout(() => setCooldown(false), 2000);
                return;
            }

            playScanBeep('already');
            speakAttendanceGreeting(teacher.name, isLate, true);
            const recordedTime = existingRecord?.timestamp 
                ? (existingRecord.timestamp.includes('WIB') ? existingRecord.timestamp : `${existingRecord.timestamp} WIB`) 
                : `${timeStr} WIB`;

            setActiveResult({
                personType: 'teacher',
                teacher,
                time: recordedTime,
                fullDate: fullDateStr,
                status: 'already',
                methodUsed,
                rfidCode: scannedCode || teacher.rfidCode,
                isLate: existingRecord.isLate || false,
                latenessMinutes: existingRecord.latenessMinutes || 0,
                checkInTime: existingRecord?.checkInTime || existingRecord?.timestamp,
                checkOutTime: existingRecord?.checkOutTime
            });
            setCooldown(true);
            setTimeout(() => setActiveResult(null), 3500);
            setTimeout(() => setCooldown(false), 2000);
            return;
        }

        playScanBeep('success');
        speakAttendanceGreeting(teacher.name, isLate, false);
        const newLog = { ...attendanceLog };
        if (!newLog[todayKey]) newLog[todayKey] = {};
        
        newLog[todayKey][teacher.id] = {
            status: isLate ? 'Terlambat' : 'Hadir',
            timestamp: timeStr,
            checkInTime: timeStr,
            isLate,
            latenessMinutes,
            method: methodUsed,
            scanType: 'masuk'
        } as any;
        
        onUpdateLog(newLog);
        attendanceSync.broadcastLogUpdate(newLog);
        
        setActiveResult({
            personType: 'teacher',
            teacher,
            time: `${timeStr} WIB`,
            fullDate: fullDateStr,
            status: 'success',
            methodUsed,
            rfidCode: scannedCode || teacher.rfidCode,
            isLate,
            latenessMinutes,
            checkInTime: `${timeStr} WIB`
        });
        setCooldown(true);
        setTimeout(() => setActiveResult(null), 3500);
        setTimeout(() => setCooldown(false), 2000);
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
                if (enrolledFaceTeachers.length === 0) {
                    playScanBeep('error');
                    speakAttendanceRejection('Belum ada data guru terdaftar.');
                    setFaceVerificationError({
                        title: "Belum Ada Wajah Terdaftar",
                        msg: "Database biometrik guru masih kosong. Daftarkan foto guru di Menu Guru terlebih dahulu."
                    });
                    setTimeout(() => setFaceVerificationError(null), 4000);
                    return;
                }

                const result = await verifyFaceAgainstTeachers(img, enrolledFaceTeachers, FACE_MATCH_THRESHOLD);
                if (result.isVerified && result.teacher) {
                    recordAttendance(result.teacher, 'FOTO VERIFIKASI WAJAH', result.teacher.rfidCode || result.teacher.nip || String(result.teacher.id));
                } else {
                    playScanBeep('error');
                    speakAttendanceRejection('Wajah tidak cocok dengan data guru.');
                    setFaceVerificationError({
                        title: "Wajah Tidak Cocok / Dikenali",
                        msg: `Hasil biometrik foto (${result.score}%) di bawah batas ambang (${FACE_MATCH_THRESHOLD}%). Pastikan foto terang & tampak depan.`
                    });
                    setTimeout(() => setFaceVerificationError(null), 4500);
                }
            }
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error('Error processing teacher photo upload:', err);
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
        setFaceDetectedTeacher(null);
        setFaceStatusText('Menginisialisasi Kamera Scanner...');
        isFaceProcessingRef.current = false;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             setCameraError({
                 title: "Kamera Tidak Didukung",
                 msg: "Perangkat atau browser tidak mendukung akses kamera. Pastikan berjalan di HTTPS atau localhost dan berikan izin kamera."
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
            setFaceStatusText('Kamera Aktif. Posisikan QR / Wajah Guru di Depan Kamera.');
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
        isFaceProcessingRef.current = false;
        setIsScanningCam(false);
        setCameraStatus('idle');
        setFaceMatchPercent(0);
        setFaceDetectedTeacher(null);
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
            
            // 1. Try BarcodeDetector if available
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
                    // Fallback to jsQR
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
                    // Ignore canvas frame capture error
                }
            }
        }, 250);

        return () => {
            isCancelled = true;
            clearInterval(interval);
        };
    }, [selectedMethod, isScanningCam, cooldown, allTeachers]);

    // AUTOMATIC FACE ATTENDANCE CONTINUOUS SCAN LOOP (Auto scan wajah dengan peringatan suara & visual)
    const lastTeacherVerificationTimeRef = useRef<number>(0);
    const lastTeacherFaceWarningTimeRef = useRef<number>(0);
    const teacherFaceUnmatchedStreakRef = useRef<number>(0);

    useEffect(() => {
        if (selectedMethod !== 'wajah' || !isScanningCam) return;

        let isCancelled = false;
        let scanTimer: NodeJS.Timeout | null = null;

        const runAutoFaceScan = async () => {
            if (isCancelled || cooldown || isFaceProcessingRef.current) return;
            if (Date.now() - lastTeacherVerificationTimeRef.current < 3500) return;
            if (Date.now() - lastTeacherFaceWarningTimeRef.current < 3800) return;
            if (!videoRef.current || videoRef.current.readyState < 2) return;

            // 1. Deteksi apakah ada wajah manusia di depan kamera
            const presence = detectFacePresence(videoRef.current);
            if (!presence.hasFace) {
                teacherFaceUnmatchedStreakRef.current = 0;
                setCameraStatus('idle');
                setFaceStatusText('Posisikan Wajah Tegak di Dalam Bingkai Kamera');
                return;
            }

            // 2. Wajah terdeteksi di kamera!
            isFaceProcessingRef.current = true;
            setCameraStatus('searching');
            setFaceStatusText('🔍 Menganalisis Biometrik Wajah Guru...');

            try {
                const candidateTeachers = enrolledFaceTeachers.length > 0 ? enrolledFaceTeachers : allTeachers;
                
                // A. Jika belum ada data guru sama sekali
                if (candidateTeachers.length === 0) {
                    teacherFaceUnmatchedStreakRef.current++;
                    if (teacherFaceUnmatchedStreakRef.current >= 3 && Date.now() - lastTeacherFaceWarningTimeRef.current > 4000) {
                        lastTeacherFaceWarningTimeRef.current = Date.now();
                        teacherFaceUnmatchedStreakRef.current = 0;
                        playScanBeep('error');
                        speakAttendanceRejection('Belum ada data guru terdaftar.');
                        setCameraStatus('idle');
                        setFaceStatusText('⚠️ Peringatan: Belum Ada Data Guru Terdaftar');
                        setFaceVerificationError({
                            title: "Belum Ada Guru Terdaftar",
                            msg: "Wajah Anda terdeteksi di kamera, namun database guru masih kosong. Silakan tambahkan data guru terlebih dahulu."
                        });
                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah Tegak di Dalam Bingkai Kamera');
                            isFaceProcessingRef.current = false;
                        }, 4000);
                        return;
                    }
                    isFaceProcessingRef.current = false;
                    return;
                }

                // B. Verifikasi wajah terhadap database guru terdaftar
                const result = await verifyFaceAgainstTeachers(videoRef.current, candidateTeachers, FACE_MATCH_THRESHOLD);
                
                if (isCancelled) {
                    isFaceProcessingRef.current = false;
                    return;
                }

                // C. HASIL COCOK: Guru Terverifikasi!
                if (result.isVerified && result.teacher) {
                    lastTeacherVerificationTimeRef.current = Date.now();
                    teacherFaceUnmatchedStreakRef.current = 0;
                    setCameraStatus('verifying');
                    setFaceMatchPercent(result.score);
                    setFaceDetectedTeacher(result.teacher);
                    setFaceStatusText(`✓ Wajah Terverifikasi: ${result.teacher.name} (${result.score}%)`);

                    // Catat absensi & bunyikan sound sukses
                    recordAttendance(result.teacher, 'VERIFIKASI WAJAH', result.teacher.rfidCode || `G-${result.teacher.id}`);

                    setTimeout(() => {
                        setCameraStatus('idle');
                        setFaceMatchPercent(0);
                        setFaceDetectedTeacher(null);
                        setFaceStatusText('Siap untuk Guru Selanjutnya...');
                        isFaceProcessingRef.current = false;
                    }, 3000);
                    return;
                }

                // D. Cek apakah ini wajah SISWA yang keliru scan di Portal Guru
                const allStudents = (appData.smkmu || (appData as any).sdn5)?.students || [];
                if (allStudents.length > 0) {
                    const studentCheck = await verifyFaceAgainstStudents(videoRef.current, allStudents, FACE_MATCH_THRESHOLD);
                    if (studentCheck.isVerified && studentCheck.student) {
                        lastTeacherFaceWarningTimeRef.current = Date.now();
                        teacherFaceUnmatchedStreakRef.current = 0;
                        playScanBeep('error');
                        speakAttendanceRejection(`Identitas terdeteksi sebagai siswa ${studentCheck.student.fullName}. Silakan gunakan kiosk siswa.`);
                        setCameraStatus('idle');
                        setFaceDetectedTeacher(null);
                        setFaceMatchPercent(studentCheck.score);
                        setFaceStatusText(`❌ AKSES DITOLAK: TERDETEKSI WAJAH SISWA`);
                        setFaceVerificationError({
                            title: "AKSES DITOLAK (KHUSUS GURU)",
                            msg: `Wajah Anda terdeteksi sebagai Siswa (${studentCheck.student.fullName}). Silakan melakukan absensi di Kiosk Absensi Siswa.`
                        });

                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah Tegak di Dalam Bingkai Kamera');
                            isFaceProcessingRef.current = false;
                        }, 4500);
                        return;
                    }
                }

                // E. WAJAH TIDAK COCOK / TIDAK DIKENALI
                teacherFaceUnmatchedStreakRef.current++;
                setFaceMatchPercent(result.score);

                // Jika wajah menatap kamera selama >= 3 sampling berturut-turut dan tetap tidak cocok:
                if (teacherFaceUnmatchedStreakRef.current >= 3 && Date.now() - lastTeacherFaceWarningTimeRef.current > 4000) {
                    lastTeacherFaceWarningTimeRef.current = Date.now();
                    teacherFaceUnmatchedStreakRef.current = 0;

                    // BUNYIKAN SOUND PERINGATAN KERAS & SUARA VOCAL!
                    playScanBeep('error');
                    speakAttendanceRejection('Wajah tidak cocok atau belum terdaftar.');
                    setCameraStatus('idle');
                    setFaceDetectedTeacher(null);
                    
                    const topScore = result.score;
                    const topName = result.allRankedScores?.[0]?.teacher?.name || 'Tidak Dikenali';

                    setFaceStatusText(`❌ PERINGATAN: WAJAH TIDAK DIKENALI (${topScore}%)`);
                    setFaceVerificationError({
                        title: "Peringatan: Wajah Tidak Dikenali",
                        msg: topScore > 0 
                            ? `Wajah terdeteksi di kamera namun tidak cocok dengan data guru (Kemiripan ${topScore}% < batas ambang ${FACE_MATCH_THRESHOLD}%). Absensi ditolak.`
                            : "Wajah terdeteksi di kamera namun tidak terdaftar pada Master Data Guru. Pastikan foto wajah guru sudah terdaftar di sistem.",
                        highestScore: topScore,
                        topCandidate: topName
                    });

                    setTimeout(() => {
                        setFaceVerificationError(null);
                        setFaceStatusText('Posisikan Wajah Tegak di Dalam Bingkai Kamera');
                        isFaceProcessingRef.current = false;
                    }, 4000);
                } else {
                    setFaceStatusText(`Mendeteksi Wajah... (${result.score}% - Dekatkan ke Kamera)`);
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
    }, [selectedMethod, isScanningCam, cooldown, enrolledFaceTeachers, allTeachers, appData]);

    // PROSES SCAN & VERIFIKASI BIOMETRIK WAJAH GURU REAL-TIME UNTUK ABSENSI
    const triggerDirectFaceAttendance = async () => {
        if (isFaceProcessingRef.current || cooldown) return;
        
        setFaceVerificationError(null);
        setErrorMessage(null);

        // 1. Cek apakah ada data guru yang memiliki foto / biometrik
        if (enrolledFaceTeachers.length === 0 && allTeachers.length === 0) {
            playScanBeep('error');
            speakAttendanceRejection('Belum ada data guru terdaftar.');
            setFaceStatusText('⚠️ Belum Ada Data Guru Terdaftar');
            setFaceVerificationError({
                title: "Belum Ada Guru Terdaftar",
                msg: "Tidak ada data guru terdaftar di database. Tambahkan data guru terlebih dahulu."
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
                msg: "Posisikan wajah Anda tegak tepat di dalam bingkai oval target dan pastikan pencahayaan cukup sebelum melakukan scan."
            });
            return;
        }

        isFaceProcessingRef.current = true;
        setCameraStatus('searching');
        setFaceStatusText('Menganalisis Biometrik Wajah Guru di Depan Kamera...');
        setFaceMatchPercent(38);

        try {
            // Target verifikasi: gunakan guru yang punya foto/biometrik, atau fallback ke allTeachers
            const candidateTeachers = enrolledFaceTeachers.length > 0 ? enrolledFaceTeachers : allTeachers;
            const result = await verifyFaceAgainstTeachers(source, candidateTeachers, FACE_MATCH_THRESHOLD);

            if (result.isVerified && result.teacher) {
                // HASIL COCOK
                setCameraStatus('verifying');
                setFaceMatchPercent(result.score);
                setFaceDetectedTeacher(result.teacher);
                setFaceStatusText(`Mencocokkan Biometrik: ${result.teacher.name}...`);

                setTimeout(() => {
                    setCameraStatus('detected');
                    setFaceStatusText(`✓ Terverifikasi: ${result.teacher!.name} (Kemiripan ${result.score}%)`);
                    recordAttendance(result.teacher!, 'VERIFIKASI WAJAH', result.teacher!.rfidCode || `G-${result.teacher!.id}`);

                    setTimeout(() => {
                        setCameraStatus('idle');
                        setFaceMatchPercent(0);
                        setFaceDetectedTeacher(null);
                        setFaceStatusText('Siap untuk Guru Selanjutnya. Silakan Berdiri di Depan Kamera.');
                        isFaceProcessingRef.current = false;
                    }, 2800);
                }, 600);
            } else {
                // Cek terlebih dahulu apakah ini wajah SISWA -> AKAN DITOLAK SEGERA
                const allStudents = (appData.smkmu || (appData as any).sdn5)?.students || [];
                if (allStudents.length > 0) {
                    const studentCheck = await verifyFaceAgainstStudents(source, allStudents, FACE_MATCH_THRESHOLD);
                    if (studentCheck.isVerified && studentCheck.student) {
                        playScanBeep('error');
                        speakAttendanceRejection(`Identitas terdeteksi sebagai siswa ${studentCheck.student.fullName}. Silakan gunakan kiosk siswa.`);
                        setCameraStatus('idle');
                        setFaceDetectedTeacher(null);
                        setFaceMatchPercent(studentCheck.score);
                        setFaceStatusText(`❌ AKSES DITOLAK: TERDETEKSI WAJAH SISWA`);
                        setFaceVerificationError({
                            title: "AKSES DITOLAK (KHUSUS GURU)",
                            msg: `Wajah Anda terdeteksi sebagai Siswa (${studentCheck.student.fullName}). Silakan melakukan absensi di Kiosk Absensi Siswa.`
                        });

                        setTimeout(() => {
                            setFaceVerificationError(null);
                            setFaceStatusText('Posisikan Wajah Tegak di Dalam Bingkai Kamera');
                            isFaceProcessingRef.current = false;
                        }, 5000);
                        return;
                    }
                }

                // HASIL DITOLAK: Wajah Berbeda / Tidak Cocok
                playScanBeep('error');
                speakAttendanceRejection('Wajah tidak cocok dengan data guru.');
                setCameraStatus('idle');
                setFaceMatchPercent(result.score);
                setFaceStatusText('❌ Wajah Tidak Terverifikasi');
                setFaceVerificationError({
                    title: "Peringatan: Wajah Tidak Dikenali / Tidak Cocok",
                    msg: result.confidenceText || "Wajah tidak cocok dengan data guru terdaftar (Skor di bawah threshold 68%). Pastikan pencahayaan cukup dan wajah tegak menghadap kamera.",
                    highestScore: result.score,
                    topCandidate: result.allRankedScores?.[0]?.teacher?.name
                });
                isFaceProcessingRef.current = false;
            }
        } catch (err: any) {
            playScanBeep('error');
            setCameraStatus('idle');
            setFaceStatusText('Gagal Memproses Verifikasi');
            setErrorMessage('Terjadi kendala saat membaca frame kamera. Silakan coba lagi.');
            isFaceProcessingRef.current = false;
        }
    };

    // Filtered list of teachers for search / quick simulation
    const filteredTeachers = useMemo(() => {
        const q = searchFilter.toLowerCase().trim();
        if (!q) return allTeachers;
        return allTeachers.filter(t => 
            t.name.toLowerCase().includes(q) || 
            (t.nip && t.nip.includes(q)) || 
            (t.rfidCode && t.rfidCode.toLowerCase().includes(q)) ||
            `G-${t.id}`.toLowerCase().includes(q)
        );
    }, [allTeachers, searchFilter]);

    return (
        <div 
            onClick={handleGlobalClick} 
            className="h-screen max-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none overflow-hidden"
        >
            {/* 1. TOP HEADER BAR */}
            <header className="w-full bg-white border-b border-slate-200 p-2.5 sm:px-6 flex-shrink-0 z-20 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm flex items-center justify-center">
                            <TeacherIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                    EduScan Station Guru
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider border border-emerald-200">
                                    SMK MANBAUL ULUM
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Terminal Presensi Digital • 3 Metode Scan (RFID, QR, Wajah)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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

                        {/* Real-time Clock */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                                    {todayDateFormatted}
                                </span>
                                <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums leading-none tracking-tight">
                                    {currentTimeString} <span className="text-[10px] font-bold text-slate-500">WIB</span>
                                </span>
                            </div>
                            <ClockIcon className="w-5 h-5 text-emerald-600" />
                        </div>

                        {/* Back / Exit Button */}
                        <button 
                            type="button"
                            onClick={() => window.location.hash = ''} 
                            className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 active:bg-rose-800 transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer active:scale-98"
                            title="Kembali ke Menu Suite Utama"
                        >
                            <LogoutIcon className="w-4 h-4 text-white" /> Keluar Kiosk
                        </button>
                    </div>
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
                                    <p className="text-xs text-slate-500">Akses Multi-Device Portal Guru (Mobile, Tablet, & LAN)</p>
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
                                <span>Petunjuk Absensi Guru dari HP / Laptop LAN:</span>
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                                <li>Buka browser smartphone dan akses URL IP lokal server portal.</li>
                                <li>Gunakan fitur <strong>"Foto QR"</strong> atau <strong>"Foto Wajah"</strong> untuk absensi instan jika kamera live memerlukan izin khusus.</li>
                                <li>Sistem memproses dengan akurasi 100% dan menyiarkan log realtime ke seluruh terminal.</li>
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

            {/* 2. STATS OVERVIEW CARDS */}
            <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 mt-2 flex-shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Total Guru</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">{stats.total}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Guru</span>
                        </div>
                    </div>

                    <div className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">Hadir Hari Ini</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">{stats.presentCount}</span>
                            <span className="text-[11px] font-bold text-emerald-600">({stats.presentPercent}%)</span>
                        </div>
                    </div>

                    <div className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-0.5">Tepat Waktu (&le;07.15)</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-black text-blue-700 tabular-nums">{stats.onTimeCount}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Guru</span>
                        </div>
                    </div>

                    <div className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest block mb-0.5">Belum Presensi</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl sm:text-2xl font-black text-amber-700 tabular-nums">{stats.remaining}</span>
                            <span className="text-[11px] font-semibold text-slate-500">Guru</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MAIN WORKSPACE */}
            <main className="max-w-7xl mx-auto w-full p-2 sm:px-6 py-2 flex-1 flex flex-col min-h-0 overflow-hidden relative">
                
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

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
                        
                        {/* LEFT WORKSPACE: SCANNER TERMINAL (8 COLS) */}
                        <div className="lg:col-span-8 flex flex-col gap-2 min-h-0 overflow-hidden">
                            
                            {/* METHOD SELECTOR PILL TABS */}
                            <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs grid grid-cols-3 gap-1.5 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod('rfid')}
                                    className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedMethod === 'rfid'
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <RfidCardIcon className="w-4 h-4" />
                                    <span>1. Kartu RFID</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod('qr')}
                                    className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedMethod === 'qr'
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <QrCodeIcon className="w-4 h-4" />
                                    <span>2. QR Code</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedMethod('wajah')}
                                    className={`py-2 px-2 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedMethod === 'wajah'
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <FaceScanIcon className="w-4 h-4" />
                                    <span>3. Scan Wajah</span>
                                </button>
                            </div>

                            {/* MAIN ACTIVE TERMINAL CARD */}
                            <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col justify-between items-center relative overflow-hidden min-h-0">

                        {/* 1. RFID MODE VIEW */}
                        {selectedMethod === 'rfid' && (
                            <div className="w-full flex-1 flex flex-col justify-between items-center text-center min-h-0">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        <RfidSignalIcon className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                        <span>IoT RFID Reader Siap Siaga</span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                                        Scan Kartu RFID Guru
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
                                        Tempelkan Kartu Identitas Guru / Pegawai pada Sensor RFID USB
                                    </p>
                                </div>

                                {/* Central Pulsing Graphic */}
                                <div className="my-2 relative flex items-center justify-center">
                                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-100 border-4 border-slate-200 shadow-xs flex items-center justify-center relative">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md animate-bounce">
                                            <RfidCardIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                        </div>
                                        <div className="absolute -bottom-1.5 bg-slate-900 text-white px-3 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest shadow-sm">
                                            TAP KARTU DISINI
                                        </div>
                                    </div>
                                </div>

                                {/* RFID Input Field (Auto-Focused for USB Card Reader) */}
                                <div className="w-full max-w-md mb-1 relative">
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
                                            className={`w-full p-2.5 rounded-xl bg-slate-50 border-2 text-center text-base sm:text-lg font-mono font-black text-slate-900 focus:outline-none placeholder:text-slate-400 transition-all ${
                                                errorMessage ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-200 focus:border-slate-900'
                                            }`}
                                        />
                                    </form>
                                    {errorMessage && (
                                        <div className="absolute -bottom-6 left-0 right-0 text-center animate-shake z-30">
                                            <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-bold uppercase shadow-md">
                                                {errorMessage}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-[10px] text-slate-500 font-medium max-w-md">
                                    💡 Pastikan kartu RFID guru didekatkan ke modul sensor reader. Data akan langsung terverifikasi secara otomatis.
                                </p>
                            </div>
                        )}

                        {/* 2. QR CODE MODE VIEW */}
                        {selectedMethod === 'qr' && (
                            <div className="w-full flex-1 flex flex-col items-center justify-between text-center min-h-0 overflow-hidden">
                                <div className="mb-1 flex-shrink-0">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                                        <QrCodeIcon className="w-3 h-3 text-emerald-600" />
                                        <span>Scanner Kamera QR Otomatis (Hands-Free Auto-Scan)</span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                                        Scan QR Code Guru
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
                                        Dekatkan QR Code ke kamera — sistem otomatis mendeteksi dan mencatat presensi seketika.
                                    </p>
                                </div>

                                {/* DOMINANT CAMERA VIEWPORT FOR QR */}
                                <div className="w-full flex-1 max-w-2xl min-h-[220px] max-h-full my-1 rounded-2xl overflow-hidden bg-slate-950 border-2 border-white relative flex items-center justify-center shadow-xl">
                                    {isCamLoading && (
                                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2 text-white z-20">
                                            <LoadingSpinner className="text-emerald-400 w-8 h-8" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Membuka Kamera Scanner...</span>
                                        </div>
                                    )}

                                    {isScanningCam ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'}`} />
                                            
                                            {/* Targeting Frame Box for QR */}
                                            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
                                                <div className="flex justify-between">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-white rounded-tl-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-white rounded-tr-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-white rounded-bl-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-white rounded-br-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                </div>
                                            </div>

                                            {/* Central Scanning Box with Laser animation */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 border-2 border-white/80 rounded-2xl pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-slate-900/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(255,255,255,0.15)] z-10">
                                                <div className="w-full h-1 bg-white shadow-[0_0_16px_#ffffff] animate-scan-laser-vertical"></div>
                                                <span className="mt-auto mb-2 px-2.5 py-0.5 bg-slate-950/80 rounded-full text-[9px] font-bold text-white uppercase tracking-wider border border-white/20">
                                                    Posisikan QR di Kotak
                                                </span>
                                            </div>

                                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                                                <span className="px-2.5 py-1 bg-slate-900/95 text-white border border-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                                    AUTO-SCAN QR AKTIF
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-950/80 text-slate-200 border border-slate-700 rounded-md text-[9px] font-medium uppercase tracking-wider">
                                                    Deteksi Otomatis
                                                </span>
                                            </div>

                                            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                                                    className="bg-slate-900/90 hover:bg-slate-900 text-white px-2.5 py-1 rounded text-[10px] font-medium uppercase border border-slate-700 shadow-sm cursor-pointer"
                                                >
                                                    Putar Kamera
                                                </button>
                                                <button onClick={stopCameraScan} className="bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1 rounded text-[10px] font-semibold uppercase shadow-sm cursor-pointer">
                                                    Tutup
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button onClick={startCameraScan} className="w-full h-full flex flex-col items-center justify-center p-6 hover:bg-slate-900 transition-all text-white group cursor-pointer">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md">
                                                <CameraIcon className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">Buka Kamera Scanner QR</span>
                                            <span className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Klik untuk mengaktifkan pemindaian otomatis real-time</span>
                                        </button>
                                    )}
                                </div>

                                {/* USB SCANNER / MANUAL CODE INPUT */}
                                <div className="w-full max-w-2xl flex items-center gap-2 mt-1 flex-shrink-0">
                                    <form onSubmit={(e) => { e.preventDefault(); processRfidOrBarcode(qrScanInput, 'QR CODE'); }} className="flex-1">
                                        <input
                                            ref={qrInputRef}
                                            type="text"
                                            value={qrScanInput}
                                            onChange={(e) => setQrScanInput(e.target.value)}
                                            placeholder="Input kode QR manual / scan dengan barcode scanner USB..."
                                            className="w-full py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-900"
                                        />
                                    </form>

                                    <button
                                        type="button"
                                        onClick={() => photoUploadInputRef.current?.click()}
                                        className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                        title="Ambil Foto QR langsung via kamera HP atau unggah file gambar QR"
                                    >
                                        <UploadIcon className="w-3.5 h-3.5 text-slate-600" /> Foto QR
                                    </button>

                                    {!isScanningCam ? (
                                        <button
                                            type="button"
                                            onClick={startCameraScan}
                                            className="py-1.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                                        >
                                            <CameraIcon className="w-3.5 h-3.5 text-emerald-400" /> Buka Kamera
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={stopCameraScan}
                                            className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                                        >
                                            <XIcon className="w-3.5 h-3.5" /> Tutup Kamera
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. FACE SCAN MODE VIEW */}
                        {selectedMethod === 'wajah' && (
                            <div className="w-full flex-1 flex flex-col items-center justify-between text-center min-h-0 overflow-hidden">
                                <div className="mb-1 flex-shrink-0">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                                        <FaceScanIcon className="w-3 h-3 text-emerald-600" />
                                        <span>Biometrik Wajah Otomatis (Hands-Free Auto-Scan)</span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                                        Absensi Verifikasi Wajah Guru
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
                                        Hadapkan wajah ke kamera — sistem memindai dan mencatat presensi secara otomatis tanpa tombol.
                                    </p>
                                </div>

                                {/* DOMINANT CAMERA VIEWPORT FOR FACE */}
                                <div className="w-full flex-1 max-w-2xl min-h-[220px] max-h-full my-1 rounded-2xl overflow-hidden bg-slate-950 border-2 border-white relative flex items-center justify-center shadow-xl">
                                    {isCamLoading && (
                                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-30">
                                            <LoadingSpinner className="text-emerald-400 w-8 h-8" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Menghubungkan Kamera Scan Wajah...</span>
                                        </div>
                                    )}

                                    {cameraError && (
                                        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center text-white z-30">
                                            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl mb-2 border border-rose-500/30">
                                                <XIcon className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-bold text-xs uppercase text-rose-400 mb-1">{cameraError.title}</h4>
                                            <p className="text-[11px] text-slate-300 max-w-md mb-3">{cameraError.msg}</p>
                                            <button onClick={startCameraScan} className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer">
                                                Coba Ulang Kamera
                                            </button>
                                        </div>
                                    )}

                                    {/* Biometric Verification Rejection Alert */}
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
                                                className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                                            >
                                                Coba Lagi
                                            </button>
                                        </div>
                                    )}

                                    {isScanningCam ? (
                                        <>
                                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'}`} />
                                            
                                            {/* Clean Targeting Corners */}
                                            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
                                                <div className="flex justify-between">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-white rounded-tl-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-white rounded-tr-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-white rounded-bl-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-white rounded-br-lg shadow-[0_0_12px_rgba(255,255,255,0.9)]"></div>
                                                </div>
                                            </div>

                                            {/* Center Oval Face Alignment Frame */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-56 sm:w-52 sm:h-64 border-2 border-dashed border-white/90 rounded-[50%] pointer-events-none flex flex-col items-center justify-center overflow-hidden bg-slate-900/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(255,255,255,0.15)] z-10">
                                                <div className="w-full h-1 bg-white shadow-[0_0_16px_#ffffff] animate-scan-laser-vertical"></div>
                                                
                                                {cameraStatus === 'verifying' && (
                                                    <div className="mt-3 text-center bg-slate-900/95 px-3.5 py-1.5 rounded-xl border border-white/40 shadow-lg">
                                                        <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wider block">Mencocokkan Biometrik</span>
                                                        <span className="text-base font-black font-mono text-white">{faceMatchPercent}%</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Top Status Bar with Auto-Scan Indicator */}
                                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
                                                <span className="px-2.5 py-1 bg-slate-900/95 text-white border border-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                                    AUTO-SCAN WAJAH AKTIF
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-900/80 text-slate-200 border border-slate-700 rounded-md text-[9px] font-medium uppercase tracking-wider">
                                                    {faceStatusText}
                                                </span>
                                            </div>

                                            {/* Camera Controls Overlay */}
                                            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-20">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                                                    className="bg-slate-900/90 hover:bg-slate-900 text-white px-2.5 py-1 rounded text-[10px] font-medium uppercase border border-slate-700 shadow-sm cursor-pointer"
                                                >
                                                    Putar Kamera
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={stopCameraScan} 
                                                    className="bg-rose-700 hover:bg-rose-800 text-white px-2.5 py-1 rounded text-[10px] font-semibold uppercase shadow-sm cursor-pointer"
                                                >
                                                    Tutup
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={startCameraScan} 
                                            className="w-full h-full flex flex-col items-center justify-center p-6 hover:bg-slate-900 transition-all text-white group cursor-pointer"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md">
                                                <FaceScanIcon className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">Buka Kamera Scan Wajah</span>
                                            <span className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Klik untuk mengaktifkan pemindaian biometrik otomatis</span>
                                        </button>
                                    )}
                                </div>

                                {/* Status & Quick Auto-Scan Notice */}
                                <div className="w-full max-w-2xl flex items-center justify-between gap-2 mt-1 px-1 flex-shrink-0">
                                    <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                                        <span className="text-[11px] text-slate-600 font-semibold truncate">
                                            Auto-scan aktif: Wajah dideteksi otomatis saat berada di depan kamera.
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => photoUploadInputRef.current?.click()}
                                        className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 cursor-pointer"
                                        title="Ambil Foto wajah langsung via kamera HP atau unggah file foto guru untuk verifikasi"
                                    >
                                        <UploadIcon className="w-3.5 h-3.5 text-slate-600" /> Foto Wajah
                                    </button>

                                    {!isScanningCam ? (
                                        <button
                                            type="button"
                                            onClick={startCameraScan}
                                            className="py-1.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                                        >
                                            <CameraIcon className="w-3.5 h-3.5 text-emerald-400" /> Buka Kamera
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={stopCameraScan}
                                            className="py-1.5 px-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-xs flex items-center gap-1 flex-shrink-0 cursor-pointer"
                                        >
                                            <XIcon className="w-3.5 h-3.5" /> Tutup Kamera
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* RIGHT SIDEBAR: RECENT ATTENDANCE LOG (4 COLS) */}
                <div className="lg:col-span-4 flex flex-col min-h-0 overflow-hidden">
                    
                    {/* TODAY'S ATTENDANCE ACTIVITY LOG CARD */}
                    <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2 flex-shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                                    Log Presensi Guru Hari Ini
                                </h3>
                                <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                                    {todayDateFormatted} • {recentActivity.length} Guru Presensi
                                </p>
                            </div>
                            {recentActivity.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearTodayLog}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
                                    title="Hapus Bersih Seluruh Data Absensi Guru Hari Ini"
                                >
                                    <TrashIcon className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Hapus Semua</span>
                                </button>
                            )}
                        </div>

                        {/* Recent Activity List */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-0">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((act) => (
                                    <div 
                                        key={act.teacherId} 
                                        className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-between gap-2 group hover:shadow-xs transition-all"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                                                {act.teacher.photoUrl ? (
                                                    <img src={act.teacher.photoUrl} alt={act.teacher.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-xs text-slate-800 truncate" title={act.teacher.name}>
                                                    {act.teacher.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {act.method}
                                                    </span>
                                                    <span className="text-[9px] font-mono text-slate-500">
                                                        {act.timestamp} WIB
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                                                {act.status}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSingleTeacherLog(act.teacherId, act.teacher.name)}
                                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                                title="Hapus agar bisa absen ulang"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                    <ClockIcon className="w-12 h-12 mb-2 stroke-1 opacity-50" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Belum Ada Presensi Hari Ini</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Gunakan RFID, QR Code, atau Scan Wajah untuk mulai presensi.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                </div>

            </main>

            {/* FOOTER */}
            <footer className="mt-auto py-2 text-center flex-shrink-0 border-t border-slate-200 bg-[#e0e5ec]">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    &copy; SMK MANBAUL ULUM • Terminal EduScan Station Presensi Guru Terpadu
                </p>
            </footer>

            <style>{`
                @keyframes scan-line { 
                    0% { top: 15%; opacity: 0; } 
                    10% { opacity: 1; } 
                    90% { opacity: 1; } 
                    100% { top: 85%; opacity: 0; } 
                }
                @keyframes shake { 
                    0%, 100% { transform: translateX(0); } 
                    25% { transform: translateX(-6px); } 
                    75% { transform: translateX(6px); } 
                }
                .animate-shake { animation: shake 0.35s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #bec3c9; border-radius: 12px; }
            `}</style>
        </div>
    );
};
