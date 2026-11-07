import {
  StoreInvoiceBillItem,
  StoreViolationSummary,
  SalesSpvDendaSummary,
  KpiSalesScorecardItem,
  BaPunishmentSummaryItem,
  BaNihilIncidentRecord,
  AgingCategory,
  TransactionRecord,
} from '../types/dashboard';

// Storage keys
const STORE_INVOICES_KEY = 'salespro_store_invoices_v2';
const KPI_SALES_OVERRIDES_KEY = 'salespro_kpi_sales_overrides_v7';
const BA_PUNISHMENT_KEY = 'salespro_ba_punishment_v2';

// -------------------------------------------------------------
// 1. DATA SEED & LOGIC: DAFTAR TAGIHAN TOKO & AGING PIUTANG
// -------------------------------------------------------------

export function determineAgingCategoryAndAction(agingDays: number): {
  category: AgingCategory;
  actionRequired: string;
} {
  if (agingDays <= 30) {
    return {
      category: 'current',
      actionRequired: 'Tagihan Berjalan (Belum Jatuh Tempo)',
    };
  }
  if (agingDays <= 35) {
    return {
      category: 'up_30',
      actionRequired: '30 Hari: Sudah Jatuh Tempo Harus di Follow-Up Sales',
    };
  }
  if (agingDays <= 45) {
    return {
      category: 'up_35',
      actionRequired: '35 Hari: Tidak Bisa Melakukan Pengorderan (Order Baru Diblokir)',
    };
  }
  if (agingDays <= 51) {
    return {
      category: 'up_45',
      actionRequired: '45 Hari: Harus SPV Kejar ke Toko (Eskalasi Supervisor)',
    };
  }
  if (agingDays <= 60) {
    return {
      category: 'up_52',
      actionRequired: '52 Hari: Sales/SPV Wajib Melakukan Penarikan Barang (Tarik Stok)',
    };
  }
  return {
    category: 'up_60',
    actionRequired: 'Status Waspada: Jadi Customer Cash (Wajib Tunai/COD)',
  };
}

// Format reference date
const getRelativeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

export const INITIAL_INVOICES: StoreInvoiceBillItem[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV/2026/08/0112',
    storeName: 'TOKO CANTIK RIAU',
    coverArea: 'AREA BARU',
    region: 'PEKAN BARU',
    salesName: 'ILHAMSYAH',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(68),
    dueDate: getRelativeDate(38),
    isPaid: false,
    amount: 14500000,
    brandCategory: 'Y.O.U Skincare',
    agingDays: 68,
    agingCategory: 'up_60',
    actionRequired: 'Status Waspada: Jadi Customer Cash (Wajib Tunai/COD)',
    notes: 'Toko telah melewati 60 hari. Order baru diblokir total & dialihkan ke COD.',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV/2026/08/0245',
    storeName: 'Alfamart_DC PEKANBARU',
    coverArea: 'AREA BARU',
    region: 'PEKAN BARU',
    salesName: 'ILHAMSYAH',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(55),
    dueDate: getRelativeDate(25),
    isPaid: false,
    amount: 22800000,
    brandCategory: 'lavojoy Body Care',
    agingDays: 55,
    agingCategory: 'up_52',
    actionRequired: '52 Hari: Sales/SPV Wajib Melakukan Penarikan Barang (Tarik Stok)',
    notes: 'Sales & SPV dalam proses negosiasi jadwal retur fisik barang.',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV/2026/08/0411',
    storeName: 'I.C.A COSMETIK',
    coverArea: 'AREA BARU',
    region: 'PEKAN BARU',
    salesName: 'BUDI SANTOSO',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(48),
    dueDate: getRelativeDate(18),
    isPaid: false,
    amount: 8750000,
    brandCategory: 'barenbliss Makeup',
    agingDays: 48,
    agingCategory: 'up_45',
    actionRequired: '45 Hari: Harus SPV Kejar ke Toko (Eskalasi Supervisor)',
    notes: 'SPV Widodo menjadwalkan kunjungan eskalasi langsung ke pemilik toko.',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV/2026/09/0089',
    storeName: 'SYMPHONY KOSMETIK',
    coverArea: 'LUAR KOTA',
    region: 'PEKAN BARU',
    salesName: 'LUAR KOTA',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(39),
    dueDate: getRelativeDate(9),
    isPaid: false,
    amount: 11200000,
    brandCategory: 'DAZZLE ME Lip',
    agingDays: 39,
    agingCategory: 'up_35',
    actionRequired: '35 Hari: Tidak Bisa Melakukan Pengorderan (Order Baru Diblokir)',
    notes: 'Sistem menolak PO baru sampai ada transfer pembayaran minimum 50%.',
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV/2026/09/0142',
    storeName: 'TOKO ALANA BEAUTY',
    coverArea: 'AREA BARU',
    region: 'PEKAN BARU',
    salesName: 'ILHAMSYAH',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(33),
    dueDate: getRelativeDate(3),
    isPaid: false,
    amount: 18450000,
    brandCategory: 'Y.O.U & lavojoy',
    agingDays: 33,
    agingCategory: 'up_30',
    actionRequired: '30 Hari: Sudah Jatuh Tempo Harus di Follow-Up Sales',
    notes: 'Sudah di-chat WA oleh Ilhamsyah, janji bayar hari Jumat.',
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV/2026/09/0320',
    storeName: 'TOKO SURYA DUMAI',
    coverArea: 'AREA BARU',
    region: 'DUMAI',
    salesName: 'MAYA SARI',
    spvName: 'HENDRA GUNAWAN',
    sellInDate: getRelativeDate(64),
    dueDate: getRelativeDate(34),
    isPaid: false,
    amount: 16900000,
    brandCategory: 'barenbliss & GLAMFIX',
    agingDays: 64,
    agingCategory: 'up_60',
    actionRequired: 'Status Waspada: Jadi Customer Cash (Wajib Tunai/COD)',
    notes: 'Menunggak lebih dari 60 hari. Dialihkan mutlak ke sistem tunai/COD.',
  },
  {
    id: 'inv-007',
    invoiceNumber: 'INV/2026/09/0410',
    storeName: 'MAJU JAYA KOSMETIK',
    coverArea: 'LUAR KOTA',
    region: 'DUMAI',
    salesName: 'EKO PRASETYO',
    spvName: 'HENDRA GUNAWAN',
    sellInDate: getRelativeDate(49),
    dueDate: getRelativeDate(19),
    isPaid: false,
    amount: 13200000,
    brandCategory: 'Y.O.U Sunscreen',
    agingDays: 49,
    agingCategory: 'up_45',
    actionRequired: '45 Hari: Harus SPV Kejar ke Toko (Eskalasi Supervisor)',
    notes: 'SPV Hendra Gunawan konfirmasi follow-up langsung.',
  },
  {
    id: 'inv-008',
    invoiceNumber: 'INV/2026/09/0512',
    storeName: 'NAGOYA BEAUTY CENTRE',
    coverArea: 'AREA BARU',
    region: 'BATAM',
    salesName: 'RINA WATI',
    spvName: 'SISKA MELINDA',
    sellInDate: getRelativeDate(28),
    dueDate: getRelativeDate(-2),
    isPaid: true,
    paymentDate: getRelativeDate(2),
    amount: 25400000,
    brandCategory: 'lavojoy Hair & Body',
    agingDays: 26,
    agingCategory: 'current',
    actionRequired: 'LUNAS TEPAT WAKTU',
    notes: 'Pelunasan giro via BCA lunas tanpa hambatan.',
  },
  {
    id: 'inv-009',
    invoiceNumber: 'INV/2026/10/0014',
    storeName: 'BATAM CENTRAL PLAZA COSMETICS',
    coverArea: 'LUAR KOTA',
    region: 'BATAM',
    salesName: 'ANDI WIJAYA',
    spvName: 'SISKA MELINDA',
    sellInDate: getRelativeDate(18),
    dueDate: getRelativeDate(-12),
    isPaid: false,
    amount: 9800000,
    brandCategory: 'DAZZLE ME & barenbliss',
    agingDays: 18,
    agingCategory: 'current',
    actionRequired: 'Tagihan Berjalan (Belum Jatuh Tempo)',
    notes: 'Faktur baru, jatuh tempo masih 12 hari lagi.',
  },
  {
    id: 'inv-010',
    invoiceNumber: 'INV/2026/08/0991',
    storeName: 'TOKO CANTIK RIAU',
    coverArea: 'AREA BARU',
    region: 'PEKAN BARU',
    salesName: 'ILHAMSYAH',
    spvName: 'WIDODO',
    sellInDate: getRelativeDate(75),
    dueDate: getRelativeDate(45),
    isPaid: true,
    paymentDate: getRelativeDate(15),
    amount: 11000000,
    brandCategory: 'GLAMFIX Tools',
    agingDays: 60,
    agingCategory: 'up_60',
    actionRequired: 'Lunas Setelah Terlambat (Customer Cash)',
    notes: 'Pelunasan terlambat 30 hari dari jatuh tempo.',
  },
];

export function extractInvoicesFromRecords(records: TransactionRecord[]): StoreInvoiceBillItem[] {
  if (!records || records.length === 0) return [];

  // Filter sell in records (Distributor taking orders / sell in)
  const sellInRecords = records.filter((r) => {
    const ket = (r.KET || '').trim().toUpperCase();
    return (
      ket.includes('SELL IN') ||
      ket.includes('SELL-IN') ||
      ket.includes('TAKING ORDER') ||
      ket.includes('ORDER') ||
      ket.includes('DISTRIBUTOR') ||
      ket === 'IN'
    );
  });

  if (sellInRecords.length === 0) return [];

  // Retrieve stored override statuses (isPaid, paymentDate, dispensation, notes)
  const storedOverridesMap = new Map<string, Partial<StoreInvoiceBillItem>>();
  try {
    const raw = localStorage.getItem(STORE_INVOICES_KEY);
    if (raw) {
      const parsed: StoreInvoiceBillItem[] = JSON.parse(raw);
      parsed.forEach((item) => {
        if (item.invoiceNumber) storedOverridesMap.set(item.invoiceNumber, item);
        if (item.id) storedOverridesMap.set(item.id, item);
        const compositeKey = `${item.storeName}_${item.sellInDate}_${item.salesName}`;
        storedOverridesMap.set(compositeKey, item);
      });
    }
  } catch (e) {
    // ignore
  }

  // Group by (storeName + '|' + normalizedDate + '|' + salesName)
  // so each store order on that date forms a single invoice with the exact total Sell In amount
  const invoiceGroups = new Map<
    string,
    {
      storeName: string;
      coverArea: string;
      region: string;
      salesName: string;
      spvName: string;
      sellInDate: string;
      dueDate: string;
      amount: number;
      brandCategories: Set<string>;
      rawIds: string[];
    }
  >();

  sellInRecords.forEach((r, idx) => {
    const store = (r.NAMA_STORE || 'STORE UNKNOWN').trim();
    const sales = (r.SALES || 'SALES REGULER').trim();
    const spv = (r.SPV || 'WIDODO').trim();
    const area = (r.COVER_AREA || 'AREA BARU').trim();
    const region = (r.REGION || 'PEKAN BARU').trim();
    const rawDate = (r.TANGGAL || '').trim();

    // Normalize date to YYYY-MM-DD
    let normalizedDate = '';
    if (rawDate) {
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          const year = p2 < 100 ? 2000 + p2 : p2;
          const month = String(p0).padStart(2, '0');
          const day = String(p1).padStart(2, '0');
          normalizedDate = `${year}-${month}-${day}`;
        }
      } else if (rawDate.includes('-')) {
        normalizedDate = rawDate.slice(0, 10);
      }
    }

    if (!normalizedDate) {
      const monthNames = [
        'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
      ];
      const mIdx = monthNames.indexOf((r.BULAN || '').toUpperCase());
      const month = String(mIdx >= 0 ? mIdx + 1 : 10).padStart(2, '0');
      const year = r.TAHUN || 2026;
      normalizedDate = `${year}-${month}-15`;
    }

    const groupKey = `${store}|${normalizedDate}|${sales}`;

    if (!invoiceGroups.has(groupKey)) {
      const d = new Date(normalizedDate);
      const dueTime = isNaN(d.getTime()) ? new Date().getTime() : d.getTime() + 30 * 24 * 60 * 60 * 1000;
      const dueDate = new Date(dueTime).toISOString().slice(0, 10);

      invoiceGroups.set(groupKey, {
        storeName: store,
        coverArea: area,
        region,
        salesName: sales,
        spvName: spv,
        sellInDate: normalizedDate,
        dueDate,
        amount: 0,
        brandCategories: new Set(),
        rawIds: [],
      });
    }

    const grp = invoiceGroups.get(groupKey)!;
    grp.amount += Math.max(0, r.VALUE || 0);
    if (r.BRAND) grp.brandCategories.add(r.BRAND);
    grp.rawIds.push(r.id || `row-${idx}`);
  });

  // Convert groups to StoreInvoiceBillItem[]
  let invoiceSeq = 1;
  const result: StoreInvoiceBillItem[] = [];

  invoiceGroups.forEach((grp) => {
    const dateParts = grp.sellInDate.split('-');
    const yearStr = dateParts[0] || '2026';
    const monthStr = dateParts[1] || '10';
    const invNumber = `INV/${yearStr}/${monthStr}/${String(invoiceSeq).padStart(4, '0')}`;
    const invoiceId = `sheet-inv-${yearStr}-${monthStr}-${invoiceSeq}`;
    invoiceSeq++;

    const compositeKey = `${grp.storeName}_${grp.sellInDate}_${grp.salesName}`;
    const existing =
      storedOverridesMap.get(compositeKey) ||
      storedOverridesMap.get(invNumber) ||
      storedOverridesMap.get(invoiceId);

    const isPaid = existing?.isPaid ?? false;
    const paymentDate = existing?.paymentDate;
    const invoiceTime = new Date(grp.sellInDate).getTime();
    const refTime = isPaid && paymentDate ? new Date(paymentDate).getTime() : new Date().getTime();
    const agingDays = isNaN(invoiceTime) ? 15 : Math.max(0, Math.floor((refTime - invoiceTime) / (1000 * 60 * 60 * 24)));
    const { category, actionRequired } = determineAgingCategoryAndAction(agingDays);

    const brandsStr = Array.from(grp.brandCategories).join(', ') || 'Multi-Brand';

    result.push({
      id: invoiceId,
      invoiceNumber: existing?.invoiceNumber || invNumber,
      storeName: grp.storeName,
      coverArea: grp.coverArea,
      region: grp.region,
      salesName: grp.salesName,
      spvName: grp.spvName || 'WIDODO',
      sellInDate: grp.sellInDate,
      dueDate: grp.dueDate,
      paymentDate: existing?.paymentDate,
      isPaid,
      amount: grp.amount,
      brandCategory: brandsStr,
      agingDays,
      agingCategory: category,
      actionRequired: isPaid ? 'LUNAS' : actionRequired,
      notes: existing?.notes || `Faktur Sell In otomatis dari Google Sheet (${grp.rawIds.length} item transaksi)`,
      dispensationGranted: existing?.dispensationGranted,
      dispensationReason: existing?.dispensationReason,
    });
  });

  return result.sort((a, b) => {
    if (!a.isPaid && b.isPaid) return -1;
    if (a.isPaid && !b.isPaid) return 1;
    return b.agingDays - a.agingDays;
  });
}

export function loadStoreBillsWithRecords(records?: TransactionRecord[]): StoreInvoiceBillItem[] {
  if (records && records.length > 0) {
    const sheetInvoices = extractInvoicesFromRecords(records);
    if (sheetInvoices.length > 0) {
      try {
        const raw = localStorage.getItem(STORE_INVOICES_KEY);
        if (raw) {
          const parsed: StoreInvoiceBillItem[] = JSON.parse(raw);
          const manualOnly = parsed.filter((p) => p.id && p.id.startsWith('manual-inv-'));
          return [...manualOnly, ...sheetInvoices];
        }
      } catch (e) {
        // ignore
      }
      return sheetInvoices;
    }
  }
  return loadStoreBills();
}

export function loadStoreBills(): StoreInvoiceBillItem[] {
  try {
    const raw = localStorage.getItem(STORE_INVOICES_KEY);
    if (raw) {
      const parsed: StoreInvoiceBillItem[] = JSON.parse(raw);
      // Re-calculate aging days dynamically based on today
      return parsed.map((item) => {
        const invoiceTime = new Date(item.sellInDate).getTime();
        const refTime = item.isPaid && item.paymentDate ? new Date(item.paymentDate).getTime() : new Date().getTime();
        const days = Math.max(0, Math.floor((refTime - invoiceTime) / (1000 * 60 * 60 * 24)));
        const { category, actionRequired } = determineAgingCategoryAndAction(days);
        return {
          ...item,
          agingDays: days,
          agingCategory: category,
          actionRequired: item.isPaid ? 'LUNAS' : actionRequired,
        };
      });
    }
  } catch (e) {
    console.warn('Failed to load store bills from localStorage', e);
  }
  return INITIAL_INVOICES;
}

export function saveStoreBills(bills: StoreInvoiceBillItem[]): void {
  try {
    localStorage.setItem(STORE_INVOICES_KEY, JSON.stringify(bills));
  } catch (e) {
    console.warn('Failed to save store bills to localStorage', e);
  }
}

// Calculate store violation summary
export function calculateStoreViolations(bills: StoreInvoiceBillItem[]): StoreViolationSummary[] {
  const storeMap: Record<string, StoreViolationSummary> = {};

  bills.forEach((bill) => {
    if (!storeMap[bill.storeName]) {
      storeMap[bill.storeName] = {
        storeName: bill.storeName,
        coverArea: bill.coverArea,
        region: bill.region,
        salesName: bill.salesName,
        spvName: bill.spvName,
        up30Count: 0,
        up35Count: 0,
        up45Count: 0,
        up60Count: 0,
        totalUnpaidAmount: 0,
        oldestAgingDays: 0,
        statusBadge: 'aman',
      };
    }

    const st = storeMap[bill.storeName];

    if (!bill.isPaid) {
      st.totalUnpaidAmount += bill.amount;
      if (bill.agingDays > st.oldestAgingDays) {
        st.oldestAgingDays = bill.agingDays;
      }
    }

    // Hitung riwayat keterlambatan (baik sudah lunas maupun belum)
    if (bill.agingDays > 60) st.up60Count++;
    else if (bill.agingDays >= 46) st.up45Count++;
    else if (bill.agingDays >= 36) st.up35Count++;
    else if (bill.agingDays >= 31) st.up30Count++;
  });

  return Object.values(storeMap).map((st) => {
    let badge: 'aman' | 'perhatian' | 'peringatan_spv' | 'customer_cash' = 'aman';
    if (st.up60Count > 0 || st.oldestAgingDays > 60) {
      badge = 'customer_cash';
    } else if (st.up45Count > 0 || st.oldestAgingDays >= 46) {
      badge = 'peringatan_spv';
    } else if (st.up35Count > 0 || st.up30Count > 0 || st.oldestAgingDays > 30) {
      badge = 'perhatian';
    }
    return {
      ...st,
      statusBadge: badge,
    };
  }).sort((a, b) => b.totalUnpaidAmount - a.totalUnpaidAmount);
}

// Calculate Denda Tagihan Sales & SPV
export function calculateSalesSpvDenda(bills: StoreInvoiceBillItem[], monthFilter: string = 'ALL'): {
  salesDendaList: SalesSpvDendaSummary[];
  spvDendaList: SalesSpvDendaSummary[];
  totalDendaSalesArea: number;
  totalDendaSpvArea: number;
} {
  const unpaidBills = bills.filter((b) => !b.isPaid && !b.dispensationGranted);

  const salesMap: Record<string, {
    name: string;
    month: string;
    storesOver60: Set<string>;
    invoices45to59: StoreInvoiceBillItem[];
  }> = {};

  const spvMap: Record<string, {
    name: string;
    month: string;
    storesOver60: Set<string>;
  }> = {};

  unpaidBills.forEach((b) => {
    const billMonth = new Date(b.sellInDate).toLocaleString('id-ID', { month: 'long' }).toUpperCase();
    if (monthFilter !== 'ALL' && billMonth !== monthFilter) return;

    // Sales map
    if (!salesMap[b.salesName]) {
      salesMap[b.salesName] = {
        name: b.salesName,
        month: billMonth,
        storesOver60: new Set<string>(),
        invoices45to59: [],
      };
    }
    if (b.agingDays > 60) {
      salesMap[b.salesName].storesOver60.add(b.storeName);
    } else if (b.agingDays >= 45 && b.agingDays <= 59) {
      salesMap[b.salesName].invoices45to59.push(b);
    }

    // SPV map
    if (!spvMap[b.spvName]) {
      spvMap[b.spvName] = {
        name: b.spvName,
        month: billMonth,
        storesOver60: new Set<string>(),
      };
    }
    if (b.agingDays > 60) {
      spvMap[b.spvName].storesOver60.add(b.storeName);
    }
  });

  const salesDendaList: SalesSpvDendaSummary[] = Object.values(salesMap).map((s) => {
    const storesUp60Count = s.storesOver60.size;
    const dendaToko60Nominal = storesUp60Count * 200000; // Rp 200.000 / toko >60H
    const invoices45to59Count = s.invoices45to59.length;
    const totalNominalSellIn45to59 = s.invoices45to59.reduce((acc, curr) => acc + curr.amount, 0);
    const dendaPercent45to59Nominal = Math.round(totalNominalSellIn45to59 * 0.002); // 0.2% faktur 45-59H
    const totalFrequencyDenda = storesUp60Count + invoices45to59Count;
    const totalDendaNominal = dendaToko60Nominal + dendaPercent45to59Nominal;

    return {
      personName: s.name,
      role: 'sales',
      monthPeriod: s.month || 'OKTOBER',
      storesUp60Count,
      dendaToko60Nominal,
      invoices45to59Count,
      totalNominalSellIn45to59,
      dendaPercent45to59Nominal,
      totalFrequencyDenda,
      totalDendaNominal,
    };
  });

  const spvDendaList: SalesSpvDendaSummary[] = Object.values(spvMap).map((spv) => {
    const storesUp60Count = spv.storesOver60.size;
    const dendaToko60Nominal = storesUp60Count * 300000; // Rp 300.000 / toko >60H untuk SPV
    return {
      personName: spv.name,
      role: 'spv',
      monthPeriod: spv.month || 'OKTOBER',
      storesUp60Count,
      dendaToko60Nominal,
      invoices45to59Count: 0,
      totalNominalSellIn45to59: 0,
      dendaPercent45to59Nominal: 0,
      totalFrequencyDenda: storesUp60Count,
      totalDendaNominal: dendaToko60Nominal,
    };
  });

  const totalDendaSalesArea = salesDendaList.reduce((acc, s) => acc + s.totalDendaNominal, 0);
  const totalDendaSpvArea = spvDendaList.reduce((acc, s) => acc + s.totalDendaNominal, 0);

  return {
    salesDendaList,
    spvDendaList,
    totalDendaSalesArea,
    totalDendaSpvArea,
  };
}

// -------------------------------------------------------------
// 2. DATA SEED & LOGIC: KPI SALES BALANCED SCORECARD (100 POIN)
// -------------------------------------------------------------

export function calculateKpiPoints(input: {
  sellOutAchievementPct: number;
  overdueStoresUp45Count: number;
  visitLogsCount: number;
  baReportWeeklyPct: number;
  baStockOpnameAppPct: number;
  storesUsingBufferAppPct: number;
}): {
  pointSellOut: number;
  pointTagihan45H: number;
  pointKunjungan: number;
  pointBaReportWeekly: number;
  pointBaStockOpname: number;
  pointMonitoringBa: number;
  pointBufferStock: number;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  kpiIncentive: number;
  kpiPenalty: number;
  hasSp1: boolean;
} {
  // Pilar 1: Poin Sell Out (40 pt)
  let pointSellOut = 20;
  if (input.sellOutAchievementPct >= 100) pointSellOut = 40;
  else if (input.sellOutAchievementPct >= 80) pointSellOut = 30;
  else if (input.sellOutAchievementPct >= 70) pointSellOut = 25;

  // Pilar 2: Poin Tagihan Up 45 Hari (30 pt)
  let pointTagihan45H = 10;
  if (input.overdueStoresUp45Count === 0) pointTagihan45H = 30;
  else if (input.overdueStoresUp45Count === 1) pointTagihan45H = 25;
  else if (input.overdueStoresUp45Count === 2) pointTagihan45H = 20;
  else if (input.overdueStoresUp45Count === 3) pointTagihan45H = 15;

  // Pilar 3: Report Kunjungan & Follow Up (10 pt)
  let pointKunjungan = 0;
  if (input.visitLogsCount > 90) pointKunjungan = 10;
  else if (input.visitLogsCount >= 30) pointKunjungan = 5;
  else if (input.visitLogsCount >= 1) pointKunjungan = 3;

  // Pilar 4: Monitoring BA (10 pt)
  // 1. Report BA Weekly 1-4 (Maks 5 pt)
  let pointBaReportWeekly = 2;
  if (input.baReportWeeklyPct >= 100) pointBaReportWeekly = 5;
  else if (input.baReportWeeklyPct >= 80) pointBaReportWeekly = 3;

  // 2. Tugas SO App 2x/Bulan (Maks 5 pt)
  let pointBaStockOpname = 2;
  if (input.baStockOpnameAppPct >= 100) pointBaStockOpname = 5;
  else if (input.baStockOpnameAppPct >= 80) pointBaStockOpname = 3;

  const pointMonitoringBa = pointBaReportWeekly + pointBaStockOpname;

  // Pilar 5: Buffer Stock (10 pt)
  let pointBufferStock = 3;
  if (input.storesUsingBufferAppPct >= 100) pointBufferStock = 10;
  else if (input.storesUsingBufferAppPct >= 80) pointBufferStock = 5;

  // Total Score (0 - 100)
  const totalScore = pointSellOut + pointTagihan45H + pointKunjungan + pointMonitoringBa + pointBufferStock;

  // Grade determination
  let grade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';

  // Insentif Reward KPI:
  // 100 Poin: +Rp 2.000.000
  // 90-99 Poin: +Rp 1.000.000
  // 80-89 Poin: +Rp 500.000
  // <80 Poin: Rp 0
  let kpiIncentive = 0;
  if (totalScore >= 100) kpiIncentive = 2000000;
  else if (totalScore >= 90) kpiIncentive = 1000000;
  else if (totalScore >= 80) kpiIncentive = 500000;

  // Denda KPI & Sanksi SP1:
  // >= 70 Poin: Aman (0)
  // < 70 Poin: SP1 dan denda -Rp 300.000
  const hasSp1 = totalScore < 70;
  const kpiPenalty = hasSp1 ? 300000 : 0;

  return {
    pointSellOut,
    pointTagihan45H,
    pointKunjungan,
    pointBaReportWeekly,
    pointBaStockOpname,
    pointMonitoringBa,
    pointBufferStock,
    totalScore,
    grade,
    kpiIncentive,
    kpiPenalty,
    hasSp1,
  };
}

export {
  SALES_MASTER_6_CONFIG,
  VALID_KPI_SALES_NAMES,
  INITIAL_KPI_SALES,
} from './kpiSalesData';
export type { SalesCoverConfig } from './kpiSalesData';
import {
  SALES_MASTER_6_CONFIG,
  VALID_KPI_SALES_NAMES,
  INITIAL_KPI_SALES,
} from './kpiSalesData';

export function loadKpiSalesData(): KpiSalesScorecardItem[] {
  try {
    const raw = localStorage.getItem(KPI_SALES_OVERRIDES_KEY);
    if (raw) {
      const parsed: KpiSalesScorecardItem[] = JSON.parse(raw);
      // Strictly retain only the 6 official sales representatives
      const validFiltered = parsed
        .filter((item) => VALID_KPI_SALES_NAMES.includes(item.salesName))
        .map((item) => {
          const cfg = SALES_MASTER_6_CONFIG[item.salesName];
          return {
            ...item,
            trainerCovered: item.trainerCovered || cfg?.trainerCovered || '-',
            coveredStores: item.coveredStores && item.coveredStores.length > 0 ? item.coveredStores : (cfg?.coveredStores || []),
            storeCount: item.storeCount || item.coveredStores?.length || cfg?.coveredStores.length || 0,
          };
        });

      // Ensure historical months from INITIAL_KPI_SALES are included
      const existingKeySet = new Set(validFiltered.map((p) => (p.salesName + '_' + p.monthPeriod).toUpperCase()));
      const missing = INITIAL_KPI_SALES.filter(
        (init) => !existingKeySet.has((init.salesName + '_' + init.monthPeriod).toUpperCase())
      );

      const merged = missing.length > 0 ? [...validFiltered, ...missing] : validFiltered;
      localStorage.setItem(KPI_SALES_OVERRIDES_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load KPI sales data from localStorage', e);
  }
  return INITIAL_KPI_SALES;
}

export function saveKpiSalesData(items: KpiSalesScorecardItem[]): void {
  try {
    const onlyValid = items.filter((item) => VALID_KPI_SALES_NAMES.includes(item.salesName));
    localStorage.setItem(KPI_SALES_OVERRIDES_KEY, JSON.stringify(onlyValid));
  } catch (e) {
    console.warn('Failed to save KPI sales data to localStorage', e);
  }
}

// -------------------------------------------------------------
// 3. DATA SEED & LOGIC: PUNISHMENT BA (DENDA NIHIL RP 25.000)
// -------------------------------------------------------------

export const INITIAL_BA_INCIDENTS: BaNihilIncidentRecord[] = [
  {
    id: 'inc-01',
    baName: 'SITI RAHMAH',
    baNumber: 'BA-001',
    storeName: 'TOKO ALANA BEAUTY',
    brand: 'Y.O.U',
    date: getRelativeDate(4),
    dendaNominal: 25000,
    reason: 'Tidak mengirimkan rekap sell out harian pada hari kerja',
    isDispensation: false,
  },
  {
    id: 'inc-02',
    baName: 'SITI RAHMAH',
    baNumber: 'BA-001',
    storeName: 'TOKO ALANA BEAUTY',
    brand: 'Y.O.U',
    date: getRelativeDate(11),
    dendaNominal: 25000,
    reason: 'Lupa submit laporan penjualan sell out malam hari',
    isDispensation: false,
  },
  {
    id: 'inc-03',
    baName: 'DEWI LESTARI',
    baNumber: 'BA-002',
    storeName: 'SYMPHONY KOSMETIK',
    brand: 'barenbliss',
    date: getRelativeDate(2),
    dendaNominal: 25000,
    reason: 'Koneksi internet bermasalah, nihil data transaksi',
    isDispensation: true,
    dispensationNote: 'Dispensasi resmi SPV Widodo: toko sedang renovasi listrik padam seharian.',
    approvedBy: 'SPV WIDODO',
  },
  {
    id: 'inc-04',
    baName: 'ANISA PUTRI',
    baNumber: 'BA-003',
    storeName: 'I.C.A COSMETIK',
    brand: 'DAZZLE ME',
    date: getRelativeDate(6),
    dendaNominal: 25000,
    reason: 'Nihil penjualan dan tidak mengisi form laporan counter',
    isDispensation: false,
  },
  {
    id: 'inc-05',
    baName: 'ANISA PUTRI',
    baNumber: 'BA-003',
    storeName: 'I.C.A COSMETIK',
    brand: 'DAZZLE ME',
    date: getRelativeDate(8),
    dendaNominal: 25000,
    reason: 'Terlambat submit laporan lebih dari 24 jam',
    isDispensation: false,
  },
  {
    id: 'inc-06',
    baName: 'ANISA PUTRI',
    baNumber: 'BA-003',
    storeName: 'I.C.A COSMETIK',
    brand: 'DAZZLE ME',
    date: getRelativeDate(14),
    dendaNominal: 25000,
    reason: 'Nihil sell out tanpa konfirmasi SPV',
    isDispensation: false,
  },
  {
    id: 'inc-07',
    baName: 'ANISA PUTRI',
    baNumber: 'BA-003',
    storeName: 'I.C.A COSMETIK',
    brand: 'DAZZLE ME',
    date: getRelativeDate(18),
    dendaNominal: 25000,
    reason: 'Nihil laporan counter',
    isDispensation: false,
  },
  {
    id: 'inc-08',
    baName: 'ANISA PUTRI',
    baNumber: 'BA-003',
    storeName: 'I.C.A COSMETIK',
    brand: 'DAZZLE ME',
    date: getRelativeDate(21),
    dendaNominal: 25000,
    reason: 'Nihil sell out hari kerja (Total 5x -> SP Berat)',
    isDispensation: false,
  },
  {
    id: 'inc-09',
    baName: 'MEGAWATI',
    baNumber: 'BA-004',
    storeName: 'NAGOYA BEAUTY CENTRE',
    brand: 'lavojoy',
    date: getRelativeDate(9),
    dendaNominal: 25000,
    reason: 'Izin sakit bersurat dokter',
    isDispensation: true,
    dispensationNote: 'Dispensasi sakit bersurat dokter RS Batam.',
    approvedBy: 'SPV SISKA MELINDA',
  },
];

export function loadBaIncidents(): BaNihilIncidentRecord[] {
  try {
    const raw = localStorage.getItem(BA_PUNISHMENT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load BA incidents from localStorage', e);
  }
  return INITIAL_BA_INCIDENTS;
}

export function saveBaIncidents(incidents: BaNihilIncidentRecord[]): void {
  try {
    localStorage.setItem(BA_PUNISHMENT_KEY, JSON.stringify(incidents));
  } catch (e) {
    console.warn('Failed to save BA incidents to localStorage', e);
  }
}

export function calculateBaPunishmentSummary(
  incidents: BaNihilIncidentRecord[],
  baseBaList: {
    baName: string;
    baNumber: string;
    storeName: string;
    coverArea: string;
    region: string;
    salesName: string;
    spvName?: string;
    brand: string;
    sellOutActual: number;
    baseSalary: number;
    totalSalary: number;
  }[],
  customSalaryOverrides?: Record<string, { baseSalary?: number; customDendaTotal?: number; customTakeHomePay?: number }>
): BaPunishmentSummaryItem[] {
  return baseBaList.map((ba) => {
    const baIncidents = incidents.filter(
      (inc) =>
        inc.baName.toLowerCase() === ba.baName.toLowerCase() ||
        (inc.baNumber && inc.baNumber === ba.baNumber)
    );

    // Filter out dispensasi and BA OFF (hari libur/off resmi tidak dihitung denda)
    const activeDendaIncidents = baIncidents.filter((inc) => !inc.isDispensation && !inc.isOffDay);
    const totalOffDays = baIncidents.filter((inc) => inc.isOffDay).length;
    const totalNihilDays = activeDendaIncidents.length;
    
    // Per-incident custom or default Rp 25.000
    const calculatedDenda = activeDendaIncidents.reduce(
      (sum, inc) => sum + (inc.customDendaNominal !== undefined ? inc.customDendaNominal : (inc.dendaNominal || 25000)),
      0
    );

    const override = customSalaryOverrides?.[ba.baName] || customSalaryOverrides?.[ba.baNumber];
    const totalDendaNominal = override?.customDendaTotal !== undefined ? override.customDendaTotal : calculatedDenda;

    let disciplineBadge: 'tertib' | 'peringatan_1' | 'peringatan_2' | 'peringatan_sp' = 'tertib';
    if (totalNihilDays >= 5) {
      disciplineBadge = 'peringatan_sp';
    } else if (totalNihilDays >= 3) {
      disciplineBadge = 'peringatan_2';
    } else if (totalNihilDays >= 1) {
      disciplineBadge = 'peringatan_1';
    }

    const effectiveBaseSalary = override?.baseSalary !== undefined ? override.baseSalary : ba.baseSalary;
    const effectiveTotalSalary = override?.baseSalary !== undefined
      ? (ba.totalSalary - ba.baseSalary + override.baseSalary)
      : ba.totalSalary;

    const totalTakeHomePay = override?.customTakeHomePay !== undefined
      ? override.customTakeHomePay
      : Math.max(0, effectiveTotalSalary - totalDendaNominal);

    return {
      baName: ba.baName,
      baNumber: ba.baNumber,
      storeName: ba.storeName,
      coverArea: ba.coverArea,
      region: ba.region,
      salesName: ba.salesName,
      spvName: ba.spvName || '-',
      brand: ba.brand,
      totalNihilDays,
      totalOffDays,
      noSellDays: totalNihilDays,
      totalDendaNominal,
      disciplineBadge,
      incidents: baIncidents,
      sellOutActual: ba.sellOutActual,
      baseSalary: effectiveBaseSalary,
      totalTakeHomePay,
      isManualSalaryEdited: Boolean(override),
      customBaseSalary: override?.baseSalary,
      customDendaTotal: override?.customDendaTotal,
    };
  }).sort((a, b) => b.totalNihilDays - a.totalNihilDays);
}
