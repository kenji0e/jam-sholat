import React, { useState, useEffect, useRef } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import moment from 'moment';
import 'moment/dist/locale/id';

// Define Tipe Data
interface PrayerItem {
  name: string;
  time: Date;
}

interface InfoItem {
  title: string;
  content: string;
}

const App: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerItem[]>([]);
  const [infoIndex, setInfoIndex] = useState<number>(0);
  const [isIqomah, setIsIqomah] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isBlank, setIsBlank] = useState<boolean>(false);

  const coords = new Coordinates(-6.49, 106.79);
  moment.locale('id');

  const infoData: InfoItem[] = [
    { title: 'Hadits Hari Ini', content: '"Sholat berjamaah lebih utama 27 derajat dibanding sholat sendiri."' },
    { title: 'Laporan Keuangan', content: 'Saldo Kas: Rp. 4.500.000 | Pengeluaran: Rp. 1.200.000' },
    { title: 'Info Kegiatan', content: 'Kajian Rutin Malam Jumat setelah Isya' },
    { title: 'Pesan Jemaah', content: 'Mohon matikan HP saat berada di dalam Musholla.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNow(d);
      updatePrayers(d);
    }, 1000);

    const infoTimer = setInterval(() => {
      setInfoIndex((prev) => (prev + 1) % infoData.length);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(infoTimer);
    };
  }, []);

  const updatePrayers = (date: Date) => {
    const params = CalculationMethod.MuslimWorldLeague();
    const times = new PrayerTimes(coords, date, params);
    
    const imsak = new Date(times.fajr.getTime() - 10 * 60000);
    
    const list: PrayerItem[] = [
      { name: 'IMSAK', time: imsak },
      { name: 'SUBUH', time: times.fajr },
      { name: 'SYURUQ', time: times.sunrise },
      { name: 'ZHUHUR', time: times.dhuhr },
      { name: 'ASHAR', time: times.asr },
      { name: 'MAGHRIB', time: times.maghrib },
      { name: 'ISYA', time: times.isha },
    ];
    setPrayerTimes(list);

    list.forEach(p => {
      const diff = Math.floor((p.time.getTime() - date.getTime()) / 1000);
      if (diff === 10) playSimpleBeep();
      if (diff === 0 && !['IMSAK', 'SYURUQ'].includes(p.name)) startIqomah(p.name);
    });
  };

  const playSimpleBeep = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      const osc = context.createOscillator();
      osc.connect(context.destination);
      osc.start();
      setTimeout(() => osc.stop(), 500);
    } catch (e) { console.log("Audio blocked"); }
  };

  const startIqomah = (name: string) => {
    setIsIqomah(true);
    let sec = name === 'SUBUH' ? 8 * 60 : 7 * 60;
    const iqTimer = setInterval(() => {
      sec--;
      setCountdown(sec);
      if (sec <= 0) {
        clearInterval(iqTimer);
        setIsIqomah(false);
        setIsBlank(true);
        setTimeout(() => setIsBlank(false), 5 * 60000);
      }
    }, 1000);
  };

  if (isBlank) return <div style={{backgroundColor: 'black', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '30px'}}>LURUSKAN & RAPATKAN SHAF</div>;

  return (
    <div style={{
      backgroundColor: '#023020',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      overflow: 'hidden'
    }}>
      
      {/* BARIS 1 - HEADER */}
      <div style={{
        display: 'flex', 
        padding: '20px', 
        borderBottom: '4px solid #D4AF37',
        backgroundColor: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{width: '30%', textAlign: 'center'}}>
          <div style={{fontSize: '4.5rem', color: '#FFFF00', fontWeight: 'bold', lineHeight: '1'}}>
            {moment(now).format('HH:mm:ss')}
          </div>
          <div style={{fontSize: '1.2rem'}}>WIB</div>
        </div>

        <div style={{width: '40%', textAlign: 'center'}}>
          <h1 style={{fontSize: '2.2rem', color: '#D4AF37', margin: 0, fontWeight: 'bold'}}>MUSHOLLA NURUL HIDAYAH</h1>
          <p style={{margin: '5px 0 0 0', fontSize: '1.1rem'}}>Perumahan Bukit Waringin, Bojonggede 16923</p>
        </div>

        <div style={{width: '30%', textAlign: 'center'}}>
          <div style={{fontSize: '1.6rem', fontWeight: 'bold'}}>{moment(now).format('DD MMMM YYYY')}</div>
          <div style={{fontSize: '1.4rem', color: '#D4AF37', fontStyle: 'italic'}}>
            {/* Hijriah Statis atau bisa gunakan library tambahan */}
            1445 Hijriah
          </div>
        </div>
      </div>

      {/* BARIS 2 - CONTENT */}
      <div style={{display: 'flex', flex: 1, padding: '20px', overflow: 'hidden'}}>
        {/* QRIS */}
        <div style={{
          width: '30%', 
          backgroundColor: 'white', 
          borderRadius: '15px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          <b style={{color: 'black', marginBottom: '10px', fontSize: '1.2rem'}}>INFAQ DIGITAL (QRIS)</b>
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=NURUL_HIDAYAH_BOJONGGEDE" 
            style={{width: '80%', maxWidth: '250px'}} 
            alt="QRIS"
          />
        </div>

        {/* SLIDER INFO / IQOMAH */}
        <div style={{
          width: '70%', 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          borderRadius: '15px', 
          padding: '30px',
          position: 'relative',
          border: '2px solid #D4AF37',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {isIqomah ? (
            <div style={{textAlign: 'center', backgroundColor: '#8B0000', padding: '20px', borderRadius: '10px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <h1 style={{fontSize: '4rem', margin: 0, color: 'white'}}>IQOMAH</h1>
              <div style={{fontSize: '10rem', color: '#FFFF00', fontWeight: 'bold', lineHeight: '1'}}>
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </div>
              <p style={{fontSize: '2.5rem', color: 'white', margin: 0}}>Rapatkan & Luruskan Shaf</p>
            </div>
          ) : (
            <div>
              <h2 style={{color: '#D4AF37', borderBottom: '2px solid #D4AF37', paddingBottom: '10px', fontSize: '2rem', marginBottom: '20px'}}>
                {infoData[infoIndex].title}
              </h2>
              <p style={{fontSize: '2.8rem', lineHeight: '1.4', fontStyle: 'italic', color: 'white'}}>
                {infoData[infoIndex].content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BARIS 3 - JADWAL SHOLAT */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        padding: '15px 10px'
      }}>
        {prayerTimes.map((p, i) => {
          // Logika sederhana menentukan jadwal aktif berikutnya
          const isNext = moment(p.time).isAfter(now) && (i === 0 || moment(prayerTimes[i-1].time).isBefore(now));
          
          return (
            <div key={i} style={{
              padding: '15px 5px',
              borderRadius: '12px',
              textAlign: 'center',
              width: '13%',
              backgroundColor: isNext ? '#FFFF00' : 'transparent',
              color: isNext ? 'black' : 'white',
              border: isNext ? 'none' : '1px solid rgba(212, 175, 55, 0.4)',
              transition: 'all 0.5s'
            }}>
              <div style={{fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '5px'}}>{p.name}</div>
              <div style={{fontSize: '3rem', fontWeight: 'bold', lineHeight: '1'}}>
                {moment(p.time).format('HH:mm')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Rahasia Exit Fullscreen di pojok kanan bawah */}
      <div 
        onClick={() => {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }} 
        style={{position: 'fixed', bottom: 0, right: 0, width: '60px', height: '60px', cursor: 'pointer', zIndex: 999}}
      />
    </div>
  );
};

export default App;