import React, { useState, useEffect, useRef } from 'react';
import { calculatePrayerTimes, PrayerTimeItem, formatHijriDate } from './utils/prayerCalc';
import { ClockHeading } from './components/ClockHeading';
import { InfoAndQris } from './components/InfoAndQris';
import { PrayerFooter } from './components/PrayerFooter';
import { Volume2, Settings, Play, RefreshCw, AlertTriangle, EyeOff, Maximize, Minimize } from 'lucide-react';

// Web Audio API buzzer sound generator
function playHardBeep(frequency = 1100, duration = 0.5, volume = 0.9) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // 'square' is significantly louder, crisper, and more audible on low-end STB/TV speakers
    osc.type = 'square';
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Failed to play audio buzzer:", e);
  }
}

type AppState = 'welcome' | 'normal' | 'countdown' | 'shaf_alert' | 'blackout';

export default function App() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Persistent Offsets saved in localStorage for easy mosque administration
  const [hijriOffset, setHijriOffset] = useState<number>(() => {
    return Number(localStorage.getItem('mnh_hijri_offset') || '0');
  });
  
  const [prayerOffsets, setPrayerOffsets] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('mnh_prayer_offsets');
      return stored ? JSON.parse(stored) : {
        IMSAK: 0,
        SUBUH: 2,
        SYURUQ: -2,
        ZHUHUR: 2,
        ASHAR: 2,
        MAGHRIB: 2,
        ISYA: 2
      };
    } catch {
      return { IMSAK: 0, SUBUH: 2, SYURUQ: -2, ZHUHUR: 2, ASHAR: 2, MAGHRIB: 2, ISYA: 2 };
    }
  });

  // State values for active prayer & countdowns
  const [schedules, setSchedules] = useState<PrayerTimeItem[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeItem | null>(null);
  const [activePrayer, setActivePrayer] = useState<PrayerTimeItem | null>(null);
  
  // Timer trackers
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [blackoutSeconds, setBlackoutSeconds] = useState<number>(0);
  const [alertSeconds, setAlertSeconds] = useState<number>(0);

  // Admin and UI controls
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track the previous seconds tick to play beeps only once per second change
  const lastSecondRef = useRef<number>(-1);

  // Calculate schedules on load and when offsets change
  useEffect(() => {
    const computed = calculatePrayerTimes(currentTime, prayerOffsets);
    setSchedules(computed);
  }, [prayerOffsets]);

  // Main 1000ms loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Recompute schedules every minute or hour to stay completely precise
      const computedSchedules = calculatePrayerTimes(now, prayerOffsets);
      setSchedules(computedSchedules);

      // Determine next prayer time
      let next = computedSchedules.find(s => s.time.getTime() > now.getTime());
      if (!next) {
        // All of today's prayers are passed, so the next is Subuh of tomorrow
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowSchedules = calculatePrayerTimes(tomorrow, prayerOffsets);
        next = tomorrowSchedules.find(s => s.id === 'subuh') || tomorrowSchedules[0];
      }
      setNextPrayer(next);

      // State machine logic
      if (appState === 'normal') {
        // Check if we are approaching any of the 5 daily prayers (Fajr/Subuh, Zhuhur, Ashar, Maghrib, Isya)
        const checkPrayers = computedSchedules.filter(s => s.id !== 'imsak' && s.id !== 'syuruq');
        
        // Is there a prayer starting right now?
        const currentActive = checkPrayers.find(s => {
          const diffMs = s.time.getTime() - now.getTime();
          // We check if we are within the exact second or first 3 seconds of the prayer starting
          return diffMs <= 0 && diffMs > -3000;
        });

        if (currentActive) {
          // Play double-beep to notify Adzan
          playHardBeep(1200, 0.5, 0.9);
          setTimeout(() => playHardBeep(1200, 0.5, 0.9), 600);
          
          setActivePrayer(currentActive);
          // Set jeda Adzan & Iqomah countdown: 8 minutes for Subuh, 7 minutes for others
          const minutes = currentActive.name === 'SUBUH' ? 8 : 7;
          setCountdownSeconds(minutes * 60);
          setAppState('countdown');
        } else {
          // Check for the 10x beep (10 seconds before next daily prayer starts)
          const nextDaily = checkPrayers.find(s => s.time.getTime() > now.getTime());
          if (nextDaily) {
            const diffSeconds = Math.round((nextDaily.time.getTime() - now.getTime()) / 1000);
            
            // Trigger 10 times beep (from 10 seconds to 1 second remaining)
            if (diffSeconds > 0 && diffSeconds <= 10) {
              const currentSec = now.getSeconds();
              if (currentSec !== lastSecondRef.current) {
                lastSecondRef.current = currentSec;
                // High volume beep
                playHardBeep(1000, 0.3, 0.9);
              }
            }
          }

          // Special gentle beep notifications for Imsak and Syuruq (no countdown, just notification)
          const nonDaily = computedSchedules.filter(s => s.id === 'imsak' || s.id === 'syuruq');
          const activeNonDaily = nonDaily.find(s => {
            const diffMs = s.time.getTime() - now.getTime();
            return diffMs <= 0 && diffMs > -1500;
          });
          if (activeNonDaily) {
            playHardBeep(1500, 0.25, 0.8);
            setTimeout(() => playHardBeep(1500, 0.25, 0.8), 400);
          }
        }
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [appState, prayerOffsets]);

  // Countdown seconds timer hook
  useEffect(() => {
    if (appState !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Iqomah ends, trigger "Rapatkan shaf" alert
          setAlertSeconds(10);
          setAppState('shaf_alert');
          // Play notification chime for Iqomah
          playHardBeep(900, 0.4, 0.95);
          setTimeout(() => playHardBeep(900, 0.4, 0.95), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState]);

  // Shaf alert timer hook
  useEffect(() => {
    if (appState !== 'shaf_alert') return;

    const timer = setInterval(() => {
      setAlertSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Alert ends, enter Blackout / Standby Shalat mode for 5 minutes
          setBlackoutSeconds(5 * 60);
          setAppState('blackout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState]);

  // Blackout standby timer hook
  useEffect(() => {
    if (appState !== 'blackout') return;

    const timer = setInterval(() => {
      setBlackoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Blackout ends, return to normal display
          setAppState('normal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState]);

  // Track Fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Enter Fullscreen handler
  const requestAppFullscreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    }
  };

  // Exit Fullscreen handler
  const exitAppFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleStartApp = () => {
    // Unlock Audio Context & trigger Fullscreen
    playHardBeep(1100, 0.15, 0.5);
    requestAppFullscreen();
    setAppState('normal');
  };

  // Save changes to Local Storage
  const handleSavePrayerOffset = (key: string, val: number) => {
    const updated = { ...prayerOffsets, [key]: val };
    setPrayerOffsets(updated);
    localStorage.setItem('mnh_prayer_offsets', JSON.stringify(updated));
  };

  const handleSaveHijriOffset = (val: number) => {
    setHijriOffset(val);
    localStorage.setItem('mnh_hijri_offset', String(val));
  };

  // Skip simulation helper
  const triggerSimulation = (type: 'beep' | 'pre_prayer' | 'countdown' | 'shaf' | 'blackout' | 'reset') => {
    if (type === 'beep') {
      playHardBeep(1000, 0.5, 0.9);
    } else if (type === 'pre_prayer') {
      setAppState('normal');
      // Set the time so we are exactly 9 seconds before Zhuhur
      const computed = calculatePrayerTimes(currentTime, prayerOffsets);
      const dhuhr = computed.find(s => s.id === 'zhuhur');
      if (dhuhr) {
        const simulatedDate = new Date(dhuhr.time.getTime() - 9000);
        setCurrentTime(simulatedDate);
      }
    } else if (type === 'countdown') {
      setActivePrayer({
        id: 'zhuhur',
        name: 'ZHUHUR',
        label: 'Zhuhur',
        time: new Date(),
        timeString: '12:03'
      });
      setCountdownSeconds(35); // simulated 35 seconds left
      setAppState('countdown');
    } else if (type === 'shaf') {
      setAlertSeconds(10);
      setAppState('shaf_alert');
    } else if (type === 'blackout') {
      setBlackoutSeconds(15); // simulated 15 seconds blackout
      setAppState('blackout');
    } else if (type === 'reset') {
      setAppState('normal');
      setCountdownSeconds(0);
      setAlertSeconds(0);
      setBlackoutSeconds(0);
    }
  };

  // Welcome Screen
  if (appState === 'welcome') {
    return (
      <div 
        id="welcome-screen"
        className="fixed inset-0 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center text-white text-center p-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"></div>
        
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 opacity-25 pointer-events-none z-[1]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl bg-emerald-900/40 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-lg">
          <div className="w-20 h-20 bg-masjid-gold/15 border-2 border-masjid-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-masjid-gold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4M12,18C8.69,18 6,15.31 6,12C6,10.19 6.81,8.58 8.09,7.5C9.07,8.42 10.47,9 12,9C13.53,9 14.93,8.42 15.91,7.5C17.19,8.58 18,10.19 18,12C18,15.31 15.31,18 12,18Z" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-masjid-gold tracking-tight uppercase mb-1 font-serif">
            Musholla Nurul Hidayah
          </h1>
          <p className="text-sm text-white/80 uppercase tracking-widest font-semibold mb-6">
            Bojonggede, Jawa Barat
          </p>

          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
            Aplikasi Jadwal Sholat Digital (STB / Android TV)
          </h2>
          
          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-8">
            Halaman ini dirancang untuk menampilkan jadwal sholat, adzan buzzer, hitung mundur iqomah, serta laporan keuangan. 
            Silakan klik tombol di bawah untuk mengaktifkan suara buzzer otomatis dan masuk ke mode layar penuh.
          </p>

          <button
            onClick={handleStartApp}
            className="w-full sm:w-auto px-8 py-4 bg-masjid-gold hover:bg-masjid-yellow text-emerald-950 font-black text-lg uppercase tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-masjid-gold/20 flex items-center justify-center gap-3 mx-auto"
          >
            <Play fill="currentColor" size={20} />
            Mulai Jadwal Masjid
          </button>
        </div>
      </div>
    );
  }

  // Blackout standby during shalat congregation (5 minutes blackout)
  if (appState === 'blackout') {
    return (
      <div 
        id="blackout-screen"
        className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white select-none transition-all duration-1000 z-[9000]"
      >
        <div className="text-center space-y-6">
          <EyeOff className="w-16 h-16 text-white/10 mx-auto animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold text-white/20 tracking-wider">
            SHOLAT BERJANGKIT / STANDBY
          </h2>
          <p className="text-lg text-white/10 italic">
            Layar non-aktif sementara agar jamaah dapat beribadah secara khusyuk.
          </p>
          <div className="text-xs text-white/5 font-mono">
            Mode sholat aktif: {Math.floor(blackoutSeconds / 60)}:{(blackoutSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Small transparent bypass buttons for administrators during testing */}
        <div className="absolute bottom-6 left-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => triggerSimulation('reset')}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-xs text-white/60 hover:bg-white/20"
          >
            Lewati Mode Sholat
          </button>
        </div>
      </div>
    );
  }

  // Rapatkan Shaf Alert Panel (10 seconds before blackout)
  if (appState === 'shaf_alert') {
    return (
      <div 
        id="shaf-alert-screen"
        className="fixed inset-0 bg-red-950/90 backdrop-blur-lg flex flex-col items-center justify-center text-white p-6 z-[8000] border-4 border-yellow-400 animate-pulse overflow-hidden"
      >
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="text-center max-w-4xl space-y-8 relative z-10">
          <div className="w-24 h-24 bg-masjid-yellow/10 border-4 border-masjid-yellow rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-16 h-16 text-masjid-yellow" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-masjid-yellow tracking-wider font-serif">
            IQOMAH TELAH TIBA
          </h1>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            RAPATKAN & LURUSKAN SHAF!
          </h2>
          
          <p className="text-xl md:text-2xl text-white/95 leading-relaxed font-light italic max-w-3xl mx-auto">
            "Rapatkan shaf dan luruskan, karena sesungguhnya meluruskan shaf itu termasuk dalam kesempurnaan shalat." (HR. Bukhari & Muslim)
          </p>

          <div className="text-6xl font-digital font-extrabold text-masjid-yellow pt-4">
            {alertSeconds} Detik
          </div>
        </div>

        {/* Small transparent bypass buttons for administrators */}
        <div className="absolute bottom-6 left-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => triggerSimulation('reset')}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-xs text-white/60 hover:bg-white/20"
          >
            Lewati Alert
          </button>
        </div>
      </div>
    );
  }

  // Adzan / Iqomah Countdown Overlay (Large full screen overlay)
  if (appState === 'countdown' && activePrayer) {
    return (
      <div 
        id="countdown-screen"
        className="fixed inset-0 bg-emerald-950/90 backdrop-blur-lg text-white p-8 flex flex-col justify-between select-none z-[7000] border-t-4 border-amber-500/50 overflow-hidden"
      >
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="text-center py-6 relative z-10">
          <span className="text-lg font-bold text-masjid-gold uppercase tracking-widest px-4 py-1.5 bg-masjid-gold/10 border border-masjid-gold/30 rounded-full">
            MEMASUKI WAKTU ADZAN & SHOLAT
          </span>
          <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tight mt-6 font-serif">
            Waktu Sholat {activePrayer.label}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mt-2">
            Musholla Nurul Hidayah, Perumahan Bukit Waringin, Bojonggede
          </p>
        </div>

        <div className="text-center my-auto flex flex-col justify-center items-center relative z-10">
          <span className="text-xl md:text-2xl font-semibold text-white/70 uppercase tracking-widest mb-3">
            HITUNG MUNDUR IQOMAH
          </span>
          <div className="font-digital text-8xl md:text-[11rem] font-black text-masjid-yellow leading-none tracking-tight digital-glow animate-pulse">
            {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="max-w-xl bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mt-8">
            <p className="text-lg text-masjid-gold font-bold mb-1">
              "Doa di Antara Adzan dan Iqomah Tidak Tertolak"
            </p>
            <p className="text-sm text-white/70 italic">
              Gunakan waktu yang utama ini untuk memperbanyak doa, istighfar, membaca Al-Quran, dan shalat sunnah Qobliyah.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-white/10 pt-4 text-sm text-white/60 relative z-10">
          <div>
            Adzan dimatikan otomatis setelah timer selesai.
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => triggerSimulation('reset')}
              className="px-4 py-1.5 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition text-white"
            >
              Lewati Hitung Mundur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Screen (Main Signage 3 rows dashboard)
  return (
    <div 
      id="main-app-screen"
      className="h-screen w-screen bg-[url('https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center overflow-hidden flex flex-col justify-between font-sans text-emerald-950 relative"
    >
      <div className="absolute inset-0 bg-emerald-50/75 backdrop-blur-[2px] z-[0]"></div>

      {/* Background Mesh Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-[1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-300 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-400 rounded-full blur-[120px]"></div>
      </div>

      {/* Row 1: Heading */}
      <ClockHeading currentTime={currentTime} hijriOffset={hijriOffset} />

      {/* Row 2: Content Slider + QRIS */}
      <InfoAndQris slideIntervalMs={8500} />

      {/* Row 3: Prayer Times Grid */}
      <PrayerFooter 
        schedules={schedules} 
        nextPrayerId={nextPrayer ? nextPrayer.id : null} 
      />

      {/* Fullscreen bottom-right transparent trigger block */}
      <button 
        id="fullscreen-corner-exit"
        onClick={isFullscreen ? exitAppFullscreen : requestAppFullscreen}
        title={isFullscreen ? "Keluar Layar Penuh" : "Masuk Layar Penuh"}
        className="fixed bottom-0 right-0 w-12 h-12 flex items-center justify-center opacity-0 hover:opacity-75 bg-black/60 border-l border-t border-masjid-gold/30 text-masjid-gold transition-opacity duration-300 rounded-tl-lg z-[5000]"
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>

      {/* Admin Panel Toggle bottom-left */}
      <button 
        id="admin-settings-toggle"
        onClick={() => setShowAdminPanel(!showAdminPanel)}
        title="Pengaturan Masjid"
        className="fixed bottom-0 left-0 w-12 h-12 flex items-center justify-center opacity-5 hover:opacity-100 bg-black/60 border-r border-t border-masjid-gold/30 text-masjid-gold transition-opacity duration-300 rounded-tr-lg z-[5000]"
      >
        <Settings size={16} />
      </button>

      {/* Admin Panel Drawer overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-md">
          <div className="bg-emerald-950/90 backdrop-blur-lg border border-white/10 text-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl flex flex-col space-y-6">
            
            <div className="flex justify-between items-center border-b border-masjid-gold/30 pb-3">
              <h2 className="text-xl font-bold text-masjid-gold uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5 text-masjid-gold" />
                Panel Admin & Pengaturan Musholla Nurul Hidayah
              </h2>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs text-white"
              >
                Tutup [X]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 overflow-y-auto max-h-[60vh] pr-2">
              
              {/* Kolom Kiri: Simulasi Alerts (Sangat Bagus untuk Testing) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-masjid-yellow uppercase tracking-widest border-b border-white/10 pb-1">
                  1. Alat Pengujian & Simulasi Alarm
                </h3>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => triggerSimulation('beep')}
                    className="w-full px-4 py-2 bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-xs text-left font-semibold rounded-lg flex items-center justify-between"
                  >
                    <span>Coba Bunyi Buzzer (1x)</span>
                    <Volume2 size={14} className="text-masjid-gold" />
                  </button>

                  <button
                    onClick={() => triggerSimulation('pre_prayer')}
                    className="w-full px-4 py-2 bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-xs text-left font-semibold rounded-lg flex items-center justify-between"
                  >
                    <span>Simulasikan 10 Detik Menjelang Adzan</span>
                    <RefreshCw size={14} className="text-masjid-gold animate-spin" />
                  </button>

                  <button
                    onClick={() => triggerSimulation('countdown')}
                    className="w-full px-4 py-2 bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-xs text-left font-semibold rounded-lg flex items-center justify-between"
                  >
                    <span>Simulasikan Hitung Mundur Iqomah (35s)</span>
                    <RefreshCw size={14} className="text-masjid-gold" />
                  </button>

                  <button
                    onClick={() => triggerSimulation('shaf')}
                    className="w-full px-4 py-2 bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-xs text-left font-semibold rounded-lg flex items-center justify-between"
                  >
                    <span>Simulasikan Pesan Rapatkan Shaf (10s)</span>
                    <AlertTriangle size={14} className="text-masjid-gold" />
                  </button>

                  <button
                    onClick={() => triggerSimulation('blackout')}
                    className="w-full px-4 py-2 bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-xs text-left font-semibold rounded-lg flex items-center justify-between"
                  >
                    <span>Simulasikan Layar Off Selama Sholat (15s)</span>
                    <EyeOff size={14} className="text-masjid-gold" />
                  </button>

                  <button
                    onClick={() => triggerSimulation('reset')}
                    className="w-full px-4 py-2 bg-red-950 border border-red-800 hover:bg-red-900 text-xs text-left font-semibold rounded-lg text-red-200 flex items-center justify-between"
                  >
                    <span>Reset Seluruh Simulasi ke Normal</span>
                    <RefreshCw size={14} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Kolom Kanan: Penyesuaian Waktu & Kalender (Offsets) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-masjid-yellow uppercase tracking-widest border-b border-white/10 pb-1">
                  2. Kalibrasi Waktu Sholat & Hijriah
                </h3>

                {/* Hijri Adjustment */}
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Koreksi Tanggal Hijriah</span>
                    <span className="text-[10px] text-white/50">Sesuaikan tanggal rilis hilal Kemenag</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSaveHijriOffset(hijriOffset - 1)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-bold text-xs"
                    >
                      -1 Hari
                    </button>
                    <span className="text-sm font-bold text-masjid-yellow w-12 text-center">
                      {hijriOffset >= 0 ? `+${hijriOffset}` : hijriOffset} Hari
                    </span>
                    <button 
                      onClick={() => handleSaveHijriOffset(hijriOffset + 1)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded font-bold text-xs"
                    >
                      +1 Hari
                    </button>
                  </div>
                </div>

                {/* Individual Prayer Adjustments */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block mb-1">
                    Koreksi Menit per Jadwal Sholat (Kemenag standard +2m):
                  </span>
                  
                  {Object.keys(prayerOffsets).map((name) => (
                    <div key={name} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
                      <span className="font-bold text-white/80">{name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSavePrayerOffset(name, prayerOffsets[name] - 1)}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold text-[10px]"
                        >
                          -1m
                        </button>
                        <span className="text-xs font-extrabold text-masjid-gold w-10 text-center">
                          {prayerOffsets[name] >= 0 ? `+${prayerOffsets[name]}` : prayerOffsets[name]}m
                        </span>
                        <button
                          onClick={() => handleSavePrayerOffset(name, prayerOffsets[name] + 1)}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded font-bold text-[10px]"
                        >
                          +1m
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="border-t border-masjid-gold/30 pt-4 flex justify-between items-center text-xs text-white/60">
              <span>
                Simulasi dan koreksi disimpan otomatis di penyimpanan STB/Browser.
              </span>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="px-5 py-2 bg-masjid-gold text-emerald-950 font-black rounded-xl hover:bg-masjid-yellow uppercase tracking-wide"
              >
                Selesai Mengatur
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
