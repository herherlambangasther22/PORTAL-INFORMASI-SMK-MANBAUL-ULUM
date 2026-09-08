import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import { 
  SearchIcon, 
  DownloadIcon, 
  LinkIcon, 
  PlusIcon, 
  XIcon, 
  ChevronLeftIcon,
  CheckIcon,
  TrashIcon,
  UploadIcon,
  EyeIcon,
  DocumentIcon,
  PdfIcon,
  DocxIcon,
  PhotoIcon,
  PresentationIcon,
  VideoCameraIcon,
  GlobeAltIcon,
  EditIcon,
  FolderIcon,
  HardDriveIcon,
  ArrowPathIcon
} from './icons/Icons';
import { safeLocalStorageSet } from '../utils';
import { 
  saveFileToIndexedDB, 
  getFileFromIndexedDB, 
  deleteFileFromIndexedDB, 
  clearAllFilesFromIndexedDB 
} from '../utils/learningStorage';

export type MaterialCategory = 'pdf' | 'doc' | 'ppt' | 'image' | 'video' | 'link' | 'software' | 'other';
export type MaterialSourceType = 'upload' | 'link';

export interface LearningMaterialItem {
  id: string;
  title: string;
  category: MaterialCategory;
  sourceType: MaterialSourceType;
  subject: string;
  level: 'Kelas X' | 'Kelas XI' | 'Kelas XII' | 'Semua Tingkat' | 'Umum';
  semester?: 'Semester 1' | 'Semester 2' | 'Semua Semester';
  description: string;
  
  // Link Source:
  url?: string;
  officialUrl?: string;
  
  // Upload Source:
  fileName?: string;
  fileSize?: string;
  fileMime?: string;
  fileData?: string; // Direct data URL or inline base64 if small
  hasIndexedDB?: boolean; // Flag if file payload is stored in IndexedDB
  
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'tjkt_learning_portal_materials_v1';
const LEGACY_STORAGE_KEYS = [
  'learning_portal_resources_v1',
  'learning_portal_resources_v2',
  'learning_portal_resources_v3',
  'learning_portal_resources_v4',
  'learning_portal_resources_v5',
  'learning_portal_resources_v6',
  'learning_portal_offline_materials_v1',
  'learning_portal_offline_materials_v2',
  'learning_portal_offline_materials_v3',
  'learning_portal_offline_materials_v4',
  'learning_portal_offline_materials_v5',
  'learning_portal_offline_materials_v6'
];

export const LearningPortalView: React.FC = () => {
  // Wipe legacy preloaded sample materials to ensure 100% clean slate
  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }, []);

  // Main materials list - starts completely empty as requested
  const [materials, setMaterials] = useState<LearningMaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LearningMaterialItem | null>(null);
  const [activePreviewData, setActivePreviewData] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Active tab inside Add / Edit Modal: 'upload' | 'link'
  const [formSourceType, setFormSourceType] = useState<MaterialSourceType>('upload');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    category: MaterialCategory;
    subject: string;
    level: 'Kelas X' | 'Kelas XI' | 'Kelas XII' | 'Semua Tingkat' | 'Umum';
    semester: 'Semester 1' | 'Semester 2' | 'Semua Semester';
    description: string;
    url: string;
    officialUrl: string;
    tagsInput: string;
    file: File | null;
    fileName: string;
    fileSize: string;
    fileMime: string;
    existingFileData?: string;
  }>({
    title: '',
    category: 'pdf',
    subject: 'Dasar-Dasar TJKT',
    level: 'Semua Tingkat',
    semester: 'Semua Semester',
    description: '',
    url: '',
    officialUrl: '',
    tagsInput: '',
    file: null,
    fileName: '',
    fileSize: '',
    fileMime: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement>(null);

  // Save materials to localStorage
  const saveMaterials = (items: LearningMaterialItem[]) => {
    setMaterials(items);
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(items));
  };

  // Detect category from file name or extension
  const detectCategoryFromFileName = (fileName: string): MaterialCategory => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv'].includes(ext)) return 'doc';
    if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'mkv', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg'].includes(ext)) return 'video';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'iso', 'exe', 'bin', 'apk'].includes(ext)) return 'software';
    return 'other';
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const kb = selected.size / 1024;
      const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
      const detectedCat = detectCategoryFromFileName(selected.name);
      
      // Remove extension for default title
      const rawTitle = selected.name.replace(/\.[^/.]+$/, "");

      setFormData(prev => ({
        ...prev,
        file: selected,
        fileName: selected.name,
        fileSize: sizeStr,
        fileMime: selected.type,
        category: detectedCat,
        title: prev.title.trim() ? prev.title : rawTitle
      }));
    }
  };

  // Open Add Modal
  const openAddModal = (initialSource: MaterialSourceType = 'upload') => {
    setFormSourceType(initialSource);
    setFormData({
      title: '',
      category: initialSource === 'upload' ? 'pdf' : 'link',
      subject: 'Dasar-Dasar TJKT',
      level: 'Semua Tingkat',
      semester: 'Semua Semester',
      description: '',
      url: '',
      officialUrl: '',
      tagsInput: '',
      file: null,
      fileName: '',
      fileSize: '',
      fileMime: ''
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: LearningMaterialItem) => {
    setSelectedItem(item);
    setFormSourceType(item.sourceType);
    setFormData({
      id: item.id,
      title: item.title,
      category: item.category,
      subject: item.subject,
      level: item.level,
      semester: item.semester || 'Semua Semester',
      description: item.description,
      url: item.url || '',
      officialUrl: item.officialUrl || '',
      tagsInput: item.tags.join(', ').replace(/#/g, ''),
      file: null,
      fileName: item.fileName || '',
      fileSize: item.fileSize || '',
      fileMime: item.fileMime || '',
      existingFileData: item.fileData
    });
    setIsEditModalOpen(true);
  };

  // Submit Add Material
  const handleSaveAdd = async () => {
    if (formSourceType === 'link') {
      if (!formData.title.trim()) {
        alert('Silakan masukkan judul materi!');
        return;
      }
      if (!formData.url.trim()) {
        alert('Silakan masukkan link URL atau IP jaringan lokal!');
        return;
      }
    } else {
      if (!formData.file && !formData.fileName) {
        alert('Silakan pilih file materi yang ingin di-upload!');
        return;
      }
      if (!formData.title.trim()) {
        alert('Silakan masukkan judul materi!');
        return;
      }
    }

    const tagsArray = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    const newItemId = `mat-${Date.now()}`;
    let filePayloadDataUrl: string | undefined = undefined;
    let hasIndexedDBFlag = false;

    if (formSourceType === 'upload' && formData.file) {
      try {
        const file = formData.file;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // If file is under 1.5MB, store directly in item for instant offline access
        // If file is larger, store in IndexedDB to avoid localStorage quota issues
        if (file.size <= 1.5 * 1024 * 1024) {
          filePayloadDataUrl = dataUrl;
          await saveFileToIndexedDB(newItemId, dataUrl, file.name);
        } else {
          hasIndexedDBFlag = true;
          await saveFileToIndexedDB(newItemId, dataUrl, file.name);
        }
      } catch (err) {
        console.warn('Error saving file data:', err);
      }
    }

    const createdItem: LearningMaterialItem = {
      id: newItemId,
      title: formData.title.trim(),
      category: formData.category,
      sourceType: formSourceType,
      subject: formData.subject.trim() || 'Materi TJKT',
      level: formData.level,
      semester: formData.semester,
      description: formData.description.trim(),
      url: formSourceType === 'link' ? formData.url.trim() : undefined,
      officialUrl: formData.officialUrl.trim() || undefined,
      fileName: formSourceType === 'upload' ? formData.fileName : undefined,
      fileSize: formSourceType === 'upload' ? formData.fileSize : undefined,
      fileMime: formSourceType === 'upload' ? formData.fileMime : undefined,
      fileData: filePayloadDataUrl,
      hasIndexedDB: hasIndexedDBFlag,
      tags: tagsArray.length > 0 ? tagsArray : ['#tjkt', '#materi-manual'],
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updated = [createdItem, ...materials];
    saveMaterials(updated);
    setIsAddModalOpen(false);
  };

  // Submit Edit Material
  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    if (formSourceType === 'link') {
      if (!formData.title.trim() || !formData.url.trim()) {
        alert('Judul dan URL Tautan wajib diisi!');
        return;
      }
    } else {
      if (!formData.title.trim()) {
        alert('Judul materi wajib diisi!');
        return;
      }
    }

    const tagsArray = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    let filePayloadDataUrl = selectedItem.fileData;
    let hasIndexedDBFlag = selectedItem.hasIndexedDB;

    // If a new file was uploaded during edit
    if (formSourceType === 'upload' && formData.file) {
      try {
        const file = formData.file;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (file.size <= 1.5 * 1024 * 1024) {
          filePayloadDataUrl = dataUrl;
          await saveFileToIndexedDB(selectedItem.id, dataUrl, file.name);
        } else {
          filePayloadDataUrl = undefined;
          hasIndexedDBFlag = true;
          await saveFileToIndexedDB(selectedItem.id, dataUrl, file.name);
        }
      } catch (err) {
        console.warn('Error saving replacement file data:', err);
      }
    }

    const updatedList = materials.map(m => {
      if (m.id === selectedItem.id) {
        return {
          ...m,
          title: formData.title.trim(),
          category: formData.category,
          sourceType: formSourceType,
          subject: formData.subject.trim() || 'Materi TJKT',
          level: formData.level,
          semester: formData.semester,
          description: formData.description.trim(),
          url: formSourceType === 'link' ? formData.url.trim() : undefined,
          officialUrl: formData.officialUrl.trim() || undefined,
          fileName: formSourceType === 'upload' ? (formData.fileName || m.fileName) : undefined,
          fileSize: formSourceType === 'upload' ? (formData.fileSize || m.fileSize) : undefined,
          fileMime: formSourceType === 'upload' ? (formData.fileMime || m.fileMime) : undefined,
          fileData: filePayloadDataUrl,
          hasIndexedDB: hasIndexedDBFlag,
          tags: tagsArray.length > 0 ? tagsArray : m.tags,
          updatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      }
      return m;
    });

    saveMaterials(updatedList);
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  // Delete Material
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Hapus materi "${title}" dari portal pembelajaran?`)) {
      await deleteFileFromIndexedDB(id);
      const updated = materials.filter(m => m.id !== id);
      saveMaterials(updated);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
        setIsPreviewModalOpen(false);
      }
    }
  };

  // Clear all materials
  const handleClearAll = async () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan SELURUH materi di portal pembelajaran? Tindakan ini tidak dapat dibatalkan.')) {
      await clearAllFilesFromIndexedDB();
      saveMaterials([]);
      setSelectedItem(null);
      setIsPreviewModalOpen(false);
    }
  };

  // Copy Link or Info
  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Preview Modal
  const openPreview = async (item: LearningMaterialItem) => {
    setSelectedItem(item);
    setIsPreviewModalOpen(true);
    setActivePreviewData(null);
    setIsLoadingPreview(true);

    if (item.fileData) {
      setActivePreviewData(item.fileData);
      setIsLoadingPreview(false);
    } else if (item.sourceType === 'upload') {
      try {
        const idbData = await getFileFromIndexedDB(item.id);
        setActivePreviewData(idbData);
      } catch (err) {
        console.warn('Could not load file preview:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      setIsLoadingPreview(false);
    }
  };

  // Download uploaded file directly
  const handleDirectDownload = async (item: LearningMaterialItem) => {
    let downloadData = item.fileData;
    if (!downloadData && item.sourceType === 'upload') {
      downloadData = (await getFileFromIndexedDB(item.id)) || undefined;
    }

    if (downloadData) {
      const a = document.createElement('a');
      a.href = downloadData;
      a.download = item.fileName || `${item.title}.bin`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.url) {
      window.open(item.url, '_blank');
    } else {
      alert('File tidak ditemukan atau belum tersedia di memori perangkat ini.');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(materials, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tjkt_portal_pembelajaran_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          if (window.confirm(`Impor ${parsed.length} materi dari file cadangan JSON?`)) {
            saveMaterials(parsed);
            alert('Data materi pembelajaran berhasil diimpor!');
          }
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON cadangan.');
      }
    };
    reader.readAsText(file);
    if (jsonBackupInputRef.current) jsonBackupInputRef.current.value = '';
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      
      // Level Filter
      if (selectedLevel !== 'all' && item.level !== 'Semua Tingkat' && item.level !== selectedLevel) return false;

      // Source Filter
      if (selectedSourceType !== 'all' && item.sourceType !== selectedSourceType) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSubject = item.subject.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inFileName = item.fileName ? item.fileName.toLowerCase().includes(q) : false;
        const inUrl = item.url ? item.url.toLowerCase().includes(q) : false;
        const inTags = item.tags.some(t => t.toLowerCase().includes(q));
        return inTitle || inSubject || inDesc || inFileName || inUrl || inTags;
      }

      return true;
    });
  }, [materials, selectedCategory, selectedLevel, selectedSourceType, searchQuery]);

  // Category Icon and Badge helper
  const getCategoryMeta = (category: MaterialCategory) => {
    switch (category) {
      case 'pdf':
        return { label: 'Dokumen PDF', bg: 'bg-red-100 text-red-700 border-red-200', icon: PdfIcon };
      case 'doc':
        return { label: 'Word / Dokumen', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: DocxIcon };
      case 'ppt':
        return { label: 'Presentasi PPT', bg: 'bg-orange-100 text-orange-800 border-orange-200', icon: PresentationIcon };
      case 'image':
        return { label: 'Gambar / Visual', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: PhotoIcon };
      case 'video':
        return { label: 'Video / Multimedia', bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: VideoCameraIcon };
      case 'link':
        return { label: 'Tautan / Web / IP', bg: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: GlobeAltIcon };
      case 'software':
        return { label: 'Software / Arsip', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: HardDriveIcon };
      default:
        return { label: 'Materi Belajar', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: DocumentIcon };
    }
  };

  // Counters
  const countTotal = materials.length;
  const countPdf = materials.filter(m => m.category === 'pdf' || m.category === 'doc').length;
  const countPpt = materials.filter(m => m.category === 'ppt').length;
  const countImage = materials.filter(m => m.category === 'image').length;
  const countVideo = materials.filter(m => m.category === 'video').length;
  const countLink = materials.filter(m => m.category === 'link' || m.sourceType === 'link').length;
  const countSoftware = materials.filter(m => m.category === 'software').length;

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-slate-800 p-4 sm:p-6 lg:p-8 animate-fade-in flex flex-col gap-6">
      
      {/* Top Header Card */}
      <Card className="p-6 bg-[#e0e5ec] shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] !border-l-[6px] !border-l-indigo-600 rounded-3xl border-none" appearance="neumorphic">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                PORTAL PEMBELAJARAN TJKT
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                Manual Repository & Upload
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">
              MODUL & SUMBER PEMBELAJARAN
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1">
              Upload materi mandiri (PDF, DOCX, PPT, Gambar, Video, Arsip) dan tautkan link pembelajaran baik via jaringan lokal / intranet maupun internet.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button 
              onClick={() => openAddModal('upload')}
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Upload File Materi
            </button>

            <button 
              onClick={() => openAddModal('link')}
              className="px-5 py-3 rounded-2xl bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-cyan-800 hover:shadow-cyan-600/30 transition-all flex items-center gap-2 cursor-pointer"
              title="Tambah Tautan / Sumber Online atau URL Intranet Lokal"
            >
              <LinkIcon className="w-4 h-4" /> Tambah Sumber Online
            </button>

            <button 
              onClick={handleExportBackup}
              title="Ekspor Seluruh Daftar Materi ke File JSON"
              className="px-4 py-3 rounded-2xl bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider"
            >
              <DownloadIcon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <label 
              title="Impor Daftar Materi dari File JSON"
              className="px-4 py-3 rounded-2xl bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider"
            >
              <UploadIcon className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Restore</span>
              <input 
                type="file" 
                ref={jsonBackupInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden"
              />
            </label>

            <button 
              onClick={() => window.location.hash = ''} 
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Keluar ke Beranda Suite Utama"
            >
              <ChevronLeftIcon className="w-4 h-4 text-white" /> Keluar Suite
            </button>
          </div>

        </div>
      </Card>

      {/* Filter, Search & Category Navigation */}
      <Card className="p-4 sm:p-5 bg-[#e0e5ec] shadow-[3px_3px_8px_#d1d9e6,-3px_-3px_8px_#ffffff] rounded-2xl border-none space-y-4" appearance="neumorphic">
        
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi berdasarkan judul, mata pelajaran, nama file, URL jaringan, atau tag..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Semua Materi', count: countTotal },
            { id: 'pdf', label: 'PDF & E-Book', count: countPdf },
            { id: 'ppt', label: 'Presentasi PPT', count: countPpt },
            { id: 'image', label: 'Gambar & Visual', count: countImage },
            { id: 'video', label: 'Video / Audio', count: countVideo },
            { id: 'link', label: 'Tautan & Intranet', count: countLink },
            { id: 'software', label: 'Software & Arsip', count: countSoftware },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_#ffffff]'
                  : 'bg-[#e0e5ec] text-slate-600 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Level & Source Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-300/40 text-xs font-bold text-slate-600">
          
          {/* Level Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="shrink-0 text-slate-500 font-bold">Tingkat:</span>
            {[
              { id: 'all', label: 'Semua Tingkat' },
              { id: 'Kelas X', label: 'Kelas X' },
              { id: 'Kelas XI', label: 'Kelas XI' },
              { id: 'Kelas XII', label: 'Kelas XII' },
              { id: 'Umum', label: 'Umum' },
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedLevel === lvl.id 
                    ? 'bg-slate-800 text-white font-black shadow-sm' 
                    : 'bg-[#e0e5ec] text-slate-600 hover:bg-slate-200/80 shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff]'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Source Type Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate-500 font-bold">Sumber:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'upload', label: 'File Upload' },
              { id: 'link', label: 'Tautan Link' },
            ].map(src => (
              <button
                key={src.id}
                onClick={() => setSelectedSourceType(src.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedSourceType === src.id 
                    ? 'bg-indigo-600 text-white font-black shadow-sm' 
                    : 'bg-[#e0e5ec] text-slate-600 hover:bg-slate-200/80 shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff]'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

        </div>

      </Card>

      {/* Materials Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(item => {
            const meta = getCategoryMeta(item.category);
            const CategoryIcon = meta.icon;
            const isUpload = item.sourceType === 'upload';

            return (
              <Card 
                key={item.id} 
                className="p-6 bg-[#e0e5ec] shadow-[5px_5px_12px_#d1d9e6,-5px_-5px_12px_#ffffff] rounded-3xl flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-none group relative"
                appearance="neumorphic"
              >
                <div>
                  {/* Card Top Info */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${meta.bg}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <span className="bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {item.level}
                      </span>
                      {item.semester && item.semester !== 'Semua Semester' && (
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded-full">
                          {item.semester}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs font-bold text-indigo-700/80 uppercase tracking-wider mb-3">
                    {item.subject}
                  </p>

                  {/* Source specifics */}
                  {isUpload ? (
                    <div className="p-3 mb-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] text-xs font-mono text-slate-600 flex items-center justify-between gap-2">
                      <span className="truncate flex items-center gap-1.5" title={item.fileName}>
                        <DocumentIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.fileName || 'File Materi'}
                      </span>
                      {item.fileSize && (
                        <span className="shrink-0 text-[10px] bg-slate-200/80 px-2 py-0.5 rounded font-bold">{item.fileSize}</span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 mb-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] text-xs font-mono text-slate-600 flex items-center justify-between gap-2">
                      <span className="truncate flex items-center gap-1.5 text-cyan-700" title={item.url}>
                        <GlobeAltIcon className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        {item.url}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {item.description ? (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mb-3">
                      Tidak ada catatan deskripsi tambahan.
                    </p>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-mono text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-300/50 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openPreview(item)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-[#e0e5ec] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] hover:shadow-[inset_1px_1px_3px_#d1d9e6,inset_-1px_-1px_3px_#ffffff] transition-all flex items-center gap-1 cursor-pointer"
                      title="Lihat Detail & Preview"
                    >
                      <EyeIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Lihat</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(item.url || item.fileName || item.title, item.id)}
                      className="p-2 rounded-xl text-slate-500 bg-[#e0e5ec] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] hover:text-indigo-600 transition-all cursor-pointer"
                      title="Salin Tautan / Nama"
                    >
                      {copiedId === item.id ? <CheckIcon className="w-3.5 h-3.5 text-blue-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl text-slate-500 bg-[#e0e5ec] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] hover:text-amber-600 transition-all cursor-pointer"
                      title="Edit Materi"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isUpload ? (
                    <button
                      onClick={() => handleDirectDownload(item)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Unduh File"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      title="Buka Link di Tab Baru"
                    >
                      <GlobeAltIcon className="w-3.5 h-3.5" />
                      <span>Buka Link</span>
                    </a>
                  )}
                </div>

                {/* Top-right delete trigger button */}
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Hapus Materi"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

              </Card>
            );
          })
        ) : (
          /* Empty State */
          <div className="col-span-full text-center py-16 bg-[#e0e5ec] rounded-3xl shadow-[inset_3px_3px_8px_#d1d9e6,inset_-3px_-3px_8px_#ffffff] p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff]">
              <FolderIcon className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {materials.length === 0 ? 'Belum Ada Materi Pembelajaran' : 'Materi Tidak Ditemukan'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                {materials.length === 0 
                  ? 'Portal ini telah siap untuk diisi manual. Silakan upload file materi (PDF, DOCX, PPT, Gambar, Video) atau tambahkan tautan link jaringan lokal & web.' 
                  : `Tidak ada materi yang sesuai dengan filter atau kata kunci "${searchQuery}".`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {materials.length === 0 ? (
                <>
                  <button 
                    onClick={() => openAddModal('upload')} 
                    className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <UploadIcon className="w-4 h-4" /> Upload File Materi
                  </button>
                  <button 
                    onClick={() => openAddModal('link')} 
                    className="px-6 py-3 rounded-2xl bg-[#e0e5ec] text-slate-700 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:text-indigo-600 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LinkIcon className="w-4 h-4 text-cyan-600" /> Tambah Link / IP Lokal
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedLevel('all'); setSelectedSourceType('all'); }} 
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Reset Filter Pencarian
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / UPLOAD MATERI */}
      {/* ========================================================= */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Tambah / Upload Materi Pembelajaran Baru"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Source Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">
            <button
              type="button"
              onClick={() => setFormSourceType('upload')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                formSourceType === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <UploadIcon className="w-4 h-4" /> Upload File (Lokal/Perangkat)
            </button>
            <button
              type="button"
              onClick={() => setFormSourceType('link')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                formSourceType === 'link'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <GlobeAltIcon className="w-4 h-4" /> Link Web / IP Jaringan
            </button>
          </div>

          {/* Form Content: Upload File Mode */}
          {formSourceType === 'upload' && (
            <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-center border-2 border-dashed border-slate-300">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                id="learning-portal-file-input"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg,.mp4,.webm,.zip,.rar,.7z"
              />
              <label htmlFor="learning-portal-file-input" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                  📁
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {formData.fileName ? formData.fileName : 'Klik untuk Memilih File dari Perangkat'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.fileName 
                    ? `Ukuran File: ${formData.fileSize}` 
                    : 'Mendukung PDF, Word (.docx), PPT (.pptx), Gambar (PNG/JPG), Video (MP4), Arsip (.zip)'}
                </p>
              </label>
            </div>
          )}

          {/* Form Content: Link Mode */}
          {formSourceType === 'link' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Alamat URL / Tautan Jaringan
              </label>
              <input 
                type="text" 
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="Contoh: https://... atau http://192.168.1.100:8080/materi"
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dapat berupa link internet (Google Drive, YouTube, Web) maupun IP server intranet lokal sekolah.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Judul Materi Pembelajaran
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Modul Praktikum Pengkabelan UTP & Crimping RJ-45"
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Kategori Jenis</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="pdf">Dokumen PDF</option>
                <option value="doc">Word / Dokumen Teks</option>
                <option value="ppt">Presentasi PPT / Slide</option>
                <option value="image">Gambar / Infografis / Skema</option>
                <option value="video">Video Tutorial / Audio</option>
                <option value="link">Tautan Web / Intranet</option>
                <option value="software">Software / Tools / Arsip</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mata Pelajaran / Topik</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Contoh: AIJ / MikroTik / Sistem Jaringan"
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Level & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tingkat Kelas</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="Semua Tingkat">Semua Tingkat</option>
                <option value="Kelas X">Kelas X</option>
                <option value="Kelas XI">Kelas XI</option>
                <option value="Kelas XII">Kelas XII</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="Semua Semester">Semua Semester</option>
                <option value="Semester 1">Semester 1 (Ganjil)</option>
                <option value="Semester 2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Catatan / Deskripsi Materi
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Berikan ringkasan materi, petunjuk pengerjaan, atau petunjuk akses..."
              rows={3}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tag Topik (Pisahkan dengan koma)
            </label>
            <input 
              type="text" 
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              placeholder="contoh: mikrotik, router, praktikum, tjkt"
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
            />
          </div>

          {/* Footer Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => setIsAddModalOpen(false)} 
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSaveAdd} 
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Simpan Materi
            </button>
          </div>

        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: EDIT MATERI */}
      {/* ========================================================= */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Informasi Materi Pembelajaran"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Judul Materi Pembelajaran
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
            />
          </div>

          {/* If Link Source: URL input */}
          {formSourceType === 'link' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Alamat URL / Tautan
              </label>
              <input 
                type="text" 
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              />
            </div>
          )}

          {/* If Upload Source: Replace File option */}
          {formSourceType === 'upload' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                File Saat Ini: <span className="font-mono text-indigo-700">{formData.fileName}</span>
              </label>
              <input 
                type="file" 
                onChange={handleFileChange}
                className="w-full p-2 text-xs text-slate-600 bg-[#e0e5ec] rounded-xl shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]"
              />
            </div>
          )}

          {/* Category & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Kategori Jenis</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="pdf">Dokumen PDF</option>
                <option value="doc">Word / Dokumen Teks</option>
                <option value="ppt">Presentasi PPT / Slide</option>
                <option value="image">Gambar / Infografis / Skema</option>
                <option value="video">Video Tutorial / Audio</option>
                <option value="link">Tautan Web / Intranet</option>
                <option value="software">Software / Tools / Arsip</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Mata Pelajaran / Topik</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Level & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tingkat Kelas</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="Semua Tingkat">Semua Tingkat</option>
                <option value="Kelas X">Kelas X</option>
                <option value="Kelas XI">Kelas XI</option>
                <option value="Kelas XII">Kelas XII</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
              >
                <option value="Semua Semester">Semua Semester</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Catatan / Deskripsi Materi
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tag Topik (Pisahkan koma)
            </label>
            <input 
              type="text" 
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] text-sm text-slate-700 focus:outline-none"
            />
          </div>

          {/* Footer Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => setIsEditModalOpen(false)} 
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSaveEdit} 
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>

        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: PREVIEW & DETAIL MATERI */}
      {/* ========================================================= */}
      {selectedItem && (
        <Modal 
          isOpen={isPreviewModalOpen} 
          onClose={() => { setIsPreviewModalOpen(false); setSelectedItem(null); }} 
          title={selectedItem.title}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryMeta(selectedItem.category).bg}`}>
                {getCategoryMeta(selectedItem.category).label}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                {selectedItem.level}
              </span>
              {selectedItem.semester && selectedItem.semester !== 'Semua Semester' && (
                <span className="text-xs font-bold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                  {selectedItem.semester}
                </span>
              )}
            </div>

            {/* Subject */}
            <div>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Mata Pelajaran / Topik</p>
              <p className="text-sm font-semibold text-slate-800">{selectedItem.subject}</p>
            </div>

            {/* Live Inline Preview for Images */}
            {selectedItem.category === 'image' && activePreviewData && (
              <div className="p-2 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center overflow-hidden">
                <img 
                  src={activePreviewData} 
                  alt={selectedItem.title} 
                  className="max-h-72 w-auto object-contain rounded-xl shadow-sm"
                />
              </div>
            )}

            {/* Live Inline Preview for Video */}
            {selectedItem.category === 'video' && activePreviewData && (
              <div className="p-2 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center">
                <video 
                  src={activePreviewData} 
                  controls 
                  className="max-h-72 w-full rounded-xl"
                />
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Informasi</p>
              
              {selectedItem.sourceType === 'upload' ? (
                <div className="text-xs text-slate-700 space-y-1 font-mono">
                  <p><span className="text-slate-400">Nama File:</span> <strong className="text-slate-800">{selectedItem.fileName}</strong></p>
                  {selectedItem.fileSize && <p><span className="text-slate-400">Ukuran:</span> {selectedItem.fileSize}</p>}
                  <p><span className="text-slate-400">Ditambahkan:</span> {selectedItem.createdAt}</p>
                </div>
              ) : (
                <div className="text-xs text-slate-700 space-y-1 font-mono">
                  <p><span className="text-slate-400">Tautan / URL:</span> <strong className="text-cyan-700 break-all">{selectedItem.url}</strong></p>
                  <p><span className="text-slate-400">Ditambahkan:</span> {selectedItem.createdAt}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedItem.description && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deskripsi & Catatan</p>
                <p className="text-sm text-slate-600 leading-relaxed bg-[#e0e5ec] p-4 rounded-xl shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {selectedItem.tags.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tag</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.tags.map(t => (
                    <span key={t} className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
              {selectedItem.sourceType === 'upload' ? (
                <button
                  onClick={() => handleDirectDownload(selectedItem)}
                  className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <DownloadIcon className="w-4 h-4" /> Unduh File Sekarang
                </button>
              ) : (
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <GlobeAltIcon className="w-4 h-4" /> Buka Tautan di Tab Baru
                </a>
              )}

              <button
                onClick={() => { setIsPreviewModalOpen(false); setSelectedItem(null); }}
                className="py-3 px-5 rounded-xl bg-[#e0e5ec] text-slate-700 font-bold text-xs uppercase shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* Footer info & reset button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-6 border-t border-slate-300/40">
        <p className="font-medium">
          Portal Pembelajaran TJKT — Total: <strong>{materials.length}</strong> Materi Tersimpan
        </p>

        {materials.length > 0 && (
          <button 
            onClick={handleClearAll} 
            className="hover:text-red-600 text-slate-400 underline font-semibold cursor-pointer transition-colors"
          >
            Bersihkan Seluruh Materi
          </button>
        )}
      </div>

    </div>
  );
};
