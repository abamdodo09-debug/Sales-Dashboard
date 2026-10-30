import { KpiTrainerScorecardItem } from '../types/dashboard';

export const STORAGE_KEY_KPI_TRAINER = 'salespro_custom_kpi_trainer_v1';

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

// Initial Data Seed across multiple historical periods
export const INITIAL_KPI_TRAINER: KpiTrainerScorecardItem[] = [
  // --- OKTOBER 2026 ---
  {
    id: 'trn-kpi-okt-01',
    trainerName: 'Siti Rahmawati',
    areaCovered: 'AREA BARU & PEKANBARU',
    region: 'PEKAN BARU',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 350000000,
    sellOutActual: 362500000,
    sellOutAchievementPct: 103.57,
    pointSellOut: 40,
    eventOmsetTarget: 60000000,
    eventOmsetActual: 62400000,
    eventOmsetAchievementPct: 104.0,
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
    notes: 'Performa konsisten di Pekanbaru, event mall berhasil melampaui target omset.',
  },
  {
    id: 'trn-kpi-okt-02',
    trainerName: 'Dewi Lestari',
    areaCovered: 'LUAR KOTA & DURI',
    region: 'DURI',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 280000000,
    sellOutActual: 258000000,
    sellOutAchievementPct: 92.14,
    pointSellOut: 35,
    eventOmsetTarget: 45000000,
    eventOmsetActual: 41000000,
    eventOmsetAchievementPct: 91.11,
    pointEvent: 25,
    eventCountTarget: 3,
    eventCountActual: 3,
    visitTarget: 22,
    visitActual: 21,
    visitAchievementPct: 95.45,
    pointKunjungan: 5,
    trainingTarget: 6,
    trainingActual: 6,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 92,
    baProductivityAchievementPct: 92.0,
    pointBaProductivity: 5,
    totalScore: 80,
    grade: 'Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Pencapaian sell out 92% dan event 91%, monitoring BA cukup stabil.',
  },
  {
    id: 'trn-kpi-okt-03',
    trainerName: 'Nurul Aini',
    areaCovered: 'DUMAI & BAGAN',
    region: 'DUMAI',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 220000000,
    sellOutActual: 188000000,
    sellOutAchievementPct: 85.45,
    pointSellOut: 30,
    eventOmsetTarget: 35000000,
    eventOmsetActual: 29500000,
    eventOmsetAchievementPct: 84.29,
    pointEvent: 20,
    eventCountTarget: 3,
    eventCountActual: 2,
    visitTarget: 20,
    visitActual: 17,
    visitAchievementPct: 85.0,
    pointKunjungan: -5,
    trainingTarget: 6,
    trainingActual: 6,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 90,
    baProductivityAchievementPct: 90.0,
    pointBaProductivity: 5,
    totalScore: 60,
    grade: 'Kurang (SP1)',
    scoreCategory: '10-69',
    hasSp1: true,
    notes: 'Kunjungan dan event di bawah 89% (-5 pt), total skor 60 poin (SP1 diberikan).',
  },
  {
    id: 'trn-kpi-okt-04',
    trainerName: 'Farah Diba',
    areaCovered: 'SELAT PANJANG & BENGKALIS',
    region: 'RIAU KEPULAUAN',
    monthPeriod: 'OKTOBER 2026',
    sellOutTarget: 180000000,
    sellOutActual: 165000000,
    sellOutAchievementPct: 91.67,
    pointSellOut: 35,
    eventOmsetTarget: 30000000,
    eventOmsetActual: 26000000,
    eventOmsetAchievementPct: 86.67,
    pointEvent: 20,
    eventCountTarget: 2,
    eventCountActual: 2,
    visitTarget: 18,
    visitActual: 17,
    visitAchievementPct: 94.44,
    pointKunjungan: 5,
    trainingTarget: 5,
    trainingActual: 4,
    trainingAchievementPct: 80.0,
    pointTraining: -5,
    baProductivityTarget: 100,
    baProductivityActual: 100,
    baProductivityAchievementPct: 100.0,
    pointBaProductivity: 10,
    totalScore: 65,
    grade: 'Kurang (SP1)',
    scoreCategory: '10-69',
    hasSp1: true,
    notes: 'Jumlah training hanya 80% (-5 pt) dan event 86.7% (20 pt), total skor 65 poin (SP1).',
  },

  // --- SEPTEMBER 2026 ---
  {
    id: 'trn-kpi-sep-01',
    trainerName: 'Siti Rahmawati',
    areaCovered: 'AREA BARU & PEKANBARU',
    region: 'PEKAN BARU',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 340000000,
    sellOutActual: 355000000,
    sellOutAchievementPct: 104.41,
    pointSellOut: 40,
    eventOmsetTarget: 55000000,
    eventOmsetActual: 56000000,
    eventOmsetAchievementPct: 101.82,
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
    baProductivityActual: 96,
    baProductivityAchievementPct: 96.0,
    pointBaProductivity: 5,
    totalScore: 95,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Kinerja excellent bulan September, semua target pilar tercapai optimal.',
  },
  {
    id: 'trn-kpi-sep-02',
    trainerName: 'Dewi Lestari',
    areaCovered: 'LUAR KOTA & DURI',
    region: 'DURI',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 270000000,
    sellOutActual: 245000000,
    sellOutAchievementPct: 90.74,
    pointSellOut: 35,
    eventOmsetTarget: 40000000,
    eventOmsetActual: 37000000,
    eventOmsetAchievementPct: 92.5,
    pointEvent: 25,
    eventCountTarget: 3,
    eventCountActual: 3,
    visitTarget: 22,
    visitActual: 20,
    visitAchievementPct: 90.91,
    pointKunjungan: 5,
    trainingTarget: 6,
    trainingActual: 6,
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
    notes: 'Kinerja baik stabil di 80 poin.',
  },
  {
    id: 'trn-kpi-sep-03',
    trainerName: 'Nurul Aini',
    areaCovered: 'DUMAI & BAGAN',
    region: 'DUMAI',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 210000000,
    sellOutActual: 195000000,
    sellOutAchievementPct: 92.86,
    pointSellOut: 35,
    eventOmsetTarget: 32000000,
    eventOmsetActual: 29000000,
    eventOmsetAchievementPct: 90.63,
    pointEvent: 25,
    eventCountTarget: 2,
    eventCountActual: 2,
    visitTarget: 20,
    visitActual: 19,
    visitAchievementPct: 95.0,
    pointKunjungan: 5,
    trainingTarget: 5,
    trainingActual: 4,
    trainingAchievementPct: 80.0,
    pointTraining: -5,
    baProductivityTarget: 100,
    baProductivityActual: 100,
    baProductivityAchievementPct: 100.0,
    pointBaProductivity: 10,
    totalScore: 70,
    grade: 'Cukup',
    scoreCategory: '70-79',
    hasSp1: false,
    notes: 'Total skor 70 poin (Kategori Cukup / Standar), aman dari SP1.',
  },
  {
    id: 'trn-kpi-sep-04',
    trainerName: 'Farah Diba',
    areaCovered: 'SELAT PANJANG & BENGKALIS',
    region: 'RIAU KEPULAUAN',
    monthPeriod: 'SEPTEMBER 2026',
    sellOutTarget: 175000000,
    sellOutActual: 178000000,
    sellOutAchievementPct: 101.71,
    pointSellOut: 40,
    eventOmsetTarget: 28000000,
    eventOmsetActual: 28500000,
    eventOmsetAchievementPct: 101.79,
    pointEvent: 30,
    eventCountTarget: 2,
    eventCountActual: 2,
    visitTarget: 18,
    visitActual: 18,
    visitAchievementPct: 100.0,
    pointKunjungan: 10,
    trainingTarget: 5,
    trainingActual: 5,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 90,
    baProductivityAchievementPct: 90.0,
    pointBaProductivity: 5,
    totalScore: 95,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Pencapaian luar biasa di kepulauan, sell out tembus 101.7%.',
  },

  // --- AGUSTUS 2026 ---
  {
    id: 'trn-kpi-agt-01',
    trainerName: 'Siti Rahmawati',
    areaCovered: 'AREA BARU & PEKANBARU',
    region: 'PEKAN BARU',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 330000000,
    sellOutActual: 342000000,
    sellOutAchievementPct: 103.64,
    pointSellOut: 40,
    eventOmsetTarget: 50000000,
    eventOmsetActual: 51200000,
    eventOmsetAchievementPct: 102.4,
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
    baProductivityActual: 100,
    baProductivityAchievementPct: 100.0,
    pointBaProductivity: 10,
    totalScore: 100,
    grade: 'Sangat Baik',
    scoreCategory: '80-100',
    hasSp1: false,
    notes: 'Skor sempurna 100 poin! Semua 5 indikator mencapai batas maksimal 100%.',
  },
  {
    id: 'trn-kpi-agt-02',
    trainerName: 'Dewi Lestari',
    areaCovered: 'LUAR KOTA & DURI',
    region: 'DURI',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 260000000,
    sellOutActual: 240000000,
    sellOutAchievementPct: 92.31,
    pointSellOut: 35,
    eventOmsetTarget: 38000000,
    eventOmsetActual: 33000000,
    eventOmsetAchievementPct: 86.84,
    pointEvent: 20,
    eventCountTarget: 3,
    eventCountActual: 3,
    visitTarget: 22,
    visitActual: 21,
    visitAchievementPct: 95.45,
    pointKunjungan: 5,
    trainingTarget: 6,
    trainingActual: 6,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 92,
    baProductivityAchievementPct: 92.0,
    pointBaProductivity: 5,
    totalScore: 75,
    grade: 'Cukup',
    scoreCategory: '70-79',
    hasSp1: false,
    notes: 'Kategori Cukup (75 poin), event di 86.8% (20 pt).',
  },
  {
    id: 'trn-kpi-agt-03',
    trainerName: 'Nurul Aini',
    areaCovered: 'DUMAI & BAGAN',
    region: 'DUMAI',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 200000000,
    sellOutActual: 172000000,
    sellOutAchievementPct: 86.0,
    pointSellOut: 30,
    eventOmsetTarget: 30000000,
    eventOmsetActual: 25000000,
    eventOmsetAchievementPct: 83.33,
    pointEvent: 20,
    eventCountTarget: 2,
    eventCountActual: 2,
    visitTarget: 20,
    visitActual: 19,
    visitAchievementPct: 95.0,
    pointKunjungan: 5,
    trainingTarget: 5,
    trainingActual: 5,
    trainingAchievementPct: 100.0,
    pointTraining: 10,
    baProductivityTarget: 100,
    baProductivityActual: 90,
    baProductivityAchievementPct: 90.0,
    pointBaProductivity: 5,
    totalScore: 70,
    grade: 'Cukup',
    scoreCategory: '70-79',
    hasSp1: false,
    notes: 'Capaian 70 poin kategori cukup standar.',
  },
  {
    id: 'trn-kpi-agt-04',
    trainerName: 'Farah Diba',
    areaCovered: 'SELAT PANJANG & BENGKALIS',
    region: 'RIAU KEPULAUAN',
    monthPeriod: 'AGUSTUS 2026',
    sellOutTarget: 170000000,
    sellOutActual: 160000000,
    sellOutAchievementPct: 94.12,
    pointSellOut: 35,
    eventOmsetTarget: 26000000,
    eventOmsetActual: 24000000,
    eventOmsetAchievementPct: 92.31,
    pointEvent: 25,
    eventCountTarget: 2,
    eventCountActual: 2,
    visitTarget: 18,
    visitActual: 17,
    visitAchievementPct: 94.44,
    pointKunjungan: 5,
    trainingTarget: 5,
    trainingActual: 5,
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
    notes: 'Performa konsisten di 80 poin.',
  },
];

export function loadKpiTrainerData(): KpiTrainerScorecardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KPI_TRAINER);
    if (raw) {
      const parsed: KpiTrainerScorecardItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load KPI Trainer from localStorage', e);
  }
  return INITIAL_KPI_TRAINER;
}

export function saveKpiTrainerData(items: KpiTrainerScorecardItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KPI_TRAINER, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save KPI Trainer to localStorage', e);
  }
}
