// FIX: Import React to resolve 'Cannot find namespace React' error.
import React from 'react';
import { View } from './types';
import { 
  HomeIcon, 
  ScheduleIcon, 
  TeacherIcon, 
  CalendarIcon, 
  UserIcon, 
  SchoolIcon,
  AttendanceIcon,
  ShieldCheckIcon,
  DatabaseIcon
} from './components/icons/Icons';

import { DEFAULT_TJKT_LOGO } from './assets/images/tjktLogoBase64';

export const PORTAL_NAME = "PORTAL INFORMASI SMK MANBAUL ULUM";
export const DEFAULT_PORTAL_LOGO = DEFAULT_TJKT_LOGO;
export { DEFAULT_TJKT_LOGO };

export const NAV_ITEMS: { name: View; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; }[] = [
  { name: 'Dashboard', icon: HomeIcon, color: 'text-blue-500' },
  { name: 'Jadwal Pelajaran', icon: ScheduleIcon, color: 'text-cyan-500' },
  { name: 'Guru Pengajar', icon: TeacherIcon, color: 'text-emerald-500' },
  { name: 'Data Siswa', icon: UserIcon, color: 'text-amber-500' },
  { name: 'Data Absensi', icon: AttendanceIcon, color: 'text-teal-500' },
  { name: 'Kalender Kegiatan', icon: CalendarIcon, color: 'text-pink-500' },
  { name: 'Profil Sekolah', icon: SchoolIcon, color: 'text-violet-500' },
  { name: 'Keamanan & Akun', icon: ShieldCheckIcon, color: 'text-rose-500' },
  { name: 'Database Portal Informasi', icon: DatabaseIcon, color: 'text-indigo-600' },
];