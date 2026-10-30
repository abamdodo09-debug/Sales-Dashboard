import {
  TransactionRecord,
  DashboardFilters,
  MetricSummary,
  GrowthMetric,
  DimensionPerformance,
  TimeframeMode,
  SalesGapDiagnosis,
  DropEntityItem,
  GapDriverFactor,
  EntityProductAnalysisItem,
  FocusNewOverallSummary,
  ComparisonGrowthResult,
  ProductStatusSummary,
  ProductStatusMetricItem,
  ProductLifecycleStatus,
} from '../types/dashboard';

// Product Lifecycle Statuses (Bilingual Chinese - English)
export const ALL_PRODUCT_STATUSES: ProductLifecycleStatus[] = [
  '核心品 - Core Products',
  '新品 - New Products',
  '常规品 - Regular Products',
  '清库品 - Clearance',
  '淘汰品 - Discontinue Products',
  '退市品 - Delisted Product',
  '淘汰品 - Obsolete',
];

export const PRODUCT_STATUS_CONFIG: Record<
  string,
  {
    labelCn: string;
    labelEn: string;
    labelId: string;
    color: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    actionStrategy: string;
    priority: number;
  }
> = {
  '核心品 - Core Products': {
    labelCn: '核心品',
    labelEn: 'Core Products',
    labelId: 'Produk Inti / Hero',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderClass: 'border-emerald-300',
    bgClass: 'from-emerald-500/10 to-teal-500/5',
    actionStrategy: 'Pertahankan ketersediaan stok 98%+, tempatkan di display utama gerai, hindari OOS.',
    priority: 1,
  },
  '新品 - New Products': {
    labelCn: '新品',
    labelEn: 'New Products',
    labelId: 'Produk Baru / Launching',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    borderClass: 'border-blue-300',
    bgClass: 'from-blue-500/10 to-indigo-500/5',
    actionStrategy: 'Genjot penetrasi toko (NOO), program tester BA aktif, sampling konsumen, display eye-level.',
    priority: 2,
  },
  '常规品 - Regular Products': {
    labelCn: '常规品',
    labelEn: 'Regular Products',
    labelId: 'Produk Reguler / Stabil',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    borderClass: 'border-slate-300',
    bgClass: 'from-slate-500/10 to-slate-400/5',
    actionStrategy: 'Jaga perputaran stok normal (run-rate), reorder terjadwal, dan pertahankan space shelf.',
    priority: 3,
  },
  '清库品 - Clearance': {
    labelCn: '清库品',
    labelEn: 'Clearance',
    labelId: 'Cuci Gudang / Clearance',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-amber-300',
    bgClass: 'from-amber-500/10 to-yellow-500/5',
    actionStrategy: 'Program bundling diskon agresif, bonus beli 2 gratis 1, pindahkan ke toko bervolume tinggi.',
    priority: 4,
  },
  '淘汰品 - Discontinue Products': {
    labelCn: '淘汰品',
    labelEn: 'Discontinue Products',
    labelId: 'Produk Diskontinu',
    color: 'orange',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    borderClass: 'border-orange-300',
    bgClass: 'from-orange-500/10 to-amber-500/5',
    actionStrategy: 'Hentikan pengadaan baru, percepat sell-down sisa stok ke toko tier-2/3, alihkan ke SKU pengganti.',
    priority: 5,
  },
  '退市品 - Delisted Product': {
    labelCn: '退市品',
    labelEn: 'Delisted Product',
    labelId: 'Produk Ditarik / Delisted',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    borderClass: 'border-purple-300',
    bgClass: 'from-purple-500/10 to-pink-500/5',
    actionStrategy: 'Koordinasi penarikan dari rak display toko modern/DC, tutup PO aktif, proses retur distributor.',
    priority: 6,
  },
  '淘汰品 - Obsolete': {
    labelCn: '淘汰品',
    labelEn: 'Obsolete',
    labelId: 'Produk Usang / Obsolete',
    color: 'rose',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    borderClass: 'border-rose-300',
    bgClass: 'from-rose-500/10 to-red-500/5',
    actionStrategy: 'Lakukan evaluasi write-off / pemusnahan barang rusak-kadaluarsa, atau lelang aset batch akhir.',
    priority: 7,
  },
};

export const SKU_STATUS_MAP: Record<string, string> = {
  '18186': '核心品 - Core Products',
  '18629': '核心品 - Core Products',
  '115888': '淘汰品 - Obsolete',
  '672495': '新品 - New Products',
  '115017': '核心品 - Core Products',
  '117509': '清库品 - Clearance',
  '123685': '新品 - New Products',
  '21018': '核心品 - Core Products',
  '15604': '常规品 - Regular Products',
  '671528': '淘汰品 - Discontinue Products',
  '673546': '新品 - New Products',
  '898478': '常规品 - Regular Products',
  '118803': '新品 - New Products',
  '673829': '新品 - New Products',
  '1836': '核心品 - Core Products',
  '672464': '新品 - New Products',
  '117479': '常规品 - Regular Products',
  '676769': '核心品 - Core Products',
  '107432': '淘汰品 - Discontinue Products',
  '121421': '新品 - New Products',
  '115697': '常规品 - Regular Products',
  '671573': '核心品 - Core Products',
  '672747': '核心品 - Core Products',
  '109634': '常规品 - Regular Products',
  '673584': '新品 - New Products',
  '19183': '核心品 - Core Products',
  '117516': '清库品 - Clearance',
  '19176': '常规品 - Regular Products',
  '3205': '清库品 - Clearance',
  '671054': '核心品 - Core Products',
  '670316': '退市品 - Delisted Product',
  '672907': '新品 - New Products',
  '674208': '新品 - New Products',
  '18315': '退市品 - Delisted Product',
  '115482': '淘汰品 - Obsolete',
  '5360': '清库品 - Clearance',
  '672471': '新品 - New Products',
};

// Robust resolver for product lifecycle status
export function resolveProductStatus(record: TransactionRecord): string {
  if (record.STATUS_PRODUK && record.STATUS_PRODUK.trim()) {
    const raw = record.STATUS_PRODUK.trim();
    // Check if matches known statuses directly
    const matched = ALL_PRODUCT_STATUSES.find(
      (s) => s.toLowerCase() === raw.toLowerCase() || s.includes(raw) || raw.includes(s.split(' - ')[0])
    );
    if (matched) return matched;
    return raw;
  }
  if (record.NO_SKU && SKU_STATUS_MAP[record.NO_SKU]) {
    return SKU_STATUS_MAP[record.NO_SKU];
  }
  for (const [noSku, status] of Object.entries(SKU_STATUS_MAP)) {
    if (record.SKU && record.SKU.includes(noSku)) return status;
  }
  if (isNewProduct(record.PRODUK_NEW)) {
    return '新品 - New Products';
  }
  if (isFocusProduct(record.PRODUK_FOCUS)) {
    return '核心品 - Core Products';
  }
  return '常规品 - Regular Products';
}

// Product type detection helpers
export function isFocusProduct(val?: string): boolean {
  if (!val) return false;
  const upper = String(val).trim().toUpperCase();
  return upper === 'FOCUS' || upper === 'FOKUS' || upper === 'YES' || upper === 'YA' || upper === 'TRUE' || upper === 'Y';
}

export function isNewProduct(val?: string): boolean {
  if (!val) return false;
  const upper = String(val).trim().toUpperCase();
  return upper === 'NEW' || upper === 'BARU' || upper === 'YES' || upper === 'YA' || upper === 'TRUE' || upper === 'Y';
}

export const MONTH_ORDER: Record<string, number> = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

export const MONTH_NAMES_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

// Indonesian Rupiah formatter
export function formatRupiah(amount: number, compact: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    if (abs >= 1_000_000) {
      return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
    }
    if (abs >= 1_000) {
      return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
    }
  }

  const isNeg = amount < 0;
  const absInt = Math.abs(Math.round(amount));
  const formatted = absInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNeg ? '- ' : ''}Rp ${formatted}`;
}

// Number formatter with dots
export function formatNumber(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Percent formatter with +/- sign
export function formatPercent(percent: number, showSign: boolean = true): string {
  if (percent === undefined || percent === null || isNaN(percent) || !isFinite(percent)) return '0%';
  const sign = percent > 0 && showSign ? '+' : '';
  return `${sign}${percent.toFixed(1).replace('.', ',')}%`;
}

// Filter engine: cascades cross-filters
export function filterRecords(
  records: TransactionRecord[],
  filters: DashboardFilters
): TransactionRecord[] {
  return records.filter((r) => {
    // Bulan
    if (filters.BULAN !== 'ALL' && r.BULAN !== filters.BULAN) return false;

    // Tahun
    if (filters.TAHUN !== 'ALL' && String(r.TAHUN) !== String(filters.TAHUN)) return false;

    // Sales
    if (filters.SALES !== 'ALL' && r.SALES !== filters.SALES) return false;

    // SPV
    if (filters.SPV !== 'ALL' && r.SPV !== filters.SPV) return false;

    // Brand
    if (filters.BRAND !== 'ALL' && r.BRAND !== filters.BRAND) return false;

    // Kategori
    if (filters.KATEGORI && filters.KATEGORI !== 'ALL' && r.KATEGORI !== filters.KATEGORI) return false;

    // Status Produk (Lifecycle Status)
    if (filters.STATUS_PRODUK && filters.STATUS_PRODUK !== 'ALL') {
      const status = resolveProductStatus(r);
      if (status !== filters.STATUS_PRODUK) return false;
    }

    // Store
    if (filters.NAMA_STORE !== 'ALL' && r.NAMA_STORE !== filters.NAMA_STORE) return false;

    // Region
    if (filters.REGION !== 'ALL' && r.REGION !== filters.REGION) return false;

    // Ket
    if (filters.KET !== 'ALL' && r.KET !== filters.KET) return false;

    // SKU
    if (filters.SKU !== 'ALL') {
      const matchSku = r.SKU.toLowerCase().includes(filters.SKU.toLowerCase()) ||
        r.NO_SKU.includes(filters.SKU) ||
        r.SPU.toLowerCase().includes(filters.SKU.toLowerCase());
      if (!matchSku) return false;
    }

    // Free text search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        r.SKU.toLowerCase().includes(q) ||
        (r.KATEGORI && r.KATEGORI.toLowerCase().includes(q)) ||
        (r.STATUS_PRODUK && r.STATUS_PRODUK.toLowerCase().includes(q)) ||
        r.NAMA_STORE.toLowerCase().includes(q) ||
        r.SALES.toLowerCase().includes(q) ||
        r.SPV.toLowerCase().includes(q) ||
        r.BRAND.toLowerCase().includes(q) ||
        r.REGION.toLowerCase().includes(q) ||
        r.NO_SKU.toLowerCase().includes(q) ||
        r.SPU.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

// Get dynamic available filter options based on other active selections (cascading)
export function getCascadingOptions(
  allRecords: TransactionRecord[],
  currentFilters: DashboardFilters
) {
  // Compute option sets with partial filters applied
  const filterIgnoring = (ignoreKey: keyof DashboardFilters) => {
    return allRecords.filter((r) => {
      if (ignoreKey !== 'BULAN' && currentFilters.BULAN !== 'ALL' && r.BULAN !== currentFilters.BULAN) return false;
      if (ignoreKey !== 'TAHUN' && currentFilters.TAHUN !== 'ALL' && String(r.TAHUN) !== String(currentFilters.TAHUN)) return false;
      if (ignoreKey !== 'SALES' && currentFilters.SALES !== 'ALL' && r.SALES !== currentFilters.SALES) return false;
      if (ignoreKey !== 'SPV' && currentFilters.SPV !== 'ALL' && r.SPV !== currentFilters.SPV) return false;
      if (ignoreKey !== 'BRAND' && currentFilters.BRAND !== 'ALL' && r.BRAND !== currentFilters.BRAND) return false;
      if (ignoreKey !== 'KATEGORI' && currentFilters.KATEGORI && currentFilters.KATEGORI !== 'ALL' && r.KATEGORI !== currentFilters.KATEGORI) return false;
      if (ignoreKey !== 'STATUS_PRODUK' && currentFilters.STATUS_PRODUK && currentFilters.STATUS_PRODUK !== 'ALL') {
        const st = resolveProductStatus(r);
        if (st !== currentFilters.STATUS_PRODUK) return false;
      }
      if (ignoreKey !== 'NAMA_STORE' && currentFilters.NAMA_STORE !== 'ALL' && r.NAMA_STORE !== currentFilters.NAMA_STORE) return false;
      if (ignoreKey !== 'REGION' && currentFilters.REGION !== 'ALL' && r.REGION !== currentFilters.REGION) return false;
      if (ignoreKey !== 'KET' && currentFilters.KET !== 'ALL' && r.KET !== currentFilters.KET) return false;
      return true;
    });
  };

  const getUnique = (arr: TransactionRecord[], key: keyof TransactionRecord) => {
    return Array.from(new Set(arr.map((item) => String(item[key] || '')).filter(Boolean))).sort();
  };

  // Sort months by calendar order
  const availableMonths = getUnique(filterIgnoring('BULAN'), 'BULAN').sort((a, b) => {
    return (MONTH_ORDER[a] || 99) - (MONTH_ORDER[b] || 99);
  });

  const availableYears = getUnique(filterIgnoring('TAHUN'), 'TAHUN').sort((a, b) => Number(b) - Number(a));
  const availableSales = getUnique(filterIgnoring('SALES'), 'SALES');
  const availableSpv = getUnique(filterIgnoring('SPV'), 'SPV');
  const availableBrands = getUnique(filterIgnoring('BRAND'), 'BRAND');
  const availableCategories = getUnique(filterIgnoring('KATEGORI'), 'KATEGORI');
  const availableStores = getUnique(filterIgnoring('NAMA_STORE'), 'NAMA_STORE');
  const availableRegions = getUnique(filterIgnoring('REGION'), 'REGION');
  const availableKet = getUnique(filterIgnoring('KET'), 'KET');

  // Available Status Produk
  const availableStatusProduk = Array.from(
    new Set(filterIgnoring('STATUS_PRODUK').map((r) => resolveProductStatus(r)).filter(Boolean))
  ).sort((a, b) => {
    const priorityA = PRODUCT_STATUS_CONFIG[a]?.priority || 99;
    const priorityB = PRODUCT_STATUS_CONFIG[b]?.priority || 99;
    return priorityA - priorityB;
  });

  return {
    months: availableMonths,
    years: availableYears,
    sales: availableSales,
    spv: availableSpv,
    brands: availableBrands,
    categories: availableCategories,
    statusProduk: availableStatusProduk,
    stores: availableStores,
    regions: availableRegions,
    ket: availableKet,
  };
}

// Analisa Status Produk (Product Lifecycle & Merchandising Performance)
export function calculateProductStatusAnalysis(records: TransactionRecord[]): ProductStatusSummary {
  let totalValue = 0;
  let totalQty = 0;

  const statusSkus: Record<string, Set<string>> = {};
  const statusValues: Record<string, number> = {};
  const statusQtys: Record<string, number> = {};
  const statusTxCounts: Record<string, number> = {};
  const skuAggregation: Record<
    string,
    { sku: string; brand: string; noSku: string; kategori: string; status: string; value: number; qty: number }
  > = {};

  // Inisialisasi 7 status standar agar selalu terurut dan konsisten
  ALL_PRODUCT_STATUSES.forEach((st) => {
    statusSkus[st] = new Set<string>();
    statusValues[st] = 0;
    statusQtys[st] = 0;
    statusTxCounts[st] = 0;
  });

  const allDistinctSkus = new Set<string>();

  for (const r of records) {
    const val = r.VALUE || 0;
    const qty = r.QTY || 0;
    const status = resolveProductStatus(r);

    totalValue += val;
    totalQty += qty;

    const skuKey = r.NO_SKU || r.SKU;
    allDistinctSkus.add(skuKey);

    if (!statusSkus[status]) {
      statusSkus[status] = new Set<string>();
      statusValues[status] = 0;
      statusQtys[status] = 0;
      statusTxCounts[status] = 0;
    }

    statusSkus[status].add(skuKey);
    statusValues[status] += val;
    statusQtys[status] += qty;
    statusTxCounts[status] += 1;

    // Track per-SKU
    if (!skuAggregation[skuKey]) {
      skuAggregation[skuKey] = {
        sku: r.SKU,
        brand: r.BRAND,
        noSku: r.NO_SKU,
        kategori: r.KATEGORI || 'Lainnya',
        status,
        value: 0,
        qty: 0,
      };
    }
    skuAggregation[skuKey].value += val;
    skuAggregation[skuKey].qty += qty;
  }

  // Bangun daftar metrik status produk
  const statuses: ProductStatusMetricItem[] = Object.keys(statusValues).map((st) => {
    const cfg = PRODUCT_STATUS_CONFIG[st] || {
      labelCn: st.split(' - ')[0] || st,
      labelEn: st.split(' - ')[1] || st,
      labelId: 'Status Produk',
      color: 'slate',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      borderClass: 'border-slate-300',
      bgClass: 'from-slate-500/10 to-slate-400/5',
      actionStrategy: 'Monitor perputaran stok.',
      priority: 99,
    };

    const sVal = statusValues[st] || 0;
    const sQty = statusQtys[st] || 0;
    const valShare = totalValue > 0 ? (sVal / totalValue) * 100 : 0;
    const qtyShare = totalQty > 0 ? (sQty / totalQty) * 100 : 0;
    const avgPrice = sQty > 0 ? Math.round(sVal / sQty) : 0;

    const topSkus = Object.values(skuAggregation)
      .filter((s) => s.status === st)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((s) => ({
        sku: s.sku,
        brand: s.brand,
        value: s.value,
        qty: s.qty,
      }));

    return {
      status: st,
      labelCn: cfg.labelCn,
      labelEn: cfg.labelEn,
      color: cfg.color,
      badgeClass: cfg.badgeClass,
      borderClass: cfg.borderClass,
      bgClass: cfg.bgClass,
      totalValue: sVal,
      totalQty: sQty,
      skuCount: statusSkus[st]?.size || 0,
      transactionCount: statusTxCounts[st] || 0,
      valueSharePercent: valShare,
      qtySharePercent: qtyShare,
      averagePrice: avgPrice,
      actionStrategy: cfg.actionStrategy,
      topSkus,
    };
  }).sort((a, b) => {
    const pA = PRODUCT_STATUS_CONFIG[a.status]?.priority || 99;
    const pB = PRODUCT_STATUS_CONFIG[b.status]?.priority || 99;
    return pA - pB;
  });

  const topCoreSkus = Object.values(skuAggregation)
    .filter((s) => s.status === '核心品 - Core Products')
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((s) => ({ sku: s.sku, brand: s.brand, value: s.value, qty: s.qty }));

  const topNewSkus = Object.values(skuAggregation)
    .filter((s) => s.status === '新品 - New Products')
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((s) => ({ sku: s.sku, brand: s.brand, value: s.value, qty: s.qty }));

  // Nilai inventori berisiko (Clearance + Discontinue + Delisted + Obsolete)
  const clearanceObsoleteValue =
    (statusValues['清库品 - Clearance'] || 0) +
    (statusValues['淘汰品 - Discontinue Products'] || 0) +
    (statusValues['退市品 - Delisted Product'] || 0) +
    (statusValues['淘汰品 - Obsolete'] || 0);

  const clearanceObsoleteShare = totalValue > 0 ? (clearanceObsoleteValue / totalValue) * 100 : 0;

  return {
    totalValue,
    totalQty,
    totalSkuCount: allDistinctSkus.size,
    statuses,
    topCoreSkus,
    topNewSkus,
    clearanceObsoleteValue,
    clearanceObsoleteShare,
  };
}

// Compute executive KPI summary
export function calculateSummary(records: TransactionRecord[]): MetricSummary {
  let totalRevenue = 0;
  let grossRevenue = 0;
  let totalReturnRevenue = 0;
  let totalQty = 0;

  for (const r of records) {
    const val = r.VALUE || 0;
    const qty = r.QTY || 0;

    totalRevenue += val;
    totalQty += qty;

    if (val < 0 || r.KET === 'RETURN') {
      totalReturnRevenue += Math.abs(val);
    } else {
      grossRevenue += val;
    }
  }

  const totalTransactions = records.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const returnRatePercent = grossRevenue > 0 ? (totalReturnRevenue / grossRevenue) * 100 : 0;

  return {
    totalRevenue,
    grossRevenue,
    totalReturnRevenue,
    totalQty,
    totalTransactions,
    averageOrderValue,
    returnRatePercent,
  };
}

// Dimension aggregator (Sales, SPV, Brand, Store, SKU, Region, Kategori)
export function aggregateByDimension(
  records: TransactionRecord[],
  dimensionKey: 'SALES' | 'SPV' | 'BRAND' | 'NAMA_STORE' | 'SKU' | 'REGION' | 'KATEGORI'
): DimensionPerformance[] {
  const map: Record<string, {
    totalValue: number;
    totalQty: number;
    txCount: number;
    brands: Record<string, number>;
  }> = {};

  let grandTotalValue = 0;

  for (const r of records) {
    const name = String(r[dimensionKey] || 'N/A');
    if (!map[name]) {
      map[name] = { totalValue: 0, totalQty: 0, txCount: 0, brands: {} };
    }
    const val = r.VALUE || 0;
    map[name].totalValue += val;
    map[name].totalQty += (r.QTY || 0);
    map[name].txCount += 1;
    map[name].brands[r.BRAND] = (map[name].brands[r.BRAND] || 0) + val;
    grandTotalValue += val;
  }

  const results: DimensionPerformance[] = Object.keys(map).map((name) => {
    const item = map[name];
    const contributionPercent = grandTotalValue > 0 ? (item.totalValue / grandTotalValue) * 100 : 0;

    // Realistic targets:
    let target = Math.round(item.totalValue * 1.12);
    if (item.totalValue > 50_000_000) target = 60_000_000;
    else if (item.totalValue > 20_000_000) target = 30_000_000;
    else if (item.totalValue > 10_000_000) target = 15_000_000;
    else target = Math.max(5_000_000, Math.round(item.totalValue * 1.15));

    const achievementPercent = target > 0 ? (item.totalValue / target) * 100 : 0;

    return {
      name,
      totalValue: item.totalValue,
      totalQty: item.totalQty,
      transactionCount: item.txCount,
      contributionPercent,
      target,
      achievementPercent,
      brandBreakdown: item.brands,
    };
  });

  return results.sort((a, b) => b.totalValue - a.totalValue);
}

export interface CategoryDetailData {
  category: string;
  totalValue: number;
  totalQty: number;
  txCount: number;
  contributionPercent: number;
  avgPrice: number;
  brandBreakdown: { brand: string; value: number; qty: number; percent: number }[];
  focusValue: number;
  focusPercent: number;
  regularValue: number;
  topSkus: { sku: string; brand: string; value: number; qty: number }[];
  storeCount: number;
  returnValue: number;
  returnRate: number;
}

// Deep category analytics
export function aggregateCategoryDetails(records: TransactionRecord[]): CategoryDetailData[] {
  const map: Record<string, {
    totalValue: number;
    totalQty: number;
    txCount: number;
    returnValue: number;
    focusValue: number;
    regularValue: number;
    brands: Record<string, { value: number; qty: number }>;
    skus: Record<string, { sku: string; brand: string; value: number; qty: number }>;
    stores: Set<string>;
  }> = {};

  let grandTotalValue = 0;

  for (const r of records) {
    const cat = r.KATEGORI || 'Lainnya';
    if (!map[cat]) {
      map[cat] = {
        totalValue: 0,
        totalQty: 0,
        txCount: 0,
        returnValue: 0,
        focusValue: 0,
        regularValue: 0,
        brands: {},
        skus: {},
        stores: new Set(),
      };
    }

    const val = r.VALUE || 0;
    const qty = r.QTY || 0;
    grandTotalValue += val;

    map[cat].totalValue += val;
    map[cat].totalQty += qty;
    map[cat].txCount += 1;
    if (r.NAMA_STORE) map[cat].stores.add(r.NAMA_STORE);

    if (val < 0 || r.KET === 'RETURN') {
      map[cat].returnValue += Math.abs(val);
    }

    if (r.PRODUK_FOCUS === 'FOCUS') {
      map[cat].focusValue += val;
    } else {
      map[cat].regularValue += val;
    }

    // Brands
    if (!map[cat].brands[r.BRAND]) {
      map[cat].brands[r.BRAND] = { value: 0, qty: 0 };
    }
    map[cat].brands[r.BRAND].value += val;
    map[cat].brands[r.BRAND].qty += qty;

    // SKUs
    const skuKey = r.SKU || r.SPU || r.NO_SKU;
    if (!map[cat].skus[skuKey]) {
      map[cat].skus[skuKey] = { sku: skuKey, brand: r.BRAND, value: 0, qty: 0 };
    }
    map[cat].skus[skuKey].value += val;
    map[cat].skus[skuKey].qty += qty;
  }

  const results: CategoryDetailData[] = Object.keys(map).map((cat) => {
    const item = map[cat];
    const contributionPercent = grandTotalValue > 0 ? (item.totalValue / grandTotalValue) * 100 : 0;
    const avgPrice = item.totalQty > 0 ? item.totalValue / item.totalQty : 0;
    const grossVal = item.totalValue + item.returnValue;
    const returnRate = grossVal > 0 ? (item.returnValue / grossVal) * 100 : 0;
    const focusPercent = item.totalValue > 0 ? (item.focusValue / item.totalValue) * 100 : 0;

    const brandBreakdown = Object.entries(item.brands)
      .map(([brand, bData]) => ({
        brand,
        value: bData.value,
        qty: bData.qty,
        percent: item.totalValue > 0 ? (bData.value / item.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const topSkus = Object.values(item.skus)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      category: cat,
      totalValue: item.totalValue,
      totalQty: item.totalQty,
      txCount: item.txCount,
      contributionPercent,
      avgPrice,
      brandBreakdown,
      focusValue: item.focusValue,
      focusPercent,
      regularValue: item.regularValue,
      topSkus,
      storeCount: item.stores.size,
      returnValue: item.returnValue,
      returnRate,
    };
  });

  return results.sort((a, b) => b.totalValue - a.totalValue);
}

// Timeframe aggregator (Harian, Mingguan, Bulanan, Tahunan)
export function aggregateTimeframe(
  records: TransactionRecord[],
  mode: TimeframeMode
): { label: string; subLabel: string; value: number; qty: number; txCount: number; dateRef?: string }[] {
  if (records.length === 0) return [];

  if (mode === 'harian') {
    // Group by Date string
    const map: Record<string, { value: number; qty: number; txCount: number; dateObj: Date }> = {};

    for (const r of records) {
      const key = r.TANGGAL;
      if (!map[key]) {
        const d = new Date(key);
        map[key] = { value: 0, qty: 0, txCount: 0, dateObj: isNaN(d.getTime()) ? new Date() : d };
      }
      map[key].value += r.VALUE || 0;
      map[key].qty += r.QTY || 0;
      map[key].txCount += 1;
    }

    return Object.entries(map)
      .sort((a, b) => a[1].dateObj.getTime() - b[1].dateObj.getTime())
      .map(([key, data]) => {
        // Format day name e.g. "29 Sep"
        const d = data.dateObj;
        const dayStr = !isNaN(d.getTime())
          ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : key;
        const weekdayStr = !isNaN(d.getTime())
          ? d.toLocaleDateString('id-ID', { weekday: 'short' })
          : '';

        return {
          label: dayStr,
          subLabel: weekdayStr,
          value: data.value,
          qty: data.qty,
          txCount: data.txCount,
          dateRef: key,
        };
      });
  }

  if (mode === 'mingguan') {
    // Group by Week Number
    const map: Record<number, { value: number; qty: number; txCount: number }> = {};

    for (const r of records) {
      const w = r.weekNumber || 1;
      if (!map[w]) {
        map[w] = { value: 0, qty: 0, txCount: 0 };
      }
      map[w].value += r.VALUE || 0;
      map[w].qty += r.QTY || 0;
      map[w].txCount += 1;
    }

    return Object.entries(map)
      .map(([w, data]) => ({ week: Number(w), ...data }))
      .sort((a, b) => a.week - b.week)
      .map((item) => ({
        label: `Mgg ${item.week}`,
        subLabel: `Week ${item.week}`,
        value: item.value,
        qty: item.qty,
        txCount: item.txCount,
      }));
  }

  if (mode === 'bulanan') {
    // Group by Month
    const map: Record<string, { value: number; qty: number; txCount: number; order: number }> = {};

    for (const r of records) {
      const m = r.BULAN || 'UNKNOWN';
      if (!map[m]) {
        map[m] = {
          value: 0,
          qty: 0,
          txCount: 0,
          order: MONTH_ORDER[m] || 99,
        };
      }
      map[m].value += r.VALUE || 0;
      map[m].qty += r.QTY || 0;
      map[m].txCount += 1;
    }

    return Object.entries(map)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([month, data]) => ({
        label: month.length > 3 ? month.slice(0, 3) : month,
        subLabel: month,
        value: data.value,
        qty: data.qty,
        txCount: data.txCount,
      }));
  }

  // Tahunan
  const map: Record<number, { value: number; qty: number; txCount: number }> = {};

  for (const r of records) {
    const y = r.TAHUN || 2026;
    if (!map[y]) {
      map[y] = { value: 0, qty: 0, txCount: 0 };
    }
    map[y].value += r.VALUE || 0;
    map[y].qty += r.QTY || 0;
    map[y].txCount += 1;
  }

  return Object.entries(map)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, data]) => ({
      label: String(year),
      subLabel: `Tahun ${year}`,
      value: data.value,
      qty: data.qty,
      txCount: data.txCount,
    }));
}

// Growth & Comparison engine: Week vs Week, Month vs Month, Year vs Year with Focus & New Product Analysis
export function calculateComparisonGrowth(
  allRecords: TransactionRecord[],
  mode: 'wow' | 'mom' | 'yoy',
  selectedFilters: DashboardFilters
): ComparisonGrowthResult {
  // Determine target years and subsets
  let currentRecords: TransactionRecord[] = [];
  let previousRecords: TransactionRecord[] = [];
  let currentPeriodLabel = '';
  let previousPeriodLabel = '';

  const activeYear = selectedFilters.TAHUN !== 'ALL' ? Number(selectedFilters.TAHUN) : 2026;

  if (mode === 'wow') {
    // Week vs Week
    const activeWeeks = Array.from(new Set(
      allRecords
        .filter((r) => r.TAHUN === activeYear && (selectedFilters.BULAN === 'ALL' || r.BULAN === selectedFilters.BULAN))
        .map((r) => r.weekNumber || 39)
    )).sort((a, b) => b - a);

    const currentWeek = activeWeeks[0] || 39;
    const previousWeek = activeWeeks[1] || (currentWeek > 1 ? currentWeek - 1 : 1);

    currentPeriodLabel = `Minggu ${currentWeek}`;
    previousPeriodLabel = `Minggu ${previousWeek}`;

    currentRecords = allRecords.filter((r) => r.TAHUN === activeYear && r.weekNumber === currentWeek);
    previousRecords = allRecords.filter((r) => r.TAHUN === activeYear && r.weekNumber === previousWeek);
  } else if (mode === 'mom') {
    // Month vs Month
    let targetMonth = selectedFilters.BULAN !== 'ALL' ? selectedFilters.BULAN : 'SEPTEMBER';
    const currentMonthIdx = MONTH_ORDER[targetMonth] || 9;
    const prevMonthIdx = currentMonthIdx > 1 ? currentMonthIdx - 1 : 12;
    const prevMonthName = MONTH_NAMES_ID[prevMonthIdx - 1];

    currentPeriodLabel = targetMonth;
    previousPeriodLabel = prevMonthName;

    currentRecords = allRecords.filter((r) => r.TAHUN === activeYear && r.BULAN === targetMonth);
    previousRecords = allRecords.filter((r) => r.TAHUN === activeYear && r.BULAN === prevMonthName);
  } else {
    // Year vs Year (YoY)
    const currentYear = activeYear;
    const previousYear = currentYear - 1;

    currentPeriodLabel = `Tahun ${currentYear}`;
    previousPeriodLabel = `Tahun ${previousYear}`;

    if (selectedFilters.BULAN !== 'ALL') {
      currentPeriodLabel += ` (${selectedFilters.BULAN})`;
      previousPeriodLabel += ` (${selectedFilters.BULAN})`;
      currentRecords = allRecords.filter((r) => r.TAHUN === currentYear && r.BULAN === selectedFilters.BULAN);
      previousRecords = allRecords.filter((r) => r.TAHUN === previousYear && r.BULAN === selectedFilters.BULAN);
    } else {
      currentRecords = allRecords.filter((r) => r.TAHUN === currentYear);
      previousRecords = allRecords.filter((r) => r.TAHUN === previousYear);
    }
  }

  // Calculate totals
  const sumVal = (arr: TransactionRecord[]) => arr.reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const sumQty = (arr: TransactionRecord[]) => arr.reduce((acc, r) => acc + (r.QTY || 0), 0);

  const curVal = sumVal(currentRecords);
  const prevVal = sumVal(previousRecords);
  const deltaVal = curVal - prevVal;
  const growthValPercent = prevVal !== 0 ? (deltaVal / Math.abs(prevVal)) * 100 : (curVal > 0 ? 100 : 0);

  const curQty = sumQty(currentRecords);
  const prevQty = sumQty(previousRecords);
  const growthQtyPercent = prevQty !== 0 ? ((curQty - prevQty) / Math.abs(prevQty)) * 100 : 0;

  const overall: GrowthMetric = {
    currentValue: curVal,
    previousValue: prevVal,
    deltaValue: deltaVal,
    growthPercent: growthValPercent,
    currentQty: curQty,
    previousQty: prevQty,
    growthQtyPercent,
  };

  // Overall Focus Product Summary
  const curFocusVal = currentRecords.filter((r) => isFocusProduct(r.PRODUK_FOCUS)).reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const prevFocusVal = previousRecords.filter((r) => isFocusProduct(r.PRODUK_FOCUS)).reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const focusDelta = curFocusVal - prevFocusVal;
  const focusGrowth = prevFocusVal !== 0 ? (focusDelta / Math.abs(prevFocusVal)) * 100 : (curFocusVal > 0 ? 100 : 0);
  const curFocusQty = currentRecords.filter((r) => isFocusProduct(r.PRODUK_FOCUS)).reduce((acc, r) => acc + (r.QTY || 0), 0);
  const prevFocusQty = previousRecords.filter((r) => isFocusProduct(r.PRODUK_FOCUS)).reduce((acc, r) => acc + (r.QTY || 0), 0);

  const focusSummary: FocusNewOverallSummary = {
    current: curFocusVal,
    previous: prevFocusVal,
    delta: focusDelta,
    growth: focusGrowth,
    shareCurrent: curVal > 0 ? (curFocusVal / curVal) * 100 : 0,
    sharePrevious: prevVal > 0 ? (prevFocusVal / prevVal) * 100 : 0,
    currentQty: curFocusQty,
    previousQty: prevFocusQty,
  };

  // Overall New Product Summary
  const curNewVal = currentRecords.filter((r) => isNewProduct(r.PRODUK_NEW)).reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const prevNewVal = previousRecords.filter((r) => isNewProduct(r.PRODUK_NEW)).reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const newDelta = curNewVal - prevNewVal;
  const newGrowth = prevNewVal !== 0 ? (newDelta / Math.abs(prevNewVal)) * 100 : (curNewVal > 0 ? 100 : 0);
  const curNewQty = currentRecords.filter((r) => isNewProduct(r.PRODUK_NEW)).reduce((acc, r) => acc + (r.QTY || 0), 0);
  const prevNewQty = previousRecords.filter((r) => isNewProduct(r.PRODUK_NEW)).reduce((acc, r) => acc + (r.QTY || 0), 0);

  const newSummary: FocusNewOverallSummary = {
    current: curNewVal,
    previous: prevNewVal,
    delta: newDelta,
    growth: newGrowth,
    shareCurrent: curVal > 0 ? (curNewVal / curVal) * 100 : 0,
    sharePrevious: prevVal > 0 ? (prevNewVal / prevVal) * 100 : 0,
    currentQty: curNewQty,
    previousQty: prevNewQty,
  };

  // Helper for dimension breakdown with detailed Produk Fokus & Produk New metrics
  const buildDimensionComparison = (
    dimension: 'SALES' | 'SPV' | 'BRAND' | 'NAMA_STORE' | 'KATEGORI'
  ): EntityProductAnalysisItem[] => {
    interface EntityAgg {
      total: number;
      qty: number;
      focus: number;
      focusQty: number;
      newVal: number;
      newQty: number;
      regular: number;
      focusSkus: Record<string, { sku: string; brand: string; value: number; qty: number }>;
      newSkus: Record<string, { sku: string; brand: string; value: number; qty: number }>;
    }

    const initAgg = (): EntityAgg => ({
      total: 0,
      qty: 0,
      focus: 0,
      focusQty: 0,
      newVal: 0,
      newQty: 0,
      regular: 0,
      focusSkus: {},
      newSkus: {},
    });

    const curMap: Record<string, EntityAgg> = {};
    const prevMap: Record<string, EntityAgg> = {};

    currentRecords.forEach((r) => {
      const k = String(r[dimension] || 'N/A');
      if (!curMap[k]) curMap[k] = initAgg();
      const val = r.VALUE || 0;
      const qty = r.QTY || 0;
      const skuKey = r.SKU || r.SPU || r.NO_SKU || 'SKU';
      const isFocus = isFocusProduct(r.PRODUK_FOCUS);
      const isNew = isNewProduct(r.PRODUK_NEW);

      curMap[k].total += val;
      curMap[k].qty += qty;

      if (isFocus) {
        curMap[k].focus += val;
        curMap[k].focusQty += qty;
        if (!curMap[k].focusSkus[skuKey]) {
          curMap[k].focusSkus[skuKey] = { sku: skuKey, brand: r.BRAND, value: 0, qty: 0 };
        }
        curMap[k].focusSkus[skuKey].value += val;
        curMap[k].focusSkus[skuKey].qty += qty;
      }

      if (isNew) {
        curMap[k].newVal += val;
        curMap[k].newQty += qty;
        if (!curMap[k].newSkus[skuKey]) {
          curMap[k].newSkus[skuKey] = { sku: skuKey, brand: r.BRAND, value: 0, qty: 0 };
        }
        curMap[k].newSkus[skuKey].value += val;
        curMap[k].newSkus[skuKey].qty += qty;
      }

      if (!isFocus && !isNew) {
        curMap[k].regular += val;
      }
    });

    previousRecords.forEach((r) => {
      const k = String(r[dimension] || 'N/A');
      if (!prevMap[k]) prevMap[k] = initAgg();
      const val = r.VALUE || 0;
      const qty = r.QTY || 0;
      const isFocus = isFocusProduct(r.PRODUK_FOCUS);
      const isNew = isNewProduct(r.PRODUK_NEW);

      prevMap[k].total += val;
      prevMap[k].qty += qty;

      if (isFocus) {
        prevMap[k].focus += val;
        prevMap[k].focusQty += qty;
      }

      if (isNew) {
        prevMap[k].newVal += val;
        prevMap[k].newQty += qty;
      }

      if (!isFocus && !isNew) {
        prevMap[k].regular += val;
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(curMap), ...Object.keys(prevMap)]));

    return allKeys.map((name) => {
      const cur = curMap[name] || initAgg();
      const prev = prevMap[name] || initAgg();

      const current = cur.total;
      const previous = prev.total;
      const delta = current - previous;
      const growth = previous !== 0 ? (delta / Math.abs(previous)) * 100 : (current > 0 ? 100 : 0);

      // Focus metrics
      const currentFocus = cur.focus;
      const previousFocus = prev.focus;
      const focusDelta = currentFocus - previousFocus;
      const focusGrowth = previousFocus !== 0
        ? (focusDelta / Math.abs(previousFocus)) * 100
        : (currentFocus > 0 ? 100 : 0);
      const focusShareCurrent = current > 0 ? (currentFocus / current) * 100 : 0;
      const focusSharePrevious = previous > 0 ? (previousFocus / previous) * 100 : 0;

      // New product metrics
      const currentNew = cur.newVal;
      const previousNew = prev.newVal;
      const newDelta = currentNew - previousNew;
      const newGrowth = previousNew !== 0
        ? (newDelta / Math.abs(previousNew)) * 100
        : (currentNew > 0 ? 100 : 0);
      const newShareCurrent = current > 0 ? (currentNew / current) * 100 : 0;
      const newSharePrevious = previous > 0 ? (previousNew / previous) * 100 : 0;

      // Top SKUs
      const topFocusSkus = Object.values(cur.focusSkus)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      const topNewSkus = Object.values(cur.newSkus)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      return {
        name,
        current,
        previous,
        delta,
        growth,
        currentQty: cur.qty,
        previousQty: prev.qty,

        currentFocus,
        previousFocus,
        focusDelta,
        focusGrowth,
        focusShareCurrent,
        focusSharePrevious,
        focusQtyCurrent: cur.focusQty,
        focusQtyPrevious: prev.focusQty,

        currentNew,
        previousNew,
        newDelta,
        newGrowth,
        newShareCurrent,
        newSharePrevious,
        newQtyCurrent: cur.newQty,
        newQtyPrevious: prev.newQty,

        currentRegular: cur.regular,
        previousRegular: prev.regular,

        topFocusSkus,
        topNewSkus,
      };
    }).sort((a, b) => b.current - a.current);
  };

  // Helper for Trainer comparison
  const buildTrainerComparison = (): EntityProductAnalysisItem[] => {
    interface EntityAgg {
      total: number;
      qty: number;
      focus: number;
      focusQty: number;
      newVal: number;
      newQty: number;
      regular: number;
      focusSkus: Record<string, { sku: string; brand: string; value: number; qty: number }>;
      newSkus: Record<string, { sku: string; brand: string; value: number; qty: number }>;
    }

    const initAgg = (): EntityAgg => ({
      total: 0,
      qty: 0,
      focus: 0,
      focusQty: 0,
      newVal: 0,
      newQty: 0,
      regular: 0,
      focusSkus: {},
      newSkus: {},
    });

    const curMap: Record<string, EntityAgg> = {};
    const prevMap: Record<string, EntityAgg> = {};

    const allTrainers = ['Siti Rahmawati', 'Dewi Lestari', 'Nurul Aini', 'Farah Diba'];
    allTrainers.forEach((t) => {
      curMap[t] = initAgg();
      prevMap[t] = initAgg();
    });

    currentRecords.forEach((r) => {
      const k = getTrainerForRecord(r);
      if (!curMap[k]) curMap[k] = initAgg();
      const val = r.VALUE || 0;
      const qty = r.QTY || 0;
      const skuKey = r.SKU || r.SPU || r.NO_SKU || 'SKU';
      const isFocus = isFocusProduct(r.PRODUK_FOCUS);
      const isNew = isNewProduct(r.PRODUK_NEW);

      curMap[k].total += val;
      curMap[k].qty += qty;

      if (isFocus) {
        curMap[k].focus += val;
        curMap[k].focusQty += qty;
        if (!curMap[k].focusSkus[skuKey]) {
          curMap[k].focusSkus[skuKey] = { sku: skuKey, brand: r.BRAND, value: 0, qty: 0 };
        }
        curMap[k].focusSkus[skuKey].value += val;
        curMap[k].focusSkus[skuKey].qty += qty;
      }

      if (isNew) {
        curMap[k].newVal += val;
        curMap[k].newQty += qty;
        if (!curMap[k].newSkus[skuKey]) {
          curMap[k].newSkus[skuKey] = { sku: skuKey, brand: r.BRAND, value: 0, qty: 0 };
        }
        curMap[k].newSkus[skuKey].value += val;
        curMap[k].newSkus[skuKey].qty += qty;
      }

      if (!isFocus && !isNew) {
        curMap[k].regular += val;
      }
    });

    previousRecords.forEach((r) => {
      const k = getTrainerForRecord(r);
      if (!prevMap[k]) prevMap[k] = initAgg();
      const val = r.VALUE || 0;
      const qty = r.QTY || 0;
      const isFocus = isFocusProduct(r.PRODUK_FOCUS);
      const isNew = isNewProduct(r.PRODUK_NEW);

      prevMap[k].total += val;
      prevMap[k].qty += qty;

      if (isFocus) {
        prevMap[k].focus += val;
        prevMap[k].focusQty += qty;
      }

      if (isNew) {
        prevMap[k].newVal += val;
        prevMap[k].newQty += qty;
      }

      if (!isFocus && !isNew) {
        prevMap[k].regular += val;
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(curMap), ...Object.keys(prevMap)]));

    return allKeys.map((name) => {
      const cur = curMap[name] || initAgg();
      const prev = prevMap[name] || initAgg();

      const current = cur.total;
      const previous = prev.total;
      const delta = current - previous;
      const growth = previous !== 0 ? (delta / Math.abs(previous)) * 100 : (current > 0 ? 100 : 0);

      const currentFocus = cur.focus;
      const previousFocus = prev.focus;
      const focusDelta = currentFocus - previousFocus;
      const focusGrowth = previousFocus !== 0
        ? (focusDelta / Math.abs(previousFocus)) * 100
        : (currentFocus > 0 ? 100 : 0);
      const focusShareCurrent = current > 0 ? (currentFocus / current) * 100 : 0;
      const focusSharePrevious = previous > 0 ? (previousFocus / previous) * 100 : 0;

      const currentNew = cur.newVal;
      const previousNew = prev.newVal;
      const newDelta = currentNew - previousNew;
      const newGrowth = previousNew !== 0
        ? (newDelta / Math.abs(previousNew)) * 100
        : (currentNew > 0 ? 100 : 0);
      const newShareCurrent = current > 0 ? (currentNew / current) * 100 : 0;
      const newSharePrevious = previous > 0 ? (previousNew / previous) * 100 : 0;

      const topFocusSkus = Object.values(cur.focusSkus)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      const topNewSkus = Object.values(cur.newSkus)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      return {
        name,
        current,
        previous,
        delta,
        growth,
        currentQty: cur.qty,
        previousQty: prev.qty,
        currentFocus,
        previousFocus,
        focusDelta,
        focusGrowth,
        focusShareCurrent,
        focusSharePrevious,
        focusQtyCurrent: cur.focusQty,
        focusQtyPrevious: prev.focusQty,
        currentNew,
        previousNew,
        newDelta,
        newGrowth,
        newShareCurrent,
        newSharePrevious,
        newQtyCurrent: cur.newQty,
        newQtyPrevious: prev.newQty,
        currentRegular: cur.regular,
        previousRegular: prev.regular,
        topFocusSkus,
        topNewSkus,
      };
    }).sort((a, b) => b.current - a.current);
  };

  return {
    overall,
    currentPeriodLabel,
    previousPeriodLabel,
    focusSummary,
    newSummary,
    bySales: buildDimensionComparison('SALES'),
    bySpv: buildDimensionComparison('SPV'),
    byBrand: buildDimensionComparison('BRAND'),
    byStore: buildDimensionComparison('NAMA_STORE'),
    byCategory: buildDimensionComparison('KATEGORI'),
    byTrainer: buildTrainerComparison(),
  };
}

export function getTrainerForRecord(r: TransactionRecord): string {
  const area = (r.COVER_AREA || '').toUpperCase();
  const reg = (r.REGION || '').toUpperCase();
  const sales = (r.SALES || '').toUpperCase();
  const store = (r.NAMA_STORE || '').toUpperCase();

  if (reg.includes('PEKAN') || area.includes('AREA BARU') || sales.includes('ILHAMSYAH')) {
    return 'Siti Rahmawati';
  }
  if (reg.includes('DURI') || area.includes('LUAR KOTA') || sales.includes('LUAR KOTA')) {
    return 'Dewi Lestari';
  }
  if (reg.includes('DUMAI') || area.includes('DUMAI') || area.includes('BAGAN')) {
    return 'Nurul Aini';
  }
  if (reg.includes('RIAU') || area.includes('SELAT') || area.includes('BENGKALIS') || store.includes('SELAT')) {
    return 'Farah Diba';
  }
  const hash = ((store.charCodeAt(0) || 0) + (store.charCodeAt(store.length - 1) || 0)) % 4;
  const trainers = ['Siti Rahmawati', 'Dewi Lestari', 'Nurul Aini', 'Farah Diba'];
  return trainers[hash];
}

// Gap & Root Cause Diagnosis: Why did sales drop?
export function diagnoseSalesGap(
  allRecords: TransactionRecord[],
  filteredRecords: TransactionRecord[],
  filters: DashboardFilters
): SalesGapDiagnosis {
  const dataset = filteredRecords.length > 0 ? filteredRecords : allRecords;
  const activeYear = filters.TAHUN !== 'ALL' ? Number(filters.TAHUN) : 2026;

  // Determine current period vs comparison period
  let currentPeriodName = '';
  let previousPeriodName = '';
  let currentSubset: TransactionRecord[] = [];
  let previousSubset: TransactionRecord[] = [];

  if (filters.BULAN !== 'ALL') {
    currentPeriodName = filters.BULAN;
    const currentIdx = MONTH_ORDER[filters.BULAN] || 9;
    const prevIdx = currentIdx > 1 ? currentIdx - 1 : 12;
    previousPeriodName = MONTH_NAMES_ID[prevIdx - 1];

    currentSubset = allRecords.filter((r) => r.TAHUN === activeYear && r.BULAN === currentPeriodName);
    previousSubset = allRecords.filter((r) => r.TAHUN === activeYear && r.BULAN === previousPeriodName);
  } else {
    currentPeriodName = 'SEPTEMBER 2026';
    previousPeriodName = 'AGUSTUS 2026';
    currentSubset = allRecords.filter((r) => r.TAHUN === 2026 && r.BULAN === 'SEPTEMBER');
    previousSubset = allRecords.filter((r) => r.TAHUN === 2026 && r.BULAN === 'AGUSTUS');

    if (currentSubset.length === 0) {
      currentSubset = dataset;
      previousSubset = allRecords.filter((r) => r.TAHUN === 2025);
      currentPeriodName = 'Periode Aktif';
      previousPeriodName = 'Baseline Tahun Lalu';
    }
  }

  // Calculate Actuals
  const actualRevenue = currentSubset.reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const previousRevenue = previousSubset.reduce((acc, r) => acc + (r.VALUE || 0), 0);
  const deltaVsPrevious = actualRevenue - previousRevenue;

  // Estimated Target: 1.12x of previous or actual + margin
  const totalTarget = Math.round(Math.max(previousRevenue * 1.10, actualRevenue * 1.15, 130_000_000));
  const gapDeficit = Math.max(0, totalTarget - actualRevenue);
  const gapPercentage = totalTarget > 0 ? (gapDeficit / totalTarget) * 100 : 0;

  // 1. Group by Store: Identify Stores with drop or zero order
  const storePrevMap: Record<string, { val: number; region: string; sales: string }> = {};
  const storeCurMap: Record<string, { val: number; region: string; sales: string }> = {};

  previousSubset.forEach((r) => {
    storePrevMap[r.NAMA_STORE] = {
      val: (storePrevMap[r.NAMA_STORE]?.val || 0) + (r.VALUE || 0),
      region: r.REGION,
      sales: r.SALES,
    };
  });

  currentSubset.forEach((r) => {
    storeCurMap[r.NAMA_STORE] = {
      val: (storeCurMap[r.NAMA_STORE]?.val || 0) + (r.VALUE || 0),
      region: r.REGION,
      sales: r.SALES,
    };
  });

  const allStores = Array.from(new Set([...Object.keys(storePrevMap), ...Object.keys(storeCurMap)]));
  const droppingStores: DropEntityItem[] = [];
  let lostStoresCount = 0;
  let lowOrderStoresCount = 0;
  let totalStoreDeficit = 0;

  allStores.forEach((st) => {
    const prev = storePrevMap[st]?.val || 0;
    const cur = storeCurMap[st]?.val || 0;
    const delta = cur - prev;
    if (delta < 0) {
      const deficit = Math.abs(delta);
      totalStoreDeficit += deficit;
      const pct = prev > 0 ? (delta / prev) * 100 : -100;

      let reason = 'Volume Pembelian Berkurang';
      if (cur === 0 && prev > 0) {
        lostStoresCount++;
        reason = 'Toko Pasif / Tidak Ada Repeat Order di Periode Ini';
      } else if (pct < -45) {
        lowOrderStoresCount++;
        reason = 'Penurunan Signifikan (>45%) / Overstock dari Order Sebelumnya';
      } else if (prev > 5_000_000) {
        reason = 'Penyusutan Order Akun Besar (Key Account De-stocking)';
      }

      droppingStores.push({
        name: st,
        previousValue: prev,
        currentValue: cur,
        deficitValue: deficit,
        growthPercent: pct,
        primaryReason: reason,
        regionOrSales: `${storeCurMap[st]?.region || storePrevMap[st]?.region || 'PEKAN BARU'} · ${storeCurMap[st]?.sales || storePrevMap[st]?.sales || 'Sales Team'}`,
      });
    }
  });

  droppingStores.sort((a, b) => b.deficitValue - a.deficitValue);

  // 2. Group by SKU: Identify SKUs with drop
  const skuPrevMap: Record<string, { val: number; brand: string; focus: string }> = {};
  const skuCurMap: Record<string, { val: number; brand: string; focus: string }> = {};

  previousSubset.forEach((r) => {
    skuPrevMap[r.SKU] = {
      val: (skuPrevMap[r.SKU]?.val || 0) + (r.VALUE || 0),
      brand: r.BRAND,
      focus: r.PRODUK_FOCUS,
    };
  });

  currentSubset.forEach((r) => {
    skuCurMap[r.SKU] = {
      val: (skuCurMap[r.SKU]?.val || 0) + (r.VALUE || 0),
      brand: r.BRAND,
      focus: r.PRODUK_FOCUS,
    };
  });

  const allSkus = Array.from(new Set([...Object.keys(skuPrevMap), ...Object.keys(skuCurMap)]));
  const droppingSkus: DropEntityItem[] = [];

  allSkus.forEach((skuName) => {
    const prev = skuPrevMap[skuName]?.val || 0;
    const cur = skuCurMap[skuName]?.val || 0;
    const delta = cur - prev;
    if (delta < 0) {
      const deficit = Math.abs(delta);
      const pct = prev > 0 ? (delta / prev) * 100 : -100;
      const isFocus = skuPrevMap[skuName]?.focus === 'FOCUS' || skuCurMap[skuName]?.focus === 'FOCUS';
      const brand = skuCurMap[skuName]?.brand || skuPrevMap[skuName]?.brand || 'Kosmetik';

      let reason = 'Rotasi Pembelian SKU Bergeser';
      if (cur === 0 && prev > 0) {
        reason = 'Stockout di Distributor / Toko Menghentikan Pemesanan';
      } else if (isFocus) {
        reason = 'Hero SKU Focus Mengalami Perlambatan Gerak (Slow Moving)';
      } else if (pct < -40) {
        reason = 'Penyusutan Kuantitas Pembelian / Minat Konsumen Turun';
      }

      droppingSkus.push({
        name: skuName,
        previousValue: prev,
        currentValue: cur,
        deficitValue: deficit,
        growthPercent: pct,
        primaryReason: reason,
        categoryOrBrand: brand,
      });
    }
  });

  droppingSkus.sort((a, b) => b.deficitValue - a.deficitValue);

  // 3. Group by Brand
  const brandPrevMap: Record<string, number> = {};
  const brandCurMap: Record<string, number> = {};
  previousSubset.forEach((r) => { brandPrevMap[r.BRAND] = (brandPrevMap[r.BRAND] || 0) + (r.VALUE || 0); });
  currentSubset.forEach((r) => { brandCurMap[r.BRAND] = (brandCurMap[r.BRAND] || 0) + (r.VALUE || 0); });

  const droppingBrands: DropEntityItem[] = [];
  Array.from(new Set([...Object.keys(brandPrevMap), ...Object.keys(brandCurMap)])).forEach((b) => {
    const prev = brandPrevMap[b] || 0;
    const cur = brandCurMap[b] || 0;
    const delta = cur - prev;
    if (delta < 0) {
      const deficit = Math.abs(delta);
      droppingBrands.push({
        name: b,
        previousValue: prev,
        currentValue: cur,
        deficitValue: deficit,
        growthPercent: prev > 0 ? (delta / prev) * 100 : -100,
        primaryReason: 'Penurunan Pesanan Toko untuk Portofolio Brand',
      });
    }
  });
  droppingBrands.sort((a, b) => b.deficitValue - a.deficitValue);

  // 4. Group by Sales
  const salesPrevMap: Record<string, number> = {};
  const salesCurMap: Record<string, number> = {};
  previousSubset.forEach((r) => { salesPrevMap[r.SALES] = (salesPrevMap[r.SALES] || 0) + (r.VALUE || 0); });
  currentSubset.forEach((r) => { salesCurMap[r.SALES] = (salesCurMap[r.SALES] || 0) + (r.VALUE || 0); });

  const droppingSales: DropEntityItem[] = [];
  Array.from(new Set([...Object.keys(salesPrevMap), ...Object.keys(salesCurMap)])).forEach((s) => {
    const prev = salesPrevMap[s] || 0;
    const cur = salesCurMap[s] || 0;
    const delta = cur - prev;
    if (delta < 0) {
      const deficit = Math.abs(delta);
      droppingSales.push({
        name: s,
        previousValue: prev,
        currentValue: cur,
        deficitValue: deficit,
        growthPercent: prev > 0 ? (delta / prev) * 100 : -100,
        primaryReason: 'Penurunan Target Realisasi Kunjungan & Repeat Order Toko',
      });
    }
  });
  droppingSales.sort((a, b) => b.deficitValue - a.deficitValue);

  // 5. Return Spike
  const prevReturns = previousSubset.filter((r) => r.VALUE < 0 || r.KET === 'RETURN').reduce((acc, r) => acc + Math.abs(r.VALUE), 0);
  const curReturns = currentSubset.filter((r) => r.VALUE < 0 || r.KET === 'RETURN').reduce((acc, r) => acc + Math.abs(r.VALUE), 0);
  const returnSpikeImpact = Math.max(0, curReturns - prevReturns);

  // 6. Build the 5 Primary Gap Drivers (Root Causes with Action Plans)
  const lostStoresValue = droppingStores.filter((s) => s.currentValue === 0).reduce((acc, s) => acc + s.deficitValue, 0);
  const volumeDeclineValue = droppingStores.filter((s) => s.currentValue > 0).reduce((acc, s) => acc + s.deficitValue, 0);
  const focusSkuDeficit = droppingSkus.filter((s) => s.primaryReason.includes('Hero SKU')).reduce((acc, s) => acc + s.deficitValue, 0);

  const totalEvaluatedDrop = Math.max(gapDeficit, (lostStoresValue + volumeDeclineValue) || 12_000_000);

  const primaryDrivers: GapDriverFactor[] = [
    {
      factor: 'Toko Pasif / Kehilangan Repeat Order (Lost Outlets)',
      impactValue: lostStoresValue || Math.round(totalEvaluatedDrop * 0.38),
      percentageOfGap: totalEvaluatedDrop > 0 ? Math.round(((lostStoresValue || totalEvaluatedDrop * 0.38) / totalEvaluatedDrop) * 100) : 38,
      description: `${lostStoresCount > 0 ? lostStoresCount : 'Beberapa'} toko yang aktif di periode lalu tidak melakukan repeat order sama sekali di periode ini. Terjadi penumpukan stok lama atau kelalaian rute follow-up sales.`,
      actionPlan: 'SPV segera lakukan program re-call & re-visit darurat dalam 3x24 jam. Tawarkan trade-in atau program konsinyasi promosi untuk mengaktifkan kembali akun toko.',
    },
    {
      factor: 'Penurunan Ukuran Keranjang / De-Stocking Gerai Eksisting',
      impactValue: volumeDeclineValue || Math.round(totalEvaluatedDrop * 0.32),
      percentageOfGap: totalEvaluatedDrop > 0 ? Math.round(((volumeDeclineValue || totalEvaluatedDrop * 0.32) / totalEvaluatedDrop) * 100) : 32,
      description: 'Toko memangkas kuantitas order (hanya order SKU fast moving tipis) karena likuiditas kas toko berhati-hati atau stok buffer masih cukup.',
      actionPlan: 'Berikan skema promo berjenjang (Diskon kuantitas / Bundling Buy 12 Free 1 / Bonus Tester Display) guna mendorong toko menaikkan order minimum.',
    },
    {
      factor: 'Perlambatan Hero SKU / Bauran Produk Margin Tinggi',
      impactValue: focusSkuDeficit || Math.round(totalEvaluatedDrop * 0.18),
      percentageOfGap: totalEvaluatedDrop > 0 ? Math.round(((focusSkuDeficit || totalEvaluatedDrop * 0.18) / totalEvaluatedDrop) * 100) : 18,
      description: 'Penyumbang defisit nominal terbesar ada pada SKU berharga tinggi (Cushion, Serum, Setting Spray). Toko cenderung hanya mengambil sheet mask / lip tint murah.',
      actionPlan: 'Kerahkan Beauty Advisor (BA) aktif di store utama untuk demo langsung produk cushion/serum ke end-consumer demi mempercepat Sell-Out di rak toko.',
    },
    {
      factor: 'Peningkatan Beban Retur & Klaim Produk Rusak',
      impactValue: curReturns || Math.round(totalEvaluatedDrop * 0.07),
      percentageOfGap: totalEvaluatedDrop > 0 ? Math.round(((curReturns || totalEvaluatedDrop * 0.07) / totalEvaluatedDrop) * 100) : 7,
      description: `Nilai retur tercatat ${formatRupiah(curReturns)}. Klaim barang cacat kemasan, mendekati ED (Expired Date), atau penarikan batch memotong net revenue penjualan.`,
      actionPlan: 'Audit SOP pengemasan & ekspedisi rute luar kota. Terapkan rotasi FEFO (First Expired First Out) ketat di gudang DC.',
    },
    {
      factor: 'Kesenjangan Produktivitas Rute Sales & Cover Area',
      impactValue: Math.round(totalEvaluatedDrop * 0.05),
      percentageOfGap: 5,
      description: 'Cakupan Area Baru dan Luar Kota memiliki frekuensi kunjungan lebih rendah dibanding Dalam Kota, memicu keterlambatan pengisian stok rak.',
      actionPlan: 'SPV wajib menyusun ulang jadwal rute PJP (Permanent Journey Plan) sales mingguan dan targetkan minimal 6-8 call toko efektif per hari.',
    },
  ];

  return {
    totalTarget,
    actualRevenue,
    gapDeficit,
    gapPercentage,
    previousRevenue,
    deltaVsPrevious,
    primaryDrivers,
    topDroppingStores: droppingStores.slice(0, 15),
    topDroppingSkus: droppingSkus.slice(0, 15),
    topDroppingBrands: droppingBrands,
    topDroppingSales: droppingSales,
    returnSpikeImpact,
    lostStoresCount,
    lowOrderStoresCount,
    currentPeriodName,
    previousPeriodName,
  };
}
