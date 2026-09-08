
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Update onClick type to allow passing mouse events, resolving type error in Modal.tsx.
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  type?: 'flat' | 'pressed';
  appearance?: 'neumorphic' | 'clean';
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, type = 'flat', appearance = 'neumorphic', style }) => {
  const baseClasses = 'transition-all duration-300 rounded-2xl border border-slate-300/30';
  
  const typeClassesNeumorphic = {
    // Mengganti #ffffff (putih solid) dengan rgba putih transparan agar embos tidak terlalu mencolok
    flat: 'bg-[#e0e5ec] shadow-[4px_4px_8px_#d1d9e6,-3px_-3px_8px_rgba(255,255,255,0.6)]',
    pressed: 'bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-3px_-3px_8px_rgba(255,255,255,0.6)]'
  };

  const typeClassesClean = {
    flat: 'bg-white shadow-xl border border-slate-300/50',
    pressed: 'bg-slate-50 shadow-inner border border-slate-300/40'
  };
  
  const hoverClassesNeumorphic = onClick ? 'hover:shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_rgba(255,255,255,0.5)] cursor-pointer active:shadow-inner' : '';
  const hoverClassesClean = onClick ? 'hover:shadow-2xl hover:-translate-y-px cursor-pointer active:translate-y-0' : '';

  const typeClasses = appearance === 'clean' ? typeClassesClean : typeClassesNeumorphic;
  const hoverClasses = appearance === 'clean' ? hoverClassesClean : hoverClassesNeumorphic;

  return (
    <div
      className={`${baseClasses} ${typeClasses[type]} ${hoverClasses} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};
