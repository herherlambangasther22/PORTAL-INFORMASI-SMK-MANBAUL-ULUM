
import React from 'react';
import { School } from '../../types';

type SubjectIconProps = React.SVGProps<SVGSVGElement> & { title?: string };

// --- IKON UTAMA (BUKU) ---
const BookOpenIcon: React.FC<SubjectIconProps> = ({ title, ...props }) => {
    const { className, ...rest } = props;
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`icon-animated icon-rotate ${className || ''}`} {...rest}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    );
};

// --- LOGIKA PEMETAAN ---
// Diperbarui: Sekarang semua kode mata pelajaran mengembalikan BookOpenIcon agar tampilan seragam di Dashboard.
export const getSubjectIcon = (code: string, school: School): React.FC<SubjectIconProps> => {
  return BookOpenIcon;
};

export const getSubjectColorClass = (code: string, school: School): string => {
  switch (code) {
    case 'A': // Bahasa Inggris
    case 'C': // Bahasa Indonesia
    case 'H': // Bahasa Lampung
    case 'I': // Bahasa Arab
      return 'text-blue-500';
    case 'B': // Matematika
      return 'text-red-600';
    case 'D': // IPA
      return 'text-emerald-500';
    case 'E': // PKn
      return 'text-purple-600';
    case 'F': // IPS
      return 'text-amber-500';
    case 'G': // Seni Budaya
      return 'text-pink-500';
    case 'J': // PAI
    case 'O': // Aswaja
      return 'text-green-600';
    case 'K': // PJOK
      return 'text-orange-500';
    case 'M':
      return 'text-sky-500'; // TIK
    case 'N':
      return 'text-fuchsia-500'; // Prakarya/Mulok
    case 'L': // PD
      return 'text-gray-500';
    default:
      return 'text-slate-600';
  }
};
