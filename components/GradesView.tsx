
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
// FIX: Using 'AcademicGrade' instead of 'Grade' which doesn't exist in types.ts.
import { AcademicGrade, School, Student, Notification } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { UploadIcon, GradeIcon, MenuIcon } from './icons/Icons';
import { NotificationBell } from './NotificationBell';

interface GradesViewProps {
    grades: AcademicGrade[];
    students: Student[];
    schoolType: School;
    onMenuClick: () => void;
    notifications: Notification[];
    onNotificationsOpen: () => void;
}

export const GradesView: React.FC<GradesViewProps> = ({ grades, students, schoolType, onMenuClick, notifications, onNotificationsOpen }) => {
    const [selectedClass, setSelectedClass] = useState('Semua');
    const [selectedAssessment, setSelectedAssessment] = useState<'pts' | 'pas'>('pts');

    const classes = ['Semua', 'X', 'XI', 'XII'];

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const chartData = useMemo(() => {
        return grades.map(grade => {
            const student = studentMap.get(grade.studentId);
            if (!student) return null;
            return {
                name: student.fullName,
                class: student.class,
                pts: grade.pts,
                pas: grade.pas,
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [grades, studentMap]);

    const filteredGrades = selectedClass === 'Semua' 
        ? chartData 
        : chartData.filter(grade => grade.class === selectedClass);


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
             // In a real app, you would parse the XLS/PDF/DOCX here.
            // For this demo, we'll just show an alert.
            alert(`File "${e.target.files[0].name}" diunggah. Parsing data tidak diimplementasikan.`);
        }
    }

    const assessmentName = selectedAssessment.toUpperCase();
    const dataKey = selectedAssessment;
    const barColor = selectedAssessment === 'pts' ? '#4f46e5' : '#16a34a'; // Indigo for PTS, Green for PAS
    const chartHeight = Math.max(400, filteredGrades.length * 40); // 40px per student, min 400px

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
        <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
                        <MenuIcon className="w-6 h-6 text-slate-700" />
                    </button>
                    <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_#ffffff]">
                        <GradeIcon className="w-8 h-8 text-rose-500"/>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Grafik Penilaian</h1>
                        <p className="text-slate-500 text-sm sm:text-base">Analisis visual data penilaian siswa (PTS & PAS).</p>
                    </div>
                </div>
                <div className="flex items-center justify-end flex-wrap gap-4 w-full sm:w-auto">
                    <label className="py-1.5 px-3 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 bg-green-600 text-white shadow-md hover:bg-green-700 cursor-pointer flex items-center gap-2 shimmer-active">
                        <UploadIcon className="w-5 h-5"/>
                        <span>Impor Nilai</span>
                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                    <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                </div>
            </div>
        </Card>

        <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-start items-center flex-wrap">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 text-sm">Kelas:</span>
                <div className="flex flex-wrap gap-1 bg-[#e0e5ec] p-1 rounded-xl shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">
                    {classes.map(className => (
                        <button
                            type="button"
                            key={className}
                            onClick={() => setSelectedClass(className)}
                            className={`py-1 px-3 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                                selectedClass === className ? 'bg-green-600 text-white shadow-md shimmer-active' : 'text-slate-600'
                            }`}
                        >
                            {className === 'Semua' ? 'Semua' : className}
                        </button>
                    ))}
                </div>
            </div>
             <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 text-sm">Kegiatan:</span>
                <div className="flex flex-wrap gap-1 bg-[#e0e5ec] p-1 rounded-xl shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">
                    <button
                        type="button"
                        onClick={() => setSelectedAssessment('pts')}
                        className={`py-1 px-3 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                            selectedAssessment === 'pts' ? 'bg-green-600 text-white shadow-md shimmer-active' : 'text-slate-600'
                        }`}
                    >
                        PTS
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedAssessment('pas')}
                        className={`py-1 px-3 text-xs sm:text-sm rounded-lg font-semibold transition-all duration-300 ${
                            selectedAssessment === 'pas' ? 'bg-green-600 text-white shadow-md shimmer-active' : 'text-slate-600'
                        }`}
                    >
                        PAS
                    </button>
                </div>
            </div>
        </Card>

        <Card className="p-4 sm:p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex-shrink-0">
                Hasil {assessmentName} {selectedClass !== 'Semua' ? `Kelas ${selectedClass}` : 'Semua Kelas'}
            </h2>
             {filteredGrades.length > 0 ? (
                <div className="w-full flex-1 overflow-y-auto">
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                            layout="vertical"
                            data={filteredGrades}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={barColor} stopOpacity={0.4}/>
                                    <stop offset="100%" stopColor={barColor} stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1d9e6" horizontal={false} />
                            <XAxis type="number" stroke="#64748b" domain={[0, 100]} />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                stroke="#64748b" 
                                tick={{ fontSize: 11 }} 
                                width={150}
                                interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(224, 229, 236, 0.5)' }}
                                contentStyle={{ 
                                    backgroundColor: '#e0e5ec', 
                                    border: 'none', 
                                    borderRadius: '1rem',
                                    boxShadow: '3px 3px 6px #bec3c9, -3px -3px 6px #ffffff'
                                }} 
                            />
                            <Legend wrapperStyle={{ paddingTop: '15px' }} />
                            <ReferenceLine x={75} label={{ value: 'KKM', position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="4 4" />
                            <Bar 
                                dataKey={dataKey} 
                                name={`Nilai ${assessmentName}`}
                                fill="url(#barGradient)" 
                                radius={[0, 8, 8, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <p>Tidak ada data nilai untuk filter yang dipilih.</p>
                </div>
            )}
        </Card>
    </div>
  );
};
