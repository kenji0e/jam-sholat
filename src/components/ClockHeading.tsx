import React, { useState, useEffect } from 'react';
import { formatHijriDate } from '../utils/prayerCalc';

interface ClockHeadingProps {
  currentTime: Date;
  hijriOffset?: number;
}

export const ClockHeading: React.FC<ClockHeadingProps> = ({ currentTime, hijriOffset = 0 }) => {
  const [hijriDateString, setHijriDateString] = useState('');

  // Update Hijri date whenever current time or offset changes
  useEffect(() => {
    setHijriDateString(formatHijriDate(currentTime, hijriOffset));
  }, [currentTime, hijriOffset]);

  // Format Gregorian date in Indonesian
  const formatGregorianDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div 
      id="row-heading" 
      className="grid grid-cols-3 items-center px-8 py-4 bg-white/95 backdrop-blur-lg border-b-2 border-emerald-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.05)] z-10 relative"
    >
      {/* Kolom Kiri: Jam Digital */}
      <div className="flex flex-col items-start justify-center">
        <div className="font-digital text-6xl md:text-7xl font-black text-emerald-600 tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(5,150,105,0.15)]">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Kolom Tengah: Info Musholla */}
      <div className="text-center flex flex-col justify-center items-center">
        <div className="flex flex-col items-center justify-center mb-1">
          <div className="flex items-center gap-1.5 justify-center mb-0.5">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4M12,18C8.69,18 6,15.31 6,12C6,10.19 6.81,8.58 8.09,7.5C9.07,8.42 10.47,9 12,9C13.53,9 14.93,8.42 15.91,7.5C17.19,8.58 18,10.19 18,12C18,15.31 15.31,18 12,18Z" />
            </svg>
            <span className="text-base md:text-lg font-bold text-emerald-700/80 tracking-[0.2em] uppercase leading-none">
              Musholla
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 uppercase tracking-tight font-serif leading-none">
            Nurul Hidayah
          </h1>
        </div>
        <p className="text-sm md:text-base text-emerald-800/85 max-w-lg leading-none font-bold uppercase tracking-wider mt-1">
          Bukit Waringin - Bojonggede
        </p>
      </div>

      {/* Kolom Kanan: Tanggal Masehi dan Hijriah */}
      <div className="flex flex-col items-end justify-center text-right">
        <div className="text-xl md:text-2xl font-bold text-emerald-950">
          {formatGregorianDate(currentTime)}
        </div>
        <div className="text-lg md:text-xl font-bold text-amber-600 font-serif italic mt-0.5">
          {hijriDateString}
        </div>
      </div>
    </div>
  );
};
