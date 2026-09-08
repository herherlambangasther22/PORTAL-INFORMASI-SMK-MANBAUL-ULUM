
import React, { useState, useMemo } from 'react';
import { Card } from './Card';
import { CalendarEvent, Notification } from '../types';
import { mockCalendarEvents } from '../data/schoolData';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, MenuIcon, PlusIcon } from './icons/Icons';
import { NotificationBell } from './NotificationBell';
import { Modal } from './Modal';

const eventColorClasses = {
    blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', dot: 'bg-green-500' },
    red: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', dot: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', dot: 'bg-yellow-500' },
};

const toLocalYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const pancawara = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'];
const pancawaraEpoch = new Date('2024-01-01'); // Senin Pahing

const getJavaneseMarketDay = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const epochOnly = new Date(pancawaraEpoch.getFullYear(), pancawaraEpoch.getMonth(), pancawaraEpoch.getDate());
    const diffTime = dateOnly.getTime() - epochOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const marketDayIndex = (diffDays % 5 + 5) % 5; 
    return pancawara[marketDayIndex];
};

const hijriMonths = [
    { name: "Muharram", days: 30 }, { name: "Safar", days: 29 }, { name: "Rabiul Awal", days: 30 },
    { name: "Rabiul Akhir", days: 29 }, { name: "Jumadil Awal", days: 30 }, { name: "Jumadil Akhir", days: 29 },
    { name: "Rajab", days: 30 }, { name: "Sya'ban", days: 29 }, { name: "Ramadhan", days: 30 },
    { name: "Syawal", days: 29 }, { name: "Dzulqaidah", days: 30 }, { name: "Dzulhijjah", days: 29 }
];

const isHijriLeap = (year: number): boolean => {
    const cyclePosition = (year - 1) % 30;
    return [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(cyclePosition);
};

interface HijriDateInfo {
  day: number;
  month: string;
  year: number;
}

const getHijriDate = (targetDate: Date): HijriDateInfo | null => {
    const epochGregorian = new Date(Date.UTC(2023, 6, 19));
    const dateOnly = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));

    if (dateOnly < epochGregorian) return null;

    let dayDiff = Math.round((dateOnly.getTime() - epochGregorian.getTime()) / (1000 * 60 * 60 * 24));

    let currentYear = 1445;
    let daysInYear = isHijriLeap(currentYear) ? 355 : 354;

    while (dayDiff >= daysInYear) {
        dayDiff -= daysInYear;
        currentYear++;
        daysInYear = isHijriLeap(currentYear) ? 355 : 354;
    }

    let dayOfYear = dayDiff;
    for (const month of hijriMonths) {
        const daysInThisMonth = (month.name === "Dzulhijjah" && isHijriLeap(currentYear)) ? 30 : month.days;
        if (dayOfYear < daysInThisMonth) {
            return { day: dayOfYear + 1, month: month.name, year: currentYear };
        }
        dayOfYear -= daysInThisMonth;
    }

    return null;
};

const getHijriMonthRange = (gregorianDate: Date): string => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const hijriStart = getHijriDate(startOfMonth);
    const hijriEnd = getHijriDate(endOfMonth);

    if (!hijriStart || !hijriEnd) return '';

    if (hijriStart.month === hijriEnd.month && hijriStart.year === hijriEnd.year) {
        return `${hijriStart.month} ${hijriStart.year} H`;
    } else if (hijriStart.year === hijriEnd.year) {
        return `${hijriStart.month} - ${hijriEnd.month} ${hijriStart.year} H`;
    } else {
        return `${hijriStart.month} ${hijriStart.year} H - ${hijriEnd.month} ${hijriEnd.year} H`;
    }
};

interface CalendarViewProps {
    onMenuClick: () => void;
    notifications: Notification[];
    onNotificationsOpen: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onMenuClick, notifications, onNotificationsOpen }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState<CalendarEvent>({
        date: toLocalYYYYMMDD(new Date()),
        title: '',
        description: '',
        color: 'blue'
    });
    const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);

    const allEvents = useMemo(() => [...mockCalendarEvents, ...manualEvents], [manualEvents]);

    const eventsMap = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        allEvents.forEach(event => {
            const events = map.get(event.date) || [];
            map.set(event.date, [...events, event]);
        });
        return map;
    }, [allEvents]);

    const currentMonthEvents = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const monthPrefix = `${year}-${month}`;
        
        return allEvents
            .filter(event => event.date.startsWith(monthPrefix))
            .sort((a, b) => a.date.localeCompare(b.date)); 
    }, [currentDate, allEvents]);
    
    const handleOpenAddModal = () => {
        setNewEvent({
            date: toLocalYYYYMMDD(selectedDate),
            title: '',
            description: '',
            color: 'blue',
        });
        setIsAddModalOpen(true);
    };

    const handleSaveManualEvent = () => {
        if (!newEvent.title.trim() || !newEvent.date) {
            alert('Judul dan tanggal agenda tidak boleh kosong.');
            return;
        }
        setManualEvents(prev => [...prev, newEvent]);
        setIsAddModalOpen(false);
    };

    const renderCalendarDays = () => {
        const todayStr = toLocalYYYYMMDD(new Date());
        const selectedDateStr = toLocalYYYYMMDD(selectedDate);
        
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const calendarStartDate = new Date(startOfMonth);
        calendarStartDate.setDate(calendarStartDate.getDate() - startOfMonth.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) { 
            const date = new Date(calendarStartDate);
            date.setDate(date.getDate() + i);
            const dateStr = toLocalYYYYMMDD(date);
            const marketDay = getJavaneseMarketDay(date);
            const hijriDateInfo = getHijriDate(date);
            const hijriDay = hijriDateInfo ? hijriDateInfo.day : '';

            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const dayOfWeek = date.getDay();
            const eventsForDay = eventsMap.get(dateStr) || [];
            const isHoliday = eventsForDay.some(e => e.color === 'red');

            // UKURAN SEL DIPERKECIL: h-14 (mobile) sm:h-20 (desktop)
            let dayCellClasses = 'p-1 flex flex-col rounded-lg cursor-pointer transition-all duration-200 relative border h-14 sm:h-20 overflow-hidden';
            
            // UKURAN FONT DIPERKECIL
            let dayNumberClasses = 'font-bold text-xs sm:text-base leading-none'; 
            let secondaryInfoClasses = 'text-slate-500 scale-90 origin-top-right';

            if (isSelected) {
                dayCellClasses += ' bg-blue-200 border-blue-400';
                dayNumberClasses += ' text-blue-700';
                secondaryInfoClasses += ' text-blue-600 font-medium';
            } else if (isToday) {
                 dayCellClasses += ' bg-blue-100 border-blue-300';
                 dayNumberClasses += ' text-blue-600';
                 secondaryInfoClasses += ' text-blue-500 font-medium';
            } else {
                dayCellClasses += ' bg-white/30 border-transparent hover:bg-slate-200/50';
                if (dayOfWeek === 0 || isHoliday) dayNumberClasses += ' text-red-600';
                else dayNumberClasses += ' text-slate-700';
            }
            
            if (!isCurrentMonth) {
                dayCellClasses += ' opacity-40';
            }
            
            days.push(
                <div key={dateStr} onClick={() => setSelectedDate(date)} className={dayCellClasses}>
                    <div className="flex justify-between items-start">
                         <div className={dayNumberClasses}>{date.getDate()}</div>
                         <div className="text-right leading-none">
                            <div className={`text-[8px] sm:text-[9px] ${secondaryInfoClasses}`}>{hijriDay}</div>
                            <div className={`text-[7px] sm:text-[8px] font-medium mt-0.5 ${secondaryInfoClasses}`}>{marketDay}</div>
                        </div>
                    </div>
                     <div className="flex justify-start items-end gap-0.5 mt-auto flex-wrap content-end">
                        {eventsForDay.slice(0, 6).map((event, idx) => (
                            <div key={idx} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${eventColorClasses[event.color].dot}`} title={event.title}></div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    return (
        <div className="flex flex-col gap-4 h-full animate-fade-in">
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Agenda Manual">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Tanggal Agenda</label>
                        <input
                            type="date"
                            value={newEvent.date}
                            onChange={e => setNewEvent(p => ({...p, date: e.target.value}))}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Judul Agenda</label>
                        <input
                            type="text"
                            value={newEvent.title}
                            onChange={e => setNewEvent(p => ({...p, title: e.target.value}))}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                            placeholder="Contoh: Rapat Dewan Guru"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Keterangan</label>
                        <textarea
                            value={newEvent.description}
                            onChange={e => setNewEvent(p => ({...p, description: e.target.value}))}
                            rows={3}
                            className="w-full mt-1 p-2 rounded-lg bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)] focus:outline-none"
                            placeholder="Deskripsi singkat mengenai agenda"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Warna Label</label>
                        <div className="flex gap-3 mt-2">
                           {(Object.keys(eventColorClasses) as (keyof typeof eventColorClasses)[]).map(color => (
                                <button key={color} onClick={() => setNewEvent(p => ({...p, color: color as CalendarEvent['color']}))} className={`w-8 h-8 rounded-full transition-transform duration-200 ${eventColorClasses[color].dot} ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-slate-700' : 'hover:scale-110'}`}></button>
                           ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 bg-[#e0e5ec] text-red-600 shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_rgba(255,255,255,0.5)] hover:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_rgba(255,255,255,0.5)]">Batal</button>
                    <button type="button" onClick={handleSaveManualEvent} className="py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 shimmer-active">Simpan Agenda</button>
                </div>
            </Modal>

            {/* Header Panel - FIX BORDER COLOR */}
            <Card className="p-4 sm:p-5 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0 flex-shrink-0">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
                            <MenuIcon className="w-6 h-6 text-slate-700" />
                        </button>
                        <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
                            <CalendarIcon className="w-8 h-8 text-pink-500"/>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Kalender Kegiatan</h1>
                            <p className="text-slate-500 text-xs sm:text-sm">Pantau agenda dan hari libur nasional.</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end w-full sm:w-auto">
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                <Card className="p-4 sm:p-5 flex flex-col lg:col-span-2 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-4">
                        <div key={currentDate.getTime()} className="animate-fade-in text-left w-full sm:w-auto">
                            <div className="flex items-baseline gap-2">
                                <h2 className="font-bold text-xl sm:text-2xl text-slate-800">
                                    {currentDate.toLocaleString('id-ID', { month: 'long' })}
                                </h2>
                                <div className="bg-[#e0e5ec] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_rgba(255,255,255,0.5)] px-3 py-0.5 rounded-lg text-lg sm:text-xl font-bold text-slate-700">
                                    {currentDate.getFullYear()}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                {getHijriMonthRange(currentDate)}
                            </p>
                        </div>
                        
                        <Card className="p-1">
                            {/* Tombol Navigasi: Emboss Inset Halus */}
                            <div className="flex items-stretch bg-[#e0e5ec] rounded-xl shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                                <button onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya" className="px-3 py-1.5 rounded-l-xl text-slate-600 hover:bg-slate-300/30 active:bg-slate-300/50 transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                                <button type="button" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="py-1.5 px-4 text-xs font-semibold transition-all duration-300 bg-blue-100/30 text-blue-900 border-x border-slate-300/70 hover:bg-blue-100/60 shimmer-active">Hari Ini</button>
                                <button onClick={() => changeMonth(1)} aria-label="Bulan berikutnya" className="px-3 py-1.5 rounded-r-xl text-slate-600 hover:bg-slate-300/30 active:bg-slate-300/50 transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 text-xs mb-1">
                        <div className="text-red-500">Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div className="text-blue-900">Jum</div><div>Sab</div>
                    </div>
                    {/* Panel Kalender: Emboss Inset Dalam & Halus */}
                    <div className="grid grid-cols-7 gap-1 flex-1 bg-[#e0e5ec] p-2 rounded-2xl shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_rgba(255,255,255,0.5)]">
                        {renderCalendarDays()}
                    </div>
                </Card>

                <Card className="p-4 sm:p-5 lg:col-span-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-bold text-slate-700">
                            Agenda Bulan Ini
                        </h3>
                        <button onClick={handleOpenAddModal} className="py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 flex items-center gap-1 shimmer-active">
                            <PlusIcon className="w-3 h-3" />
                            <span>Input</span>
                        </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 -mt-2 mb-3 border-b border-slate-200 pb-2">
                        {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="overflow-y-auto flex-1 -mr-2 pr-2 custom-scrollbar">
                        {currentMonthEvents.length > 0 ? (
                            <div className="relative border-l-2 border-slate-200 pl-4 space-y-3 py-1">
                                {currentMonthEvents.map((event) => {
                                    const eventKey = `${event.date}-${event.title}`;
                                    const isExpanded = expandedEventKey === eventKey;
                                    const eventDate = new Date(event.date + 'T00:00:00');
                                    const isSelectedDayEvent = event.date === toLocalYYYYMMDD(selectedDate);

                                    return (
                                        <div key={eventKey} className="relative transition-all duration-300 rounded-md">
                                            <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full ${eventColorClasses[event.color].dot} border-2 border-[#e0e5ec]`}></div>
                                            <div onClick={() => setExpandedEventKey(isExpanded ? null : eventKey)} className="cursor-pointer group">
                                                <p className={`font-semibold text-xs leading-snug ${isSelectedDayEvent ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                                    <span className="font-bold opacity-70 mr-1">
                                                        {eventDate.getDate()}:
                                                    </span>
                                                    {event.title}
                                                </p>
                                            </div>
                                            {isExpanded && (
                                                <div className="mt-1 pl-1 text-[10px] text-slate-600 animate-slide-up-fade bg-slate-100/50 p-2 rounded-lg">
                                                    <p>{event.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center text-slate-500 p-4 opacity-50">
                                <CalendarIcon className="w-10 h-10 text-slate-400 mb-2"/>
                                <p className="text-xs">Tidak ada agenda.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
