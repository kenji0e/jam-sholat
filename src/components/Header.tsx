/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { getHijriDateString } from '../utils/prayer';

interface HeaderProps {
  now: Date;
  hijriOffset: number;
}

export const Header: React.FC<HeaderProps> = ({ now, hijriOffset }) => {
  // Pastikan moment menggunakan locale Indonesia
  moment.locale('id');
  const timeString = moment(now).format('HH:mm:ss');
  const dateMasehi = moment(now).format('dddd, DD MMMM YYYY');
  const dateHijri = getHijriDateString(now, hijriOffset);

  return (
    <div
      id="baris-header"
      className="flex items-center justify-between border-b-4 bg-black/30 backdrop-blur-md"
      style={{
        borderColor: '#d4af37', // Emas sahdu
        height: '18vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Kolom Kiri: Jam Digital */}
      <div 
        id="header-jam-section" 
        className="w-1/3 flex flex-col items-center justify-center text-center"
      >
        <div
          id="header-jam"
          className="text-6xl font-bold text-yellow-400 leading-none tracking-wider font-mono"
        >
          {timeString}
        </div>
        <div 
          id="header-jam-label"
          className="text-sm uppercase tracking-[0.3em] opacity-80 mt-1 text-white font-medium"
        >
          WIB <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse ml-2" />
        </div>
      </div>

      {/* Kolom Tengah: Info Musholla */}
      <div 
        id="header-musholla-info"
        className="w-1/3 flex flex-col items-center justify-center text-center border-x border-white/10 px-4"
      >
        <h1
          id="header-musholla-name"
          className="text-3xl font-extrabold uppercase m-0 leading-tight tracking-wide"
          style={{
            color: '#d4af37', // Emas sahdu
          }}
        >
          Musholla Nurul Hidayah
        </h1>
        <p
          id="header-musholla-address"
          className="text-sm text-gray-200 mt-1 uppercase tracking-wider font-medium"
        >
          Perumahan Bukit Waringin, Bojonggede 16923
        </p>
      </div>

      {/* Kolom Kanan: Tanggalan Masehi & Hijriah */}
      <div 
        id="header-tanggal-section"
        className="w-1/3 flex flex-col items-center justify-center text-center"
      >
        <div
          id="header-tanggal-masehi"
          className="text-xl font-semibold text-white"
        >
          {dateMasehi}
        </div>
        <div
          id="header-tanggal-hijriah"
          className="text-2xl font-serif italic mt-1"
          style={{
            color: '#d4af37' // Emas sahdu
          }}
        >
          {dateHijri}
        </div>
      </div>
    </div>
  );
};
