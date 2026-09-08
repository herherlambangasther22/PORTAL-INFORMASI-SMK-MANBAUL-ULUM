import React, { useState, useEffect } from 'react';
import { Student, Teacher, AttendanceRecord, AttendanceStatus } from '../types';
import { 
  XIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  UserIcon 
} from './icons/Icons';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Student | Teacher | null;
  dateKey: string;
  dateFormatted: string;
  initialRecord?: AttendanceRecord | null;
  onSave: (personId: string | number, updatedRecord: AttendanceRecord) => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  person,
  dateKey,
  dateFormatted,
  initialRecord,
  onSave
}) => {
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [checkInTime, setCheckInTime] = useState<string>('07:00');
  const [checkOutTime, setCheckOutTime] = useState<string>('14:15');
  const [method, setMethod] = useState<string>('Manual Operator');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      const rec = typeof initialRecord === 'object' ? initialRecord : { status: initialRecord as AttendanceStatus };
      setStatus(rec.status || 'Hadir');
      
      const inTime = rec.checkInTime || rec.timestamp || '07:00';
      setCheckInTime(inTime.replace(/[^\d:]/g, '').slice(0, 5) || '07:00');

      const outTime = rec.checkOutTime || '';
      setCheckOutTime(outTime ? outTime.replace(/[^\d:]/g, '').slice(0, 5) : '14:15');

      setMethod(rec.method || 'Manual Operator');
      setNote(rec.note || '');
    } else {
      setStatus('Hadir');
      setCheckInTime('07:00');
      setCheckOutTime('14:15');
      setMethod('Manual Operator');
      setNote('');
    }
  }, [initialRecord, isOpen]);

  if (!isOpen || !person) return null;

  const isStudent = 'class' in person;
  const name = 'fullName' in person ? person.fullName : person.name;
  const role = isStudent ? `Kelas ${person.class}` : 'Guru Pengajar';

  // Calculate late status
  const [inHour, inMinute] = checkInTime.split(':').map(Number);
  const isAutoLate = (status === 'Hadir' || status === 'Terlambat') && 
                     (!isNaN(inHour) && !isNaN(inMinute)) && 
                     (inHour > 7 || (inHour === 7 && inMinute > 15));
  const lateMins = isAutoLate ? ((inHour - 7) * 60 + (inMinute - 15)) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalStatus = status;
    if (isAutoLate && status === 'Hadir') {
      finalStatus = 'Terlambat';
    } else if (!isAutoLate && status === 'Terlambat' && (inHour < 7 || (inHour === 7 && inMinute <= 15))) {
      finalStatus = 'Hadir';
    }

    const updated: AttendanceRecord = {
      status: finalStatus,
      timestamp: `${checkInTime}:00 WIB`,
      checkInTime: `${checkInTime}:00`,
      checkOutTime: checkOutTime ? `${checkOutTime}:00` : undefined,
      isLate: isAutoLate,
      latenessMinutes: isAutoLate ? lateMins : 0,
      method: method || 'Manual Operator',
      note: note.trim()
    };

    onSave(person.id, updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-scale-up">
      <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-2xl w-full max-w-md p-5 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-base font-black uppercase text-slate-900 tracking-wide flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-teal-600" />
              <span>Edit Catatan Presensi</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">{dateFormatted} ({dateKey})</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Card */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
          <div className="w-11 h-11 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-800 uppercase truncate">{name}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-0.5">
              <span className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-700">{role}</span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1 tracking-wider">
              Status Kehadiran
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpha'] as AttendanceStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    status === st
                      ? st === 'Hadir' ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' :
                        st === 'Terlambat' ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs' :
                        st === 'Sakit' ? 'bg-yellow-300 text-yellow-950 border-yellow-400 font-black shadow-xs' :
                        st === 'Izin' ? 'bg-amber-400 text-amber-950 border-amber-500 font-black shadow-xs' :
                        'bg-red-600 text-white border-red-700 font-black shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'Alpha' ? 'Alpha (Tanpa Ket)' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Jam Berangkat / Masuk & Jam Pulang */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1 tracking-wider flex items-center justify-between">
                <span>Jam Berangkat / Masuk</span>
                {isAutoLate && (
                  <span className="text-[9px] text-amber-700 font-black bg-amber-100 px-1 rounded border border-amber-300">
                    +Terlambat {lateMins}m
                  </span>
                )}
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={e => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Batas masuk 07:15 WIB</span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1 tracking-wider">
                Jam Pulang
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={e => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-teal-600 focus:outline-none"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Kosongkan bila belum pulang</span>
            </div>
          </div>

          {/* Metode Absensi */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1 tracking-wider">
              Metode Pencatatan
            </label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="RFID Card">RFID Card Tap</option>
              <option value="QR Code">QR Code Scan</option>
              <option value="Biometrik Wajah">Biometrik Wajah</option>
              <option value="Manual Operator">Manual Operator</option>
              <option value="Hadir Susulan">Hadir Susulan</option>
            </select>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1 tracking-wider">
              Catatan / Keterangan Tambahan
            </label>
            <input
              type="text"
              placeholder="Contoh: Sakit demam, Izin ada acara keluarga, Ban bocor..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
