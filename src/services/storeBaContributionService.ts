import {
  TransactionRecord,
  StoreBaContributionItem,
  StoreBaContributionSummary,
} from '../types/dashboard';
import { MONTH_NAMES_LIST } from './sellInSellOutService';
import { parseRecordMonthYear } from './quarterlySummaryService';
import { isFocusProduct } from '../utils/analytics';
import {
  loadMasterStoreList,
  loadKaMgSalesOverride,
  MasterStoreItem,
} from './masterStoreService';
import * as XLSX from 'xlsx';

export function calculateStoreBaContribution(
  records: TransactionRecord[],
  selectedMonth: string,
  selectedYear: number,
  selectedArea: string = 'ALL',
  selectedKet: 'ALL' | 'SELL IN' | 'SELL OUT' = 'ALL'
): {
  stores: StoreBaContributionItem[];
  summary: StoreBaContributionSummary;
} {
  // 1. Ambil master store terkonfigurasi (dari Google Sheet + hasil editan Pengaturan Master)
  const masterStores: MasterStoreItem[] = loadMasterStoreList(records);
  const masterStoreMap = new Map<string, MasterStoreItem>();
  masterStores.forEach((ms) => {
    masterStoreMap.set(ms.storeName.toUpperCase().trim(), ms);
  });

  // 2. Filter data transaksi Google Sheet sesuai bulan, tahun, area, dan KET
  const filteredRecords = records.filter((r) => {
    if (selectedArea !== 'ALL') {
      const areaMatch =
        (r.COVER_AREA || '').toUpperCase() === selectedArea.toUpperCase() ||
        (r.REGION || '').toUpperCase() === selectedArea.toUpperCase();
      if (!areaMatch) return false;
    }

    if (selectedKet !== 'ALL') {
      const k = (r.KET || '').toUpperCase();
      if (selectedKet === 'SELL IN') {
        if (k !== 'SELL IN' && r.KET) return false;
      } else if (selectedKet === 'SELL OUT') {
        if (k !== 'SELL OUT') return false;
      }
    }

    const dt = parseRecordMonthYear(r);
    const recYear = dt ? dt.year : r.TAHUN;
    if (recYear && recYear !== selectedYear) {
      return false;
    }

    if (selectedMonth !== 'ALL') {
      const recMonth = (r.BULAN || '').toUpperCase().trim();
      if (recMonth && recMonth !== selectedMonth) {
        if (dt) {
          const monthIdx = dt.monthIndex;
          const targetIdx = MONTH_NAMES_LIST.indexOf(selectedMonth) - 1;
          if (monthIdx !== targetIdx) return false;
        } else {
          return false;
        }
      }
    }

    return true;
  });

  // 3. Aggregasi per toko
  interface StoreAgg {
    storeName: string;
    hasBa: boolean;
    baName: string;
    baNumber?: string;
    coverArea: string;
    region: string;
    salesName: string;
    spvName: string;
    trainerName: string;
    channel: 'KA' | 'MG';
    totalRevenue: number;
    totalQtySold: number;
    focusProductPcs: number;
    focusProductValue: number;
    transactionCount: number;
  }

  const storeAggMap = new Map<string, StoreAgg>();

  // Inisialisasi dari master store terlebih dahulu
  masterStores.forEach((ms) => {
    const key = ms.storeName.toUpperCase().trim();
    // Jika ada filter area, saring toko yang sesuai
    if (
      selectedArea !== 'ALL' &&
      ms.coverArea.toUpperCase() !== selectedArea.toUpperCase() &&
      ms.region.toUpperCase() !== selectedArea.toUpperCase()
    ) {
      return;
    }

    storeAggMap.set(key, {
      storeName: ms.storeName,
      hasBa: ms.hasBa,
      baName: ms.hasBa ? ms.baName : '- (Non-BA)',
      baNumber: ms.baNumber,
      coverArea: ms.coverArea || 'PEKAN BARU',
      region: ms.region || 'PEKAN BARU',
      salesName: ms.salesName || 'ILHAMSYAH',
      spvName: ms.spvName || 'WIDODO',
      trainerName: ms.trainerName || 'ARA & RATIH',
      channel: ms.channel || 'MG',
      totalRevenue: 0,
      totalQtySold: 0,
      focusProductPcs: 0,
      focusProductValue: 0,
      transactionCount: 0,
    });
  });

  // Akumulasikan seluruh transaksi Google Sheet yang terhubung
  filteredRecords.forEach((r) => {
    const rawStore = (r.NAMA_STORE || 'Toko Ritel').trim();
    const key = rawStore.toUpperCase();

    // Jika toko belum ada di map, buat entry baru
    if (!storeAggMap.has(key)) {
      const ms = masterStoreMap.get(key);
      const rawBa = (r.BA || '').trim();
      const hasBa = ms ? ms.hasBa : (Boolean(rawBa) && rawBa !== '-' && rawBa.toUpperCase() !== 'NON BA');
      const baName = ms ? (ms.hasBa ? ms.baName : '- (Non-BA)') : (hasBa ? rawBa : '- (Non-BA)');

      storeAggMap.set(key, {
        storeName: ms ? ms.storeName : rawStore,
        hasBa,
        baName,
        baNumber: ms?.baNumber || r.BA_Number || undefined,
        coverArea: ms?.coverArea || r.COVER_AREA || 'PEKAN BARU',
        region: ms?.region || r.REGION || 'PEKAN BARU',
        salesName: ms?.salesName || r.SALES || 'ILHAMSYAH',
        spvName: ms?.spvName || r.SPV || 'WIDODO',
        trainerName: ms?.trainerName || 'ARA & RATIH',
        channel: ms?.channel || 'MG',
        totalRevenue: 0,
        totalQtySold: 0,
        focusProductPcs: 0,
        focusProductValue: 0,
        transactionCount: 0,
      });
    }

    const agg = storeAggMap.get(key)!;

    // Rule: Jika di filter SELL OUT, omset kasir hanya dihitung untuk Toko yang memiliki BA (Toko Non-BA tidak dihitung sell out)
    if (selectedKet === 'SELL OUT' && !agg.hasBa) {
      return;
    }

    const val = r.VALUE || 0;
    const qty = Math.max(0, r.QTY || 1);
    const isFocus = isFocusProduct(r.PRODUK_FOCUS);

    agg.totalRevenue += val;
    agg.totalQtySold += qty;
    agg.transactionCount += 1;

    if (isFocus) {
      agg.focusProductPcs += qty;
      agg.focusProductValue += val;
    }
  });

  // 4. Hitung total omset area aktual dari data transaksi
  let totalAreaRevenue = 0;
  let totalAreaQty = 0;
  let autoKaRevenue = 0;
  let autoMgRevenue = 0;

  storeAggMap.forEach((agg) => {
    totalAreaRevenue += agg.totalRevenue;
    totalAreaQty += agg.totalQtySold;
    if (agg.channel === 'KA') {
      autoKaRevenue += agg.totalRevenue;
    } else {
      autoMgRevenue += agg.totalRevenue;
    }
  });

  // Cek override manual Penjualan KA & PENJUALAN DAZZLE ME MG
  const kaMgOverride = loadKaMgSalesOverride();
  let effectiveKaRevenue = autoKaRevenue;
  let effectiveMgRevenue = autoMgRevenue;
  let isManualKaMg = false;
  let kaMgNotes = '';

  if (kaMgOverride.isManual) {
    isManualKaMg = true;
    effectiveKaRevenue = kaMgOverride.kaSalesValue;
    effectiveMgRevenue = kaMgOverride.mgSalesValue;
    kaMgNotes = kaMgOverride.notes || '';
    if (effectiveKaRevenue > 0 || effectiveMgRevenue > 0) {
      totalAreaRevenue = effectiveKaRevenue + effectiveMgRevenue;
    }
  }

  const effectiveTotalRevenue = Math.max(1, totalAreaRevenue);
  const kaRevenuePercent = Math.round((effectiveKaRevenue / effectiveTotalRevenue) * 1000) / 10;
  const mgRevenuePercent = Math.round((effectiveMgRevenue / effectiveTotalRevenue) * 1000) / 10;

  // Estimasi Semua Penjualan SPV (WIDODO + HENDRA GUNAWAN)
  const spvTotalRevenue = Math.round(effectiveTotalRevenue * 0.72);
  const spvRevenuePercent = Math.round((spvTotalRevenue / effectiveTotalRevenue) * 1000) / 10;

  // 5. Susun daftar StoreBaContributionItem
  const storeItems: StoreBaContributionItem[] = [];

  storeAggMap.forEach((agg, key) => {
    const contributionPercent =
      Math.round((agg.totalRevenue / effectiveTotalRevenue) * 10000) / 100;
    const averageBasketSize =
      agg.transactionCount > 0 ? Math.round(agg.totalRevenue / agg.transactionCount) : 0;

    let performanceClass = '';
    let recommendationNote = '';

    if (agg.hasBa) {
      if (agg.totalRevenue >= 50000000) {
        performanceClass = '⭐ Bintang Utama (Top BA)';
        recommendationNote = 'Pertahankan BA tetap loyal & berikan reward apresiasi kuartal.';
      } else if (agg.totalRevenue >= 25000000) {
        performanceClass = '✅ Produktif & Stabil';
        recommendationNote = 'Tingkatkan target produk fokus dan dorong promo counter.';
      } else {
        performanceClass = '⚠️ Perlu Ditingkatkan';
        recommendationNote = 'Evaluasi produktivitas BA & koordinasikan dengan Trainer untuk coaching.';
      }
    } else {
      if (agg.totalRevenue >= 18000000) {
        performanceClass = '🚀 Prioritas 1 Pasang BA Baru';
        recommendationNote = 'Omset tinggi tanpa BA! Segera tempatkan 1 orang BA baru untuk melipatgandakan omset 2-3x.';
      } else if (agg.totalRevenue >= 10000000) {
        performanceClass = '📈 Kandidat Kuat Pasang BA';
        recommendationNote = 'Potensi berkembang jika didukung 1 BA Counter atau mobile BA part-time.';
      } else {
        performanceClass = '🏪 Gerai Reguler / Toko Kecil';
        recommendationNote = 'Pertahankan pasokan via Sales Taking Order reguler tanpa penempatan BA.';
      }
    }

    storeItems.push({
      id: `store-contrib-${key}`,
      storeName: agg.storeName,
      hasBa: agg.hasBa,
      baName: agg.baName,
      baNumber: agg.baNumber,
      coverArea: agg.coverArea,
      region: agg.region,
      salesName: agg.salesName,
      spvName: agg.spvName,
      trainerName: agg.trainerName,
      totalRevenue: agg.totalRevenue,
      contributionPercent,
      totalQtySold: agg.totalQtySold,
      focusProductPcs: agg.focusProductPcs,
      focusProductValue: agg.focusProductValue,
      transactionCount: agg.transactionCount,
      averageBasketSize,
      performanceClass,
      recommendationNote,
    });
  });

  // Urutkan toko berdasarkan omset terbesar
  storeItems.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 6. Hitung Ringkasan Head-to-Head Toko BA vs Toko Non-BA
  const tokoBaList = storeItems.filter((s) => s.hasBa);
  const tokoNonBaList = storeItems.filter((s) => !s.hasBa);

  const tokoBaCount = tokoBaList.length;
  const tokoNonBaCount = tokoNonBaList.length;
  const totalStoresCount = storeItems.length;

  const tokoBaTotalRevenue = tokoBaList.reduce((sum, s) => sum + s.totalRevenue, 0);
  const tokoNonBaTotalRevenue = tokoNonBaList.reduce((sum, s) => sum + s.totalRevenue, 0);

  const tokoBaRevenuePercent =
    totalAreaRevenue > 0 ? Math.round((tokoBaTotalRevenue / totalAreaRevenue) * 1000) / 10 : 0;
  const tokoNonBaRevenuePercent =
    totalAreaRevenue > 0 ? Math.round((tokoNonBaTotalRevenue / totalAreaRevenue) * 1000) / 10 : 0;

  const tokoBaStorePercent =
    totalStoresCount > 0 ? Math.round((tokoBaCount / totalStoresCount) * 1000) / 10 : 0;
  const tokoNonBaStorePercent =
    totalStoresCount > 0 ? Math.round((tokoNonBaCount / totalStoresCount) * 1000) / 10 : 0;

  const tokoBaAvgRevenuePerStore =
    tokoBaCount > 0 ? Math.round(tokoBaTotalRevenue / tokoBaCount) : 0;
  const tokoNonBaAvgRevenuePerStore =
    tokoNonBaCount > 0 ? Math.round(tokoNonBaTotalRevenue / tokoNonBaCount) : 0;

  const tokoBaTotalQty = tokoBaList.reduce((sum, s) => sum + s.totalQtySold, 0);
  const tokoNonBaTotalQty = tokoNonBaList.reduce((sum, s) => sum + s.totalQtySold, 0);

  const tokoBaFocusPcs = tokoBaList.reduce((sum, s) => sum + s.focusProductPcs, 0);
  const tokoNonBaFocusPcs = tokoNonBaList.reduce((sum, s) => sum + s.focusProductPcs, 0);

  const productivityMultiplier =
    tokoNonBaAvgRevenuePerStore > 0
      ? Math.round((tokoBaAvgRevenuePerStore / tokoNonBaAvgRevenuePerStore) * 10) / 10
      : 1;

  const potentialBaCandidateStoresCount = tokoNonBaList.filter(
    (s) => s.performanceClass && s.performanceClass.includes('Pasang BA')
  ).length;

  const summary: StoreBaContributionSummary = {
    periodMonth: selectedMonth,
    periodYear: selectedYear,
    totalAreaRevenue,
    totalAreaQty,
    totalStoresCount,
    tokoBaCount,
    tokoBaStorePercent,
    tokoBaTotalRevenue,
    tokoBaRevenuePercent,
    tokoBaAvgRevenuePerStore,
    tokoBaTotalQty,
    tokoBaFocusPcs,
    tokoNonBaCount,
    tokoNonBaStorePercent,
    tokoNonBaTotalRevenue,
    tokoNonBaRevenuePercent,
    tokoNonBaAvgRevenuePerStore,
    tokoNonBaTotalQty,
    tokoNonBaFocusPcs,
    productivityMultiplier,
    potentialBaCandidateStoresCount,
    spvTotalRevenue,
    spvRevenuePercent,
    kaRevenue: effectiveKaRevenue,
    mgRevenue: effectiveMgRevenue,
    dazzleMeMgRevenue: effectiveMgRevenue,
    kaRevenuePercent,
    mgRevenuePercent,
    dazzleMeMgRevenuePercent: mgRevenuePercent,
    isManualKaMg,
    kaMgNotes,
  };

  return {
    stores: storeItems,
    summary,
  };
}

export function exportStoreBaContributionToExcel(
  stores: StoreBaContributionItem[],
  summary: StoreBaContributionSummary,
  selectedMonth: string,
  selectedYear: number
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Head-to-Head Summary
  const summaryAoa = [
    ['LAPORAN ANALISA KONTRIBUSI TOKO BA VS TOKO NON-BA & TOTAL PENJUALAN'],
    [`Periode: ${selectedMonth} ${selectedYear}`],
    [''],
    ['METRIK', 'TOKO DENGAN BA', 'TOKO NON-BA (TANPA BA)', 'TOTAL / SELISIH'],
    ['Jumlah Toko / Gerai', summary.tokoBaCount, summary.tokoNonBaCount, summary.totalStoresCount],
    ['% Jumlah Toko', `${summary.tokoBaStorePercent}%`, `${summary.tokoNonBaStorePercent}%`, '100%'],
    ['Total Omset Penjualan (IDR)', summary.tokoBaTotalRevenue, summary.tokoNonBaTotalRevenue, summary.totalAreaRevenue],
    ['% Kontribusi Omset', `${summary.tokoBaRevenuePercent}%`, `${summary.tokoNonBaRevenuePercent}%`, '100%'],
    ['Rata-rata Omset per Toko (IDR)', summary.tokoBaAvgRevenuePerStore, summary.tokoNonBaAvgRevenuePerStore, `${summary.productivityMultiplier}x Lebih Produktif`],
    ['Produk Fokus Terjual (Pcs)', summary.tokoBaFocusPcs, summary.tokoNonBaFocusPcs, summary.tokoBaFocusPcs + summary.tokoNonBaFocusPcs],
    ['Total Volume Terjual (Pcs)', summary.tokoBaTotalQty, summary.tokoNonBaTotalQty, summary.totalAreaQty],
    [''],
    ['KOMPOSISI TOTAL PENJUALAN', 'NILAI (IDR)', 'PERSENTASE', 'TIPE PERHITUNGAN'],
    ['Semua Penjualan SPV', summary.spvTotalRevenue || 0, `${summary.spvRevenuePercent || 0}%`, 'Otomatis Tim SPV'],
    ['Penjualan KA (Key Account)', summary.kaRevenue, `${summary.kaRevenuePercent}%`, summary.isManualKaMg ? 'Manual Override' : 'Otomatis Sheet'],
    ['PENJUALAN DAZZLE ME MG', summary.mgRevenue, `${summary.mgRevenuePercent}%`, summary.isManualKaMg ? 'Manual Override' : 'Otomatis Sheet'],
    ['Total Penjualan Area (SPV + KA + DAZZLE ME MG)', summary.totalAreaRevenue, '100%', summary.isManualKaMg ? 'Manual Override' : 'Otomatis Sheet'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Head-to-Head');

  // Sheet 2: Detail Seluruh Toko
  const detailHeaders = [
    'No',
    'Nama Toko',
    'Status Toko',
    'Nama BA',
    'Nomor BA',
    'Sales Rep',
    'Trainer',
    'Area',
    'SPV',
    'Total Omset (IDR)',
    '% Kontribusi',
    'Volume QTY (Pcs)',
    'Produk Fokus (Pcs)',
    'Nilai Produk Fokus (IDR)',
    'Transaksi',
    'Basket Size',
    'Klasifikasi Performa',
    'Rekomendasi Tindakan',
  ];

  const detailRows = stores.map((s, idx) => [
    idx + 1,
    s.storeName,
    s.hasBa ? 'Toko dengan BA' : 'Toko Non-BA',
    s.baName,
    s.baNumber || '-',
    s.salesName,
    s.trainerName,
    s.coverArea,
    s.spvName,
    s.totalRevenue,
    `${s.contributionPercent}%`,
    s.totalQtySold,
    s.focusProductPcs,
    s.focusProductValue,
    s.transactionCount,
    s.averageBasketSize,
    s.performanceClass,
    s.recommendationNote,
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Toko BA vs Non-BA');

  XLSX.writeFile(wb, `Laporan_Kontribusi_Toko_BA_vs_Non_BA_${selectedMonth}_${selectedYear}.xlsx`);
}
