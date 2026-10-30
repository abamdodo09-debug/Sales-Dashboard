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

// 12 Counter Toko & BA persis sama dengan gambar template image_46f1dab4.png
export const DEFAULT_WEEKLY_STORES: WeeklyStoreConfig[] = [
  {
    id: 'ws-01',
    storeName: 'RIS IDOLA',
    baName: 'FITRI HANDAYANI',
    salesName: 'ILHAMSYAH',
    trainerName: 'Siti Rahmawati',
    coverArea: 'INDRAGIRI',
    region: 'PEKAN BARU',
    targetMonthly: 55000000,
  },
  {
    id: 'ws-02',
    storeName: 'TOKO SEJATI',
    baName: 'SITI RAHMAWATI',
    salesName: 'ILHAMSYAH',
    trainerName: 'Siti Rahmawati',
    coverArea: 'INDRAGIRI',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-03',
    storeName: 'MISS GLAM TEMBILAHAN',
    baName: 'YOLANDA OKTAVIA',
    salesName: 'ILHAMSYAH',
    trainerName: 'Dewi Lestari',
    coverArea: 'INDRAGIRI',
    region: 'DURI',
    targetMonthly: 100000000,
  },
  {
    id: 'ws-04',
    storeName: 'IDOLA AIR MOLEK',
    baName: 'DEWI LESTARI',
    salesName: 'BUDI SANTOSO',
    trainerName: 'Nurul Aini',
    coverArea: 'INDRAGIRI',
    region: 'DUMAI',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-05',
    storeName: 'MY KOSMETIK (PKL KERINCI)',
    baName: 'RINA ANGGRAINI',
    salesName: 'BUDI SANTOSO',
    trainerName: 'Nurul Aini',
    coverArea: 'PELALAWAN',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-06',
    storeName: 'TG TENAGA BARU',
    baName: 'CUT AMELIA',
    salesName: 'LUAR KOTA',
    trainerName: 'Farah Diba',
    coverArea: 'INDRAGIRI',
    region: 'RIAU KEPULAUAN',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-07',
    storeName: 'HIDAYAH BEAUTY PERAWANG',
    baName: 'LILI LESTARI',
    salesName: 'ILHAMSYAH',
    trainerName: 'Siti Rahmawati',
    coverArea: 'SIAK',
    region: 'PEKAN BARU',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-08',
    storeName: 'HIDAYAH BEAUTY KERINCI',
    baName: 'ANISA PUTRI',
    salesName: 'BUDI SANTOSO',
    trainerName: 'Siti Rahmawati',
    coverArea: 'PELALAWAN',
    region: 'PEKAN BARU',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-09',
    storeName: 'MY KOSMETIK SOREK',
    baName: 'DWI WULANDARI',
    salesName: 'LUAR KOTA',
    trainerName: 'Dewi Lestari',
    coverArea: 'PELALAWAN',
    region: 'DURI',
    targetMonthly: 45000000,
  },
  {
    id: 'ws-10',
    storeName: 'TOKO JINAAN STORE',
    baName: 'NURUL AINI',
    salesName: 'ILHAMSYAH',
    trainerName: 'Farah Diba',
    coverArea: 'INDRAGIRI',
    region: 'RIAU KEPULAUAN',
    targetMonthly: 47000000,
  },
  {
    id: 'ws-11',
    storeName: 'CITRA SWALAYAN',
    baName: 'WINDY PRATIWI',
    salesName: 'MAYA SARI',
    trainerName: 'Nurul Aini',
    coverArea: 'DUMAI',
    region: 'DUMAI',
    targetMonthly: 60000000,
  },
  {
    id: 'ws-12',
    storeName: 'NAMA BA (STANDBY)',
    baName: 'BA CADANGAN / STANDBY',
    salesName: 'OPERASIONAL',
    trainerName: 'Farah Diba',
    coverArea: 'AREA',
    region: 'RIAU',
    targetMonthly: 0,
  },
];

// Snapshot default transaksi harian untuk Week 2 (08-14) sesuai persis di gambar:
// Hari 1: (08) SELASA, Hari 2: (09) RABU, Hari 3: (10) KAMIS, Hari 4: (11) JUMAT,
// Hari 5: (12) SABTU, Hari 6: (13) MINGGU, Hari 7: (14) SENIN
const SAMPLE_DAILY_SNAPSHOT: Record<string, number[]> = {
  'RIS IDOLA': [16795300, 0, 0, 0, 0, 0, 0],
  'TOKO SEJATI': [865700, 579500, 287500, 307300, 241400, 696800, 0],
  'MISS GLAM TEMBILAHAN': [1730500, 570100, 484200, 4776950, 3771300, 863500, 0],
  'IDOLA AIR MOLEK': [1801400, 331600, 937900, 2310000, 1935900, 1902900, 0],
  'MY KOSMETIK (PKL KERINCI)': [0, 1785300, 1225000, 628000, 1093300, 1271100, 0],
  'TG TENAGA BARU': [1028300, 465200, 129900, 442200, 0, 0, 0],
  'HIDAYAH BEAUTY PERAWANG': [582900, 1089500, 949000, 914500, 1365000, 1341900, 0],
  'HIDAYAH BEAUTY KERINCI': [1823900, 0, 1897300, 0, 2028600, 1552200, 0],
  'MY KOSMETIK SOREK': [813000, 1276200, 0, 1087850, 1213700, 0, 0],
  'TOKO JINAAN STORE': [1123500, 795100, 0, 151700, 433300, 584300, 0],
  'CITRA SWALAYAN': [0, 0, 0, 0, 0, 0, 0],
  'NAMA BA (STANDBY)': [0, 0, 0, 0, 0, 0, 0],
};

// Snapshot nilai baris ke-3 (PENCAPAIAN WEEK 2 08-14 kumulatif) sesuai persis di gambar
const SAMPLE_CUMULATIVE_SNAPSHOT: Record<string, number> = {
  'RIS IDOLA': 22389200,
  'TOKO SEJATI': 8005750,
  'MISS GLAM TEMBILAHAN': 30432750,
  'IDOLA AIR MOLEK': 13323600,
  'MY KOSMETIK (PKL KERINCI)': 14025850,
  'TG TENAGA BARU': 6314100,
  'HIDAYAH BEAUTY PERAWANG': 18197500,
  'HIDAYAH BEAUTY KERINCI': 16069500,
  'MY KOSMETIK SOREK': 11074050,
  'TOKO JINAAN STORE': 7564700,
  'CITRA SWALAYAN': 0,
  'NAMA BA (STANDBY)': 0,
};

const INDO_DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

const STORAGE_KEY_WEEKLY_STORES = 'salespro_weekly_stores_config_v4';
const STORAGE_KEY_WEEKLY_ACTUALS = 'salespro_weekly_actuals_v4';
const STORAGE_KEY_WEEKLY_PERFORMA = 'salespro_weekly_performa_v4';
const STORAGE_KEY_WEEKLY_CUMULATIVE = 'salespro_weekly_cumulative_v4';

interface ReviewWeeklySellOutBaProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
}

export const ReviewWeeklySellOutBa: React.FC<ReviewWeeklySellOutBaProps> = ({
  records,
  filters,
}) => {
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

  // Store Configuration
  const [storesList, setStoresList] = useState<WeeklyStoreConfig[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_STORES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load storesList from localStorage', e);
    }
    return DEFAULT_WEEKLY_STORES;
  });

  // Filter Coveran Sales (Semua Sales, ILHAMSYAH, BUDI SANTOSO, LUAR KOTA, dll.)
  const [selectedSales, setSelectedSales] = useState<string>(() => {
    return filters.SALES && filters.SALES !== 'ALL' ? filters.SALES : 'ALL';
  });

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

  // Active stores filtered by Sales Coveran and synchronized with Google Sheets data
  const activeStoresList = useMemo(() => {
    let list = [...storesList];

    // Auto-sync additional stores from connected Google Sheet (records) if present
    const existingNames = new Set(storesList.map((s) => s.storeName.trim().toLowerCase()));
    const extraStores: WeeklyStoreConfig[] = [];

    records.forEach((r) => {
      if (!r.NAMA_STORE) return;
      const sLower = r.NAMA_STORE.trim().toLowerCase();
      if (!existingNames.has(sLower)) {
        existingNames.add(sLower);
        extraStores.push({
          id: `gs-store-${sLower.replace(/\s+/g, '-')}`,
          storeName: r.NAMA_STORE.trim(),
          baName: r.BA && r.BA !== '-' ? r.BA.trim() : 'BA COUNTER',
          salesName: r.SALES || 'SALES UMUM',
          trainerName: 'Siti Rahmawati',
          coverArea: r.COVER_AREA || 'AREA BARU',
          region: r.REGION || 'PEKAN BARU',
          targetMonthly: 45000000,
        });
      }
    });

    if (extraStores.length > 0) {
      list = [...list, ...extraStores];
    }

    // Filter strictly by Sales Coveran if a specific Sales is chosen
    if (selectedSales !== 'ALL') {
      return list.filter(
        (s) => (s.salesName || '').toLowerCase() === selectedSales.toLowerCase()
      );
    }

    return list;
  }, [storesList, records, selectedSales]);

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
  const [editPerformaVal, setEditPerformaVal] = useState<number>(0);
  const [editCumulativeVal, setEditCumulativeVal] = useState<number>(0);

  // Quick Inline Edit Cell
  const [inlineEditCell, setInlineEditCell] = useState<{ storeName: string; dateKey: string; currentVal: number } | null>(null);
  const [inlineInputVal, setInlineInputVal] = useState<string>('');

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

  // Transaction Map for fast lookup by store & date (strictly SELL OUT from Google Sheet records)
  const transactionsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
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
        const key = `${r.NAMA_STORE.trim().toLowerCase()}_${rDay}`;
        const val = r.VALUE || 0;
        map[key] = (map[key] || 0) + val;
      }
    }
    return map;
  }, [records, year, monthIdx]);

  // Real cumulative sell out from Day 1 of the month up to the active week from Google Sheets
  const realCumulativeFromRecords = useMemo(() => {
    const map: Record<string, number> = {};
    const maxDay = activeDaysList.length > 0 ? activeDaysList[activeDaysList.length - 1].dayNum : 7;

    for (const r of records) {
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
        const val = r.VALUE || 0;
        map[sKey] = (map[sKey] || 0) + val;
      }
    }
    return map;
  }, [records, year, monthIdx, activeDaysList]);

  // Helper to get Sell Out on a specific day for a store
  const getDailySellOut = (store: WeeklyStoreConfig, dayNum: number, dateKey: string): number => {
    // 1. Check custom user edit override
    const overrideKey = `${store.storeName}_${dateKey}`;
    if (customDailyActuals[overrideKey] !== undefined) {
      return customDailyActuals[overrideKey];
    }

    // 2. Direct lookup in synced Google Sheet transaction records
    const txKey = `${store.storeName.trim().toLowerCase()}_${dayNum}`;
    const sheetVal = transactionsMap[txKey];
    if (sheetVal !== undefined && sheetVal > 0) {
      return sheetVal;
    }

    // 3. Fallback to sample snapshot if Google Sheet doesn't have data for that store/day
    if (selectedWeek === 'WEEK 2' && SAMPLE_DAILY_SNAPSHOT[store.storeName]) {
      const idxInWeek = dayNum - 8;
      if (idxInWeek >= 0 && idxInWeek < SAMPLE_DAILY_SNAPSHOT[store.storeName].length) {
        const sampleVal = SAMPLE_DAILY_SNAPSHOT[store.storeName][idxInWeek];
        if (sampleVal !== undefined) return sampleVal;
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

    // 8. Pencapaian Week Kumulatif (Row 3) - sync with real Google Sheets cumulative
    const storeCumulativeToDate: Record<string, number> = {};
    activeStoresList.forEach((s) => {
      const sKey = s.storeName.trim().toLowerCase();
      if (customCumulative[s.storeName] !== undefined) {
        storeCumulativeToDate[s.storeName] = customCumulative[s.storeName];
      } else if (realCumulativeFromRecords[sKey] && realCumulativeFromRecords[sKey] > 0) {
        storeCumulativeToDate[s.storeName] = realCumulativeFromRecords[sKey];
      } else if (selectedWeek === 'WEEK 2' && SAMPLE_CUMULATIVE_SNAPSHOT[s.storeName] !== undefined) {
        storeCumulativeToDate[s.storeName] = SAMPLE_CUMULATIVE_SNAPSHOT[s.storeName];
      } else {
        storeCumulativeToDate[s.storeName] = Math.round((storeWeeklyTotals[s.storeName] || 0) * 1.35);
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
      persenTarget,
      persentasePencapaianMingguan,
    };
  }, [activeStoresList, activeDaysList, customDailyActuals, customPerformaBa, customCumulative, customPersenTarget, selectedWeek, transactionsMap, realCumulativeFromRecords]);

  // Open Edit Store Modal
  const handleOpenEditStore = (store: WeeklyStoreConfig) => {
    setEditingStore(store);
    setEditTargetMonthly(store.targetMonthly);
    setEditStoreName(store.storeName);
    setEditBaName(store.baName);
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
          storeName: editStoreName || s.storeName,
          baName: editBaName || s.baName,
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
      const newCum = { ...customCumulative, [editingStore.storeName]: editCumulativeVal };
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
    setCustomDailyActuals({});
    setCustomPerformaBa({});
    setCustomCumulative({});
    try {
      localStorage.removeItem(STORAGE_KEY_WEEKLY_STORES);
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

          {/* Reset Template Default Button */}
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reset ke format data template default gambar"
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
                    <div className="flex items-center justify-between">
                      <span>PENCAPAIAN {weekRangeLabel}</span>
                      <Edit2 className="w-2.5 h-2.5 text-amber-600" />
                    </div>
                  </td>
                  {activeStoresList.map((s) => (
                    <td
                      key={s.id}
                      onClick={() => handleOpenEditStore(s)}
                      className="text-right p-1 border-r border-slate-300 font-bold bg-white text-slate-900 cursor-pointer hover:bg-yellow-50"
                      title="Klik untuk edit pencapaian kumulatif"
                    >
                      {formatNumber(calculationData.storeCumulativeToDate[s.storeName] || 0)}
                    </td>
                  ))}
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
                      className="p-1 border-r border-slate-700 text-center uppercase cursor-pointer hover:bg-[#7a99cf] transition-colors"
                      title={`${s.storeName} • BA: ${s.baName}`}
                    >
                      <div className="font-black text-slate-950 leading-tight text-[8.5px]">
                        {s.storeName}
                      </div>
                      <div className="text-[7px] font-bold text-slate-800 leading-tight opacity-90 mt-0.5">
                        {s.baName}
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Beauty Advisor (BA)</label>
                <input
                  type="text"
                  value={editBaName}
                  onChange={(e) => setEditBaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Bulanan (Rp)</label>
                <input
                  type="number"
                  step="1000000"
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
                  step="100000"
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
                  value={editPerformaVal}
                  onChange={(e) => setEditPerformaVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50/50 font-mono font-black text-red-700"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Otomatis dihitung dari persentase omset toko terhadap total omset mingguan area.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditStore}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}

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
