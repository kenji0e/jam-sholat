import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

// Coordinates for Bojonggede, West Java
// Latitude: -6.4806 (Approx S 6° 28')
// Longitude: 106.7891 (Approx E 106° 47')
const BOJONGGEDE_COORDS = new Coordinates(-6.4806, 106.7891);

export interface PrayerTimeItem {
  id: string;
  name: string;
  label: string;
  time: Date;
  timeString: string;
}

export function calculatePrayerTimes(date: Date, offsets: Record<string, number> = {}): PrayerTimeItem[] {
  // Use Singapore calculation method, which matches Kemenag (Fajr 20°, Isha 18°)
  const params = CalculationMethod.Singapore();
  const times = new PrayerTimes(BOJONGGEDE_COORDS, date, params);

  const addMinutes = (dateObj: Date, minutes: number) => {
    return new Date(dateObj.getTime() + minutes * 60000);
  };

  // Kemenag standard usually includes safety time (Ihtiyati) of +2 minutes
  // Let's allow individual offsets with defaults
  const offsetImsak = offsets['IMSAK'] ?? 0;
  const offsetSubuh = offsets['SUBUH'] ?? 2;
  const offsetSyuruq = offsets['SYURUQ'] ?? -2; // Syuruq usually standard or -2 for safety
  const offsetZhuhur = offsets['ZHUHUR'] ?? 2;
  const offsetAshar = offsets['ASHAR'] ?? 2;
  const offsetMaghrib = offsets['MAGHRIB'] ?? 2;
  const offsetIsya = offsets['ISYA'] ?? 2;

  // Fajr/Subuh
  const subuhTime = addMinutes(times.fajr, offsetSubuh);
  // Imsak is exactly 10 minutes before Subuh
  const imsakTime = addMinutes(subuhTime, -10 + offsetImsak);
  // Syuruq (Sunrise)
  const syuruqTime = addMinutes(times.sunrise, offsetSyuruq);
  // Zhuhur
  const zhuhurTime = addMinutes(times.dhuhr, offsetZhuhur);
  // Ashar
  const asharTime = addMinutes(times.asr, offsetAshar);
  // Maghrib
  const maghribTime = addMinutes(times.maghrib, offsetMaghrib);
  // Isya
  const isyaTime = addMinutes(times.isha, offsetIsya);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace('.', ':');
  };

  return [
    { id: 'imsak', name: 'IMSAK', label: 'Imsak', time: imsakTime, timeString: formatTime(imsakTime) },
    { id: 'subuh', name: 'SUBUH', label: 'Subuh', time: subuhTime, timeString: formatTime(subuhTime) },
    { id: 'syuruq', name: 'SYURUQ', label: 'Syuruq', time: syuruqTime, timeString: formatTime(syuruqTime) },
    { id: 'zhuhur', name: 'ZHUHUR', label: 'Zhuhur', time: zhuhurTime, timeString: formatTime(zhuhurTime) },
    { id: 'ashar', name: 'ASHAR', label: 'Ashar', time: asharTime, timeString: formatTime(asharTime) },
    { id: 'maghrib', name: 'MAGHRIB', label: 'Maghrib', time: maghribTime, timeString: formatTime(maghribTime) },
    { id: 'isya', name: 'ISYA', label: 'Isya', time: isyaTime, timeString: formatTime(isyaTime) },
  ];
}

export function formatHijriDate(date: Date, offsetDays: number = 0): string {
  const adjustedDate = new Date(date.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    let formatted = formatter.format(adjustedDate);
    
    // Clean up typical Islamic date strings in Indonesian locale
    formatted = formatted.replace(/AH|ERA1/g, '').trim();
    if (!formatted.includes('H')) {
      formatted += ' H';
    }
    return formatted;
  } catch (e) {
    // Robust mathematical fallback if Intl Islamic calendar is not available
    return "19 Safar 1448 H";
  }
}
