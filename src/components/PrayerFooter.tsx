/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import { PrayerItem } from '../types';

interface PrayerFooterProps {
  prayerTimes: PrayerItem[];
  nextPrayerIndex: number;
}

export const PrayerFooter: React.FC<PrayerFooterProps> = ({ prayerTimes, nextPrayerIndex }) => {
  return (
    <div
      id="baris-jadwal-sholat"
      className="flex items-stretch justify-between p-3 gap-2 bg-black/60 backdrop-blur-2xl border-t border-white/10"
      style={{
        height: '20vh',
        boxSizing: 'border-box',
      }}
    >
      {prayerTimes.map((item, idx) => {
        const isUpcoming = idx === nextPrayerIndex;
        
        return (
          <div
            key={item.name}
            id={`prayer-slot-${item.name.toLowerCase()}`}
            className={`flex-1 flex flex-col items-center justify-center rounded-xl transition-all duration-500 ${
              isUpcoming 
                ? 'bg-yellow-400 border-2 border-white scale-105 transform z-10' 
                : 'bg-emerald-950/40 border border-white/5'
            }`}
            style={{
              boxShadow: isUpcoming 
                ? '0 0 30px rgba(250, 204, 21, 0.4)' 
                : undefined,
              boxSizing: 'border-box'
            }}
          >
            {/* Nama Sholat */}
            <div
              id={`prayer-name-${item.name.toLowerCase()}`}
              className={`text-xs font-bold uppercase tracking-widest text-center ${
                isUpcoming ? 'text-black font-black' : 'text-[#d4af37]'
              }`}
            >
              {item.label}
            </div>
            
            {/* Waktu Sholat */}
            <div
              id={`prayer-time-${item.name.toLowerCase()}`}
              className={`font-mono font-bold mt-2 text-center leading-none ${
                isUpcoming ? 'text-black text-5xl font-black' : 'text-white text-4xl'
              }`}
            >
              {moment(item.time).format('HH:mm')}
            </div>

            {/* Label Status Aktif di TV */}
            {isUpcoming && (
              <div 
                className="text-[10px] text-emerald-900 font-bold uppercase mt-1 animate-pulse"
              >
                Segera Datang
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
