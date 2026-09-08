import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { Header } from './Header';
import { Notification } from '../types';
import { 
  QuizResultRecord, 
  QuizAnswerRecord, 
  getStoredQuizResults, 
  updateQuizResultByAdmin, 
  deleteQuizResultRecord,
  ALL_QUIZ_TOPICS,
  getActiveTopicIds,
  saveActiveTopicIds,
  QuizTopicInfo
} from '../data/quizData';
import { generateCleanStudents } from '../data/schoolData';
import { 
  PaperPenIcon, 
  CheckCircleIcon, 
  InfoIcon, 
  SearchIcon, 
  RefreshIcon,
  TrophyIcon,
  PointsIcon,
  DownloadIcon,
  PrinterIcon,
  EyeIcon,
  UserIcon,
  ChevronRightIcon,
  AwardIcon,
  CalendarIcon,
  LogoutIcon
} from './icons/Icons';

interface DataQuizViewProps {
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
  onShowNotification?: (type: 'success' | 'error' | 'info', text: string) => void;
  onLogout?: () => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DataQuizView: React.FC<DataQuizViewProps> = ({ 
  onMenuClick, 
  notifications, 
  onNotificationsOpen,
  onShowNotification,
  onLogout
}) => {
  // Active Tab: 'results' | 'recap' | 'settings'
  const [activeTab, setActiveTab] = useState<'results' | 'recap' | 'settings'>('results');

  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | 'Kelas X' | 'Kelas XI' | 'Kelas XII'>('ALL');
  
  // Selected record for manual evaluation modal
  const [selectedRecord, setSelectedRecord] = useState<QuizResultRecord | null>(null);

  // Active topics configuration state
  const [activeTopicIds, setActiveTopicIds] = useState<string[]>(() => getActiveTopicIds());
  const [settingLevelFilter, setSettingLevelFilter] = useState<'ALL' | 'Kelas X' | 'Kelas XI' | 'Kelas XII'>('ALL');
  const [settingSearchQuery, setSettingSearchQuery] = useState('');

  // --- REKAPITULASI NILAI & POIN SISWA STATE ---
  const [recapPeriodFilter, setRecapPeriodFilter] = useState<'ALL' | 'MONTH' | 'SEMESTER_1' | 'SEMESTER_2'>('ALL');
  const [recapSelectedMonth, setRecapSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [recapSelectedYear, setRecapSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [recapClassFilter, setRecapClassFilter] = useState<'ALL' | 'Kelas X' | 'Kelas XI' | 'Kelas XII'>('ALL');
  const [recapSearch, setRecapSearch] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<{
    id: string;
    name: string;
    nis: string;
    nisn: string;
    className: string;
    classLevel: string;
    records: QuizResultRecord[];
  } | null>(null);

  // Load results from storage
  const reloadData = () => {
    const stored = getStoredQuizResults();
    setResults(stored);
    setActiveTopicIds(getActiveTopicIds());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Toggle single topic active state
  const handleToggleTopic = (topicId: string) => {
    let updated: string[];
    if (activeTopicIds.includes(topicId)) {
      updated = activeTopicIds.filter(id => id !== topicId);
    } else {
      updated = [...activeTopicIds, topicId];
    }
    setActiveTopicIds(updated);
    saveActiveTopicIds(updated);
    if (onShowNotification) {
      const topic = ALL_QUIZ_TOPICS.find(t => t.id === topicId);
      const isNowActive = updated.includes(topicId);
      onShowNotification(
        isNowActive ? 'success' : 'info',
        `Topik "${topic?.title || topicId}" ${isNowActive ? 'diaktifkan' : 'dinonaktifkan'} untuk siswa.`
      );
    }
  };

  // Toggle all topics for selected level
  const handleBatchToggleLevel = (targetLevel: 'ALL' | 'Kelas X' | 'Kelas XI' | 'Kelas XII', activate: boolean) => {
    let updated: string[];
    const targetTopics = targetLevel === 'ALL' 
      ? ALL_QUIZ_TOPICS 
      : ALL_QUIZ_TOPICS.filter(t => t.level === targetLevel);
    const targetIds = targetTopics.map(t => t.id);

    if (activate) {
      const set = new Set([...activeTopicIds, ...targetIds]);
      updated = Array.from(set);
    } else {
      updated = activeTopicIds.filter(id => !targetIds.includes(id));
    }

    setActiveTopicIds(updated);
    saveActiveTopicIds(updated);
    if (onShowNotification) {
      onShowNotification(
        activate ? 'success' : 'info',
        `Seluruh topik ${targetLevel === 'ALL' ? 'semua kelas' : targetLevel} berhasil ${activate ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}.`
      );
    }
  };

  // Filtered list for Setoran & Evaluasi
  const filteredResults = results.filter(r => {
    const sName = r.studentName || '';
    const sClass = r.studentClass || '';
    const tTitle = r.topicTitle || '';
    const sNis = r.studentNis || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = 
      sName.toLowerCase().includes(q) ||
      sClass.toLowerCase().includes(q) ||
      tTitle.toLowerCase().includes(q) ||
      (sNis ? sNis.includes(searchQuery) : false);

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'PENDING' ? !r.isGradedByAdmin :
      r.isGradedByAdmin;

    const matchesClass = 
      classFilter === 'ALL' ? true : r.classLevel === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Filter results for Rekapitulasi based on period & class
  const periodFilteredResults = useMemo(() => {
    return results.filter(r => {
      const date = new Date(r.timestamp);
      const rMonth = date.getMonth();
      const rYear = date.getFullYear();

      if (recapPeriodFilter === 'MONTH') {
        if (rMonth !== recapSelectedMonth || rYear !== recapSelectedYear) return false;
      } else if (recapPeriodFilter === 'SEMESTER_1') {
        // Semester Ganjil: Bulan Juli (6) s/d Desember (11)
        if (rMonth < 6 || rMonth > 11) return false;
      } else if (recapPeriodFilter === 'SEMESTER_2') {
        // Semester Genap: Bulan Januari (0) s/d Juni (5)
        if (rMonth < 0 || rMonth > 5) return false;
      }

      if (recapClassFilter !== 'ALL') {
        const rClass = r.studentClass || '';
        const levelTarget = recapClassFilter.replace('Kelas ', '');
        if (r.classLevel !== recapClassFilter && !rClass.includes(levelTarget)) {
          return false;
        }
      }

      return true;
    });
  }, [results, recapPeriodFilter, recapSelectedMonth, recapSelectedYear, recapClassFilter]);

  // Aggregation per student for Rekapitulasi Nilai & Poin
  const aggregatedStudentRecap = useMemo(() => {
    const cleanStudents = generateCleanStudents();

    // Map by lowercase student name
    const map = new Map<string, {
      id: string;
      name: string;
      nis: string;
      nisn: string;
      className: string;
      classLevel: 'Kelas X' | 'Kelas XI' | 'Kelas XII';
      quizzesTaken: number;
      totalPoints: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      records: QuizResultRecord[];
    }>();

    // Initialize with clean roster of students
    cleanStudents.forEach(st => {
      const studentName = st.fullName || (st as any).name || 'Siswa';
      const studentClass = st.class || 'X';
      const classLevel: 'Kelas X' | 'Kelas XI' | 'Kelas XII' = 
        studentClass === 'X' || (studentClass.includes('X') && !studentClass.includes('XI') && !studentClass.includes('XII')) ? 'Kelas X' :
        studentClass === 'XI' || studentClass.includes('XI') ? 'Kelas XI' : 'Kelas XII';

      const key = studentName.trim().toLowerCase();
      map.set(key, {
        id: st.id,
        name: studentName,
        nis: st.nis || '',
        nisn: st.nisn || '',
        className: `Kelas ${studentClass} TJKT`,
        classLevel,
        quizzesTaken: 0,
        totalPoints: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        records: []
      });
    });

    // Populate with filtered quiz submissions
    periodFilteredResults.forEach(r => {
      const studentName = r.studentName || 'Siswa';
      const key = studentName.trim().toLowerCase();
      let entry = map.get(key);
      if (!entry) {
        const studentClass = r.studentClass || 'Kelas X';
        entry = {
          id: r.studentId || `ST-${Date.now()}`,
          name: studentName,
          nis: r.studentNis || '-',
          nisn: '-',
          className: studentClass,
          classLevel: r.classLevel || (studentClass.includes('XII') ? 'Kelas XII' : studentClass.includes('XI') ? 'Kelas XI' : 'Kelas X'),
          quizzesTaken: 0,
          totalPoints: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          records: []
        };
        map.set(key, entry);
      }

      entry.quizzesTaken += 1;
      entry.totalPoints += (r.pointsEarned || 0);
      entry.records.push(r);
    });

    // Calculate averages and score extents
    const list = Array.from(map.values()).map(st => {
      if (st.records.length > 0) {
        const scores = st.records.map(rec => rec.scorePercentage || 0);
        const sumScore = scores.reduce((a, b) => a + b, 0);
        st.averageScore = Math.round(sumScore / st.records.length);
        st.highestScore = Math.max(...scores);
        st.lowestScore = Math.min(...scores);
      }
      return st;
    });

    // Filter by class level
    let filtered = list;
    if (recapClassFilter !== 'ALL') {
      filtered = filtered.filter(st => st.classLevel === recapClassFilter);
    }

    // Filter by search query
    if (recapSearch && recapSearch.trim()) {
      const q = recapSearch.trim().toLowerCase();
      filtered = filtered.filter(st => 
        (st.name || '').toLowerCase().includes(q) || 
        (st.className || '').toLowerCase().includes(q) ||
        (st.nis || '').includes(q)
      );
    }

    // Sort by totalPoints descending, then averageScore descending
    filtered.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.averageScore - a.averageScore;
    });

    return filtered;
  }, [periodFilteredResults, recapClassFilter, recapSearch]);

  // Predicate label helper
  const getGradePredicate = (avgScore: number, quizzesTaken: number) => {
    if (quizzesTaken === 0) return { label: 'Belum Ujian', grade: '-', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (avgScore >= 90) return { label: 'Sangat Baik', grade: 'A', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (avgScore >= 75) return { label: 'Baik', grade: 'B', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    if (avgScore >= 60) return { label: 'Cukup', grade: 'C', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Perlu Bimbingan', grade: 'D', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  // Period label helper
  const getPeriodDisplayLabel = () => {
    if (recapPeriodFilter === 'MONTH') {
      return `Bulan ${MONTH_NAMES[recapSelectedMonth]} ${recapSelectedYear}`;
    }
    if (recapPeriodFilter === 'SEMESTER_1') {
      return 'Semester Ganjil (Juli - Desember)';
    }
    if (recapPeriodFilter === 'SEMESTER_2') {
      return 'Semester Genap (Januari - Juni)';
    }
    return 'Semua Periode (Akumulasi Kumulatif Semester)';
  };

  // Enhanced Export: Excel (.xlsx) or CSV (.csv)
  const handleExportRecap = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const periodLabel = getPeriodDisplayLabel();
    const cleanClass = recapClassFilter === 'ALL' ? 'Semua_Kelas' : recapClassFilter.replace(/\s+/g, '_');
    const filename = `Rekapitulasi_Nilai_Poin_Quiz_TJKT_${cleanClass}_${periodLabel.replace(/[\s\(\)-]+/g, '_')}`;

    const headers = [
      'No',
      'NIS',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jumlah Ujian Dikerjakan',
      'Rata-Rata Skor (%)',
      'Nilai Tertinggi (%)',
      'Nilai Terendah (%)',
      'Akumulasi Poin Reward',
      'Predikat Nilai',
      'Status Ketuntasan'
    ];

    const dataRows = aggregatedStudentRecap.map((st, idx) => {
      const pred = getGradePredicate(st.averageScore, st.quizzesTaken);
      const isPassed = st.quizzesTaken > 0 && st.averageScore >= 75;
      return [
        idx + 1,
        st.nis || '-',
        st.nisn || '-',
        st.name || '',
        st.className || '',
        st.quizzesTaken || 0,
        `${st.averageScore || 0}%`,
        `${st.highestScore || 0}%`,
        `${st.lowestScore || 0}%`,
        st.totalPoints || 0,
        pred.label,
        st.quizzesTaken === 0 ? 'Belum Ujian' : (isPassed ? 'TUNTAS' : 'REMIDIAL / BELUM TUNTAS')
      ];
    });

    // Check if XLSX library is available
    if (format === 'xlsx' && (window as any).XLSX) {
      try {
        const XLSX = (window as any).XLSX;
        const wb = XLSX.utils.book_new();

        // Metadata header rows
        const wsData = [
          ['LAPORAN REKAPITULASI HASIL EVALUASI & AKUMULASI POIN KUIS SISWA'],
          ['SMK MANBAUL ULUM - PROGRAM KEAHLIAN TJKT'],
          [`Periode Rekapitulasi: ${periodLabel}`],
          [`Tingkat Kelas: ${recapClassFilter === 'ALL' ? 'Semua Kelas (X, XI, XII)' : recapClassFilter}`],
          [`Guru Pengampu: Herlambang Lasena, S.T.`],
          [`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
          [],
          headers,
          ...dataRows,
          [],
          ['--- RINGKASAN STATISTIK KELAS ---'],
          ['Total Siswa Terdaftar:', aggregatedStudentRecap.length],
          ['Total Siswa Aktif Kuis:', aggregatedStudentRecap.filter(s => s.quizzesTaken > 0).length],
          ['Rata-rata Skor Kelas (%):', aggregatedStudentRecap.length > 0 ? `${Math.round(aggregatedStudentRecap.reduce((a, b) => a + b.averageScore, 0) / aggregatedStudentRecap.length)}%` : '0%'],
          ['Total Poin Reward Terkumpul:', aggregatedStudentRecap.reduce((a, b) => a + b.totalPoints, 0)]
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 6 },  // No
          { wch: 14 }, // NIS
          { wch: 16 }, // NISN
          { wch: 30 }, // Nama Siswa
          { wch: 14 }, // Kelas
          { wch: 22 }, // Jml Kuis
          { wch: 18 }, // Rata-rata
          { wch: 18 }, // Tertinggi
          { wch: 18 }, // Terendah
          { wch: 22 }, // Total Poin
          { wch: 20 }, // Predikat
          { wch: 24 }  // Status
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Nilai & Poin');
        XLSX.writeFile(wb, `${filename}.xlsx`);

        if (onShowNotification) {
          onShowNotification('success', 'Laporan Rekapitulasi berhasil diekspor ke format Excel (.xlsx).');
        }
        return;
      } catch (err) {
        console.error('Failed to export with XLSX, falling back to CSV', err);
      }
    }

    // CSV Fallback with UTF-8 BOM
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      [`"LAPORAN REKAPITULASI HASIL EVALUASI & AKUMULASI POIN KUIS SISWA"`],
      [`"SMK MANBAUL ULUM - TJKT - Periode: ${periodLabel} - Kelas: ${recapClassFilter}"`],
      [`"Guru Pengampu: Herlambang Lasena, S.T. - Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}"`],
      [],
      headers.map(h => `"${h}"`),
      ...dataRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`))
    ].map(e => Array.isArray(e) ? e.join(',') : e).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowNotification) {
      onShowNotification('success', 'Laporan Rekapitulasi berhasil diekspor ke format CSV (.csv).');
    }
  };

  // Open dedicated Print Modal
  const handlePrintRecapReport = () => {
    setShowPrintPreview(true);
  };

  // Open detail / grading modal for a record
  const handleOpenGradingModal = (record: QuizResultRecord) => {
    setSelectedRecord(record);
  };

  // Admin manual grading for essay / questions (same logic and design as QuizPointsView)
  const handleAdminGradeAnswer = (questionIndex: number, markCorrect: boolean) => {
    if (!selectedRecord) return;
    const maxPts = selectedRecord.answers?.[questionIndex]?.maxPoints || 10;
    
    const updatedAnswers = (selectedRecord.answers || []).map((ans, idx) => {
      if (idx !== questionIndex) return ans;
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
    const newScorePercentage = maxPossible > 0 ? Math.round((newTotalPoints / maxPossible) * 100) : 0;

    const updatedRecord: QuizResultRecord = {
      ...selectedRecord,
      answers: updatedAnswers,
      pointsEarned: newTotalPoints,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      scorePercentage: newScorePercentage,
      isGradedByAdmin: true,
      adminGradedAt: Date.now()
    };

    updateQuizResultByAdmin(updatedRecord);
    setSelectedRecord(updatedRecord);
    setResults(getStoredQuizResults());

    if (onShowNotification) {
      onShowNotification('success', markCorrect ? 'Soal berhasil ditandai BENAR.' : 'Soal berhasil ditandai SALAH.');
    }
  };

  // Delete submission
  const handleDeleteRecord = (id: string, studentName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus setoran quiz dari "${studentName}"? Data poin akan disinkronkan ulang.`)) {
      deleteQuizResultRecord(id);
      reloadData();
      if (onShowNotification) {
        onShowNotification('info', `Data quiz milik ${studentName} berhasil dihapus.`);
      }
    }
  };

  // Metrics
  const totalSubmissions = results.length;
  const pendingGrading = results.filter(r => !r.isGradedByAdmin).length;
  const completedGrading = results.filter(r => r.isGradedByAdmin).length;
  const avgScore = totalSubmissions > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.pointsEarned, 0) / totalSubmissions) 
    : 0;

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
      <Header
        onMenuClick={onMenuClick}
        notifications={notifications}
        onNotificationsOpen={onNotificationsOpen}
        onBack={() => window.location.hash = ''}
        title="DATA QUIZ & EVALUASI MURID"
        subtitle="Menu khusus pemeriksaan jawaban kuis, koreksi manual, dan integrasi poin siswa"
        rightAction={
          <button
            type="button"
            onClick={() => {
              if (onLogout) onLogout();
              window.location.hash = '';
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-98"
            title="Keluar dari Data Quiz dan kembali ke Menu Suite Utama"
          >
            <LogoutIcon className="w-4 h-4 text-white" />
            <span className="hidden xs:inline">Keluar Suite</span>
          </button>
        }
      />

      {/* NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-slate-200/80 shadow-inner">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <PaperPenIcon className="w-4 h-4" /> Setoran & Evaluasi Jawaban ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('recap')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'recap'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <TrophyIcon className="w-4 h-4 text-amber-300" /> Rekap Nilai & Poin Siswa
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <CheckCircleIcon className="w-4 h-4 text-emerald-300" /> Manajemen Soal Kuis ({activeTopicIds.length}/{ALL_QUIZ_TOPICS.length} Aktif)
        </button>
      </div>

      {activeTab === 'results' && (
        <>
          {/* STATS OVERVIEW - Clean, functional layout without decorative icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Setoran</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalSubmissions} <span className="text-xs font-normal text-slate-400">Berkas</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Tersimpan dari kuis siswa</p>
        </Card>

        <Card className="p-4 bg-amber-50 border border-amber-200 shadow-sm rounded-2xl">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Perlu Evaluasi Guru</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingGrading} <span className="text-xs font-normal text-amber-700">Setoran</span></p>
          <p className="text-[11px] text-amber-700 mt-1">Menunggu pemeriksaan manual</p>
        </Card>

        <Card className="p-4 bg-emerald-50 border border-emerald-200 shadow-sm rounded-2xl">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Sudah Dinilai</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{completedGrading} <span className="text-xs font-normal text-emerald-700">Setoran</span></p>
          <p className="text-[11px] text-emerald-700 mt-1">Poin akhir tervalidasi</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rata-Rata Poin</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{avgScore} <span className="text-xs font-normal text-slate-400">Poin</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Skor kumulatif kelas</p>
        </Card>
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Cari Nama Murid, Kelas, atau Topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({results.length})
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Belum Evaluasi ({pendingGrading})
            </button>

            <button
              onClick={() => setStatusFilter('GRADED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'GRADED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Sudah Evaluasi ({completedGrading})
            </button>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="Kelas X">Kelas X</option>
              <option value="Kelas XI">Kelas XI</option>
              <option value="Kelas XII">Kelas XII</option>
            </select>

            <button
              onClick={reloadData}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-all"
            >
              Segarkan
            </button>
          </div>
        </div>
      </Card>

      {/* REKAPITULASI TABLE */}
      <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daftar Rekap Jawaban Masuk Murid</h3>
            <p className="text-xs text-slate-500">Klik "Detail Jawaban" untuk memeriksa rincian lembar jawaban murid</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {filteredResults.length} Berkas
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-bold text-slate-600">Belum Ada Setoran Quiz</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ketika murid menyelesaikan kuis pada modul "QUIZZ & POIN", jawaban mereka akan otomatis tersimpan dan muncul di halaman ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black tracking-wider">
                  <th className="p-3">Waktu Setor</th>
                  <th className="p-3">Siswa & Kelas</th>
                  <th className="p-3">Topik Quizz TJKT</th>
                  <th className="p-3 text-center">Status Evaluasi</th>
                  <th className="p-3 text-center">Soal Terjawab</th>
                  <th className="p-3 text-right">Poin Akhir</th>
                  <th className="p-3 text-center">Aksi Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResults.map((rec) => {
                  const dateStr = new Date(rec.timestamp).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{rec.studentName}</div>
                        <div className="text-[11px] text-indigo-600 font-medium">{rec.studentClass}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{rec.topicTitle}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{rec.classLevel}</div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {rec.isGradedByAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Sudah Evaluasi Guru
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                            Perlu Evaluasi Guru
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-600">
                        {rec.answers ? rec.answers.filter(a => a.studentAnswer && a.studentAnswer.trim() !== '').length : 0} / {rec.totalQuestions} Soal
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="text-sm font-black text-indigo-700">{rec.pointsEarned} <span className="text-[10px] text-slate-400 font-normal">Poin</span></div>
                        <div className="text-[10px] text-slate-400">Skor: {rec.scorePercentage}%</div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenGradingModal(rec)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Detail Jawaban
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id, rec.studentName)}
                            className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 text-xs transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
        </>
      )}

      {/* REKAPITULASI NILAI & POIN SISWA TAB */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          {/* HEADER & FILTER PERIODE GURU */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase flex items-center gap-1">
                    <TrophyIcon className="w-3 h-3" /> REKAPITULASI GURU
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" /> MONITORING REALTIME
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Rekapitulasi Nilai & Akumulasi Poin Siswa
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Monitoring perolehan poin dan riwayat hasil ujian siswa seluruh kelas (Kelas X, XI, XII) secara realtime untuk rekap bulanan dan penilaian akhir semester.
                </p>
              </div>

              {/* ACTION BUTTONS (CETAK & EKSPOR) */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="inline-flex rounded-xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleExportRecap('xlsx')}
                    className="px-3.5 py-2.5 rounded-l-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border-r border-emerald-500"
                    title="Ekspor ke format Microsoft Excel (.xlsx)"
                  >
                    <DownloadIcon className="w-4 h-4" /> Ekspor Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportRecap('csv')}
                    className="px-2.5 py-2.5 rounded-r-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all cursor-pointer"
                    title="Ekspor ke format CSV (.csv)"
                  >
                    CSV
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePrintRecapReport}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" /> Cetak Rekapitulasi
                </button>
                <button
                  type="button"
                  onClick={reloadData}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                  title="Segarkan Data Realtime"
                >
                  <RefreshIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FILTER KONTROL PERIODE DAN KELAS */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Periode Filter */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Periode Rekapitulasi:
                </label>
                <select
                  value={recapPeriodFilter}
                  onChange={(e) => setRecapPeriodFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Periode (Akumulasi Kumulatif Semester)</option>
                  <option value="MONTH">Rekap Bulanan</option>
                  <option value="SEMESTER_1">Semester Ganjil (Juli - Desember)</option>
                  <option value="SEMESTER_2">Semester Genap (Januari - Juni)</option>
                </select>
              </div>

              {/* Month Selector if MONTH filter is active */}
              {recapPeriodFilter === 'MONTH' && (
                <div className="md:col-span-3 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Bulan:</label>
                    <select
                      value={recapSelectedMonth}
                      onChange={(e) => setRecapSelectedMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tahun:</label>
                    <select
                      value={recapSelectedYear}
                      onChange={(e) => setRecapSelectedYear(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[2025, 2026, 2027].map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Class Filter */}
              <div className={recapPeriodFilter === 'MONTH' ? "md:col-span-2" : "md:col-span-3"}>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tingkat Kelas:
                </label>
                <select
                  value={recapClassFilter}
                  onChange={(e) => setRecapClassFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Kelas (X, XI, XII)</option>
                  <option value="Kelas X">Kelas X TJKT</option>
                  <option value="Kelas XI">Kelas XI TJKT</option>
                  <option value="Kelas XII">Kelas XII TJKT</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className={recapPeriodFilter === 'MONTH' ? "md:col-span-3" : "md:col-span-5"}>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Cari Siswa / NIS:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama murid atau NIS..."
                    value={recapSearch}
                    onChange={(e) => setRecapSearch(e.target.value)}
                    className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>
          </Card>

          {/* METRIC OVERVIEW CARDS (4 METRICS: CLEAR & EFFECTIVE) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Siswa Terdaftar</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {aggregatedStudentRecap.length} <span className="text-xs font-normal text-slate-400">Siswa</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {recapClassFilter === 'ALL' ? 'Semua tingkat (X, XI, XII)' : recapClassFilter}
              </p>
            </Card>

            <Card className="p-4 bg-indigo-50 border border-indigo-200 shadow-sm rounded-2xl">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">Total Ujian Selesai</span>
              <p className="text-2xl font-black text-indigo-900 mt-1">
                {periodFilteredResults.length} <span className="text-xs font-normal text-indigo-600">Sesi</span>
              </p>
              <p className="text-[11px] text-indigo-700 mt-1">
                {aggregatedStudentRecap.filter(s => s.quizzesTaken > 0).length} siswa telah berpartisipasi
              </p>
            </Card>

            <Card className="p-4 bg-emerald-50 border border-emerald-200 shadow-sm rounded-2xl">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Rata-Rata Nilai Akhir</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {periodFilteredResults.length > 0 
                  ? Math.round(periodFilteredResults.reduce((acc, curr) => acc + curr.scorePercentage, 0) / periodFilteredResults.length) 
                  : 0}%
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Skor rata-rata seluruh ujian
              </p>
            </Card>

            <Card className="p-4 bg-amber-50 border border-amber-200 shadow-sm rounded-2xl">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Total Akumulasi Poin</span>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {aggregatedStudentRecap.reduce((acc, curr) => acc + curr.totalPoints, 0)} <span className="text-xs font-normal text-amber-600">Poin</span>
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Total reward poin terkumpul
              </p>
            </Card>
          </div>

          {/* TABEL REKAPITULASI AKUMULASI NILAI & POIN SISWA */}
          <Card className="p-0 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Tabel Rekapitulasi Nilai & Poin Siswa ({aggregatedStudentRecap.length} Siswa)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode: <strong className="text-indigo-700">{getPeriodDisplayLabel()}</strong> &bull; Filter Kelas: <strong className="text-slate-700">{recapClassFilter === 'ALL' ? 'Semua Kelas' : recapClassFilter}</strong>
                </p>
              </div>
            </div>

            {aggregatedStudentRecap.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-bold">Tidak ada data siswa yang cocok dengan filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4">Nama Siswa</th>
                      <th className="py-3.5 px-4">Kelas</th>
                      <th className="py-3.5 px-4 text-center">Ujian Selesai</th>
                      <th className="py-3.5 px-4 text-center">Rata-Rata Skor</th>
                      <th className="py-3.5 px-4 text-center">Tertinggi / Terendah</th>
                      <th className="py-3.5 px-4 text-center">Akumulasi Poin</th>
                      <th className="py-3.5 px-4 text-center">Predikat</th>
                      <th className="py-3.5 px-4 text-center">Rincian Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aggregatedStudentRecap.map((st, idx) => {
                      const predicate = getGradePredicate(st.averageScore, st.quizzesTaken);
                      const isTop3 = idx < 3 && st.totalPoints > 0;

                      return (
                        <tr key={st.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold">
                            {isTop3 ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                idx === 0 ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' :
                                idx === 1 ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-400' :
                                'bg-orange-100 text-orange-800 ring-2 ring-orange-300'
                              }`}>
                                {idx + 1}
                              </span>
                            ) : (
                              <span className="text-slate-400">{idx + 1}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{st.name}</span>
                              {idx === 0 && st.totalPoints > 0 && (
                                <TrophyIcon className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {st.nis && (
                              <span className="block text-[10px] font-normal text-slate-400">
                                NIS: {st.nis} {st.nisn && st.nisn !== '-' ? `| NISN: ${st.nisn}` : ''}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {st.className}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            <span className={st.quizzesTaken > 0 ? "text-indigo-700 font-black" : "text-slate-400"}>
                              {st.quizzesTaken} Kuis
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {st.quizzesTaken > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-md font-black text-xs text-slate-800 bg-slate-100">
                                {st.averageScore}%
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center text-xs font-semibold">
                            {st.quizzesTaken > 0 ? (
                              <span>
                                <span className="text-emerald-700 font-bold">{st.highestScore}%</span>
                                <span className="text-slate-300 mx-1">/</span>
                                <span className="text-slate-500">{st.lowestScore}%</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                              +{st.totalPoints} Poin
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${predicate.color}`}>
                              {predicate.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(st)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <EyeIcon className="w-3.5 h-3.5" /> Rincian Kuis
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SETTINGS TAB: MANAJEMEN AKTIFKAN SOAL */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    KONTROL AKSES SISWA
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                    SINKRONISASI REALTIME
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-800">Pengaturan Soal Kuis Aktif</h2>
                <p className="text-xs font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Aktifkan atau nonaktifkan topik di bawah ini. Soal yang dinonaktifkan akan disembunyikan secara otomatis dari modul Quiz & Poin yang diakses oleh siswa agar tidak bisa dikerjakan di luar jadwal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => handleBatchToggleLevel(settingLevelFilter, true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircleIcon className="w-4 h-4" /> Aktifkan Semua ({settingLevelFilter === 'ALL' ? 'Semua Kelas' : settingLevelFilter})
                </button>
                <button
                  onClick={() => handleBatchToggleLevel(settingLevelFilter, false)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🚫 Nonaktifkan Semua ({settingLevelFilter === 'ALL' ? 'Semua Kelas' : settingLevelFilter})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Topik Aktif</span>
                <span className="text-lg font-black text-slate-800">{activeTopicIds.length} <span className="text-xs font-normal text-slate-400">/ {ALL_QUIZ_TOPICS.length}</span></span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">Kelas X Aktif</span>
                <span className="text-lg font-black text-indigo-900">{activeTopicIds.filter(id => id.startsWith('x-')).length} <span className="text-xs font-normal text-indigo-400">/ 15</span></span>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100">
                <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">Kelas XI Aktif</span>
                <span className="text-lg font-black text-sky-900">{activeTopicIds.filter(id => id.startsWith('xi-')).length} <span className="text-xs font-normal text-sky-400">/ 15</span></span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Kelas XII Aktif</span>
                <span className="text-lg font-black text-amber-900">{activeTopicIds.filter(id => id.startsWith('xii-')).length} <span className="text-xs font-normal text-amber-400">/ 15</span></span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Cari Judul Topik Soal atau ID (e.g. MikroTik, x-1)..."
                  value={settingSearchQuery}
                  onChange={(e) => setSettingSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['ALL', 'Kelas X', 'Kelas XI', 'Kelas XII'] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSettingLevelFilter(lvl)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      settingLevelFilter === lvl
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl === 'ALL' ? 'Semua Kelas' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_QUIZ_TOPICS.filter(t => {
              const matchesLevel = settingLevelFilter === 'ALL' || t.level === settingLevelFilter;
              const matchesSearch = t.title.toLowerCase().includes(settingSearchQuery.toLowerCase()) || t.id.toLowerCase().includes(settingSearchQuery.toLowerCase());
              return matchesLevel && matchesSearch;
            }).map((topic) => {
              const isActive = activeTopicIds.includes(topic.id);
              return (
                <div
                  key={topic.id}
                  onClick={() => handleToggleTopic(topic.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isActive
                      ? 'bg-white border-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        topic.level === 'Kelas X' ? 'bg-indigo-100 text-indigo-700' :
                        topic.level === 'Kelas XI' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {topic.level}
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isActive ? '🟢 SOAL AKTIF' : '🔴 NONAKTIF'}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 leading-snug mb-2">{topic.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ID Topik: <span className="font-mono font-bold text-slate-700">{topic.id}</span> (10 Pertanyaan Bank Soal)
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      Akses Siswa: {isActive ? 'Terbuka' : 'Terkunci'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTopic(topic.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      {isActive ? 'Nonaktifkan Soal' : 'Aktifkan Soal'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL LEMBAR JAWABAN SISWA MODAL (IDENTIK DENGAN MODUL QUIZ & POIN) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full p-6 sm:p-8 rounded-[2.5rem] bg-[#e0e5ec] shadow-2xl border-none space-y-6 max-h-[90vh] overflow-y-auto my-8">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider block">
                  DETAIL LEMBAR JAWABAN SISWA
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedRecord.studentName} ({selectedRecord.studentClass})
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  {selectedRecord.topicTitle} &bull; Waktu: {new Date(selectedRecord.timestamp).toLocaleString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
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
                  {selectedRecord.pointsEarned} <span className="text-xs font-bold text-slate-400">/ {selectedRecord.answers ? selectedRecord.answers.reduce((acc, a) => acc + (a.maxPoints || 10), 0) : (selectedRecord.totalQuestions * 10)}</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-300/70 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 block">TOTAL POIN</span>
                <p className="text-xl font-black text-emerald-600">+{selectedRecord.pointsEarned}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-300/70 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-500 block">BENAR / SALAH</span>
                <p className="text-xl font-black text-slate-800">
                  <span className="text-emerald-600">{selectedRecord.correctCount}</span> / <span className="text-rose-500">{selectedRecord.wrongCount}</span>
                </p>
              </div>
            </div>

            {/* ANSWERS BREAKDOWN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300/60 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Rincian Pengerjaan Per Soal ({selectedRecord.answers?.length || 0} Soal):
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Soal PG Evaluasi Otomatis &bull; Koreksi Manual Khusus Esai
                </span>
              </div>

              {selectedRecord.answers?.map((ans, idx) => {
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

                    {/* DIAGRAM SVG IF AVAILABLE */}
                    {ans.diagramSvg && (
                      <div className="p-2 bg-slate-900 rounded-xl max-w-lg mx-auto" dangerouslySetInnerHTML={{ __html: ans.diagramSvg }} />
                    )}

                    <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {ans.questionText}
                    </p>

                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase block mb-1">
                        Jawaban Esai Siswa:
                      </span>
                      <p className="p-3 rounded-xl bg-white text-slate-800 font-mono text-xs border border-slate-300 leading-relaxed shadow-inner whitespace-pre-wrap">
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
                          type="button"
                          onClick={() => handleAdminGradeAnswer(idx, true)}
                          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                            ans.isCorrect && ans.earnedPoints > 0
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          }`}
                        >
                          ✅ Tandai BENAR ({ans.maxPoints || 10} Poin)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdminGradeAnswer(idx, false)}
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
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-md"
            >
              Selesai & Tutup Lembar Jawaban
            </button>
          </Card>
        </div>
      )}

      {/* MODAL RINCIAN RIWAYAT KUIS & POIN PER SISWA */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#e0e5ec] w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto border border-white/50">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-300">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                    PROFIL NILAI SISWA
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                    {selectedStudentDetail.className}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase">
                  {selectedStudentDetail.name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  NIS: {selectedStudentDetail.nis || '-'} &bull; NISN: {selectedStudentDetail.nisn || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>

            {/* STUDENT SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Ujian Selesai</span>
                <span className="text-xl font-black text-slate-800 mt-1 block">
                  {selectedStudentDetail.records.length} <span className="text-xs font-normal text-slate-400">Kuis</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm text-center">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">Rata-Rata Skor</span>
                <span className="text-xl font-black text-indigo-900 mt-1 block">
                  {selectedStudentDetail.records.length > 0 
                    ? Math.round(selectedStudentDetail.records.reduce((acc, c) => acc + c.scorePercentage, 0) / selectedStudentDetail.records.length)
                    : 0}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm text-center">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Total Poin Terkumpul</span>
                <span className="text-xl font-black text-amber-900 mt-1 block">
                  {selectedStudentDetail.records.reduce((acc, c) => acc + (c.pointsEarned || 0), 0)} <span className="text-xs font-normal text-amber-600">Poin</span>
                </span>
              </div>
            </div>

            {/* LIST OF COMPLETED QUIZZES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Daftar Riwayat Kuis Siswa ({selectedStudentDetail.records.length})
              </h4>

              {selectedStudentDetail.records.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <p className="text-xs font-bold">Siswa ini belum mengerjakan kuis pada periode ini.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedStudentDetail.records.map((rec, rIdx) => {
                    const rDate = new Date(rec.timestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={rec.id || rIdx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                              {rDate}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black">
                              ID: {rec.topicId}
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-slate-800">{rec.topicTitle}</h5>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>Benar: <strong className="text-emerald-700">{rec.correctCount}</strong> / {rec.totalQuestions}</span>
                            <span>Skor: <strong className="text-slate-800">{rec.scorePercentage}%</strong></span>
                            <span>Poin: <strong className="text-amber-600">+{rec.pointsEarned} Poin</strong></span>
                          </div>
                          {rec.adminNotes && (
                            <p className="text-[10px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded-lg mt-1 font-medium">
                              Catatan Guru: {rec.adminNotes}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentDetail(null);
                            handleOpenGradingModal(rec);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <EyeIcon className="w-3.5 h-3.5" /> Detail Jawaban
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="pt-4 border-t border-slate-300 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED OFFICIAL PRINTABLE REPORT MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm">
          <style>{`
            @media print {
              body {
                background: white !important;
              }
              body * {
                visibility: hidden;
              }
              #recap-print-sheet, #recap-print-sheet * {
                visibility: visible;
              }
              #recap-print-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* FLOATING ACTION TOOLBAR (HIDDEN IN PRINT) */}
          <div className="no-print w-full max-w-4xl mb-4 p-3.5 bg-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-white border border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <PrinterIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Pratinjau Dokumen Rekapitulasi Resmi
                </h4>
                <p className="text-[11px] text-slate-300">
                  Siap dicetak ke kertas A4 atau disimpan sebagai file PDF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportRecap('xlsx')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <DownloadIcon className="w-4 h-4" /> Unduh Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md ring-2 ring-indigo-400/40"
              >
                <PrinterIcon className="w-4 h-4" /> Cetak Sekarang / Simpan PDF
              </button>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* PRINTABLE DOCUMENT SHEET */}
          <div
            id="recap-print-sheet"
            className="bg-white text-slate-900 w-full max-w-4xl p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-300 font-sans my-2"
          >
            {/* KOP SURAT RESMI */}
            <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest leading-tight">
                PEMERINTAH DAERAH PROVINSI LAMPUNG &bull; DINAS PENDIDIKAN
              </h4>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-wide leading-tight mt-0.5">
                SMK MANBAUL ULUM
              </h2>
              <h3 className="text-xs sm:text-sm font-extrabold text-indigo-950 uppercase tracking-wider leading-tight">
                PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER & TELEKOMUNIKASI (TJKT)
              </h3>
              <p className="text-[10px] text-slate-600 mt-1">
                Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan &bull; Portal E-Learning & Evaluasi Quiz
              </p>
            </div>

            {/* JUDUL LAPORAN */}
            <div className="text-center my-4">
              <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase underline tracking-wider">
                LEMBAR REKAPITULASI EVALUASI QUIZ & AKUMULASI POIN SISWA
              </h3>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Tahun Ajaran 2025/2026 &bull; {getPeriodDisplayLabel()}
              </p>
            </div>

            {/* METADATA LAPORAN */}
            <div className="grid grid-cols-2 text-xs font-medium text-slate-800 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <p><strong>Tingkat Kelas:</strong> {recapClassFilter === 'ALL' ? 'Semua Tingkat (Kelas X, XI, XII)' : recapClassFilter}</p>
                <p><strong>Mata Pelajaran:</strong> Kejuruan TJKT (Administrasi Jaringan & Server)</p>
              </div>
              <div className="space-y-1 text-right">
                <p><strong>Guru Pengampu:</strong> Herlambang Lasena, S.T.</p>
                <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* RINGKASAN STATISTIK */}
            <div className="grid grid-cols-4 gap-2.5 text-center text-xs mb-4">
              <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-[10px] block text-slate-500 font-bold uppercase">Total Siswa</span>
                <span className="font-black text-slate-900 text-sm">{aggregatedStudentRecap.length} Siswa</span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-[10px] block text-slate-500 font-bold uppercase">Siswa Aktif Kuis</span>
                <span className="font-black text-indigo-700 text-sm">
                  {aggregatedStudentRecap.filter(s => s.quizzesTaken > 0).length} Siswa
                </span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-[10px] block text-slate-500 font-bold uppercase">Rata-rata Skor</span>
                <span className="font-black text-slate-900 text-sm">
                  {aggregatedStudentRecap.length > 0 
                    ? Math.round(aggregatedStudentRecap.reduce((a, b) => a + b.averageScore, 0) / aggregatedStudentRecap.length) 
                    : 0}%
                </span>
              </div>
              <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-[10px] block text-slate-500 font-bold uppercase">Total Poin Kelas</span>
                <span className="font-black text-amber-700 text-sm">
                  {aggregatedStudentRecap.reduce((a, b) => a + b.totalPoints, 0)} Poin
                </span>
              </div>
            </div>

            {/* TABEL HASIL EVALUASI LENGKAP */}
            <div className="overflow-hidden border border-slate-300 rounded-xl mb-6">
              <table className="w-full text-left text-[11px] text-slate-700 border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10 border-r border-slate-300">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">NIS / NISN</th>
                    <th className="py-2.5 px-3 border-r border-slate-300">Nama Siswa</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Kelas</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Kuis Selesai</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Rata-Rata</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Max / Min</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Total Poin</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300">Predikat</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {aggregatedStudentRecap.map((st, idx) => {
                    const pred = getGradePredicate(st.averageScore, st.quizzesTaken);
                    const isPassed = st.quizzesTaken > 0 && st.averageScore >= 75;

                    return (
                      <tr key={st.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-600 border-r border-slate-200">
                          {st.nis || '-'}{st.nisn && st.nisn !== '-' ? ` / ${st.nisn}` : ''}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{st.name}</td>
                        <td className="py-2 px-3 text-center font-semibold border-r border-slate-200">{st.className}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800 border-r border-slate-200">{st.quizzesTaken} Kuis</td>
                        <td className="py-2 px-3 text-center font-black border-r border-slate-200">{st.quizzesTaken > 0 ? `${st.averageScore}%` : '-'}</td>
                        <td className="py-2 px-3 text-center font-mono text-[10px] border-r border-slate-200">
                          {st.quizzesTaken > 0 ? `${st.highestScore}% / ${st.lowestScore}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-amber-800 border-r border-slate-200">+{st.totalPoints}</td>
                        <td className="py-2 px-3 text-center font-extrabold border-r border-slate-200">
                          {pred.grade} ({pred.label})
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-[10px]">
                          {st.quizzesTaken === 0 ? (
                            <span className="text-slate-400">Belum Ujian</span>
                          ) : isPassed ? (
                            <span className="text-emerald-700">TUNTAS</span>
                          ) : (
                            <span className="text-rose-600">REMIDIAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* LEMBAR TANDA TANGAN RESMI */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-900 break-inside-avoid">
              <div>
                <p className="font-semibold">Mengetahui,</p>
                <p className="font-bold">Kepala SMK Manbaul Ulum</p>
                <div className="h-16"></div>
                <p className="font-black underline uppercase text-slate-950">Muniroh</p>
                <p className="text-[10px] text-slate-500">NIP. -</p>
              </div>
              <div>
                <p className="font-semibold">
                  Way Kanan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-bold">Guru Pengampu TJKT</p>
                <div className="h-16"></div>
                <p className="font-black underline uppercase text-slate-950">Herlambang Lasena, S.T.</p>
                <p className="text-[10px] text-slate-500">NIP. -</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
