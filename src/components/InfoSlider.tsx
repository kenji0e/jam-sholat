/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, DollarSign, Calendar, BellRing } from 'lucide-react';
import { InfoSlide } from '../types';

export const InfoSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: InfoSlide[] = [
    {
      id: 'hadits-1',
      type: 'hadits',
      title: 'Hadits Hari Ini',
      content: '"Shalat berjamaah lebih utama dua puluh tujuh derajat dibanding shalat sendirian."',
      additionalData: 'HR. Bukhari dan Muslim'
    },
    {
      id: 'keuangan-1',
      type: 'keuangan',
      title: 'Laporan Keuangan Kas Musholla',
      content: 'Laporan kas per Juli 2026:',
      additionalData: {
        pemasukan: 5430000,
        pengeluaran: 1250000,
        saldo: 4180000,
        keterangan: 'Jazaakumullahu Khairan kepada para donatur.'
      }
    },
    {
      id: 'event-1',
      type: 'event',
      title: 'Kajian Rutin Mingguan',
      content: 'Kajian Malam Jumat (Ba\'da Isya)',
      additionalData: {
        materi: 'Pembahasan Kitab Riyadhus Shalihin',
        pemateri: 'Ustadz Dr. H. Ahmad Fauzi, M.A.',
        waktu: 'Malam Jumat, Pukul 19.30 WIB - Selesai'
      }
    },
    {
      id: 'hadits-2',
      type: 'hadits',
      title: 'Keutamaan Membangun Masjid',
      content: '"Barangsiapa yang membangun masjid karena Allah, maka Allah akan membangunkan baginya rumah yang serupa di surga."',
      additionalData: 'HR. Bukhari dan Muslim'
    },
    {
      id: 'event-2',
      type: 'event',
      title: 'TPA Anak-Anak Nurul Hidayah',
      content: 'Pembelajaran Al-Qur\'an & Akhlak Anak',
      additionalData: {
        materi: 'Metode Iqro & Ilmu Tajwid Praktis',
        pemateri: 'Ustadzah Siti Aminah & Tim Remaja Masjid',
        waktu: 'Senin - Kamis, Pukul 16.00 s/d 17.30 WIB'
      }
    },
    {
      id: 'dzikir-1',
      type: 'dzikir',
      title: 'Himbauan Jemaah',
      content: 'Mohon menonaktifkan suara telepon genggam (HP) atau mengubahnya ke mode senyap ketika berada di dalam ruang utama Musholla.',
      additionalData: 'Tertib & Tenang untuk Kekhusyukan Shalat Berjamaah'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 8000); // Slide berganti setiap 8 detik

    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[currentIndex];

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const renderSlideContent = (slide: InfoSlide) => {
    switch (slide.type) {
      case 'hadits':
        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center gap-4 pb-3 border-b border-white/10">
              <span className="px-4 py-1 bg-[#d4af37] text-emerald-950 font-bold rounded-full text-xs uppercase tracking-wider">
                {slide.title}
              </span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex-grow flex items-center justify-center my-4">
              <p 
                className="font-serif leading-[1.4] italic text-white/90 drop-shadow-md text-center" 
                style={{ fontSize: '1.9rem' }}
              >
                {slide.content}
              </p>
            </div>
            <div className="text-right font-semibold" style={{ fontSize: '1.15rem', color: '#d4af37' }}>
              — {slide.additionalData}
            </div>
          </div>
        );
        
      case 'keuangan':
        const finance = slide.additionalData;
        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center gap-4 pb-3 border-b border-white/10">
              <span className="px-4 py-1 bg-[#d4af37] text-emerald-950 font-bold rounded-full text-xs uppercase tracking-wider">
                {slide.title}
              </span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex-grow flex flex-col justify-center my-2 space-y-3">
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-white/90" style={{ fontSize: '1.15rem' }}>Pemasukan (Kas Masuk):</span>
                <span className="font-bold text-emerald-400" style={{ fontSize: '1.3rem', color: '#34d399' }}>{formatRupiah(finance.pemasukan)}</span>
              </div>
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-white/90" style={{ fontSize: '1.15rem' }}>Pengeluaran (Kas Keluar):</span>
                <span className="font-bold text-red-400" style={{ fontSize: '1.3rem', color: '#f87171' }}>{formatRupiah(finance.pengeluaran)}</span>
              </div>
              <div className="flex justify-between items-center bg-black/45 p-3.5 rounded-xl border border-yellow-500/20">
                <span className="font-bold" style={{ fontSize: '1.2rem', color: '#d4af37' }}>Saldo Akhir Kas Musholla:</span>
                <span className="font-extrabold text-yellow-300" style={{ fontSize: '1.45rem', color: '#facc15' }}>{formatRupiah(finance.saldo)}</span>
              </div>
            </div>
            <div className="text-center italic font-medium" style={{ fontSize: '0.95rem', color: '#d4af37' }}>
              {finance.keterangan}
            </div>
          </div>
        );

      case 'event':
        const event = slide.additionalData;
        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center gap-4 pb-3 border-b border-white/10">
              <span className="px-4 py-1 bg-[#d4af37] text-emerald-950 font-bold rounded-full text-xs uppercase tracking-wider">
                {slide.title}
              </span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex-grow flex flex-col justify-center my-2 space-y-2 text-center">
              <h4 className="font-extrabold text-white" style={{ fontSize: '1.6rem' }}>
                {slide.content}
              </h4>
              <p className="font-bold italic text-yellow-400" style={{ fontSize: '1.2rem' }}>
                {event.materi}
              </p>
              <div className="p-3 rounded-xl bg-black/25 inline-block mx-auto mt-1 border border-white/5">
                <div style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>
                  Pemateri: <span className="font-bold text-slate-200">{event.pemateri}</span>
                </div>
                <div className="mt-1 font-semibold" style={{ fontSize: '0.95rem', color: '#d4af37' }}>
                  {event.waktu}
                </div>
              </div>
            </div>
          </div>
        );

      case 'dzikir':
        return (
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center gap-4 pb-3 border-b border-white/10">
              <span className="px-4 py-1 bg-[#d4af37] text-emerald-950 font-bold rounded-full text-xs uppercase tracking-wider">
                {slide.title}
              </span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>
            <div className="flex-grow flex items-center justify-center my-4">
              <p 
                className="text-center font-semibold leading-relaxed text-white/95" 
                style={{ fontSize: '1.45rem' }}
              >
                {slide.content}
              </p>
            </div>
            <div className="text-center font-bold uppercase tracking-wider bg-yellow-500/10 py-2 px-4 rounded-lg border border-yellow-500/25 text-yellow-400" style={{ fontSize: '0.9rem' }}>
              {slide.additionalData}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div
      id="info-slider-card"
      className="flex flex-col justify-between p-8 rounded-2xl border relative overflow-hidden bg-emerald-900/40 backdrop-blur-xl"
      style={{
        borderColor: 'rgba(255, 255, 255, 0.2)', // translucent border
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.5)'
      }}
    >
      {/* Container Slide dengan transisi Framer Motion */}
      <div id="slider-content-area" className="flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full h-full absolute inset-0 flex flex-col justify-between"
          >
            {renderSlideContent(activeSlide)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bullets Indikator Slide */}
      <div 
        id="slider-dots"
        className="flex justify-center space-x-2 mt-4"
        style={{ height: '12px' }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="rounded-full transition-all duration-300"
            style={{
              width: currentIndex === index ? '24px' : '8px',
              height: '8px',
              backgroundColor: currentIndex === index ? '#FFFF00' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
