/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const QrisSection: React.FC = () => {
  return (
    <div
      id="qris-card"
      className="flex flex-col items-center justify-center p-4 rounded-2xl shadow-2xl border-4 bg-white"
      style={{
        borderColor: 'rgba(212, 175, 55, 0.3)', // #d4af37 with 30% opacity
        width: '100%',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header QRIS Brand */}
      <div 
        id="qris-header"
        className="w-full flex flex-col items-center justify-center mb-2"
      >
        <p className="text-black font-extrabold text-xl tracking-tighter uppercase mb-0">
          Infaq Digital (QRIS)
        </p>
        <div className="flex items-center space-x-1 mt-1">
          <span className="font-bold tracking-wider text-slate-700" style={{ fontSize: '0.9rem' }}>QRIS</span>
          <span className="text-red-600 font-bold text-[10px]" style={{ verticalAlign: 'super' }}>GPN</span>
        </div>
      </div>

      {/* QR Code Container */}
      <div 
        id="qris-image-container"
        className="w-[240px] h-[240px] bg-gray-100 flex items-center justify-center rounded-lg p-2"
      >
        <img
          id="qris-code-image"
          src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=MUSHOLLA_NURUL_HIDAYAH_BOJONGGEDE_16923"
          alt="QRIS"
          className="w-full h-full p-2"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Footer Instructions */}
      <div 
        id="qris-footer"
        className="w-full text-center mt-3"
      >
        <div 
          className="font-bold text-slate-800 uppercase"
          style={{ fontSize: '0.85rem' }}
        >
          Musholla Nurul Hidayah
        </div>
        <p 
          className="text-gray-500 text-xs mt-1 italic text-center leading-relaxed mb-0"
        >
          Silakan Scan Menggunakan Aplikasi Dompet Digital Anda Untuk Infaq / Sedekah
        </p>
      </div>
    </div>
  );
};
