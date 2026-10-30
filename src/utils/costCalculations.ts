import {
  TransactionRecord,
  SalesSalaryItem,
  BaSalaryItem,
  TrainerSalaryItem,
  AreaCostSummary,
  SalesCoveredBaItem,
  BaFocusProductOverride,
} from '../types/dashboard';
import { loadFocusOverrides, DEFAULT_FOCUS_TARGET_PCS } from '../services/focusProductService';
import { loadKpiTrainerData } from '../services/kpiTrainerService';
import { getTrainerForRecord } from './analytics';

export const DEFAULT_TRAINER_BASE_SALARY = 3900000;
export const DEFAULT_TRAINER_TRANSPORT_ALLOWANCE = 500000;

export const DEFAULT_TRAINERS_DATA = [
  {
    id: 'trn-1',
    trainerName: 'Siti Rahmawati',
    areaCovered: 'AREA BARU & PEKANBARU',
    region: 'PEKAN BARU',
    targetSellOut: 350000000,
    targetProdukFokusPcs: 600,
    notes: 'Trainer Lead - Focus Brand barenbliss & lavojoy',
  },
  {
    id: 'trn-2',
    trainerName: 'Dewi Lestari',
    areaCovered: 'LUAR KOTA & DURI',
    region: 'DURI',
    targetSellOut: 280000000,
    targetProdukFokusPcs: 450,
    notes: 'Trainer Area Luar Kota - Modern Trade & General Trade',
  },
  {
    id: 'trn-3',
    trainerName: 'Nurul Aini',
    areaCovered: 'DUMAI & BAGAN',
    region: 'DUMAI',
    targetSellOut: 220000000,
    targetProdukFokusPcs: 380,
    notes: 'Trainer Area Dumai & Toko Kosmetik Mitra',
  },
  {
    id: 'trn-4',
    trainerName: 'Farah Diba',
    areaCovered: 'SELAT PANJANG & BENGKALIS',
    region: 'RIAU KEPULAUAN',
    targetSellOut: 180000000,
    targetProdukFokusPcs: 300,
    notes: 'Trainer Specialist Produk Fokus & Skincare',
  },
];

/**
 * ATURAN PERHITUNGAN GAJI & INSENTIF TRAINER:
 * - Gaji Pokok: Rp 3.900.000
 * - Tunjangan Transportasi Trainer Dalam Kota: Rp 500.000
 * - Pencapaian Produk Fokus Trainer:
 *   * Capai >= 100%: Insentif +Rp 500.000
 *   * Capai 80% - 99%: Insentif +Rp 300.000
 *   * Capai 70% - 79.9%: Aman / Netral (Rp 0)
 *   * Capai < 70%: Diberi SP1 dan Denda -Rp 300.000
 * - Pencapaian Poin KPI Trainer (100 Poin):
 *   * Poin 100% (>= 100 pt): Insentif Trainer +Rp 2.000.000
 *   * Poin 90% - 99% (90-99 pt): Insentif Trainer +Rp 1.000.000
 *   * Poin 80% - 89% (80-89 pt): Insentif Trainer +Rp 500.000
 *   * Poin 70% - 79% (70-79 pt): Aman / Netral (Rp 0)
 *   * Poin < 70% (< 70 pt): Trainer diberi SP1 dan Denda -Rp 300.000
 */
export function calculateTrainerSalary(
  trainerName: string,
  focusTargetPcs: number,
  focusActualPcs: number,
  areaCovered: string = '-',
  region: string = '-',
  sellOutActual: number = 0,
  sellOutTarget: number = 350000000,
  manualIncentiveOverride?: number,
  manualPenaltyOverride?: number,
  notes?: string,
  kpiScore?: number,
  manualKpiIncentiveOverride?: number,
  manualKpiPenaltyOverride?: number,
  monthPeriod: string = 'OKTOBER 2026'
): TrainerSalaryItem {
  const baseSalary = DEFAULT_TRAINER_BASE_SALARY;
  const transportAllowance = DEFAULT_TRAINER_TRANSPORT_ALLOWANCE;
  const target = focusTargetPcs > 0 ? focusTargetPcs : 500;
  const focusAchievementPct = target > 0 ? (focusActualPcs / target) * 100 : 0;

  // 1. Skema Produk Fokus Trainer
  let focusStatus: 'insentif_500k' | 'insentif_300k' | 'aman' | 'denda_sp1' = 'aman';
  let focusIncentive = 0;
  let focusPenalty = 0;
  let hasSp1 = false;

  if (focusAchievementPct >= 100) {
    focusStatus = 'insentif_500k';
    focusIncentive = 500000;
  } else if (focusAchievementPct >= 80) {
    focusStatus = 'insentif_300k';
    focusIncentive = 300000;
  } else if (focusAchievementPct >= 70) {
    focusStatus = 'aman';
    focusIncentive = 0;
    focusPenalty = 0;
  } else {
    focusStatus = 'denda_sp1';
    focusPenalty = 300000;
    hasSp1 = true;
  }

  if (manualIncentiveOverride !== undefined) {
    focusIncentive = manualIncentiveOverride;
  }
  if (manualPenaltyOverride !== undefined) {
    focusPenalty = manualPenaltyOverride;
    hasSp1 = manualPenaltyOverride > 0;
  }

  // 2. Skema Insentif & Denda Poin KPI Trainer (Total 100 Poin)
  const scoreKpi = kpiScore !== undefined ? kpiScore : 85;
  let kpiStatus: 'insentif_2jt' | 'insentif_1jt' | 'insentif_500k' | 'aman' | 'denda_sp1' = 'aman';
  let kpiIncentive = 0;
  let kpiPenalty = 0;
  let hasKpiSp1 = false;

  if (scoreKpi >= 100) {
    kpiStatus = 'insentif_2jt';
    kpiIncentive = 2000000;
  } else if (scoreKpi >= 90) {
    kpiStatus = 'insentif_1jt';
    kpiIncentive = 1000000;
  } else if (scoreKpi >= 80) {
    kpiStatus = 'insentif_500k';
    kpiIncentive = 500000;
  } else if (scoreKpi >= 70) {
    kpiStatus = 'aman';
    kpiIncentive = 0;
    kpiPenalty = 0;
  } else {
    kpiStatus = 'denda_sp1';
    kpiPenalty = 300000;
    hasKpiSp1 = true;
    hasSp1 = true;
  }

  if (manualKpiIncentiveOverride !== undefined) {
    kpiIncentive = manualKpiIncentiveOverride;
  }
  if (manualKpiPenaltyOverride !== undefined) {
    kpiPenalty = manualKpiPenaltyOverride;
    hasKpiSp1 = manualKpiPenaltyOverride > 0;
    if (hasKpiSp1) hasSp1 = true;
  }

  const totalSalary =
    baseSalary + transportAllowance + focusIncentive - focusPenalty + kpiIncentive - kpiPenalty;

  return {
    id: `trn-${trainerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    trainerName,
    areaCovered,
    region,
    baseSalary,
    transportAllowance,
    focusTargetPcs: target,
    focusActualPcs,
    focusAchievementPct,
    focusStatus,
    focusIncentive,
    focusPenalty,
    hasSp1,
    kpiScore: scoreKpi,
    kpiStatus,
    kpiIncentive,
    kpiPenalty,
    hasKpiSp1,
    monthPeriod,
    totalSalary,
    sellOutActual,
    sellOutTarget,
    notes,
    isCustom:
      manualIncentiveOverride !== undefined ||
      manualPenaltyOverride !== undefined ||
      manualKpiIncentiveOverride !== undefined ||
      manualKpiPenaltyOverride !== undefined,
  };
}

/**
 * ATURAN PERHITUNGAN GAJI & INSENTIF SALES:
 * - Gaji Pokok: Rp 4.900.000
 * - Capai Sell In >= 100%: Insentif 4% x Pencapaian Sell In + Rp 4.900.000
 * - Capai Sell In 80% - 99%: Insentif 0,2% x Pencapaian Sell In + Rp 4.900.000
 * - Capai Sell In < 80%: Insentif 0% + Rp 4.900.000 (Belum mencapai batas minimal insentif 80%)
 *
 * INSENTIF & PENALTI TAMBAHAN PRODUKTIVITAS SELL OUT BA (YANG DICOVER SALES):
 * - Produktivitas Sell Out BA < Rp 35.000.000: Diberi SP1 dan Denda -Rp 300.000 per BA
 * - Produktivitas Sell Out BA Rp 45.000.000 - Rp 54.999.999: Diberi Insentif +Rp 500.000 per BA
 * - Produktivitas Sell Out BA >= Rp 55.000.000: Diberi Insentif +Rp 1.000.000 per BA
 * - Produktivitas Sell Out BA Rp 35.000.000 - Rp 44.999.999: Normal (Rp 0)
 */
export function calculateSalesSalary(
  salesName: string,
  sellInActual: number,
  sellInTarget: number,
  coverArea: string = '-',
  spv: string = '-',
  coveredBaList: { storeName: string; baName: string; sellOut: number }[] = [],
  manualBonusOverride?: number,
  manualPenaltyOverride?: number
): SalesSalaryItem {
  const target = sellInTarget > 0 ? sellInTarget : 1;
  const achievementPercent = (sellInActual / target) * 100;
  const baseSalary = 4900000;

  let incentivePercent = 0;
  let tierLabel = '';
  let tierColor = '';

  if (achievementPercent >= 120) {
    incentivePercent = 4.0;
    tierLabel = 'Super Target (≥ 120%) - Insentif 4%';
    tierColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (achievementPercent >= 100) {
    incentivePercent = 4.0;
    tierLabel = 'Capai Target (≥ 100%) - Insentif 4%';
    tierColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (achievementPercent >= 80) {
    incentivePercent = 0.2;
    tierLabel = 'Minimal Capai (80% - 99%)';
    tierColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else {
    incentivePercent = 0;
    tierLabel = 'Di Bawah Minimal (< 80%)';
    tierColor = 'bg-slate-100 text-slate-700 border-slate-300';
  }

  const incentiveNominal = Math.round((incentivePercent / 100) * sellInActual);

  // Evaluasi Produktivitas BA yang dicover oleh Sales
  let calculatedBonus = 0;
  let calculatedPenalty = 0;
  let spCount = 0;

  const detailedBaList: SalesCoveredBaItem[] = coveredBaList.map((ba) => {
    let status: 'bonus_1m' | 'bonus_500k' | 'normal' | 'penalty_sp1' = 'normal';
    let amount = 0;
    let description = 'Sell Out Normal (Rp 35 - 44.9 Jt)';

    if (ba.sellOut < 35000000) {
      status = 'penalty_sp1';
      amount = -300000;
      calculatedPenalty += 300000;
      spCount += 1;
      description = 'BA < 35 Jt: Denda -Rp 300.000 (SP1)';
    } else if (ba.sellOut >= 55000000) {
      status = 'bonus_1m';
      amount = 1000000;
      calculatedBonus += 1000000;
      description = 'BA ≥ 55 Jt: Bonus +Rp 1.000.000';
    } else if (ba.sellOut >= 45000000) {
      status = 'bonus_500k';
      amount = 500000;
      calculatedBonus += 500000;
      description = 'BA 45-54 Jt: Bonus +Rp 500.000';
    }

    return {
      storeName: ba.storeName,
      baName: ba.baName,
      sellOut: ba.sellOut,
      status,
      amount,
      description,
    };
  });

  const baProductivityBonus = manualBonusOverride !== undefined ? manualBonusOverride : calculatedBonus;
  const baProductivityPenalty = manualPenaltyOverride !== undefined ? manualPenaltyOverride : calculatedPenalty;

  const totalSalary = baseSalary + incentiveNominal + baProductivityBonus - baProductivityPenalty;

  return {
    salesName,
    coverArea,
    spv,
    sellInActual,
    sellInTarget: target,
    achievementPercent,
    tierLabel,
    tierColor,
    baseSalary,
    incentivePercent,
    incentiveNominal,
    coveredStores: coveredBaList.map((b) => b.storeName),
    coveredBaCount: coveredBaList.length,
    coveredBaList: detailedBaList,
    baProductivityBonus,
    baProductivityPenalty,
    baProductivitySpCount: spCount,
    totalSalary,
  };
}

/**
 * ATURAN PERHITUNGAN GAJI & INSENTIF BEAUTY ADVISOR TOKO (SELL OUT):
 * - Catatan: Tidak ada BA Lavojoy terpisah; 1 BA melayani semua brand di gerai tersebut.
 * - Skema Non-Lavojoy (Y.O.U, barenbliss, DAZZLE ME, GLAMFIX, HUED, FORMULOGIC):
 *   • Capai Sell Out >= 120%: Gaji Pokok Rp 3.900.000 + Insentif 2% x Sell Out Non-Lavojoy
 *   • Capai Sell Out 100% - 119%: Gaji Pokok Rp 3.900.000 + Insentif 1% x Sell Out Non-Lavojoy
 *   • Capai Sell Out 70% - 99%: Gaji flat yang diterima Rp 2.925.000 (Insentif 0%)
 *   • Capai Sell Out Rp 1.000.000 - Rp 25.000.000 (< 70%): Gaji flat diterima Rp 2.000.000
 *   • Capai Sell Out > Rp 25.000.000 (< 70%): Gaji flat diterima Rp 2.000.000
 *   • Sell Out < Rp 1.000.000: Belum memenuhi batas minimum omset Rp 1 Jt (Gaji Rp 0)
 * - Skema Khusus Brand Lavojoy:
 *   • Jika pencapaian Sell Out Lavojoy >= 100%: Insentif 4% x Sell Out Lavojoy ditambahkan ke total gaji BA
 *   • Jika pencapaian Sell Out Lavojoy < 100%: Tidak ada insentif Lavojoy (Rp 0)
 */
export function calculateBaSalary(
  baName: string,
  baNumber: string,
  storeName: string,
  sellOutNonLavojoy: number,
  sellOutLavojoy: number = 0,
  targetNonLavojoy: number = 30000000,
  targetLavojoy: number = 5000000,
  coverArea: string = '-',
  region: string = '-',
  salesName: string = '-',
  spv: string = '-',
  focusTargetPcs: number = 0,
  focusActualPcs: number = 0,
  focusIncentiveOverride?: number,
  focusPenaltyOverride?: number
): BaSalaryItem {
  const tNonLavojoy = targetNonLavojoy > 0 ? targetNonLavojoy : 30000000;
  const tLavojoy = targetLavojoy > 0 ? targetLavojoy : 5000000;

  const achievementNonLavojoyPercent = (sellOutNonLavojoy / tNonLavojoy) * 100;
  const sellOutActual = sellOutNonLavojoy + sellOutLavojoy;
  const isMinSalesMet = sellOutActual >= 1000000;

  // 1. Gaji Pokok & Insentif Non-Lavojoy
  let baseSalary = 0;
  let incentiveNonLavojoyPercent = 0;
  let tierLabel = '';
  let tierColor = '';

  if (achievementNonLavojoyPercent >= 120) {
    baseSalary = 3900000;
    incentiveNonLavojoyPercent = 2.0;
    tierLabel = 'Tier Super (≥ 120%)';
    tierColor = 'bg-purple-100 text-purple-800 border-purple-300';
  } else if (achievementNonLavojoyPercent >= 100) {
    baseSalary = 3900000;
    incentiveNonLavojoyPercent = 1.0;
    tierLabel = 'Tier Target (100% - 119%)';
    tierColor = 'bg-teal-100 text-teal-800 border-teal-300';
  } else if (achievementNonLavojoyPercent >= 70) {
    baseSalary = 2925000;
    incentiveNonLavojoyPercent = 0;
    tierLabel = 'Tier Dasar (70% - 99%)';
    tierColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (sellOutNonLavojoy >= 1000000 && sellOutNonLavojoy <= 25000000) {
    baseSalary = 2000000;
    incentiveNonLavojoyPercent = 0;
    tierLabel = 'Omset Rp 1 Jt - 25 Jt';
    tierColor = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (sellOutNonLavojoy > 25000000) {
    baseSalary = 2000000;
    incentiveNonLavojoyPercent = 0;
    tierLabel = 'Omset > 25 Jt (< 70%)';
    tierColor = 'bg-orange-100 text-orange-800 border-orange-300';
  } else {
    baseSalary = 0;
    incentiveNonLavojoyPercent = 0;
    tierLabel = 'Di Bawah Min. Rp 1 Jt';
    tierColor = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  const incentiveNonLavojoyNominal = Math.round((incentiveNonLavojoyPercent / 100) * sellOutNonLavojoy);

  // 2. Insentif Khusus Lavojoy (4% jika capai 100%)
  const achievementLavojoyPercent = tLavojoy > 0 ? (sellOutLavojoy / tLavojoy) * 100 : 0;
  const isLavojoyTargetMet = achievementLavojoyPercent >= 100;
  const incentiveLavojoyPercent = isLavojoyTargetMet ? 4.0 : 0;
  const incentiveLavojoyNominal = isLavojoyTargetMet ? Math.round((4.0 / 100) * sellOutLavojoy) : 0;

  // 3. Insentif & Denda Produk Fokus BA
  // Aturan: Capaian >= 80%: Insentif Rp 2.000 / pcs, 70-79%: AMAN (Rp 0), < 70%: Denda Rp 1.000 / pcs kekurangan
  let focusAchievementPct = 0;
  let focusStatus: 'insentif' | 'aman' | 'denda' = 'aman';
  let focusIncentive = 0;
  let focusPenalty = 0;

  if (focusTargetPcs > 0) {
    focusAchievementPct = (focusActualPcs / focusTargetPcs) * 100;
    if (focusAchievementPct >= 80) {
      focusStatus = 'insentif';
      focusIncentive = Math.round(focusActualPcs * 2000);
      focusPenalty = 0;
    } else if (focusAchievementPct >= 70) {
      focusStatus = 'aman';
      focusIncentive = 0;
      focusPenalty = 0;
    } else {
      focusStatus = 'denda';
      focusIncentive = 0;
      focusPenalty = Math.round(focusTargetPcs * 1000);
    }
  }

  if (focusIncentiveOverride !== undefined && focusIncentiveOverride >= 0) {
    focusIncentive = focusIncentiveOverride;
  }
  if (focusPenaltyOverride !== undefined && focusPenaltyOverride >= 0) {
    focusPenalty = focusPenaltyOverride;
  }

  const focusNetBonus = focusIncentive - focusPenalty;

  // 4. Gabungan Keseluruhan
  const sellOutTarget = tNonLavojoy + tLavojoy;
  const achievementPercent = sellOutTarget > 0 ? (sellOutActual / sellOutTarget) * 100 : 0;
  const totalIncentiveNominal = incentiveNonLavojoyNominal + incentiveLavojoyNominal;
  const incentivePercent = sellOutActual > 0 ? (totalIncentiveNominal / sellOutActual) * 100 : 0;
  
  // Total Salary: Gaji Pokok + Insentif Omset + Insentif Produk Fokus - Denda Produk Fokus
  const totalSalary = Math.max(0, baseSalary + totalIncentiveNominal + focusIncentive - focusPenalty);

  return {
    baName,
    baNumber,
    storeName,
    coverArea,
    region,
    salesName,
    spv,
    sellOutNonLavojoy,
    targetNonLavojoy: tNonLavojoy,
    achievementNonLavojoyPercent,
    baseSalary,
    incentiveNonLavojoyPercent,
    incentiveNonLavojoyNominal,
    tierLabel,
    tierColor,
    sellOutLavojoy,
    targetLavojoy: tLavojoy,
    achievementLavojoyPercent,
    isLavojoyTargetMet,
    incentiveLavojoyPercent,
    incentiveLavojoyNominal,
    focusTargetPcs,
    focusActualPcs,
    focusAchievementPct: Number(focusAchievementPct.toFixed(1)),
    focusStatus,
    focusIncentive,
    focusPenalty,
    focusNetBonus,
    sellOutActual,
    sellOutTarget,
    achievementPercent,
    totalIncentiveNominal,
    incentiveNominal: totalIncentiveNominal,
    incentivePercent: Number(incentivePercent.toFixed(2)),
    totalSalary,
    isMinSalesMet,
  };
}

/**
 * Agregasi Keseluruhan Cost Area dari Transaksi yang Terfilter
 */
export function aggregateAreaCost(
  records: TransactionRecord[],
  customSalesTargets: Record<string, number> = {},
  customBaNonLavojoyTargets: Record<string, number> = {},
  customBaLavojoyTargets: Record<string, number> = {},
  customSalesBonuses: Record<string, number> = {},
  customSalesPenalties: Record<string, number> = {},
  defaultSalesTarget: number = 150000000,
  defaultBaNonLavojoyTarget: number = 30000000,
  defaultBaLavojoyTarget: number = 5000000,
  customBaFocusOverrides?: Record<string, BaFocusProductOverride>,
  defaultBaFocusTarget: number = DEFAULT_FOCUS_TARGET_PCS,
  customTrainerFocusTargets: Record<string, number> = {},
  customTrainerIncentives: Record<string, number> = {},
  customTrainerPenalties: Record<string, number> = {},
  customTrainerKpiScores: Record<string, number> = {},
  customTrainerKpiIncentives: Record<string, number> = {},
  customTrainerKpiPenalties: Record<string, number> = {},
  trainerMonthPeriod: string = 'OKTOBER 2026'
): AreaCostSummary {
  // 1. Group by Sales Representative (SELL IN)
  const salesMap: Record<
    string,
    {
      sellInActual: number;
      coverArea: string;
      spv: string;
      coveredStores: Set<string>;
    }
  > = {};

  // 2. Group by Store with BA (Toko yang ada BA)
  const baStoreMap: Record<
    string,
    {
      baName: string;
      baNumber: string;
      storeName: string;
      coverArea: string;
      region: string;
      salesName: string;
      spv: string;
      sellOutNonLavojoy: number;
      sellOutLavojoy: number;
      sellOutActual: number;
      focusActualPcs: number;
    }
  > = {};

  // 3. Group by Trainer (Produk Fokus & Sell Out)
  const trainerMap: Record<string, { focusQty: number; sellOut: number }> = {};
  for (const t of DEFAULT_TRAINERS_DATA) {
    trainerMap[t.trainerName] = { focusQty: 0, sellOut: 0 };
  }

  let totalAreaRevenue = 0;

  for (const r of records) {
    const val = r.VALUE || 0;
    totalAreaRevenue += val;

    // Track for Trainer
    const tName = getTrainerForRecord(r);
    if (!trainerMap[tName]) {
      trainerMap[tName] = { focusQty: 0, sellOut: 0 };
    }
    trainerMap[tName].sellOut += val;
    if ((r.PRODUK_FOCUS || '').trim().toUpperCase() === 'FOCUS') {
      trainerMap[tName].focusQty += (r.QTY || 0);
    }

    // Aggregate Sales (fokus Sell In)
    if (r.SALES && r.SALES !== '-' && r.SALES !== 'ALL') {
      if (!salesMap[r.SALES]) {
        salesMap[r.SALES] = {
          sellInActual: 0,
          coverArea: r.COVER_AREA || '-',
          spv: r.SPV || '-',
          coveredStores: new Set<string>(),
        };
      }
      if (r.NAMA_STORE) {
        salesMap[r.SALES].coveredStores.add(r.NAMA_STORE);
      }
      // Akumulasikan penjualan Sell In
      if (r.KET === 'SELL IN' || !r.KET) {
        salesMap[r.SALES].sellInActual += val;
      } else {
        salesMap[r.SALES].sellInActual += val;
      }
    }

    // Toko yang ada BA
    const hasBa = r.BA && r.BA !== '-' && r.BA.trim().length > 0;
    if (hasBa) {
      const storeKey = r.NAMA_STORE;
      if (!baStoreMap[storeKey]) {
        baStoreMap[storeKey] = {
          baName: r.BA,
          baNumber: r.BA_Number || 'BA-' + Math.floor(Math.random() * 900 + 100),
          storeName: storeKey,
          coverArea: r.COVER_AREA || '-',
          region: r.REGION || '-',
          salesName: r.SALES || '-',
          spv: r.SPV || '-',
          sellOutNonLavojoy: 0,
          sellOutLavojoy: 0,
          sellOutActual: 0,
          focusActualPcs: 0,
        };
      }
      if (r.SALES && r.SALES !== '-' && baStoreMap[storeKey].salesName === '-') {
        baStoreMap[storeKey].salesName = r.SALES;
      }
      if (r.SPV && r.SPV !== '-' && baStoreMap[storeKey].spv === '-') {
        baStoreMap[storeKey].spv = r.SPV;
      }

      // Pisahkan brand Lavojoy dan Non-Lavojoy
      const isLavojoy = (r.BRAND || '').trim().toLowerCase() === 'lavojoy';
      if (isLavojoy) {
        baStoreMap[storeKey].sellOutLavojoy += val;
      } else {
        baStoreMap[storeKey].sellOutNonLavojoy += val;
      }
      baStoreMap[storeKey].sellOutActual += val;

      // Akumulasi penjualan produk fokus (Pcs)
      const isFocus = (r.PRODUK_FOCUS || '').trim().toUpperCase() === 'FOCUS';
      if (isFocus && (r.KET === 'SELL OUT' || !r.KET || r.KET === 'SELL IN')) {
        baStoreMap[storeKey].focusActualPcs += (r.QTY || 0);
      }
    }
  }

  // Fallback jika tidak ada data BA terfilter
  if (Object.keys(baStoreMap).length === 0) {
    const storeTotals: Record<string, { value: number; region: string; area: string; sales: string; spv: string; lavojoy: number; nonLavojoy: number; focusQty: number }> = {};
    for (const r of records) {
      if (r.NAMA_STORE) {
        if (!storeTotals[r.NAMA_STORE]) {
          storeTotals[r.NAMA_STORE] = { value: 0, region: r.REGION || '-', area: r.COVER_AREA || '-', sales: r.SALES || '-', spv: r.SPV || '-', lavojoy: 0, nonLavojoy: 0, focusQty: 0 };
        }
        const val = r.VALUE || 0;
        storeTotals[r.NAMA_STORE].value += val;
        if ((r.BRAND || '').trim().toLowerCase() === 'lavojoy') {
          storeTotals[r.NAMA_STORE].lavojoy += val;
        } else {
          storeTotals[r.NAMA_STORE].nonLavojoy += val;
        }
        if ((r.PRODUK_FOCUS || '').trim().toUpperCase() === 'FOCUS') {
          storeTotals[r.NAMA_STORE].focusQty += (r.QTY || 0);
        }
      }
    }
    Object.entries(storeTotals)
      .slice(0, 3)
      .forEach(([sName, data], idx) => {
        const dummyBas = [
          { name: 'Siti Rahma', no: 'BA-012', qty: 115 },
          { name: 'Nur Aini', no: 'BA-045', qty: 95 },
          { name: 'Dewi Lestari', no: 'BA-088', qty: 65 },
        ];
        const baInfo = dummyBas[idx % dummyBas.length];
        baStoreMap[sName] = {
          baName: baInfo.name,
          baNumber: baInfo.no,
          storeName: sName,
          coverArea: data.area,
          region: data.region,
          salesName: data.sales,
          spv: data.spv || '-',
          sellOutNonLavojoy: data.nonLavojoy > 0 ? data.nonLavojoy : data.value * 0.85,
          sellOutLavojoy: data.lavojoy > 0 ? data.lavojoy : data.value * 0.15,
          sellOutActual: data.value,
          focusActualPcs: data.focusQty > 0 ? data.focusQty : baInfo.qty,
        };
      });
  }

  // Load Focus Product Overrides (LocalStorage)
  const focusOverrides = customBaFocusOverrides && Object.keys(customBaFocusOverrides).length > 0
    ? customBaFocusOverrides
    : loadFocusOverrides();

  // Calculate BA Salaries with Focus Product Rules
  const baList: BaSalaryItem[] = Object.values(baStoreMap)
    .map((ba) => {
      const targetNonLavojoy = customBaNonLavojoyTargets[ba.storeName] || defaultBaNonLavojoyTarget;
      const targetLavojoy = customBaLavojoyTargets[ba.storeName] || defaultBaLavojoyTarget;

      const ov = focusOverrides[ba.storeName] || focusOverrides[ba.baName] || {};
      const fTarget = ov.targetPcs !== undefined && ov.targetPcs > 0 ? ov.targetPcs : defaultBaFocusTarget;
      const fActual = ov.customActualPcs !== undefined && ov.customActualPcs >= 0 ? ov.customActualPcs : ba.focusActualPcs;

      return calculateBaSalary(
        ba.baName,
        ba.baNumber,
        ba.storeName,
        ba.sellOutNonLavojoy,
        ba.sellOutLavojoy,
        targetNonLavojoy,
        targetLavojoy,
        ba.coverArea,
        ba.region,
        ba.salesName,
        ba.spv,
        fTarget,
        fActual,
        ov.customIncentive,
        ov.customPenalty
      );
    })
    .sort((a, b) => b.sellOutActual - a.sellOutActual);

  // Map BA per store for sales lookup
  const baByStoreLookup: Record<string, BaSalaryItem> = {};
  for (const ba of baList) {
    baByStoreLookup[ba.storeName] = ba;
  }

  // Calculate Sales Salaries with BA Productivity connection
  const salesList: SalesSalaryItem[] = Object.entries(salesMap)
    .map(([sName, data]) => {
      const target = customSalesTargets[sName] || defaultSalesTarget;

      // Ambil daftar BA yang berada di gerai yang dicover oleh sales ini
      const coveredBaForSales: { storeName: string; baName: string; sellOut: number }[] = [];
      data.coveredStores.forEach((storeName) => {
        const ba = baByStoreLookup[storeName];
        if (ba) {
          coveredBaForSales.push({
            storeName: ba.storeName,
            baName: ba.baName,
            sellOut: ba.sellOutActual,
          });
        }
      });

      // Override jika diset manual
      const manualBonus = customSalesBonuses[sName];
      const manualPenalty = customSalesPenalties[sName];

      return calculateSalesSalary(
        sName,
        data.sellInActual,
        target,
        data.coverArea,
        data.spv,
        coveredBaForSales,
        manualBonus,
        manualPenalty
      );
    })
    .sort((a, b) => b.sellInActual - a.sellInActual);

  // Load default KPI scores from KPI Trainer Data for the given monthPeriod
  const allKpiTrainerItems = loadKpiTrainerData();
  const kpiMapForPeriod: Record<string, number> = {};
  for (const k of allKpiTrainerItems) {
    if (k.monthPeriod.toUpperCase() === trainerMonthPeriod.toUpperCase()) {
      kpiMapForPeriod[k.trainerName.toLowerCase()] = k.totalScore;
    }
  }

  // Calculate Trainer Salaries (Gaji Pokok Rp 3.9M, Transport Rp 500k, Insentif/Denda Produk Fokus, Insentif/Denda KPI Trainer)
  const trainerList: TrainerSalaryItem[] = DEFAULT_TRAINERS_DATA.map((t) => {
    const targetFocus = customTrainerFocusTargets[t.trainerName] !== undefined
      ? customTrainerFocusTargets[t.trainerName]
      : t.targetProdukFokusPcs;

    const actualData = trainerMap[t.trainerName] || { focusQty: 0, sellOut: 0 };
    const actualFocus = actualData.focusQty > 0 ? actualData.focusQty : Math.round(t.targetProdukFokusPcs * 0.92);
    const actualSellOut = actualData.sellOut > 0 ? actualData.sellOut : Math.round(t.targetSellOut * 0.95);

    // KPI Score lookup: from custom override, or from month's KPI dataset, or fallback
    const kpiScore = customTrainerKpiScores[t.trainerName] !== undefined
      ? customTrainerKpiScores[t.trainerName]
      : (kpiMapForPeriod[t.trainerName.toLowerCase()] ?? 85);

    return calculateTrainerSalary(
      t.trainerName,
      targetFocus,
      actualFocus,
      t.areaCovered,
      t.region,
      actualSellOut,
      t.targetSellOut,
      customTrainerIncentives[t.trainerName],
      customTrainerPenalties[t.trainerName],
      t.notes,
      kpiScore,
      customTrainerKpiIncentives[t.trainerName],
      customTrainerKpiPenalties[t.trainerName],
      trainerMonthPeriod
    );
  }).sort((a, b) => b.totalSalary - a.totalSalary);

  // Totals
  const totalSalesBase = salesList.reduce((acc, s) => acc + s.baseSalary, 0);
  const totalSalesIncentive = salesList.reduce(
    (acc, s) => acc + s.incentiveNominal + s.baProductivityBonus - s.baProductivityPenalty,
    0
  );
  const totalSalesCost = salesList.reduce((acc, s) => acc + s.totalSalary, 0);

  const totalBaBase = baList.reduce((acc, b) => acc + b.baseSalary, 0);
  const totalBaIncentive = baList.reduce((acc, b) => acc + b.totalIncentiveNominal, 0);
  const totalBaFocusIncentive = baList.reduce((acc, b) => acc + (b.focusIncentive || 0), 0);
  const totalBaFocusPenalty = baList.reduce((acc, b) => acc + (b.focusPenalty || 0), 0);
  const totalBaFocusNetBonus = totalBaFocusIncentive - totalBaFocusPenalty;
  const totalBaCost = baList.reduce((acc, b) => acc + b.totalSalary, 0);

  const totalTrainerBase = trainerList.reduce((acc, t) => acc + t.baseSalary, 0);
  const totalTrainerTransport = trainerList.reduce((acc, t) => acc + t.transportAllowance, 0);
  const totalTrainerFocusIncentive = trainerList.reduce((acc, t) => acc + t.focusIncentive, 0);
  const totalTrainerFocusPenalty = trainerList.reduce((acc, t) => acc + t.focusPenalty, 0);
  const totalTrainerKpiIncentive = trainerList.reduce((acc, t) => acc + t.kpiIncentive, 0);
  const totalTrainerKpiPenalty = trainerList.reduce((acc, t) => acc + t.kpiPenalty, 0);
  const totalTrainerCost = trainerList.reduce((acc, t) => acc + t.totalSalary, 0);

  const totalCost = totalSalesCost + totalBaCost + totalTrainerCost;
  const costToRevenueRatio = totalAreaRevenue > 0 ? (totalCost / totalAreaRevenue) * 100 : 0;

  return {
    totalCost,
    totalSalesCost,
    totalSalesBase,
    totalSalesIncentive,
    totalBaCost,
    totalBaBase,
    totalBaIncentive,
    totalBaFocusIncentive,
    totalBaFocusPenalty,
    totalBaFocusNetBonus,
    totalTrainerCost,
    totalTrainerBase,
    totalTrainerTransport,
    totalTrainerFocusIncentive,
    totalTrainerFocusPenalty,
    totalTrainerKpiIncentive,
    totalTrainerKpiPenalty,
    totalAreaRevenue,
    costToRevenueRatio,
    salesCount: salesList.length,
    baCount: baList.length,
    trainerCount: trainerList.length,
    salesList,
    baList,
    trainerList,
  };
}
