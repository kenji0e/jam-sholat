export interface PrayerSchedule {
  name: string;
  time: Date;
  label: string; // Display label (e.g., "IMSAK", "SUBUH")
}

export interface InfoSlide {
  id: string;
  type: "hadits" | "keuangan" | "event" | "pengumuman";
  title: string;
  content: string;
  subContent?: string;
  highlight?: string;
}

export interface FinanceReport {
  saldoKas: number;
  pemasukan: number;
  pengeluaran: number;
  periode: string;
}

export interface MosqueEvent {
  title: string;
  time: string;
  speaker?: string;
  location: string;
  description: string;
}
