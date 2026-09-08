import React, { useEffect } from 'react';
import { Card } from './Card';
import { XIcon } from './icons/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size }) => {
  // PENGUNCIAN SCROLL BODY: Mencegah halaman utama bergeser saat popup terbuka
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  const modalSizeClass = size ? sizeMap[size] : 'max-w-sm sm:max-w-lg';

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 transition-all duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <Card 
        appearance="clean"
        className={`w-full ${modalSizeClass} flex flex-col shadow-2xl animate-slide-up-fade scale-100 hover:scale-[1.01] transition-transform duration-500`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Modal Header - Sticky agar admin selalu tahu konteks pengeditan */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            title="Tutup Panel"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Internal scrolling jika konten terlalu panjang */}
        <div className="overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
            {children}
        </div>
      </Card>
    </div>
  );
};