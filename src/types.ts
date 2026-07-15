/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrayerItem {
  name: string;
  time: Date;
  label: string;
}

export interface InfoSlide {
  id: string;
  type: 'hadits' | 'keuangan' | 'event' | 'dzikir';
  title: string;
  content: string;
  additionalData?: any;
}

export interface FinanceReport {
  period: string;
  cashIn: number;
  cashOut: number;
  balance: number;
}

export interface MosqueEvent {
  name: string;
  date: string;
  time: string;
  speaker?: string;
  description: string;
}
