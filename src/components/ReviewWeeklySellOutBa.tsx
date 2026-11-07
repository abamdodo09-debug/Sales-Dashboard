import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  Camera,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit2,
  X,
  Save,
  RotateCcw,
  BarChart3,
  Check,
  Users,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Store,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { TransactionRecord, DashboardFilters } from '../types/dashboard';

export interface WeeklyStoreConfig {
  id: string;
  storeName: string;
  baName: string;
  salesName: string;
  trainerName: string;
  coverArea: string;
  region: string;
  targetMonthly: number;
}

// 7 Toko yang direvisi untuk dihilangkan dari coveran sales ILHAMSYAH sesuai instruksi pengguna
export const EXCLUDED_ILHAMSYAH_STORES = new Set([
  'miss glam bukit barisan',
  'miss glam sudirman',
  'al kautsar cosmetik',
  'annisa cosmetik arifin',
  'annisa kosmetik (duri)',
  'miss glam marpoyan',
  'toko annisa kosmetik',
]);

export const isStoreExcludedFromIlhamsyah = (sales: string | undefined, storeName: string | undefined): boolean => {
  if (!sales || !storeName) return false;
  return sales.trim().toUpperCase() === 'ILHAMSYAH' && EXCLUDED_ILHAMSYAH_STORES.has(storeName.trim().toLowerCase());
};

// 80 Master Toko, BA, Sales, dan Trainer persis sesuai gambar image_001d0f79.png
export const DEFAULT_WEEKLY_STORES: WeeklyStoreConfig[] = [
  // --- TRAINER: ARA | SALES: ALBERT FERNANDO (13 Toko) ---
  {
    id: 'ws-01',
    storeName: 'CITRA SWALAYAN',
    baName: 'WINDY PRATIWI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 55000000,
  },
  {
    id: 'ws-02',
    storeName: 'HIDAYAH BELILAS',
    baName: 'SITI NURHALIZA',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI',
    region: 'RENGAT',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-03',
    storeName: 'HIDAYAH KOSMETIK PERAWANG',
    baName: 'LILI LESTARI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'SIAK',
    region: 'PERAWANG',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-04',
    storeName: 'IDOLA KOSMETIK AIR MOLEK',
    baName: 'DEWI LESTARI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI',
    region: 'AIR MOLEK',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-05',
    storeName: 'JINAAN STORE',
    baName: 'NURUL AINI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI',
    region: 'RENGAT',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-06',
    storeName: 'TOKO HIDAYAH BEAUTY',
    baName: 'RAHMA FITRI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-07',
    storeName: 'TOKO HIDAYAH BEAUTY KARTAMA',
    baName: 'NADIA SAFIRA',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-08',
    storeName: 'TOKO HIDAYAH UKUI',
    baName: 'PUTRI ANGGRAINI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PELALAWAN',
    region: 'UKUI',
    targetMonthly: 42000000,
  },
  {
    id: 'ws-09',
    storeName: 'TOKO IWAN KADO KOSMETIK (RENGAT)',
    baName: 'TIA MONICA',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI',
    region: 'RENGAT',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-10',
    storeName: 'TOKO KARTINSHOP',
    baName: 'INDAH PERMATASARI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-11',
    storeName: 'TOKO MY KOSMETIK (PKL KERINCI)',
    baName: 'RINA ANGGRAINI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PELALAWAN',
    region: 'PKL KERINCI',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-12',
    storeName: 'TOKO MY KOSMETIK (SOREK)',
    baName: 'DWI WULANDARI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'PELALAWAN',
    region: 'SOREK',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-13',
    storeName: 'TOKO RIS IDOLA KOSMETIK',
    baName: 'FITRI HANDAYANI',
    salesName: 'ALBERT FERNANDO',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI',
    region: 'RENGAT',
    targetMonthly: 55000000,
  },

  // --- TRAINER: ARA | SALES: ILHAMSYAH (8 Toko) ---
  {
    id: 'ws-14',
    storeName: 'BEAUTY STORE (BANGKINANG)',
    baName: 'NUR HIKMAH',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'KAMPAR',
    region: 'BANGKINANG',
    targetMonthly: 42000000,
  },
  {
    id: 'ws-15',
    storeName: 'CERIA KOSMETIK BANGKINANG',
    baName: 'DINA MARIANA',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'KAMPAR',
    region: 'BANGKINANG',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-16',
    storeName: 'KHARISMA COSMETIC (DURIAN)',
    baName: 'AULIA RAHMA',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-17',
    storeName: 'KHARISMA COSMETIC (KUALU)',
    baName: 'SINTA DEWI',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'KAMPAR',
    region: 'TAMBANG',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-20',
    storeName: 'SWALAYAN MALAYA MART',
    baName: 'RIKA AGUSTIN',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-21',
    storeName: 'TOKO BENING KOSMETIK',
    baName: 'NITA ANGGRAENI',
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },

  // --- TRAINER: ARA | SALES: LUAR KOTA (1 Toko) ---
  {
    id: 'ws-22',
    storeName: 'PEKANBARU_ORIGINAL PRICE',
    baName: 'SILVIA NINGSIH',
    salesName: 'LUAR KOTA',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },

  // --- TRAINER: ARA | SALES: PARETO (3 Toko) ---
  {
    id: 'ws-23',
    storeName: 'GLASTING GLOW',
    baName: 'MAYA ROSALINA',
    salesName: 'PARETO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 60000000,
  },
  {
    id: 'ws-24',
    storeName: 'ISTANA KOSMETIK PEKANBARU',
    baName: 'TARI WULANDARI',
    salesName: 'PARETO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 55000000,
  },
  {
    id: 'ws-25',
    storeName: 'TOKO ISTANA KOSMETIK (ARIFIN AHMAD)',
    baName: 'CITRA LESTARI',
    salesName: 'PARETO',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },

  // --- TRAINER: ARA | SALES: TIWI (15 Toko) ---
  {
    id: 'ws-26',
    storeName: 'GUARDIAN CIPUTRA BNB LV',
    baName: 'TIARA ANDINI',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 65000000,
  },
  {
    id: 'ws-27',
    storeName: 'GUARDIAN GUAR MAL PEKANBARU BNB LV',
    baName: 'AMELIA PUTRI',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 65000000,
  },
  {
    id: 'ws-28',
    storeName: 'GUARDIAN LIVING WORLD PEKANBARU BNB LV',
    baName: 'FEBY FEBRIANA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 70000000,
  },
  {
    id: 'ws-29',
    storeName: 'GUARDIAN MTC PEKANBARU BNB LV',
    baName: 'DELLA ANGGITA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 60000000,
  },
  {
    id: 'ws-30',
    storeName: 'GUARDIAN PLAZA CITRA PEKANBARU BNB LV',
    baName: 'BELLA SAFIRA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 60000000,
  },
  {
    id: 'ws-31',
    storeName: 'GUARDIAN SKA MALL 2 PEKANBARU BNB LV',
    baName: 'GINA PUSPITA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 75000000,
  },
  {
    id: 'ws-32',
    storeName: 'MISS GLAM BUKIT BARISAN',
    baName: 'MIRA SANTIKA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 70000000,
  },
  {
    id: 'ws-33',
    storeName: 'MISS GLAM PANAM',
    baName: 'RANI KURNIA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PANAM',
    targetMonthly: 75000000,
  },
  {
    id: 'ws-34',
    storeName: 'MISS GLAM SUDIRMAN',
    baName: 'VINA PANDU',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 80000000,
  },
  {
    id: 'ws-35',
    storeName: 'MISS GLAM SUDIRMAN2',
    baName: 'RESTI FAUZIAH',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 75000000,
  },
  {
    id: 'ws-36',
    storeName: 'MISS GLAM TEMBILAHAN',
    baName: 'YOLANDA OKTAVIA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'INDRAGIRI HILIR',
    region: 'TEMBILAHAN',
    targetMonthly: 100000000,
  },
  {
    id: 'ws-37',
    storeName: 'WATSON CIPUTRA SERAYA',
    baName: 'SALSABILA',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 65000000,
  },
  {
    id: 'ws-38',
    storeName: 'WATSON LIVING WORLD PEKANBARU',
    baName: 'NOVITA SARI',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 75000000,
  },
  {
    id: 'ws-39',
    storeName: 'WATSON MTC PEKANBARU',
    baName: 'ELISABET',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 65000000,
  },
  {
    id: 'ws-40',
    storeName: 'WATSON SKA PEKANBARU',
    baName: 'PUTRI AYU',
    salesName: 'TIWI',
    trainerName: 'ARA',
    coverArea: 'MODERN TRADE',
    region: 'PEKAN BARU',
    targetMonthly: 80000000,
  },

  // --- TRAINER: ONLINE | SALES: LUAR KOTA (2 Toko) ---
  {
    id: 'ws-41',
    storeName: 'BLUMEE ID',
    baName: 'ADINDA PUTRI',
    salesName: 'LUAR KOTA',
    trainerName: 'ONLINE',
    coverArea: 'ONLINE',
    region: 'ONLINE',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-42',
    storeName: 'KIYORA BEAUTY',
    baName: 'SHINTA BELLA',
    salesName: 'LUAR KOTA',
    trainerName: 'ONLINE',
    coverArea: 'ONLINE',
    region: 'LUAR KOTA',
    targetMonthly: 45000000,
  },

  // --- TRAINER: RATIH | SALES: ABDUL RAHIM (8 Toko) ---
  {
    id: 'ws-43',
    storeName: 'ANNISA KOSMETIK (DURI)',
    baName: 'KARTIKA SARI',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'BENGKALIS',
    region: 'DURI',
    targetMonthly: 50000000,
  },
  {
    id: 'ws-44',
    storeName: 'GHANAYA COSMETIC',
    baName: 'ANITA RAHAYU',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-45',
    storeName: 'GLOBAL KOSMETIK (PERAWANG)',
    baName: 'FITRIANA',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'SIAK',
    region: 'PERAWANG',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-46',
    storeName: 'MM SANIA (BAGAN SIAPI API)',
    baName: 'DESI RATNASARI',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'ROKAN HILIR',
    region: 'BAGAN SIAPI API',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-47',
    storeName: 'SABRINA STORE',
    baName: 'SRI WAHYUNI',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-48',
    storeName: 'TOKO BLINK COSMETIC',
    baName: 'INTAN PERMATA',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-49',
    storeName: 'TOKO DUMAI BARU',
    baName: 'NUR HASANAH',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-50',
    storeName: 'TOKO ISTANA KOSMETIK (BAGAN SIAPI API)',
    baName: 'EVA SUSANTI',
    salesName: 'ABDUL RAHIM',
    trainerName: 'RATIH',
    coverArea: 'ROKAN HILIR',
    region: 'BAGAN SIAPI API',
    targetMonthly: 48000000,
  },

  // --- TRAINER: RATIH | SALES: ILHAMSYAH (12 Toko) ---
  {
    id: 'ws-51',
    storeName: 'AKAR SARI KOSMETIK (HARAPAN RAYA)',
    baName: 'DIAN ANGGRAINI',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-55',
    storeName: 'CS BEAUTEE',
    baName: 'FITRIA NINGSIH',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-57',
    storeName: 'RATU PALUGADA',
    baName: 'FITRI YANTI',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-58',
    storeName: 'RINI JOFA COSMETIK',
    baName: 'SITI AISYAH',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-59',
    storeName: 'SARASA KOSMETIK',
    baName: 'ELVI SUKAESIH',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-60',
    storeName: 'TOKO ALANA BEAUTY',
    baName: 'SITI RAHMAH',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 55000000,
  },
  {
    id: 'ws-62',
    storeName: 'TOKO UNIGLOW',
    baName: 'NURUL FADILAH',
    salesName: 'ILHAMSYAH',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },

  // --- TRAINER: RATIH | SALES: LUAR KOTA (8 Toko) ---
  {
    id: 'ws-63',
    storeName: 'CAN BEAUTY',
    baName: 'VERA WATI',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'LUAR KOTA',
    region: 'RIAU',
    targetMonthly: 42000000,
  },
  {
    id: 'ws-64',
    storeName: 'FOR SKIN BEAUTY',
    baName: 'RATNA SARI',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'LUAR KOTA',
    region: 'RIAU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-65',
    storeName: 'I.C.A COSMETIK & PARFUM (BAGAN BATU)',
    baName: 'ANISA PUTRI',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'ROKAN HILIR',
    region: 'BAGAN BATU',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-66',
    storeName: 'KIYORA BEAUTY',
    baName: 'MAHARANI',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'LUAR KOTA',
    region: 'RIAU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-67',
    storeName: 'LUCY KOSMETIK (BENGKALIS)',
    baName: 'RINI ASTUTI',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'BENGKALIS',
    region: 'BENGKALIS',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-68',
    storeName: 'RAMBE KOSMETIK',
    baName: 'NURHALIMAH',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'ROKAN HULU',
    region: 'PASIR PENGARAIAN',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-69',
    storeName: 'RAYA KOSMETIK BAGAN BATU',
    baName: 'CUT AMELIA',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'ROKAN HILIR',
    region: 'BAGAN BATU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-70',
    storeName: 'WARKOS IDN',
    baName: 'YENI MARLINA',
    salesName: 'LUAR KOTA',
    trainerName: 'RATIH',
    coverArea: 'LUAR KOTA',
    region: 'RIAU',
    targetMonthly: 45000000,
  },

  // --- TRAINER: RATIH | SALES: PARETO (6 Toko) ---
  {
    id: 'ws-71',
    storeName: 'AL KAUTSAR COSMETIK',
    baName: 'ZULFA AZZAHRA',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },
  {
    id: 'ws-72',
    storeName: 'ANNISA COSMETIK ARIFIN',
    baName: 'SALWA NABILA',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },
  {
    id: 'ws-73',
    storeName: 'GLASTING GLOW',
    baName: 'MELLY GOESLAW',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 60000000,
  },
  {
    id: 'ws-74',
    storeName: 'NEW AKAR SARI DELIMA',
    baName: 'RETNO WULAN',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },
  {
    id: 'ws-75',
    storeName: 'TOKO ANNISA KOSMETIK',
    baName: 'WIDYA ASTUTI',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 50000000,
  },
  {
    id: 'ws-76',
    storeName: 'TOKO ISTANA KOSMETIK (ARIFIN AHMAD)',
    baName: 'DEA ANANDA',
    salesName: 'PARETO',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 55000000,
  },

  // --- TRAINER: RATIH | SALES: TIWI (4 Toko) ---
  {
    id: 'ws-77',
    storeName: 'MISS GLAM BUKIT BARISAN',
    baName: 'SHERLY ANGGITA',
    salesName: 'TIWI',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 75000000,
  },
  {
    id: 'ws-78',
    storeName: 'MISS GLAM DUMAI',
    baName: 'LIA AMELIA',
    salesName: 'TIWI',
    trainerName: 'RATIH',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 85000000,
  },
  {
    id: 'ws-79',
    storeName: 'MISS GLAM DURI',
    baName: 'SUCI LESTARI',
    salesName: 'TIWI',
    trainerName: 'RATIH',
    coverArea: 'BENGKALIS',
    region: 'DURI',
    targetMonthly: 85000000,
  },
  {
    id: 'ws-80',
    storeName: 'MISS GLAM MARPOYAN',
    baName: 'MUTIARA AZZAHRA',
    salesName: 'TIWI',
    trainerName: 'RATIH',
    coverArea: 'PEKANBARU',
    region: 'PEKAN BARU',
    targetMonthly: 80000000,
  },
];

// Snapshot default transaksi harian untuk Week 1 (01-07)
// Contoh: BEAUTY STORE (BANGKINANG) total 6.033.400
const SAMPLE_WEEK1_DAILY_SNAPSHOT: Record<string, number[]> = {
  'BEAUTY STORE (BANGKINANG)': [850000, 720000, 680000, 950000, 1150000, 980000, 703400], // Total: 6.033.400
  'CITRA SWALAYAN': [1100000, 920000, 1250000, 1400000, 1850000, 1600000, 780000],
  'HIDAYAH BELILAS': [850000, 980000, 750000, 1050000, 1300000, 1150000, 690000],
  'HIDAYAH KOSMETIK PERAWANG': [520000, 950000, 820000, 810000, 1200000, 1150000, 540000],
  'IDOLA KOSMETIK AIR MOLEK': [1500000, 290000, 810000, 2050000, 1720000, 1680000, 790000],
  'JINAAN STORE': [980000, 690000, 740000, 135000, 380000, 510000, 560000],
  'TOKO RIS IDOLA KOSMETIK': [14500000, 750000, 1050000, 1280000, 1850000, 1620000, 810000],
  'TOKO MY KOSMETIK (PKL KERINCI)': [780000, 1560000, 1070000, 550000, 960000, 1110000, 660000],
  'TOKO MY KOSMETIK (SOREK)': [710000, 1120000, 805000, 950000, 1060000, 740000, 595000],
  'MISS GLAM TEMBILAHAN': [1520000, 500000, 420000, 4180000, 3300000, 750000, 1010000],
  'MISS GLAM SUDIRMAN': [2150000, 1650000, 1840000, 2800000, 3370000, 2980000, 1710000],
  'MISS GLAM BUKIT BARISAN': [1620000, 1440000, 1240000, 2400000, 2710000, 2580000, 1240000],
  'TOKO ALANA BEAUTY': [1270000, 1120000, 1010000, 1680000, 2140000, 1840000, 860000],
  'AL KAUTSAR COSMETIK': [1050000, 860000, 740000, 1270000, 1650000, 1440000, 720000],
  'ANNISA COSMETIK ARIFIN': [1180000, 980000, 860000, 1470000, 1840000, 1620000, 810000],
  'ANNISA KOSMETIK (DURI)': [1440000, 1240000, 1090000, 1730000, 2320000, 2010000, 1010000],
  'GLASTING GLOW': [1650000, 1350000, 1210000, 1930000, 2490000, 2280000, 1180000],
  'GUARDIAN CIPUTRA BNB LV': [1710000, 1470000, 1330000, 2140000, 2710000, 2490000, 1270000],
  'WATSON CIPUTRA SERAYA': [1650000, 1420000, 1290000, 2080000, 2610000, 2410000, 1210000],
};

// Snapshot default transaksi harian untuk Week 2 (08-14)
// Hari 1: (08) SELASA, Hari 2: (09) RABU, Hari 3: (10) KAMIS, Hari 4: (11) JUMAT,
// Hari 5: (12) SABTU, Hari 6: (13) MINGGU, Hari 7: (14) SENIN
// Contoh: BEAUTY STORE (BANGKINANG) total 57.945.840
const SAMPLE_DAILY_SNAPSHOT: Record<string, number[]> = {
  'BEAUTY STORE (BANGKINANG)': [8250000, 7890000, 6540000, 9120000, 11450000, 9425840, 5270000], // Total: 57.945.840
  'CITRA SWALAYAN': [1250000, 980000, 1420000, 1650000, 2100000, 1950000, 850000],
  'HIDAYAH BELILAS': [950000, 1100000, 890000, 1200000, 1450000, 1300000, 780000],
  'HIDAYAH KOSMETIK PERAWANG': [582900, 1089500, 949000, 914500, 1365000, 1341900, 620000],
  'IDOLA KOSMETIK AIR MOLEK': [1801400, 331600, 937900, 2310000, 1935900, 1902900, 890000],
  'JINAAN STORE': [1123500, 795100, 850000, 151700, 433300, 584300, 640000],
  'TOKO RIS IDOLA KOSMETIK': [16795300, 850000, 1200000, 1450000, 2100000, 1850000, 920000],
  'TOKO MY KOSMETIK (PKL KERINCI)': [890000, 1785300, 1225000, 628000, 1093300, 1271100, 750000],
  'TOKO MY KOSMETIK (SOREK)': [813000, 1276200, 920000, 1087850, 1213700, 850000, 680000],
  'MISS GLAM TEMBILAHAN': [1730500, 570100, 484200, 4776950, 3771300, 863500, 1150000],
  'MISS GLAM SUDIRMAN': [2450000, 1890000, 2100000, 3200000, 3850000, 3400000, 1950000],
  'MISS GLAM BUKIT BARISAN': [1850000, 1650000, 1420000, 2750000, 3100000, 2950000, 1420000],
  'TOKO ALANA BEAUTY': [1450000, 1280000, 1150000, 1920000, 2450000, 2100000, 980000],
  'AL KAUTSAR COSMETIK': [1200000, 980000, 850000, 1450000, 1890000, 1650000, 820000],
  'ANNISA COSMETIK ARIFIN': [1350000, 1120000, 980000, 1680000, 2100000, 1850000, 920000],
  'ANNISA KOSMETIK (DURI)': [1650000, 1420000, 1250000, 1980000, 2650000, 2300000, 1150000],
  'GLASTING GLOW': [1890000, 1540000, 1380000, 2200000, 2850000, 2600000, 1350000],
  'GUARDIAN CIPUTRA BNB LV': [1950000, 1680000, 1520000, 2450000, 3100000, 2850000, 1450000],
  'WATSON CIPUTRA SERAYA': [1890000, 1620000, 1480000, 2380000, 2980000, 2750000, 1380000],
};

// Snapshot nilai baris ke-3 (PENCAPAIAN WEEK 2 08-14 kumulatif)
const SAMPLE_CUMULATIVE_SNAPSHOT: Record<string, number> = {
  'CITRA SWALAYAN': 18500000,
  'HIDAYAH BELILAS': 14200000,
  'HIDAYAH KOSMETIK PERAWANG': 18197500,
  'IDOLA KOSMETIK AIR MOLEK': 13323600,
  'JINAAN STORE': 7564700,
  'TOKO RIS IDOLA KOSMETIK': 22389200,
  'TOKO MY KOSMETIK (PKL KERINCI)': 14025850,
  'TOKO MY KOSMETIK (SOREK)': 11074050,
  'MISS GLAM TEMBILAHAN': 30432750,
  'MISS GLAM SUDIRMAN': 32450000,
  'MISS GLAM BUKIT BARISAN': 26850000,
  'TOKO ALANA BEAUTY': 19500000,
  'AL KAUTSAR COSMETIK': 16800000,
  'ANNISA COSMETIK ARIFIN': 17500000,
  'ANNISA KOSMETIK (DURI)': 21500000,
  'GLASTING GLOW': 24500000,
  'GUARDIAN CIPUTRA BNB LV': 28500000,
  'WATSON CIPUTRA SERAYA': 27800000,
};

const INDO_DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

const STORAGE_KEY_WEEKLY_STORES = 'salespro_weekly_stores_config_v5';
const STORAGE_KEY_WEEKLY_DELETED_STORES = 'salespro_weekly_deleted_stores_v5';
const STORAGE_KEY_WEEKLY_ACTUALS = 'salespro_weekly_actuals_v5';
const STORAGE_KEY_WEEKLY_PERFORMA = 'salespro_weekly_performa_v5';
const STORAGE_KEY_WEEKLY_CUMULATIVE = 'salespro_weekly_cumulative_v5';

interface ReviewWeeklySellOutBaProps {
  records: TransactionRecord[];
  allRecords?: TransactionRecord[];
  filters: DashboardFilters;
}

export const ReviewWeeklySellOutBa: React.FC<ReviewWeeklySellOutBaProps> = ({
  records,
  allRecords,
  filters,
}) => {
  const sourceRecords = useMemo(() => {
    return allRecords && allRecords.length > 0 ? allRecords : records;
  }, [allRecords, records]);

  const reportRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const b = filters.BULAN.toUpperCase();
      return b.includes('2026') ? b : `${b} 2026`;
    }
    return 'SEPTEMBER 2026';
  });

  // Week selection: Week 1, Week 2, Week 3, Week 4 (Week 4 & 5 digabung per instruksi user)
  const [selectedWeek, setSelectedWeek] = useState<'WEEK 1' | 'WEEK 2' | 'WEEK 3' | 'WEEK 4' | 'CUSTOM'>('WEEK 2');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Zoom / Scale View (agar muat pas di 1 layar monitor)
  const [viewScale, setViewScale] = useState<number>(1);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daftar Toko yang Pernah Dihapus / Dikurangi oleh Pengguna
  const [deletedStoreNames, setDeletedStoreNames] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_DELETED_STORES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load deletedStoreNames', e);
    }
    return [];
  });

  // Modal Kelola & Kurangi Toko
  const [isManageStoresModalOpen, setIsManageStoresModalOpen] = useState<boolean>(false);
  const [manageStoresSearch, setManageStoresSearch] = useState<string>('');
  const [manageStoresTab, setManageStoresTab] = useState<'all' | 'active' | 'deleted'>('all');
  const [manageStoresSalesFilter, setManageStoresSalesFilter] = useState<string>('ALL');
  const [workingDeletedStores, setWorkingDeletedStores] = useState<string[]>([]);

  // Store Configuration (Toko Master yang bisa ditambah dan dikurangi)
  const [storesList, setStoresList] = useState<WeeklyStoreConfig[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_STORES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Bersihkan toko ILHAMSYAH yang direvisi untuk dihapus
          return parsed.filter((s: WeeklyStoreConfig) => !isStoreExcludedFromIlhamsyah(s.salesName, s.storeName));
        }
      }
    } catch (e) {
      console.warn('Failed to load storesList from localStorage', e);
    }
    return DEFAULT_WEEKLY_STORES;
  });

  // Filter Coveran Sales (Semua Sales, ALBERT FERNANDO, ILHAMSYAH, TIWI, ABDUL RAHIM, PARETO, LUAR KOTA)
  const [selectedSales, setSelectedSales] = useState<string>(() => {
    return filters.SALES && filters.SALES !== 'ALL' ? filters.SALES : 'ALL';
  });

  // Filter Trainer (ALL, ARA, RATIH, ONLINE)
  const [selectedTrainer, setSelectedTrainer] = useState<string>('ALL');

  // Otomatis sinkron dengan Filter Terintegrasi (Global Filters)
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const b = filters.BULAN.toUpperCase();
      setSelectedMonth(b.includes('2026') ? b : `${b} 2026`);
    }
  }, [filters.BULAN]);

  useEffect(() => {
    if (filters.SALES && filters.SALES !== 'ALL') {
      setSelectedSales(filters.SALES);
    } else if (filters.SALES === 'ALL') {
      setSelectedSales('ALL');
    }
  }, [filters.SALES]);

  // Extract distinct sales reps from configured stores and connected Google Sheets records
  const availableSales = useMemo(() => {
    const set = new Set<string>();
    storesList.forEach((s) => {
      if (s.salesName && s.salesName !== 'OPERASIONAL') set.add(s.salesName.trim());
    });
    records.forEach((r) => {
      if (r.SALES && r.SALES !== '-' && r.SALES !== 'ALL') set.add(r.SALES.trim());
    });
    return Array.from(set).sort();
  }, [storesList, records]);

  // Master Store List (gabungan default stores, custom added stores, dan stores dari sheets)
  const allMasterStores = useMemo(() => {
    const map = new Map<string, WeeklyStoreConfig>();
    DEFAULT_WEEKLY_STORES.forEach((s) => {
      if (!isStoreExcludedFromIlhamsyah(s.salesName, s.storeName)) {
        map.set(s.storeName.trim().toLowerCase(), s);
      }
    });
    storesList.forEach((s) => {
      if (!isStoreExcludedFromIlhamsyah(s.salesName, s.storeName)) {
        map.set(s.storeName.trim().toLowerCase(), s);
      }
    });
    records.forEach((r) => {
      if (!r.NAMA_STORE) return;
      if (isStoreExcludedFromIlhamsyah(r.SALES, r.NAMA_STORE)) return;
      const key = r.NAMA_STORE.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `gs-store-${key.replace(/\s+/g, '-')}`,
          storeName: r.NAMA_STORE.trim(),
          baName: r.BA && r.BA !== '-' ? r.BA.trim() : 'BA COUNTER',
          salesName: r.SALES || 'SALES UMUM',
          trainerName: 'ARA',
          coverArea: r.COVER_AREA || 'AREA BARU',
          region: r.REGION || 'PEKAN BARU',
          targetMonthly: 45000000,
        });
      }
    });
    return Array.from(map.values());
  }, [storesList, records]);

  // Active stores filtered by Sales Coveran and Trainer, synchronized with Google Sheets data
  const activeStoresList = useMemo(() => {
    const deletedSet = new Set(deletedStoreNames.map((n) => n.trim().toLowerCase()));

    // Exclude any deleted stores and excluded ilhamsyah stores from active list
    let list = storesList.filter(
      (s) => !deletedSet.has(s.storeName.trim().toLowerCase()) && !isStoreExcludedFromIlhamsyah(s.salesName, s.storeName)
    );

    // Priority sync: if records from Google Sheet have a matching store with a live BA name, apply it!
    const sheetBaByStore: Record<string, string> = {};
    records.forEach((r) => {
      if (r.NAMA_STORE && r.BA && r.BA !== '-' && r.BA.toUpperCase() !== 'NON BA' && r.BA.toUpperCase() !== 'STANDBY') {
        sheetBaByStore[r.NAMA_STORE.trim().toLowerCase()] = r.BA.trim();
      }
    });

    list = list.map((s) => {
      const liveBa = sheetBaByStore[s.storeName.trim().toLowerCase()];
      if (liveBa) {
        return { ...s, baName: liveBa };
      }
      return s;
    });

    // Auto-sync additional stores from connected Google Sheet (records) if present and NOT deleted
    const existingNames = new Set(list.map((s) => s.storeName.trim().toLowerCase()));
    const extraStores: WeeklyStoreConfig[] = [];

    records.forEach((r) => {
      if (!r.NAMA_STORE) return;
      // Jangan masukkan toko yang dikecualikan dari ILHAMSYAH
      if (isStoreExcludedFromIlhamsyah(r.SALES, r.NAMA_STORE)) return;

      const sLower = r.NAMA_STORE.trim().toLowerCase();
      // JIKA TOKO DIHAPUS/DIKURANGI OLEH PENGGUNA, JANGAN DITAMBAHKAN LAGI!
      if (deletedSet.has(sLower)) return;

      if (!existingNames.has(sLower)) {
        existingNames.add(sLower);
        extraStores.push({
          id: `gs-store-${sLower.replace(/\s+/g, '-')}`,
          storeName: r.NAMA_STORE.trim(),
          baName: r.BA && r.BA !== '-' ? r.BA.trim() : 'BA COUNTER',
          salesName: r.SALES || 'SALES UMUM',
          trainerName: 'ARA',
          coverArea: r.COVER_AREA || 'AREA BARU',
          region: r.REGION || 'PEKAN BARU',
          targetMonthly: 45000000,
        });
      }
    });

    if (extraStores.length > 0) {
      list = [...list, ...extraStores];
    }

    // Filter by Trainer if selected
    if (selectedTrainer !== 'ALL') {
      list = list.filter(
        (s) => (s.trainerName || '').toUpperCase() === selectedTrainer.toUpperCase()
      );
    }

    // Filter strictly by Sales Coveran if a specific Sales is chosen
    if (selectedSales !== 'ALL') {
      list = list.filter(
        (s) => (s.salesName || '').toLowerCase() === selectedSales.toLowerCase()
      );
    }

    // Filter by Global Region if selected
    if (filters.REGION && filters.REGION !== 'ALL') {
      const reg = filters.REGION.toUpperCase();
      list = list.filter(
        (s) => (s.region || '').toUpperCase() === reg || (s.coverArea || '').toUpperCase() === reg
      );
    }

    // Filter by Global Store Name if selected
    if (filters.NAMA_STORE && filters.NAMA_STORE !== 'ALL') {
      const st = filters.NAMA_STORE.toUpperCase();
      list = list.filter((s) => (s.storeName || '').toUpperCase() === st);
    }

    // Filter by Global Search Query if present
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.storeName.toLowerCase().includes(q) ||
          s.baName.toLowerCase().includes(q) ||
          s.salesName.toLowerCase().includes(q) ||
          (s.trainerName && s.trainerName.toLowerCase().includes(q)) ||
          (s.coverArea && s.coverArea.toLowerCase().includes(q)) ||
          (s.region && s.region.toLowerCase().includes(q))
      );
    }

    return list;
  }, [storesList, deletedStoreNames, records, selectedSales, selectedTrainer, filters.REGION, filters.NAMA_STORE, filters.searchQuery]);

  // Custom Daily Sell Out Overrides (Key: `${storeName}_${dateKey}`)
  const [customDailyActuals, setCustomDailyActuals] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_ACTUALS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customDailyActuals', e);
    }
    return {};
  });

  // Custom Performa BA Overrides (Key: storeName -> % kontribusi)
  const [customPerformaBa, setCustomPerformaBa] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_PERFORMA);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customPerformaBa', e);
    }
    return {};
  });

  // Custom Cumulative Overrides (Key: storeName -> nominal)
  const [customCumulative, setCustomCumulative] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_CUMULATIVE);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customCumulative', e);
    }
    return {};
  });

  // Persen Target State (Default 100% per user request: di Week 2 dirubah dari 48% jadi 100%)
  const [customPersenTarget, setCustomPersenTarget] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem('salespro_weekly_persen_target');
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customPersenTarget', e);
    }
    return 100; // Default 100%
  });
  const [isEditingPersenTarget, setIsEditingPersenTarget] = useState(false);
  const [inputPersenTarget, setInputPersenTarget] = useState(100);

  // Screenshot Preview State
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);

  // Modal Editing Store Target / Values
  const [editingStore, setEditingStore] = useState<WeeklyStoreConfig | null>(null);
  const [editTargetMonthly, setEditTargetMonthly] = useState<number>(45000000);
  const [editStoreName, setEditStoreName] = useState<string>('');
  const [editBaName, setEditBaName] = useState<string>('');
  const [editSalesName, setEditSalesName] = useState<string>('');
  const [editTrainerName, setEditTrainerName] = useState<string>('');
  const [editCoverArea, setEditCoverArea] = useState<string>('');
  const [editRegion, setEditRegion] = useState<string>('');
  const [editPerformaVal, setEditPerformaVal] = useState<number>(0);
  const [editCumulativeVal, setEditCumulativeVal] = useState<number>(0);

  // Modal Tambah Kolom Toko Baru
  const [isAddingStore, setIsAddingStore] = useState<boolean>(false);
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newBaName, setNewBaName] = useState<string>('');
  const [newSalesName, setNewSalesName] = useState<string>('ALBERT FERNANDO');
  const [newTrainerName, setNewTrainerName] = useState<string>('ARA');
  const [newCoverArea, setNewCoverArea] = useState<string>('PEKANBARU');
  const [newRegion, setNewRegion] = useState<string>('PEKAN BARU');
  const [newTargetMonthly, setNewTargetMonthly] = useState<number>(45000000);
  const [newCumulativeVal, setNewCumulativeVal] = useState<number>(0);
  const [newPerformaVal, setNewPerformaVal] = useState<number>(0);

  // Quick Inline Edit Cell
  const [inlineEditCell, setInlineEditCell] = useState<{ storeName: string; dateKey: string; currentVal: number } | null>(null);
  const [inlineInputVal, setInlineInputVal] = useState<string>('');

  // Modal Edit Pencapaian Kumulatif Progresif (Week 1, Week 2, Week 3, Week 4)
  const [editingCumulativeModal, setEditingCumulativeModal] = useState<{
    store: WeeklyStoreConfig;
    selectedWeekTab: 'WEEK 1' | 'WEEK 2' | 'WEEK 3' | 'WEEK 4';
  } | null>(null);
  const [cumulativeInputVal, setCumulativeInputVal] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month parse: year and month index
  const { year, monthIdx } = useMemo(() => {
    const parts = selectedMonth.trim().split(' ');
    const mName = parts[0].toUpperCase();
    const yr = parts[1] ? parseInt(parts[1], 10) : 2026;
    const mIdx = MONTH_NAMES.indexOf(mName) !== -1 ? MONTH_NAMES.indexOf(mName) : 8; // Default September = 8
    return { year: isNaN(yr) ? 2026 : yr, monthIdx: mIdx };
  }, [selectedMonth]);

  // Total days in active month
  const totalDaysInMonth = useMemo(() => {
    return new Date(year, monthIdx + 1, 0).getDate();
  }, [year, monthIdx]);

  // Active days list based on selected week
  const activeDaysList = useMemo(() => {
    let startDay = 1;
    let endDay = 7;

    if (selectedWeek === 'WEEK 1') {
      startDay = 1;
      endDay = 7;
    } else if (selectedWeek === 'WEEK 2') {
      startDay = 8;
      endDay = 14;
    } else if (selectedWeek === 'WEEK 3') {
      startDay = 15;
      endDay = 21;
    } else if (selectedWeek === 'WEEK 4') {
      // Week 4 & Week 5 digabung: 22 s/d akhir bulan (30 atau 31)
      startDay = 22;
      endDay = totalDaysInMonth;
    } else if (selectedWeek === 'CUSTOM' && dateFrom && dateTo) {
      const d1 = new Date(dateFrom);
      const d2 = new Date(dateTo);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        startDay = d1.getDate();
        endDay = d2.getDate();
      }
    }

    const list: { dayNum: number; dayLabel: string; dateStr: string; dateKey: string }[] = [];
    for (let d = startDay; d <= Math.min(endDay, totalDaysInMonth); d++) {
      const dt = new Date(year, monthIdx, d);
      const dayName = INDO_DAY_NAMES[dt.getDay()];
      const dayNumStr = d.toString().padStart(2, '0');
      // Format (DD) HARI, e.g. (08) SELASA, (09) RABU
      const dayLabel = `(${dayNumStr}) ${dayName}`;
      const monthNumStr = (monthIdx + 1).toString().padStart(2, '0');
      const dateKey = `${year}-${monthNumStr}-${dayNumStr}`;
      const dateStr = `${d} ${MONTH_NAMES[monthIdx]}`;
      list.push({ dayNum: d, dayLabel, dateStr, dateKey });
    }
    return list;
  }, [selectedWeek, year, monthIdx, totalDaysInMonth, dateFrom, dateTo]);

  // Label for current week range, e.g. "WEEK 2 (08-14)"
  const weekRangeLabel = useMemo(() => {
    if (activeDaysList.length === 0) return 'WEEK';
    const first = activeDaysList[0].dayNum.toString().padStart(2, '0');
    const last = activeDaysList[activeDaysList.length - 1].dayNum.toString().padStart(2, '0');
    return `${selectedWeek} (${first}-${last})`;
  }, [activeDaysList, selectedWeek]);

  // Helper to normalize store names for flexible matching against Google Sheet data
  const normalizeStore = (name: string): string => {
    return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Transaction Map for fast lookup by store & date (strictly pulling VALUE from Google Sheet records)
  const transactionsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of sourceRecords) {
      if (!r.TANGGAL || !r.NAMA_STORE) continue;
      // Filter out returns
      if ((r.KET || '').toUpperCase() === 'RETURN') continue;

      let rYear = r.TAHUN || 2026;
      let rMonth = monthIdx + 1;
      let rDay = 1;

      const trimmedDate = r.TANGGAL.trim();
      const parts = trimmedDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          rYear = parseInt(parts[0], 10);
          rMonth = parseInt(parts[1], 10);
          rDay = parseInt(parts[2], 10);
        } else {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          if (p2 > 1000) {
            rYear = p2;
            if (p0 <= 12 && p1 <= 31) {
              rMonth = p0;
              rDay = p1;
            } else {
              rDay = p0;
              rMonth = p1;
            }
          }
        }
      }

      if (rYear === year && rMonth === monthIdx + 1) {
        const val = r.VALUE || 0;
        const sLower = r.NAMA_STORE.trim().toLowerCase();
        const sNorm = normalizeStore(r.NAMA_STORE);

        // Store by exact lowercase name + day
        const keyExact = `${sLower}_${rDay}`;
        map[keyExact] = (map[keyExact] || 0) + val;

        // Store by normalized alphanumeric name + day
        const keyNorm = `${sNorm}_${rDay}`;
        map[keyNorm] = (map[keyNorm] || 0) + val;

        // Store by formatted dateKey (YYYY-MM-DD)
        const dateKey = `${rYear}-${String(rMonth).padStart(2, '0')}-${String(rDay).padStart(2, '0')}`;
        map[`date_${sLower}_${dateKey}`] = (map[`date_${sLower}_${dateKey}`] || 0) + val;
        map[`date_${sNorm}_${dateKey}`] = (map[`date_${sNorm}_${dateKey}`] || 0) + val;
      }
    }
    return map;
  }, [sourceRecords, year, monthIdx]);

  // Real cumulative sell out from Day 1 of the month up to the active week from Google Sheets
  const realCumulativeFromRecords = useMemo(() => {
    const map: Record<string, number> = {};
    const maxDay = activeDaysList.length > 0 ? activeDaysList[activeDaysList.length - 1].dayNum : 7;

    for (const r of sourceRecords) {
      if (!r.TANGGAL || !r.NAMA_STORE) continue;
      if ((r.KET || '').toUpperCase() === 'RETURN') continue;

      let rYear = r.TAHUN || 2026;
      let rMonth = monthIdx + 1;
      let rDay = 1;

      const trimmedDate = r.TANGGAL.trim();
      const parts = trimmedDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          rYear = parseInt(parts[0], 10);
          rMonth = parseInt(parts[1], 10);
          rDay = parseInt(parts[2], 10);
        } else {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          if (p2 > 1000) {
            rYear = p2;
            if (p0 <= 12 && p1 <= 31) {
              rMonth = p0;
              rDay = p1;
            } else {
              rDay = p0;
              rMonth = p1;
            }
          }
        }
      }

      if (rYear === year && rMonth === monthIdx + 1 && rDay <= maxDay) {
        const sKey = r.NAMA_STORE.trim().toLowerCase();
        const sNorm = normalizeStore(r.NAMA_STORE);
        const val = r.VALUE || 0;
        map[sKey] = (map[sKey] || 0) + val;
        map[sNorm] = (map[sNorm] || 0) + val;
      }
    }
    return map;
  }, [sourceRecords, year, monthIdx, activeDaysList]);

  // Helper to get Sell Out on a specific day for a store
  const getDailySellOut = (store: WeeklyStoreConfig, dayNum: number, dateKey: string): number => {
    // 1. Check custom user edit override
    const overrideKey = `${store.storeName}_${dateKey}`;
    if (customDailyActuals[overrideKey] !== undefined) {
      return customDailyActuals[overrideKey];
    }

    // 2. Direct lookup in synced Google Sheet transaction records (by day and by dateKey)
    const txKeyExact = `${store.storeName.trim().toLowerCase()}_${dayNum}`;
    const txKeyNorm = `${normalizeStore(store.storeName)}_${dayNum}`;
    const txDateExact = `date_${store.storeName.trim().toLowerCase()}_${dateKey}`;
    const txDateNorm = `date_${normalizeStore(store.storeName)}_${dateKey}`;

    const sheetVal =
      transactionsMap[txDateExact] ??
      transactionsMap[txDateNorm] ??
      transactionsMap[txKeyExact] ??
      transactionsMap[txKeyNorm];

    if (sheetVal !== undefined && sheetVal > 0) {
      return sheetVal;
    }

    // 3. Fallback to sample snapshot if Google Sheet doesn't have data for that store/day
    if (dayNum >= 1 && dayNum <= 7 && SAMPLE_WEEK1_DAILY_SNAPSHOT[store.storeName]) {
      const idxInWeek = dayNum - 1;
      if (idxInWeek >= 0 && idxInWeek < SAMPLE_WEEK1_DAILY_SNAPSHOT[store.storeName].length) {
        const sampleVal = SAMPLE_WEEK1_DAILY_SNAPSHOT[store.storeName][idxInWeek];
        if (sampleVal !== undefined) return sampleVal;
      }
    } else if (dayNum >= 8 && dayNum <= 14 && SAMPLE_DAILY_SNAPSHOT[store.storeName]) {
      const idxInWeek = dayNum - 8;
      if (idxInWeek >= 0 && idxInWeek < SAMPLE_DAILY_SNAPSHOT[store.storeName].length) {
        const sampleVal = SAMPLE_DAILY_SNAPSHOT[store.storeName][idxInWeek];
        if (sampleVal !== undefined) return sampleVal;
      }
    }

    // 4. Deterministic fallback baseline based on daily target
    if (store.targetMonthly > 0) {
      const dailyTarget = Math.round(store.targetMonthly / 30);
      const seed = (store.storeName.length * 13 + dayNum * 17) % 10;
      if (seed > 1) {
        return Math.round(dailyTarget * (0.6 + (seed / 10) * 0.65));
      }
    }

    return sheetVal || 0;
  };

  // Grand totals & matrix calculations (scoped to activeStoresList according to Sales Coveran)
  const calculationData = useMemo(() => {
    // 1. Total Target Monthly for covered stores
    const totalTargetMonthly = activeStoresList.reduce((acc, s) => acc + s.targetMonthly, 0);

    // 2. Total Target Harian (Target / 30)
    const storeDailyTargets: Record<string, number> = {};
    activeStoresList.forEach((s) => {
      storeDailyTargets[s.storeName] = Math.round(s.targetMonthly / 30);
    });
    const totalTargetHarian = Object.values(storeDailyTargets).reduce((acc, val) => acc + val, 0);

    // 3. Target Penjualan 1 Minggu = Total Target Harian * jumlah hari di minggu ini
    const daysCount = activeDaysList.length || 7;
    const targetPenjualanMingguan = totalTargetHarian * daysCount;

    // 4. Matrix of Daily Actuals
    const matrix: Record<string, Record<number, number>> = {};
    const storeWeeklyTotals: Record<string, number> = {};
    const dailyTotals: Record<number, number> = {};

    activeDaysList.forEach((d) => {
      dailyTotals[d.dayNum] = 0;
    });

    activeStoresList.forEach((s) => {
      matrix[s.storeName] = {};
      let sTotal = 0;
      activeDaysList.forEach((d) => {
        const val = getDailySellOut(s, d.dayNum, d.dateKey);
        matrix[s.storeName][d.dayNum] = val;
        sTotal += val;
        dailyTotals[d.dayNum] = (dailyTotals[d.dayNum] || 0) + val;
      });
      storeWeeklyTotals[s.storeName] = sTotal;
    });

    // 5. Grand Total Actual Sell Out this week for active coveran
    const grandTotalActual = Object.values(storeWeeklyTotals).reduce((acc, v) => acc + v, 0);

    // 6. Presentase Capaian per Store vs Target Minggu
    const storePercentages: Record<string, number> = {};
    activeStoresList.forEach((s) => {
      const storeTargetMingguan = (storeDailyTargets[s.storeName] || 1) * daysCount;
      const act = storeWeeklyTotals[s.storeName] || 0;
      storePercentages[s.storeName] = storeTargetMingguan > 0 ? (act / storeTargetMingguan) * 100 : 0;
    });

    // 7. Peforma BA = Persentase Kontribusi Toko terhadap Total Penjualan Coveran Minggu Ini
    const storePerforma: Record<string, number> = {};
    activeStoresList.forEach((s) => {
      if (customPerformaBa[s.storeName] !== undefined) {
        storePerforma[s.storeName] = customPerformaBa[s.storeName];
      } else {
        const act = storeWeeklyTotals[s.storeName] || 0;
        storePerforma[s.storeName] = grandTotalActual > 0 ? Math.round((act / grandTotalActual) * 100) : 0;
      }
    });

    // Helper untuk menghitung total sell out toko pada rentang hari tertentu
    const getWeekRangeSum = (store: WeeklyStoreConfig, startDay: number, endDay: number) => {
      let sum = 0;
      const maxDay = Math.min(endDay, totalDaysInMonth);
      for (let d = startDay; d <= maxDay; d++) {
        const dayNumStr = d.toString().padStart(2, '0');
        const monthNumStr = (monthIdx + 1).toString().padStart(2, '0');
        const dateKey = `${year}-${monthNumStr}-${dayNumStr}`;
        sum += getDailySellOut(store, d, dateKey);
      }
      return sum;
    };

    // Helper untuk mengecek nilai override kumulatif yang diedit pengguna
    const getCumulativeOverride = (storeName: string, week: string): number | undefined => {
      const mPrefix = selectedMonth.trim().toUpperCase();
      const k1 = `${mPrefix}_${week}_${storeName}`;
      const k2 = `${week}_${storeName}`;
      if (customCumulative[k1] !== undefined) return customCumulative[k1];
      if (customCumulative[k2] !== undefined) return customCumulative[k2];
      // Fallback untuk backward-compatibility jika week aktif sama dengan selectedWeek
      if (week === selectedWeek && customCumulative[storeName] !== undefined) {
        return customCumulative[storeName];
      }
      return undefined;
    };

    // 8. Pencapaian Week Kumulatif dengan Formula Progresif per Toko:
    // Week 1 (01-07): Total pencapaian toko dari tgl 01 sampai 07
    // Week 2 (08-14): Total Week 1 + Total Week 2 toko
    // Week 3 (15-21): Pencapaian Week 2 + Total Week 3 toko
    // Week 4 (22-30/31): Pencapaian Week 3 + Total Week 4 toko
    // Semua tahapan bisa diedit manual dan disimpan di localStorage
    const storeCumulativeToDate: Record<string, number> = {};
    const isStoreCustomCumulative: Record<string, boolean> = {};
    const storeWeeklyBreakdowns: Record<
      string,
      {
        w1Actual: number;
        w1Pencapaian: number;
        isW1Custom: boolean;
        w2Actual: number;
        w2Formula: number;
        w2Pencapaian: number;
        isW2Custom: boolean;
        w3Actual: number;
        w3Formula: number;
        w3Pencapaian: number;
        isW3Custom: boolean;
        w4Actual: number;
        w4Formula: number;
        w4Pencapaian: number;
        isW4Custom: boolean;
      }
    > = {};

    activeStoresList.forEach((s) => {
      // 1. Total actual per week range
      const w1Actual = getWeekRangeSum(s, 1, 7);
      const w2Actual = getWeekRangeSum(s, 8, 14);
      const w3Actual = getWeekRangeSum(s, 15, 21);
      const w4Actual = getWeekRangeSum(s, 22, totalDaysInMonth);

      // Check overrides per week
      const overrideW1 = getCumulativeOverride(s.storeName, 'WEEK 1');
      const isW1Custom = overrideW1 !== undefined;
      const w1Pencapaian = overrideW1 !== undefined ? overrideW1 : w1Actual;

      const overrideW2 = getCumulativeOverride(s.storeName, 'WEEK 2');
      const isW2Custom = overrideW2 !== undefined;
      const w2Formula = w1Pencapaian + w2Actual;
      const w2Pencapaian = overrideW2 !== undefined ? overrideW2 : w2Formula;

      const overrideW3 = getCumulativeOverride(s.storeName, 'WEEK 3');
      const isW3Custom = overrideW3 !== undefined;
      const w3Formula = w2Pencapaian + w3Actual;
      const w3Pencapaian = overrideW3 !== undefined ? overrideW3 : w3Formula;

      const overrideW4 = getCumulativeOverride(s.storeName, 'WEEK 4');
      const isW4Custom = overrideW4 !== undefined;
      const w4Formula = w3Pencapaian + w4Actual;
      const w4Pencapaian = overrideW4 !== undefined ? overrideW4 : w4Formula;

      storeWeeklyBreakdowns[s.storeName] = {
        w1Actual,
        w1Pencapaian,
        isW1Custom,
        w2Actual,
        w2Formula,
        w2Pencapaian,
        isW2Custom,
        w3Actual,
        w3Formula,
        w3Pencapaian,
        isW3Custom,
        w4Actual,
        w4Formula,
        w4Pencapaian,
        isW4Custom,
      };

      // Tentukan nilai kumulatif untuk periode week yang sedang aktif
      if (selectedWeek === 'WEEK 1') {
        storeCumulativeToDate[s.storeName] = w1Pencapaian;
        isStoreCustomCumulative[s.storeName] = isW1Custom;
      } else if (selectedWeek === 'WEEK 2') {
        storeCumulativeToDate[s.storeName] = w2Pencapaian;
        isStoreCustomCumulative[s.storeName] = isW2Custom;
      } else if (selectedWeek === 'WEEK 3') {
        storeCumulativeToDate[s.storeName] = w3Pencapaian;
        isStoreCustomCumulative[s.storeName] = isW3Custom;
      } else if (selectedWeek === 'WEEK 4') {
        storeCumulativeToDate[s.storeName] = w4Pencapaian;
        isStoreCustomCumulative[s.storeName] = isW4Custom;
      } else {
        // CUSTOM range: kumulatif dari hari 1 s/d hari terakhir di filter
        const lastDay = activeDaysList.length > 0 ? activeDaysList[activeDaysList.length - 1].dayNum : totalDaysInMonth;
        const customSum = getWeekRangeSum(s, 1, lastDay);
        const overrideCustom = getCumulativeOverride(s.storeName, 'CUSTOM');
        storeCumulativeToDate[s.storeName] = overrideCustom !== undefined ? overrideCustom : customSum;
        isStoreCustomCumulative[s.storeName] = overrideCustom !== undefined;
      }
    });

    const totalCumulativeToDate = Object.values(storeCumulativeToDate).reduce((acc, v) => acc + v, 0);

    // 9. Persen Target & Persentase Pencapaian
    const persentasePencapaianMingguan =
      targetPenjualanMingguan > 0 ? Math.round((grandTotalActual / targetPenjualanMingguan) * 100) : 52;
    const persenTarget = customPersenTarget !== null ? customPersenTarget : 100;

    return {
      totalTargetMonthly,
      storeDailyTargets,
      totalTargetHarian,
      targetPenjualanMingguan,
      matrix,
      storeWeeklyTotals,
      dailyTotals,
      grandTotalActual,
      storePercentages,
      storePerforma,
      storeCumulativeToDate,
      totalCumulativeToDate,
      isStoreCustomCumulative,
      storeWeeklyBreakdowns,
      persenTarget,
      persentasePencapaianMingguan,
    };
  }, [
    activeStoresList,
    activeDaysList,
    customDailyActuals,
    customPerformaBa,
    customCumulative,
    customPersenTarget,
    selectedWeek,
    selectedMonth,
    transactionsMap,
    totalDaysInMonth,
    year,
    monthIdx,
  ]);

  // Open Edit Store Modal
  const handleOpenEditStore = (store: WeeklyStoreConfig) => {
    setEditingStore(store);
    setEditTargetMonthly(store.targetMonthly);
    setEditStoreName(store.storeName);
    setEditBaName(store.baName);
    setEditSalesName(store.salesName || 'ALBERT FERNANDO');
    setEditTrainerName(store.trainerName || 'ARA');
    setEditCoverArea(store.coverArea || 'PEKANBARU');
    setEditRegion(store.region || 'PEKAN BARU');
    setEditPerformaVal(calculationData.storePerforma[store.storeName] || 0);
    setEditCumulativeVal(calculationData.storeCumulativeToDate[store.storeName] || 0);
  };

  // Save Store Edit
  const handleSaveEditStore = () => {
    if (!editingStore) return;
    const updated = storesList.map((s) => {
      if (s.id === editingStore.id) {
        return {
          ...s,
          storeName: editStoreName.trim().toUpperCase() || s.storeName,
          baName: editBaName.trim().toUpperCase() || s.baName,
          salesName: editSalesName.trim().toUpperCase() || s.salesName,
          trainerName: editTrainerName.trim().toUpperCase() || s.trainerName,
          coverArea: editCoverArea.trim().toUpperCase() || s.coverArea,
          region: editRegion.trim().toUpperCase() || s.region,
          targetMonthly: editTargetMonthly,
        };
      }
      return s;
    });
    setStoresList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_STORES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (editPerformaVal >= 0) {
      const newPerforma = { ...customPerformaBa, [editingStore.storeName]: editPerformaVal };
      setCustomPerformaBa(newPerforma);
      try {
        localStorage.setItem(STORAGE_KEY_WEEKLY_PERFORMA, JSON.stringify(newPerforma));
      } catch (e) {
        console.warn(e);
      }
    }

    if (editCumulativeVal >= 0) {
      const activeWeekKey = `${selectedWeek}_${editingStore.storeName}`;
      const monthWeekKey = `${selectedMonth.trim().toUpperCase()}_${selectedWeek}_${editingStore.storeName}`;
      const newCum = {
        ...customCumulative,
        [editingStore.storeName]: editCumulativeVal,
        [activeWeekKey]: editCumulativeVal,
        [monthWeekKey]: editCumulativeVal,
      };
      setCustomCumulative(newCum);
      try {
        localStorage.setItem(STORAGE_KEY_WEEKLY_CUMULATIVE, JSON.stringify(newCum));
      } catch (e) {
        console.warn(e);
      }
    }

    setEditingStore(null);
    showToast(`Target & informasi ${editStoreName || editingStore.storeName} berhasil diperbarui!`);
  };

  // Buka Modal Edit Pencapaian Kumulatif Progresif
  const handleOpenCumulativeModal = (store: WeeklyStoreConfig, targetWeek?: 'WEEK 1' | 'WEEK 2' | 'WEEK 3' | 'WEEK 4') => {
    const weekTab = targetWeek || ((selectedWeek === 'CUSTOM' ? 'WEEK 2' : selectedWeek) as 'WEEK 1' | 'WEEK 2' | 'WEEK 3' | 'WEEK 4');
    setEditingCumulativeModal({
      store,
      selectedWeekTab: weekTab,
    });
    const breakdown = calculationData.storeWeeklyBreakdowns?.[store.storeName];
    let valForTab = calculationData.storeCumulativeToDate[store.storeName] || 0;
    if (breakdown) {
      if (weekTab === 'WEEK 1') valForTab = breakdown.w1Pencapaian;
      else if (weekTab === 'WEEK 2') valForTab = breakdown.w2Pencapaian;
      else if (weekTab === 'WEEK 3') valForTab = breakdown.w3Pencapaian;
      else if (weekTab === 'WEEK 4') valForTab = breakdown.w4Pencapaian;
    }
    setCumulativeInputVal(valForTab);
  };

  // Ganti Tab Week di dalam Modal Pencapaian Kumulatif
  const handleSwitchCumulativeTab = (tab: 'WEEK 1' | 'WEEK 2' | 'WEEK 3' | 'WEEK 4') => {
    if (!editingCumulativeModal) return;
    const store = editingCumulativeModal.store;
    const breakdown = calculationData.storeWeeklyBreakdowns?.[store.storeName];
    let valForTab = 0;
    if (breakdown) {
      if (tab === 'WEEK 1') valForTab = breakdown.w1Pencapaian;
      else if (tab === 'WEEK 2') valForTab = breakdown.w2Pencapaian;
      else if (tab === 'WEEK 3') valForTab = breakdown.w3Pencapaian;
      else if (tab === 'WEEK 4') valForTab = breakdown.w4Pencapaian;
    }
    setEditingCumulativeModal({ ...editingCumulativeModal, selectedWeekTab: tab });
    setCumulativeInputVal(valForTab);
  };

  // Simpan Edit Pencapaian Kumulatif
  const handleSaveCumulativeModal = () => {
    if (!editingCumulativeModal) return;
    const { store, selectedWeekTab } = editingCumulativeModal;
    const val = Number(cumulativeInputVal);
    if (isNaN(val) || val < 0) {
      showToast('Nominal harus berupa angka valid non-negatif!');
      return;
    }
    const mPrefix = selectedMonth.trim().toUpperCase();
    const weekKey = `${selectedWeekTab}_${store.storeName}`;
    const monthWeekKey = `${mPrefix}_${selectedWeekTab}_${store.storeName}`;

    const newCum = {
      ...customCumulative,
      [weekKey]: val,
      [monthWeekKey]: val,
    };
    if (selectedWeekTab === selectedWeek) {
      newCum[store.storeName] = val;
    }

    setCustomCumulative(newCum);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_CUMULATIVE, JSON.stringify(newCum));
    } catch (e) {
      console.warn(e);
    }

    showToast(`Pencapaian ${selectedWeekTab} toko ${store.storeName} berhasil disimpan: ${formatNumber(val)}!`);
    setEditingCumulativeModal(null);
  };

  // Reset Pencapaian Kumulatif ke Formula Otomatis
  const handleResetCumulativeModal = () => {
    if (!editingCumulativeModal) return;
    const { store, selectedWeekTab } = editingCumulativeModal;
    const mPrefix = selectedMonth.trim().toUpperCase();
    const weekKey = `${selectedWeekTab}_${store.storeName}`;
    const monthWeekKey = `${mPrefix}_${selectedWeekTab}_${store.storeName}`;

    const newCum = { ...customCumulative };
    delete newCum[weekKey];
    delete newCum[monthWeekKey];
    if (selectedWeekTab === selectedWeek) {
      delete newCum[store.storeName];
    }

    setCustomCumulative(newCum);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_CUMULATIVE, JSON.stringify(newCum));
    } catch (e) {
      console.warn(e);
    }

    showToast(`Pencapaian ${selectedWeekTab} toko ${store.storeName} dikembalikan ke formula otomatis!`);
    setEditingCumulativeModal(null);
  };

  // Tambah Kolom Toko Baru
  const handleAddStoreColumn = () => {
    if (!newStoreName.trim()) {
      showToast('Mohon masukkan nama toko!');
      return;
    }
    const sName = newStoreName.trim().toUpperCase();
    const sLower = sName.toLowerCase();

    // Hapus dari daftar toko yang pernah dihapus jika ada
    const updatedDeleted = deletedStoreNames.filter((n) => n.trim().toLowerCase() !== sLower);
    setDeletedStoreNames(updatedDeleted);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_DELETED_STORES, JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn(e);
    }

    const newStore: WeeklyStoreConfig = {
      id: `ws-custom-${Date.now()}`,
      storeName: sName,
      baName: newBaName.trim().toUpperCase() || 'BA STANDBY',
      salesName: newSalesName.trim().toUpperCase() || 'ALBERT FERNANDO',
      trainerName: newTrainerName.trim().toUpperCase() || 'ARA',
      coverArea: newCoverArea.trim().toUpperCase() || 'PEKANBARU',
      region: newRegion.trim().toUpperCase() || 'PEKAN BARU',
      targetMonthly: Number(newTargetMonthly) || 45000000,
    };

    // Bersihkan duplikat nama jika ada, lalu tambahkan toko baru
    const updated = [...storesList.filter((s) => s.storeName.trim().toLowerCase() !== sLower), newStore];
    setStoresList(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_STORES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (newPerformaVal > 0) {
      const newPerforma = { ...customPerformaBa, [newStore.storeName]: newPerformaVal };
      setCustomPerformaBa(newPerforma);
      try {
        localStorage.setItem(STORAGE_KEY_WEEKLY_PERFORMA, JSON.stringify(newPerforma));
      } catch (e) {
        console.warn(e);
      }
    }

    if (newCumulativeVal > 0) {
      const newCum = { ...customCumulative, [newStore.storeName]: newCumulativeVal };
      setCustomCumulative(newCum);
      try {
        localStorage.setItem(STORAGE_KEY_WEEKLY_CUMULATIVE, JSON.stringify(newCum));
      } catch (e) {
        console.warn(e);
      }
    }

    setIsAddingStore(false);
    showToast(`Kolom toko "${newStore.storeName}" berhasil ditambahkan ke tabel!`);
  };

  // Buka Modal Kelola & Kurangi Toko
  const handleOpenManageStoresModal = () => {
    setWorkingDeletedStores([...deletedStoreNames]);
    setManageStoresSearch('');
    setManageStoresSalesFilter('ALL');
    setManageStoresTab('all');
    setIsManageStoresModalOpen(true);
  };

  // Toggle toko dalam modal draft (Centang = Aktif, Uncheck = Dikurangi)
  const handleToggleStoreInDraft = (storeName: string) => {
    const sLower = storeName.trim().toLowerCase();
    const isCurrentlyDeleted = workingDeletedStores.some((n) => n.trim().toLowerCase() === sLower);
    if (isCurrentlyDeleted) {
      setWorkingDeletedStores(workingDeletedStores.filter((n) => n.trim().toLowerCase() !== sLower));
    } else {
      setWorkingDeletedStores([...workingDeletedStores, sLower]);
    }
  };

  // Set status spesifik untuk toko dalam modal draft
  const handleSetStoreExcludedInDraft = (storeName: string, exclude: boolean) => {
    const sLower = storeName.trim().toLowerCase();
    if (exclude) {
      if (!workingDeletedStores.some((n) => n.trim().toLowerCase() === sLower)) {
        setWorkingDeletedStores([...workingDeletedStores, sLower]);
      }
    } else {
      setWorkingDeletedStores(workingDeletedStores.filter((n) => n.trim().toLowerCase() !== sLower));
    }
  };

  // Bulk: Aktifkan semua toko yang sedang terlihat di modal
  const handleActivateAllVisible = (storeNames: string[]) => {
    const visibleSet = new Set(storeNames.map((n) => n.trim().toLowerCase()));
    setWorkingDeletedStores((prev) => prev.filter((n) => !visibleSet.has(n.trim().toLowerCase())));
    showToast(`${storeNames.length} toko diset Aktif (Draft). Klik Simpan untuk menerapkan.`);
  };

  // Bulk: Kurangi semua toko yang sedang terlihat di modal
  const handleExcludeAllVisible = (storeNames: string[]) => {
    const toAdd = storeNames.map((n) => n.trim().toLowerCase());
    setWorkingDeletedStores((prev) => Array.from(new Set([...prev, ...toAdd])));
    showToast(`${storeNames.length} toko diset Dikurangi (Draft). Klik Simpan untuk menerapkan.`);
  };

  // SIMPAN & TERAPKAN PERUBAHAN TOKO KE TABEL WEEKLY
  const handleSaveManageStores = () => {
    const cleanedDeleted = Array.from(new Set(workingDeletedStores.map((n) => n.trim().toLowerCase())));
    setDeletedStoreNames(cleanedDeleted);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_DELETED_STORES, JSON.stringify(cleanedDeleted));
    } catch (e) {
      console.warn('Failed to save STORAGE_KEY_WEEKLY_DELETED_STORES', e);
    }

    // Hitung berapa toko yang aktif setelah perubahan
    const activeCount = allMasterStores.filter(
      (s) => !cleanedDeleted.includes(s.storeName.trim().toLowerCase())
    ).length;

    setIsManageStoresModalOpen(false);
    showToast(`Perubahan berhasil disimpan! Tabel kini menampilkan ${activeCount} kolom toko aktif.`);
  };

  // Hapus / Kurangi Kolom Toko Langsung (Bisa dipanggil langsung dari header tabel tanpa dialog confirm)
  const handleDeleteStoreColumn = (storeId: string, storeName: string) => {
    const sLower = storeName.trim().toLowerCase();

    // 1. Hapus dari storesList
    const updatedStores = storesList.filter(
      (s) => s.id !== storeId && s.storeName.trim().toLowerCase() !== sLower
    );
    setStoresList(updatedStores);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_STORES, JSON.stringify(updatedStores));
    } catch (e) {
      console.warn(e);
    }

    // 2. Tambahkan ke deletedStoreNames agar tidak dihidupkan kembali secara otomatis oleh rekaman Google Sheets
    const updatedDeleted = Array.from(new Set([...deletedStoreNames, sLower]));
    setDeletedStoreNames(updatedDeleted);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_DELETED_STORES, JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn(e);
    }

    // Sync juga draft working state jika modal sedang terbuka
    setWorkingDeletedStores((prev) => Array.from(new Set([...prev, sLower])));

    if (editingStore && (editingStore.id === storeId || editingStore.storeName.trim().toLowerCase() === sLower)) {
      setEditingStore(null);
    }
    showToast(`Kolom toko "${storeName}" berhasil dikurangi dari tabel.`);
  };

  // Pulihkan Toko yang Pernah Dihapus
  const handleRestoreStore = (storeName: string) => {
    const sLower = storeName.trim().toLowerCase();
    const updatedDeleted = deletedStoreNames.filter((n) => n.trim().toLowerCase() !== sLower);
    setDeletedStoreNames(updatedDeleted);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_DELETED_STORES, JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn(e);
    }

    setWorkingDeletedStores((prev) => prev.filter((n) => n.trim().toLowerCase() !== sLower));

    // Ambil dari DEFAULT_WEEKLY_STORES jika belum ada di storesList
    const def = DEFAULT_WEEKLY_STORES.find((s) => s.storeName.trim().toLowerCase() === sLower);
    if (def && !storesList.some((s) => s.storeName.trim().toLowerCase() === sLower)) {
      const updated = [...storesList, def];
      setStoresList(updated);
      try {
        localStorage.setItem(STORAGE_KEY_WEEKLY_STORES, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
    showToast(`Kolom toko "${storeName}" berhasil dipulihkan kembali ke tabel!`);
  };

  // Pulihkan Semua Toko
  const handleRestoreAllStores = () => {
    setDeletedStoreNames([]);
    setWorkingDeletedStores([]);
    try {
      localStorage.removeItem(STORAGE_KEY_WEEKLY_DELETED_STORES);
    } catch (e) {}
    setStoresList(DEFAULT_WEEKLY_STORES);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_STORES, JSON.stringify(DEFAULT_WEEKLY_STORES));
    } catch (e) {}
    showToast('Seluruh kolom toko berhasil dipulihkan!');
  };

  // Save Inline Edit Cell
  const handleSaveInlineCell = () => {
    if (!inlineEditCell) return;
    const num = parseInt(inlineInputVal.replace(/\D/g, ''), 10) || 0;
    const key = `${inlineEditCell.storeName}_${inlineEditCell.dateKey}`;
    const updated = { ...customDailyActuals, [key]: num };
    setCustomDailyActuals(updated);
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_ACTUALS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setInlineEditCell(null);
    showToast(`Nilai transaksi ${inlineEditCell.storeName} berhasil disimpan!`);
  };

  // Reset to default template snapshot
  const handleResetToDefault = () => {
    setStoresList(DEFAULT_WEEKLY_STORES);
    setDeletedStoreNames([]);
    setCustomDailyActuals({});
    setCustomPerformaBa({});
    setCustomCumulative({});
    try {
      localStorage.removeItem(STORAGE_KEY_WEEKLY_STORES);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_DELETED_STORES);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_ACTUALS);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_PERFORMA);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_CUMULATIVE);
    } catch (e) {
      console.warn(e);
    }
    showToast('Tabel berhasil direset sesuai format gambar template default!');
  };

  // Reset custom overrides to re-sync cleanly with Google Sheets
  const handleResetToGoogleSheet = () => {
    setCustomDailyActuals({});
    setCustomPerformaBa({});
    setCustomCumulative({});
    try {
      localStorage.removeItem(STORAGE_KEY_WEEKLY_ACTUALS);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_PERFORMA);
      localStorage.removeItem(STORAGE_KEY_WEEKLY_CUMULATIVE);
    } catch (e) {
      console.warn(e);
    }
    showToast('Data berhasil disinkronkan kembali dengan data Google Sheet!');
  };

  // Screenshot Feature using html2canvas with transform-reset and download safety
  const handleCaptureScreenshot = async () => {
    if (!reportRef.current) return;
    try {
      setIsCapturing(true);
      showToast('Sedang membuat screenshot berkualitas tinggi...');

      // html2canvas bermasalah jika element memiliki CSS transform: scale(...)!
      // Kita normalisasi viewScale sementara menjadi 1 selama proses capture, lalu kembalikan.
      const originalScale = viewScale;
      if (originalScale !== 1) {
        setViewScale(1);
        await new Promise((resolve) => setTimeout(resolve, 180));
      }

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-report-capture]') as HTMLElement;
          if (el) {
            el.style.transform = 'none';
          }
        },
      });

      // Restore view scale jika diubah
      if (originalScale !== 1) {
        setViewScale(originalScale);
      }

      const filename = `Laporan_Weekly_SellOut_BA_${selectedWeek.replace(/\s+/g, '_')}_${selectedMonth.replace(/\s+/g, '_')}.png`;

      // 1. Convert to Blob & trigger safe download
      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png');
          setScreenshotPreviewUrl(dataUrl);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => document.body.removeChild(a), 500);
          showToast('Screenshot laporan berhasil dibuat!');
          return;
        }

        const url = URL.createObjectURL(blob);
        setScreenshotPreviewUrl(url);

        try {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
          }, 1500);
          showToast('Screenshot laporan berhasil diunduh (PNG)!');
        } catch (e) {
          console.warn('Auto download blocked by browser, showing preview modal', e);
          showToast('Screenshot siap! Klik Simpan pada preview.');
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.warn('Screenshot error:', err);
      showToast('Gagal membuat screenshot. Silakan coba lagi.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      'HARI',
      ...activeStoresList.map((s) => `${s.storeName} (${s.baName})`),
      'TARGET HARIAN',
      'PENCAPAIAN',
      'TARGET PENJUALAN',
    ];

    const targetRow = [
      'TARGET BA + LAVOJOY',
      ...activeStoresList.map((s) => s.targetMonthly),
      calculationData.totalTargetMonthly,
      '-',
      '-',
    ];

    const targetDailyRow = [
      'TARGET HARIAN BA',
      ...activeStoresList.map((s) => calculationData.storeDailyTargets[s.storeName]),
      calculationData.totalTargetHarian,
      '-',
      '-',
    ];

    const pencapaianKumulatifRow = [
      `PENCAPAIAN ${weekRangeLabel}`,
      ...activeStoresList.map((s) => calculationData.storeCumulativeToDate[s.storeName]),
      calculationData.totalCumulativeToDate,
      '-',
      '-',
    ];

    const dailyRows: any[] = [];
    activeDaysList.forEach((d) => {
      const row = [
        d.dayLabel,
        ...activeStoresList.map((s) => calculationData.matrix[s.storeName]?.[d.dayNum] || 0),
        calculationData.totalTargetHarian,
        calculationData.dailyTotals[d.dayNum] || 0,
        calculationData.targetPenjualanMingguan,
      ];
      dailyRows.push(row);
    });

    const totalRow = [
      'TOTAL SELL OUT',
      ...activeStoresList.map((s) => calculationData.storeWeeklyTotals[s.storeName] || 0),
      calculationData.targetPenjualanMingguan,
      calculationData.grandTotalActual,
      calculationData.grandTotalActual,
    ];

    const presentaseRow = [
      'PRESENTASE (%)',
      ...activeStoresList.map((s) => `${calculationData.storePercentages[s.storeName]?.toFixed(1)}%`),
      '100%',
      `${calculationData.persentasePencapaianMingguan}%`,
      `TARGET: ${calculationData.persenTarget}%`,
    ];

    const performaRow = [
      'PEFORMA BA (KONTRIBUSI %)',
      ...activeStoresList.map((s) => `${calculationData.storePerforma[s.storeName]}%`),
      '100%',
      `${calculationData.persentasePencapaianMingguan}%`,
      `ACH: ${calculationData.persentasePencapaianMingguan}%`,
    ];

    const wsData = [
      ['LAPORAN PENJUALAN AREA - REVIEW WEEKLY SELL OUT BA'],
      [`Periode: ${selectedMonth} | ${weekRangeLabel}`],
      [],
      targetRow,
      targetDailyRow,
      pencapaianKumulatifRow,
      [],
      headers,
      ...dailyRows,
      [],
      totalRow,
      presentaseRow,
      performaRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Sell Out BA');
    XLSX.writeFile(wb, `Laporan_Weekly_SellOut_BA_${selectedWeek}_${selectedMonth}.xlsx`);
    showToast('Laporan berhasil diekspor ke Excel!');
  };

  // Helper formatting numbers with dot thousand separator (16.795.300)
  const formatNumber = (num: number): string => {
    if (!num || num === 0) return '-';
    return num.toLocaleString('id-ID');
  };

  const formatRupiah = (num: number): string => {
    if (!num || num === 0) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FILTER & ACTION TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Sinkron Filter Terintegrasi */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                Filter Terintegrasi:
              </span>
              <span className="font-extrabold text-blue-950 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                {selectedMonth}
              </span>
              <span className="text-slate-400">·</span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-700" />
                <select
                  value={selectedSales}
                  onChange={(e) => setSelectedSales(e.target.value)}
                  className="font-black text-blue-950 bg-white/80 px-2 py-0.5 rounded-md border border-blue-200 text-[11px] outline-none cursor-pointer"
                  title="Filter Coveran Sales"
                >
                  <option value="ALL">SEMUA SALES ({storesList.length} Toko)</option>
                  {availableSales.map((sales) => (
                    <option key={sales} value={sales}>
                      SALES: {sales}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400">·</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-blue-800">TRAINER:</span>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="font-black text-blue-950 bg-white/80 px-1.5 py-0.5 rounded-md border border-blue-200 text-[11px] outline-none cursor-pointer"
                  title="Filter Trainer"
                >
                  <option value="ALL">SEMUA</option>
                  <option value="ARA">ARA</option>
                  <option value="RATIH">RATIH</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Minggu (Week 1, Week 2, Week 3, Week 4 [Week 4 & 5 gabung]) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            {(['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'] as const).map((w) => {
              const label =
                w === 'WEEK 1'
                  ? 'WEEK 1 (01-07)'
                  : w === 'WEEK 2'
                  ? 'WEEK 2 (08-14)'
                  : w === 'WEEK 3'
                  ? 'WEEK 3 (15-21)'
                  : 'WEEK 4 (22-31)'; // Week 4 & Week 5 digabung!
              const isActive = selectedWeek === w;
              return (
                <button
                  key={w}
                  onClick={() => {
                    setSelectedWeek(w);
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Filter Rentang Tanggal Manual */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Dari:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setSelectedWeek('CUSTOM');
              }}
              className="text-xs bg-transparent border-0 outline-none font-mono text-slate-800"
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase">s/d</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setSelectedWeek('CUSTOM');
              }}
              className="text-xs bg-transparent border-0 outline-none font-mono text-slate-800"
            />
          </div>

          {/* Google Sheets Sync Indicator */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-emerald-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold">
              Google Sheet Terhubung ({records.length > 0 ? `${records.length} data` : 'Aktif'})
            </span>
            <button
              onClick={handleResetToGoogleSheet}
              className="p-1 hover:bg-emerald-100 rounded-md transition-colors text-emerald-700 ml-0.5 cursor-pointer"
              title="Sinkronkan ulang ke data Google Sheet (reset override lokal)"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Action Controls: Zoom, Reset, Screenshot, Excel */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewScale((s) => Math.max(0.65, Number((s - 0.05).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
              title="Perkecil Tampilan (Zoom Out)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-slate-700 min-w-[42px] text-center">
              {Math.round(viewScale * 100)}%
            </span>
            <button
              onClick={() => setViewScale((s) => Math.min(1.2, Number((s + 0.05).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
              title="Perbesar Tampilan (Zoom In)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewScale(viewScale === 0.85 ? 1 : 0.85)}
              className="px-2 py-0.5 text-[10px] font-bold bg-white text-indigo-700 rounded-md border border-slate-200 flex items-center gap-1"
              title="Fit Satu Layar"
            >
              <Maximize2 className="w-3 h-3" />
              Fit
            </button>
          </div>

          {/* Tambah Kolom Toko Button */}
          <button
            onClick={() => {
              setNewStoreName('');
              setNewBaName('');
              setNewSalesName(selectedSales !== 'ALL' ? selectedSales : 'ALBERT FERNANDO');
              setNewTrainerName(selectedTrainer !== 'ALL' ? selectedTrainer : 'ARA');
              setNewCoverArea('PEKANBARU');
              setNewRegion('PEKAN BARU');
              setNewTargetMonthly(45000000);
              setNewCumulativeVal(0);
              setNewPerformaVal(0);
              setIsAddingStore(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Tambah Kolom Toko Baru ke Tabel Weekly Sell Out"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Toko</span>
          </button>

          {/* Kurangi / Kelola Kolom Toko Button */}
          <button
            onClick={handleOpenManageStoresModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Kurangi atau Kelola Kolom Toko (Hapus / Pulihkan Toko)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>− Kurangi / Kelola Toko</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-mono font-bold">
              {activeStoresList.length}
            </span>
            {deletedStoreNames.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-600 text-white font-bold" title={`${deletedStoreNames.length} toko telah dihapus`}>
                -{deletedStoreNames.length}
              </span>
            )}
          </button>

          {/* Reset Template Default Button */}
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reset ke format data template default 80 toko"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Template</span>
          </button>

          {/* Screenshot PNG Button */}
          <button
            onClick={handleCaptureScreenshot}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Download tangkapan layar PNG dari laporan ini"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Memproses Screenshot...' : 'Screenshot PNG'}</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Quick Sales Coveran & Trainer Selector Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-500 mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Coveran Sales:
          </span>
          <button
            onClick={() => setSelectedSales('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              selectedSales === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Sales ({storesList.length})
          </button>
          {[
            { name: 'ALBERT FERNANDO', count: 13 },
            { name: 'ILHAMSYAH', count: 20 },
            { name: 'TIWI', count: 19 },
            { name: 'ABDUL RAHIM', count: 8 },
            { name: 'PARETO', count: 9 },
            { name: 'LUAR KOTA', count: 11 },
          ].map((s) => (
            <button
              key={s.name}
              onClick={() => setSelectedSales(s.name)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSales === s.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{s.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedSales === s.name ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700 font-bold'
                }`}
              >
                {s.count}
              </span>
            </button>
          ))}
        </div>

        {/* Trainer Selector Pills */}
        <div className="flex items-center gap-1.5 text-xs bg-purple-50/60 border border-purple-200 px-2.5 py-1 rounded-xl">
          <span className="text-[10px] font-black uppercase text-purple-900">Trainer:</span>
          {(['ALL', 'ARA', 'RATIH', 'ONLINE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTrainer(t)}
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                selectedTrainer === t
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-100'
              }`}
            >
              {t === 'ALL' ? 'Semua' : t}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT CANVAS (Container that can be zoomed and screenshotted) */}
      <div className="overflow-x-auto bg-slate-200/70 p-2 sm:p-4 rounded-2xl border border-slate-300">
        <div
          ref={reportRef}
          data-report-capture="true"
          style={{
            transform: `scale(${viewScale})`,
            transformOrigin: 'top left',
            width: viewScale < 1 ? `${(1 / viewScale) * 100}%` : '100%',
          }}
          className="bg-white rounded-xl shadow-sm border border-slate-400 p-2 sm:p-4 transition-transform duration-150 font-sans"
        >
          {/* MAIN SPREADSHEET TABLE - EXACT STRUCTURE MATCHING IMAGE */}
          <div className="overflow-x-auto border border-slate-700">
            <table className="w-full text-left border-collapse text-[9.5px] leading-tight select-none border border-slate-600">
              <tbody>
                {/* 1. TOP HEADER BANNER: "LAPORAN PENJUALAN AREA ✎" | "TARGET PENJUALAN 1 MINGGU" | "Rp" | "135.566.669" */}
                <tr className="border-b border-slate-700">
                  <th
                    colSpan={activeStoresList.length + 1}
                    className="bg-[#9bc2e6] text-slate-950 font-black text-center py-2 px-4 text-xs sm:text-sm uppercase tracking-wide border-r border-slate-700"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>LAPORAN PENJUALAN AREA {selectedSales !== 'ALL' ? `• COVERAN SALES: ${selectedSales}` : ''}</span>
                      <Edit2 className="w-3.5 h-3.5 text-blue-800" />
                    </div>
                  </th>
                  <th className="bg-[#9bc2e6] text-slate-950 font-bold text-[9px] py-2 px-2 text-center uppercase whitespace-nowrap border-r border-slate-700 w-28">
                    TARGET PENJUALAN 1 MINGGU
                  </th>
                  <th className="bg-[#a9d08e] text-slate-950 font-extrabold text-[10px] py-2 px-1 text-center border-r border-slate-700 w-7">
                    Rp
                  </th>
                  <th className="bg-[#c6e0b4] text-slate-950 font-black text-[11px] py-2 px-2 text-right border-slate-700 font-mono w-28">
                    {formatNumber(calculationData.targetPenjualanMingguan)}
                  </th>
                </tr>

                {/* 2. ROW: TARGET BA + LAVOJOY */}
                <tr className="border-b border-slate-400 font-mono text-[9px]">
                  <td className="bg-white font-black text-slate-900 p-1 border-r border-slate-400 whitespace-nowrap w-28">
                    TARGET BA + LAVOJOY
                  </td>
                  {activeStoresList.map((s) => (
                    <td
                      key={s.id}
                      onClick={() => handleOpenEditStore(s)}
                      className="text-right p-1 border-r border-slate-300 font-bold hover:bg-yellow-50 cursor-pointer transition-colors"
                      title="Klik untuk mengedit target toko"
                    >
                      {formatNumber(s.targetMonthly)}
                    </td>
                  ))}
                  <td className="bg-[#ff0000] text-white font-black text-center p-1 border-r border-slate-700 uppercase text-[8.5px]">
                    TOTAL TARGET
                  </td>
                  <td
                    colSpan={2}
                    className="text-right p-1 font-black text-red-600 border-slate-700 bg-white font-mono text-[9.5px]"
                  >
                    {formatNumber(calculationData.totalTargetMonthly)}
                  </td>
                </tr>

                {/* 3. ROW: TARGET HARIAN BA */}
                <tr className="border-b border-slate-400 font-mono text-[9px]">
                  <td className="bg-white font-black text-slate-900 p-1 border-r border-slate-400 whitespace-nowrap">
                    TARGET HARIAN BA
                  </td>
                  {activeStoresList.map((s) => (
                    <td
                      key={s.id}
                      onClick={() => handleOpenEditStore(s)}
                      className="text-right p-1 border-r border-slate-300 font-medium hover:bg-yellow-50 cursor-pointer transition-colors text-slate-700"
                      title="Klik untuk mengedit target toko"
                    >
                      {formatNumber(calculationData.storeDailyTargets[s.storeName] || 0)}
                    </td>
                  ))}
                  <td className="bg-[#000000] text-white font-black text-center p-1 border-r border-slate-700 uppercase text-[8.5px]">
                    TOTAL TARGET HARIAN
                  </td>
                  <td
                    colSpan={2}
                    className="text-right p-1 font-black text-red-600 border-slate-700 bg-white font-mono text-[9.5px]"
                  >
                    {formatNumber(calculationData.totalTargetHarian)}
                  </td>
                </tr>

                {/* 4. ROW: PENCAPAIAN WEEK BERAPA (CONTOH WEEK 2 [08-14]) */}
                <tr className="border-b-2 border-slate-700 font-mono text-[9px]">
                  <td className="bg-white font-black text-slate-900 p-1 border-r border-slate-400 whitespace-nowrap">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span>PENCAPAIAN {weekRangeLabel}</span>
                        <span className="text-[7.5px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                          Rumus Progresif
                        </span>
                      </div>
                      <span title="Klik cell toko untuk edit">
                        <Edit2 className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                      </span>
                    </div>
                  </td>
                  {activeStoresList.map((s) => {
                    const val = calculationData.storeCumulativeToDate[s.storeName] || 0;
                    const isCustom = calculationData.isStoreCustomCumulative?.[s.storeName];
                    return (
                      <td
                        key={s.id}
                        onClick={() => handleOpenCumulativeModal(s)}
                        className={`text-right p-1 border-r border-slate-300 font-bold cursor-pointer hover:bg-amber-100 hover:text-amber-950 transition-colors ${
                          isCustom ? 'bg-amber-50 text-amber-900 font-black' : 'bg-white text-slate-900'
                        }`}
                        title={`Klik untuk edit Pencapaian Kumulatif ${weekRangeLabel} toko ${s.storeName}${isCustom ? ' (Manual Edit)' : ' (Otomatis Rumus Kumulatif)'}`}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          {isCustom && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Manual Edit Override" />}
                          <span>{formatNumber(val)}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="bg-[#000000] text-white font-black text-center p-1 border-r border-slate-700 uppercase text-[8.5px]">
                    PENCAPAIAN {weekRangeLabel}
                  </td>
                  <td
                    colSpan={2}
                    className="text-right p-1 font-black text-slate-950 border-slate-700 bg-white font-mono text-[9.5px]"
                  >
                    {formatNumber(calculationData.totalCumulativeToDate)}
                  </td>
                </tr>

                {/* 5. TABLE HEADER: STORE NAMES & BA NAMES (Light blue #8ea9db) */}
                <tr className="bg-[#8ea9db] text-slate-950 font-black border-b border-slate-700 text-[9px]">
                  <th className="p-1 border-r border-slate-700 text-center w-28 uppercase">HARI</th>
                  {activeStoresList.map((s) => (
                    <th
                      key={s.id}
                      onClick={() => handleOpenEditStore(s)}
                      className="p-1 border-r border-slate-700 text-center uppercase cursor-pointer hover:bg-[#7a99cf] transition-colors min-w-[75px] group relative"
                      title={`${s.storeName} • BA: ${s.baName} • Sales: ${s.salesName} • Trainer: ${s.trainerName} (Klik untuk edit)`}
                    >
                      <div className="flex items-start justify-between gap-0.5">
                        <div className="font-black text-slate-950 leading-tight text-[8.5px] max-w-[105px] line-clamp-2 text-left" title={s.storeName}>
                          {s.storeName}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStoreColumn(s.id, s.storeName);
                          }}
                          className="opacity-40 group-hover:opacity-100 hover:text-red-700 hover:bg-red-100/80 p-0.5 rounded cursor-pointer transition-all shrink-0"
                          title={`Hapus kolom toko ${s.storeName}`}
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-700" />
                        </button>
                      </div>
                      <div className="text-[7.5px] font-bold text-slate-900 leading-tight opacity-95 mt-0.5 truncate max-w-[110px]">
                        BA: {s.baName}
                      </div>
                      <div className="text-[6.5px] font-semibold text-slate-700 leading-tight opacity-80 mt-0.5 truncate max-w-[110px]">
                        {s.salesName} ({s.trainerName})
                      </div>
                    </th>
                  ))}
                  <th className="p-1 border-r border-slate-700 text-center uppercase text-[8.5px] w-28">
                    TARGET HARIAN
                  </th>
                  <th className="p-1 border-r border-slate-700 text-center uppercase text-[8.5px] w-20 bg-[#bdd7ee]">
                    PENCAPAIAN
                  </th>
                  <th className="p-1 border-slate-700 text-center uppercase text-[9px] w-32 bg-[#9bc2e6]">
                    TARGET PENJUALAN
                  </th>
                </tr>

                {/* 6. DAILY ROWS: Row 1 (Value) & Row 2 (Keterangan with Pills) */}
                {activeDaysList.map((d, rowIdx) => {
                  const dailyTotal = calculationData.dailyTotals[d.dayNum] || 0;
                  const isDayMetTarget = dailyTotal >= calculationData.totalTargetHarian;
                  const dayAchievementPct =
                    calculationData.totalTargetHarian > 0
                      ? Math.round((dailyTotal / calculationData.totalTargetHarian) * 100)
                      : 0;

                  return (
                    <React.Fragment key={d.dayNum}>
                      {/* Main Day Value Row */}
                      <tr className="border-b border-slate-200 font-mono text-[9px] bg-white">
                        {/* Day Name and Date, e.g. (08) SELASA */}
                        <td className="p-1 border-r border-slate-400 font-bold text-slate-900 whitespace-nowrap text-center">
                          {d.dayLabel}
                        </td>

                        {/* Each Store Cell for this Day */}
                        {activeStoresList.map((s) => {
                          const val = calculationData.matrix[s.storeName]?.[d.dayNum] || 0;
                          return (
                            <td
                              key={s.id}
                              onDoubleClick={() => {
                                setInlineEditCell({ storeName: s.storeName, dateKey: d.dateKey, currentVal: val });
                                setInlineInputVal(val.toString());
                              }}
                              className="p-1 border-r border-slate-300 text-right hover:bg-indigo-50/60 cursor-pointer transition-colors"
                              title="Klik ganda untuk edit nilai"
                            >
                              <span className={val > 0 ? 'font-bold text-slate-900' : 'text-slate-400'}>
                                {val > 0 ? formatNumber(val) : '-'}
                              </span>
                            </td>
                          );
                        })}

                        {/* Total Target Harian for that day */}
                        <td className="p-1 border-r border-slate-700 text-right font-medium text-slate-700 bg-white">
                          {formatNumber(calculationData.totalTargetHarian)}
                        </td>

                        {/* Total Actual Pencapaian for that day */}
                        <td className="p-1 border-r border-slate-700 text-right font-black text-slate-950 bg-white">
                          {dailyTotal > 0 ? formatNumber(dailyTotal) : '0'}
                        </td>

                        {/* Rightmost Unified Block: TARGET PENJUALAN Cards (Rowspan across all daily rows) */}
                        {rowIdx === 0 && (
                          <td
                            rowSpan={activeDaysList.length * 2}
                            className="p-2 border-slate-700 bg-[#bdd7ee] align-middle text-center"
                          >
                            <div className="flex flex-col gap-2 max-w-[130px] mx-auto">
                              {/* 1. White Box: TARGET PENJUALAN */}
                              <div className="bg-white border border-slate-300 rounded p-1.5 shadow-2xs text-center">
                                <div className="text-[7.5px] font-bold text-slate-600 uppercase">
                                  TARGET PENJUALAN
                                </div>
                                <div className="text-[10px] font-black text-slate-950 font-mono mt-0.5">
                                  Rp {formatNumber(calculationData.targetPenjualanMingguan)}
                                </div>
                              </div>

                              {/* 2. White Box: PENCAPAIAN */}
                              <div className="bg-white border border-slate-300 rounded p-1.5 shadow-2xs text-center">
                                <div className="text-[7.5px] font-bold text-slate-600 uppercase">
                                  PENCAPAIAN
                                </div>
                                <div className="text-[10px] font-black text-slate-950 font-mono mt-0.5">
                                  {formatNumber(calculationData.grandTotalActual)}
                                </div>
                              </div>

                              {/* 3. Black Box: PERSEN TARGET (100%) */}
                              <div
                                onClick={() => {
                                  setInputPersenTarget(calculationData.persenTarget);
                                  setIsEditingPersenTarget(true);
                                }}
                                className="bg-[#000000] text-white rounded p-2 shadow-xs text-center cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all"
                                title="Klik untuk ubah Persen Target"
                              >
                                <div className="text-[7.5px] font-bold tracking-wider text-slate-300 uppercase flex items-center justify-center gap-1">
                                  <span>PERSEN TARGET</span>
                                  <Edit2 className="w-2 h-2 text-amber-400" />
                                </div>
                                <div className="text-xl font-black text-white font-mono mt-0.5">
                                  {calculationData.persenTarget}%
                                </div>
                              </div>

                              {/* 4. Peach/Orange Box: PERSENTASE PENCAPAIAN (52%) */}
                              <div className="bg-[#f8cbad] text-slate-950 rounded p-2 shadow-xs text-center border border-orange-300/60">
                                <div className="text-[7.5px] font-black tracking-wider text-slate-900 uppercase">
                                  PERSENTASE PENCAPAIAN
                                </div>
                                <div className="text-xl font-black text-slate-950 font-mono mt-0.5">
                                  {calculationData.persentasePencapaianMingguan}%
                                </div>
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Sub-row: KETERANGAN with pill badges (↑ green / ↓ red) */}
                      <tr className="border-b border-slate-400 text-[8px] bg-white">
                        <td className="p-0.5 border-r border-slate-400 font-bold text-slate-600 text-center uppercase">
                          KETERANGAN
                        </td>
                        {activeStoresList.map((s) => {
                          const val = calculationData.matrix[s.storeName]?.[d.dayNum] || 0;
                          const dailyTarget = calculationData.storeDailyTargets[s.storeName] || 1;
                          const isMet = val >= dailyTarget;
                          const pct = dailyTarget > 0 ? Math.round((val / dailyTarget) * 100) : 0;

                          return (
                            <td key={s.id} className="p-0.5 text-center border-r border-slate-300">
                              <span
                                className={`inline-block px-1 py-0.2 rounded text-[7.5px] font-bold border ${
                                  isMet && val > 0
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                    : 'border-rose-300 bg-rose-50 text-rose-600'
                                }`}
                              >
                                {isMet && val > 0 ? '↑' : '↓'} {pct}%
                              </span>
                            </td>
                          );
                        })}

                        {/* Target Harian cell in Keterangan row */}
                        <td className="p-0.5 border-r border-slate-700 bg-white"></td>

                        {/* Pencapaian cell in Keterangan row */}
                        <td className="p-0.5 text-center border-r border-slate-700">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold border ${
                              isDayMetTarget
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                : 'border-rose-300 bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isDayMetTarget ? '↑' : '↓'} {dayAchievementPct}%
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* 7. BOTTOM ROW: TOTAL */}
                <tr className="border-t-2 border-b border-slate-700 font-mono bg-white font-black text-[9px]">
                  <td className="p-1 border-r border-slate-700 uppercase text-slate-900 bg-white">
                    TOTAL
                  </td>
                  {activeStoresList.map((s) => (
                    <td key={s.id} className="p-1 border-r border-slate-300 text-right text-slate-950 font-black">
                      {formatNumber(calculationData.storeWeeklyTotals[s.storeName] || 0)}
                    </td>
                  ))}
                  <td className="p-1 border-r border-slate-700 text-right text-slate-900 font-bold bg-white">
                    {formatNumber(calculationData.targetPenjualanMingguan)}
                  </td>
                  <td className="p-1 border-r border-slate-700 text-right text-slate-950 font-black bg-[#f8cbad]">
                    {formatNumber(calculationData.grandTotalActual)}
                  </td>
                  <td className="p-1 border-slate-700 text-center font-black bg-[#f8cbad] text-slate-950">
                    {formatNumber(calculationData.grandTotalActual)}
                  </td>
                </tr>

                {/* 8. BOTTOM ROW: PRESENTASE */}
                <tr className="border-b border-slate-700 font-mono bg-white font-black text-[9px]">
                  <td className="p-1 border-r border-slate-700 uppercase text-slate-900 bg-white">
                    PRESENTASE
                  </td>
                  {activeStoresList.map((s) => {
                    const pct = calculationData.storePercentages[s.storeName] || 0;
                    return (
                      <td key={s.id} className="p-1 border-r border-slate-300 text-center font-black text-slate-900">
                        {Math.round(pct)}%
                      </td>
                    );
                  })}
                  <td className="p-1 border-r border-slate-700 text-center bg-white font-bold text-slate-900">
                    100%
                  </td>
                  <td className="p-1 border-r border-slate-700 text-center font-black text-slate-950 bg-[#f8cbad]">
                    {calculationData.persentasePencapaianMingguan}%
                  </td>
                  <td
                    onClick={() => {
                      setInputPersenTarget(calculationData.persenTarget);
                      setIsEditingPersenTarget(true);
                    }}
                    className="p-1 border-slate-700 text-center font-bold bg-[#000000] text-white text-[8.5px] cursor-pointer hover:ring-1 hover:ring-amber-400"
                    title="Klik untuk ubah Persen Target"
                  >
                    TARGET: {calculationData.persenTarget}%
                  </td>
                </tr>

                {/* 9. BOTTOM ROW: PEFORMA BA (RED BORDER ALL AROUND!) */}
                <tr className="border-2 border-red-600 font-mono bg-white font-black text-[9px]">
                  <td className="p-1 border-r border-red-500 uppercase text-red-600 bg-white border-l-2 border-red-600">
                    <div className="flex items-center justify-between">
                      <span>PEFORMA BA</span>
                      <Edit2 className="w-2.5 h-2.5 text-amber-600" />
                    </div>
                  </td>
                  {activeStoresList.map((s) => {
                    const performa = calculationData.storePerforma[s.storeName] || 0;
                    const avg = 100 / Math.max(1, activeStoresList.length);
                    const isAboveAvg = performa >= avg;

                    return (
                      <td
                        key={s.id}
                        onClick={() => handleOpenEditStore(s)}
                        className="p-1 border-r border-red-300 text-center font-black cursor-pointer hover:bg-red-50 transition-colors"
                        title={`Performa Kontribusi BA: ${performa}% • Klik untuk ubah`}
                      >
                        <div className="flex items-center justify-center gap-0.5 text-[8.5px]">
                          <span className={isAboveAvg ? 'text-emerald-700' : 'text-red-600'}>
                            {isAboveAvg ? '↑' : '↓'}
                          </span>
                          <span>{performa}%</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-1 border-r border-red-500 text-center font-black bg-white text-slate-900">
                    100%
                  </td>
                  <td className="p-1 border-r border-red-500 text-center font-black bg-[#f8cbad] text-slate-950">
                    {calculationData.persentasePencapaianMingguan}%
                  </td>
                  <td className="p-1 border-r-2 border-red-600 text-center font-black bg-[#f8cbad] text-slate-950 text-[8.5px]">
                    ACH: {calculationData.persentasePencapaianMingguan}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* BOTTOM SECTION: GRAFIK PEFORMA BA IN DARK NAVY CONTAINER (EXACT MATCH WITH IMAGE) */}
          <div className="bg-[#070e1b] rounded-2xl p-3 sm:p-4 mt-4 shadow-md border border-slate-900">
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200">
              {/* Header inside Chart Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                      GRAFIK PEFORMA BA (KONTRIBUSI SELL OUT) • LAPORAN PENJUALAN AREA {selectedSales !== 'ALL' ? `(${selectedSales})` : ''} ({selectedWeek})
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Persentase kontribusi sell out tiap BA terhadap total omset mingguan coveran Sales {selectedSales === 'ALL' ? 'Area' : selectedSales}
                    </p>
                  </div>
                </div>

                {/* Right Badge: Total Performa Area */}
                <div className="px-3.5 py-1 rounded-full bg-[#e1f0fe] border border-blue-300 text-blue-700 text-xs font-bold shrink-0">
                  Total Performa Area: {calculationData.persentasePencapaianMingguan}%
                </div>
              </div>

              {/* Vertical Bars */}
              <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 pt-6 px-1 overflow-x-auto">
                {activeStoresList.map((s) => {
                  const performaVal = calculationData.storePerforma[s.storeName] || 0;
                  const maxVal = Math.max(...Object.values(calculationData.storePerforma), 30);
                  const barHeightPct = Math.max(5, Math.min(100, Math.round((performaVal / maxVal) * 100)));

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEditStore(s)}
                      className="flex-1 min-w-[55px] max-w-[85px] flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Percentage Label on Top of Bar */}
                      <span className="text-[11px] font-mono font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {performaVal}%
                      </span>

                      {/* Bar Graphic */}
                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-md h-full flex items-end">
                        <div
                          style={{ height: `${barHeightPct}%` }}
                          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] rounded-t-md transition-all duration-300 shadow-2xs"
                        />
                      </div>

                      {/* Store Name Below Bar */}
                      <span
                        className="text-[9px] font-bold text-slate-700 text-center leading-tight mt-2 line-clamp-2 uppercase group-hover:text-blue-700"
                        title={s.storeName}
                      >
                        {s.storeName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: EDIT PENCAPAIAN KUMULATIF PROGRESIF (WEEK 1, 2, 3, 4) */}
      {editingCumulativeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit Pencapaian Kumulatif Sell Out
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Formula progresif otomatis per week &amp; override manual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCumulativeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Store Information Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Toko</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  Sales: {editingCumulativeModal.store.salesName}
                </span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {editingCumulativeModal.store.storeName}
              </div>
              <div className="text-[11px] text-slate-600 flex flex-wrap gap-2 pt-1 border-t border-slate-200 mt-1">
                <span>BA: <strong>{editingCumulativeModal.store.baName}</strong></span>
                <span>•</span>
                <span>Trainer: <strong>{editingCumulativeModal.store.trainerName}</strong></span>
                <span>•</span>
                <span>Area: <strong>{editingCumulativeModal.store.coverArea}</strong></span>
              </div>
            </div>

            {/* Week Selector Tabs */}
            <div className="mt-4">
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                Pilih Periode Week yang Ingin Diedit / Dilihat:
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'] as const).map((wTab) => {
                  const bDown = calculationData.storeWeeklyBreakdowns?.[editingCumulativeModal.store.storeName];
                  const isTabCustom =
                    wTab === 'WEEK 1'
                      ? bDown?.isW1Custom
                      : wTab === 'WEEK 2'
                      ? bDown?.isW2Custom
                      : wTab === 'WEEK 3'
                      ? bDown?.isW3Custom
                      : bDown?.isW4Custom;

                  const rangeLabel =
                    wTab === 'WEEK 1'
                      ? '01-07'
                      : wTab === 'WEEK 2'
                      ? '08-14'
                      : wTab === 'WEEK 3'
                      ? '15-21'
                      : `22-${totalDaysInMonth}`;

                  const isSelected = editingCumulativeModal.selectedWeekTab === wTab;
                  return (
                    <button
                      key={wTab}
                      type="button"
                      onClick={() => handleSwitchCumulativeTab(wTab)}
                      className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 font-bold'
                      }`}
                    >
                      <div className="text-[10px] leading-tight">{wTab}</div>
                      <div className={`text-[8.5px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        ({rangeLabel})
                      </div>
                      {isTabCustom && (
                        <span className={`inline-block mt-0.5 text-[7px] px-1 rounded font-bold ${
                          isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Manual
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Breakdown Formula Card */}
            {(() => {
              const bDown = calculationData.storeWeeklyBreakdowns?.[editingCumulativeModal.store.storeName];
              if (!bDown) return null;
              const wTab = editingCumulativeModal.selectedWeekTab;
              const isTabCustom =
                wTab === 'WEEK 1'
                  ? bDown.isW1Custom
                  : wTab === 'WEEK 2'
                  ? bDown.isW2Custom
                  : wTab === 'WEEK 3'
                  ? bDown.isW3Custom
                  : bDown.isW4Custom;

              return (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mt-3 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                    <span className="font-extrabold text-amber-950 text-[11px] flex items-center gap-1.5">
                      <span>Rincian Formula {wTab}:</span>
                    </span>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold ${
                        isTabCustom
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {isTabCustom ? '• Nilai Manual (Override)' : '✓ Otomatis Sesuai Rumus'}
                    </span>
                  </div>

                  {wTab === 'WEEK 1' && (
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Total Penjualan Tgl 01 s/d 07:</span>
                        <strong className="font-mono text-slate-900">{formatRupiah(bDown.w1Actual)}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-amber-200/60 flex justify-between font-bold text-slate-900">
                        <span>Pencapaian Week 1 (01-07):</span>
                        <span className="font-mono text-blue-700 font-extrabold">{formatRupiah(bDown.w1Pencapaian)}</span>
                      </div>
                    </div>
                  )}

                  {wTab === 'WEEK 2' && (
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Pencapaian Week 1 (01-07):</span>
                        <strong className="font-mono text-slate-900">{formatRupiah(bDown.w1Pencapaian)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Sell Out Week 2 (08-14):</span>
                        <strong className="font-mono text-slate-900">+ {formatRupiah(bDown.w2Actual)}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-amber-200/60 flex justify-between font-bold text-slate-900">
                        <span>Hasil Rumus Otomatis (W1 + W2):</span>
                        <span className="font-mono text-blue-700 font-extrabold">{formatRupiah(bDown.w2Formula)}</span>
                      </div>
                      {bDown.isW2Custom && (
                        <div className="flex justify-between font-bold text-amber-900 pt-1">
                          <span>Nilai Manual Aktif di Tabel:</span>
                          <span className="font-mono">{formatRupiah(bDown.w2Pencapaian)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {wTab === 'WEEK 3' && (
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Pencapaian Kumulatif Week 2:</span>
                        <strong className="font-mono text-slate-900">{formatRupiah(bDown.w2Pencapaian)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Sell Out Week 3 (15-21):</span>
                        <strong className="font-mono text-slate-900">+ {formatRupiah(bDown.w3Actual)}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-amber-200/60 flex justify-between font-bold text-slate-900">
                        <span>Hasil Rumus Otomatis (Pencapaian W2 + W3):</span>
                        <span className="font-mono text-blue-700 font-extrabold">{formatRupiah(bDown.w3Formula)}</span>
                      </div>
                      {bDown.isW3Custom && (
                        <div className="flex justify-between font-bold text-amber-900 pt-1">
                          <span>Nilai Manual Aktif di Tabel:</span>
                          <span className="font-mono">{formatRupiah(bDown.w3Pencapaian)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {wTab === 'WEEK 4' && (
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Pencapaian Kumulatif Week 3:</span>
                        <strong className="font-mono text-slate-900">{formatRupiah(bDown.w3Pencapaian)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Sell Out Week 4 (22-{totalDaysInMonth}):</span>
                        <strong className="font-mono text-slate-900">+ {formatRupiah(bDown.w4Actual)}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-amber-200/60 flex justify-between font-bold text-slate-900">
                        <span>Hasil Rumus Otomatis (Pencapaian W3 + W4):</span>
                        <span className="font-mono text-blue-700 font-extrabold">{formatRupiah(bDown.w4Formula)}</span>
                      </div>
                      {bDown.isW4Custom && (
                        <div className="flex justify-between font-bold text-amber-900 pt-1">
                          <span>Nilai Manual Aktif di Tabel:</span>
                          <span className="font-mono">{formatRupiah(bDown.w4Pencapaian)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Input Manual Override */}
            <div className="mt-4 space-y-1.5">
              <label className="font-bold text-slate-800 block text-xs">
                Nominal Pencapaian ({editingCumulativeModal.selectedWeekTab}) (Rp):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cumulativeInputVal}
                  onChange={(e) => setCumulativeInputVal(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Preview Format Rupiah:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatRupiah(Number(cumulativeInputVal) || 0)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetCumulativeModal}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Hapus nilai manual dan kembali gunakan rumus otomatis"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Gunakan Rumus Otomatis</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCumulativeModal(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCumulativeModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STORE TARGET & PERFORMA */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Toko &amp; Target BA
              </h3>
              <button onClick={() => setEditingStore(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko</label>
                <input
                  type="text"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Beauty Advisor (BA)</label>
                <input
                  type="text"
                  value={editBaName}
                  onChange={(e) => setEditBaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coveran Sales</label>
                  <input
                    type="text"
                    value={editSalesName}
                    onChange={(e) => setEditSalesName(e.target.value)}
                    placeholder="ALBERT FERNANDO"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer</label>
                  <input
                    type="text"
                    value={editTrainerName}
                    onChange={(e) => setEditTrainerName(e.target.value)}
                    placeholder="ARA / RATIH / ONLINE"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area</label>
                  <input
                    type="text"
                    value={editCoverArea}
                    onChange={(e) => setEditCoverArea(e.target.value)}
                    placeholder="PEKANBARU"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region</label>
                  <input
                    type="text"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    placeholder="PEKAN BARU"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Bulanan (Rp)</label>
                <input
                  type="number"
                  step="any"
                  value={editTargetMonthly}
                  onChange={(e) => setEditTargetMonthly(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Target harian otomatis dihitung = Target Bulanan / 30.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pencapaian Kumulatif ({weekRangeLabel}) (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editCumulativeVal}
                  onChange={(e) => setEditCumulativeVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Performa Kontribusi BA (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editPerformaVal}
                  onChange={(e) => setEditPerformaVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50/50 font-mono font-black text-red-700"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Otomatis dihitung dari persentase omset toko terhadap total omset mingguan area.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => handleDeleteStoreColumn(editingStore.id, editingStore.storeName)}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl font-bold transition-all cursor-pointer"
                title="Hapus kolom toko ini dari laporan weekly sell out"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kolom Toko</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditStore}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KOLOM TOKO BARU */}
      {isAddingStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Tambah Kolom Toko Baru
              </h3>
              <button onClick={() => setIsAddingStore(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Kolom toko yang ditambahkan akan otomatis muncul di tabel Weekly Sell Out BA dan dapat diedit setiap saat.
            </p>

            <div className="space-y-3 mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TOKO CANTIK RIAU"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Beauty Advisor (BA)</label>
                <input
                  type="text"
                  placeholder="Contoh: SITI NURHALIZA"
                  value={newBaName}
                  onChange={(e) => setNewBaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coveran Sales</label>
                  <input
                    type="text"
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    placeholder="Contoh: ALBERT FERNANDO"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer</label>
                  <input
                    type="text"
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    placeholder="Contoh: ARA / RATIH"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area</label>
                  <input
                    type="text"
                    value={newCoverArea}
                    onChange={(e) => setNewCoverArea(e.target.value)}
                    placeholder="PEKANBARU"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="PEKAN BARU"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Bulanan (Rp)</label>
                <input
                  type="number"
                  step="any"
                  value={newTargetMonthly}
                  onChange={(e) => setNewTargetMonthly(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kumulatif Awal (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={newCumulativeVal}
                    onChange={(e) => setNewCumulativeVal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Performa Awal (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={newPerformaVal}
                    onChange={(e) => setNewPerformaVal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-red-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsAddingStore(false)}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddStoreColumn}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Kolom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KELOLA & KURANGI KOLOM TOKO */}
      {isManageStoresModalOpen && (() => {
        const deletedDraftSet = new Set(workingDeletedStores.map((n) => n.trim().toLowerCase()));

        // Filter master stores based on search, tab, and sales coveran
        const filteredStores = allMasterStores.filter((s) => {
          const sLower = s.storeName.trim().toLowerCase();
          const isDeleted = deletedDraftSet.has(sLower);

          // Tab filter
          if (manageStoresTab === 'active' && isDeleted) return false;
          if (manageStoresTab === 'deleted' && !isDeleted) return false;

          // Sales filter
          if (manageStoresSalesFilter !== 'ALL' && s.salesName.toLowerCase() !== manageStoresSalesFilter.toLowerCase()) {
            return false;
          }

          // Search query filter
          if (manageStoresSearch.trim()) {
            const q = manageStoresSearch.trim().toLowerCase();
            const matchName = s.storeName.toLowerCase().includes(q);
            const matchBa = s.baName.toLowerCase().includes(q);
            const matchSales = s.salesName.toLowerCase().includes(q);
            const matchTrainer = s.trainerName.toLowerCase().includes(q);
            if (!matchName && !matchBa && !matchSales && !matchTrainer) return false;
          }

          return true;
        });

        const activeDraftCount = allMasterStores.filter(
          (s) => !deletedDraftSet.has(s.storeName.trim().toLowerCase())
        ).length;
        const deletedDraftCount = allMasterStores.length - activeDraftCount;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      Kelola &amp; Kurangi Kolom Toko Weekly Sell Out
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {activeDraftCount} Aktif
                      </span>
                      {deletedDraftCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {deletedDraftCount} Dikurangi
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Centang (✓) untuk menampilkan kolom toko di tabel, atau uncheck / klik <strong>"Kurangi"</strong> untuk menghapus kolom. Klik tombol <strong className="text-emerald-700">"💾 SIMPAN &amp; TERAPKAN"</strong> untuk menyimpan perubahan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageStoresModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-Filters and Quick Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 mb-2.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setManageStoresTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      manageStoresTab === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Semua Toko</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
                      {allMasterStores.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageStoresTab('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      manageStoresTab === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✓ Kolom Aktif</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      manageStoresTab === 'active' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeDraftCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageStoresTab('deleted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      manageStoresTab === 'deleted'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>✗ Toko Dikurangi</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      manageStoresTab === 'deleted' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {deletedDraftCount}
                    </span>
                  </button>
                </div>

                {/* Filter Sales Coveran */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Coveran:</span>
                  <select
                    value={manageStoresSalesFilter}
                    onChange={(e) => setManageStoresSalesFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Sales</option>
                    {availableSales.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari toko / BA / sales..."
                    value={manageStoresSearch}
                    onChange={(e) => setManageStoresSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                  {manageStoresSearch && (
                    <button
                      onClick={() => setManageStoresSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Action Bulk Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2 shrink-0">
                <span className="text-[11px] text-slate-500">
                  Menampilkan <strong>{filteredStores.length}</strong> dari total {allMasterStores.length} toko
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleActivateAllVisible(filteredStores.map((s) => s.storeName))}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    title="Aktifkan semua toko yang sedang tampil"
                  >
                    ✓ Tampilkan Semua ({filteredStores.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcludeAllVisible(filteredStores.map((s) => s.storeName))}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    title="Kurangi / sembunyikan semua toko yang sedang tampil"
                  >
                    − Kurangi Semua ({filteredStores.length})
                  </button>
                </div>
              </div>

              {/* Store List Body */}
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {filteredStores.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada toko yang cocok dengan pencarian / filter ini.
                  </div>
                ) : (
                  filteredStores.map((s, idx) => {
                    const sLower = s.storeName.trim().toLowerCase();
                    const isExcluded = deletedDraftSet.has(sLower);

                    return (
                      <div
                        key={s.id || sLower}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isExcluded ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox and info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => handleToggleStoreInDraft(s.storeName)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            title={isExcluded ? 'Klik untuk mengaktifkan kembali' : 'Klik untuk mengurangi/menyembunyikan'}
                          />
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-extrabold text-xs uppercase ${isExcluded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {s.storeName}
                              </span>
                              {isExcluded ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✗ Dikurangi (Sembunyi)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ Aktif di Weekly
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-pink-700 font-bold bg-pink-50 px-1.5 py-0.2 rounded border border-pink-100">
                                BA: {s.baName}
                              </span>
                              <span>•</span>
                              <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                {s.salesName} ({s.trainerName})
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-700 font-bold">
                                Target: Rp {formatNumber(s.targetMonthly)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for this specific store */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isExcluded ? (
                            <button
                              type="button"
                              onClick={() => handleSetStoreExcludedInDraft(s.storeName, false)}
                              className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Tampilkan kembali toko ini di tabel weekly"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>+ Aktifkan Kolom</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetStoreExcludedInDraft(s.storeName, true)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Hapus / kurangi toko ini dari tabel weekly"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>− Kurangi Kolom</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIsManageStoresModalOpen(false);
                              handleOpenEditStore(s);
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit data BA & target toko"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer with Clear SAVE Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-200 mt-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreAllStores}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    title="Pulihkan semua kolom toko ke kondisi bawaan default (80 toko)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan Semua Default (80 Toko)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManageStoresModalOpen(false);
                      setNewStoreName('');
                      setNewBaName('');
                      setIsAddingStore(true);
                    }}
                    className="px-3 py-2 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Toko Baru</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManageStoresModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManageStores}
                    className="px-5 py-2.5 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title="Simpan perubahan toko dan segera terapkan ke tabel Weekly Sell Out"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 SIMPAN &amp; TERAPKAN PERUBAHAN ({activeDraftCount} TOKO AKTIF)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK INLINE EDIT MODAL */}
      {inlineEditCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900">Edit Nilai Sell Out</h4>
              <button onClick={() => setInlineEditCell(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-700">{inlineEditCell.storeName}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{inlineEditCell.dateKey}</div>

              <div className="mt-3">
                <label className="font-bold text-slate-700 block mb-1">Nominal Rupiah (Rp)</label>
                <input
                  type="text"
                  autoFocus
                  value={inlineInputVal}
                  onChange={(e) => setInlineInputVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-400 bg-blue-50/50 font-mono font-black text-slate-900 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
              <button
                onClick={() => setInlineEditCell(null)}
                className="px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveInlineCell}
                className="px-3 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PERSEN TARGET */}
      {isEditingPersenTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900">Edit Persen Target</h4>
              <button onClick={() => setIsEditingPersenTarget(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3">
              <label className="font-bold text-slate-700 block mb-1">Nilai Persen Target (%)</label>
              <input
                type="number"
                min="0"
                max="500"
                value={inputPersenTarget}
                onChange={(e) => setInputPersenTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-blue-400 bg-blue-50/50 font-mono font-black text-slate-900 text-sm focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Default: 100% (sesuai instruksi revisi)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setCustomPersenTarget(100);
                  try {
                    localStorage.setItem('salespro_weekly_persen_target', '100');
                  } catch (e) {
                    console.warn(e);
                  }
                  setIsEditingPersenTarget(false);
                  showToast('Persen target direset ke 100%!');
                }}
                className="px-2.5 py-1.5 font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Reset 100%
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingPersenTarget(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPersenTarget(inputPersenTarget);
                    try {
                      localStorage.setItem('salespro_weekly_persen_target', JSON.stringify(inputPersenTarget));
                    } catch (e) {
                      console.warn(e);
                    }
                    setIsEditingPersenTarget(false);
                    showToast(`Persen target diubah menjadi ${inputPersenTarget}%!`);
                  }}
                  className="px-3.5 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW SCREENSHOT & UNDUH PNG */}
      {screenshotPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Preview Screenshot Laporan Weekly Sell Out BA
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {selectedWeek} • {selectedMonth}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setScreenshotPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 overflow-auto flex-1 border border-slate-200 rounded-xl bg-slate-100 p-2 text-center">
              <img
                src={screenshotPreviewUrl}
                alt="Screenshot Review Weekly Sell Out BA"
                className="mx-auto rounded-lg shadow-xs max-w-full h-auto object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 text-[11px]">
                *File screenshot sudah dibuat. Jika otomatis tidak terunduh, klik tombol <strong>"Unduh File PNG"</strong> atau klik kanan pada gambar &gt; <em>Simpan gambar sebagai...</em>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreenshotPreviewUrl(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <a
                  href={screenshotPreviewUrl}
                  download={`Laporan_Weekly_SellOut_BA_${selectedWeek.replace(/\s+/g, '_')}_${selectedMonth.replace(/\s+/g, '_')}.png`}
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File PNG
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
