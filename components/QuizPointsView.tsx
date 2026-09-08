import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { 
  ALL_QUIZ_QUESTIONS, 
  ALL_QUIZ_TOPICS,
  getActiveTopicIds,
  QuizQuestion, 
  QuizResultRecord, 
  getStoredQuizResults, 
  saveQuizResult, 
  updateQuizResultByAdmin,
  evaluateEssayAnswer,
  STUDENT_POINTS_STORAGE_KEY
} from '../data/quizData';
import { AppData, Student } from '../types';
import { generateCleanStudents } from '../data/schoolData';
import { 
  BookOpenIcon, 
  CheckCircleIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  ClockIcon, 
  InfoIcon, 
  TrophyIcon, 
  UserIcon, 
  SearchIcon,
  PrinterIcon,
  RefreshIcon,
  TrashIcon,
  AwardIcon,
  CoinsIcon,
  PointsIcon,
  EyeIcon,
  DownloadIcon,
  SchoolIcon,
  PaperPenIcon,
  PodiumIcon,
  ClipboardPenIcon,
  ShieldIcon,
  LogoutIcon
} from './icons/Icons';

interface QuizPointsViewProps {
  appData?: AppData;
  onBackToPortal?: () => void;
}

export const QuizPointsView: React.FC<QuizPointsViewProps> = ({ appData, onBackToPortal }) => {
  // Navigation tabs: 'quiz' | 'leaderboard' | 'recap'
  const [activeTab, setActiveTab] = useState<'quiz' | 'leaderboard' | 'recap'>('quiz');

  // Filter Level
  const [selectedLevel, setSelectedLevel] = useState<'Kelas X' | 'Kelas XI' | 'Kelas XII'>('Kelas X');
  
  // Selected Student Identity & Login Session
  const studentsList: Student[] = useMemo(() => {
    const raw = (appData?.smkmu || (appData as any)?.sdn5)?.students;
    if (raw && raw.length > 0) return raw;
    return generateCleanStudents();
  }, [appData]);

  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem('quiz_logged_student_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-route selected level when student logs in or changes
  useEffect(() => {
    if (loggedInStudent) {
      const cls = loggedInStudent.class;
      if (cls === 'XI' || cls === 'Kelas XI' || cls.includes('XI')) {
        setSelectedLevel('Kelas XI');
      } else if (cls === 'XII' || cls === 'Kelas XII' || cls.includes('XII')) {
        setSelectedLevel('Kelas XII');
      } else {
        setSelectedLevel('Kelas X');
      }
    }
  }, [loggedInStudent]);

  const handleStudentLogin = (targetQuery?: string, targetPassword?: string) => {
    setLoginError(null);
    const query = (targetQuery !== undefined ? targetQuery : usernameInput).trim().toLowerCase();
    const pass = (targetPassword !== undefined ? targetPassword : passwordInput).trim();

    if (!query) {
      setLoginError('Silakan masukkan Username atau NIS Anda.');
      return;
    }

    const found = studentsList.find(s => {
      const uname = (s.username || '').toLowerCase();
      const nis = (s.nis || '').toLowerCase();
      const nisn = (s.nisn || '').toLowerCase();
      const name = (s.fullName || '').toLowerCase();
      return uname === query || nis === query || nisn === query || name.includes(query);
    });

    if (!found) {
      setLoginError(`Username atau NIS "${query}" tidak ditemukan.`);
      return;
    }

    // Check password if user is logging in manually via form
    if (targetQuery === undefined) {
      if (!pass) {
        setLoginError('Silakan masukkan Password Khusus Anda.');
        return;
      }
      const expectedPass = (found.password || `TJKT${found.nis}`).toLowerCase();
      const enteredPass = pass.toLowerCase();
      const fallbackNis = (found.nis || '').toLowerCase();

      if (enteredPass !== expectedPass && enteredPass !== fallbackNis) {
        setLoginError(`Password salah untuk akun ${found.fullName}. Silakan cek Password di Kartu Presensi.`);
        return;
      }
    }

    setLoggedInStudent(found);
    try {
      localStorage.setItem('quiz_logged_student_v2', JSON.stringify(found));
    } catch (e) {
      console.error(e);
    }
    setUsernameInput('');
    setPasswordInput('');
    setLoginError(null);
  };

  const handleStudentLogout = () => {
    setLoggedInStudent(null);
    setIsQuizRunning(false);
    setActiveTopicId(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    try {
      localStorage.removeItem('quiz_logged_student_v2');
    } catch (e) {
      console.error(e);
    }
  };

  const activeStudentInfo = useMemo(() => {
    if (loggedInStudent) {
      return {
        id: loggedInStudent.id,
        name: loggedInStudent.fullName,
        class: loggedInStudent.class.startsWith('Kelas') ? loggedInStudent.class : `Kelas ${loggedInStudent.class} TJKT`,
        nis: loggedInStudent.nis || 'NIS-OK',
        username: loggedInStudent.username || ''
      };
    }
    return {
      id: 'GUEST',
      name: 'Siswa Belum Login',
      class: selectedLevel,
      nis: '0000',
      username: 'guest'
    };
  }, [loggedInStudent, selectedLevel]);

  // Quiz Execution State
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(900); // 15 minutes = 900s
  const [isQuizRunning, setIsQuizRunning] = useState<boolean>(false);
  const [quizCompletedResult, setQuizCompletedResult] = useState<QuizResultRecord | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Stored quiz results
  const [quizResultsHistory, setQuizResultsHistory] = useState<QuizResultRecord[]>(() => getStoredQuizResults());

  // Search & Filter in Recap
  const [recapSearchQuery, setRecapSearchQuery] = useState<string>('');
  const [recapLevelFilter, setRecapLevelFilter] = useState<string>('all');
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<QuizResultRecord | null>(null);

  // Manual grading for Essay questions by Teacher / Admin
  const handleAdminGradeEssayAnswer = (record: QuizResultRecord, answerIndex: number, markCorrect: boolean) => {
    const updatedAnswers = record.answers.map((ans, idx) => {
      if (idx !== answerIndex) return ans;
      const maxPts = ans.maxPoints || 10;
      return {
        ...ans,
        isCorrect: markCorrect,
        earnedPoints: markCorrect ? maxPts : 0,
        feedback: markCorrect 
          ? `✅ Koreksi Manual Guru: Jawaban disetujui dan dinyatakan BENAR (${maxPts} Poin).`
          : `❌ Koreksi Manual Guru: Jawaban dinyatakan SALAH (0 Poin).`
      };
    });

    let newTotalPoints = 0;
    let newCorrectCount = 0;
    let newWrongCount = 0;

    updatedAnswers.forEach(a => {
      newTotalPoints += a.earnedPoints;
      if (a.earnedPoints > 0) {
        newCorrectCount++;
      } else {
        newWrongCount++;
      }
    });

    const maxPossible = updatedAnswers.length * 10;
    const newScorePercentage = Math.round((newTotalPoints / maxPossible) * 100);

    const updatedRecord: QuizResultRecord = {
      ...record,
      answers: updatedAnswers,
      pointsEarned: newTotalPoints,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      scorePercentage: newScorePercentage,
      isGradedByAdmin: true,
      adminGradedAt: Date.now()
    };

    updateQuizResultByAdmin(updatedRecord);
    setSelectedDetailRecord(updatedRecord);
    setQuizResultsHistory(getStoredQuizResults());
  };

  // Sync stored results on mount / update
  useEffect(() => {
    setQuizResultsHistory(getStoredQuizResults());
  }, [showResultModal]);

  // 15-Minute Countdown Timer for Active Quiz
  useEffect(() => {
    let timer: any = null;
    if (isQuizRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuizRunning, timeRemaining]);

  // Active topics dynamic sync
  const [activeTopicIds, setActiveTopicIds] = useState<string[]>(() => getActiveTopicIds());

  useEffect(() => {
    const handleUpdate = () => {
      setActiveTopicIds(getActiveTopicIds());
    };
    window.addEventListener('quiz_active_topics_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('quiz_active_topics_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Available topics for selected level & active status
  const topicsForLevel = useMemo(() => {
    return ALL_QUIZ_TOPICS.filter(t => t.level === selectedLevel && activeTopicIds.includes(t.id));
  }, [selectedLevel, activeTopicIds]);

  // Get active questions for selected topic
  const currentTopicQuestions = useMemo(() => {
    if (!activeTopicId) return [];
    return ALL_QUIZ_QUESTIONS.filter(q => q.topicId === activeTopicId);
  }, [activeTopicId]);

  // Start Quiz Handler
  const handleStartQuiz = (topicId: string) => {
    if (!loggedInStudent) {
      setLoginError('Anda wajib login terlebih dahulu menggunakan Username & Password khusus pada Kartu Presensi Siswa!');
      return;
    }
    setActiveTopicId(topicId);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeRemaining(900); // 15 mins
    setIsQuizRunning(true);
    setQuizCompletedResult(null);
  };

  // Answer change handler
  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Submit & Smart Evaluation Handler
  const handleAutoSubmitQuiz = () => {
    if (!activeTopicId || currentTopicQuestions.length === 0) return;

    setIsQuizRunning(false);

    let totalPoints = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const evaluatedAnswers: QuizResultRecord['answers'] = [];

    currentTopicQuestions.forEach(q => {
      const studentAns = userAnswers[q.id] || '';
      let isCorrect = false;
      let earnedPoints = 0;
      let feedback = '';

      if (q.type === 'multiple_choice' && q.correctOptionIndex !== undefined) {
        const selectedIndex = parseInt(studentAns, 10);
        if (selectedIndex === q.correctOptionIndex) {
          isCorrect = true;
          earnedPoints = q.points;
          feedback = 'Tepat Sekali! Pilihan jawaban Anda benar.';
          correctCount++;
        } else {
          isCorrect = false;
          earnedPoints = 0;
          feedback = `Jawaban Kurang Tepat. Jawaban yang benar adalah: ${q.options?.[q.correctOptionIndex] || ''}.`;
          wrongCount++;
        }
      } else {
        // Essay & Diagram Analysis Evaluation using Smart Keyword Matching
        const evalRes = evaluateEssayAnswer(studentAns, q.keywords, q.points);
        isCorrect = evalRes.isCorrect;
        earnedPoints = evalRes.score;
        feedback = evalRes.feedback;
        if (earnedPoints > 0) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      totalPoints += earnedPoints;
      evaluatedAnswers.push({
        questionId: q.id,
        questionText: q.question,
        questionType: q.type,
        diagramSvg: q.diagramSvg,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        keywords: q.keywords,
        modelAnswer: q.modelAnswer,
        studentAnswer: studentAns,
        isCorrect,
        earnedPoints,
        maxPoints: q.points,
        feedback
      });
    });

    const maxPossiblePoints = currentTopicQuestions.length * 10;
    const scorePercentage = Math.round((totalPoints / maxPossiblePoints) * 100);
    const activeTopicObj = topicsForLevel.find(t => t.id === activeTopicId);

    const record: QuizResultRecord = {
      id: `QUIZ-${Date.now()}`,
      timestamp: Date.now(),
      studentId: activeStudentInfo.id,
      studentName: activeStudentInfo.name,
      studentClass: activeStudentInfo.class,
      topicId: activeTopicId,
      topicTitle: activeTopicObj?.title || 'Topic Quiz',
      classLevel: selectedLevel,
      totalQuestions: currentTopicQuestions.length,
      correctCount,
      wrongCount,
      scorePercentage,
      pointsEarned: totalPoints,
      maxPossiblePoints,
      timeSpentSeconds: 900 - timeRemaining,
      isGradedByAdmin: false,
      answers: evaluatedAnswers
    };

    saveQuizResult(record);
    setQuizCompletedResult(record);
    setShowResultModal(true);
    setActiveTopicId(null);
  };

  // Leaderboard Calculation
  const leaderboardData = useMemo(() => {
    const rawPoints = localStorage.getItem(STUDENT_POINTS_STORAGE_KEY);
    const map: Record<string, { totalPoints: number; quizzesTaken: number; studentName: string; studentClass: string }> = rawPoints ? JSON.parse(rawPoints) : {};

    const list = Object.values(map);
    return list.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [quizResultsHistory]);

  // Personal Student Point Stats & Task History
  const studentPersonalHistory = useMemo(() => {
    if (!loggedInStudent) return [];
    const studentNameLower = loggedInStudent.fullName.trim().toLowerCase();
    return quizResultsHistory.filter(r => {
      const isMatchId = r.studentId === loggedInStudent.id;
      const isMatchName = (r.studentName || '').trim().toLowerCase() === studentNameLower;
      const isMatchNis = Boolean(r.studentNis && loggedInStudent.nis && r.studentNis === loggedInStudent.nis);
      return isMatchId || isMatchName || isMatchNis;
    });
  }, [quizResultsHistory, loggedInStudent]);

  const studentTotalPoints = useMemo(() => {
    return studentPersonalHistory.reduce((sum, item) => sum + (item.pointsEarned || 0), 0);
  }, [studentPersonalHistory]);

  const studentAvgScore = useMemo(() => {
    if (studentPersonalHistory.length === 0) return 0;
    const totalPercentage = studentPersonalHistory.reduce((sum, item) => sum + (item.scorePercentage || 0), 0);
    return Math.round(totalPercentage / studentPersonalHistory.length);
  }, [studentPersonalHistory]);

  // Tier Reward Calculation
  const rewardTierInfo = useMemo(() => {
    const pts = studentTotalPoints;
    if (pts >= 1000) {
      return {
        tierName: '👑 Legend TJKT Expert',
        badgeColor: 'bg-amber-500 text-slate-900 border-amber-300',
        nextTier: 'Tier Maksimal Tercapai!',
        nextTierPoints: 1000,
        progress: 100,
        description: 'Selamat! Anda adalah legenda keahlian infrastruktur & jaringan TJKT.'
      };
    } else if (pts >= 600) {
      return {
        tierName: '💎 Master Infrastruktur TJKT',
        badgeColor: 'bg-cyan-500 text-white border-cyan-300',
        nextTier: '👑 Legend TJKT Expert',
        nextTierPoints: 1000,
        progress: Math.min(100, Math.round(((pts - 600) / 400) * 100)),
        description: 'Keahlian tingkat lanjut dalam mengelola router, server, dan keamanan jaringan.'
      };
    } else if (pts >= 300) {
      return {
        tierName: '🥇 Spesialis Jaringan TJKT',
        badgeColor: 'bg-yellow-500 text-slate-900 border-yellow-300',
        nextTier: '💎 Master Infrastruktur',
        nextTierPoints: 600,
        progress: Math.min(100, Math.round(((pts - 300) / 300) * 100)),
        description: 'Menguasai konfigurasi jaringan komputer, jaringan nirkabel, dan sistem operasi.'
      };
    } else if (pts >= 100) {
      return {
        tierName: '🥈 Teknisi Muda TJKT',
        badgeColor: 'bg-slate-300 text-slate-800 border-slate-400',
        nextTier: '🥇 Spesialis Jaringan',
        nextTierPoints: 300,
        progress: Math.min(100, Math.round(((pts - 100) / 200) * 100)),
        description: 'Memahami dasar-dasar perkabelan, topologi, dan troubleshoot komputer.'
      };
    } else {
      return {
        tierName: '🥉 Pemula TJKT',
        badgeColor: 'bg-amber-700 text-amber-100 border-amber-600',
        nextTier: '🥈 Teknisi Muda TJKT',
        nextTierPoints: 100,
        progress: Math.min(100, Math.round((pts / 100) * 100)),
        description: 'Selamat datang! Kumpulkan poin tugas dan quiz untuk menaikkan peringkat reward.'
      };
    }
  }, [studentTotalPoints]);

  // Filtered Recap Records (Isolated per Student Account / Full Admin Access)
  const filteredRecapRecords = useMemo(() => {
    return quizResultsHistory.filter(r => {
      // PERMISSION & PRIVACY ISOLATION:
      // If a student is currently logged in, strictly show ONLY their own quiz records
      if (loggedInStudent) {
        const studentNameLower = loggedInStudent.fullName.trim().toLowerCase();
        const recNameLower = (r.studentName || '').trim().toLowerCase();
        const isMatchId = r.studentId === loggedInStudent.id;
        const isMatchName = recNameLower === studentNameLower;
        const isMatchNis = Boolean(r.studentNis && loggedInStudent.nis && r.studentNis === loggedInStudent.nis);

        if (!isMatchId && !isMatchName && !isMatchNis) {
          return false;
        }
      }

      if (recapLevelFilter !== 'all' && r.classLevel !== recapLevelFilter) return false;
      if (recapSearchQuery.trim()) {
        const q = recapSearchQuery.toLowerCase();
        return (
          r.studentName.toLowerCase().includes(q) ||
          r.topicTitle.toLowerCase().includes(q) ||
          r.studentClass.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [quizResultsHistory, loggedInStudent, recapLevelFilter, recapSearchQuery]);

  // Clear all quiz results (Teacher function)
  const handleClearAllQuizResults = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh rekapitulasi nilai dan poin quiz? Action ini tidak dapat dibatalkan.')) {
      localStorage.removeItem('learning_portal_quiz_results_v1');
      localStorage.removeItem(STUDENT_POINTS_STORAGE_KEY);
      setQuizResultsHistory([]);
      alert('Data rekapitulasi quiz berhasil dibersihkan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.15)] shrink-0">
            <PaperPenIcon className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider">MODUL RESMI TJKT</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">REALTIME EVALUATOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight mt-1">QUIZZ & POIN TJKT</h1>
            <p className="text-xs font-semibold text-slate-500">Evaluasi Otomatis 55 Topik Kurikulum TJKT, Papan Peringkat, & Rekap Nilai Server</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-[#e0e5ec] text-slate-600 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:bg-slate-200'
            }`}
          >
            <BookOpenIcon className={`w-4 h-4 ${activeTab === 'quiz' ? 'text-sky-300' : 'text-blue-600'}`} /> Ujian Quiz Interaktif {!loggedInStudent && '🔒'}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboard' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-[#e0e5ec] text-slate-600 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:bg-slate-200'
            }`}
          >
            <TrophyIcon className={`w-4 h-4 ${activeTab === 'leaderboard' ? 'text-amber-300' : 'text-amber-500'}`} /> REWARD POIN {!loggedInStudent && '🔒'}
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recap' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-[#e0e5ec] text-slate-600 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:bg-slate-200'
            }`}
          >
            <PaperPenIcon className={`w-4 h-4 ${activeTab === 'recap' ? 'text-emerald-300' : 'text-emerald-600'}`} /> Rekapitulasi Nilai {!loggedInStudent && '🔒'}
          </button>
          <button
            type="button"
            onClick={() => window.location.hash = ''}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-all cursor-pointer whitespace-nowrap shadow-md shadow-rose-600/20 flex items-center gap-1.5 ml-1 active:scale-98"
            title="Kembali ke Beranda Suite"
          >
            <LogoutIcon className="w-4 h-4 text-white" /> Keluar Suite
          </button>
        </div>
      </div>

      {/* STUDENT LOGIN & ACTIVE SESSION BAR */}
      {!isQuizRunning && (
        !loggedInStudent ? (
          <Card className="p-6 mb-6 bg-[#e0e5ec] rounded-[2rem] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border-none">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 max-w-xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shrink-0 mt-1">
                  <UserIcon className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                      LOGIN SISWA KHUSUS
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      🔒 WAJIB LOGIN UNTUK 3 TAB QUIZ
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    Masuk Ke Akun Siswa TJKT
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                    Ketiga tab pada modul ini (<span className="font-bold text-indigo-700">Ujian Quiz</span>, <span className="font-bold text-amber-600">Reward Poin</span>, dan <span className="font-bold text-emerald-700">Rekapitulasi Nilai</span>) hanya dapat diakses oleh siswa yang telah login menggunakan Username & Password.
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-auto bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-inner flex flex-col gap-3.5 min-w-[340px]">
                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Username:
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Password:
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudentLogin()}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <button
                  onClick={() => handleStudentLogin()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  🚀 Masuk Ke Akun Siswa & Akses Modul
                </button>

                {loginError && (
                  <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    ⚠️ {loginError}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 mb-6 bg-[#e0e5ec] rounded-[2rem] shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] border-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shrink-0 overflow-hidden border-2 border-white">
                  {loggedInStudent.photoUrl ? (
                    <img src={loggedInStudent.photoUrl} alt={loggedInStudent.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-7 h-7 text-indigo-100" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      🟢 SESI SISWA AKTIF
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                      {activeStudentInfo.class}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mt-0.5">
                    {loggedInStudent.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    NIS: <span className="font-mono font-bold text-slate-700">{loggedInStudent.nis}</span> &bull; Username: <span className="font-mono font-bold text-indigo-600">{loggedInStudent.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right hidden md:block">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AKUMULASI POIN SAYA</span>
                  <span className="text-sm font-black text-amber-600">{studentTotalPoints} Poin</span>
                </div>
                <button
                  onClick={handleStudentLogout}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-white" /> Keluar Akun
                </button>
              </div>
            </div>
          </Card>
        )
      )}

      {/* TAB 1: QUIZ SELECTION & ACTIVE QUIZ ENGINE */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {!loggedInStudent ? (
            /* JIKA BELUM LOGIN: SEMBUNYIKAN SEMUA SOAL & TAMPILKAN BANNER TERKUNCI */
            <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] text-center my-4 border border-indigo-200/50 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl shadow-inner">
                🔒
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                AKSES SOAL UJIAN TERKUNCI &bull; WAJIB LOGIN SISWA
              </h3>
              <p className="text-xs font-bold text-slate-600 max-w-lg mx-auto leading-relaxed">
                Silakan masukkan <span className="text-indigo-700 font-extrabold">Username</span> dan <span className="text-indigo-700 font-extrabold">Password</span> khusus yang tertera pada <span className="text-emerald-700 font-extrabold">Kartu Presensi Siswa</span> Anda pada formulir di atas untuk membuka bank soal ujian secara otomatis.
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-amber-100/90 text-amber-900 text-xs font-black border border-amber-300 shadow-xs">
                ⚠️ PENTING: Pengerjaan soal wajib terhubung ke NIS & Nama Siswa yang sah agar nilai tidak tertukar.
              </div>
            </div>
          ) : !isQuizRunning ? (
            <>
              {/* HEADER KUIS TERDEDIKASI KELAS SISWA */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-lg border border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                    <SchoolIcon className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-200 tracking-wider block">
                      BANK SOAL TERDEDIKASI OTOMATIS
                    </span>
                    <h3 className="text-base font-black uppercase tracking-tight text-white">
                      SOAL UJIAN AKTIF &bull; {selectedLevel} TJKT
                    </h3>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                  {topicsForLevel.length} Topik Kuis Aktif
                </span>
              </div>

              {/* TOPIC GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {topicsForLevel.length === 0 ? (
                  <div className="col-span-full p-10 rounded-[2rem] bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-center my-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl shadow-inner">
                      <InfoIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                      Belum Ada Soal Kuis Aktif untuk {selectedLevel}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                      Guru Pengampu belum mengaktifkan materi kuis untuk tingkat kelas ini. Soal disembunyikan agar siswa dapat berfokus pada ujian yang sedang berlangsung. Silakan minta Guru Anda untuk mengaktifkan soal di menu Data Quiz.
                    </p>
                  </div>
                ) : (
                  topicsForLevel.map((topic, index) => {
                    const topicQuestions = ALL_QUIZ_QUESTIONS.filter(q => q.topicId === topic.id);
                  const hasDiagram = topicQuestions.some(q => q.diagramSvg);
                  const completedAttempts = quizResultsHistory.filter(r => r.topicId === topic.id && r.studentId === activeStudentInfo.id);
                  const bestScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map(a => a.scorePercentage)) : null;

                  return (
                    <Card
                      key={topic.id}
                      className="p-5 rounded-[1.5rem] bg-[#e0e5ec] shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] border-none flex flex-col justify-between hover:-translate-y-1 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase">
                            TOPIK #{index + 1}
                          </span>
                          {hasDiagram && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              📷 Analisis Gambar
                            </span>
                          )}
                          {bestScore !== null && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              Nilai: {bestScore}%
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-800 mb-2 leading-snug">{topic.title}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-4">
                          10 Soal Komprehensif (Esai, Analisis Network & Pilihan Ganda dengan Evaluasi Kunci).
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-300/40 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> 15 Menit
                        </span>
                        <button
                          onClick={() => handleStartQuiz(topic.id)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 shadow-md cursor-pointer transition-all"
                        >
                          Kerjakan Quiz <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                }))}
              </div>
            </>
          ) : (
            /* ACTIVE QUIZ SCREEN */
            <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
              {/* QUIZ ACTIVE TOP BAR */}
              <Card className="p-5 rounded-[2rem] bg-[#e0e5ec] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border-none flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">UJIAN REALTIME DIJALANKAN</span>
                  <h2 className="text-lg font-black text-slate-800">
                    {topicsForLevel.find(t => t.id === activeTopicId)?.title}
                  </h2>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-900 font-black text-sm shadow-inner">
                    <ClockIcon className="w-4 h-4" />
                    <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                  </div>

                  <button
                    onClick={handleAutoSubmitQuiz}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-md transition-all"
                  >
                    Kirim & Selesai Quiz
                  </button>
                </div>
              </Card>

              {/* QUESTION STEPPER & CARD */}
              {currentTopicQuestions.length > 0 && (
                <Card className="p-6 sm:p-8 rounded-[2rem] bg-[#e0e5ec] shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff] border-none space-y-6">
                  {/* Stepper buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {currentTopicQuestions.map((q, idx) => {
                      const isAnswered = !!userAnswers[q.id];
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-9 h-9 rounded-xl font-black text-xs shrink-0 cursor-pointer transition-all ${
                            currentQuestionIndex === idx
                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                              : isAnswered
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-[#e0e5ec] text-slate-600 shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff]'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question details */}
                  {(() => {
                    const q = currentTopicQuestions[currentQuestionIndex];
                    if (!q) return null;

                    return (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-300/40 pb-3">
                          <span className="text-xs font-black text-indigo-600 uppercase">
                            PERTANYAAN #{q.questionNumber} DARI {currentTopicQuestions.length} ({q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Analisis Esai Teknis'})
                          </span>
                          <span className="text-xs font-bold text-slate-500">Bobot: {q.points} Poin</span>
                        </div>

                        <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
                          {q.question}
                        </p>

                        {/* SVG Diagram Illustration if available */}
                        {q.diagramSvg && (
                          <div className="my-4 rounded-2xl overflow-hidden p-2 bg-slate-900 shadow-inner">
                            <div dangerouslySetInnerHTML={{ __html: q.diagramSvg }} />
                            {q.diagramCaption && (
                              <p className="text-center text-xs font-bold text-slate-400 mt-2">{q.diagramCaption}</p>
                            )}
                          </div>
                        )}

                        {/* Answer Input Area */}
                        {q.type === 'multiple_choice' && q.options ? (
                          <div className="space-y-3 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userAnswers[q.id] === optIdx.toString();
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleAnswerChange(q.id, optIdx.toString())}
                                  className={`w-full text-left p-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-3 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'bg-[#e0e5ec] text-slate-700 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:bg-slate-200'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                    isSelected ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pt-2 space-y-2">
                            <label className="text-xs font-bold text-slate-600 block">
                              Tuliskan Jawaban Esai / Analisis Teknis Anda:
                            </label>
                            <textarea
                              rows={5}
                              placeholder="Ketikkan jawaban penjelasan teknis secara rinci disini..."
                              value={userAnswers[q.id] || ''}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              className="w-full p-4 rounded-2xl bg-white border border-slate-300 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            />
                            <p className="text-[11px] text-slate-400 italic">
                              *Sistem Evaluator Otomatis akan mencocokkan kata kunci teknis dan kelengkapan argumen Anda.
                            </p>
                          </div>
                        )}

                        {/* Prev / Next navigation */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-300/40">
                          <button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs disabled:opacity-40 cursor-pointer"
                          >
                            &larr; Soal Sebelumnya
                          </button>

                          {currentQuestionIndex < currentTopicQuestions.length - 1 ? (
                            <button
                              onClick={() => setCurrentQuestionIndex(prev => Math.min(currentTopicQuestions.length - 1, prev + 1))}
                              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-md"
                            >
                              Soal Selanjutnya &rarr;
                            </button>
                          ) : (
                            <button
                              onClick={handleAutoSubmitQuiz}
                              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-md"
                            >
                              Selesai & Sampaikan Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARD POIN */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {!loggedInStudent ? (
            <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] text-center my-4 border border-indigo-200/50 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl shadow-inner">
                🔒
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                HALAMAN REWARD POIN TERKUNCI &bull; WAJIB LOGIN SISWA
              </h3>
              <p className="text-xs font-bold text-slate-600 max-w-lg mx-auto leading-relaxed">
                Halaman <span className="text-indigo-700 font-extrabold">Reward Poin</span> hanya dapat dibuka oleh siswa yang sudah login. Silakan masukkan <span className="text-indigo-700 font-extrabold">Username</span> dan <span className="text-indigo-700 font-extrabold">Password</span> Anda pada formulir login di atas.
              </p>
            </div>
          ) : (
            <>
              {/* REWARD POIN SUMMARY HEADER */}
              <Card className="p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border-none">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-300/60">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                        AKUMULASI POIN SISWA
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black uppercase tracking-wider">
                        {activeStudentInfo.class}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">
                      Reward Poin &bull; {loggedInStudent.fullName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Ringkasan akumulasi poin resmi milik akun Anda serta rincian poin dari setiap tugas yang diselesaikan.
                    </p>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shrink-0">
                    ✅ Akun Terverifikasi
                  </span>
                </div>

                {/* 3 RINGKASAN UTAMA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CARD 1: AKUMULASI TOTAL POIN */}
                  <div className="p-5 rounded-2xl bg-amber-500 text-slate-950 shadow-md flex flex-col justify-between border border-amber-400">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-900/80">
                      AKUMULASI TOTAL POIN
                    </span>
                    <div className="my-2">
                      <span className="text-4xl font-black text-slate-950">{studentTotalPoints}</span>
                      <span className="text-base font-bold text-slate-900 ml-1.5">Poin</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-900/80">
                      ✔ Otomatis terakumulasi permanen
                    </p>
                  </div>

                  {/* CARD 2: TOTAL TUGAS */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      TOTAL TUGAS DIKERJAKAN
                    </span>
                    <div className="my-2">
                      <span className="text-4xl font-black text-slate-800">{studentPersonalHistory.length}</span>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">Tugas/Quiz</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      Daftar tugas terverifikasi
                    </p>
                  </div>

                  {/* CARD 3: RATA RATA SKOR */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      RATA-RATA SKOR QUIZ
                    </span>
                    <div className="my-2">
                      <span className="text-4xl font-black text-emerald-700">{studentAvgScore}%</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      Persentase keakuratan jawaban
                    </p>
                  </div>
                </div>
              </Card>

              {/* RIWAYAT RINCIAN TUGAS & POIN */}
              <Card className="p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border-none">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                      RIWAYAT TUGAS & POIN
                    </span>
                    <h3 className="text-lg font-black text-slate-800">
                      Rincian Perolehan Poin Tugas ({studentPersonalHistory.length} Record)
                    </h3>
                  </div>
                </div>

                {studentPersonalHistory.length === 0 ? (
                  <div className="text-center py-12 bg-white/70 rounded-2xl border border-slate-200">
                    <BookOpenIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Belum ada tugas atau quiz yang dikerjakan oleh akun Anda.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Silakan pilih tab <span className="font-bold text-blue-600">Ujian Quiz Interaktif</span> untuk mulai mengerjakan kuis dan mengumpulkan poin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentPersonalHistory.map((rec, index) => {
                      const formattedDate = new Date(rec.timestamp).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div
                          key={rec.id || index}
                          className="p-4 rounded-2xl bg-white/90 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black uppercase">
                                  {rec.classLevel}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">
                                  {formattedDate}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 leading-snug">
                                {rec.topicTitle}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Hasil: <span className="font-bold text-emerald-700">{rec.correctCount} Benar</span> &bull; <span className="font-bold text-rose-600">{rec.wrongCount} Salah</span> &bull; Skor: <span className="font-black text-indigo-700">{rec.scorePercentage}%</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 text-amber-950 border border-amber-300 text-sm font-black inline-flex items-center gap-1 shadow-2xs">
                                +{rec.pointsEarned} Poin
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase mt-0.5">POIN TUGAS</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* TAB 3: REKAPITULASI NILAI & SERVER LOG */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {!loggedInStudent ? (
            <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#e0e5ec] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] text-center my-4 border border-indigo-200/50 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl shadow-inner">
                🔒
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                HALAMAN REKAPITULASI NILAI TERKUNCI &bull; WAJIB LOGIN SISWA
              </h3>
              <p className="text-xs font-bold text-slate-600 max-w-lg mx-auto leading-relaxed">
                Halaman <span className="text-indigo-700 font-extrabold">Rekapitulasi Nilai</span> hanya dapat diakses oleh akun siswa terverifikasi. Silakan masukkan <span className="text-indigo-700 font-extrabold">Username</span> dan <span className="text-indigo-700 font-extrabold">Password</span> Anda pada formulir login di atas.
              </p>
            </div>
          ) : (
            <Card className="p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border-none">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">DATABASE REKAPITULASI SERVER</span>
                <h2 className="text-xl font-black text-slate-800">Rekap Hasil Quiz & Jawaban Siswa</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Seluruh riwayat pengerjaan quiz tercatat secara real-time dan tersimpan otomatis ke dalam database portal informasi.
                </p>
              </div>

              {/* RECAP TABLE */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-indigo-700 text-white uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="p-3">Waktu & Tanggal</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Topik Pembelajaran</th>
                      <th className="p-3 text-center">Benar / Salah</th>
                      <th className="p-3 text-center">Nilai (Skor Akhir)</th>
                      <th className="p-3 text-center">Poin</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {filteredRecapRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Belum ada riwayat pengerjaan quiz yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRecapRecords.map((rec) => {
                        const totalMaxScore = (rec.answers?.length || rec.totalQuestions || 10) * 10;
                        return (
                          <tr key={rec.id} className="hover:bg-indigo-50/50 transition-colors">
                            <td className="p-3 text-[11px] text-slate-500">
                              {new Date(rec.timestamp).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3 font-black text-slate-800">{rec.studentName}</td>
                            <td className="p-3 text-slate-600">{rec.studentClass}</td>
                            <td className="p-3 font-bold text-indigo-700 max-w-xs truncate">{rec.topicTitle}</td>
                            <td className="p-3 text-center">
                              <span className="text-emerald-600 font-bold">{rec.correctCount}</span> / <span className="text-red-500 font-bold">{rec.wrongCount}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                                rec.pointsEarned >= totalMaxScore * 0.8 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : rec.pointsEarned >= totalMaxScore * 0.6 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {rec.pointsEarned} / {totalMaxScore} Skor
                              </span>
                            </td>
                            <td className="p-3 text-center font-black text-indigo-600">+{rec.pointsEarned}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setSelectedDetailRecord(rec)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1 mx-auto"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                Detail Jawaban
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* QUIZ RESULT COMPLETED MODAL */}
      {showResultModal && quizCompletedResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full p-6 sm:p-8 rounded-[2.5rem] bg-[#e0e5ec] shadow-2xl border-none space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md">
                <CheckCircleIcon className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Quiz Berhasil Diselesaikan!</h2>
              <p className="text-xs font-bold text-slate-500">{quizCompletedResult.topicTitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-white/70 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">NILAI AKHIR (SKOR)</span>
                <p className="text-2xl font-black text-indigo-600">
                  {quizCompletedResult.pointsEarned} <span className="text-xs font-bold text-slate-400">/ {quizCompletedResult.answers.reduce((acc, a) => acc + (a.maxPoints || 10), 0)}</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/70 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">POIN DIRAIH</span>
                <p className="text-2xl font-black text-emerald-600">+{quizCompletedResult.pointsEarned}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/70 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">BENAR / SALAH</span>
                <p className="text-2xl font-black text-slate-800">{quizCompletedResult.correctCount} / {quizCompletedResult.wrongCount}</p>
              </div>
            </div>

            {/* ANSWER EVALUATION DETAIL */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Hasil Evaluasi Per Soal:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {quizCompletedResult.answers.map((ans, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border text-xs ${
                    ans.isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Soal #{idx + 1}</span>
                      <span className={ans.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                        {ans.earnedPoints} Poin
                      </span>
                    </div>
                    <p className="text-slate-600 italic">{ans.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setShowResultModal(false);
                setActiveTab('recap');
              }}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all"
            >
              Lihat Rekapitulasi & Tutup
            </button>
          </Card>
        </div>
      )}

      {/* DETAIL LEMBAR JAWABAN MODAL */}
      {selectedDetailRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full p-6 sm:p-8 rounded-[2.5rem] bg-[#e0e5ec] shadow-2xl border-none space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-300 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider block">
                  DETAIL LEMBAR JAWABAN SISWA
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedDetailRecord.studentName} ({selectedDetailRecord.studentClass})
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {selectedDetailRecord.topicTitle} &bull; Waktu: {new Date(selectedDetailRecord.timestamp).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailRecord(null)}
                className="w-9 h-9 rounded-full bg-slate-300/80 text-slate-700 font-black flex items-center justify-center cursor-pointer hover:bg-slate-400/80 transition-all shadow-xs"
              >
                ✕
              </button>
            </div>

            {/* RECORD SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-300/70 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 block">NILAI AKHIR (SKOR)</span>
                <p className="text-xl font-black text-slate-900">
                  {selectedDetailRecord.pointsEarned} <span className="text-xs font-bold text-slate-400">/ {selectedDetailRecord.answers.reduce((acc, a) => acc + (a.maxPoints || 10), 0)}</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-300/70 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 block">TOTAL POIN</span>
                <p className="text-xl font-black text-emerald-600">+{selectedDetailRecord.pointsEarned}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-300/70 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 block">BENAR / SALAH</span>
                <p className="text-xl font-black text-slate-800">
                  <span className="text-emerald-600">{selectedDetailRecord.correctCount}</span> / <span className="text-rose-500">{selectedDetailRecord.wrongCount}</span>
                </p>
              </div>
            </div>

            {/* ANSWERS BREAKDOWN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Rincian Pengerjaan Per Soal ({selectedDetailRecord.answers.length} Soal):
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Soal PG Evaluasi Otomatis &bull; Koreksi Manual Khusus Esai
                </span>
              </div>

              {selectedDetailRecord.answers.map((ans, idx) => {
                const isPG = ans.questionType === 'multiple_choice' || (ans.options && ans.options.length > 0);
                const selectedOptIdx = ans.studentAnswer ? parseInt(ans.studentAnswer, 10) : NaN;
                const studentAnsText = !isNaN(selectedOptIdx) && ans.options?.[selectedOptIdx]
                  ? `[${String.fromCharCode(65 + selectedOptIdx)}] ${ans.options[selectedOptIdx]}`
                  : ans.studentAnswer || '(Kosong / Tidak Dijawab)';

                const keyOptIdx = ans.correctOptionIndex ?? 0;
                const correctKeyText = ans.options?.[keyOptIdx]
                  ? `[${String.fromCharCode(65 + keyOptIdx)}] ${ans.options[keyOptIdx]}`
                  : '-';

                /* JIKA SOAL PILIHAN GANDA (PG) - PANEL CLEAN BENAR (HIJAU) / SALAH (MERAH) */
                if (isPG) {
                  return (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 text-xs shadow-xs transition-all ${
                        ans.isCorrect
                          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-500 text-rose-950'
                      }`}
                    >
                      {/* Header Soal PG */}
                      <div className="flex items-center justify-between border-b pb-2.5 border-slate-300/60">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                            SOAL #{idx + 1}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-200/90 text-slate-800 text-[10px] font-black uppercase">
                            Pilihan Ganda
                          </span>
                        </div>

                        {/* STATUS KETERANGAN BENAR / SALAH DI POJOK KANAN ATAS */}
                        {ans.isCorrect ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs flex items-center gap-1">
                            ✅ BENAR (+{ans.earnedPoints} Poin)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-xs flex items-center gap-1">
                            ❌ SALAH (0 Poin)
                          </span>
                        )}
                      </div>

                      {/* Teks Pertanyaan */}
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                        {ans.questionText}
                      </p>

                      {/* Detail Jawaban Siswa vs Kunci Resmi System */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                        <div className={`p-3 rounded-xl border ${
                          ans.isCorrect
                            ? 'bg-emerald-100/90 border-emerald-300/80 text-emerald-950'
                            : 'bg-rose-100/90 border-rose-300/80 text-rose-950'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider block opacity-75 mb-1">
                            Jawaban Siswa:
                          </span>
                          <p className="font-black text-xs sm:text-sm leading-snug">
                            {studentAnsText}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-300/80 text-slate-900 shadow-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider block text-slate-600 mb-1">
                            Kunci Jawaban Resmi System:
                          </span>
                          <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                            {correctKeyText}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                /* JIKA SOAL ESAI / ANALISIS TEKNIS (MEMILIKI TOMBOL KOREKSI MANUAL GURU) */
                return (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3.5 text-xs shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          SOAL #{idx + 1}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-amber-200/90 text-amber-900 text-[10px] font-black uppercase">
                          Esai / Analisis Teknis
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ans.isCorrect && ans.earnedPoints > 0 ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                            ✅ BENAR ({ans.earnedPoints} Poin)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-xs">
                            ❌ SALAH (0 Poin)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {ans.questionText}
                    </p>

                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase block mb-1">
                        Jawaban Esai Siswa:
                      </span>
                      <p className="p-3 rounded-xl bg-white text-slate-800 font-mono text-xs border border-slate-300 leading-relaxed shadow-inner">
                        {ans.studentAnswer || '(Kosong / Tidak Dijawab)'}
                      </p>
                    </div>

                    {ans.modelAnswer && (
                      <div>
                        <span className="text-[11px] font-black text-slate-800 uppercase block mb-1">
                          Model Jawaban / Acuan Penilaian Guru:
                        </span>
                        <p className="p-2.5 rounded-xl bg-slate-100 text-slate-900 font-medium text-xs border border-slate-300 leading-relaxed">
                          {ans.modelAnswer}
                        </p>
                      </div>
                    )}

                    {ans.keywords && ans.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-600 uppercase">Kata Kunci Utama:</span>
                        {ans.keywords.map((kw, kwIdx) => (
                          <span key={kwIdx} className="px-2 py-0.5 rounded-md bg-white text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* FITUR KOREKSI MANUAL GURU KHUSUS ESAI */}
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-[11px] font-black text-slate-800 uppercase block">
                          ✏️ Koreksi Manual Guru (Khusus Esai):
                        </span>
                        <p className="text-[10px] font-semibold text-slate-600">
                          Status Evaluasi: {ans.feedback}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleAdminGradeEssayAnswer(selectedDetailRecord, idx, true)}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                            ans.isCorrect && ans.earnedPoints > 0
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          }`}
                        >
                          ✅ Tandai BENAR ({ans.maxPoints || 10} Poin)
                        </button>

                        <button
                          onClick={() => handleAdminGradeEssayAnswer(selectedDetailRecord, idx, false)}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                            !ans.isCorrect || ans.earnedPoints === 0
                              ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                          }`}
                        >
                          ❌ Tandai SALAH (0 Poin)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedDetailRecord(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-md"
            >
              Selesai & Tutup Lembar Jawaban
            </button>
          </Card>
        </div>
      )}

    </div>
  );
};
