import { KpiTrainerScorecardItem } from '../types/dashboard';

export const STORAGE_KEY_KPI_TRAINER = 'salespro_custom_kpi_trainer_v5';

/**
 * Formula Perhitungan Poin KPI Trainer (Total 100 Poin):
 * 1. Sell Out (Maks 40 Poin):
 *    - >= 100%: 40 poin
 *    - 90% - 99.9%: 35 poin
 *    - 80% - 89.9%: 30 poin
 *    - < 80%: 0 poin
 *
 * 2. Jumlah Event & Omset Event (Maks 30 Poin):
 *    - >= 100%: 30 poin
 *    - 90% - 99.9%: 25 poin
 *    - 80% - 89.9%: 20 poin
 *    - < 80%: 0 poin
 *
 * 3. Absensi & Report Kunjungan (Maks 10 Poin):
 *    - >= 100%: 10 poin
 *    - 90% - 99.9%: 5 poin
 *    - 80% - 89.9%: -5 poin
 *    - < 80%: -5 poin
 *
 * 4. Jumlah Training (Maks 10 Poin):
 *    - >= 100%: 10 poin
 *    - 90% - 99.9%: 5 poin
 *    - 80% - 89.9%: -5 poin
 *    - < 80%: -5 poin
 *
 * 5. Report & Produktivitas BA (Maks 10 Poin):
 *    - >= 100%: 10 poin
 *    - 90% - 99.9%: 5 poin
 *    - 80% - 89.9%: -5 poin
 *    - < 80%: -5 poin
 */
export function calculateTrainerKpiPoints(input: {
  sellOutTarget: number;
  sellOutActual: number;
  eventOmsetTarget: number;
  eventOmsetActual: number;
  visitTarget: number;
  visitActual: number;
  trainingTarget: number;
  trainingActual: number;
  baProductivityTarget: number;
  baProductivityActual: number;
}): {
  sellOutAchievementPct: number;
  pointSellOut: number;
  eventOmsetAchievementPct: number;
  pointEvent: number;
  visitAchievementPct: number;
  pointKunjungan: number;
  trainingAchievementPct: number;
  pointTraining: number;
  baProductivityAchievementPct: number;
  pointBaProductivity: number;
  totalScore: number;
  grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang (SP1)';
  scoreCategory: '80-100' | '70-79' | '10-69';
  hasSp1: boolean;
} {
  // 1. Sell Out
  const sellOutAchievementPct =
    input.sellOutTarget > 0 ? (input.sellOutActual / input.sellOutTarget) * 100 : 0;
  let pointSellOut = 0;
  if (sellOutAchievementPct >= 100) {
    pointSellOut = 40;
  } else if (sellOutAchievementPct >= 90) {
    pointSellOut = 35;
  } else if (sellOutAchievementPct >= 80) {
    pointSellOut = 30;
  } else {
    pointSellOut = 0;
  }

  // 2. Jumlah Event & Omset Event
  const eventOmsetAchievementPct =
    input.eventOmsetTarget > 0 ? (input.eventOmsetActual / input.eventOmsetTarget) * 100 : 0;
  let pointEvent = 0;
  if (eventOmsetAchievementPct >= 100) {
    pointEvent = 30;
  } else if (eventOmsetAchievementPct >= 90) {
    pointEvent = 25;
  } else if (eventOmsetAchievementPct >= 80) {
    pointEvent = 20;
  } else {
    pointEvent = 0;
  }

  // 3. Absensi & Report Kunjungan
  const visitAchievementPct =
    input.visitTarget > 0 ? (input.visitActual / input.visitTarget) * 100 : 0;
  let pointKunjungan = -5;
  if (visitAchievementPct >= 100) {
    pointKunjungan = 10;
  } else if (visitAchievementPct >= 90) {
    pointKunjungan = 5;
  } else {
    pointKunjungan = -5;
  }

  // 4. Jumlah Training
  const trainingAchievementPct =
    input.trainingTarget > 0 ? (input.trainingActual / input.trainingTarget) * 100 : 0;
  let pointTraining = -5;
  if (trainingAchievementPct >= 100) {
    pointTraining = 10;
  } else if (trainingAchievementPct >= 90) {
    pointTraining = 5;
  } else {
    pointTraining = -5;
  }

  // 5. Report & Produktivitas BA
  const baProductivityAchievementPct =
    input.baProductivityTarget > 0
      ? (input.baProductivityActual / input.baProductivityTarget) * 100
      : 0;
  let pointBaProductivity = -5;
  if (baProductivityAchievementPct >= 100) {
    pointBaProductivity = 10;
  } else if (baProductivityAchievementPct >= 90) {
    pointBaProductivity = 5;
  } else {
    pointBaProductivity = -5;
  }

  // Total Score (dibatasi min 0, max 100)
  const rawScore =
    pointSellOut + pointEvent + pointKunjungan + pointTraining + pointBaProductivity;
  const totalScore = Math.min(100, Math.max(0, rawScore));

  // Kategori Capaian
  let scoreCategory: '80-100' | '70-79' | '10-69' = '10-69';
  let grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang (SP1)' = 'Kurang (SP1)';
  let hasSp1 = false;

  if (totalScore >= 80) {
    scoreCategory = '80-100';
    grade = totalScore >= 90 ? 'Sangat Baik' : 'Baik';
  } else if (totalScore >= 70) {
    scoreCategory = '70-79';
    grade = 'Cukup';
  } else {
    scoreCategory = '10-69';
    grade = 'Kurang (SP1)';
    hasSp1 = true;
  }

  return {
    sellOutAchievementPct,
    pointSellOut,
    eventOmsetAchievementPct,
    pointEvent,
    visitAchievementPct,
    pointKunjungan,
    trainingAchievementPct,
    pointTraining,
    baProductivityAchievementPct,
    pointBaProductivity,
    totalScore,
    grade,
    scoreCategory,
    hasSp1,
  };
}

// Initial Data Seed across multiple historical periods strictly for ARA and RATIH
export const INITIAL_KPI_TRAINER: KpiTrainerScorecardItem[] = [
  // --- OKTOBER 2026 ---
  {
    id: 'trn-kpi-okt-ara',
    trainerName: 'ARA',
    areaCovered: 'PEKANBARU, DUMAI, SIAK, INDRAGIRI (Sales: Albert, Ilhamsyah, Pareto, Tiwi)',
    region: 'PEKAN BARU',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 450000000,
    sellOutActual: 468000000,
    sellOutAchievementPct: 104.0,
    pointSellOut: 40,
    eventOmsetTarget: 75000000,
    eventOmsetActual: 78500000,
    eventOmsetAchievementPct: 104.67,
    pointEvent: 30,
    eventCountTarget: 4,
    eventCountActual: 4,
    visitTarget: 26,
    visitActual: 27,
    visitAchievementPct: 103.85,
    pointKunjungan: 10,
    trainingTarget: 8,
    trainingActual: 8,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 96,
    baProductivityAchievementPct: 96.0,
    pointBaProductivity: 5,
    totalScore: 95,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Performa sangat baik di Pekanbaru, Dumai, Siak & Indragiri. Capaian Sell Out 104% dan omset event melampaui target.',
  },
  {
    id: 'trn-kpi-okt-ratih',
    trainerName: 'RATIH',
    areaCovered: 'DURI, DUMAI, BAGAN SIAPI API, LUAR KOTA (Sales: Abdul Rahim, Ilhamsyah, Luar Kota, Pareto, Tiwi)',
    region: 'DURI / DUMAI',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 420000000,
    sellOutActual: 405000000,
    sellOutAchievementPct: 96.43,
    pointSellOut: 35,
    eventOmsetTarget: 70000000,
    eventOmsetActual: 67200000,
    eventOmsetAchievementPct: 96.0,
    pointEvent: 25,
    eventCountTarget: 4,
    eventCountActual: 4,
    visitTarget: 25,
    visitActual: 24,
    visitAchievementPct: 96.0,
    pointKunjungan: 5,
    trainingTarget: 8,
    trainingActual: 8,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 93,
    baProductivityAchievementPct: 93.0,
    pointBaProductivity: 5,
    totalScore: 80,
    grade: 'Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Pencapaian sell out 96.4% dan event 96%, monitoring BA coveran Duri, Bagan & Luar Kota sangat stabil.',
  },

  // --- SEPTEMBER 2026 ---
  {
    id: 'trn-kpi-sep-ara',
    trainerName: 'ARA',
    areaCovered: 'PEKANBARU, DUMAI, SIAK, INDRAGIRI (Sales: Albert, Ilhamsyah, Pareto, Tiwi)',
    region: 'PEKAN BARU',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 430000000,
    sellOutActual: 442000000,
    sellOutAchievementPct: 102.79,
    pointSellOut: 40,
    eventOmsetTarget: 70000000,
    eventOmsetActual: 72500000,
    eventOmsetAchievementPct: 103.57,
    pointEvent: 30,
    eventCountTarget: 4,
    eventCountActual: 4,
    visitTarget: 24,
    visitActual: 25,
    visitAchievementPct: 104.17,
    pointKunjungan: 10,
    trainingTarget: 8,
    trainingActual: 8,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 95,
    baProductivityAchievementPct: 95.0,
    pointBaProductivity: 5,
    totalScore: 95,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Konsisten melampaui target penjualan sell out dan event omset.',
  },
  {
    id: 'trn-kpi-sep-ratih',
    trainerName: 'RATIH',
    areaCovered: 'DURI, DUMAI, BAGAN SIAPI API, LUAR KOTA (Sales: Abdul Rahim, Ilhamsyah, Luar Kota, Pareto, Tiwi)',
    region: 'DURI / DUMAI',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 400000000,
    sellOutActual: 382000000,
    sellOutAchievementPct: 95.5,
    pointSellOut: 35,
    eventOmsetTarget: 65000000,
    eventOmsetActual: 62000000,
    eventOmsetAchievementPct: 95.38,
    pointEvent: 25,
    eventCountTarget: 4,
    eventCountActual: 4,
    visitTarget: 24,
    visitActual: 23,
    visitAchievementPct: 95.83,
    pointKunjungan: 5,
    trainingTarget: 8,
    trainingActual: 8,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 91,
    baProductivityAchievementPct: 91.0,
    pointBaProductivity: 5,
    totalScore: 80,
    grade: 'Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Aktivitas training 100%, evaluasi toko coveran berjalan baik.',
  },

  // --- AGUSTUS 2026 ---
  {
    id: 'trn-kpi-agt-ara',
    trainerName: 'ARA',
    areaCovered: 'PEKANBARU, DUMAI, SIAK, INDRAGIRI (Sales: Albert, Ilhamsyah, Pareto, Tiwi)',
    region: 'PEKAN BARU',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 410000000,
    sellOutActual: 421000000,
    sellOutAchievementPct: 102.68,
    pointSellOut: 40,
    eventOmsetTarget: 68000000,
    eventOmsetActual: 69500000,
    eventOmsetAchievementPct: 102.21,
    pointEvent: 30,
    eventCountTarget: 4,
    eventCountActual: 4,
    visitTarget: 24,
    visitActual: 24,
    visitAchievementPct: 100.0,
    pointKunjungan: 10,
    trainingTarget: 8,
    trainingActual: 8,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 94,
    baProductivityAchievementPct: 94.0,
    pointBaProductivity: 5,
    totalScore: 95,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Performa sangat stabil di 95 poin.',
  },
  {
    id: 'trn-kpi-agt-ratih',
    trainerName: 'RATIH',
    areaCovered: 'DURI, DUMAI, BAGAN SIAPI API, LUAR KOTA (Sales: Abdul Rahim, Ilhamsyah, Luar Kota, Pareto, Tiwi)',
    region: 'DURI / DUMAI',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 380000000,
    sellOutActual: 358000000,
    sellOutAchievementPct: 94.21,
    pointSellOut: 35,
    eventOmsetTarget: 60000000,
    eventOmsetActual: 57000000,
    eventOmsetAchievementPct: 95.0,
    pointEvent: 25,
    eventCountTarget: 3,
    eventCountActual: 3,
    visitTarget: 22,
    visitActual: 21,
    visitAchievementPct: 95.45,
    pointKunjungan: 5,
    trainingTarget: 7,
    trainingActual: 7,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 90,
    baProductivityAchievementPct: 90.0,
    pointBaProductivity: 5,
    totalScore: 80,
    grade: 'Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Performa konsisten di 80 poin kategori Baik.',
  },
];

export function loadKpiTrainerData(): KpiTrainerScorecardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KPI_TRAINER);
    if (raw) {
      const parsed: KpiTrainerScorecardItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((item) =>
          ['ARA', 'RATIH'].includes((item.trainerName || '').toUpperCase().trim())
        );
        if (valid.length > 0) return valid;
      }
    }
  } catch (e) {
    console.warn('Failed to load KPI Trainer from localStorage', e);
  }
  return INITIAL_KPI_TRAINER;
}

export function saveKpiTrainerData(items: KpiTrainerScorecardItem[]): void {
  try {
    const valid = items.filter((item) =>
      ['ARA', 'RATIH'].includes((item.trainerName || '').toUpperCase().trim())
    );
    localStorage.setItem(STORAGE_KEY_KPI_TRAINER, JSON.stringify(valid));
  } catch (e) {
    console.warn('Failed to save KPI Trainer to localStorage', e);
  }
}
