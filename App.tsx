
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ScheduleView } from './components/ScheduleView';
import { TeachersView } from './components/TeachersView';
import { CalendarView } from './components/CalendarView';
import { StudentsView } from './components/StudentsView';
import { SchoolProfileView } from './components/SchoolProfileView';
import { AttendanceView } from './components/AttendanceView';
import { TeacherPortalView } from './components/TeacherPortalView';
import { StudentKioskView } from './components/StudentKioskView';
import { LandingSuiteView } from './components/LandingSuiteView';
import { LearningPortalView } from './components/LearningPortalView';
import { QuizPointsView } from './components/QuizPointsView';
import { AccountManagementView } from './components/AccountManagementView';
import { DatabasePortalInformasiView } from './components/DatabasePortalInformasiView';
import { DataQuizView } from './components/DataQuizView';
import { LoginModal } from './components/LoginModal';
import { School, View, SchoolInfo, AppData, Teacher, Student, AttendanceLog, Schedule, Notification, CalendarEvent, AuthSession, SuiteModule, ELearningData, GradesData } from './types';
import { schoolData as initialSchoolData, mockCalendarEvents } from './data/schoolData';
import { generateUniqueStudentQr, generateUniqueStudentRfid, ensureAllStudentsHaveUniqueQr, ensureAllTeachersHaveUniqueQr, generateUniqueTeacherRfid, generateUniqueTeacherQr } from './utils/qrHelper';
import { getActiveSessions, clearSession } from './utils/authManager';
import { compileDatabasePackage, saveAutoBackupToLocalStorage, getStoredAutoBackups } from './database_portalinformasi';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AIChatbot } from './components/AIChatbot';
import { DEFAULT_PORTAL_LOGO } from './constants';
import { safeLocalStorageSet } from './utils';
import { attendanceSync } from './utils/attendanceSync';

const APP_DATA_KEY = 'schoolPortalData_v8';
const ATTENDANCE_LOG_KEY = 'schoolPortalAttendanceLog_v7';
const ELEARNING_DATA_KEY = 'schoolPortalELearning_v7';
const GRADES_DATA_KEY = 'schoolPortalGrades_v7';
const PORTAL_LOGO_KEY = 'portalLogo';

const App: React.FC = () => {
  const [suiteMode, setSuiteMode] = useState<'landing' | 'info' | 'teacher' | 'student' | 'learning' | 'quiz' | 'data-quiz'>('landing');
  const activeSchool: School = 'smkmu';
  const [activeView, setActiveView] = useState<View>('Dashboard');
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);
  
  const [appData, setAppData] = useState<AppData>(() => {
    try {
        const savedData = localStorage.getItem(APP_DATA_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            const unit = parsed?.smkmu || parsed?.sdn5;
            // Verify structure has single teacher Herlambang Lasena and 23 clean students
            if (unit && Array.isArray(unit.students) && Array.isArray(unit.teachers)) {
                if (unit.teachers.length === 1 && unit.students.length === 23) {
                    // Sync verified student RFIDs and QR tokens
                    unit.students = unit.students.map((s: Student) => {
                        const initStudent = initialSchoolData.smkmu.students.find(is => is.id === s.id || is.nis === s.nis);
                        if (initStudent && initStudent.rfidCode) {
                            return { ...s, rfidCode: initStudent.rfidCode };
                        }
                        return s;
                    });
                    // Sync verified teacher RFIDs and QR tokens
                    unit.teachers = unit.teachers.map((t: Teacher) => {
                        const initTeacher = initialSchoolData.smkmu.teachers.find(it => it.id === t.id || it.nip === t.nip || it.name === t.name);
                        if (initTeacher && initTeacher.rfidCode) {
                            return { ...t, rfidCode: initTeacher.rfidCode };
                        }
                        return t;
                    });
                    unit.students = ensureAllStudentsHaveUniqueQr(unit.students);
                    unit.teachers = ensureAllTeachersHaveUniqueQr(unit.teachers);
                    unit.schedule = initialSchoolData.smkmu.schedule;
                    unit.subjects = initialSchoolData.smkmu.subjects;
                    // Sync verified official schoolInfo for SMK Manbaul Ulum
                    unit.schoolInfo = {
                        ...initialSchoolData.smkmu.schoolInfo,
                        ...(unit.schoolInfo || {}),
                        // Always guarantee verified official identifiers
                        name: initialSchoolData.smkmu.schoolInfo.name,
                        officialName: initialSchoolData.smkmu.schoolInfo.officialName,
                        address: initialSchoolData.smkmu.schoolInfo.address,
                        npsn: initialSchoolData.smkmu.schoolInfo.npsn,
                        regency: initialSchoolData.smkmu.schoolInfo.regency,
                        district: initialSchoolData.smkmu.schoolInfo.district,
                        headmaster: initialSchoolData.smkmu.schoolInfo.headmaster,
                        headmasterTitle: initialSchoolData.smkmu.schoolInfo.headmasterTitle,
                        headmasterHistory: initialSchoolData.smkmu.schoolInfo.headmasterHistory,
                        vision: initialSchoolData.smkmu.schoolInfo.vision,
                        mission: initialSchoolData.smkmu.schoolInfo.mission,
                        description: initialSchoolData.smkmu.schoolInfo.description,
                        establishmentDate: initialSchoolData.smkmu.schoolInfo.establishmentDate,
                        establishmentDecree: initialSchoolData.smkmu.schoolInfo.establishmentDecree,
                        operationalDecree: initialSchoolData.smkmu.schoolInfo.operationalDecree,
                        coordinates: initialSchoolData.smkmu.schoolInfo.coordinates,
                        mapsUrl: initialSchoolData.smkmu.schoolInfo.mapsUrl,
                        landArea: initialSchoolData.smkmu.schoolInfo.landArea,
                        electricSource: initialSchoolData.smkmu.schoolInfo.electricSource,
                        electricPower: initialSchoolData.smkmu.schoolInfo.electricPower,
                        email: initialSchoolData.smkmu.schoolInfo.email,
                        studentStats: initialSchoolData.smkmu.schoolInfo.studentStats,
                        staffStats: initialSchoolData.smkmu.schoolInfo.staffStats,
                        extraStats: initialSchoolData.smkmu.schoolInfo.extraStats,
                        accreditationHistory: initialSchoolData.smkmu.schoolInfo.accreditationHistory,
                        logoUrl: unit.schoolInfo?.logoUrl || DEFAULT_PORTAL_LOGO,
                    };
                    return { smkmu: unit, sdn5: unit };
                }
            }
        }
        const initial = { ...initialSchoolData };
        if (initial.smkmu && Array.isArray(initial.smkmu.students)) {
            // Ensure all student photoUrl are clean so they use default UserIcon like Teachers
            initial.smkmu.students = initial.smkmu.students.map(s => ({
                ...s,
                photoUrl: s.photoUrl && s.photoUrl.includes('dicebear') ? '' : (s.photoUrl || ''),
                faceDataUrl: s.faceDataUrl && s.faceDataUrl.includes('dicebear') ? '' : (s.faceDataUrl || '')
            }));
            initial.smkmu.students = ensureAllStudentsHaveUniqueQr(initial.smkmu.students);
        }
        if (initial.smkmu && Array.isArray(initial.smkmu.teachers)) {
            initial.smkmu.teachers = ensureAllTeachersHaveUniqueQr(initial.smkmu.teachers);
        }
        safeLocalStorageSet(APP_DATA_KEY, JSON.stringify(initial));
        return initial;
    } catch (error) {
        return initialSchoolData;
    }
  });

  const [attendanceLog, setAttendanceLog] = useState<AttendanceLog>(() => {
      try {
        const savedLog = localStorage.getItem(ATTENDANCE_LOG_KEY);
        return savedLog ? JSON.parse(savedLog) : {};
      } catch (error) {
        return {};
      }
  });

  const [eLearningData, setELearningData] = useState<Record<School, ELearningData>>(() => {
    try {
      const saved = localStorage.getItem(ELEARNING_DATA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && (parsed.smkmu || parsed.sdn5)) {
          const unit = parsed.smkmu || parsed.sdn5;
          return { smkmu: unit, sdn5: unit };
        }
      }
      return { smkmu: {}, sdn5: {} };
    } catch (e) { return { smkmu: {}, sdn5: {} }; }
  });

  const [gradesData, setGradesData] = useState<Record<School, GradesData>>(() => {
    try {
      const saved = localStorage.getItem(GRADES_DATA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && (parsed.smkmu || parsed.sdn5)) {
          const unit = parsed.smkmu || parsed.sdn5;
          return { smkmu: unit, sdn5: unit };
        }
      }
      return { smkmu: {}, sdn5: {} };
    } catch (e) { return { smkmu: {}, sdn5: {} }; }
  });

  const [portalLogo, setPortalLogo] = useState<string>(() => {
      try {
          const saved = localStorage.getItem(PORTAL_LOGO_KEY);
          if (saved && saved.trim() !== '') return saved;
          return DEFAULT_PORTAL_LOGO;
      } catch (e) { return DEFAULT_PORTAL_LOGO; }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Record<SuiteModule, AuthSession | null>>(() => getActiveSessions());

  // 5-Minute Auto-Backup state
  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<number | null>(null);
  const [secondsUntilNextBackup, setSecondsUntilNextBackup] = useState<number>(300);

  const handleLogout = (module: SuiteModule) => {
    clearSession(module);
    setActiveSessions(prev => ({ ...prev, [module]: null }));
  };

  // 5-Minute Auto-Backup Background Scheduler (Zero-Interference, Silent Non-Blocking)
  useEffect(() => {
    if (isAppLoading) return;

    // Silent background compilation and save to local rolling snapshot
    const performSilentAutoBackup = () => {
      try {
        const pkg = compileDatabasePackage(
          appData,
          attendanceLog,
          eLearningData,
          gradesData,
          portalLogo,
          'AUTO_SCHEDULED',
          'Auto-Backup Otomatis Interval 5 Menit (Background Silent Engine)'
        );
        const record = saveAutoBackupToLocalStorage(pkg);
        if (record) {
          setLastAutoBackupTime(record.timestamp);
        }
      } catch (err) {
        console.warn('Silent notice on auto-backup:', err);
      }
    };

    const interval = setInterval(() => {
      setSecondsUntilNextBackup(prev => {
        if (prev <= 1) {
          performSilentAutoBackup();
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAppLoading, appData, attendanceLog, eLearningData, gradesData, portalLogo]);

  // Real-Time Local Storage Persistence & Multi-Tab Broadcast Sync Engine
  useEffect(() => {
    if (isAppLoading) return;
    safeLocalStorageSet(ATTENDANCE_LOG_KEY, JSON.stringify(attendanceLog));
    attendanceSync.broadcastLogUpdate(attendanceLog);

    // Instant real-time database snapshot on every scan transaction
    try {
      const pkg = compileDatabasePackage(
        appData,
        attendanceLog,
        eLearningData,
        gradesData,
        portalLogo,
        'REALTIME_SNAPSHOT',
        'Snapshot Realtime Presensi Digital SMK Manbaul Ulum'
      );
      saveAutoBackupToLocalStorage(pkg);
    } catch (e) {
      // Ignore
    }
  }, [attendanceLog, isAppLoading]);

  const triggerManualBackupSnapshot = () => {
    try {
      const pkg = compileDatabasePackage(
        appData,
        attendanceLog,
        eLearningData,
        gradesData,
        portalLogo,
        'REALTIME_SNAPSHOT',
        'Snapshot Realtime Memori Aplikasi SMK Manbaul Ulum'
      );
      const record = saveAutoBackupToLocalStorage(pkg);
      if (record) {
        setLastAutoBackupTime(record.timestamp);
      }
    } catch (err) {
      console.error('Manual snapshot trigger error:', err);
    }
  };


  // Logic untuk menghasilkan notifikasi otomatis dari Agenda Kalender
  useEffect(() => {
    if (isAppLoading) return;

    const generateAgendaNotifications = () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const autoNotifications: Notification[] = [];

        mockCalendarEvents.forEach((event: CalendarEvent) => {
            const eventDate = new Date(event.date);
            const eventTime = eventDate.getTime();
            const nowTime = now.getTime();
            const diffDays = Math.ceil((eventTime - nowTime) / (1000 * 60 * 60 * 24));

            if (event.date === todayStr) {
                autoNotifications.push({
                    id: `today-${event.date}-${event.title}`,
                    type: 'event',
                    title: 'Agenda Hari Ini',
                    message: `PENTING: ${event.title}. Silakan cek detail kegiatan.`,
                    timestamp: Date.now(),
                    read: false
                });
            }
            else if (diffDays > 0 && diffDays <= 7) {
                autoNotifications.push({
                    id: `week-${event.date}-${event.title}`,
                    type: 'event',
                    title: 'Agenda Minggu Ini',
                    message: `${event.title} akan dilaksanakan pada ${new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
                    timestamp: Date.now(),
                    read: false
                });
            }
            else if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear && eventTime > nowTime) {
                autoNotifications.push({
                    id: `month-${event.date}-${event.title}`,
                    type: 'event',
                    title: 'Rencana Agenda Bulanan',
                    message: `Mendatang: ${event.title} (${new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}).`,
                    timestamp: Date.now(),
                    read: false
                });
            }
        });

        setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const uniqueNew = autoNotifications.filter(n => !existingIds.has(n.id));
            return [...uniqueNew, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
        });
    };

    generateAgendaNotifications();
  }, [isAppLoading]);

  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash;
        setCurrentRoute(hash);
        if (hash.startsWith('#/teacher-portal')) setSuiteMode('teacher');
        else if (hash.startsWith('#/student-kiosk')) setSuiteMode('student');
        else if (hash.startsWith('#/portal-info')) setSuiteMode('info');
        else if (hash.startsWith('#/learning-portal') || hash.startsWith('#/portal-pembelajaran')) setSuiteMode('learning');
        else if (hash.startsWith('#/quiz-points') || hash.startsWith('#/quizz-poin')) setSuiteMode('quiz');
        else if (hash.startsWith('#/data-quiz') || hash.startsWith('#/data-quizz')) setSuiteMode('data-quiz');
        else setSuiteMode('landing');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    
    setTimeout(() => setIsAppLoading(false), 1000);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => { safeLocalStorageSet(APP_DATA_KEY, JSON.stringify(appData)); }, [appData]);
  useEffect(() => { safeLocalStorageSet(ATTENDANCE_LOG_KEY, JSON.stringify(attendanceLog)); }, [attendanceLog]);
  useEffect(() => { safeLocalStorageSet(ELEARNING_DATA_KEY, JSON.stringify(eLearningData)); }, [eLearningData]);
  useEffect(() => { safeLocalStorageSet(GRADES_DATA_KEY, JSON.stringify(gradesData)); }, [gradesData]);
  useEffect(() => { safeLocalStorageSet(PORTAL_LOGO_KEY, portalLogo); }, [portalLogo]);

  const handleUpdateSchoolInfo = async (school: School, newInfo: SchoolInfo) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setAppData(prev => ({
        ...prev,
        [school]: { ...prev[school], schoolInfo: newInfo }
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderView = () => {
    const data = appData[activeSchool];
    const headerProps = {
        onMenuClick: () => setIsSidebarOpen(true),
        notifications: notifications,
        onNotificationsOpen: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
    };

    switch (activeView) {
      case 'Dashboard': return <DashboardView {...headerProps} appData={appData} attendanceLog={attendanceLog} calendarEvents={mockCalendarEvents} activeSchool={activeSchool} onUpdateSchoolInfo={handleUpdateSchoolInfo} />;
      case 'Jadwal Pelajaran': return <ScheduleView {...headerProps} schedule={data.schedule} teachers={data.teachers} subjects={data.subjects} schoolType={activeSchool} onUpdateSchedule={async (s, n) => { setAppData(prev => ({ ...prev, [s]: { ...prev[s], schedule: n } })) }} isProcessing={isProcessing} />;
      case 'Guru Pengajar': return <TeachersView {...headerProps} teachers={data.teachers} schedule={data.schedule} subjects={data.subjects} schoolInfo={data.schoolInfo} schoolType={activeSchool} onAdd={async (s, t) => {
        const newId = Date.now();
        const rfidCode = (t.rfidCode || '').trim() || generateUniqueTeacherRfid(data.teachers);
        const newTeacher: Teacher = {
          ...t,
          id: newId,
          rfidCode,
          qrCode: t.qrCode || generateUniqueTeacherQr({ id: newId, nip: t.nip, name: t.name })
        };
        setAppData(prev => ({ ...prev, [s]: { ...prev[s], teachers: [...prev[s].teachers, newTeacher] } }));
      }} onEdit={async (s, t) => setAppData(prev => ({ ...prev, [s]: { ...prev[s], teachers: prev[s].teachers.map(x => x.id === t.id ? t : x) } }))} onDelete={async (s, id) => setAppData(prev => ({ ...prev, [s]: { ...prev[s], teachers: prev[s].teachers.filter(x => x.id !== id) } }))} isProcessing={isProcessing} />;
      case 'Data Siswa': return (
        <StudentsView 
            {...headerProps} 
            students={data.students} 
            schoolType={activeSchool} 
            onAdd={async (s, st) => {
              const newId = `S${Date.now()}`;
              const rfidCode = (st.rfidCode || '').trim() || generateUniqueStudentRfid(appData[s].students);
              const qr = generateUniqueStudentQr({ ...st, id: newId }, appData[s].students);
              const newStudent: Student = { ...st, id: newId, rfidCode, qrCode: qr };
              setAppData(prev => ({ ...prev, [s]: { ...prev[s], students: [...prev[s].students, newStudent] } }));
            }} 
            onEdit={async (s, st) => {
              const rfidCode = (st.rfidCode || '').trim() || generateUniqueStudentRfid(appData[s].students);
              const qr = st.qrCode || generateUniqueStudentQr(st, appData[s].students);
              setAppData(prev => ({ ...prev, [s]: { ...prev[s], students: prev[s].students.map(x => x.id === st.id ? { ...st, rfidCode, qrCode: qr } : x) } }));
            }} 
            onDelete={async (s, id) => setAppData(prev => ({ ...prev, [s]: { ...prev[s], students: prev[s].students.filter(x => x.id !== id) } }))} 
            onImportStudents={async (schoolUnit, importedStudents) => setAppData(prev => {
                const importedClasses = Array.from(new Set(importedStudents.map(st => st.class)));
                const otherStudents = prev[schoolUnit].students.filter(st => !importedClasses.includes(st.class));
                const processedImported = ensureAllStudentsHaveUniqueQr(importedStudents);
                const combined = ensureAllStudentsHaveUniqueQr([...otherStudents, ...processedImported]);
                return { 
                  ...prev, 
                  [schoolUnit]: { 
                    ...prev[schoolUnit], 
                    students: combined 
                  } 
                };
            })}
            isProcessing={isProcessing} 
        />
      );
      case 'Kalender Kegiatan': return <CalendarView {...headerProps} notifications={notifications} onNotificationsOpen={headerProps.onNotificationsOpen} />;
      case 'Data Absensi': return (
        <AttendanceView 
          {...headerProps}
          students={data.students}
          teachers={data.teachers}
          schoolType={activeSchool}
          attendanceLog={attendanceLog}
          onUpdateLog={setAttendanceLog}
          schedule={data.schedule}
          subjects={data.subjects}
        />
      );
      case 'Profil Sekolah': return <SchoolProfileView {...headerProps} schoolInfo={data.schoolInfo} schoolType={activeSchool} onUpdate={handleUpdateSchoolInfo} onResetAllData={async () => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }} isProcessing={isProcessing} />;
      case 'Keamanan & Akun': return <AccountManagementView {...headerProps} activeSchool={activeSchool} onResetAllData={async () => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }} />;
      case 'Database Portal Informasi':
        return (
          <DatabasePortalInformasiView 
            {...headerProps}
            appData={appData}
            setAppData={setAppData}
            attendanceLog={attendanceLog}
            setAttendanceLog={setAttendanceLog}
            eLearningData={eLearningData}
            setELearningData={setELearningData}
            gradesData={gradesData}
            setGradesData={setGradesData}
            portalLogo={portalLogo}
            setPortalLogo={setPortalLogo}
            lastAutoBackupTime={lastAutoBackupTime}
            secondsUntilNextBackup={secondsUntilNextBackup}
            onTriggerManualBackup={triggerManualBackupSnapshot}
          />
        );
      default: return <DashboardView {...headerProps} appData={appData} attendanceLog={attendanceLog} calendarEvents={mockCalendarEvents} activeSchool={activeSchool} onUpdateSchoolInfo={handleUpdateSchoolInfo} />;
    }
  };

  if (isAppLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
      <LoadingSpinner className="w-16 h-16 text-green-700" />
    </div>
  );

  if (suiteMode === 'landing') return <LandingSuiteView portalLogo={portalLogo} onUpdateLogo={setPortalLogo} />;
  if (suiteMode === 'learning') return <LearningPortalView />;
  if (suiteMode === 'quiz') return <QuizPointsView appData={appData} onBackToPortal={() => window.location.hash = '#/learning-portal'} />;
  if (suiteMode === 'data-quiz') {
    if (!activeSessions['data-quiz']) {
      return (
        <LoginModal 
          targetModule="data-quiz" 
          portalLogo={portalLogo} 
          onSuccess={(session) => setActiveSessions(prev => ({ ...prev, 'data-quiz': session }))} 
        />
      );
    }
    return (
      <DataQuizView 
        onMenuClick={() => window.location.hash = ''} 
        notifications={notifications} 
        onNotificationsOpen={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} 
        onLogout={() => handleLogout('data-quiz')}
      />
    );
  }
  
  if (suiteMode === 'teacher') {
    return (
      <TeacherPortalView 
        appData={appData} 
        attendanceLog={attendanceLog} 
        onUpdateLog={setAttendanceLog} 
        calendarEvents={mockCalendarEvents}
        onUpdateTeacher={(teacher) => {
          setAppData(prev => {
            const currentUnit = prev.smkmu || (prev as any).sdn5;
            const updatedUnit = {
              ...currentUnit,
              teachers: currentUnit.teachers.map((t: Teacher) => t.id === teacher.id ? teacher : t)
            };
            return {
              smkmu: updatedUnit,
              sdn5: updatedUnit
            };
          });
        }}
      />
    );
  }

  if (suiteMode === 'student') {
    return (
      <StudentKioskView 
        appData={appData} 
        attendanceLog={attendanceLog} 
        onUpdateLog={setAttendanceLog} 
        calendarEvents={mockCalendarEvents} 
        onUpdateStudent={(st) => {
          setAppData(prev => {
            const currentUnit = prev.smkmu || (prev as any).sdn5;
            const updatedUnit = {
              ...currentUnit,
              students: currentUnit.students.map((s: Student) => s.id === st.id ? st : s)
            };
            return {
              smkmu: updatedUnit,
              sdn5: updatedUnit
            };
          });
        }}
        onBulkUpdateStudents={(newStudents) => {
          setAppData(prev => {
            const currentUnit = prev.smkmu || (prev as any).sdn5;
            const updatedUnit = {
              ...currentUnit,
              students: newStudents
            };
            return {
              smkmu: updatedUnit,
              sdn5: updatedUnit
            };
          });
        }}
      />
    );
  }

  // Portal Informasi authentication gate
  if (suiteMode === 'info' && !activeSessions.info) {
    return (
      <LoginModal 
        targetModule="info" 
        portalLogo={portalLogo} 
        onSuccess={(session) => setActiveSessions(prev => ({ ...prev, info: session }))} 
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-[#e0e5ec] text-slate-800 flex overflow-hidden no-print-section">
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      
      {/* Sidebar - Independent Scroll Area */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        activeSchool={activeSchool} 
        headmaster={appData.smkmu.schoolInfo.headmaster} 
        portalLogo={portalLogo}
        currentUser={activeSessions.info}
        onLogout={() => handleLogout('info')}
      />

      {/* Main Content Area - Independent Scroll Area */}
      <div className={`flex-1 flex flex-col h-screen max-h-screen overflow-y-auto overscroll-contain custom-scrollbar min-w-0 transition-transform duration-300 ease-in-out lg:transform-none ${isSidebarOpen ? 'translate-x-64 lg:translate-x-0' : 'translate-x-0'}`}>
          <main className="flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-300 flex flex-col min-w-0 no-print-section">
            {renderView()}
          </main>
      </div>

      <AIChatbot appData={appData} activeSchool={activeSchool} />
    </div>
  );
};

export default App;
