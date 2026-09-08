
import React from 'react';
import { Card } from './Card';
import { DocumentIcon, HomeIcon, MenuIcon } from './icons/Icons';
import { NotificationBell } from './NotificationBell';
import { Notification, SchoolInfo } from '../types';

interface DocumentsViewProps {
  schoolInfo: SchoolInfo;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onMenuClick, notifications, onNotificationsOpen, schoolInfo }) => {
  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in no-print-section">
      {/* Header Panel */}
      <Card className="p-4 sm:p-5 !border-l-[6px] !border-b-[4px] !border-l-blue-900 !border-b-blue-900 !border-t-0 !border-r-0 flex-shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-4 flex-shrink-0">
            <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
              <MenuIcon className="w-6 h-6 text-slate-700" />
            </button>
            <div className="p-2.5 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
              <DocumentIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Dokumen Sekolah</h1>
              <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest mt-1">Modul Administrasi Digital</p>
            </div>
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto">
            <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
          </div>
        </div>
      </Card>

      {/* Konten Utama: Posisi Digeser ke Atas (items-start + padding top) & Emboss Dilembutkan */}
      <div className="flex-1 flex items-start justify-center p-2 pt-6 sm:pt-12 min-h-0 overflow-y-auto">
        <Card className="max-w-md w-full p-5 text-center flex flex-col items-center gap-3 border-none shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_rgba(255,255,255,0.4)] rounded-[2rem]">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)] flex items-center justify-center">
              <DocumentIcon className="w-8 h-8 text-slate-300 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg shadow-md border-2 border-[#e0e5ec]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zM12 7V3" />
              </svg>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">Fitur Segera Hadir</h2>
            <div className="w-10 h-1 bg-blue-600 mx-auto mt-2 rounded-full"></div>
            <p className="text-slate-500 font-bold text-[10px] leading-relaxed max-w-xs mx-auto mt-2 uppercase tracking-wide">
              Modul Administrasi Dokumen Digital sedang dalam tahap pengembangan.
            </p>
          </div>

          <div className="bg-white/40 p-3 rounded-xl border border-white/50 shadow-sm w-full">
            <p className="text-[7px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Informasi Update</p>
            <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
              Mencakup generator surat keputusan otomatis, pengarsipan berkas, dan manajemen stempel resmi.
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="group flex items-center gap-2 py-2 px-5 rounded-xl bg-slate-800 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all active:scale-95 mt-1"
          >
            <HomeIcon className="w-3.5 h-3.5 text-blue-400" />
            Kembali ke Dashboard
          </button>
        </Card>
      </div>

      {/* Footer Branding */}
      <footer className="opacity-40 text-center pb-4 flex-shrink-0">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">v1.0 &copy; Herlambang Lasena, S.T.</p>
      </footer>
    </div>
  );
};
