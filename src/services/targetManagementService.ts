import {
  TransactionRecord,
  AreaTargetItem,
  SpvTargetItem,
  SalesTargetItem,
  BaTargetItem,
  TrainerTargetItem,
} from '../types/dashboard';
import { calculateSalesSalary, calculateBaSalary } from '../utils/costCalculations';
import {
  loadFocusOverrides,
  saveFocusOverrides,
  calculateFocusProductIncentivePenalty,
  DEFAULT_FOCUS_TARGET_PCS,
} from './focusProductService';

export const STORAGE_KEY_AREA_TARGETS = 'salespro_custom_area_targets';
export const STORAGE_KEY_SPV_TARGETS = 'salespro_custom_spv_targets';
export const STORAGE_KEY_SALES_TARGETS = 'salespro_custom_sales_targets';
export const STORAGE_KEY_BA_NON_LAVOJOY = 'salespro_custom_ba_non_lavojoy_targets';
export const STORAGE_KEY_BA_LAVOJOY = 'salespro_custom_ba_lavojoy_targets';
export const STORAGE_KEY_TRAINER_TARGETS = 'salespro_custom_trainer_targets';
export const STORAGE_KEY_MONTHLY_TARGETS = 'salespro_custom_monthly_targets_v2';

export const DEFAULT_AREA_TARGET = 300000000; // 300 Jt default per area
export const DEFAULT_SPV_TARGET = 450000000;  // 450 Jt default per SPV
export const DEFAULT_SALES_TARGET = 150000000; // 150 Jt default per sales
export const DEFAULT_BA_NON_LAVOJOY_TARGET = 30000000; // 30 Jt default
export const DEFAULT_BA_LAVOJOY_TARGET = 5000000; // 5 Jt default
export const DEFAULT_TRAINER_SELL_OUT_TARGET = 350000000; // 350 Jt default sell out
export const DEFAULT_TRAINER_FOCUS_TARGET_PCS = 500; // 500 Pcs default focus

export interface TrainerTargetConfig {
  id: string;
  trainerName: string;
  areaCovered: string;
  region: string;
  targetSellOut: number;
  targetProdukFokusPcs: number;
  notes?: string;
}

export const DEFAULT_TRAINERS: TrainerTargetConfig[] = [
  {
    id: 'trainer-1',
    trainerName: 'Siti Rahmawati',
    areaCovered: 'AREA BARU & PEKANBARU',
    region: 'PEKAN BARU',
    targetSellOut: 350000000,
    targetProdukFokusPcs: 600,
    notes: 'Trainer Lead - Focus Brand barenbliss & lavojoy',
  },
  {
    id: 'trainer-2',
    trainerName: 'Dewi Lestari',
    areaCovered: 'LUAR KOTA & DURI',
    region: 'DURI',
    targetSellOut: 280000000,
    targetProdukFokusPcs: 450,
    notes: 'Trainer Area Luar Kota - Modern Trade & General Trade',
  },
  {
    id: 'trainer-3',
    trainerName: 'Nurul Aini',
    areaCovered: 'DUMAI & BAGAN',
    region: 'DUMAI',
    targetSellOut: 220000000,
    targetProdukFokusPcs: 380,
    notes: 'Trainer Area Dumai & Toko Kosmetik Mitra',
  },
  {
    id: 'trainer-4',
    trainerName: 'Farah Diba',
    areaCovered: 'SELAT PANJANG & BENGKALIS',
    region: 'RIAU KEPULAUAN',
    targetSellOut: 180000000,
    targetProdukFokusPcs: 300,
    notes: 'Trainer Specialist Produk Fokus & Skincare',
  },
];

// Structure of monthly targets
export interface MonthlyTargetStore {
  [monthKey: string]: {
    sales?: Record<string, number>;
    baNonLavojoy?: Record<string, number>;
    baLavojoy?: Record<string, number>;
    baFocus?: Record<string, number>;
    trainer?: Record<string, { targetSellOut?: number; targetProdukFokusPcs?: number }>;
  };
}

export function loadMonthlyTargets(): MonthlyTargetStore {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MONTHLY_TARGETS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveMonthlyTargets(data: MonthlyTargetStore): void {
  try {
    localStorage.setItem(STORAGE_KEY_MONTHLY_TARGETS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Loaders & Savers for Base Targets
export function loadAreaTargets(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AREA_TARGETS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveAreaTargets(targets: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_AREA_TARGETS, JSON.stringify(targets));
  } catch {
    // ignore
  }
}

export function loadSpvTargets(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SPV_TARGETS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveSpvTargets(targets: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SPV_TARGETS, JSON.stringify(targets));
  } catch {
    // ignore
  }
}

export function loadSalesTargets(monthKey?: string): Record<string, number> {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (monthly[monthKey]?.sales && Object.keys(monthly[monthKey].sales!).length > 0) {
        return { ...loadSalesTargets(), ...monthly[monthKey].sales };
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY_SALES_TARGETS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveSalesTargets(targets: Record<string, number>, monthKey?: string): void {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (!monthly[monthKey]) monthly[monthKey] = {};
      monthly[monthKey].sales = targets;
      saveMonthlyTargets(monthly);
    } else {
      localStorage.setItem(STORAGE_KEY_SALES_TARGETS, JSON.stringify(targets));
    }
  } catch {
    // ignore
  }
}

export function loadBaNonLavojoyTargets(monthKey?: string): Record<string, number> {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (monthly[monthKey]?.baNonLavojoy && Object.keys(monthly[monthKey].baNonLavojoy!).length > 0) {
        return { ...loadBaNonLavojoyTargets(), ...monthly[monthKey].baNonLavojoy };
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY_BA_NON_LAVOJOY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveBaNonLavojoyTargets(targets: Record<string, number>, monthKey?: string): void {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (!monthly[monthKey]) monthly[monthKey] = {};
      monthly[monthKey].baNonLavojoy = targets;
      saveMonthlyTargets(monthly);
    } else {
      localStorage.setItem(STORAGE_KEY_BA_NON_LAVOJOY, JSON.stringify(targets));
    }
  } catch {
    // ignore
  }
}

export function loadBaLavojoyTargets(monthKey?: string): Record<string, number> {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (monthly[monthKey]?.baLavojoy && Object.keys(monthly[monthKey].baLavojoy!).length > 0) {
        return { ...loadBaLavojoyTargets(), ...monthly[monthKey].baLavojoy };
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY_BA_LAVOJOY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveBaLavojoyTargets(targets: Record<string, number>, monthKey?: string): void {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (!monthly[monthKey]) monthly[monthKey] = {};
      monthly[monthKey].baLavojoy = targets;
      saveMonthlyTargets(monthly);
    } else {
      localStorage.setItem(STORAGE_KEY_BA_LAVOJOY, JSON.stringify(targets));
    }
  } catch {
    // ignore
  }
}

export function loadTrainerTargets(monthKey?: string): Record<string, { targetSellOut?: number; targetProdukFokusPcs?: number; notes?: string }> {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (monthly[monthKey]?.trainer && Object.keys(monthly[monthKey].trainer!).length > 0) {
        return { ...loadTrainerTargets(), ...monthly[monthKey].trainer };
      }
    }
    const saved = localStorage.getItem(STORAGE_KEY_TRAINER_TARGETS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveTrainerTargets(
  targets: Record<string, { targetSellOut?: number; targetProdukFokusPcs?: number; notes?: string }>,
  monthKey?: string
): void {
  try {
    if (monthKey && monthKey !== 'ALL') {
      const monthly = loadMonthlyTargets();
      if (!monthly[monthKey]) monthly[monthKey] = {};
      monthly[monthKey].trainer = targets;
      saveMonthlyTargets(monthly);
    } else {
      localStorage.setItem(STORAGE_KEY_TRAINER_TARGETS, JSON.stringify(targets));
    }
  } catch {
    // ignore
  }
}

export interface TargetMatrixData {
  areas: AreaTargetItem[];
  spvs: SpvTargetItem[];
  sales: SalesTargetItem[];
  bas: BaTargetItem[];
  trainers: TrainerTargetItem[];
  summary: {
    totalAreaTarget: number;
    totalAreaActual: number;
    areaAchievementPct: number;
    totalSpvTarget: number;
    totalSpvActual: number;
    spvAchievementPct: number;
    totalSalesTarget: number;
    totalSalesActual: number;
    salesAchievementPct: number;
    totalSalesIncentiveEst: number;
    totalBaTarget: number;
    totalBaActual: number;
    baAchievementPct: number;
    totalBaFocusTargetPcs: number;
    totalBaFocusActualPcs: number;
    baFocusAchievementPct: number;
    totalTrainerTargetSellOut: number;
    totalTrainerActualSellOut: number;
    trainerSellOutAchievementPct: number;
    totalTrainerTargetFocusPcs: number;
    totalTrainerActualFocusPcs: number;
    trainerFocusAchievementPct: number;
  };
}

/**
 * Aggregates complete multi-tier targets and actuals for:
 * 1. Area (Cover Area / Region)
 * 2. SPV (Supervisor)
 * 3. Sales (Sell In Personil)
 * 4. BA (Non-Lavojoy, Lavojoy & Produk Fokus)
 * 5. Trainer (Sell Out & Produk Fokus)
 * Supports monthly filtering and month-specific target overrides.
 */
export function aggregateTargetMatrix(records: TransactionRecord[], selectedMonth?: string): TargetMatrixData {
  let effectiveRecords = records;
  if (selectedMonth && selectedMonth !== 'ALL') {
    const monthQuery = selectedMonth.toUpperCase();
    effectiveRecords = records.filter((r) => {
      if (r.BULAN && r.BULAN.toUpperCase().includes(monthQuery)) return true;
      if (r.TANGGAL && r.TANGGAL.includes(selectedMonth)) return true;
      if (selectedMonth === '2026-10' && (r.BULAN?.toUpperCase().includes('OKT') || r.BULAN?.toUpperCase().includes('OCT') || r.TANGGAL?.includes('2026-10') || r.TANGGAL?.startsWith('10/'))) return true;
      if (selectedMonth === '2026-09' && (r.BULAN?.toUpperCase().includes('SEP') || r.TANGGAL?.includes('2026-09') || r.TANGGAL?.startsWith('9/'))) return true;
      if (selectedMonth === '2026-08' && (r.BULAN?.toUpperCase().includes('AGU') || r.BULAN?.toUpperCase().includes('AUG') || r.TANGGAL?.includes('2026-08') || r.TANGGAL?.startsWith('8/'))) return true;
      return false;
    });
    if (effectiveRecords.length === 0) {
      effectiveRecords = records;
    }
  }

  const customAreaTargets = loadAreaTargets();
  const customSpvTargets = loadSpvTargets();
  const customSalesTargets = loadSalesTargets(selectedMonth);
  const customBaNonLavojoyTargets = loadBaNonLavojoyTargets(selectedMonth);
  const customBaLavojoyTargets = loadBaLavojoyTargets(selectedMonth);
  const customTrainerTargets = loadTrainerTargets(selectedMonth);
  const focusOverrides = loadFocusOverrides();

  // Maps for aggregating raw transactions
  const areaMap: Record<
    string,
    {
      coverArea: string;
      region: string;
      actualSellIn: number;
      actualSellOut: number;
      salesSet: Set<string>;
      spvSet: Set<string>;
      storeSet: Set<string>;
    }
  > = {};

  const spvMap: Record<
    string,
    {
      spvName: string;
      regions: Set<string>;
      coverAreas: Set<string>;
      actualSellIn: number;
      actualSellOut: number;
      salesSet: Set<string>;
      storeSet: Set<string>;
    }
  > = {};

  const salesMap: Record<
    string,
    {
      salesName: string;
      coverArea: string;
      spv: string;
      actualSellIn: number;
      coveredStores: Set<string>;
      coveredBaList: { storeName: string; baName: string; sellOut: number }[];
    }
  > = {};

  const baMap: Record<
    string,
    {
      storeName: string;
      baName: string;
      baNumber: string;
      coverArea: string;
      region: string;
      salesName: string;
      spv: string;
      sellOutNonLavojoy: number;
      sellOutLavojoy: number;
      focusActualPcs: number;
    }
  > = {};

  // Loop through effectiveRecords
  for (const r of effectiveRecords) {
    const areaKey = r.COVER_AREA || 'UNKNOWN';
    const spvKey = r.SPV || 'UNKNOWN';
    const salesKey = r.SALES || 'UNKNOWN';
    const storeKey = r.NAMA_STORE || 'UNKNOWN';
    const val = r.VALUE || 0;
    const qty = Math.max(0, r.QTY || 0);
    const isSellIn = r.KET === 'SELL IN';
    const isSellOut = r.KET === 'SELL OUT' || !r.KET;
    const isFocus = r.PRODUK_FOCUS === 'FOCUS';
    const isLavojoy = (r.BRAND || '').toLowerCase().includes('lavojoy');

    // Area
    if (!areaMap[areaKey]) {
      areaMap[areaKey] = {
        coverArea: areaKey,
        region: r.REGION || '-',
        actualSellIn: 0,
        actualSellOut: 0,
        salesSet: new Set(),
        spvSet: new Set(),
        storeSet: new Set(),
      };
    }
    if (isSellIn) areaMap[areaKey].actualSellIn += val;
    if (isSellOut) areaMap[areaKey].actualSellOut += val;
    if (r.SALES) areaMap[areaKey].salesSet.add(r.SALES);
    if (r.SPV) areaMap[areaKey].spvSet.add(r.SPV);
    if (r.NAMA_STORE) areaMap[areaKey].storeSet.add(r.NAMA_STORE);

    // SPV
    if (!spvMap[spvKey]) {
      spvMap[spvKey] = {
        spvName: spvKey,
        regions: new Set(),
        coverAreas: new Set(),
        actualSellIn: 0,
        actualSellOut: 0,
        salesSet: new Set(),
        storeSet: new Set(),
      };
    }
    if (isSellIn) spvMap[spvKey].actualSellIn += val;
    if (isSellOut) spvMap[spvKey].actualSellOut += val;
    if (r.REGION) spvMap[spvKey].regions.add(r.REGION);
    if (r.COVER_AREA) spvMap[spvKey].coverAreas.add(r.COVER_AREA);
    if (r.SALES) spvMap[spvKey].salesSet.add(r.SALES);
    if (r.NAMA_STORE) spvMap[spvKey].storeSet.add(r.NAMA_STORE);

    // Sales
    if (!salesMap[salesKey]) {
      salesMap[salesKey] = {
        salesName: salesKey,
        coverArea: areaKey,
        spv: spvKey,
        actualSellIn: 0,
        coveredStores: new Set(),
        coveredBaList: [],
      };
    }
    if (isSellIn) salesMap[salesKey].actualSellIn += val;
    if (r.NAMA_STORE) salesMap[salesKey].coveredStores.add(r.NAMA_STORE);

    // BA
    if (r.BA && r.BA !== '-' && r.BA.trim() !== '') {
      if (!baMap[storeKey]) {
        baMap[storeKey] = {
          storeName: storeKey,
          baName: r.BA,
          baNumber: r.BA_Number || 'BA-' + storeKey.slice(0, 3).toUpperCase(),
          coverArea: areaKey,
          region: r.REGION || '-',
          salesName: salesKey,
          spv: spvKey,
          sellOutNonLavojoy: 0,
          sellOutLavojoy: 0,
          focusActualPcs: 0,
        };
      }
      if (isSellOut) {
        if (isLavojoy) {
          baMap[storeKey].sellOutLavojoy += val;
        } else {
          baMap[storeKey].sellOutNonLavojoy += val;
        }
      }
      if (isFocus && (isSellOut || isSellIn)) {
        baMap[storeKey].focusActualPcs += qty;
      }
    }
  }

  // Populate coveredBaList for sales productivity evaluation
  Object.values(baMap).forEach((b) => {
    if (salesMap[b.salesName]) {
      salesMap[b.salesName].coveredBaList.push({
        storeName: b.storeName,
        baName: b.baName,
        sellOut: b.sellOutNonLavojoy + b.sellOutLavojoy,
      });
    }
  });

  // Fallbacks if dataset is empty or filtered
  if (Object.keys(areaMap).length === 0) {
    areaMap['AREA BARU'] = {
      coverArea: 'AREA BARU',
      region: 'PEKAN BARU',
      actualSellIn: 185000000,
      actualSellOut: 160000000,
      salesSet: new Set(['ILHAMSYAH']),
      spvSet: new Set(['WIDODO']),
      storeSet: new Set(['TOKO ALANA BEAUTY', 'SYMPHONY KOSMETIK']),
    };
  }

  // 1. Array Area Targets
  const areas: AreaTargetItem[] = Object.values(areaMap).map((a) => {
    const isCustom = customAreaTargets[a.coverArea] !== undefined;
    const targetOmzet = isCustom ? customAreaTargets[a.coverArea] : DEFAULT_AREA_TARGET;
    const actualSellIn = a.actualSellIn > 0 ? a.actualSellIn : a.actualSellOut;
    const gapOmzet = actualSellIn - targetOmzet;
    const achievementPct = targetOmzet > 0 ? (actualSellIn / targetOmzet) * 100 : 0;
    const status: 'achieved' | 'on_track' | 'lagging' =
      achievementPct >= 100 ? 'achieved' : achievementPct >= 80 ? 'on_track' : 'lagging';

    return {
      coverArea: a.coverArea,
      region: a.region,
      targetOmzet,
      actualSellIn,
      actualSellOut: a.actualSellOut,
      gapOmzet,
      achievementPct,
      status,
      salesCount: a.salesSet.size,
      spvCount: a.spvSet.size,
      storeCount: a.storeSet.size,
      isCustom,
    };
  }).sort((a, b) => b.actualSellIn - a.actualSellIn);

  // 2. Array SPV Targets
  const spvs: SpvTargetItem[] = Object.values(spvMap).map((s) => {
    const isCustom = customSpvTargets[s.spvName] !== undefined;
    const targetOmzet = isCustom ? customSpvTargets[s.spvName] : DEFAULT_SPV_TARGET;
    const actualSellIn = s.actualSellIn > 0 ? s.actualSellIn : s.actualSellOut;
    const gapOmzet = actualSellIn - targetOmzet;
    const achievementPct = targetOmzet > 0 ? (actualSellIn / targetOmzet) * 100 : 0;
    const status: 'achieved' | 'on_track' | 'lagging' =
      achievementPct >= 100 ? 'achieved' : achievementPct >= 80 ? 'on_track' : 'lagging';

    return {
      spvName: s.spvName,
      regions: Array.from(s.regions),
      coverAreas: Array.from(s.coverAreas),
      targetOmzet,
      actualSellIn,
      actualSellOut: s.actualSellOut,
      gapOmzet,
      achievementPct,
      status,
      salesCount: s.salesSet.size,
      storeCount: s.storeSet.size,
      isCustom,
    };
  }).sort((a, b) => b.actualSellIn - a.actualSellIn);

  // 3. Array Sales Targets
  const sales: SalesTargetItem[] = Object.values(salesMap).map((sl) => {
    const isCustom = customSalesTargets[sl.salesName] !== undefined;
    const targetSellIn = isCustom ? customSalesTargets[sl.salesName] : DEFAULT_SALES_TARGET;
    const salaryData = calculateSalesSalary(
      sl.salesName,
      sl.actualSellIn,
      targetSellIn,
      sl.coverArea,
      sl.spv,
      sl.coveredBaList
    );
    const gap = sl.actualSellIn - targetSellIn;
    const status: 'achieved' | 'on_track' | 'lagging' =
      salaryData.achievementPercent >= 100
        ? 'achieved'
        : salaryData.achievementPercent >= 80
        ? 'on_track'
        : 'lagging';

    return {
      salesName: sl.salesName,
      coverArea: sl.coverArea,
      spv: sl.spv,
      targetSellIn,
      actualSellIn: sl.actualSellIn,
      achievementPct: salaryData.achievementPercent,
      incentivePercent: salaryData.incentivePercent,
      incentiveNominal: salaryData.incentiveNominal,
      status,
      coveredBaCount: sl.coveredBaList.length,
      isCustom,
    };
  }).sort((a, b) => b.actualSellIn - a.actualSellIn);

  // 4. Array BA Targets
  const bas: BaTargetItem[] = Object.values(baMap).map((b) => {
    const isNonLavojoyCustom = customBaNonLavojoyTargets[b.storeName] !== undefined;
    const isLavojoyCustom = customBaLavojoyTargets[b.storeName] !== undefined;
    const targetNonLavojoy = isNonLavojoyCustom
      ? customBaNonLavojoyTargets[b.storeName]
      : DEFAULT_BA_NON_LAVOJOY_TARGET;
    const targetLavojoy = isLavojoyCustom
      ? customBaLavojoyTargets[b.storeName]
      : DEFAULT_BA_LAVOJOY_TARGET;

    const ov = focusOverrides[b.storeName] || focusOverrides[b.baName] || {};
    const targetFocusPcs = ov.targetPcs !== undefined && ov.targetPcs > 0 ? ov.targetPcs : DEFAULT_FOCUS_TARGET_PCS;
    const actualFocusPcs = ov.customActualPcs !== undefined && ov.customActualPcs >= 0 ? ov.customActualPcs : b.focusActualPcs;

    const focusCalc = calculateFocusProductIncentivePenalty(
      targetFocusPcs,
      actualFocusPcs,
      ov.customIncentive,
      ov.customPenalty
    );

    const achievementNonLavojoyPct =
      targetNonLavojoy > 0 ? (b.sellOutNonLavojoy / targetNonLavojoy) * 100 : 0;
    const achievementLavojoyPct =
      targetLavojoy > 0 ? (b.sellOutLavojoy / targetLavojoy) * 100 : 0;

    return {
      storeName: b.storeName,
      baName: b.baName,
      baNumber: b.baNumber,
      coverArea: b.coverArea,
      region: b.region,
      salesName: b.salesName,
      spv: b.spv,
      targetNonLavojoy,
      actualNonLavojoy: b.sellOutNonLavojoy,
      achievementNonLavojoyPct,
      targetLavojoy,
      actualLavojoy: b.sellOutLavojoy,
      achievementLavojoyPct,
      targetFocusPcs,
      actualFocusPcs,
      achievementFocusPct: focusCalc.achievementPct,
      focusStatus: focusCalc.status,
      focusIncentive: focusCalc.incentive,
      focusPenalty: focusCalc.penalty,
      isCustom: Boolean(isNonLavojoyCustom || isLavojoyCustom || ov.targetPcs !== undefined),
    };
  }).sort((a, b) => (b.actualNonLavojoy + b.actualLavojoy) - (a.actualNonLavojoy + a.actualLavojoy));

  // 5. Array Trainer Targets (Sell Out & Produk Fokus)
  const trainers: TrainerTargetItem[] = DEFAULT_TRAINERS.map((t) => {
    const customConfig = customTrainerTargets[t.id] || customTrainerTargets[t.trainerName] || {};
    const targetSellOut =
      customConfig.targetSellOut !== undefined && customConfig.targetSellOut > 0
        ? customConfig.targetSellOut
        : t.targetSellOut || DEFAULT_TRAINER_SELL_OUT_TARGET;
    const targetProdukFokusPcs =
      customConfig.targetProdukFokusPcs !== undefined && customConfig.targetProdukFokusPcs > 0
        ? customConfig.targetProdukFokusPcs
        : t.targetProdukFokusPcs || DEFAULT_TRAINER_FOCUS_TARGET_PCS;

    // Filter relevant BA and transactions for this trainer's area
    const matchingBas = Object.values(baMap).filter((b) => {
      if (t.areaCovered.includes(b.coverArea)) return true;
      if (t.region.includes(b.region)) return true;
      return false;
    });

    const baSupervisedCount = matchingBas.length > 0 ? matchingBas.length : Math.max(1, Math.floor(Object.keys(baMap).length / 4));
    const storeSupervisedCount = baSupervisedCount;

    // Sum actual sell out from matching records or proportionate
    let actualSellOut = matchingBas.reduce((acc, b) => acc + b.sellOutNonLavojoy + b.sellOutLavojoy, 0);
    let actualProdukFokusPcs = matchingBas.reduce((acc, b) => acc + b.focusActualPcs, 0);

    // If no direct area match, calculate based on overall team contribution
    if (actualSellOut === 0) {
      const totalAllSellOut = Object.values(baMap).reduce((acc, b) => acc + b.sellOutNonLavojoy + b.sellOutLavojoy, 0);
      actualSellOut = Math.round(totalAllSellOut / DEFAULT_TRAINERS.length);
      const totalAllFocus = Object.values(baMap).reduce((acc, b) => acc + b.focusActualPcs, 0);
      actualProdukFokusPcs = Math.round(totalAllFocus / DEFAULT_TRAINERS.length);
    }

    const achievementSellOutPct = targetSellOut > 0 ? (actualSellOut / targetSellOut) * 100 : 0;
    const achievementProdukFokusPct = targetProdukFokusPcs > 0 ? (actualProdukFokusPcs / targetProdukFokusPcs) * 100 : 0;

    const status: 'achieved' | 'on_track' | 'lagging' =
      achievementSellOutPct >= 100 && achievementProdukFokusPct >= 100
        ? 'achieved'
        : achievementSellOutPct >= 80 || achievementProdukFokusPct >= 80
        ? 'on_track'
        : 'lagging';

    const isCustom = Boolean(customConfig.targetSellOut !== undefined || customConfig.targetProdukFokusPcs !== undefined);

    return {
      id: t.id,
      trainerName: t.trainerName,
      areaCovered: t.areaCovered,
      region: t.region,
      targetSellOut,
      actualSellOut,
      achievementSellOutPct,
      targetProdukFokusPcs,
      actualProdukFokusPcs,
      achievementProdukFokusPct,
      status,
      baSupervisedCount,
      storeSupervisedCount,
      monthPeriod: selectedMonth || 'ALL',
      notes: customConfig.notes || t.notes,
      isCustom,
    };
  });

  // Overall summaries
  const totalAreaTarget = areas.reduce((acc, a) => acc + a.targetOmzet, 0);
  const totalAreaActual = areas.reduce((acc, a) => acc + a.actualSellIn, 0);
  const areaAchievementPct = totalAreaTarget > 0 ? (totalAreaActual / totalAreaTarget) * 100 : 0;

  const totalSpvTarget = spvs.reduce((acc, s) => acc + s.targetOmzet, 0);
  const totalSpvActual = spvs.reduce((acc, s) => acc + s.actualSellIn, 0);
  const spvAchievementPct = totalSpvTarget > 0 ? (totalSpvActual / totalSpvTarget) * 100 : 0;

  const totalSalesTarget = sales.reduce((acc, s) => acc + s.targetSellIn, 0);
  const totalSalesActual = sales.reduce((acc, s) => acc + s.actualSellIn, 0);
  const salesAchievementPct = totalSalesTarget > 0 ? (totalSalesActual / totalSalesTarget) * 100 : 0;
  const totalSalesIncentiveEst = sales.reduce((acc, s) => acc + s.incentiveNominal, 0);

  const totalBaTarget = bas.reduce((acc, b) => acc + b.targetNonLavojoy + b.targetLavojoy, 0);
  const totalBaActual = bas.reduce((acc, b) => acc + b.actualNonLavojoy + b.actualLavojoy, 0);
  const baAchievementPct = totalBaTarget > 0 ? (totalBaActual / totalBaTarget) * 100 : 0;

  const totalBaFocusTargetPcs = bas.reduce((acc, b) => acc + b.targetFocusPcs, 0);
  const totalBaFocusActualPcs = bas.reduce((acc, b) => acc + b.actualFocusPcs, 0);
  const baFocusAchievementPct = totalBaFocusTargetPcs > 0 ? (totalBaFocusActualPcs / totalBaFocusTargetPcs) * 100 : 0;

  const totalTrainerTargetSellOut = trainers.reduce((acc, t) => acc + t.targetSellOut, 0);
  const totalTrainerActualSellOut = trainers.reduce((acc, t) => acc + t.actualSellOut, 0);
  const trainerSellOutAchievementPct = totalTrainerTargetSellOut > 0 ? (totalTrainerActualSellOut / totalTrainerTargetSellOut) * 100 : 0;

  const totalTrainerTargetFocusPcs = trainers.reduce((acc, t) => acc + t.targetProdukFokusPcs, 0);
  const totalTrainerActualFocusPcs = trainers.reduce((acc, t) => acc + t.actualProdukFokusPcs, 0);
  const trainerFocusAchievementPct = totalTrainerTargetFocusPcs > 0 ? (totalTrainerActualFocusPcs / totalTrainerTargetFocusPcs) * 100 : 0;

  return {
    areas,
    spvs,
    sales,
    bas,
    trainers,
    summary: {
      totalAreaTarget,
      totalAreaActual,
      areaAchievementPct,
      totalSpvTarget,
      totalSpvActual,
      spvAchievementPct,
      totalSalesTarget,
      totalSalesActual,
      salesAchievementPct,
      totalSalesIncentiveEst,
      totalBaTarget,
      totalBaActual,
      baAchievementPct,
      totalBaFocusTargetPcs,
      totalBaFocusActualPcs,
      baFocusAchievementPct,
      totalTrainerTargetSellOut,
      totalTrainerActualSellOut,
      trainerSellOutAchievementPct,
      totalTrainerTargetFocusPcs,
      totalTrainerActualFocusPcs,
      trainerFocusAchievementPct,
    },
  };
}
