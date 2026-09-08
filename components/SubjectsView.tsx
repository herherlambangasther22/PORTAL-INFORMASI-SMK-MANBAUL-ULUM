
import React, { useState, useMemo } from 'react';
import { Subject, School, Notification } from '../types';
import { Card } from './Card';
import { Modal } from './Modal';
import { UploadIcon, TrashIcon, FileIcon, DocxIcon, PdfIcon, ExcelIcon, SubjectIcon, PlusIcon, EditIcon, MenuIcon, ChevronRightIcon } from './icons/Icons';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from './LoadingSpinner';
import { NotificationBell } from './NotificationBell';

interface SubjectsViewProps {
  subjects: Subject[];
  schoolType: School;
  onAdd: (school: School, subjectData: Subject) => Promise<void>;
  onEdit: (school: School, updatedSubject: Subject) => Promise<void>;
  onDelete: (school: School, subjectCode: string) => Promise<void>;
  isProcessing: boolean;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

type MaterialsState = {
  [subjectCode: string]: File[];
};

const initialFormState: Subject = {
  code: '',
  name: '',
};

export const SubjectsView: React.FC<SubjectsViewProps> = ({ subjects, schoolType, onAdd, onEdit, onDelete, isProcessing, onMenuClick, notifications, onNotificationsOpen }) => {
  const [materials, setMaterials] = useState<MaterialsState>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Subject>(initialFormState);

  const filteredSubjects = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    const sorted = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    if (!lowercasedQuery) return sorted;

    return sorted.filter(subject =>
        subject.name.toLowerCase().includes(lowercasedQuery) ||
        subject.code.toLowerCase().includes(lowercasedQuery)
    );
  }, [subjects, searchQuery]);
  
  const openAddModal = () => {
    setEditingSubject(null);
    setFormData(initialFormState);
    setIsFormModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData(subject);
    setIsFormModalOpen(true);
  };
  
  const closeModal = () => {
    if (isProcessing) return;
    setIsFormModalOpen(false);
    setEditingSubject(null);
    setFormData(initialFormState);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'code' ? value.toUpperCase().replace(/\s/g, '') : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Kode dan Nama Mata Pelajaran tidak boleh kosong.');
      return;
    }
    if (editingSubject) {
      await onEdit(schoolType, formData);
    } else {
      await onAdd(schoolType, formData);
    }
    closeModal();
  };
  
  const handleDeleteSubject = async (subjectCode: string) => {
    if (isProcessing) return;
    if (window.confirm('Menghapus mata pelajaran juga akan menghapusnya dari jadwal dan data guru. Anda yakin?')) {
      await onDelete(schoolType, subjectCode);
    }
  };

  const handleFileImport = (subjectCode: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMaterials(prev => ({
        ...prev,
        [subjectCode]: [...(prev[subjectCode] || []), ...newFiles]
      }));
    }
  };

  const handleDeleteMaterial = (subjectCode: string, fileIndex: number) => {
    setMaterials(prev => ({
      ...prev,
      [subjectCode]: prev[subjectCode].filter((_, index) => index !== fileIndex)
    }));
  };

  const handleOpenMaterials = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsMaterialsModalOpen(true);
  };

  const handleCloseMaterials = () => {
    setSelectedSubject(null);
    setIsMaterialsModalOpen(false);
  };

  const getFileIcon = (fileName: string) => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') return <PdfIcon className="w-6 h-6 text-red-500 flex-shrink-0" />;
      if (['docx', 'doc'].includes(extension || '')) return <DocxIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />;
      if (['xlsx', 'xls'].includes(extension || '')) return <ExcelIcon className="w-6 h-6 text-green-700 flex-shrink-0" />;
      return <FileIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />;
  };

  const formatSubjectName = (name: string) => {
    return name.replace(/^Bahasa\s+/i, 'B. ');
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
        <Modal isOpen={isFormModalOpen} onClose={closeModal} title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'} size="md">
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Kode Mapel</label>
                    <input type="text" name="code" value={formData.code} onChange={handleFormChange} className="w-full mt-1.5 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none disabled:bg-slate-200/50 text-slate-800 font-bold" placeholder="Contoh: MTK" disabled={!!editingSubject} maxLength={10} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Nama Mata Pelajaran</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="w-full mt-1.5 p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none text-slate-800 font-bold" placeholder="Contoh: Matematika" />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={closeModal} disabled={isProcessing} className="py-2.5 px-6 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50">Batal</button>
                <button type="button" onClick={handleSave} disabled={isProcessing} className="py-2.5 px-8 rounded-xl text-sm font-bold bg-[#1e3a8a] text-white shadow-lg hover:bg-blue-900 min-w-[120px] flex items-center justify-center disabled:bg-slate-400 shimmer-active">{isProcessing ? <LoadingSpinner className="w-5 h-5" /> : 'Simpan'}</button>
            </div>
        </Modal>

        {selectedSubject && (
            <Modal isOpen={isMaterialsModalOpen} onClose={handleCloseMaterials} title={`Materi: ${formatSubjectName(selectedSubject.name)}`} size="2xl">
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto p-1 pr-2">
                    {(materials[selectedSubject.code] && materials[selectedSubject.code].length > 0) ? (
                    materials[selectedSubject.code].map((file, index) => (
                        <Card key={index} type="pressed" className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getFileIcon(file.name)}
                                <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                            </div>
                            <button type="button" onClick={() => handleDeleteMaterial(selectedSubject.code, index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
                        </Card>
                    ))
                    ) : (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <FileIcon className="w-16 h-16 mx-auto text-slate-300 mb-3"/>
                        <p className="font-semibold">Belum ada materi terunggah.</p>
                        <p className="text-sm">Gunakan tombol "Import Materi" pada daftar di luar.</p>
                    </div>
                    )}
                </div>
            </Modal>
        )}

      <Card className="p-4 sm:p-6 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-shrink-0">
                <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden"><MenuIcon className="w-6 h-6 text-slate-700" /></button>
                <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
                    <SubjectIcon className="w-8 h-8 text-indigo-500"/>
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Mata Pelajaran</h1>
                    <p className="text-slate-500 text-xs sm:text-sm">Kelola kurikulum dan materi pembelajaran.</p>
                </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:justify-end lg:flex-nowrap">
                <button type="button" onClick={openAddModal} disabled={isProcessing} className="py-2.5 px-5 rounded-xl text-sm font-bold bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 flex items-center gap-2 disabled:bg-slate-400 shimmer-active">
                    <PlusIcon className="w-5 h-5"/><span className="hidden sm:inline">Tambah Mapel</span>
                </button>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Cari Mapel..." />
                    <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                </div>
            </div>
        </div>
      </Card>

      {/* GRID 2 KOLOM: Lebih hemat ruang pada layar lebar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => {
            const materialCount = materials[subject.code]?.length || 0;
            return (
              <Card key={subject.code} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:bg-white transition-all border border-transparent hover:border-slate-200/50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <SubjectIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded-lg border border-indigo-200/50 uppercase tracking-wider">
                              {subject.code}
                            </span>
                            <h2 className="text-sm font-bold text-slate-800 truncate" title={subject.name}>{formatSubjectName(subject.name)}</h2>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                            <FileIcon className="w-3 h-3" /> {materialCount} materi tersedia
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                    <button onClick={() => handleOpenMaterials(subject)} className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100">
                        Materi <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                    
                    <label className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer border border-blue-100">
                        <UploadIcon className="w-3.5 h-3.5" /> <span>Import</span>
                        <input type="file" multiple accept=".xls,.xlsx,.pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileImport(subject.code, e)} />
                    </label>

                    <div className="flex gap-1.5 ml-1 border-l border-slate-200 pl-2">
                        <button type="button" onClick={() => openEditModal(subject)} disabled={isProcessing} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all disabled:opacity-50" title="Edit Mapel">
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => handleDeleteSubject(subject.code)} disabled={isProcessing} className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50" title="Hapus Mapel">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/30 rounded-3xl border-2 border-dashed border-slate-300 text-slate-500">
            <SubjectIcon className="w-16 h-16 text-slate-300 mb-3" />
            <p className="font-bold">Mata pelajaran tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
};
