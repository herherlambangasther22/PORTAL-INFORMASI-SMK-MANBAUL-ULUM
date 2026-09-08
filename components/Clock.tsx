import React, { useState, useEffect, useRef } from 'react';

const getTimeInWIB = () => {
  const now = new Date();
  
  // Formatter for time parts
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
  
  // Formatter for full date string
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  const [hours, minutes, seconds] = timeFormatter.format(now).split(':').map(Number);
  const dateString = dateFormatter.format(now);

  return { hours, minutes, seconds, dateString };
};

interface ClockProps {
  mode: 'analog' | 'digital';
}

export const Clock: React.FC<ClockProps> = ({ mode }) => {
  const [time, setTime] = useState(getTimeInWIB());
  const prevSecondsRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timerId = setInterval(() => {
      prevSecondsRef.current = time.seconds;
      setTime(getTimeInWIB());
    }, 1000);
    return () => clearInterval(timerId);
  }, [time.seconds]);

  const { hours, minutes, seconds, dateString } = time;

  const hourDeg = (hours % 12 + minutes / 60) * 30;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const secondDeg = seconds * 6;

  // Prevent transition jump when seconds go from 59 to 0
  const isSecondReset = prevSecondsRef.current === 59 && seconds === 0;

  if (mode === 'analog') {
    return (
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto my-2 flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-[#e0e5ec] shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_rgba(255,255,255,0.5)]">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
              <div className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-3 ${i % 3 === 0 ? 'bg-slate-900 w-1' : 'bg-slate-600'}`}></div>
            </div>
          ))}

          <div className="absolute w-2.5 h-2.5 bg-slate-900 rounded-full z-20 border-2 border-[#e0e5ec]"></div>
          
          <div className="absolute w-1.5 h-[28px] bg-slate-900 rounded-t-full bottom-1/2 left-1/2 -translate-x-1/2" style={{ transform: `rotate(${hourDeg}deg)`, transformOrigin: 'bottom' }}></div>
          <div className="absolute w-1 h-[40px] bg-slate-900 rounded-t-full bottom-1/2 left-1/2 -translate-x-1/2" style={{ transform: `rotate(${minuteDeg}deg)`, transformOrigin: 'bottom' }}></div>
          
          <div
            className="absolute w-0.5 h-[44px] bottom-1/2 left-1/2 -translate-x-1/2"
            style={{
              transform: `rotate(${secondDeg}deg)`,
              transformOrigin: 'bottom',
              transition: isSecondReset ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
             <div className="w-full h-full bg-red-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 my-2 flex items-center justify-center">
      <div className="w-full text-center bg-[#e0e5ec] py-4 px-2 rounded-xl shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_rgba(255,255,255,0.5)]">
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-wider">
          {String(hours).padStart(2, '0')}:
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">{dateString}</p>
      </div>
    </div>
  );
};