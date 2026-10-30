import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransactionRecord, MetricSummary, DashboardFilters } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent, aggregateByDimension } from './analytics';
import { aggregateAreaCost } from './costCalculations';
import { calculateProfitArea } from './profitCalculations';
import {
  loadStoreBills,
  loadKpiSalesData,
  loadBaIncidents,
  calculateBaPunishmentSummary,
} from '../services/agingAndKpiService';
import { aggregateBaFocusProductData } from '../services/focusProductService';
import { aggregateTargetMatrix } from '../services/targetManagementService';

export function exportToExcel(
  records: TransactionRecord[],
  summary: MetricSummary,
  filters: DashboardFilters,
  filename: string = `SalesPro_Laporan_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Ringkasan Eksekutif
  const summaryRows: (string | number)[][] = [
    ['SALESPRO ANALYTICS - LAPORAN KINERJA PENJUALAN'],
    ['Kategori Industri: FMCG & Beauty Cosmetics Portfolio'],
    ['Tanggal Export:', new Date().toLocaleString('id-ID')],
    [''],
    ['--- PARAMETER FILTER AKTIF ---'],
    ['Tahun:', filters.TAHUN],
    ['Bulan:', filters.BULAN],
    ['Brand:', filters.BRAND],
    ['Kategori:', filters.KATEGORI || 'ALL'],
    ['Supervisor (SPV):', filters.SPV],
    ['Salesperson:', filters.SALES],
    ['Nama Store:', filters.NAMA_STORE],
    ['Region:', filters.REGION],
    ['Status Transaksi (KET):', filters.KET],
    ['Pencarian Bebas:', filters.searchQuery || '-'],
    [''],
    ['--- RINGKASAN METRIK KUNCI (KPI) ---'],
    ['Total Omset Bersih (Net Sales):', summary.totalRevenue],
    ['Total Omset Kotor (Gross Sales):', summary.grossRevenue],
    ['Total Retur (Nilai):', summary.totalReturnRevenue],
    ['Tingkat Retur (Return Rate %):', `${summary.returnRatePercent.toFixed(2)}%`],
    ['Total Qty Terjual (Unit):', summary.totalQty],
    ['Total Transaksi:', summary.totalTransactions],
    ['Rata-Rata Nilai Transaksi (AOV):', summary.averageOrderValue],
    ['Jumlah Baris Data Terfilter:', records.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // 2. Sheet: Data Transaksi Lengkap
  const txHeaders = [
    'No',
    'Tanggal',
    'Bulan',
    'Tahun',
    'Beauty Advisor (BA)',
    'BA Number',
    'Cover Area',
    'Sales',
    'SPV',
    'Brand',
    'No SKU',
    'SPU',
    'Nama SKU',
    'Produk Focus',
    'Produk New',
    'Nama Store',
    'Region',
    'Kategori',
    'QTY (Pcs)',
    'Nilai Penjualan (IDR)',
    'Keterangan (KET)',
  ];

  const txRows = records.map((r, idx) => [
    idx + 1,
    r.TANGGAL,
    r.BULAN,
    r.TAHUN,
    r.BA,
    r.BA_Number,
    r.COVER_AREA,
    r.SALES,
    r.SPV,
    r.BRAND,
    r.NO_SKU,
    r.SPU,
    r.SKU,
    r.PRODUK_FOCUS,
    r.PRODUK_NEW,
    r.NAMA_STORE,
    r.REGION,
    r.KATEGORI,
    r.QTY,
    r.VALUE,
    r.KET,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Data Transaksi');

  // 3. Sheet: Analisa Kategori
  const categoryData = aggregateByDimension(records, 'KATEGORI');
  const catHeaders = ['No', 'Kategori', 'Total Penjualan (IDR)', 'Total QTY (Pcs)', 'Jumlah Transaksi', 'Kontribusi (%)'];
  const catRows = categoryData.map((c, idx) => [
    idx + 1,
    c.name,
    c.totalValue,
    c.totalQty,
    c.transactionCount,
    Number(c.contributionPercent.toFixed(2)),
  ]);
  const wsCat = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Analisa Kategori');

  // 4. Sheet: Analisa Brand
  const brandData = aggregateByDimension(records, 'BRAND');
  const brandHeaders = ['No', 'Brand', 'Total Penjualan (IDR)', 'Total QTY (Pcs)', 'Jumlah Transaksi', 'Kontribusi (%)'];
  const brandRows = brandData.map((b, idx) => [
    idx + 1,
    b.name,
    b.totalValue,
    b.totalQty,
    b.transactionCount,
    Number(b.contributionPercent.toFixed(2)),
  ]);
  const wsBrand = XLSX.utils.aoa_to_sheet([brandHeaders, ...brandRows]);
  XLSX.utils.book_append_sheet(wb, wsBrand, 'Analisa Brand');

  // 5. Sheet: Analisa Store
  const storeData = aggregateByDimension(records, 'NAMA_STORE');
  const storeHeaders = ['Peringkat', 'Nama Store', 'Total Penjualan (IDR)', 'Total QTY (Pcs)', 'Kontribusi (%)'];
  const storeRows = storeData.map((s, idx) => [
    idx + 1,
    s.name,
    s.totalValue,
    s.totalQty,
    Number(s.contributionPercent.toFixed(2)),
  ]);
  const wsStore = XLSX.utils.aoa_to_sheet([storeHeaders, ...storeRows]);
  XLSX.utils.book_append_sheet(wb, wsStore, 'Peringkat Toko');

  // 6. Sheet: Estimasi Cost Area (Gaji & Insentif Karyawan)
  const costData = aggregateAreaCost(records);
  const costSummaryRows: (string | number)[][] = [
    ['ESTIMASI COST AREA (GAJI & INSENTIF KARYAWAN)'],
    ['Total Cost Area (IDR)', costData.totalCost],
    ['Total Biaya Sales (IDR)', costData.totalSalesCost],
    ['Total Biaya BA Toko (IDR)', costData.totalBaCost],
    ['Total Insentif Area (IDR)', costData.totalSalesIncentive + costData.totalBaIncentive],
    ['Rasio Cost terhadap Omset', `${costData.costToRevenueRatio.toFixed(2)}%`],
    [''],
    ['DAFTAR GAJI SALES (SELL IN & BONUS/PENALTY BA)'],
    [
      'Nama Sales',
      'Area',
      'SPV',
      'Target Sell In',
      'Realisasi Sell In',
      '% Pencapaian',
      'Skema Tier',
      'Gaji Pokok',
      '% Insentif Sell In',
      'Nominal Insentif Sell In',
      'Jumlah BA Dicover',
      'Bonus BA (>=45 Jt)',
      'Denda BA (<35 Jt)',
      'Sanksi SP1 (BA)',
      'Take Home Pay Final',
    ],
    ...costData.salesList.map((s) => [
      s.salesName,
      s.coverArea,
      s.spv,
      s.sellInTarget,
      s.sellInActual,
      Number(s.achievementPercent.toFixed(2)),
      s.tierLabel,
      s.baseSalary,
      `${s.incentivePercent}%`,
      s.incentiveNominal,
      s.coveredBaCount,
      s.baProductivityBonus,
      s.baProductivityPenalty,
      s.baProductivitySpCount > 0 ? `SP1 (${s.baProductivitySpCount}x)` : 'Aman',
      s.totalSalary,
    ]),
    [''],
    ['DAFTAR GAJI BA (TOKO BER-BA: MULTI-BRAND & LAVOJOY 4%)'],
    [
      'Nama BA',
      'No BA',
      'Nama Toko',
      'Area / Region',
      'Target Non-Lavojoy',
      'Realisasi Non-Lavojoy',
      '% Capai Non-Lavojoy',
      'Gaji Pokok BA',
      '% Insentif Non-Lavojoy',
      'Insentif Non-Lavojoy (IDR)',
      'Target Lavojoy',
      'Realisasi Lavojoy',
      '% Capai Lavojoy',
      'Insentif Lavojoy (4%)',
      'Total Sell Out',
      'Take Home Pay Final',
    ],
    ...costData.baList.map((b) => [
      b.baName,
      b.baNumber,
      b.storeName,
      `${b.coverArea} (${b.region})`,
      b.targetNonLavojoy,
      b.sellOutNonLavojoy,
      Number(b.achievementNonLavojoyPercent.toFixed(2)),
      b.baseSalary,
      `${b.incentiveNonLavojoyPercent}%`,
      b.incentiveNonLavojoyNominal,
      b.targetLavojoy,
      b.sellOutLavojoy,
      Number(b.achievementLavojoyPercent.toFixed(2)),
      b.incentiveLavojoyNominal,
      b.sellOutActual,
      b.totalSalary,
    ]),
  ];
  const wsCost = XLSX.utils.aoa_to_sheet(costSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsCost, 'Cost Area (Gaji)');

  // 7. Sheet: Profit Area (P&L, Margin 55%, Biaya 33% & Gaji)
  const profitData = calculateProfitArea(records);
  const profitSummaryRows: (string | number)[][] = [
    ['ANALISA PROFIT AREA (P&L PORTFOLIO)'],
    ['Realisasi Sell In (IDR)', profitData.sellInActual],
    ['Margin Kotor (55%) (IDR)', profitData.marginValue],
    ['Biaya Operasional (33%) (IDR)', profitData.operatingCostValue],
    ['Total Beban Gaji Karyawan (IDR)', profitData.salaryCost],
    ['Total Biaya Pengurang (33% + Gaji) (IDR)', profitData.totalExpense],
    ['SISA PROFIT TERSEDIA (IDR)', profitData.remainingProfitValue],
    ['% Sisa Profit terhadap Sell In', `${profitData.remainingProfitPercentSellIn.toFixed(2)}%`],
    ['% Sisa Profit terhadap Margin', `${profitData.remainingProfitPercentMargin.toFixed(2)}%`],
    ['Titik Impas (BEP) Sell In (IDR)', profitData.breakEvenPointSellIn],
    [''],
    ['RINCIAN PROFITABILITAS PER AREA'],
    ['Area', 'Region', 'Realisasi Sell In', 'Margin (55%)', 'Biaya Ops (33%)', 'Beban Gaji Area', 'Total Biaya', 'Sisa Profit (IDR)', '% Net Margin'],
    ...profitData.profitByArea.map((a) => [
      a.name,
      a.spvOrRegion,
      a.sellInActual,
      a.marginValue,
      a.operatingCostValue,
      a.salaryCost,
      a.totalExpense,
      a.remainingProfitValue,
      `${a.remainingProfitPercentSellIn.toFixed(2)}%`,
    ]),
    [''],
    ['RINCIAN PROFITABILITAS PER OUTLET / TOKO (BEBAN GAJI BA)'],
    [
      'Nama Toko',
      'Area',
      'Region',
      'Sales',
      'Status BA',
      'Nama BA',
      'Sell In Toko',
      'Margin (55%)',
      'Biaya Ops (33%)',
      'Biaya Gaji BA Toko',
      'Total Biaya Toko',
      'Sisa Profit Toko (IDR)',
      '% Net Margin',
      'Status',
    ],
    ...(profitData.profitByStore || []).map((st) => [
      st.storeName,
      st.coverArea,
      st.region,
      st.salesName,
      st.hasBa ? 'Ada BA' : 'Non-BA',
      st.baName || '-',
      st.sellInActual,
      st.marginValue,
      st.operatingCostValue,
      st.baSalaryCost,
      st.totalExpense,
      st.remainingProfitValue,
      `${st.remainingProfitPercentSellIn.toFixed(2)}%`,
      st.profitStatus === 'excellent' ? 'Sangat Sehat' : st.profitStatus === 'healthy' ? 'Sehat' : st.profitStatus === 'warning' ? 'Waspada' : 'Defisit',
    ]),
  ];
  const wsProfit = XLSX.utils.aoa_to_sheet(profitSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsProfit, 'Profit Area (P&L)');

  // 8. Sheet: Daftar Tagihan & Aging Piutang Toko
  const bills = loadStoreBills();
  const billHeaders = [
    'No',
    'No Faktur',
    'Nama Toko',
    'Area',
    'Region',
    'Sales',
    'SPV',
    'Tgl Sell In',
    'Jatuh Tempo',
    'Aging (Hari)',
    'Kategori Aging',
    'Nominal Tagihan (IDR)',
    'Status Bayar',
    'Tanggal Bayar',
    'Tindakan & Eskalasi',
  ];
  const billRows = bills.map((b, idx) => [
    idx + 1,
    b.invoiceNumber,
    b.storeName,
    b.coverArea,
    b.region,
    b.salesName,
    b.spvName,
    b.sellInDate,
    b.dueDate,
    b.agingDays,
    b.agingCategory,
    b.amount,
    b.isPaid ? 'LUNAS' : 'BELUM LUNAS',
    b.paymentDate || '-',
    b.actionRequired,
  ]);
  const wsBills = XLSX.utils.aoa_to_sheet([billHeaders, ...billRows]);
  XLSX.utils.book_append_sheet(wb, wsBills, 'Tagihan & Aging Toko');

  // 9. Sheet: Scorecard KPI Sales (100 Poin)
  const kpiItems = loadKpiSalesData();
  const kpiHeaders = [
    'No',
    'Nama Sales',
    'Area',
    'SPV',
    'Periode',
    'Target Sell Out',
    'Realisasi Sell Out',
    '% Capai Sell Out',
    'Poin Sell Out (Maks 40)',
    'Toko Up 45H',
    'Poin Tagihan (Maks 30)',
    'Log Kunjungan',
    'Poin Kunjungan (Maks 10)',
    '% Report Weekly BA',
    '% Tugas SO App',
    'Poin Monitoring BA (Maks 10)',
    '% Buffer Stock Toko',
    'Poin Buffer Stock (Maks 10)',
    'TOTAL SKOR (Maks 100)',
    'GRADE',
    'Insentif KPI (IDR)',
    'Denda KPI (IDR)',
    'Status SP1',
    'Take Home Pay Final (IDR)',
  ];
  const kpiRows = kpiItems.map((s, idx) => [
    idx + 1,
    s.salesName,
    s.coverArea,
    s.spv,
    s.monthPeriod,
    s.sellOutTarget,
    s.sellOutActual,
    Number(s.sellOutAchievementPct.toFixed(1)),
    s.pointSellOut,
    s.overdueStoresUp45Count,
    s.pointTagihan45H,
    s.visitLogsCount,
    s.pointKunjungan,
    s.baReportWeeklyPct,
    s.baStockOpnameAppPct,
    s.pointMonitoringBa,
    s.storesUsingBufferAppPct,
    s.pointBufferStock,
    s.totalScore,
    s.grade,
    s.kpiIncentive,
    s.kpiPenalty,
    s.hasSp1 ? 'SP1' : 'AMAN',
    s.finalTakeHomePay,
  ]);
  const wsKpi = XLSX.utils.aoa_to_sheet([kpiHeaders, ...kpiRows]);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Scorecard KPI Sales');

  // 10. Sheet: Punishment Denda BA
  const incidents = loadBaIncidents();
  const baList = costData.baList.map((b) => ({
    baName: b.baName,
    baNumber: b.baNumber,
    storeName: b.storeName,
    coverArea: b.coverArea,
    region: b.region,
    salesName: b.salesName,
    spvName: b.spv || '-',
    brand: 'Multi-Brand',
    sellOutActual: b.sellOutActual,
    baseSalary: b.baseSalary,
    totalSalary: b.totalSalary,
  }));
  const baPunishments = calculateBaPunishmentSummary(incidents, baList);
  const baHeaders = [
    'No',
    'Nama BA',
    'No BA',
    'Nama Toko',
    'Area',
    'Region',
    'Sales',
    'SPV',
    'Hari Nihil Sell Out',
    'Total Denda (Rp 25.000/hari)',
    'Tingkat Disiplin',
    'Realisasi Sell Out',
    'Gaji Sebelum Denda',
    'Gaji Bersih (THP Final)',
  ];
  const baRows = baPunishments.map((b, idx) => [
    idx + 1,
    b.baName,
    b.baNumber,
    b.storeName,
    b.coverArea,
    b.region,
    b.salesName,
    b.spvName,
    b.totalNihilDays,
    b.totalDendaNominal,
    b.disciplineBadge,
    b.sellOutActual,
    b.baseSalary,
    b.totalTakeHomePay,
  ]);
  const wsBa = XLSX.utils.aoa_to_sheet([baHeaders, ...baRows]);
  XLSX.utils.book_append_sheet(wb, wsBa, 'Punishment Denda BA');

  // 11. Sheet: Target & Pencapaian Produk Fokus BA (Insentif Rp 2.000 / Denda Rp 1.000)
  const focusData = aggregateBaFocusProductData(records);
  const focusHeaders = [
    'No',
    'Nama BA',
    'No BA',
    'Nama Toko',
    'Area',
    'Region',
    'Sales',
    'SPV',
    'Target Fokus (Pcs)',
    'Realisasi Fokus (Pcs)',
    '% Capai',
    'Status Evaluasi',
    'Insentif Fokus (Rp 2.000/pcs)',
    'Denda Fokus (Rp 1.000/pcs shortfall)',
    'Net Kompensasi Fokus (IDR)',
    'Catatan / Dispensasi',
  ];
  const focusRows = focusData.map((f, idx) => [
    idx + 1,
    f.baName,
    f.baNumber,
    f.storeName,
    f.coverArea,
    f.region,
    f.salesName,
    f.spv || '-',
    f.targetPcs,
    f.actualPcs,
    Number(f.achievementPct.toFixed(1)),
    f.status === 'insentif' ? 'INSENTIF (≥80%)' : f.status === 'aman' ? 'AMAN (70-79%)' : 'DENDA (<70%)',
    f.incentive,
    f.penalty,
    f.netBonus,
    f.note || '-',
  ]);
  const wsFocus = XLSX.utils.aoa_to_sheet([focusHeaders, ...focusRows]);
  XLSX.utils.book_append_sheet(wb, wsFocus, 'Produk Fokus BA');

  // 12. Sheet: Matrix Target Terpadu (Area, SPV, Sales & BA)
  const targetMatrix = aggregateTargetMatrix(records);
  const targetRows: (string | number)[][] = [
    ['REKAPITULASI TARGET & REALISASI MULTI-TIER (AREA, SPV, SALES, BA)'],
    ['--- 1. TARGET PER COVER AREA ---'],
    ['No', 'Cover Area', 'Region', 'Target Omzet (IDR)', 'Realisasi Sell In (IDR)', '% Capai', 'Status'],
    ...targetMatrix.areas.map((a, idx) => [
      idx + 1,
      a.coverArea,
      a.region,
      a.targetOmzet,
      a.actualSellIn,
      Number(a.achievementPct.toFixed(1)),
      a.status.toUpperCase(),
    ]),
    [''],
    ['--- 2. TARGET PER SPV ---'],
    ['No', 'Nama SPV', 'Area Cover', 'Target Tim SPV (IDR)', 'Realisasi Sell In (IDR)', '% Capai', 'Status'],
    ...targetMatrix.spvs.map((s, idx) => [
      idx + 1,
      s.spvName,
      s.coverAreas.join(', '),
      s.targetOmzet,
      s.actualSellIn,
      Number(s.achievementPct.toFixed(1)),
      s.status.toUpperCase(),
    ]),
    [''],
    ['--- 3. TARGET SELL IN SALES & INSENTIF 4% ---'],
    ['No', 'Nama Sales', 'Cover Area', 'SPV', 'Target Sell In (IDR)', 'Realisasi Sell In (IDR)', '% Capai', 'Skema Insentif', 'Estimasi Insentif (IDR)'],
    ...targetMatrix.sales.map((sl, idx) => [
      idx + 1,
      sl.salesName,
      sl.coverArea,
      sl.spv,
      sl.targetSellIn,
      sl.actualSellIn,
      Number(sl.achievementPct.toFixed(1)),
      `${sl.incentivePercent}%`,
      sl.incentiveNominal,
    ]),
  ];
  const wsTarget = XLSX.utils.aoa_to_sheet(targetRows);
  XLSX.utils.book_append_sheet(wb, wsTarget, 'Matrix Target Terpadu');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

export function exportToPdf(
  records: TransactionRecord[],
  summary: MetricSummary,
  filters: DashboardFilters,
  filename: string = `SalesPro_Laporan_${new Date().toISOString().slice(0, 10)}.pdf`
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Banner (Emerald & Teal gradient feel)
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFillColor(13, 148, 136); // teal-600
  doc.rect(0, 18, pageWidth, 2, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALESPRO ANALYTICS - LAPORAN KINERJA PENJUALAN', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FMCG & Beauty Cosmetics Portfolio Dashboard', pageWidth - 14, 12, { align: 'right' });

  // Metadata & Filter Section
  let currentY = 26;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Parameter & Filter Laporan', 14, currentY);

  currentY += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const filterSummary = [
    `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`,
    `Tahun: ${filters.TAHUN} | Bulan: ${filters.BULAN}`,
    `Brand: ${filters.BRAND} | Kategori: ${filters.KATEGORI || 'ALL'}`,
    `SPV: ${filters.SPV} | Sales: ${filters.SALES} | Region: ${filters.REGION}`,
    `Status Transaksi: ${filters.KET} | Total Baris: ${records.length} data`,
  ];

  filterSummary.forEach((line) => {
    doc.text(line, 14, currentY);
    currentY += 4;
  });

  // KPI Summary Table
  currentY += 2;
  autoTable(doc, {
    startY: currentY,
    head: [['Total Omset Bersih', 'Total Unit (QTY)', 'Total Transaksi', 'Retur (Rate %)', 'Rata-rata Order (AOV)']],
    body: [[
      formatRupiah(summary.totalRevenue),
      `${formatNumber(summary.totalQty)} pcs`,
      formatNumber(summary.totalTransactions),
      `${formatRupiah(summary.totalReturnRevenue)} (${summary.returnRatePercent.toFixed(1)}%)`,
      formatRupiah(summary.averageOrderValue),
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      textColor: [15, 23, 42],
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Analisa Kategori Table
  const categoryData = aggregateByDimension(records, 'KATEGORI').slice(0, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Analisa Kategori Produk (Teratas)', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Kategori', 'Total Penjualan (IDR)', 'Total QTY', 'Jumlah Tx', 'Porsi (%)']],
    body: categoryData.map((c, i) => [
      i + 1,
      c.name,
      formatRupiah(c.totalValue),
      `${formatNumber(c.totalQty)} pcs`,
      c.transactionCount,
      formatPercent(c.contributionPercent, false),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [192, 38, 211], // fuchsia-600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Analisa Brand Table
  const brandData = aggregateByDimension(records, 'BRAND');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Pencapaian Penjualan per Brand', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Brand', 'Total Penjualan (IDR)', 'Total QTY', 'Jumlah Tx', 'Porsi (%)']],
    body: brandData.map((b, i) => [
      i + 1,
      b.name,
      formatRupiah(b.totalValue),
      `${formatNumber(b.totalQty)} pcs`,
      b.transactionCount,
      formatPercent(b.contributionPercent, false),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [225, 29, 72], // rose-600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Top Stores (Check if we need a new page)
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  const topStores = aggregateByDimension(records, 'NAMA_STORE').slice(0, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Top 10 Gerai Toko Berdasarkan Omset', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Rank', 'Nama Store', 'Total Penjualan (IDR)', 'Total QTY', 'Porsi (%)']],
    body: topStores.map((s, i) => [
      `#${i + 1}`,
      s.name,
      formatRupiah(s.totalValue),
      `${formatNumber(s.totalQty)} pcs`,
      formatPercent(s.contributionPercent, false),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer Note
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SalesPro Analytics · Dicetak secara otomatis · Halaman ${p} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  doc.save(filename);
}
