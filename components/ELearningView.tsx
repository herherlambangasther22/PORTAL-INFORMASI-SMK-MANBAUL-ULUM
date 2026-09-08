
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { Subject, School, Notification, ELearningData, ELearningModule, ELearningContent } from '../types';
import { ComputerDesktopIcon, PlusIcon, TrashIcon, VideoCameraIcon, FileIcon, LinkIcon, ClipboardDocumentCheckIcon, MenuIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, ClockAlertIcon, DocxIcon, PdfIcon, ExcelIcon, TargetIcon } from './icons/Icons';
import { NotificationBell } from './NotificationBell';

interface ELearningViewProps {
  subjects: Subject[];
  schoolType: School;
  eLearningData: ELearningData;
  onUpdateData: (data: ELearningData) => void;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const isPastDue = (dueDate?: string) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
};

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
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1 block">{label}</span>
            <div className="relative group">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-300 bg-[#e0e5ec] text-slate-700 font-bold text-sm outline-none relative z-20 border border-slate-200/50
                        ${isOpen 
                            ? 'rounded-t-2xl rounded-b-none shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_0px_5px_rgba(255,255,255,0.5)] text-purple-700 border-b-transparent' 
                            : 'rounded-2xl shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_rgba(255,255,255,0.5)]'
                        }
                    `}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>
                <div 
                    className={`absolute top-full left-0 right-0 bg-[#e0e5ec] rounded-b-2xl shadow-[3px_3px_6px_#d1d9e6,-3px_3px_6px_rgba(255,255,255,0.5)] overflow-hidden transition-all duration-300 origin-top z-10 border-x border-b border-slate-200/50
                        ${isOpen 
                            ? 'opacity-100 scale-y-100 visible' 
                            : 'opacity-0 scale-y-0 invisible'
                        }
                    `}
                >
                    <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar border-t border-slate-200/30">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl mb-1 last:mb-0
                                    ${value === opt.value 
                                        ? 'bg-purple-100 text-purple-700 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]' 
                                        : 'text-slate-600 hover:bg-slate-200/50 hover:pl-6 hover:text-purple-600'
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

export const ELearningView: React.FC<ELearningViewProps> = ({ 
  subjects, 
  schoolType, 
  eLearningData, 
  onUpdateData, 
  onMenuClick, 
  notifications, 
  onNotificationsOpen 
}) => {
  const classes = ['X', 'XI', 'XII'];
  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.code || '');
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<Partial<ELearningContent>>({
    type: 'material',
    title: '',
    description: '',
    url: '',
    dueDate: '',
    points: 100,
    fileType: 'other'
  });

  const currentModules = useMemo(() => {
    return eLearningData[selectedClass]?.[selectedSubject] || [];
  }, [eLearningData, selectedClass, selectedSubject]);

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: ELearningModule = {
      id: Date.now().toString(),
      title: newModuleTitle,
      contents: []
    };
    const newData = { ...eLearningData };
    if (!newData[selectedClass]) newData[selectedClass] = {};
    if (!newData[selectedClass][selectedSubject]) newData[selectedClass][selectedSubject] = [];
    newData[selectedClass][selectedSubject] = [...newData[selectedClass][selectedSubject], newModule];
    onUpdateData(newData);
    setNewModuleTitle('');
    setIsAddModuleModalOpen(false);
    setExpandedModuleId(newModule.id);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!window.confirm('Hapus pertemuan ini? Semua materi dan tugas di dalamnya akan hilang.')) return;
    const newData = { ...eLearningData };
    newData[selectedClass][selectedSubject] = newData[selectedClass][selectedSubject].filter(m => m.id !== moduleId);
    onUpdateData(newData);
  };

  const handleAddContent = () => {
    if (!activeModuleId || !newContent.title) return;
    const content: ELearningContent = {
      id: Date.now().toString(),
      type: newContent.type || 'material',
      title: newContent.title,
      description: newContent.description || '',
      url: newContent.url || '',
      createdAt: Date.now(),
      dueDate: newContent.type === 'assignment' ? newContent.dueDate : undefined,
      points: newContent.type === 'assignment' ? newContent.points : undefined,
      fileType: newContent.fileType
    };
    const newData = { ...eLearningData };
    const modules = newData[selectedClass][selectedSubject];
    const moduleIndex = modules.findIndex(m => m.id === activeModuleId);
    if (moduleIndex >= 0) {
      modules[moduleIndex].contents.push(content);
      onUpdateData(newData);
    }
    setNewContent({ type: 'material', title: '', description: '', url: '', dueDate: '', points: 100, fileType: 'other' });
    setIsAddContentModalOpen(false);
  };

  const handleDeleteContent = (moduleId: string, contentId: string) => {
    if (!window.confirm('Hapus item ini?')) return;
    const newData = { ...eLearningData };
    const modules = newData[selectedClass][selectedSubject];
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex >= 0) {
      modules[moduleIndex].contents = modules[moduleIndex].contents.filter(c => c.id !== contentId);
      onUpdateData(newData);
    }
  };

  const renderContentIcon = (type: string, fileType?: string) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="w-8 h-8 text-red-500" />;
      case 'assignment': return <ClipboardDocumentCheckIcon className="w-8 h-8 text-orange-500" />;
      case 'link': return <LinkIcon className="w-8 h-8 text-blue-500" />;
      default: 
        if (fileType === 'pdf') return <PdfIcon className="w-8 h-8 text-red-600" />;
        if (fileType === 'docx') return <DocxIcon className="w-8 h-8 text-blue-600" />;
        if (fileType === 'xlsx') return <ExcelIcon className="w-8 h-8 text-green-600" />;
        return <FileIcon className="w-8 h-8 text-slate-500" />;
    }
  };

  const ContentItem: React.FC<{ content: ELearningContent, moduleId: string }> = ({ content, moduleId }) => {
      const isOverdue = content.type === 'assignment' && isPastDue(content.dueDate);
      return (
        <div className="relative group bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)] rounded-xl p-4 transition-all hover:shadow-md flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className={`p-3 rounded-lg flex-shrink-0 ${content.type === 'assignment' ? 'bg-orange-50' : content.type === 'video' ? 'bg-red-50' : 'bg-slate-200'}`}>
                {renderContentIcon(content.type, content.fileType)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 text-base truncate">{content.title}</h4>
                    {content.type === 'assignment' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Tugas</span>
                    )}
                </div>
                {content.description && <p className="text-sm text-slate-600 mb-2 line-clamp-2">{content.description}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    {content.type === 'assignment' && content.dueDate && (
                        <div className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                            {isOverdue ? <ClockAlertIcon className="w-3.5 h-3.5" /> : <ClockIcon className="w-3.5 h-3.5" />}
                            <span>Tenggat: {formatDate(content.dueDate)}</span>
                        </div>
                    )}
                    {content.type === 'assignment' && content.points && (
                        <div className="flex items-center gap-1 font-medium text-slate-500">
                            <TargetIcon className="w-3.5 h-3.5" />
                            <span>Poin Maks: {content.points}</span>
                        </div>
                    )}
                    {content.url && (
                        <a href={content.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline font-semibold">
                            <LinkIcon className="w-3.5 h-3.5" />
                            {content.type === 'video' ? 'Tonton Video' : content.type === 'link' ? 'Buka Tautan' : 'Unduh/Buka File'}
                        </a>
                    )}
                </div>
            </div>
            <button onClick={() => handleDeleteContent(moduleId, content.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full absolute top-2 right-2 sm:static" title="Hapus Konten">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      );
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in pb-10">
      
      {/* --- ADD MODULE MODAL --- */}
      <Modal isOpen={isAddModuleModalOpen} onClose={() => setIsAddModuleModalOpen(false)} title="Buat Pertemuan Baru">
        <div className="space-y-4">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-sm text-purple-800">
            Pertemuan digunakan untuk mengelompokkan materi, tugas, dan kuis dalam satu topik bahasan.
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600">Judul Pertemuan / Modul</label>
            <input 
              type="text" 
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Contoh: Pertemuan 1 - Pengenalan Aljabar"
              className="w-full mt-2 p-2.5 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsAddModuleModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
            <button onClick={handleAddModule} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-purple-700 transition-all">Buat Pertemuan</button>
          </div>
        </div>
      </Modal>

      {/* --- ADD CONTENT MODAL --- */}
      <Modal isOpen={isAddContentModalOpen} onClose={() => setIsAddContentModalOpen(false)} title="Tambah Konten Pembelajaran">
        <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Tipe Konten</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                  { id: 'material', label: 'Materi', icon: FileIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { id: 'video', label: 'Video', icon: VideoCameraIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                  { id: 'assignment', label: 'Tugas', icon: ClipboardDocumentCheckIcon, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                  { id: 'link', label: 'Link/Kuis', icon: LinkIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setNewContent({ ...newContent, type: item.id as any })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${newContent.type === item.id ? `${item.bg} ${item.border} ring-1 ring-offset-1 ring-purple-400` : 'bg-white border-slate-100 hover:border-slate-300'}`}
                >
                  <item.icon className={`w-6 h-6 mb-2 ${item.color}`} />
                  <span className={`text-xs font-bold ${newContent.type === item.id ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-slate-600">Judul</label>
            <input 
              type="text" 
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              placeholder={newContent.type === 'assignment' ? "Judul Tugas..." : "Judul Materi..."}
              className="w-full mt-1.5 p-2.5 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-600">Deskripsi / Instruksi</label>
            <textarea 
              value={newContent.description}
              onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
              placeholder="Berikan instruksi atau detail tambahan..."
              rows={3}
              className="w-full mt-1.5 p-2.5 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 resize-none"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              {newContent.type === 'material' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-600">Link File (Google Drive / Direct Link)</label>
                        <input 
                            type="text" 
                            value={newContent.url}
                            onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:border-purple-600"
                        />
                      </div>
                      <div>
                          <label className="text-sm font-semibold text-slate-600">Tipe File</label>
                          <select 
                            value={newContent.fileType}
                            onChange={(e) => setNewContent({...newContent, fileType: e.target.value as any})}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                          >
                              <option value="pdf">PDF Document</option>
                              <option value="docx">Word Document</option>
                              <option value="xlsx">Excel Spreadsheet</option>
                              <option value="other">Lainnya</option>
                          </select>
                      </div>
                  </div>
              )}

              {(newContent.type === 'video' || newContent.type === 'link') && (
                <div>
                  <label className="text-sm font-semibold text-slate-600">URL / Tautan</label>
                  <input 
                    type="text" 
                    value={newContent.url}
                    onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              {newContent.type === 'assignment' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-600">Tenggat Waktu</label>
                        <input 
                            type="date" 
                            value={newContent.dueDate}
                            onChange={(e) => setNewContent({ ...newContent, dueDate: e.target.value })}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-600">Nilai Maksimal</label>
                        <input 
                            type="number" 
                            value={newContent.points}
                            onChange={(e) => setNewContent({ ...newContent, points: parseInt(e.target.value) })}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                            placeholder="100"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-600">Link Soal / Referensi (Opsional)</label>
                        <input 
                            type="text" 
                            value={newContent.url}
                            onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                        />
                      </div>
                  </div>
              )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={() => setIsAddContentModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
            <button onClick={handleAddContent} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-green-700 transition-all">Simpan Konten</button>
          </div>
        </div>
      </Modal>

      {/* --- HEADER - FIX BORDER COLOR --- */}
      <Card className="p-4 sm:p-6 bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] !border-l-[6px] !border-b-[4px] !border-l-green-600 !border-b-green-600 !border-t-0 !border-r-0" appearance="neumorphic">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
              <MenuIcon className="w-6 h-6 text-slate-700" />
            </button>
            <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
              <ComputerDesktopIcon className="w-8 h-8 text-purple-600"/>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">E-Learning & Tugas</h1>
              <p className="text-slate-500 text-sm sm:text-base">Kelola materi, video pembelajaran, dan penugasan siswa.</p>
            </div>
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto">
            <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-end bg-[#e0e5ec] sticky top-0 z-10 shadow-[3px_3px_6px_#d1d9e6,-3px_3px_6px_rgba(255,255,255,0.5)] border-none" appearance="neumorphic">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1 items-end">
          <div className="w-full sm:w-32">
            <CustomDropdown 
                label="Kelas"
                value={selectedClass}
                options={classes.map(c => ({ value: c, label: c }))}
                onChange={setSelectedClass}
                zIndex={30}
            />
          </div>
          <div className="w-full sm:flex-1">
            <CustomDropdown 
                label="Mata Pelajaran"
                value={selectedSubject}
                options={subjects.map(s => ({ value: s.code, label: s.name }))}
                onChange={setSelectedSubject}
                zIndex={20}
            />
          </div>
        </div>
        <button 
          onClick={() => setIsAddModuleModalOpen(true)}
          className="w-full sm:w-auto py-3 px-5 rounded-xl text-sm font-bold transition-all duration-300 bg-purple-600 text-white shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2 md:mt-0"
        >
          <PlusIcon className="w-5 h-5"/>
          Buat Pertemuan
        </button>
      </Card>

      <div className="flex-1 space-y-6">
        {currentModules.length > 0 ? (
          currentModules.map((module, index) => (
            <Card key={module.id} className="overflow-hidden border-none shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] bg-[#e0e5ec]" type="flat" appearance="neumorphic">
              <div 
                className={`p-5 flex justify-between items-center cursor-pointer transition-colors ${expandedModuleId === module.id ? 'bg-[#e0e5ec] border-b border-slate-300' : 'bg-[#e0e5ec] hover:bg-slate-200'}`}
                onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
              >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${expandedModuleId === module.id ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${expandedModuleId === module.id ? 'text-purple-800' : 'text-slate-700'}`}>{module.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><FileIcon className="w-3 h-3"/> {module.contents.filter(c => c.type === 'material').length} Materi</span>
                            <span className="flex items-center gap-1"><ClipboardDocumentCheckIcon className="w-3 h-3"/> {module.contents.filter(c => c.type === 'assignment').length} Tugas</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end gap-1 w-24">
                      <div className="h-1.5 w-full bg-slate-300 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[0%]"></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">0% Selesai</span>
                  </div>
                  {expandedModuleId === module.id ? <ChevronUpIcon className="w-6 h-6 text-purple-600" /> : <ChevronDownIcon className="w-6 h-6 text-slate-400" />}
                </div>
              </div>
              
              {expandedModuleId === module.id && (
                <div className="p-5 bg-[#e0e5ec] animate-slide-up-fade">
                  <div className="space-y-3 mb-6">
                    {module.contents.length > 0 ? (
                      module.contents.map(content => (
                        <ContentItem key={content.id} content={content} moduleId={module.id} />
                      ))
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-xl bg-[#e0e5ec]">
                          <p className="text-slate-500 font-medium">Belum ada konten di pertemuan ini.</p>
                          <p className="text-slate-400 text-sm mt-1">Klik tombol "Tambah Konten" di bawah.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-300">
                    <button onClick={() => handleDeleteModule(module.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <TrashIcon className="w-4 h-4"/> Hapus Pertemuan
                    </button>
                    <button onClick={() => { setActiveModuleId(module.id); setIsAddContentModalOpen(true); }} className="w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-bold bg-[#e0e5ec] text-purple-700 border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2">
                      <PlusIcon className="w-5 h-5" /> Tambah Konten
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-[#e0e5ec]">
            <div className="p-4 bg-[#e0e5ec] rounded-full shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] mb-4">
                <ComputerDesktopIcon className="w-16 h-16 text-purple-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Belum ada Modul Pembelajaran</h3>
            <p className="text-slate-500 max-w-md mt-2 mb-6">Mulai dengan membuat pertemuan baru untuk mata pelajaran <strong>{subjects.find(s => s.code === selectedSubject)?.name}</strong> di Kelas <strong>{selectedClass}</strong>.</p>
            <button onClick={() => setIsAddModuleModalOpen(true)} className="py-2.5 px-6 rounded-full text-sm font-bold bg-purple-600 text-white shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 transition-all flex items-center gap-2">
                <PlusIcon className="w-5 h-5"/>
                Buat Pertemuan Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
