
import React from 'react';
import { View, School, AuthSession } from '../types';
import { PORTAL_NAME, NAV_ITEMS } from '../constants';
import { Card } from './Card';
import { SchoolIcon, XIcon, LogoutIcon, ShieldCheckIcon, LockIcon } from './icons/Icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  activeSchool: School;
  headmaster: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  portalLogo?: string;
  currentUser?: AuthSession | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  activeSchool,
  headmaster,
  isSidebarOpen,
  setIsSidebarOpen,
  portalLogo,
  currentUser,
  onLogout
}) => {
  
  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsSidebarOpen(false); // Close sidebar on nav click in mobile view
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#e0e5ec] p-4 flex flex-col h-screen max-h-screen shadow-[5px_0_15px_rgba(0,0,0,0.05)] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shrink-0 no-print overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain select-none`}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <a href="#" className="flex items-center gap-3 p-1" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}>
            <div className="p-2 rounded-full bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)] w-11 h-11 flex items-center justify-center overflow-hidden shrink-0">
              {portalLogo ? (
                  <img src={portalLogo} alt="Portal Logo" className="w-full h-full object-contain" />
              ) : (
                  <SchoolIcon className="w-7 h-7 text-blue-900" />
              )}
            </div>
            <h1 className="text-sm font-bold text-slate-700 leading-tight">
              {PORTAL_NAME}
              <span className="block text-[11px] font-extrabold text-blue-900 tracking-wider">MENU SUITE</span>
            </h1>
        </a>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-full text-red-600 hover:bg-red-200/50">
            <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* User Login Card / Badge */}
      {currentUser && (
        <div className="mb-3 p-2.5 rounded-2xl bg-white/60 border border-slate-200 shadow-2xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase">
                {currentUser.displayName.charAt(0) || currentUser.username.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">@{currentUser.username}</p>
              </div>
            </div>
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Items List */}
      <nav className="flex flex-col gap-1.5 my-1">
        {NAV_ITEMS.map(({ name, icon: Icon, color }) => {
          const isActive = activeView === name;
          return (
            <button
              type="button"
              key={name}
              onClick={() => handleNavClick(name)}
              className={`flex items-center gap-3 w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? `bg-[#1e3a8a] text-white shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)] shimmer-active`
                  : 'text-slate-600 hover:bg-slate-300/50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 shrink-0 ${isActive ? 'text-white' : color}`} />
              <span className="truncate">{name}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 flex flex-col gap-2 shrink-0 border-t border-slate-300/60">
        {onLogout && (
          <button 
            type="button"
            onClick={onLogout}
            className="w-full text-left p-2 rounded-xl text-xs transition-all duration-200 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer"
          >
              <LockIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">Kunci Sesi / Logout</span>
          </button>
        )}
        <button 
          onClick={() => window.location.hash = ''}
          className="w-full text-left p-2 rounded-xl text-xs transition-all duration-200 text-slate-600 hover:bg-slate-200/60 flex items-center gap-2 font-bold uppercase tracking-wider cursor-pointer"
        >
            <LogoutIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Kembali ke Suite</span>
        </button>
        <Card className="p-2.5">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kepala Sekolah</p>
            <p className="font-bold text-xs text-slate-700 truncate">{headmaster}</p>
        </Card>
        <div className="px-1">
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest text-center">v1.0 &copy; Herlambang Lasena, S.T.</p>
        </div>
      </div>
    </aside>
  );
};

