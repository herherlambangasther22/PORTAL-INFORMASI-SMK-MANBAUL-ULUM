
import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Notification } from '../types';
import { BellIcon, CalendarIcon, AttendanceIcon, InfoIcon } from './icons/Icons';

interface NotificationBellProps {
  notifications: Notification[];
  onOpen: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'event':
            return <CalendarIcon className="w-6 h-6 text-pink-500" />;
        case 'attendance':
            return <AttendanceIcon className="w-6 h-6 text-teal-500" />;
        case 'announcement':
            return <InfoIcon className="w-6 h-6 text-blue-500" />;
        default:
            return <BellIcon className="w-6 h-6 text-slate-500" />;
    }
};

const formatTimeAgo = (timestamp: number) => {
    const now = new Date().getTime();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} tahun lalu`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} bulan lalu`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} hari lalu`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} jam lalu`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} menit lalu`;
    return 'Baru saja';
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const hasUnread = notifications.some(n => !n.read);

    useEffect(() => {
        return () => {
            if (isOpen) {
                onOpen();
            }
        };
    }, [isOpen, onOpen]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };
    
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const type = notification.type;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(notification);
        return acc;
    }, {} as Record<Notification['type'], Notification[]>);

    const categoryOrder: Notification['type'][] = ['event', 'attendance', 'announcement'];
    const categoryTitles: Record<Notification['type'], string> = {
        event: 'Agenda & Kegiatan',
        attendance: 'Absensi',
        announcement: 'Pengumuman',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-300/50 transition-colors"
                aria-label={`Notifikasi ${hasUnread ? '(ada yang baru)' : ''}`}
            >
                < BellIcon className="w-6 h-6"/>
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#e0e5ec] animate-pulse"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 z-50 animate-slide-up-fade">
                     <Card appearance="clean" className="p-4 flex flex-col max-h-[70vh] shadow-2xl border-none">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                            <h3 className="font-bold text-slate-800 text-lg">Notifikasi Baru</h3>
                            {hasUnread && <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Update Aktif</span>}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-6 -mr-2 pr-2 custom-scrollbar">
                             {notifications.length > 0 ? (
                                categoryOrder.map(category => {
                                    const group = groupedNotifications[category];
                                    if (!group || group.length === 0) {
                                        return null;
                                    }
                                    const unreadCount = group.filter(n => !n.read).length;

                                    return (
                                        <div key={category} className="space-y-2">
                                            <div className="flex justify-between items-center px-2">
                                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">{categoryTitles[category]}</h4>
                                                {unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">{unreadCount}</span>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                {group.map(notification => (
                                                    <div key={notification.id} className={`flex items-start gap-4 p-3 rounded-2xl transition-all ${notification.read ? 'bg-white/40' : 'bg-blue-50/70 border border-blue-100 shadow-sm'}`}>
                                                        <div className={`p-2 rounded-xl mt-0.5 ${notification.read ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm leading-tight ${notification.read ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'}`}>{notification.title}</p>
                                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notification.message}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{formatTimeAgo(notification.timestamp)}</p>
                                                        </div>
                                                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                                        <BellIcon className="w-10 h-10 text-slate-200"/>
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm">Tidak ada notifikasi agenda.</p>
                                    <p className="text-slate-300 text-[10px] mt-1 uppercase tracking-widest font-medium">Sistem sedang memantau jadwal...</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                            <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-900 transition-colors">Tutup Notifikasi</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
