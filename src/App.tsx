/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { getPrayerTimesForDate } from './utils/prayer';
import { Header } from './components/Header';
import { QrisSection } from './components/QrisSection';
import { InfoSlider } from './components/InfoSlider';
import { PrayerFooter } from './components/PrayerFooter';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PrayerItem } from './types';
import { Volume2, VolumeX, Settings, X, RefreshCw } from 'lucide-react';

export default function App() {
  const [now, setNow] = useState<Date>(new Date());
  const [hijriOffset, setHijriOffset] = useState<number>(0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Konfigurasi Iqomah (dalam menit)
  const [iqomahDurations, setIqomahDurations] = useState<{ [key: string]: number }>({
    SUBUH: 8,
    ZHUHUR: 7,
    ASHAR: 7,
    MAGHRIB: 7,
    ISYA: 7,
  });

  // Durasi Blank / Layar Mati (dalam menit)
  const [blankDuration, setBlankDuration] = useState<number>(5);
  // Volume Beep (true = bersuara, false = senyap)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Last played beep timestamp (dalam detik)
  const lastBeepTimeRef = useRef<number>(0);

  // Muat pengaturan dari localStorage saat pertama kali dirender
  useEffect(() => {
    try {
      const savedOffset = localStorage.getItem('mnh_hijri_offset');
      if (savedOffset !== null) setHijriOffset(parseInt(savedOffset, 10));

      const savedIqomah = localStorage.getItem('mnh_iqomah_durations');
      if (savedIqomah !== null) setIqomahDurations(JSON.parse(savedIqomah));

      const savedBlank = localStorage.getItem('mnh_blank_duration');
      if (savedBlank !== null) setBlankDuration(parseInt(savedBlank, 10));

      const savedAudio = localStorage.getItem('mnh_audio_enabled');
      if (savedAudio !== null) setAudioEnabled(savedAudio === 'true');
    } catch (e) {
      console.warn("Gagal memuat pengaturan dari localStorage:", e);
    }
  }, []);

  // Simpan pengaturan ke localStorage ketika berubah
  const saveHijriOffset = (newOffset: number) => {
    setHijriOffset(newOffset);
    localStorage.setItem('mnh_hijri_offset', newOffset.toString());
  };

  const saveIqomahDuration = (key: string, value: number) => {
    const updated = { ...iqomahDurations, [key]: value };
    setIqomahDurations(updated);
    localStorage.setItem('mnh_iqomah_durations', JSON.stringify(updated));
  };

  const saveBlankDuration = (value: number) => {
    setBlankDuration(value);
    localStorage.setItem('mnh_blank_duration', value.toString());
  };

  const saveAudioEnabled = (value: boolean) => {
    setAudioEnabled(value);
    localStorage.setItem('mnh_audio_enabled', value.toString());
  };

  // Jalankan Jam Utama
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambil Jadwal Sholat hari ini
  const todayPrayerTimes = getPrayerTimesForDate(now);

  // Ambil Jadwal Sholat besok (untuk wrap-around Isya ke Imsak besok)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowPrayerTimes = getPrayerTimesForDate(tomorrow);

  // Tentukan Sholat yang Akan Datang
  let nextPrayerIndex = -1;
  let nextPrayerItem: PrayerItem | null = null;
  const nowMs = now.getTime();

  for (let i = 0; i < todayPrayerTimes.length; i++) {
    if (todayPrayerTimes[i].time.getTime() > nowMs) {
      nextPrayerIndex = i;
      nextPrayerItem = todayPrayerTimes[i];
      break;
    }
  }

  // Jika semua sholat hari ini telah lewat, sholat berikutnya adalah IMSAK BESOK
  if (nextPrayerIndex === -1) {
    nextPrayerIndex = 0; // Index 0 adalah IMSAK
    nextPrayerItem = {
      ...tomorrowPrayerTimes[0],
      time: tomorrowPrayerTimes[0].time // Menggunakan waktu Imsak besok
    };
  }

  // Logika Deterministic State Machine (Iqomah & Blank Screens)
  let activeIqomahPrayer: string | null = null;
  let iqomahSecondsRemaining = 0;
  let isBlankScreen = false;
  let blankScreenMessage = "LURUSKAN DAN RAPATKAN SHAF...";

  // Cari apakah kita sedang berada di masa Iqomah atau Blank setelah salah satu dari 5 Shalat Fardhu
  const fardhuPrayers = ['SUBUH', 'ZHUHUR', 'ASHAR', 'MAGHRIB', 'ISYA'];

  for (const prayer of todayPrayerTimes) {
    if (fardhuPrayers.includes(prayer.name)) {
      const prayerTimeMs = prayer.time.getTime();
      const iqomahMinutes = iqomahDurations[prayer.name] || 7;
      const iqomahDurationMs = iqomahMinutes * 60 * 1000;
      const blankDurationMs = blankDuration * 60 * 1000;

      // 1. Fase Iqomah: [Waktu Sholat s/d Waktu Sholat + Durasi Iqomah]
      if (nowMs >= prayerTimeMs && nowMs < prayerTimeMs + iqomahDurationMs) {
        activeIqomahPrayer = prayer.name;
        iqomahSecondsRemaining = Math.floor((prayerTimeMs + iqomahDurationMs - nowMs) / 1000);
        break;
      }

      // 2. Fase Layar Mati (Blank): [Waktu Sholat + Durasi Iqomah s/d Waktu Sholat + Durasi Iqomah + Durasi Sholat]
      if (nowMs >= prayerTimeMs + iqomahDurationMs && nowMs < prayerTimeMs + iqomahDurationMs + blankDurationMs) {
        isBlankScreen = true;
        blankScreenMessage = `SHALAT ${prayer.name} SEDANG BERLANGSUNG...`;
        break;
      }
    }
  }

  // Tambahan banner info untuk solar events (Imsak & Syuruq) selama 2 menit pertama setelah masuk waktunya
  let solarEventMessage: string | null = null;
  const solarEvents = ['IMSAK', 'SYURUQ'];
  for (const solar of todayPrayerTimes) {
    if (solarEvents.includes(solar.name)) {
      const solarTimeMs = solar.time.getTime();
      if (nowMs >= solarTimeMs && nowMs < solarTimeMs + 2 * 60 * 1000) {
        solarEventMessage = solar.name === 'IMSAK' 
          ? "WAKTU IMSAK TELAH TIBA — Selamat Bersantap Sahur / Menahan Diri" 
          : "WAKTU SYURUQ TELAH TIBA — Waktu Terbit Matahari (Telah Habis Waktu Subuh)";
        break;
      }
    }
  }

  // Synthesize Beep Sound using Web Audio API
  const playBeepTone = (frequency: number, duration: number) => {
    if (!audioEnabled) return;
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      // Lazy init AudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current = new AudioContextClass();
      }
      
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02); // Ramp up keras
      gainNode.gain.setValueAtTime(1.0, ctx.currentTime + duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration); // Ramp down

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Gagal memainkan suara alarm:", e);
    }
  };

  // Pemicu Suara Alarm (Beeps) - Berjalan setiap detik
  useEffect(() => {
    const currentSecondSec = Math.floor(now.getTime() / 1000);
    // Hindari duplikasi bunyi pada detik yang sama
    if (currentSecondSec === lastBeepTimeRef.current) return;
    lastBeepTimeRef.current = currentSecondSec;

    // 1. Alarm sebelum Masuk Waktu Shalat (10 detik sebelum Adzan)
    if (nextPrayerItem) {
      const diffToPrayer = Math.floor((nextPrayerItem.time.getTime() - now.getTime()) / 1000);
      
      // Detik ke 10 s/d 1 sebelum adzan: bunyi beep pendek 1x per detik
      if (diffToPrayer >= 1 && diffToPrayer <= 10) {
        playBeepTone(880, 0.25); // Beep keras frekuensi tinggi
      }
      // Tepat saat adzan (detik ke-0): bunyi panjang keras
      if (diffToPrayer === 0) {
        playBeepTone(1200, 1.5); // Beep penanda masuk waktu sholat
      }
    }

    // 2. Alarm sebelum Iqomah (10 detik sebelum Iqomah dimulai)
    if (activeIqomahPrayer && iqomahSecondsRemaining > 0) {
      // Detik ke 10 s/d 1 sebelum iqomah: beep frekuensi berbeda
      if (iqomahSecondsRemaining >= 1 && iqomahSecondsRemaining <= 10) {
        playBeepTone(660, 0.3); // Nada peringatan iqomah
      }
      // Detik ke-0: tanda iqomah dimulai dan layar mati
      if (iqomahSecondsRemaining === 1) {
        setTimeout(() => {
          playBeepTone(500, 1.0); // Nada rendah panjang tanda iqomah ditegakkan
        }, 1000);
      }
    }
  }, [now, nextPrayerItem, activeIqomahPrayer, iqomahSecondsRemaining]);

  // Request Fullscreen otomatis bila pengguna mengklik layar
  const handleScreenClick = () => {
    const docElem = document.documentElement as any;
    const requestFS = docElem.requestFullscreen || docElem.mozRequestFullScreen || docElem.webkitRequestFullscreen || docElem.msRequestFullscreen;
    
    if (requestFS && !document.fullscreenElement) {
      requestFS.call(docElem).catch((err: any) => {
        console.warn("Fullscreen diblokir browser, memerlukan interaksi pertama:", err);
      });
    }

    // Coba aktifkan AudioContext jika suspended
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Keluar dari Fullscreen (dipicu di pojok kanan bawah)
  const handleExitFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Cegah mentrigger enterFullscreen kembali
    const doc = document as any;
    const exitFS = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    
    if (exitFS && doc.fullscreenElement) {
      exitFS.call(doc).catch((err: any) => {
        console.error("Gagal keluar dari Fullscreen:", err);
      });
    }
  };

  return (
    <div
      id="main-app-container"
      onClick={handleScreenClick}
      className="relative h-screen w-screen overflow-hidden flex flex-col select-none text-white"
      style={{
        backgroundImage: 'radial-gradient(circle at center, #065f46 0%, #022c22 100%)',
        backgroundColor: '#022c22',
        height: '100vh',
        width: '100vw'
      }}
    >
      {/* Background Overlay Gelap & Transparan */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-xs z-0 pointer-events-none" />

      {/* Floating Solar Event Banner (Jika ada Imsak/Syuruq yang baru aktif) */}
      {solarEventMessage && (
        <div 
          className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-red-950/95 text-yellow-300 font-extrabold px-8 py-3 rounded-full border-2 border-yellow-500 shadow-2xl animate-bounce text-center"
          style={{ fontSize: '1.4rem', color: '#FFFF00', borderColor: '#D4AF37' }}
        >
          {solarEventMessage}
        </div>
      )}

      {/* BARIS 1: HEADER (Membawa 18% tinggi layar) */}
      <div className="relative z-10">
        <Header now={now} hijriOffset={hijriOffset} />
      </div>

      {/* BARIS 2: CONTENT GRID (Membawa 62% tinggi layar) */}
      <div 
        className="relative z-10 flex-grow flex p-6 space-x-6 items-stretch overflow-hidden"
        style={{ height: '62vh', boxSizing: 'border-box' }}
      >
        {/* Kolom Kiri: QRIS (30% Lebar) */}
        <div className="flex" style={{ width: '30%' }}>
          <QrisSection />
        </div>

        {/* Kolom Kanan: Info Slider ATAU Iqomah Countdown (70% Lebar) */}
        <div className="flex relative" style={{ width: '70%' }}>
          {activeIqomahPrayer ? (
            /* IQOMAH COUNTDOWN MODE OVERLAY */
            <div
              id="iqomah-countdown-card"
              className="w-full h-full flex flex-col items-center justify-center rounded-2xl border text-center p-6 bg-red-950/60 backdrop-blur-xl shadow-2xl animate-pulse"
              style={{
                borderColor: 'rgba(212, 175, 55, 0.4)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.06), 0 0 35px rgba(239, 68, 68, 0.4)'
              }}
            >
              <h1 
                className="font-extrabold uppercase tracking-widest text-white m-0"
                style={{ fontSize: '3.8rem' }}
              >
                IQOMAH {activeIqomahPrayer}
              </h1>
              
              {/* Timer Menit:Detik */}
              <div
                className="font-bold tracking-wider leading-none my-3"
                style={{
                  fontSize: '10.5rem',
                  color: '#FFFF00', // Kuning aktif mencolok
                  fontFamily: 'monospace, sans-serif'
                }}
              >
                {Math.floor(iqomahSecondsRemaining / 60)}:{(iqomahSecondsRemaining % 60).toString().padStart(2, '0')}
              </div>

              {/* Teks Instruksi Berjamaah */}
              <p
                className="text-white font-extrabold tracking-wide m-0"
                style={{
                  fontSize: iqomahSecondsRemaining <= 10 ? '2.8rem' : '2.1rem',
                  color: iqomahSecondsRemaining <= 10 ? '#FFFF00' : '#FFFFFF',
                  animation: iqomahSecondsRemaining <= 10 ? 'pulse 0.5s infinite' : 'none'
                }}
              >
                {iqomahSecondsRemaining <= 10 
                  ? "RAPATKAN & LURUSKAN SHAF!" 
                  : "Mempersiapkan Shalat Berjamaah"}
              </p>
            </div>
          ) : (
            /* NORMAL MODE SLIDER */
            <InfoSlider />
          )}
        </div>
      </div>

      {/* BARIS 3: JADWAL SHOLAT FOOTER (Membawa 20% tinggi layar) */}
      <div className="relative z-10">
        <PrayerFooter 
          prayerTimes={todayPrayerTimes} 
          nextPrayerIndex={nextPrayerIndex} 
        />
      </div>

      {/* FULLSCREEN & SETTINGS TOGGLES (Floating Control Ring) */}
      <div 
        className="fixed bottom-4 left-4 z-40 flex items-center space-x-3 opacity-30 hover:opacity-100 transition-opacity duration-300"
      >
        {/* Tombol Settings */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
          }}
          className="bg-emerald-950/90 text-yellow-400 p-2 rounded-full border border-yellow-500/50 hover:bg-emerald-900 cursor-pointer"
          title="Buka Pengaturan"
        >
          <Settings size={20} />
        </button>

        {/* Indikator Audio */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            saveAudioEnabled(!audioEnabled);
            playBeepTone(1000, 0.15);
          }}
          className="bg-emerald-950/90 p-2 rounded-full border cursor-pointer transition-colors"
          style={{ 
            color: audioEnabled ? '#FFFF00' : '#EF4444', 
            borderColor: audioEnabled ? '#D4AF37' : '#EF4444' 
          }}
          title={audioEnabled ? "Matikan Suara Beep" : "Aktifkan Suara Beep"}
        >
          {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* SCREEN BLACK-OUT OVERLAY (Aktif saat Shalat Berlangsung) */}
      <CountdownOverlay isBlank={isBlankScreen} message={blankScreenMessage} />

      {/* SETTINGS PANEL MODAL */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()} // Lindungi klik modal agar tidak masuk fullscreen
        >
          <div 
            className="bg-emerald-950 border-4 border-yellow-500 p-8 rounded-3xl w-full max-w-2xl text-white shadow-2xl relative"
            style={{ borderColor: '#D4AF37' }}
          >
            {/* Tutup Modal */}
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-black/20 p-2 rounded-full cursor-pointer"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold border-b-2 border-yellow-500 pb-2 mb-6 uppercase tracking-wide text-center" style={{ color: '#D4AF37' }}>
              Pengaturan Musholla Nurul Hidayah
            </h2>

            <div className="space-y-6 overflow-y-auto pr-2 max-h-[60vh]">
              {/* Koreksi Kalender Hijriah */}
              <div className="flex items-center justify-between bg-black/25 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-lg font-bold">Koreksi Tanggal Hijriah</h4>
                  <p className="text-sm text-slate-300">Sesuaikan selisih tanggal kalender islam (+/- hari)</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => saveHijriOffset(hijriOffset - 1)}
                    className="bg-red-800 hover:bg-red-700 font-extrabold px-3 py-1 rounded cursor-pointer"
                  >
                    -1 Hari
                  </button>
                  <span className="text-xl font-bold text-yellow-300 w-12 text-center" style={{ color: '#FFFF00' }}>
                    {hijriOffset >= 0 ? `+${hijriOffset}` : hijriOffset}
                  </span>
                  <button 
                    onClick={() => saveHijriOffset(hijriOffset + 1)}
                    className="bg-emerald-800 hover:bg-emerald-700 font-extrabold px-3 py-1 rounded cursor-pointer"
                  >
                    +1 Hari
                  </button>
                </div>
              </div>

              {/* Jeda Iqomah per Shalat */}
              <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-lg font-bold border-b border-white/10 pb-1">Durasi Jeda Iqomah (Menit)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(iqomahDurations).map((prayerKey) => (
                    <div key={prayerKey} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                      <span className="font-bold text-yellow-500" style={{ color: '#D4AF37' }}>{prayerKey}:</span>
                      <div className="flex items-center space-x-2">
                        <button 
                          disabled={iqomahDurations[prayerKey] <= 1}
                          onClick={() => saveIqomahDuration(prayerKey, iqomahDurations[prayerKey] - 1)}
                          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 px-2 rounded font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-extrabold w-6 text-center text-lg">{iqomahDurations[prayerKey]}</span>
                        <button 
                          onClick={() => saveIqomahDuration(prayerKey, iqomahDurations[prayerKey] + 1)}
                          className="bg-slate-700 hover:bg-slate-600 px-2 rounded font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Durasi Shalat / Layar Mati */}
              <div className="flex items-center justify-between bg-black/25 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-lg font-bold">Durasi Layar Mati Shalat</h4>
                  <p className="text-sm text-slate-300">Lama layar off saat shalat sedang berlangsung</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={blankDuration <= 1}
                    onClick={() => saveBlankDuration(blankDuration - 1)}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 px-2 rounded font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold w-8 text-center text-lg">{blankDuration} Mnt</span>
                  <button 
                    onClick={() => saveBlankDuration(blankDuration + 1)}
                    className="bg-slate-700 hover:bg-slate-600 px-2 rounded font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tombol Test Audio */}
              <div className="flex items-center justify-between bg-black/25 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-lg font-bold">Uji Coba Pengeras Suara TV</h4>
                  <p className="text-sm text-slate-300">Keluarkan bunyi untuk tes speaker internal STB/TV</p>
                </div>
                <button
                  onClick={() => playBeepTone(880, 0.5)}
                  className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-full cursor-pointer flex items-center space-x-2 hover:bg-yellow-400"
                  style={{ backgroundColor: '#FFFF00' }}
                >
                  <Volume2 size={16} /> <span>Mainkan Beep</span>
                </button>
              </div>
            </div>

            {/* Simpan & Kembali */}
            <div className="mt-8 text-center border-t border-white/10 pt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-lg uppercase tracking-wide px-8 py-3 rounded-full shadow-lg cursor-pointer"
                style={{ backgroundColor: '#D4AF37' }}
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        RAHASIA / EXIT FULLSCREEN TRIGGER (Pojok Kanan Bawah)
        Diberikan area transparan sebesar 60x60 pixel sesuai spesifikasi untuk keluar dari fullscreen
      */}
      <div
        id="hidden-exit-fullscreen"
        onClick={handleExitFullscreen}
        className="fixed bottom-0 right-0 w-12 h-12 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-25 bg-white/25 rounded-tl-full transition-all duration-300 z-50"
        title="Keluar dari Fullscreen"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
        </svg>
      </div>
    </div>
  );
}
