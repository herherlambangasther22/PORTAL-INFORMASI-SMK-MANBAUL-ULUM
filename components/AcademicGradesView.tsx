
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Student, Subject, School, Notification, GradesData, AcademicGrade } from '../types';
import { AcademicCapIcon, MenuIcon, DownloadIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import { NotificationBell } from './NotificationBell';

interface AcademicGradesViewProps {
  students: Student[];
  subjects: Subject[];
  schoolType: School;
  gradesData: GradesData;
  onUpdateGrades: (data: GradesData) => void;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

// Declare XLSX for export
declare var XLSX: any;

const CustomDropdown = ({ 
    label, 
    value, 
    options, 
    onChange, 
    zIndex = 10 
}: { 
    label: string, 
    value: string, 
    options: { value: string, label: string }[], 
    onChange: (val: string) => void, 
    zIndex?: number 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex flex-col w-full" ref={dropdownRef} style={{ zIndex }}>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 pl-1 block">{label}</span>
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 transition-all duration-300 bg-[#e0e5ec] text-slate-700 font-bold text-xs outline-none relative z-20 border border-slate-200/50
                        ${isOpen 
                            ? 'rounded-t-xl rounded-b-none shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] text-rose-600 border-b-transparent' 
                            : 'rounded-xl shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_rgba(255,255,255,0.5)]'
                        }
                    `}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
                </button>
                <div 
                    className={`absolute top-full left-0 right-0 bg-[#e0e5ec] rounded-b-xl shadow-[3px_3px_6px_#d1d9e6,-3px_3px_6px_rgba(255,255,255,0.5)] overflow-hidden transition-all duration-300 origin-top z-[100] border-x border-b border-slate-200/50
                        ${isOpen 
                            ? 'opacity-100 scale-y-100 visible' 
                            : 'opacity-0 scale-y-0 invisible'
                        }
                    `}
                >
                    <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar border-t border-slate-200/30">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg mb-0.5 last:mb-0
                                    ${value === opt.value 
                                        ? 'bg-rose-100 text-rose-700 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]' 
                                        : 'text-slate-600 hover:bg-slate-200/50 hover:pl-4 hover:text-rose-600'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AcademicGradesView: React.FC<AcademicGradesViewProps> = ({
  students,
  subjects,
  schoolType,
  gradesData,
  onUpdateGrades,
  onMenuClick,
  notifications,
  onNotificationsOpen
}) => {
  const classes = ['X', 'XI', 'XII'];
  
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.code || '');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Ditingkatkan agar lebih compact

  useEffect(() => {
    const defaultClasses = ['X', 'XI', 'XII'];
    setSelectedClass(defaultClasses[0]);
    if (subjects.length > 0) {
      setSelectedSubject(subjects[0].code);
    }
  }, [schoolType, subjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSubject]);

  const filteredStudents = useMemo(() => {
    return students
        .filter(s => s.class === selectedClass)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, selectedClass]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleGradeChange = (studentId: string, field: keyof AcademicGrade, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    const newGrades = { ...gradesData };
    if (!newGrades[studentId]) newGrades[studentId] = {};
    const currentGrade = newGrades[studentId][selectedSubject] || { studentId, subjectCode: selectedSubject, tugas: 0, uh: 0, pts: 0, pas: 0 };
    newGrades[studentId][selectedSubject] = { ...currentGrade, [field]: numValue };
    onUpdateGrades(newGrades);
  };

  const calculateFinalGrade = (grade?: AcademicGrade) => {
    if (!grade) return 0;
    return (grade.tugas * 0.2) + (grade.uh * 0.2) + (grade.pts * 0.3) + (grade.pas * 0.3);
  };

  const getPredicate = (finalGrade: number) => {
    if (finalGrade >= 90) return 'A';
    if (finalGrade >= 82) return 'B';
    if (finalGrade >= 75) return 'C';
    return 'D';
  };

  const handleExport = () => {
    if (typeof XLSX === 'undefined') { alert('Library Excel belum dimuat.'); return; }
    const exportData = filteredStudents.map(student => {
        const grade = gradesData[student.id]?.[selectedSubject];
        const final = calculateFinalGrade(grade);
        return { 'NIS': student.nis, 'Nama Siswa': student.fullName, 'Kelas': student.class, 'Tugas (20%)': grade?.tugas || 0, 'UH (20%)': grade?.uh || 0, 'PTS (30%)': grade?.pts || 0, 'PAS (30%)': grade?.pas || 0, 'Nilai Akhir': final.toFixed(1), 'Predikat': getPredicate(final) };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai Akademik");
    XLSX.writeFile(workbook, `Nilai_${selectedClass}_${selectedSubject}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      <Card className="p-4 sm:p-5 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden"><MenuIcon className="w-5 h-5 text-slate-700" /></button>
            <div className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]"><AcademicCapIcon className="w-7 h-7 text-rose-500"/></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Nilai Akademik</h1>
              <p className="text-slate-500 text-[10px] sm:text-xs">Input dan Rekapitulasi Nilai Siswa.</p>
            </div>
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto"><NotificationBell notifications={notifications} onOpen={onNotificationsOpen} /></div>
        </div>
      </Card>

      <Card className="p-3 flex flex-col md:flex-row gap-3 justify-between items-end bg-[#e0e5ec] sticky top-0 z-[60] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] border-none !overflow-visible" appearance="neumorphic">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 items-end">
          <div className="w-full sm:w-28"><CustomDropdown label="Kelas" value={selectedClass} options={classes.map(c => ({ value: c, label: c }))} onChange={setSelectedClass} zIndex={30} /></div>
          <div className="w-full sm:flex-1"><CustomDropdown label="Mata Pelajaran" value={selectedSubject} options={subjects.map(s => ({ value: s.code, label: s.name }))} onChange={setSelectedSubject} zIndex={20} /></div>
        </div>
        <button onClick={handleExport} className="w-full sm:w-auto py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 flex items-center justify-center gap-2 shimmer-active"><DownloadIcon className="w-4 h-4"/>Ekspor Excel</button>
      </Card>

      <Card className="h-fit overflow-hidden p-0 bg-[#e0e5ec] flex flex-col shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)] border border-slate-200/50 z-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 border-separate border-spacing-0">
            <thead className="text-xs text-slate-700 uppercase sticky top-0 z-40 bg-[#e0e5ec] shadow-sm">
              <tr>
                <th className="px-3 py-4 w-12 font-black text-center border-b border-slate-300 bg-[#e0e5ec] sticky left-0 z-50">No</th>
                <th className="px-4 py-4 font-black min-w-[200px] border-b border-slate-300 bg-[#e0e5ec] sticky left-12 z-50">Nama Siswa</th>
                <th className="px-2 py-4 text-center min-w-[90px] font-black border-b border-slate-300">Tugas (20%)</th>
                <th className="px-2 py-4 text-center min-w-[90px] font-black border-b border-slate-300">UH (20%)</th>
                <th className="px-2 py-4 text-center min-w-[90px] font-black border-b border-slate-300">PTS (30%)</th>
                <th className="px-2 py-4 text-center min-w-[90px] font-black border-b border-slate-300">PAS (30%)</th>
                <th className="px-3 py-4 text-center min-w-[110px] font-black border-b border-slate-300">Nilai Akhir</th>
                <th className="px-3 py-4 text-center min-w-[90px] font-black border-b border-slate-300">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const grade = gradesData[student.id]?.[selectedSubject];
                  const final = calculateFinalGrade(grade);
                  const predicate = getPredicate(final);
                  const isBelowKKM = final < 75;
                  return (
                    <tr key={student.id} className="group border-b border-slate-200/50 hover:bg-slate-200/30 transition-colors">
                      <td className="px-3 py-3 text-center text-slate-400 font-bold bg-[#e0e5ec] sticky left-0 z-10 border-b border-slate-200/30">{globalIndex}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 bg-[#e0e5ec] sticky left-12 z-10 border-b border-slate-200/30">
                        <div className="truncate w-44 sm:w-auto text-sm" title={student.fullName}>{student.fullName}</div>
                        <div className="text-[9px] text-slate-400 font-normal uppercase tracking-[0.15em] mt-0.5">NIS: {student.nis}</div>
                      </td>
                      <td className="px-2 py-2 border-b border-slate-200/30"><input type="number" min="0" max="100" value={grade?.tugas || ''} onChange={(e) => handleGradeChange(student.id, 'tugas', e.target.value)} className="custom-number-input w-full text-center h-9 px-1 rounded-xl border border-slate-200 bg-white/70 font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all shadow-sm" placeholder="0" /></td>
                      <td className="px-2 py-2 border-b border-slate-200/30"><input type="number" min="0" max="100" value={grade?.uh || ''} onChange={(e) => handleGradeChange(student.id, 'uh', e.target.value)} className="custom-number-input w-full text-center h-9 px-1 rounded-xl border border-slate-200 bg-white/70 font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all shadow-sm" placeholder="0" /></td>
                      <td className="px-2 py-2 border-b border-slate-200/30"><input type="number" min="0" max="100" value={grade?.pts || ''} onChange={(e) => handleGradeChange(student.id, 'pts', e.target.value)} className="custom-number-input w-full text-center h-9 px-1 rounded-xl border border-slate-200 bg-white/70 font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all shadow-sm" placeholder="0" /></td>
                      <td className="px-2 py-2 border-b border-slate-200/30"><input type="number" min="0" max="100" value={grade?.pas || ''} onChange={(e) => handleGradeChange(student.id, 'pas', e.target.value)} className="custom-number-input w-full text-center h-9 px-1 rounded-xl border border-slate-200 bg-white/70 font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white transition-all shadow-sm" placeholder="0" /></td>
                      <td className={`px-3 py-3 text-center text-sm font-black border-b border-slate-200/30 ${isBelowKKM ? 'text-red-600' : 'text-green-600'}`}>{final.toFixed(1)}</td>
                      <td className="px-3 py-3 text-center text-sm font-black text-slate-800 border-b border-slate-200/30">{predicate}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-500 italic bg-[#e0e5ec]"><AcademicCapIcon className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-bold">Tidak ada data siswa untuk filter yang dipilih.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="p-4 bg-[#e0e5ec] border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Menampilkan <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> dari <span className="text-slate-800">{filteredStudents.length}</span> Siswa</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] text-slate-600 hover:text-rose-600 disabled:opacity-40 disabled:shadow-none transition-all"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <div className="flex gap-1 px-3 py-1.5 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)]">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}>{page}</button>
                        ))}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] text-slate-600 hover:text-rose-600 disabled:opacity-40 disabled:shadow-none transition-all"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
        )}
      </Card>
    </div>
  );
};
