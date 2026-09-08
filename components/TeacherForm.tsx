import React, { useState, useEffect, useRef } from 'react';
import { Teacher, Subject } from '../types';
import { UserIcon, UploadIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { imageFileToBase64 } from '../utils';
import { generateUniqueTeacherRfid } from '../utils/qrHelper';

interface TeacherFormProps {
    initialData: Teacher | null;
    subjects: Subject[];
    onSave: (data: Omit<Teacher, 'id'>) => Promise<void>;
    onCancel: () => void;
    isProcessing: boolean;
    isModalOpen: boolean;
}

const initialFormState: Omit<Teacher, 'id'> = {
  name: '',
  nip: '',
  subjectsTaught: [],
  photoUrl: '',
  rfidCode: '',
  qrCode: '',
};

export const TeacherForm: React.FC<TeacherFormProps> = ({ initialData, subjects, onSave, onCancel, isProcessing, isModalOpen }) => {
    const [formData, setFormData] = useState<Omit<Teacher, 'id'>>(() => {
        if (initialData) {
            return { ...initialFormState, ...initialData };
        }
        return {
            ...initialFormState,
            rfidCode: generateUniqueTeacherRfid(),
        };
    });
    const nameInputRef = useRef<HTMLInputElement>(null);

    // AUTO-FOCUS LOGIC: Memastikan admin tidak perlu scroll atau klik manual ke input pertama
    useEffect(() => {
        if (isModalOpen) {
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 300); // Delay singkat untuk menunggu animasi modal selesai
            return () => clearTimeout(timer);
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialFormState, ...initialData });
        } else {
            setFormData({
                ...initialFormState,
                rfidCode: generateUniqueTeacherRfid(),
            });
        }
    }, [initialData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectChange = (subjectCode: string) => {
        setFormData(prev => {
            const newSubjects = prev.subjectsTaught.includes(subjectCode)
                ? prev.subjectsTaught.filter(s => s !== subjectCode)
                : [...prev.subjectsTaught, subjectCode];
            return { ...prev, subjectsTaught: newSubjects };
        });
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await imageFileToBase64(file, 5 * 1024 * 1024);
            setFormData(s => ({ ...s, photoUrl: base64 }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto.');
        }
    };

    const handleSaveClick = () => {
        if (!formData.name.trim()) {
            alert('Nama lengkap tidak boleh kosong.');
            nameInputRef.current?.focus();
            return;
        }
        onSave(formData);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-28 h-28 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_rgba(255,255,255,0.5)] flex items-center justify-center overflow-hidden border-4 border-white">
                    {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-16 h-16 text-slate-300" />
                    )}
                </div>
                <label className="py-2 px-5 rounded-xl text-xs font-bold transition-all duration-300 bg-blue-600 text-white shadow-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                    <UploadIcon className="w-4 h-4" />
                    <span>Pilih Foto Guru</span>
                    <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handlePhotoChange} />
                </label>
            </div>

            <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap & Gelar</label>
                    <input 
                        ref={nameInputRef}
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleFormChange}
                        className="w-full p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold" 
                        placeholder="Contoh: Muniroh, S.Pd.I"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">NIP Guru</label>
                        <input 
                            type="text"
                            name="nip"
                            value={formData.nip || ''}
                            onChange={handleFormChange}
                            className="w-full p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono text-sm font-bold" 
                            placeholder="Contoh: 198507152010011005 (atau kosong)"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Kode Kartu RFID Guru</label>
                        <div className="relative">
                            <input 
                                type="text"
                                name="rfidCode"
                                value={formData.rfidCode || ''}
                                onChange={handleFormChange}
                                className="w-full p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono text-sm font-bold pr-20" 
                                placeholder="Contoh: 1653761770"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, rfidCode: generateUniqueTeacherRfid() }));
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-white/80 hover:bg-white text-[10px] font-bold text-slate-700 rounded-lg shadow-xs border border-slate-200"
                            >
                                Acak
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Payload QR Code Unik Guru</label>
                    <div className="relative">
                        <input 
                            type="text"
                            name="qrCode"
                            value={formData.qrCode || ''}
                            onChange={handleFormChange}
                            className="w-full p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-mono text-sm font-bold pr-24" 
                            placeholder="Contoh: SMK-GURU-G1-1005-A7B2"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const nipSuffix = (formData.nip || '').slice(-4) || '0000';
                                const check = Math.random().toString(36).substring(2, 6).toUpperCase();
                                const genQr = `SMK-GURU-G${initialData?.id || Math.floor(Math.random() * 100)}-${nipSuffix}-${check}`;
                                setFormData(prev => ({ ...prev, qrCode: genQr }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white/80 hover:bg-white text-[10px] font-bold text-slate-700 rounded-lg shadow-xs border border-slate-200"
                        >
                            Generate
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mata Pelajaran Diampu</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] max-h-48 overflow-y-auto custom-scrollbar">
                        {subjects.map(subject => (
                            <label key={subject.code} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${formData.subjectsTaught.includes(subject.code) ? 'bg-blue-600 text-white shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white'}`}>
                                <input 
                                    type="checkbox"
                                    checked={formData.subjectsTaught.includes(subject.code)}
                                    onChange={() => handleSubjectChange(subject.code)}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded-sm border ${formData.subjectsTaught.includes(subject.code) ? 'bg-white border-white' : 'bg-white border-slate-300'}`}></div>
                                <span className="text-xs font-bold">{subject.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-slate-50/50">
                <button type="button" onClick={onCancel} disabled={isProcessing} className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-slate-500 bg-white hover:bg-slate-100 transition-all border border-slate-200">
                  Batal
                </button>
                <button type="button" onClick={handleSaveClick} disabled={isProcessing} className="flex-[2] py-4 px-6 rounded-2xl text-sm font-bold bg-[#1e3a8a] text-white shadow-lg hover:bg-blue-900 flex items-center justify-center gap-2 shimmer-active">
                  {isProcessing ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan Perubahan'}
                </button>
            </div>
        </div>
    );
};