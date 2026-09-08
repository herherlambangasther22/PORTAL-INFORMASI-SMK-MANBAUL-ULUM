import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { SchoolInfo, School, Notification } from '../types';
import { 
    EditIcon, 
    BuildingIcon, 
    UploadIcon, 
    UserIcon, 
    MenuIcon, 
    TrashIcon, 
    PlusIcon, 
    CheckCircleIcon, 
    InfoIcon,
    ClipboardDocumentCheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    MapIcon,
    StudentIcon
} from './icons/Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { NotificationBell } from './NotificationBell';
import { imageFileToBase64 } from '../utils';

interface SchoolProfileViewProps {
  schoolInfo: SchoolInfo;
  schoolType: School;
  onUpdate: (school: School, newInfo: SchoolInfo) => Promise<void>;
  onResetAllData: () => Promise<void>;
  isProcessing: boolean;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({ 
    schoolInfo, 
    schoolType, 
    onUpdate, 
    onResetAllData, 
    isProcessing, 
    onMenuClick, 
    notifications, 
    onNotificationsOpen 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableInfo, setEditableInfo] = useState<SchoolInfo>(schoolInfo);
    const [copiedText, setCopiedText] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    useEffect(() => {
        setEditableInfo(schoolInfo);
        setIsEditing(false);
    }, [schoolInfo, schoolType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditableInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'headmasterPhotoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await imageFileToBase64(file, 5 * 1024 * 1024);
            setEditableInfo(prev => ({ ...prev, [field]: base64 }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Gagal mengunggah foto.');
        }
    };

    const handleStudentStatChange = (oldKey: string, newKey: string, value: number) => {
        const newLevels = { ...editableInfo.studentStats?.levels };
        if (oldKey !== newKey) {
            delete newLevels[oldKey];
        }
        newLevels[newKey] = value;
        const total = Object.values(newLevels).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
        setEditableInfo(prev => ({
            ...prev,
            studentStats: { total, levels: newLevels }
        }));
    };

    const addStudentLevel = () => {
        const newLevels = { ...editableInfo.studentStats?.levels, "Baru": 0 };
        setEditableInfo(prev => ({
            ...prev,
            studentStats: { total: prev.studentStats?.total || 0, levels: newLevels }
        }));
    };

    const removeStudentLevel = (key: string) => {
        const newLevels = { ...editableInfo.studentStats?.levels };
        delete newLevels[key];
        const total = Object.values(newLevels).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
        setEditableInfo(prev => ({
            ...prev,
            studentStats: { total, levels: newLevels }
        }));
    };

    const handleSave = async () => {
        await onUpdate(schoolType, editableInfo);
        setIsEditing(false);
    };

    const handleCopyDescription = () => {
        if (schoolInfo.description) {
            navigator.clipboard.writeText(schoolInfo.description);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2500);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full animate-fade-in pb-24">
            {/* Header Identity */}
            <Card className="p-4 sm:p-6 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-5">
                        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
                            <MenuIcon className="w-6 h-6 text-slate-700" />
                        </button>
                        <div className="relative group w-24 h-24 p-2 rounded-2xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                            {editableInfo.logoUrl ? (
                                <img src={editableInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <BuildingIcon className="w-12 h-12 text-slate-600" />
                            )}
                            {isEditing && (
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] text-center font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                                    <UploadIcon className="w-5 h-5 mb-1" /> Ganti
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                                </label>
                            )}
                        </div>
                        <div>
                            {isEditing ? (
                                <div className="space-y-1">
                                    <input 
                                        name="name" 
                                        value={editableInfo.name} 
                                        onChange={handleChange} 
                                        placeholder="Nama Umum"
                                        className="text-xl sm:text-2xl font-black text-slate-800 uppercase bg-transparent border-b border-green-400 focus:outline-none w-full" 
                                    />
                                    <input 
                                        name="officialName" 
                                        value={editableInfo.officialName || ''} 
                                        onChange={handleChange} 
                                        placeholder="Nama Resmi Kemendikdasmen"
                                        className="text-xs font-bold text-slate-600 uppercase bg-transparent border-b border-slate-300 focus:outline-none w-full" 
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight uppercase tracking-tighter">{schoolInfo.name}</h1>
                                    {schoolInfo.officialName && (
                                        <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wide mt-0.5">
                                            {schoolInfo.officialName}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-black uppercase shadow-xs">
                                    NPSN: {isEditing ? <input name="npsn" value={editableInfo.npsn} onChange={handleChange} className="bg-transparent border-none focus:outline-none w-20 text-white" /> : schoolInfo.npsn}
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-700 text-white text-[10px] font-black uppercase shadow-xs">
                                    {isEditing ? <input name="schoolStatus" value={editableInfo.schoolStatus} onChange={handleChange} className="bg-transparent border-none focus:outline-none w-16 text-white" /> : schoolInfo.schoolStatus}
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-700 text-white text-[10px] font-black uppercase shadow-xs">
                                    AKREDITASI {isEditing ? <input name="accreditation" value={editableInfo.accreditation} onChange={handleChange} className="bg-transparent border-none focus:outline-none w-6 text-white" /> : schoolInfo.accreditation}
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-600 text-white text-[10px] font-semibold uppercase shadow-xs">
                                    {schoolInfo.district || 'Gunung Labuhan'}, {schoolInfo.regency || 'Way Kanan'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                        {!isEditing ? (
                            <>
                                {schoolInfo.mapsUrl && (
                                    <a 
                                        href={schoolInfo.mapsUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="p-3 rounded-xl bg-slate-800 text-white shadow-md hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold"
                                        title="Buka Lokasi Sekolah di Google Maps (-4.685200, 104.571400)"
                                    >
                                        <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">Peta Lokasi</span>
                                    </a>
                                )}
                                <button onClick={() => setIsEditing(true)} className="p-3 rounded-xl bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 transition-all flex items-center gap-2 text-xs font-bold">
                                    <EditIcon className="w-4 h-4"/> <span className="hidden sm:inline">Kelola Profil</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={handleSave} disabled={isProcessing} className="p-3 rounded-xl bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 transition-all flex items-center gap-2 text-xs font-bold">
                                {isProcessing ? <LoadingSpinner className="w-4 h-4"/> : <><CheckCircleIcon className="w-4 h-4"/> Selesai</>}
                            </button>
                        )}
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </Card>

            {/* Collapsible / Expandable Official Description Narration Panel */}
            <Card className="p-4 sm:p-5 transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowDescription(prev => !prev)}
                        className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
                    >
                        <InfoIcon className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider group-hover:text-green-700 transition-colors">
                            Deskripsi Resmi & Dokumen Profil Sekolah
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 ml-1 flex items-center gap-1">
                            {showDescription || isEditing ? (
                                <><ChevronUpIcon className="w-3 h-3" /> Sembunyikan</>
                            ) : (
                                <><ChevronDownIcon className="w-3 h-3" /> Tampilkan Narasi Lengkap</>
                            )}
                        </span>
                    </button>

                    {(showDescription || isEditing) && (
                        <button
                            type="button"
                            onClick={handleCopyDescription}
                            className="px-3 py-1.5 rounded-lg bg-[#e0e5ec] shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_#ffffff] text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center gap-1.5"
                        >
                            <ClipboardDocumentCheckIcon className="w-4 h-4 text-slate-600" />
                            <span>{copiedText ? 'Tersalin ✓' : 'Salin Teks'}</span>
                        </button>
                    )}
                </div>

                {/* Collapsed short preview or Expanded full text */}
                {isEditing ? (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                        <textarea
                            name="description"
                            value={editableInfo.description || ''}
                            onChange={handleChange}
                            rows={8}
                            className="w-full p-3 text-xs leading-relaxed font-medium bg-[#e0e5ec] shadow-inner rounded-xl border border-slate-300 focus:outline-none text-slate-800 font-sans"
                            placeholder="Tulis deskripsi atau narasi profil sekolah..."
                        />
                    </div>
                ) : showDescription ? (
                    <div className="mt-4 pt-3 border-t border-slate-200 animate-fade-in">
                        <div className="text-xs text-slate-700 leading-relaxed font-sans space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80">
                            {schoolInfo.description ? (
                                schoolInfo.description.split('\n\n').map((paragraph, pIdx) => (
                                    <p key={pIdx} className="text-justify">{paragraph}</p>
                                ))
                            ) : (
                                <p className="italic text-slate-500">Belum ada narasi profil sekolah yang ditambahkan.</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Kepsek & Profil Administratif */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Kepala Sekolah Card */}
                    <Card className="p-6 text-center">
                        <div className="relative group w-32 h-32 mx-auto rounded-full bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff] flex items-center justify-center overflow-hidden mb-4 border-4 border-white">
                            {editableInfo.headmasterPhotoUrl ? (
                                <img src={editableInfo.headmasterPhotoUrl} alt="Kepsek" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-20 h-20 text-slate-400" />
                            )}
                            {isEditing && (
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <UploadIcon className="w-5 h-5 mb-1" /> Unggah Foto
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'headmasterPhotoUrl')} />
                                </label>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="space-y-1">
                                <input 
                                    name="headmaster" 
                                    value={editableInfo.headmaster} 
                                    onChange={handleChange} 
                                    className="text-base font-black text-slate-800 uppercase text-center bg-transparent border-b border-slate-300 focus:outline-none w-full" 
                                />
                                <input 
                                    name="headmasterTitle" 
                                    value={editableInfo.headmasterTitle || ''} 
                                    onChange={handleChange} 
                                    placeholder="Jabatan (e.g. Plt. Kepala Sekolah)"
                                    className="text-[10px] font-bold text-slate-600 uppercase text-center bg-transparent border-b border-slate-300 focus:outline-none w-full" 
                                />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{schoolInfo.headmaster}</h2>
                                <span className="inline-block px-2.5 py-0.5 mt-1.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                    {schoolInfo.headmasterTitle || 'Kepala Sekolah'}
                                </span>
                            </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-medium text-left">
                            <span className="font-bold text-slate-700 block mb-0.5">Kepemimpinan & Kejuruan:</span>
                            <p className="leading-tight">
                                {schoolInfo.headmasterHistory || 'Kepala Sekolah: Muniroh | Guru Pengajar / Kajur TJKT: Herlambang Lasena, S.T.'}
                            </p>
                        </div>
                    </Card>

                    {/* Panel Statistik Siswa */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <StudentIcon className="w-4 h-4 text-blue-900" /> Statistik Peserta Didik (TJKT)
                            </h3>
                            <span className="text-[9px] font-bold text-blue-900 uppercase px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
                                3 Rombel Aktif
                            </span>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                    Peserta Didik per Tingkat Kelas
                                </span>
                                {isEditing && (
                                    <button 
                                        type="button"
                                        onClick={addStudentLevel} 
                                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors flex items-center gap-1"
                                    >
                                        <PlusIcon className="w-3 h-3" /> Tambah
                                    </button>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[9px]">
                                        <tr>
                                            <th className="px-3 py-1.5">Tingkat Kelas</th>
                                            <th className="px-3 py-1.5 text-right">Jumlah Siswa</th>
                                            {isEditing && <th className="px-1.5 w-8"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {(Object.entries(editableInfo.studentStats?.levels || {}) as [string, number][]).map(([lv, count]) => (
                                            <tr key={lv} className="hover:bg-slate-50">
                                                <td className="px-3 py-1.5 font-bold text-slate-700">
                                                    {isEditing ? (
                                                        <input 
                                                            value={lv} 
                                                            onChange={(e) => handleStudentStatChange(lv, e.target.value, count)} 
                                                            className="w-full bg-slate-50 p-1 text-xs rounded border border-slate-200" 
                                                        />
                                                    ) : (
                                                        `Kelas ${lv} TJKT`
                                                    )}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-black text-slate-800">
                                                    {isEditing ? (
                                                        <input 
                                                            type="number" 
                                                            value={count} 
                                                            onChange={(e) => handleStudentStatChange(lv, lv, Number(e.target.value))} 
                                                            className="w-16 bg-slate-50 p-1 text-xs rounded text-right border border-slate-200" 
                                                        />
                                                    ) : (
                                                        `${count} Siswa`
                                                    )}
                                                </td>
                                                {isEditing && (
                                                    <td className="px-1.5 text-center">
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeStudentLevel(lv)} 
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-100/80 font-black">
                                            <td className="px-3 py-2 text-slate-900 text-xs">TOTAL PESERTA DIDIK</td>
                                            <td className="px-3 py-2 text-right text-slate-900 text-xs" colSpan={isEditing ? 2 : 1}>
                                                {editableInfo.studentStats?.total || 25} Siswa (7 L / 16 P)
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Ringkasan Terverifikasi & Visi Misi */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* Ringkasan Data Sekolah Terverifikasi */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                                <ClipboardDocumentCheckIcon className="w-4 h-4 text-slate-700" />
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                    Ringkasan Data Sekolah Terverifikasi
                                </h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 text-[9px] font-black uppercase tracking-wider">
                                SMK TJKT Terdaftar
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-800 text-white uppercase font-black text-[9px]">
                                    <tr>
                                        <th className="px-4 py-2.5 w-1/3">Komponen Data</th>
                                        <th className="px-4 py-2.5">Data Terverifikasi Resmi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700 text-xs">
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Nama Resmi Sekolah</td><td className="px-4 py-2 font-bold">{schoolInfo.officialName || 'SMK MANBAUL ULUM'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">NPSN</td><td className="px-4 py-2 font-mono font-bold text-slate-800">{schoolInfo.npsn || '69956732'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Konsentrasi Keahlian</td><td className="px-4 py-2 font-bold text-blue-900">{schoolInfo.majorProgram || 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Kepala Jurusan TJKT</td><td className="px-4 py-2 font-bold text-slate-900">{schoolInfo.headOfMajor || 'Herlambang Lasena, S.T.'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Kepala Sekolah</td><td className="px-4 py-2 font-bold text-slate-900">{schoolInfo.headmaster} ({schoolInfo.headmasterTitle || 'Kepala Sekolah'})</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Status & Bentuk Pendidikan</td><td className="px-4 py-2">{schoolInfo.schoolStatus || 'Swasta'} • {schoolInfo.educationForm || 'Sekolah Menengah Kejuruan (SMK)'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Akreditasi</td><td className="px-4 py-2 font-bold text-slate-800">Peringkat {schoolInfo.accreditation || 'B'} (Terakreditasi BAN-PDM)</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Alamat Lengkap / Dusun</td><td className="px-4 py-2">{schoolInfo.address}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Wilayah Administratif</td><td className="px-4 py-2">Desa {schoolInfo.village || 'Labuhan Jaya'}, Kec. {schoolInfo.district || 'Gunung Labuhan'}, Kab. {schoolInfo.regency || 'Way Kanan'}, Prov. {schoolInfo.province || 'Lampung'} (Kode Pos: {schoolInfo.postalCode || '34761'})</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Koordinat Geografis</td><td className="px-4 py-2 font-mono">{schoolInfo.coordinates || '-4.685200, 104.571400'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Tahun Pendirian</td><td className="px-4 py-2">{schoolInfo.establishmentDate || '17 Juni 2016'} (SK: {schoolInfo.establishmentDecree || 'SK/Kemenkumham/2016'})</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Kurikulum Kejuruan</td><td className="px-4 py-2">{schoolInfo.curriculum || 'Kurikulum Merdeka SMK - Konsentrasi Keahlian TJKT'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Waktu Pembelajaran</td><td className="px-4 py-2">{schoolInfo.organization || 'Pagi / 6 Hari (Senin - Sabtu)'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Peserta Didik Aktif</td><td className="px-4 py-2 font-bold text-slate-800">23 Siswa (7 Laki-laki, 16 Perempuan) • 3 Rombel (X, XI, XII)</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Laboratorium Kejuruan</td><td className="px-4 py-2">{schoolInfo.internetAccess || 'Lab Jaringan & Fiber Optik (Internet Dedicated 100 Mbps)'}</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-bold text-slate-900 bg-slate-50/50">Email Sekolah</td><td className="px-4 py-2 font-mono">{schoolInfo.email || 'smkmanbaululum@gmail.com'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Visi & Misi */}
                    <Card className="p-6">
                        <h3 className="text-xs font-black text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <BuildingIcon className="w-4 h-4 text-slate-600" /> Visi & Misi Satuan Pendidikan
                        </h3>
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Visi</span>
                                {isEditing ? (
                                    <textarea name="vision" value={editableInfo.vision} onChange={handleChange} rows={2} className="w-full p-2 font-bold bg-[#e0e5ec] shadow-inner rounded-lg border-none focus:outline-none text-slate-700" />
                                ) : (
                                    <p className="font-bold text-slate-800 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        "{schoolInfo.vision}"
                                    </p>
                                )}
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Misi</span>
                                {isEditing ? (
                                    <textarea name="mission" value={editableInfo.mission} onChange={handleChange} rows={4} className="w-full p-2 font-bold bg-[#e0e5ec] shadow-inner rounded-lg border-none focus:outline-none text-slate-700" />
                                ) : (
                                    <div className="font-medium text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                                        {schoolInfo.mission}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom Floating Save Button on Edit Mode */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-end gap-4 z-50 animate-slide-up-fade">
                    <button type="button" onClick={() => setIsEditing(false)} disabled={isProcessing} className="py-3 px-8 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100">Batal</button>
                    <button type="button" onClick={handleSave} disabled={isProcessing} className="py-3 px-10 rounded-2xl text-sm font-black bg-[#1e3a8a] text-white shadow-xl hover:bg-blue-900 min-w-[180px] flex items-center justify-center gap-2">
                        {isProcessing ? <LoadingSpinner className="w-4 h-4"/> : 'Simpan Perubahan Profil'}
                    </button>
                </div>
            )}
        </div>
    );
};
