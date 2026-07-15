import React from 'react';
import { PrayerTimeItem } from '../utils/prayerCalc';

interface PrayerFooterProps {
  schedules: PrayerTimeItem[];
  nextPrayerId: string | null;
}

export const PrayerFooter: React.FC<PrayerFooterProps> = ({ schedules, nextPrayerId }) => {
  return (
    <div 
      id="row-schedules" 
      className="grid grid-cols-7 gap-4 px-8 py-5 bg-white/95 border-t border-emerald-500/10 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] backdrop-blur-lg relative z-10"
    >
      {schedules.map((schedule) => {
        const isUpcoming = schedule.id === nextPrayerId;
        
        return (
          <div
            key={schedule.id}
            id={`schedule-${schedule.id}`}
            className={`flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-500 ${
              isUpcoming
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white scale-110 shadow-[0_10px_25px_rgba(5,150,105,0.25)] z-20 border border-emerald-500 font-bold'
                : 'bg-emerald-50/60 backdrop-blur-sm border border-emerald-100/70 text-emerald-950 hover:bg-emerald-50/90'
            }`}
          >
            {/* Prayer Name Header */}
            <span 
              className={`text-sm font-bold uppercase tracking-widest mb-1 ${
                isUpcoming ? 'text-amber-300' : 'text-emerald-700/80'
              }`}
            >
              {schedule.name}
            </span>

            {/* Time string (HH:mm format) */}
            <span 
              className={`font-digital text-4xl font-black ${
                isUpcoming ? 'text-white' : 'text-emerald-950'
              }`}
            >
              {schedule.timeString}
            </span>

            {/* Subtle active status indicator */}
            {isUpcoming && (
              <span className="text-[10px] font-extrabold mt-1 uppercase animate-pulse text-amber-300 tracking-wider">
                BERIKUTNYA
              </span>
            )}
            
            {!isUpcoming && (
              <span className="text-[10px] text-emerald-600/60 mt-1 uppercase tracking-wider font-semibold">
                WIB
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
