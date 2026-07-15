import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { infoSlides } from '../data/infoSlides';
import { InfoSlide } from '../types';
import { BookOpen, Calendar, DollarSign, Bell, QrCode } from 'lucide-react';

interface InfoAndQrisProps {
  slideIntervalMs?: number;
}

export const InfoAndQris: React.FC<InfoAndQrisProps> = ({ slideIntervalMs = 8000 }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto slide effect
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % infoSlides.length);
    }, slideIntervalMs);

    // Smooth progress bar update
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / (slideIntervalMs / 100));
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [currentSlideIndex, slideIntervalMs]);

  const slide: InfoSlide = infoSlides[currentSlideIndex];

  // Helper to render slide icons in emerald
  const getSlideIcon = (type: InfoSlide['type']) => {
    switch (type) {
      case 'hadits':
        return <BookOpen className="w-6 h-6 text-emerald-600" />;
      case 'keuangan':
        return <DollarSign className="w-6 h-6 text-emerald-600" />;
      case 'event':
        return <Calendar className="w-6 h-6 text-emerald-600" />;
      default:
        return <Bell className="w-6 h-6 text-emerald-600" />;
    }
  };

  // Render Slide content based on type
  const renderSlideContent = (item: InfoSlide) => {
    switch (item.type) {
      case 'hadits':
        return (
          <div className="flex flex-col h-full justify-between py-1 text-center">
            <div className="my-auto flex flex-col justify-center items-center gap-3">
              {/* Arabic Text with medium elegant styling */}
              <p className="font-arabic text-2xl md:text-3xl text-emerald-800 leading-relaxed tracking-wide font-normal drop-shadow-sm max-w-4xl text-center">
                {item.content}
              </p>
              {/* Indonesian translation - slightly smaller to avoid hitting boundaries */}
              <p className="text-base md:text-lg text-emerald-950 font-medium italic max-w-3xl leading-relaxed">
                {item.subContent}
              </p>
            </div>
            {/* Reduced mt and padded top for the hadits reference source */}
            <div className="text-right text-xs md:text-sm font-semibold tracking-wider text-amber-600 border-t border-emerald-500/10 pt-2 mt-2">
              — {item.highlight}
            </div>
          </div>
        );

      case 'keuangan':
        return (
          <div className="flex flex-col h-full justify-between py-1 text-emerald-950">
            <div className="my-auto">
              <h4 className="text-xl font-bold text-emerald-900 mb-3 text-center">
                {item.content}
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Pemasukan Card */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Penerimaan / Infaq
                  </span>
                  <div className="text-xl md:text-2xl font-black text-emerald-800 mt-2">
                    Rp 14.850.000
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Bulan Ini</span>
                </div>

                {/* Pengeluaran Card */}
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center shadow-sm">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                    Pengeluaran Operasional
                  </span>
                  <div className="text-xl md:text-2xl font-black text-rose-800 mt-2">
                    Rp 5.600.000
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold">Listrik, Air, AC, Bersih</span>
                </div>

                {/* Saldo Akhir */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center shadow-sm">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                    Sisa Saldo Kas
                  </span>
                  <div className="text-xl md:text-2xl font-black text-amber-800 mt-2">
                    Rp 9.250.000
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold">Kas Tersedia</span>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 font-medium italic mt-4">
              Laporan keuangan diperbarui berkala setiap hari Jum'at oleh Bendahara Musholla.
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="flex flex-col h-full justify-between py-1 text-emerald-950">
            <div className="my-auto">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2 mb-3">
                <span className="px-3 py-1 bg-amber-400 text-emerald-950 text-xs font-extrabold uppercase rounded-full">
                  Kegiatan Terdekat
                </span>
                <span className="text-sm font-bold text-emerald-800">
                  Musholla Nurul Hidayah
                </span>
              </div>
              <h4 className="text-xl md:text-2xl font-extrabold text-emerald-900 mb-1">
                {item.content}
              </h4>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-line leading-relaxed mb-3 font-medium">
                {item.subContent}
              </p>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-emerald-500/10 pt-2 mt-2">
              <span className="text-gray-500 italic font-medium">
                Ayo ajak keluarga & kerabat untuk memakmurkan masjid!
              </span>
              <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded text-amber-700 font-extrabold text-xs uppercase">
                {item.highlight}
              </span>
            </div>
          </div>
        );

      default: // pengumuman
        return (
          <div className="flex flex-col h-full justify-between py-1 text-center">
            <div className="my-auto flex flex-col justify-center items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center animate-pulse">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-xl md:text-2xl font-extrabold text-emerald-900 tracking-wide">
                {item.content}
              </h4>
              <p className="text-base text-gray-700 leading-relaxed max-w-2xl font-semibold">
                {item.subContent}
              </p>
            </div>
            <div className="text-xs md:text-sm font-bold text-amber-600 mt-2 uppercase tracking-widest animate-pulse border-t border-emerald-500/10 pt-2">
              {item.highlight}
            </div>
          </div>
        );
    }
  };

  return (
    <div id="row-content" className="grid grid-cols-12 gap-6 px-8 py-4 flex-grow overflow-hidden items-stretch relative z-10">
      
      {/* Kolom Kiri: Tampilan QRIS (Kloning Qris.jpg) */}
      <div className="col-span-4 flex flex-col">
        <div className="bg-white text-black p-5 rounded-3xl flex flex-col items-center justify-between border border-gray-200 h-full relative overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
          {/* Background red shapes to match Qris.jpg */}
          {/* Top-left/middle-left red shape */}
          <div className="absolute left-0 top-[28%] w-3 h-20 bg-[#df191f] rounded-r-lg z-0"></div>
          {/* Bottom-right diagonal red block */}
          <div className="absolute bottom-[-45px] right-[-45px] w-[130px] h-[130px] bg-[#df191f] rotate-45 z-0 border-[6px] border-white/50"></div>
          
          <div className="relative z-10 w-full h-full flex flex-col justify-between items-center">
            {/* QRIS Header branding */}
            <div className="w-full flex justify-between items-center border-b border-gray-200 pb-2.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  {/* Styled QRIS Logo */}
                  <div className="flex items-baseline font-black italic tracking-tighter text-gray-900 leading-none">
                    <span className="text-2xl">QR</span>
                    <span className="text-xl">IS</span>
                  </div>
                </div>
                <div className="h-5 w-[1px] bg-gray-300"></div>
                <div className="flex flex-col text-[7px] font-bold text-gray-500 leading-tight">
                  <span>QR Code Standar</span>
                  <span>Pembayaran Nasional</span>
                </div>
              </div>
              
              {/* GPN Logo style */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black tracking-tighter text-blue-900">GPN</span>
                {/* Stylized circular star representing GPN */}
                <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" className="opacity-10" />
                  <path d="M10.5,15.5L14,12L10.5,8.5L9,10L11,12L9,14L10.5,15.5M13.5,15.5L17,12L13.5,8.5L12,10L14,12L12,14L13.5,15.5Z" />
                </svg>
              </div>
            </div>

            {/* Merchant Info */}
            <div className="text-center w-full my-1">
              <h3 className="font-serif font-bold text-lg md:text-xl text-gray-900 leading-none uppercase tracking-wide">
                MUSHOLLA NURUL HIDAYAH BL
              </h3>
              <div className="text-[10px] text-gray-700 font-bold font-mono mt-1 flex flex-col justify-center items-center leading-none">
                <span>NMID : ID1024308871010</span>
                <span className="text-[9px] text-gray-500 mt-1 tracking-[0.2em] uppercase font-semibold">TID</span>
              </div>
            </div>

            {/* QR code itself */}
            <div className="p-3 bg-white rounded-2xl border border-gray-100 flex items-center justify-center my-1.5 shadow-md relative">
              {/* Real QR Code generated with the official payload from Qris.jpg */}
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570019ID102430887101001030005204000053033605802ID5925MUSHOLLA%20NURUL%20HIDAYAH%20BL6010Bojonggede6105169236304BF53" 
                alt="QRIS Infaq Musholla Nurul Hidayah BL" 
                className="w-[164px] h-[164px] object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.qr-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }
                }}
              />
              <div className="qr-fallback hidden flex-col items-center justify-center w-[164px] h-[164px] bg-gray-50 rounded text-center">
                <QrCode className="w-12 h-12 text-emerald-800 animate-pulse mb-1" />
                <span className="text-[10px] font-bold text-gray-700">QRIS OFFLINE</span>
                <span className="text-[8px] text-gray-500">Scan NMID secara manual</span>
              </div>
            </div>

            {/* Footer Card */}
            <div className="text-center w-full mt-1">
              <span className="font-serif text-xs font-black text-gray-900 tracking-wide uppercase">
                SATU QRIS UNTUK SEMUA
              </span>
              <p className="text-[8px] text-gray-500 font-semibold leading-tight mt-0.5">
                Cek aplikasi penyelenggara di: www.aspi-qris.id
              </p>
            </div>
            
            {/* Payment visual instructions at bottom */}
            <div className="w-full flex justify-between items-end mt-2">
              <div className="text-left leading-none">
                <p className="text-[7px] text-gray-400 font-bold uppercase">Dicetak oleh: 93600451</p>
                <p className="text-[7px] text-gray-400 font-bold uppercase">Versi cetak: 1.0.24.02.2026</p>
              </div>
              
              {/* Cara Bayar and tiny indicators */}
              <div className="text-right text-[8px] text-white/90 leading-tight pr-5 pb-1 relative z-10 font-bold flex flex-col items-end">
                <span className="text-[7px] uppercase tracking-wide opacity-80">Cara bayar dengan QRIS:</span>
                <div className="flex gap-1 mt-1 justify-end">
                  <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 text-[8px] flex items-center justify-center font-black">1</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 text-[8px] flex items-center justify-center font-black">2</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-white text-red-600 text-[8px] flex items-center justify-center font-black">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Info Slider (Bright Glassmorphism Theme) */}
      <div className="col-span-8 flex flex-col">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 border border-emerald-500/10 shadow-[0_15px_35px_rgba(0,0,0,0.06)] flex flex-col justify-between h-full relative overflow-hidden">
          
          {/* Slider Header */}
          <div className="flex justify-between items-center border-b border-emerald-500/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                {getSlideIcon(slide.type)}
              </div>
              <span className="text-lg font-black text-emerald-900 tracking-wide uppercase">
                {slide.title}
              </span>
            </div>
            
            {/* Indicator Dots */}
            <div className="flex gap-1.5">
              {infoSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlideIndex 
                      ? 'w-6 bg-emerald-600 shadow-sm' 
                      : 'w-2.5 bg-emerald-100 hover:bg-emerald-200'
                  }`}
                  aria-label={`Buka slide ke-${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Slide Content Display with Framer Motion transitions */}
          <div className="flex-grow flex flex-col justify-center py-4 px-2 overflow-hidden relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full h-full"
              >
                {renderSlideContent(slide)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar slider */}
          <div className="w-full h-1 bg-emerald-100 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-600 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

