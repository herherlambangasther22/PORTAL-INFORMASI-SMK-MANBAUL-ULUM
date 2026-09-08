
import React, { useState, useEffect, useRef } from 'react';
import { Student, School } from '../types';
import { UserIcon, UploadIcon } from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { imageFileToBase64 } from '../utils';
import { generateUniqueStudentRfid } from '../utils/qrHelper';

interface StudentFormProps {
    initialData: Student | null;
    initialClass: string;
    schoolType: School;
    onSave: (data: Omit<Student, 'id'>) => Promise<void>;
    onCancel: () => void;
    isProcessing: boolean;
    isEditMode: boolean;
    isModalOpen: boolean;
}

const initialStudentData: Omit<Student, 'id'> = {
    class: '',
    fullName: '',
    rfidCode: '',
    birthPlace: '',
    birthDate: '',
    dob: '', 
    gender: '',
    nik: '',
    religion: '',
    streetAddress: '',
    rt: '',
    rw: '',
    dusun: '',
    kelurahan: '',
    kecamatan: '',
    postalCode: '',
    address: '', 
    nis: '',
    nisn: '',
    photoUrl: '',
    faceDataUrl: '', 
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    motherOccupation: '',
    fatherEducation: '',
    fatherIncome: '',
    fatherBirthYear: '',
    fatherNik: '',
    motherEducation: '',
    motherIncome: '',
    motherBirthYear: '',
    motherNik: '',
    previousSchool: '',
};

const FormInput: React.FC<{
    label: string;
    name: keyof typeof initialStudentData;
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    isTextArea?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
    type?: string;
    options?: { value: string; label: string }[];
    className?: string;
}> = ({ label, name, value, onChange, placeholder, isTextArea = false, inputRef, type = 'text', options, className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        {isTextArea ? (
            <textarea
                name={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 text-sm resize-none"
                placeholder={placeholder}
                rows={2}
            />
        ) : type === 'select' && options ? (
            <select
                name={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 text-sm font-bold"
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        ) : (
            <input
                ref={inputRef}
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 text-sm font-bold"
                placeholder={placeholder}
            />
        )}
    </div>
);


export const StudentForm: React.FC<StudentFormProps> = ({ initialData, schoolType, onSave, onCancel, isProcessing, isEditMode, isModalOpen, initialClass }) => {
    const [formData, setFormData] = useState<Omit<Student, 'id'>>(() => {
        if (initialData) {
            return { ...initialStudentData, ...initialData };
        }
        return {
            ...initialStudentData,
            class: initialClass,
            rfidCode: generateUniqueStudentRfid(),
        };
    });
    
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isModalOpen) {
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 300); 
            return () => clearTimeout(timer);
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialStudentData, ...initialData });
        } else {
            setFormData({
                ...initialStudentData,
                class: initialClass,
                rfidCode: generateUniqueStudentRfid(),
            });
        }
    }, [initialData, initialClass]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await imageFileToBase64(file, 5 * 1024 * 1024);
            setFormData(s => ({ ...s, photoUrl: base64 }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Gagal mengunggah foto.');
        }
    };

    const handleSaveClick = () => {
        if (!formData.fullName.trim()) {
            alert('Nama Lengkap wajib diisi.');
            nameInputRef.current?.focus();
            return;
        }
        if (!formData.dob) {
            formData.dob = [formData.birthPlace, formData.birthDate].filter(Boolean).join(', ');
        }
        if (!formData.address) {
            const addressParts = [formData.streetAddress, `RT ${formData.rt}/RW ${formData.rw}`, formData.dusun, formData.kelurahan, formData.kecamatan, formData.postalCode].filter(s => s && s !== '-' && s !== '0');
            formData.address = addressParts.length > 0 ? addressParts.join(', ') : '';
        }
        const cleanFirstName = (formData.fullName || 'siswa').replace(/^M\.\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const currentNis = formData.nis || '1001';
        const finalUsername = formData.username || `${cleanFirstName}${currentNis}`;
        const finalPassword = formData.password || `TJKT${currentNis}`;
        
        onSave({
            ...formData,
            username: finalUsername,
            password: finalPassword
        });
    };

    const genderOptions = [
        { value: '', label: 'Pilih Jenis Kelamin' },
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
    ];
    const religionOptions = [
        { value: '', label: 'Pilih Agama' },
        { value: 'Islam', label: 'Islam' },
        { value: 'Kristen', label: 'Kristen' },
        { value: 'Katolik', label: 'Katolik' },
        { value: 'Hindu', label: 'Hindu' },
        { value: 'Buddha', label: 'Buddha' },
        { value: 'Konghucu', label: 'Konghucu' },
    ];
    const incomeOptions = [
        { value: '', label: 'Pilih Penghasilan' },
        { value: '< Rp. 500.000', label: '< Rp. 500.000' },
        { value: 'Rp. 500.000 - Rp. 999.999', label: 'Rp. 500.000 - Rp. 999.999' },
        { value: 'Rp. 1.000.000 - Rp. 1.999.999', label: 'Rp. 1.000.000 - Rp. 1.999.999' },
        { value: 'Rp. 2.000.000 - Rp. 4.999.999', label: 'Rp. 2.000.000 - Rp. 4.999.999' },
        { value: '> Rp. 5.000.000', label: '> Rp. 5.000.000' },
    ];
    const educationOptions = [
        { value: '', label: 'Pilih Pendidikan' },
        { value: 'Tidak Sekolah', label: 'Tidak Sekolah' },
        { value: 'SD/Sederajat', label: 'SD/Sederajat' },
        { value: 'SMP/Sederajat', label: 'SMP/Sederajat' },
        { value: 'SMA/Sederajat', label: 'SMA/Sederajat' },
        { value: 'D1/D2/D3', label: 'D1/D2/D3' },
        { value: 'S1/D4', label: 'S1/D4' },
        { value: 'S2/S3', label: 'S2/S3' },
    ];


    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
                {/* Profile Photo (Upload) - Full Width but compact */}
                <div className="flex items-center gap-4 bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                    <div className="relative group w-20 h-20 rounded-full bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-slate-400" />
                        )}
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <UploadIcon className="w-5 h-5 text-white" />
                            <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handlePhotoChange} />
                        </label>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Foto Profil Siswa</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-tight">Gunakan foto formal/bebas rapi untuk kartu pelajar.</p>
                        <label className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs">
                            <UploadIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pilih Foto</span>
                            <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handlePhotoChange} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Biodata Utama */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Biodata Utama</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <FormInput label="Nama Lengkap" name="fullName" value={formData.fullName} onChange={handleFormChange} inputRef={nameInputRef} placeholder="Nama sesuai ijazah" />
                        </div>

                        <FormInput label="NIS" name="nis" value={formData.nis} onChange={handleFormChange} placeholder="Nomor Induk Lokal" />
                        
                        <FormInput label="NISN" name="nisn" value={formData.nisn} onChange={handleFormChange} placeholder="Nomor Induk Siswa Nasional" />
                        <FormInput label="Jenis Kelamin" name="gender" value={formData.gender} onChange={handleFormChange} type="select" options={genderOptions} />
                        <FormInput label="Agama" name="religion" value={formData.religion} onChange={handleFormChange} type="select" options={religionOptions} />
                        
                        <FormInput label="NIK Siswa" name="nik" value={formData.nik} onChange={handleFormChange} placeholder="Nomor Induk Kependudukan" />
                        <FormInput label="Tempat Lahir" name="birthPlace" value={formData.birthPlace} onChange={handleFormChange} placeholder="Lampung Selatan" />
                        <FormInput label="Tanggal Lahir" name="birthDate" value={formData.birthDate} onChange={handleFormChange} placeholder="01 Januari 2010" />
                        <FormInput label="Sekolah Asal" name="previousSchool" value={formData.previousSchool} onChange={handleFormChange} placeholder="Nama Sekolah Sebelumnya" />
                        
                        {/* Kode Unix RFID Kartu Siswa */}
                        <div className="flex flex-col gap-1.5 md:col-span-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                                    Kode Unix RFID Kartu Siswa (Kiosk Absensi)
                                </label>
                                <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                                    Otomatis / Manual
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    name="rfidCode"
                                    value={formData.rfidCode || ''}
                                    onChange={handleFormChange}
                                    className="w-full p-3.5 rounded-xl bg-white border border-amber-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 font-mono text-sm font-bold pr-24"
                                    placeholder="Contoh: 1651314106"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, rfidCode: generateUniqueStudentRfid() }));
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all active:scale-95"
                                >
                                    Acak
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-700 font-medium ml-1">
                                Kode RFID unik 10-digit ini digunakan saat kartu fisik siswa di-scan di scanner RFID terminal absensi.
                            </p>
                        </div>

                        {/* Kredensial Login Quiz & Poin (Sistem Permanen Non-Editable) */}
                        <div className="flex flex-col gap-2 md:col-span-3 bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🔒</span>
                                    <label className="text-[11px] font-black text-indigo-950 uppercase tracking-wider">
                                        Kredensial Login Quiz & Poin (Permanen)
                                    </label>
                                </div>
                                <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Sistem Otomatis (Non-Editable)
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-xs">
                                    <span className="text-[10px] font-black text-indigo-900 uppercase block mb-0.5">Username Khusus:</span>
                                    <span className="font-mono text-sm font-black text-indigo-700 block">
                                        {formData.username || (() => {
                                            const clean = (formData.fullName || 'siswa').replace(/^M\.\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                                            return `${clean}${formData.nis || '1001'}`;
                                        })()}
                                    </span>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-xs">
                                    <span className="text-[10px] font-black text-indigo-900 uppercase block mb-0.5">Password Khusus:</span>
                                    <span className="font-mono text-sm font-black text-indigo-700 block">
                                        {formData.password || `TJKT${formData.nis || '1001'}`}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-indigo-800 font-medium ml-1 mt-0.5">
                                Username & Password ini dibuat permanen oleh sistem dari gabungan Nama Depan + NIS Siswa untuk keamanan autentikasi Modul Quiz & Poin, serta otomatis tercetak pada Kartu Presensi Siswa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alamat Lengkap */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Alamat Lengkap</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormInput label="Alamat Jalan/Dukuh" name="streetAddress" value={formData.streetAddress} onChange={handleFormChange} placeholder="Jl. Pelajar" isTextArea />
                        <FormInput label="RT" name="rt" value={formData.rt} onChange={handleFormChange} placeholder="001" />
                        <FormInput label="RW" name="rw" value={formData.rw} onChange={handleFormChange} placeholder="001" />
                        <FormInput label="Dusun" name="dusun" value={formData.dusun} onChange={handleFormChange} placeholder="Dusun I" />
                        <FormInput label="Kelurahan/Desa" name="kelurahan" value={formData.kelurahan} onChange={handleFormChange} placeholder="Gedung Jaya" />
                        <FormInput label="Kecamatan" name="kecamatan" value={formData.kecamatan} onChange={handleFormChange} placeholder="Negeri Agung" />
                        <FormInput label="Kode Pos" name="postalCode" value={formData.postalCode} onChange={handleFormChange} placeholder="34764" />
                    </div>
                </div>

                {/* Informasi Orang Tua */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Informasi Ayah</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormInput label="Nama Ayah" name="fatherName" value={formData.fatherName} onChange={handleFormChange} />
                        <FormInput label="Tahun Lahir Ayah" name="fatherBirthYear" value={formData.fatherBirthYear} onChange={handleFormChange} placeholder="1975" type="number" />
                        <FormInput label="Pendidikan Ayah" name="fatherEducation" value={formData.fatherEducation} onChange={handleFormChange} type="select" options={educationOptions} />
                        <FormInput label="Pekerjaan Ayah" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleFormChange} />
                        <FormInput label="Penghasilan Ayah" name="fatherIncome" value={formData.fatherIncome} onChange={handleFormChange} type="select" options={incomeOptions} />
                        <FormInput label="NIK Ayah" name="fatherNik" value={formData.fatherNik} onChange={handleFormChange} />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                        <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Informasi Ibu</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FormInput label="Nama Ibu" name="motherName" value={formData.motherName} onChange={handleFormChange} />
                        <FormInput label="Tahun Lahir Ibu" name="motherBirthYear" value={formData.motherBirthYear} onChange={handleFormChange} placeholder="1980" type="number" />
                        <FormInput label="Pendidikan Ibu" name="motherEducation" value={formData.motherEducation} onChange={handleFormChange} type="select" options={educationOptions} />
                        <FormInput label="Pekerjaan Ibu" name="motherOccupation" value={formData.motherOccupation} onChange={handleFormChange} />
                        <FormInput label="Penghasilan Ibu" name="motherIncome" value={formData.motherIncome} onChange={handleFormChange} type="select" options={incomeOptions} />
                        <FormInput label="NIK Ibu" name="motherNik" value={formData.motherNik} onChange={handleFormChange} />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={onCancel} disabled={isProcessing} className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-slate-500 bg-white hover:bg-slate-50 transition-all">
                    Batal
                </button>
                <button type="button" onClick={handleSaveClick} disabled={isProcessing} className="flex-[2] py-4 px-6 rounded-2xl text-sm font-bold bg-[#1e3a8a] text-white shadow-lg hover:bg-blue-900 flex items-center justify-center gap-2 shimmer-active">
                    {isProcessing ? <LoadingSpinner className="w-5 h-5"/> : 'Simpan Data'}
                </button>
            </div>
        </div>
    );
};
