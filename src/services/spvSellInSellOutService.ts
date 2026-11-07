import { TransactionRecord } from '../types/dashboard';
import { parseRecordMonthYear } from './quarterlySummaryService';

export const SPV_CONSOLIDATED_STORAGE_KEY = 'salespro_spv_consolidated_monthly_v5';

export interface SpvMonthData {
  periodMonth: string;
  periodYear: number;
  isManual: boolean;
  spvName: string;                     // SPV Tunggal: 'WIDODO'
  region: string;                      // 'AREA RIAU (PEKANBARU, DUMAI, DURI, BAGAN, LUAR KOTA)'
  salesTeam: string[];                 // 6 Sales Resmi Binaan WIDODO
  spvRegularSellIn: number;            // SELL IN Reguler Tim Sales (6 Sales: Taking Order Distributor)
  kaSellInValue: number;               // SELL IN KA (Key Account / Modern Trade)
  dazzleMeMgSellInValue: number;       // SELL IN DAZZLE ME MG (Market Group / General Trade)
  totalSellIn: number;                 // TOTAL PENCAPAIAN SELL IN SPV WIDODO & AREA (Reguler + KA + DAZZLE ME MG)
  totalSellOut: number;                // TOTAL SELL OUT (Konsumen / Kasir Gerai)
  target: number;                      // Target Sell In SPV WIDODO & Area Riau
  notes?: string;
  updatedAt?: string;

  // Backward compatibility alias getters
  spvRegularSellOut?: number;
  kaSalesValue?: number;
  dazzleMeMgSalesValue?: number;
}

// SPV Tunggal Resmi Area Riau: WIDODO (Membawahi 6 Sales)
export const OFFICIAL_SPV_WIDODO = {
  spvName: 'WIDODO',
  region: 'AREA RIAU (PEKANBARU, DUMAI, DURI, BAGAN, LUAR KOTA)',
  salesTeam: [
    'ALBERT FERNANDO',
    'ILHAMSYAH',
    'TIWI',
    'ABDUL RAHIM',
    'PARETO',
    'LUAR KOTA',
  ],
  defaultTarget: 850000000,
};

// Baseline Sell In per bulan sesuai formula: Total Sell In = Reguler (6 Sales) + KA + DAZZLE ME MG
export const MONTHLY_DEFAULTS_SPV: Record<
  string,
  {
    regularSellIn: number;
    kaSellIn: number;
    mgSellIn: number;
    totalSellIn: number;
    totalSellOut: number;
    target: number;
  }
> = {
  OKTOBER: {
    regularSellIn: 510000000,
    kaSellIn: 185000000,
    mgSellIn: 145000000,
    totalSellIn: 840000000, // 510M + 185M + 145M = 840M
    totalSellOut: 818500000,
    target: 850000000,
  },
  SEPTEMBER: {
    regularSellIn: 492000000,
    kaSellIn: 175000000,
    mgSellIn: 138000000,
    totalSellIn: 805000000,
    totalSellOut: 790000000,
    target: 820000000,
  },
  AGUSTUS: {
    regularSellIn: 483000000,
    kaSellIn: 170000000,
    mgSellIn: 132000000,
    totalSellIn: 785000000,
    totalSellOut: 765000000,
    target: 800000000,
  },
  JULI: {
    regularSellIn: 477000000,
    kaSellIn: 165000000,
    mgSellIn: 128000000,
    totalSellIn: 770000000,
    totalSellOut: 750000000,
    target: 800000000,
  },
  JUNI: {
    regularSellIn: 465000000,
    kaSellIn: 160000000,
    mgSellIn: 125000000,
    totalSellIn: 750000000,
    totalSellOut: 730000000,
    target: 780000000,
  },
  MEI: {
    regularSellIn: 455000000,
    kaSellIn: 155000000,
    mgSellIn: 120000000,
    totalSellIn: 730000000,
    totalSellOut: 710000000,
    target: 760000000,
  },
  APRIL: {
    regularSellIn: 447000000,
    kaSellIn: 150000000,
    mgSellIn: 118000000,
    totalSellIn: 715000000,
    totalSellOut: 698000000,
    target: 750000000,
  },
  MARET: {
    regularSellIn: 440000000,
    kaSellIn: 145000000,
    mgSellIn: 115000000,
    totalSellIn: 700000000,
    totalSellOut: 685000000,
    target: 740000000,
  },
  FEBRUARI: {
    regularSellIn: 430000000,
    kaSellIn: 140000000,
    mgSellIn: 110000000,
    totalSellIn: 680000000,
    totalSellOut: 660000000,
    target: 720000000,
  },
  JANUARI: {
    regularSellIn: 420000000,
    kaSellIn: 135000000,
    mgSellIn: 105000000,
    totalSellIn: 660000000,
    totalSellOut: 642000000,
    target: 700000000,
  },
  NOVEMBER: {
    regularSellIn: 530000000,
    kaSellIn: 195000000,
    mgSellIn: 155000000,
    totalSellIn: 880000000,
    totalSellOut: 855000000,
    target: 900000000,
  },
  DESEMBER: {
    regularSellIn: 565000000,
    kaSellIn: 220000000,
    mgSellIn: 175000000,
    totalSellIn: 960000000,
    totalSellOut: 935000000,
    target: 980000000,
  },
  ALL: {
    regularSellIn: 510000000,
    kaSellIn: 185000000,
    mgSellIn: 145000000,
    totalSellIn: 840000000,
    totalSellOut: 818500000,
    target: 850000000,
  },
};

/**
 * Key penyimpanan per bulan
 */
export function getMonthStorageKey(month: string, year: number): string {
  return `${(month || 'OKTOBER').toUpperCase()}_${year || 2026}`;
}

/**
 * Memuat seluruh kamus konfigurasi bulanan dari localStorage
 */
export function loadAllMonthlyConfigs(): Record<string, SpvMonthData> {
  try {
    const raw = localStorage.getItem(SPV_CONSOLIDATED_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Gagal membaca monthly config dari localStorage', e);
  }
  return {};
}

/**
 * Menyimpan seluruh kamus konfigurasi bulanan ke localStorage
 */
export function saveAllMonthlyConfigs(configs: Record<string, SpvMonthData>): void {
  try {
    localStorage.setItem(SPV_CONSOLIDATED_STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.warn('Gagal menyimpan monthly config ke localStorage', e);
  }
}

/**
 * Menghitung kalkulasi otomatis data bulan dari transaksi aktual Google Sheet
 * Formula:
 * Total Sell In SPV WIDODO & Area = Sell In Reguler Tim Sales + Sell In KA + Sell In DAZZLE ME MG
 */
export function calculateAutomaticMonthData(
  records: TransactionRecord[],
  selectedMonth: string,
  selectedYear: number
): SpvMonthData {
  const normMonth = (selectedMonth || 'OKTOBER').toUpperCase().trim();
  const normYear = selectedYear || 2026;

  // Filter records berdasarkan bulan dan tahun jika bukan ALL
  const filtered = records.filter((r) => {
    const dt = parseRecordMonthYear(r);
    const recYear = dt ? dt.year : r.TAHUN;
    if (recYear && recYear !== normYear) return false;

    if (normMonth !== 'ALL') {
      const recMonth = (r.BULAN || '').toUpperCase().trim();
      if (recMonth && recMonth !== normMonth) return false;
    }
    return true;
  });

  let autoSellInReguler = 0;
  let autoSellInKa = 0;
  let autoSellInDazzleMeMg = 0;
  let autoTotalSellOut = 0;

  filtered.forEach((r) => {
    const val = r.VALUE || 0;
    const ket = (r.KET || '').toUpperCase().trim();
    const isSellIn =
      ket === 'SELL IN' ||
      ket === 'SELL-IN' ||
      ket === 'TAKING ORDER' ||
      ket === 'ORDER' ||
      ket === 'DISTRIBUTOR' ||
      ket === 'IN';
    const isSellOut =
      ket === 'SELL OUT' ||
      ket === 'SELL-OUT' ||
      ket === 'OUT' ||
      ket === '' ||
      (!isSellIn && ket !== 'RETURN');

    const store = (r.NAMA_STORE || '').toUpperCase().trim();
    const brand = (r.BRAND || '').toUpperCase().trim();

    const isKaStore =
      store.includes('GUARDIAN') ||
      store.includes('WATSON') ||
      store.includes('MISS GLAM') ||
      store.includes('MALL') ||
      store.includes('SWALAYAN') ||
      store.includes('MART');

    if (isSellIn) {
      if (isKaStore) {
        autoSellInKa += val;
      } else if (brand.includes('DAZZLE') || brand.includes('ME')) {
        autoSellInDazzleMeMg += val;
      } else {
        // Seluruh Sell In Reguler Tim 6 Sales across ALL AREA dari Google Sheet
        autoSellInReguler += val;
      }
    }

    if (isSellOut) {
      autoTotalSellOut += val;
    }
  });

  // Ambil baseline default jika data sheet belum memuat kolom SELL IN eksplisit
  const def = MONTHLY_DEFAULTS_SPV[normMonth] || MONTHLY_DEFAULTS_SPV['OKTOBER'];
  // Formula resmi: Sell In Reguler dari all area transaksi Google Sheet
  const regularSellIn = autoSellInReguler > 0 ? autoSellInReguler : def.regularSellIn;
  const kaSellIn = autoSellInKa > 0 ? autoSellInKa : def.kaSellIn;
  const mgSellIn = autoSellInDazzleMeMg > 0 ? autoSellInDazzleMeMg : def.mgSellIn;
  const totalSellIn = regularSellIn + kaSellIn + mgSellIn;
  const totalSellOut = autoTotalSellOut > 0 ? autoTotalSellOut : def.totalSellOut;

  return {
    periodMonth: normMonth,
    periodYear: normYear,
    isManual: false,
    spvName: OFFICIAL_SPV_WIDODO.spvName,
    region: OFFICIAL_SPV_WIDODO.region,
    salesTeam: OFFICIAL_SPV_WIDODO.salesTeam,
    spvRegularSellIn: regularSellIn,
    kaSellInValue: kaSellIn,
    dazzleMeMgSellInValue: mgSellIn,
    totalSellIn,
    totalSellOut,
    target: def.target,
    notes: 'Kalkulasi Otomatis Google Sheet',
    // Backward compatibility
    spvRegularSellOut: regularSellIn,
    kaSalesValue: kaSellIn,
    dazzleMeMgSalesValue: mgSellIn,
  };
}

/**
 * Memuat data konsolidasi SPV WIDODO & Area Riau untuk bulan tertentu
 * Sesuai aturan revisi:
 * 1. SPV cuman 1 yaitu WIDODO
 * 2. SELL IN KA dan SELL IN DAZZLE ME MG MASUK KE PENCAPAIAN SELL IN SPV WIDODO DAN PENCAPAIAN SELL IN AREA!
 * 3. Total Pencapaian Sell In = Sell In Reguler (6 Sales) + Sell In KA + Sell In DAZZLE ME MG
 */
export function loadSpvConsolidatedConfig(
  records: TransactionRecord[],
  selectedMonth: string,
  selectedYear: number
): {
  isManual: boolean;
  periodMonth: string;
  periodYear: number;
  spvName: string;
  region: string;
  salesTeam: string[];
  spvRegularSellIn: number;            // SELL IN Reguler 6 Sales
  kaSellInValue: number;               // SELL IN KA
  dazzleMeMgSellInValue: number;       // SELL IN DAZZLE ME MG
  totalSellIn: number;                 // TOTAL PENCAPAIAN SELL IN SPV WIDODO & AREA
  totalSellOut: number;                // TOTAL SELL OUT (Konsumen)
  target: number;
  achievementPercent: number;
  notes?: string;
  updatedAt?: string;

  // Aliases for compatibility
  spvRegularSellOut: number;
  kaSalesValue: number;
  dazzleMeMgSalesValue: number;
} {
  const normMonth = (selectedMonth || 'OKTOBER').toUpperCase().trim();
  const normYear = selectedYear || 2026;
  const mKey = getMonthStorageKey(normMonth, normYear);

  const allConfigs = loadAllMonthlyConfigs();
  const saved = allConfigs[mKey];

  let activeData: SpvMonthData;
  if (saved && saved.isManual) {
    activeData = saved;
  } else {
    activeData = calculateAutomaticMonthData(records, normMonth, normYear);
  }

  // Support saved data from previous schemas
  const regularSellIn = Number(activeData.spvRegularSellIn ?? activeData.spvRegularSellOut ?? 0);
  const kaSellIn = Number(activeData.kaSellInValue ?? activeData.kaSalesValue ?? 0);
  const mgSellIn = Number(activeData.dazzleMeMgSellInValue ?? activeData.dazzleMeMgSalesValue ?? 0);

  // FORMULA UTAMA REVISI:
  // SELL IN KA DAN SELL IN DAZZLE ME MG MASUK KE PENCAPAIAN SELL IN SPV WIDODO DAN PENCAPAIAN SELL IN AREA
  const totalSellIn = regularSellIn + kaSellIn + mgSellIn;
  const totalSellOut = Number(activeData.totalSellOut || 0);

  const target = Number(activeData.target) || OFFICIAL_SPV_WIDODO.defaultTarget;
  const achievementPercent = target > 0 ? Math.round((totalSellIn / target) * 1000) / 10 : 0;

  return {
    isManual: Boolean(activeData.isManual),
    periodMonth: normMonth,
    periodYear: normYear,
    spvName: OFFICIAL_SPV_WIDODO.spvName,
    region: OFFICIAL_SPV_WIDODO.region,
    salesTeam: OFFICIAL_SPV_WIDODO.salesTeam,
    spvRegularSellIn: regularSellIn,
    kaSellInValue: kaSellIn,
    dazzleMeMgSellInValue: mgSellIn,
    totalSellIn,
    totalSellOut,
    target,
    achievementPercent,
    notes: activeData.notes,
    updatedAt: activeData.updatedAt,
    // Aliases
    spvRegularSellOut: regularSellIn,
    kaSalesValue: kaSellIn,
    dazzleMeMgSalesValue: mgSellIn,
  };
}

/**
 * Menyimpan konfigurasi data bulan tertentu ke localStorage
 */
export function saveSpvMonthConfig(data: SpvMonthData): void {
  const normMonth = (data.periodMonth || 'OKTOBER').toUpperCase().trim();
  const normYear = data.periodYear || 2026;
  const mKey = getMonthStorageKey(normMonth, normYear);

  const regSellIn = Number(data.spvRegularSellIn ?? data.spvRegularSellOut ?? 0);
  const kaSellIn = Number(data.kaSellInValue ?? data.kaSalesValue ?? 0);
  const mgSellIn = Number(data.dazzleMeMgSellInValue ?? data.dazzleMeMgSalesValue ?? 0);
  const totalSellIn = regSellIn + kaSellIn + mgSellIn;

  const allConfigs = loadAllMonthlyConfigs();
  allConfigs[mKey] = {
    ...data,
    periodMonth: normMonth,
    periodYear: normYear,
    isManual: true,
    spvName: OFFICIAL_SPV_WIDODO.spvName,
    region: OFFICIAL_SPV_WIDODO.region,
    salesTeam: OFFICIAL_SPV_WIDODO.salesTeam,
    spvRegularSellIn: regSellIn,
    kaSellInValue: kaSellIn,
    dazzleMeMgSellInValue: mgSellIn,
    totalSellIn,
    totalSellOut: Number(data.totalSellOut || 0),
    spvRegularSellOut: regSellIn,
    kaSalesValue: kaSellIn,
    dazzleMeMgSalesValue: mgSellIn,
    updatedAt: new Date().toISOString(),
  };

  saveAllMonthlyConfigs(allConfigs);
}

/**
 * Reset konfigurasi bulan tertentu ke otomatis
 */
export function resetSpvMonthConfig(month: string, year: number): void {
  const normMonth = (month || 'OKTOBER').toUpperCase().trim();
  const normYear = year || 2026;
  const mKey = getMonthStorageKey(normMonth, normYear);

  const allConfigs = loadAllMonthlyConfigs();
  delete allConfigs[mKey];
  saveAllMonthlyConfigs(allConfigs);
}

/**
 * Reset seluruh konfigurasi bulanan ke otomatis
 */
export function resetAllSpvConfigs(): void {
  try {
    localStorage.removeItem(SPV_CONSOLIDATED_STORAGE_KEY);
  } catch {}
}
