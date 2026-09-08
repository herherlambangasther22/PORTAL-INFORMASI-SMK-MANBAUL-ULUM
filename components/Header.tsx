
import React from 'react';
import { MenuIcon, ChevronLeftIcon } from './icons/Icons';
import { Notification } from '../types';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
    onMenuClick: () => void;
    title: string;
    subtitle?: string;
    notifications: Notification[];
    onNotificationsOpen: () => void;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, subtitle, notifications, onNotificationsOpen, onBack, rightAction }) => {
    return (
        <header className="flex items-center justify-between p-4 bg-[#e0e5ec] shadow-md sticky top-0 z-20 no-print rounded-2xl gap-3">
            {/* Left side: Menu for mobile / Title & Subtitle */}
            <div className="flex items-center gap-3 min-w-0">
                <button onClick={onMenuClick} className="p-2 rounded-full -ml-2 hover:bg-slate-300/50 shimmer-active lg:hidden shrink-0" title="Buka Menu">
                    <MenuIcon className="w-6 h-6 text-slate-700" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-slate-700 leading-tight truncate">{title}</h1>
                    {subtitle && <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">{subtitle}</p>}
                </div>
            </div>
            
            {/* Right side: Notification Bell & Optional Action */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                {rightAction}
            </div>
        </header>
    );
};
