/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';

interface CountdownOverlayProps {
  isBlank: boolean;
  message?: string;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ isBlank, message = "LURUSKAN DAN RAPATKAN SHAF..." }) => {
  if (!isBlank) return null;

  return (
    <div
      id="screen-off-state"
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 select-none cursor-none"
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000000', // Benar-benar hitam (Screen Off)
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="text-center flex flex-col items-center space-y-4"
      >
        <div 
          className="font-bold tracking-widest uppercase"
          style={{
            fontSize: '2.5rem',
            color: '#D4AF37', // Emas redup agar tidak silau saat shalat
          }}
        >
          {message}
        </div>
        <div 
          className="italic text-slate-500 font-medium"
          style={{ fontSize: '1.2rem' }}
        >
          Papan Informasi Dimatikan Sementara Selama Shalat Berlangsung
        </div>
      </motion.div>
    </div>
  );
};
