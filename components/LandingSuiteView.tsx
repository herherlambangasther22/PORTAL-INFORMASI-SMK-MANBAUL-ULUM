
import React from 'react';
import { Card } from './Card';
import { SchoolIcon, TeacherIcon, StudentIcon, InfoIcon, ChevronRightIcon, UploadIcon, BookOpenIcon, PaperPenIcon } from './icons/Icons';
import { PORTAL_NAME } from '../constants';
import { imageFileToBase64 } from '../utils';

interface LandingSuiteViewProps {
    portalLogo?: string;
    onUpdateLogo?: (logo: string) => void;
}

export const LandingSuiteView: React.FC<LandingSuiteViewProps> = ({ portalLogo, onUpdateLogo }) => {
    const suites = [
        {
            id: 'info',
            title: 'Portal Informasi',
            desc: 'Aplikasi manajemen data sekolah, kurikulum, dan administrasi utama.',
            icon: InfoIcon,
            color: 'text-blue-800',
            bg: 'bg-blue-100/70',
            hash: '#/portal-info'
        },
        {
            id: 'learning',
            title: 'Portal Pembelajaran',
            desc: 'Materi TJKT (PDF, Video, Gambar, PPT) & link resmi aplikasi acuan belajar.',
            icon: BookOpenIcon,
            color: 'text-indigo-800',
            bg: 'bg-indigo-100/70',
            hash: '#/learning-portal'
        },
        {
            id: 'quiz',
            title: 'QUIZZ & POIN',
            desc: 'Evaluasi interaktif 45 topik TJKT, analisis diagram, poin & rekap skor server.',
            icon: PaperPenIcon,
            color: 'text-amber-800',
            bg: 'bg-amber-100/70',
            hash: '#/quiz-points'
        },
        {
            id: 'data-quiz',
            title: 'Data Quiz',
            desc: 'Rekapitulasi, koreksi manual, dan evaluasi hasil jawaban kuis murid.',
            icon: PaperPenIcon,
            color: 'text-rose-800',
            bg: 'bg-rose-100/70',
            hash: '#/data-quiz'
        },
        {
            id: 'teacher',
            title: 'Scan Station Guru',
            desc: 'Sistem presensi terpadu Guru via RFID IoT, QR Code, dan Scan Biometrik Wajah.',
            icon: TeacherIcon,
            color: 'text-blue-900',
            bg: 'bg-blue-100/70',
            hash: '#/teacher-portal'
        },
        {
            id: 'student',
            title: 'Scan Station Siswa',
            desc: 'Sistem presensi mandiri Siswa via Kartu RFID, QR Code, dan Scan Biometrik Wajah.',
            icon: StudentIcon,
            color: 'text-indigo-900',
            bg: 'bg-indigo-100/70',
            hash: '#/student-kiosk'
        }
    ];

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdateLogo) return;
        try {
            const base64 = await imageFileToBase64(file, 5 * 1024 * 1024); // 5MB limit
            onUpdateLogo(base64);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Gagal mengunggah logo.');
        }
    };

    const topSuites = suites.slice(0, 4);
    const bottomSuites = suites.slice(4);

    return (
        <div className="min-h-screen bg-[#e0e5ec] flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden">
            <div className="text-center mb-10 animate-slide-up-fade">
                <div className="inline-flex items-center gap-4 mb-4 relative group">
                    <div className="p-4 rounded-[2rem] bg-[#e0e5ec] shadow-[6px_6px_14px_#cad4e2,-6px_-6px_14px_#ffffff] border border-white/60 relative overflow-hidden w-24 h-24 flex items-center justify-center">
                        {portalLogo ? (
                            <img src={portalLogo} alt="Portal Logo" className="w-full h-full object-contain" />
                        ) : (
                            <SchoolIcon className="w-12 h-12 text-blue-900" />
                        )}
                        {onUpdateLogo && (
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 text-white">
                                <UploadIcon className="w-6 h-6 mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Ubah</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/jpg" 
                                    onChange={handleLogoUpload}
                                />
                            </label>
                        )}
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-none tracking-tighter uppercase">{PORTAL_NAME}</h1>
                        <p className="text-xs sm:text-sm font-black text-blue-900 tracking-[0.2em] mt-1.5">SISTEM LAYANAN DIGITAL TERPADU</p>
                    </div>
                </div>
            </div>

            {/* Container for Suite Cards */}
            <div className="w-full max-w-7xl flex flex-col items-center gap-6 xl:gap-8">
                {/* Top Row: 4 Modules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 w-full">
                    {topSuites.map((suite, idx) => (
                        <Card 
                            key={suite.id} 
                            className="group relative p-6 xl:p-8 flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 border border-white/60 hover:border-blue-900/50 shadow-[10px_10px_22px_#cad4e2,-10px_-10px_22px_#ffffff] hover:shadow-[0_20px_35px_-8px_rgba(15,36,68,0.55)] rounded-[2rem] bg-[#e4e9f0] hover:!bg-[#0f2444]"
                            onClick={() => window.location.hash = suite.hash}
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className={`w-16 h-16 xl:w-20 xl:h-20 rounded-2xl xl:rounded-3xl ${suite.bg} shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06)] group-hover:!bg-white/15 group-hover:shadow-none flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
                                <suite.icon className={`w-8 h-8 xl:w-10 xl:h-10 ${suite.color} group-hover:!text-white transition-colors duration-300`} />
                            </div>
                            <h2 className="text-xl xl:text-2xl font-black text-slate-800 mb-2 group-hover:!text-white transition-colors duration-300">{suite.title}</h2>
                            <p className="text-xs xl:text-sm text-slate-500 leading-relaxed font-medium mb-6 px-1 group-hover:!text-slate-200 transition-colors duration-300">{suite.desc}</p>
                            
                            <div className="mt-auto flex items-center gap-2 py-2 px-5 rounded-xl bg-white/60 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:!bg-white group-hover:!text-[#0f2444] shadow-sm transition-all duration-300">
                                <span>Masuk Portal</span>
                                <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:!text-[#0f2444] transition-colors duration-300" />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Bottom Row: 2 Modules Centered */}
                <div className="flex flex-col sm:flex-row justify-center items-stretch gap-6 xl:gap-8 w-full">
                    {bottomSuites.map((suite, idx) => (
                        <Card 
                            key={suite.id} 
                            className="group relative p-6 xl:p-8 flex flex-col items-center text-center cursor-pointer hover:-translate-y-2 transition-all duration-300 border border-white/60 hover:border-blue-900/50 shadow-[10px_10px_22px_#cad4e2,-10px_-10px_22px_#ffffff] hover:shadow-[0_20px_35px_-8px_rgba(15,36,68,0.55)] rounded-[2rem] w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] xl:w-[calc(25%-1.5rem)] bg-[#e4e9f0] hover:!bg-[#0f2444]"
                            onClick={() => window.location.hash = suite.hash}
                            style={{ animationDelay: `${(idx + 4) * 150}ms` }}
                        >
                            <div className={`w-16 h-16 xl:w-20 xl:h-20 rounded-2xl xl:rounded-3xl ${suite.bg} shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06)] group-hover:!bg-white/15 group-hover:shadow-none flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
                                <suite.icon className={`w-8 h-8 xl:w-10 xl:h-10 ${suite.color} group-hover:!text-white transition-colors duration-300`} />
                            </div>
                            <h2 className="text-xl xl:text-2xl font-black text-slate-800 mb-2 group-hover:!text-white transition-colors duration-300">{suite.title}</h2>
                            <p className="text-xs xl:text-sm text-slate-500 leading-relaxed font-medium mb-6 px-1 group-hover:!text-slate-200 transition-colors duration-300">{suite.desc}</p>
                            
                            <div className="mt-auto flex items-center gap-2 py-2 px-5 rounded-xl bg-white/60 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:!bg-white group-hover:!text-[#0f2444] shadow-sm transition-all duration-300">
                                <span>Masuk Portal</span>
                                <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:!text-[#0f2444] transition-colors duration-300" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="mt-12 opacity-40">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">v1.0 &copy; Herlambang Lasena, S.T.</p>
            </div>
        </div>
    );
};
