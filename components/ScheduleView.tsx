
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Schedule, Teacher, Subject, ScheduleEntry, School, SchedulePeriod, Notification } from '../types';
import { Card } from './Card';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { ScheduleIcon, UploadIcon, ExcelIcon, EditIcon, MenuIcon, DownloadIcon } from './icons/Icons';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';

// Declare XLSX for global script
declare var XLSX: any;

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the data:image/...;base64, part
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

interface ScheduleViewProps {
  schedule: Schedule;
  teachers: Teacher[];
  subjects: Subject[];
  schoolType: School;
  onUpdateSchedule: (school: School, newSchedule: Schedule) => Promise<void>;
  isProcessing: boolean;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, teachers, subjects, schoolType, onUpdateSchedule, isProcessing, onMenuClick, notifications, onNotificationsOpen }) => {
  const safeSchedule = schedule || {};
  const days = Object.keys(safeSchedule);
  const [activeDay, setActiveDay] = useState(days[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableSchedule, setEditableSchedule] = useState<Schedule>(() => JSON.parse(JSON.stringify(safeSchedule)));

  useEffect(() => {
    // Reset editable schedule and exit edit mode when props change (e.g., school switch)
    setEditableSchedule(JSON.parse(JSON.stringify(safeSchedule)));
    setIsEditing(false);
    
    // LOGIKA BARU: Otomatis set hari aktif sesuai hari ini (WIB)
    const date = new Date();
    const dayIndex = date.getDay(); // 0 = Minggu, 1 = Senin, ...
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    const todayName = dayNames[dayIndex];

    // Jika hari ini ada dalam daftar jadwal (Senin-Sabtu), pilih hari ini.
    // Jika Minggu (atau tidak ada), default ke hari pertama (biasanya Senin).
    if (days.includes(todayName)) {
        setActiveDay(todayName);
    } else {
        setActiveDay(days[0] || '');
    }
  }, [schedule]);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.code, s.name])), [subjects]);
  
  const currentScheduleData = isEditing ? editableSchedule : schedule;
  const activeSchedule = currentScheduleData[activeDay];
  if (!activeSchedule) return <div>Jadwal tidak ditemukan untuk hari {activeDay}.</div>;

  const classNames = Object.keys(activeSchedule[0]?.classes || {});

  const filteredSchedule = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) return activeSchedule;

    return activeSchedule.filter(period => {
        const firstClassEntry = period.classes[classNames[0]];
        if (['ISTIRAHAT', 'ISHOMA', 'TADARUS'].includes(firstClassEntry?.subjectCode)) {
            return firstClassEntry.subjectCode.toLowerCase().includes(lowercasedQuery);
        }

        return Object.values(period.classes).some((entry: ScheduleEntry) => {
            const subjectName = subjectMap.get(entry.subjectCode) || '';
            const teacherName = entry.teacherCode ? teacherMap.get(entry.teacherCode) : null;
            return subjectName.toLowerCase().includes(lowercasedQuery) ||
                   (teacherName && teacherName.toLowerCase().includes(lowercasedQuery));
        });
    });
  }, [activeSchedule, searchQuery, subjectMap, teacherMap, classNames]);
  
  // --- Edit Handlers ---
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditableSchedule(JSON.parse(JSON.stringify(schedule))); // Revert changes
  };

  const handleSaveClick = async () => {
    await onUpdateSchedule(schoolType, editableSchedule);
    setIsEditing(false);
  };

  const handlePeriodInfoChange = (periodIndex: number, field: 'time' | 'period', value: string) => {
    setEditableSchedule(prev => {
        const newDaySchedule = [...prev[activeDay]];
        const periodToUpdate = { ...newDaySchedule[periodIndex] };
        
        if (field === 'period') {
            periodToUpdate.period = !isNaN(Number(value)) ? Number(value) : value;
        } else {
            periodToUpdate.time = value;
        }

        newDaySchedule[periodIndex] = periodToUpdate;
        
        return {
            ...prev,
            [activeDay]: newDaySchedule
        };
    });
  };

  const handleCellChange = (periodIndex: number, className: string, field: 'subjectCode' | 'teacherCode', value: string) => {
    setEditableSchedule(prev => {
        const newDaySchedule = [...prev[activeDay]];
        const periodToUpdate = { ...newDaySchedule[periodIndex] };
        const classesToUpdate = { ...periodToUpdate.classes };
        const entryToUpdate = { ...classesToUpdate[className] };

        if (field === 'teacherCode') {
            entryToUpdate.teacherCode = value ? Number(value) : null;
        } else {
            entryToUpdate.subjectCode = value;
            if (['ISTIRAHAT', 'ISHOMA', 'TADARUS', ''].includes(value)) {
                entryToUpdate.teacherCode = null;
            }
        }

        classesToUpdate[className] = entryToUpdate;
        periodToUpdate.classes = classesToUpdate;
        newDaySchedule[periodIndex] = periodToUpdate;

        return {
            ...prev,
            [activeDay]: newDaySchedule
        };
    });
  };

  // --- Import Handlers ---
  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setImportError('Format file harus JPG atau PNG.');
        return;
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
        setImportError('Ukuran file maksimal 4 MB.');
        return;
    }

    setImportError(null);
    setIsImporting(true);

    try {
        const base64Data = await fileToBase64(file);
        
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY || process.env?.GEMINI_API_KEY : '') || '';
        if (!apiKey) {
            setImportError('API Key Gemini belum dikonfigurasi.');
            setIsImporting(false);
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `Anda adalah asisten AI yang sangat teliti untuk administrasi sekolah. Tugas Anda adalah mengubah gambar jadwal pelajaran menjadi format JSON yang TEPAT dan VALID.
- **IDENTIFIKASI AKURAT**: Anda HARUS memetakan nama guru dan mata pelajaran dari gambar ke ID dan kode yang disediakan. Gunakan pencocokan nama yang paling mirip jika ada sedikit perbedaan ejaan.
- **STRUKTUR WAJIB**: Ikuti struktur JSON yang diminta dengan ketat. Jangan menambah atau mengurangi field.
- **KASUS KHUSUS**: Untuk 'ISTIRAHAT', 'ISHOMA', 'TADARUS', gunakan string tersebut sebagai 'subjectCode' dan 'teacherCode' HARUS null.
- **OUTPUT MURNI**: Output Anda HARUS HANYA berupa objek JSON. JANGAN tambahkan teks pembuka/penutup, penjelasan, atau markdown (seperti \`\`\`json).
- **PENANGANAN ERROR**: Jika gambar tidak jelas, bukan jadwal, atau Anda tidak dapat mengekstrak data yang valid, kembalikan objek JSON ini: {"error": "Gambar tidak dapat dibaca atau bukan jadwal pelajaran yang valid."}`;

        const prompt = `
Proses gambar jadwal pelajaran ini. Berikut adalah daftar guru dan mata pelajaran yang valid untuk pemetaan. Gunakan ini sebagai satu-satunya sumber referensi Anda.

DAFTAR GURU (gunakan 'id' sebagai 'teacherCode'):
${JSON.stringify(teachers.map(({ id, name }) => ({ id, name })), null, 2)}

DAFTAR MATA PELAJARAN (gunakan 'code' sebagai 'subjectCode'):
${JSON.stringify(subjects, null, 2)}

STRUKTUR JSON YANG DIHARAPKAN:
{
  "Senin": [
    { "time": "07.30 - 08.30", "period": 1, "classes": { "VII": { "subjectCode": "C", "teacherCode": 3 }, "VIII": { "subjectCode": "F", "teacherCode": 8 } } }
  ],
  "Selasa": [ /* ... */ ]
}
`;
        
        const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        const jsonString = response.text;
        
        let parsedSchedule: any;
        try {
            parsedSchedule = JSON.parse(jsonString || '{}');
        } catch (parseError) {
            console.error("AI response could not be parsed as JSON:", jsonString);
            throw new Error('Respon dari AI tidak dalam format JSON yang valid. Coba lagi dengan gambar yang lebih jelas.');
        }

        if (parsedSchedule.error) {
            throw new Error(`Pesan dari AI: ${parsedSchedule.error}`);
        }

        const daysExtracted = Object.keys(parsedSchedule);
        if (daysExtracted.length === 0 || !Array.isArray(parsedSchedule[daysExtracted[0]])) {
             throw new Error('Struktur data jadwal dari AI tidak valid.');
        }
        
        const newSchedule: Schedule = parsedSchedule;
        
        await onUpdateSchedule(schoolType, newSchedule);
        
        setIsImportModalOpen(false);

    } catch (error) {
        console.error("Schedule import failed:", error);
        setImportError(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses jadwal.");
    } finally {
        setIsImporting(false);
        e.target.value = '';
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/wps-office.xls',
        'application/wps-office.xlsx'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
        setImportError('Format file harus XLS atau XLSX.');
        return;
    }

    setImportError(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) throw new Error("File Excel kosong atau format tidak dikenali.");

            const headers = Object.keys(jsonData[0]);
            const requiredBaseCols = ['Hari', 'Waktu', 'Jam Ke'];
            for (const col of requiredBaseCols) {
                if (!headers.includes(col)) throw new Error(`Kolom wajib '${col}' tidak ditemukan.`);
            }
            if (!classNames.every(cn => headers.includes(cn))) {
                throw new Error(`Tidak semua kolom kelas (${classNames.join(', ')}) ditemukan di file Excel.`);
            }

            const teacherNameToIdMap = new Map(teachers.map(t => [t.name.toLowerCase().trim(), t.id]));
            const subjectNameToCodeMap = new Map(subjects.map(s => [s.name.toLowerCase().trim(), s.code]));

            const newSchedule: Schedule = {};

            jsonData.forEach((row, rowIndex) => {
                const day = row['Hari'] as string;
                if (!day) return;
                if (!newSchedule[day]) newSchedule[day] = [];

                const periodRaw = row['Jam Ke'];
                const period: string | number =
                  typeof periodRaw === 'string' || typeof periodRaw === 'number'
                    ? periodRaw
                    : String(periodRaw ?? '');
                const time = String(row['Waktu']);
                const isBreak = typeof period === 'string' && ['ISTIRAHAT', 'ISHOMA', 'TADARUS'].includes(period.toUpperCase());

                const classes: { [className: string]: ScheduleEntry } = {};

                classNames.forEach(className => {
                    if (isBreak) {
                        classes[className] = { subjectCode: (period as string).toUpperCase() as 'ISTIRAHAT' | 'ISHOMA' | 'TADARUS', teacherCode: null };
                    } else {
                        const cellValue = row[className];
                        if (cellValue && typeof cellValue === 'string') {
                            const [subjectName, teacherName] = cellValue.split('/').map(p => p.trim());
                            
                            if (!subjectName) {
                                classes[className] = { subjectCode: '', teacherCode: null };
                                return;
                            }

                            const subjectCode = subjectNameToCodeMap.get(subjectName.toLowerCase());
                            if (!subjectCode) throw new Error(`Mata pelajaran '${subjectName}' (Baris ${rowIndex + 2}) tidak ditemukan.`);
                            
                            const teacherCode = teacherName ? teacherNameToIdMap.get(teacherName.toLowerCase()) : null;
                            if (teacherName && teacherCode === undefined) throw new Error(`Guru '${teacherName}' (Baris ${rowIndex + 2}) tidak ditemukan.`);

                            classes[className] = { subjectCode: subjectCode as string, teacherCode: (teacherCode ?? null) as number | null };
                        } else {
                            classes[className] = { subjectCode: '', teacherCode: null };
                        }
                    }
                });
                
                newSchedule[day].push({ time, period, classes });
            });
            
            await onUpdateSchedule(schoolType, newSchedule);
            setIsImportModalOpen(false);
        } catch (error) {
            console.error("Excel import processing failed:", error);
            setImportError(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses file Excel.");
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws: { [key: string]: any } = {};
    const merges: any[] = [];
    const rowHeights: any[] = [];
    let rowIndex = 0;
  
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    
    const allClassNames = Array.from(new Set(
        Object.values(safeSchedule).flat().flatMap((period: SchedulePeriod) => Object.keys(period?.classes || {}))
    )).sort();

    if (allClassNames.length === 0) {
      alert("Tidak ada data kelas untuk diekspor.");
      return;
    }
    const numCols = 2 + allClassNames.length;
    const header = ['Waktu', 'Jam Ke', ...allClassNames.map(cn => `Kelas ${cn}`)];
  
    const border = {
      top: { style: "thin", color: { rgb: "FFB0B0B0" } },
      bottom: { style: "thin", color: { rgb: "FFB0B0B0" } },
      left: { style: "thin", color: { rgb: "FFB0B0B0" } },
      right: { style: "thin", color: { rgb: "FFB0B0B0" } },
    };
  
    const dayHeaderStyle = { font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF166534" } }, alignment: { horizontal: "center", vertical: "center" } };
    const colHeaderStyle = { font: { name: 'Calibri', sz: 12, bold: true }, fill: { fgColor: { rgb: "FFE0E0E0" } }, alignment: { horizontal: "center", vertical: "center" }, border };
    const breakStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFD1FAE5" } }, alignment: { horizontal: "center", vertical: "center" }, border };
    const defaultCellStyle = { alignment: { horizontal: "center", vertical: "center", wrapText: true }, border };
  
    daysOrder.forEach((day, dayIndex) => {
      const daySchedule = safeSchedule[day];
      if (!daySchedule) return;
  
      if (dayIndex > 0) {
        rowHeights[rowIndex] = { hpt: 15 };
        rowIndex++;
      }
  
      const dayCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
      ws[dayCellRef] = { t: 's', v: day.toUpperCase(), s: dayHeaderStyle };
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: numCols - 1 } });
      rowHeights[rowIndex] = { hpt: 30 };
      rowIndex++;
  
      header.forEach((h, c) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c });
        ws[cellRef] = { t: 's', v: h, s: colHeaderStyle };
      });
      rowHeights[rowIndex] = { hpt: 25 };
      rowIndex++;
  
      daySchedule.forEach(period => {
        const firstClassEntry = period.classes[allClassNames[0]];
        const isBreak = specialSubjects.includes(firstClassEntry?.subjectCode);
  
        let cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        ws[cellRef] = { t: 's', v: period.time, s: { ...isBreak ? breakStyle : defaultCellStyle, alignment: { ...defaultCellStyle.alignment, horizontal: "center"} } };
        cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 1 });
        ws[cellRef] = { t: 's', v: String(period.period), s: isBreak ? breakStyle : defaultCellStyle };
  
        if (isBreak) {
          cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 2 });
          ws[cellRef] = { t: 's', v: firstClassEntry.subjectCode, s: breakStyle };
          merges.push({ s: { r: rowIndex, c: 2 }, e: { r: rowIndex, c: numCols - 1 } });
          rowHeights[rowIndex] = { hpt: 20 };
        } else {
          allClassNames.forEach((className, classIndex) => {
            const c = 2 + classIndex;
            cellRef = XLSX.utils.encode_cell({ r: rowIndex, c });
            const entry = period.classes[className];
  
            if (entry && entry.subjectCode) {
              const subjectName = subjectMap.get(entry.subjectCode) || 'N/A';
              const teacherName = entry.teacherCode ? teacherMap.get(entry.teacherCode) : '';
  
              const richTextPayload = [
                { t: subjectName, f: { sz: 12, bold: true, name: 'Calibri', color: { rgb: "FF000000" } } }
              ];
              if (teacherName) {
                richTextPayload.push({
                  t: `\n${teacherName}`,
                  f: { sz: 9, name: 'Calibri', color: { rgb: "FF555555" }, bold: false }
                });
              }
              
              const plainText = teacherName ? `${subjectName}\n${teacherName}` : subjectName;
              ws[cellRef] = { t: 's', v: plainText, r: richTextPayload, s: defaultCellStyle };
            } else {
              ws[cellRef] = { t: 's', v: '-', s: defaultCellStyle };
            }
          });
          rowHeights[rowIndex] = { hpt: 45 };
        }
        rowIndex++;
      });
  
      if (dayIndex < daysOrder.length - 1) {
        rowHeights[rowIndex] = { hpt: 15 };
        rowIndex++;
      }
    });
  
    const range = { s: { r: 0, c: 0 }, e: { r: rowIndex - 1, c: numCols - 1 } };
    ws['!ref'] = XLSX.utils.encode_range(range);
    ws['!merges'] = merges;
    ws['!rows'] = rowHeights;
    ws['!cols'] = [
      { wch: 18 }, // Waktu
      { wch: 10 }, // Jam Ke
      ...allClassNames.map(() => ({ wch: 30 }))
    ];
  
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Pelajaran');
    XLSX.writeFile(wb, `jadwal_pelajaran_${schoolType.toUpperCase()}_terformat.xlsx`);
  };


  const getCellContent = (entry: ScheduleEntry) => {
    if (!entry || !entry.subjectCode) return <span className="text-slate-400 font-normal text-xs">-</span>;
    switch(entry.subjectCode) {
        case 'ISTIRAHAT':
        case 'ISHOMA':
        case 'TADARUS':
            return <span className="font-bold text-xs uppercase tracking-wider text-emerald-700">{entry.subjectCode}</span>;
        case 'PD':
            return <span className="font-semibold text-xs text-indigo-700">PENGEMBANGAN DIRI (PD)</span>;
        default:
            const subjectName = subjectMap.get(entry.subjectCode) || entry.subjectCode;
            const teacherName = entry.teacherCode ? teacherMap.get(entry.teacherCode) : null;
            return (
                <div className="py-1.5 px-2.5 rounded-xl bg-indigo-50/90 border border-indigo-100/90 shadow-2xs my-0.5 w-full text-center">
                    <p className="font-bold text-xs text-slate-800 leading-snug">{subjectName}</p>
                    {teacherName && <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{teacherName}</p>}
                </div>
            );
    }
  };

  const specialSubjects = ['ISTIRAHAT', 'ISHOMA', 'TADARUS', 'PD'];

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
        <Modal isOpen={isImportModalOpen} onClose={() => !isImporting && setIsImportModalOpen(false)} title="Impor Jadwal Baru">
          <div className="flex flex-col gap-4 text-center">
              {isImporting ? (
                  <div className="flex flex-col items-center justify-center h-48">
                      <LoadingSpinner className="w-12 h-12 text-green-700" />
                      <p className="mt-4 text-slate-600 font-semibold">Memproses jadwal...</p>
                      <p className="text-sm text-slate-500">Mohon tunggu sejenak.</p>
                  </div>
              ) : (
                  <>
                      <p className="text-sm text-slate-500 mb-2">Unggah jadwal baru dalam format gambar (foto atau screenshot) atau file Excel.</p>
                      
                      <label className="w-full text-center py-4 px-6 rounded-lg text-base font-semibold transition-all duration-300 bg-green-200 text-green-800 shadow-md hover:bg-green-300 cursor-pointer flex items-center justify-center gap-2 shimmer-active">
                          <UploadIcon className="w-8 h-8" />
                          <span>Impor dari Gambar (JPG/PNG)</span>
                          <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleImageImport} />
                      </label>

                       <label className="w-full text-center py-4 px-6 rounded-lg text-base font-semibold transition-all duration-300 bg-blue-200 text-blue-800 shadow-md hover:bg-blue-300 cursor-pointer flex items-center justify-center gap-2 shimmer-active">
                          <ExcelIcon className="w-8 h-8" />
                          <span>Impor dari Excel (XLS/XLSX)</span>
                          <input 
                              type="file" 
                              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                              className="hidden" 
                              onChange={handleExcelImport} 
                          />
                      </label>

                      {importError && <p className="text-red-600 text-sm mt-2">{importError}</p>}

                       <Card type="pressed" className="p-3 mt-2 text-left text-xs text-slate-500">
                          <p className="font-semibold">Petunjuk Format Excel:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                              <li>Baris pertama harus berisi header (judul kolom).</li>
                              <li>Kolom wajib: <strong>Hari, Waktu, Jam Ke, {classNames.join(', ')}</strong></li>
                              <li>Isi sel kelas dengan format: <strong>"Nama Mapel/Nama Guru"</strong>.</li>
                              <li>Untuk istirahat, isi kolom 'Jam Ke' dengan "ISTIRAHAT".</li>
                          </ul>
                      </Card>
                  </>
              )}
          </div>
        </Modal>

        {/* Header Panel - FIX BORDER COLOR */}
        <Card className="p-4 sm:p-6 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0 no-print">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Branding Section */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
                        <MenuIcon className="w-6 h-6 text-slate-700" />
                    </button>
                    <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
                        <ScheduleIcon className="w-8 h-8 text-cyan-500"/>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Jadwal Pelajaran</h1>
                        <p className="text-slate-500 text-xs sm:text-sm">Lihat dan kelola jadwal pelajaran harian.</p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex w-full flex-wrap items-center justify-start gap-x-4 gap-y-3 lg:w-auto lg:justify-end lg:flex-nowrap">
                    
                    {/* Action Buttons Group */}
                    <div className="flex gap-2 flex-shrink-0 order-2 lg:order-1">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCancelClick}
                                    disabled={isProcessing}
                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-[#e0e5ec] text-red-600 shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)] hover:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveClick}
                                    disabled={isProcessing}
                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 min-w-[80px] flex items-center justify-center disabled:bg-slate-400 shimmer-active"
                                >
                                    {isProcessing ? <LoadingSpinner className="w-5 h-5"/> : 'Simpan'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleEditClick}
                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2 shimmer-active"
                                    title="Edit Jadwal Manual"
                                >
                                    <EditIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setImportError(null); setIsImportModalOpen(true); }}
                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 cursor-pointer flex items-center justify-center gap-2 shimmer-active"
                                    title="Impor Jadwal Baru"
                                >
                                    <UploadIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                    <span className="hidden sm:inline">Impor</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportToExcel}
                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-slate-600 text-white shadow-md hover:bg-slate-700 cursor-pointer flex items-center justify-center gap-2 shimmer-active"
                                    title="Unduh Jadwal"
                                >
                                    <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                    <span className="hidden sm:inline">Unduh</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Search & Notification Group */}
                    <div className="flex items-center gap-3 order-1 lg:order-2 w-full lg:w-auto">
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            placeholder="Cari Jadwal..."
                        />
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </div>
        </Card>

        <Card className="p-2 no-print min-w-0">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full">
                {days.map(day => (
                    <button
                        type="button"
                        key={day}
                        onClick={() => {
                          setActiveDay(day);
                          setSearchQuery('');
                        }}
                        className={`text-center py-2 px-1 rounded-lg text-[10px] xs:text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeDay === day ? 'bg-[#1e3a8a] text-white shadow-md shimmer-active' : 'text-slate-600 hover:bg-slate-300/50 bg-[#e0e5ec] shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)]'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </Card>

        <div className="hidden print:block text-center mb-4">
            <h1 className="text-2xl font-bold text-black">Jadwal Pelajaran</h1>
            <h2 className="text-xl font-semibold text-black">{activeDay}</h2>
        </div>
        <Card className="p-3 sm:p-4 md:p-6 flex-1 min-w-0 overflow-hidden flex flex-col print:shadow-none print:border-none print:p-0">
            {filteredSchedule.length > 0 ? (
                <div className="overflow-x-auto overflow-y-auto flex-1 rounded-lg border border-slate-300/70 print:border-none scrollbar-thin">
                    <table className="w-full border-collapse text-center table-auto min-w-[650px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#1e3a8a] print:bg-slate-200">
                                <th className="p-2 sm:p-3 font-bold text-white text-[11px] sm:text-xs md:text-sm uppercase tracking-wider border-r border-blue-900 print:text-black print:border-slate-400 w-28 sm:w-32">Waktu</th>
                                <th className="p-2 sm:p-3 font-bold text-white text-[11px] sm:text-xs md:text-sm uppercase tracking-wider border-r border-blue-900 print:text-black print:border-slate-400 w-16 sm:w-20">Jam Ke</th>
                                {classNames.map(name => 
                                    <th key={name} className="p-2 sm:p-3 font-bold text-white text-[11px] sm:text-xs md:text-sm uppercase tracking-wider border-r border-blue-900 last:border-r-0 print:text-black print:border-slate-400 w-1/3">
                                        Kelas {name}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                           {filteredSchedule.map((period: SchedulePeriod, index: number) => {
                                const originalIndex = activeSchedule.findIndex(p => p.time === period.time && p.period === period.period);
                                const periodData = isEditing ? editableSchedule[activeDay][originalIndex] : period;

                                if (!periodData) return null; // Should not happen

                                const firstClassEntry = periodData.classes[classNames[0]];
                                const isBreak = specialSubjects.includes(firstClassEntry?.subjectCode);
                                
                                return (
                                    <tr key={index} className={`border-b border-slate-300/70 last:border-b-0 transition-colors ${isBreak ? 'bg-green-100/40 font-semibold' : 'odd:bg-white/50 even:bg-slate-50/50 hover:bg-green-50/70'}`}>
                                        <td className="p-1 sm:p-2 text-xs sm:text-sm whitespace-nowrap text-slate-600 border-r border-slate-300/70 align-middle print:text-black print:border-slate-400">
                                            {isEditing ? (
                                                <input type="text" value={periodData.time} onChange={e => handlePeriodInfoChange(originalIndex, 'time', e.target.value)} className="w-24 text-center text-xs p-1 rounded-md bg-white/50 border border-slate-300 focus:outline-green-500 text-black"/>
                                            ) : period.time}
                                        </td>
                                        {!(isBreak && !isEditing) && (
                                            <td className="p-1 sm:p-2 text-xs sm:text-sm font-medium text-slate-700 border-r border-slate-300/70 align-middle print:text-black print:border-slate-400">
                                                {isEditing ? (
                                                    <input type="text" value={periodData.period} onChange={e => handlePeriodInfoChange(originalIndex, 'period', e.target.value)} className="w-20 text-center text-xs p-1 rounded-md bg-white/50 border border-slate-300 focus:outline-green-500 text-black"/>
                                                ) : period.period}
                                            </td>
                                        )}
                                        {isBreak && !isEditing ? (
                                            <td colSpan={1 + classNames.length} className="p-2 sm:p-3 text-xs sm:text-sm text-green-700 font-bold uppercase tracking-[0.2em] align-middle print:text-black print:border-slate-400">
                                                {getCellContent(firstClassEntry)}
                                            </td>
                                        ) : (
                                            classNames.map(className => {
                                                const cellData = periodData.classes[className];
                                                const isCellBreak = specialSubjects.includes(cellData?.subjectCode);
                                                return (
                                                <td key={className} className={`p-1 sm:p-2 text-xs sm:text-sm border-r border-slate-300/70 last:border-r-0 align-middle print:text-black print:border-slate-400`}>
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <select value={cellData?.subjectCode || ''} onChange={e => handleCellChange(originalIndex, className, 'subjectCode', e.target.value)} className="w-full text-xs p-1 rounded-md bg-white/80 border border-slate-300 focus:outline-green-500 text-black min-w-24">
                                                                <option value="">- Mapel -</option>
                                                                <optgroup label="Kegiatan">
                                                                    {specialSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </optgroup>
                                                                <optgroup label="Mata Pelajaran">
                                                                    {subjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                                                </optgroup>
                                                            </select>
                                                            {!isCellBreak && cellData?.subjectCode && (
                                                                <select value={cellData?.teacherCode || ''} onChange={e => handleCellChange(originalIndex, className, 'teacherCode', e.target.value)} className="w-full text-xs p-1 rounded-md bg-white/80 border border-slate-300 focus:outline-green-500 text-black min-w-24">
                                                                    <option value="">- Guru -</option>
                                                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                                </select>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        getCellContent(cellData)
                                                    )}
                                                </td>
                                            )})
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center p-8 text-slate-500 h-full flex items-center justify-center">
                    <p>Tidak ada hasil yang cocok untuk "{searchQuery}" pada hari {activeDay}.</p>
                </div>
            )}
        </Card>
    </div>
  );
};
