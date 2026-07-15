/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { PrayerItem } from '../types';

// Koordinat Bojonggede, Bogor, Jawa Barat
const LATITUDE = -6.49;
const LONGITUDE = 106.79;

export function getPrayerTimesForDate(date: Date): PrayerItem[] {
  const coords = new Coordinates(LATITUDE, LONGITUDE);
  
  // Menggunakan metode Kemenag / MABIMS (Fajr 20, Isha 18)
  const params = CalculationMethod.MuslimWorldLeague();
  params.fajrAngle = 20.0;
  params.ishaAngle = 18.0;
  
  const times = new PrayerTimes(coords, date, params);
  
  // Imsak adalah 10 menit sebelum Subuh (Fajr)
  const imsakTime = new Date(times.fajr.getTime() - 10 * 60 * 1000);
  
  return [
    { name: 'IMSAK', time: imsakTime, label: 'Imsak' },
    { name: 'SUBUH', time: times.fajr, label: 'Subuh' },
    { name: 'SYURUQ', time: times.sunrise, label: 'Syuruq' },
    { name: 'ZHUHUR', time: times.dhuhr, label: 'Zhuhur' },
    { name: 'ASHAR', time: times.asr, label: 'Ashar' },
    { name: 'MAGHRIB', time: times.maghrib, label: 'Maghrib' },
    { name: 'ISYA', time: times.isha, label: 'Isya' },
  ];
}

const HIJRI_MONTHS_ID = [
  "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

/**
 * Mengonversi tanggal Masehi ke Hijriah menggunakan algoritma astronomis / tabular yang disesuaikan
 * @param date Tanggal Masehi
 * @param offset Koreksi hari (+1, 0, -1) untuk penyesuaian rukyatul hilal lokal
 */
export function getHijriDateString(date: Date, offset: number = 0): string {
  try {
    // Sebagai metode utama, gunakan Intl.DateTimeFormat jika tersedia
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    if (offset === 0) {
      return formatter.format(date);
    }
    
    // Jika ada offset, sesuaikan tanggal sebelum diformat
    const adjustedDate = new Date(date.getTime() + offset * 24 * 60 * 60 * 1000);
    return formatter.format(adjustedDate);
  } catch (e) {
    // Fallback perhitungan manual jika Intl tidak didukung
    const adjustedDate = new Date(date.getTime() + offset * 24 * 60 * 60 * 1000);
    const jd = Math.floor(adjustedDate.getTime() / 86400000) + 2440587.5;
    const k = Math.floor(jd - 1948086.35);
    const hYear = Math.floor((k - 1) / 354.367);
    const hMonth = Math.floor((k - 1.5 - Math.floor(hYear * 354.367)) / 29.5) + 1;
    const hDay = Math.ceil(k - 1.5 - Math.floor(hYear * 354.367) - Math.floor((hMonth - 1) * 29.5));
    
    const monthName = HIJRI_MONTHS_ID[Math.max(0, Math.min(11, hMonth - 1))];
    return `${hDay} ${monthName} ${hYear} H`;
  }
}
