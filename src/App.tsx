import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  DashboardFilters,
  TimeframeMode,
  TransactionRecord,
  GasConfig,
} from './types/dashboard';
import { INITIAL_DATA } from './data/initialData';
import {
  loadGasConfig,
  saveGasConfig,
  loadStoredTransactions,
  saveStoredTransactions,
  clearStoredTransactions,
  loadTransactionsFromDb,
  downloadCsv,
  fetchGoogleSheetData,
} from './services/gasService';
import {
  filterRecords,
  getCascadingOptions,
  calculateSummary,
  aggregateTimeframe,
  calculateComparisonGrowth,
  diagnoseSalesGap,
  formatRupiah,
  formatPercent,
} from './utils/analytics';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { TimeframeTrendChart } from './components/TimeframeTrendChart';
import { ComparisonView } from './components/ComparisonView';
import { GapAnalysisView } from './components/GapAnalysisView';
import { SalesAnalysis } from './components/SalesAnalysis';
import { SpvAnalysis } from './components/SpvAnalysis';
import { BrandAnalysis } from './components/BrandAnalysis';
import { StoreAnalysis } from './components/StoreAnalysis';
import { SkuAnalysis } from './components/SkuAnalysis';
import { RawDataTable } from './components/RawDataTable';
import { GasIntegrationModal } from './components/GasIntegrationModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { CategoryAnalysis } from './components/CategoryAnalysis';
import { CostAreaAnalysis } from './components/CostAreaAnalysis';
import { ProfitAreaAnalysis } from './components/ProfitAreaAnalysis';
import { StoreAgingBills } from './components/StoreAgingBills';
import { KpiSalesScorecard } from './components/KpiSalesScorecard';
import { KpiTrainerScorecard } from './components/KpiTrainerScorecard';
import { ReviewWeeklySellOutBa } from './components/ReviewWeeklySellOutBa';
import { BaPunishmentView } from './components/BaPunishmentView';
import { FocusProductBaManagement } from './components/FocusProductBaManagement';
import { TargetManagementView } from './components/TargetManagementView';
import { QuarterlySummaryView } from './components/QuarterlySummaryView';
import { SellInVsSellOutView } from './components/SellInVsSellOutView';
import { StoreBaContributionView } from './components/StoreBaContributionView';
import { exportToExcel, exportToPdf } from './utils/exportUtils';
import {
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Layers,
  Store,
  ChevronRight,
  Boxes,
  Wallet,
} from 'lucide-react';

const INITIAL_FILTERS: DashboardFilters = {
  BULAN: 'ALL',
  TAHUN: 'ALL',
  SALES: 'ALL',
  SPV: 'ALL',
  BRAND: 'ALL',
  KATEGORI: 'ALL',
  SKU: 'ALL',
  NAMA_STORE: 'ALL',
  REGION: 'ALL',
  KET: 'ALL',
  searchQuery: '',
};

export default function App() {
  // State for transaction dataset
  const [records, setRecords] = useState<TransactionRecord[]>(() => {
    const stored = loadStoredTransactions();
    return stored && stored.length > 0 ? stored : INITIAL_DATA;
  });

  // State for active filters
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);

  // Timeframe mode for charts (Harian, Mingguan, Bulanan, Tahunan)
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('bulanan');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Google Apps Script integration state
  const [gasConfig, setGasConfig] = useState<GasConfig>(() => loadGasConfig());
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load dataset from IndexedDB on initial mount (bypasses localStorage 5MB quota)
  useEffect(() => {
    loadTransactionsFromDb().then((dbRecords) => {
      if (dbRecords && dbRecords.length > 0) {
        setRecords(dbRecords);
      }
    }).catch(() => {});
  }, []);

  // Save transactions to persistent storage (IndexedDB + safe localStorage cache)
  useEffect(() => {
    saveStoredTransactions(records);
  }, [records]);

  // Save GAS config when it changes
  useEffect(() => {
    saveGasConfig(gasConfig);
  }, [gasConfig]);

  // Auto-toast dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Filter handlers
  const handleFilterChange = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    showToast('Filter telah direset ke default.');
  };

  // Derived filtered records & cascading options
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  const cascadingOptions = useMemo(() => {
    return getCascadingOptions(records, filters);
  }, [records, filters]);

  // Summary KPIs
  const summary = useMemo(() => {
    return calculateSummary(filteredRecords);
  }, [filteredRecords]);

  // Timeframe trend data
  const trendData = useMemo(() => {
    return aggregateTimeframe(filteredRecords, timeframeMode);
  }, [filteredRecords, timeframeMode]);

  // Overall growth comparison
  const growthComparison = useMemo(() => {
    const dataset = filteredRecords.length > 0 ? filteredRecords : records;
    return calculateComparisonGrowth(dataset, 'mom', filters);
  }, [filteredRecords, records, filters]);

  // Gap & Root-Cause Diagnosis: Why did sales drop?
  const gapDiagnosis = useMemo(() => {
    return diagnoseSalesGap(records, filteredRecords, filters);
  }, [records, filteredRecords, filters]);

  // Live Sync with Google Apps Script
  const handleSyncGas = async () => {
    if (!gasConfig.webAppUrl) {
      setIsGasModalOpen(true);
      return;
    }

    setIsSyncing(true);
    const result = await fetchGoogleSheetData(gasConfig.webAppUrl);

    if (result.success && result.data) {
      setRecords(result.data);
      const updatedConfig: GasConfig = {
        ...gasConfig,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        status: 'connected',
        dataSourceType: 'google_sheet',
      };
      setGasConfig(updatedConfig);
      showToast(`Berhasil sinkronisasi! Memuat ${result.data.length} baris data dari Google Sheet.`);
    } else {
      showToast(result.message || 'Gagal sinkronisasi dari Google Apps Script', 'error');
    }

    setIsSyncing(false);
  };

  // Add new transaction record
  const handleAddRecord = (newRecord: TransactionRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Transaksi baru untuk "${newRecord.NAMA_STORE}" berhasil ditambahkan!`);
  };

  // Reset to initial sample data
  const handleResetToSample = () => {
    clearStoredTransactions();
    setRecords(INITIAL_DATA);
    setGasConfig({
      ...gasConfig,
      dataSourceType: 'sample',
      status: 'idle',
      lastSyncedAt: null,
    });
    setFilters(INITIAL_FILTERS);
    showToast('Dataset telah dikembalikan ke data simulasi bawaan.');
  };

  // Export handlers for Excel (.xlsx) and PDF (.pdf)
  const handleExportExcel = () => {
    try {
      exportToExcel(
        filteredRecords,
        summary,
        filters,
        `SalesPro_Laporan_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast('File Excel (.xlsx) berhasil diunduh!');
    } catch (err: any) {
      showToast('Gagal men-download file Excel: ' + (err.message || 'Error'), 'error');
    }
  };

  const handleExportPdf = () => {
    try {
      exportToPdf(
        filteredRecords,
        summary,
        filters,
        `SalesPro_Laporan_${new Date().toISOString().slice(0, 10)}.pdf`
      );
      showToast('File Laporan PDF (.pdf) berhasil diunduh!');
    } catch (err: any) {
      showToast('Gagal men-download file PDF: ' + (err.message || 'Error'), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100/90 via-sky-50/40 via-indigo-50/25 to-pink-50/20 text-slate-900 flex flex-col relative selection:bg-teal-500 selection:text-white">
      {/* Top Colorful Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 via-blue-500 via-indigo-500 via-purple-500 via-pink-500 to-amber-500 shrink-0 shadow-xs" />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        gasConfig={gasConfig}
        totalRecordsCount={records.length}
        filteredCount={filteredRecords.length}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onExportCsv={() => downloadCsv(filteredRecords, `salespro_export_${new Date().toISOString().slice(0, 10)}.csv`)}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onSyncGas={handleSyncGas}
        isSyncing={isSyncing}
        filters={filters}
      />

      {/* Main Workspace Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grow w-full">
        {/* Integrated Cascading Filter Bar */}
        <FilterBar
          filters={filters}
          onChangeFilter={handleFilterChange}
          onResetFilters={handleResetFilters}
          options={cascadingOptions}
        />

        {/* Executive Summary Cards (shown on primary overview or comparison) */}
        <KpiCards
          summary={summary}
          growth={growthComparison.overall}
          comparisonLabel={growthComparison.previousPeriodLabel}
        />

        {/* View Routing */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Gap & Drop Alert Callout Banner */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-rose-950">
                      Diagnosa Gap Defisit: - {formatRupiah(gapDiagnosis.gapDeficit)} ({formatPercent(gapDiagnosis.gapPercentage, false)} vs Target)
                    </h4>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Faktor utama penurunan: {gapDiagnosis.lostStoresCount} toko pasif tidak order repeat &amp; de-stocking gerai eksisting.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('gap')}
                className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>Buka Analisa Gap &amp; Solusi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Estimasi Cost Area Quick Banner */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-teal-50/60 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">
                    Estimasi Cost Area (Gaji &amp; Insentif Karyawan)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Perhitungan otomatis kompensasi Sales (Sell In 80%-99% insentif 0,2%, 100%-119% insentif 0,3% + Rp 4,9 Jt) dan BA Toko (Sell Out min 25 Jt, 70%-99%, 100%-119% 1%, ≥120% 2% + Rp 3,9 Jt).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('cost')}
                className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>Buka Estimasi Gaji Area</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeframe Analysis (Harian, Mingguan, Bulanan, Tahunan) */}
            <TimeframeTrendChart
              data={trendData}
              mode={timeframeMode}
              onModeChange={setTimeframeMode}
            />

            {/* Split Grid: Category Share, Brand Share & Top Stores Quick Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Snapshot */}
              <div className="bg-gradient-to-br from-white via-fuchsia-50/25 to-pink-50/20 rounded-2xl border border-fuchsia-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-fuchsia-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 text-white shadow-xs">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Analisa Kategori
                        </h3>
                        <p className="text-[11px] text-slate-500">Pangsa omzet per kategori produk</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('category')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100 border border-fuchsia-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>Detail Kategori</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      { name: 'Lip Makeup', gradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500', badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
                      { name: 'Body Care', gradient: 'bg-gradient-to-r from-indigo-500 to-sky-400', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
                      { name: 'Sunscreen', gradient: 'bg-gradient-to-r from-amber-500 to-orange-400', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
                      { name: 'Eye & Lash Tools', gradient: 'bg-gradient-to-r from-violet-500 to-purple-400', badge: 'bg-violet-100 text-violet-800 border-violet-200' },
                    ].map((cat) => {
                      const catRecords = filteredRecords.filter((r) => r.KATEGORI === cat.name);
                      const catVal = catRecords.reduce((acc, curr) => acc + (curr.VALUE || 0), 0);
                      const totalVal = summary.totalRevenue || 1;
                      const pct = Math.max(0, (catVal / totalVal) * 100);

                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${cat.badge}`}>
                              {cat.name}
                            </span>
                            <span className="font-mono font-extrabold text-slate-900 tabular-nums text-[11px]">
                              {formatRupiah(catVal, true)}{' '}
                              <span className="text-slate-500 font-medium">
                                ({formatPercent(pct, false)})
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                            <div
                              className={`${cat.gradient} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-fuchsia-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Pilar Portofolio:</span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-200 text-[11px]">
                    💄 Lip Makeup &amp; Body Care
                  </span>
                </div>
              </div>

              {/* Brand Snapshot */}
              <div className="bg-gradient-to-br from-white via-pink-50/20 to-purple-50/20 rounded-2xl border border-pink-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Pangsa Brand Kosmetik
                        </h3>
                        <p className="text-[11px] text-slate-500">Bauran kontribusi omzet per brand</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('brand')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>Detail Brand</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {[
                      { name: 'barenbliss', gradient: 'bg-gradient-to-r from-pink-500 to-rose-500', badge: 'bg-pink-100 text-pink-800 border-pink-200' },
                      { name: 'Y.O.U', gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
                      { name: 'DAZZLE ME', gradient: 'bg-gradient-to-r from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
                      { name: 'GLAMFIX', gradient: 'bg-gradient-to-r from-purple-600 to-fuchsia-600', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
                      { name: 'lavojoy', gradient: 'bg-gradient-to-r from-emerald-600 to-teal-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                    ].map((b) => {
                      const brandRecords = filteredRecords.filter((r) => r.BRAND === b.name);
                      const brandVal = brandRecords.reduce((acc, curr) => acc + (curr.VALUE || 0), 0);
                      const totalVal = summary.totalRevenue || 1;
                      const pct = Math.max(0, (brandVal / totalVal) * 100);

                      return (
                        <div key={b.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${b.badge}`}>
                              {b.name}
                            </span>
                            <span className="font-mono font-extrabold text-slate-900 tabular-nums text-[11px]">
                              {formatRupiah(brandVal, true)}{' '}
                              <span className="text-slate-500 font-semibold">
                                ({formatPercent(pct, false)})
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                            <div
                              className={`${b.gradient} h-full rounded-full transition-all duration-500 shadow-2xs`}
                              style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Kontributor Utama:</span>
                  <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border border-rose-200 text-[11px]">
                    ✨ barenbliss &amp; Y.O.U (64%+)
                  </span>
                </div>
              </div>

              {/* Top Stores Snapshot */}
              <div className="bg-gradient-to-br from-white via-amber-50/20 to-orange-50/20 rounded-2xl border border-amber-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Top Gerai Ritel
                        </h3>
                        <p className="text-[11px] text-slate-500">Peringkat kontribusi gerai teraktif</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('store')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>Detail Store</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 divide-y divide-amber-100/70 text-xs">
                    {[
                      { name: 'TOKO ALANA BEAUTY', rankColor: 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-2xs border border-amber-300' },
                      { name: 'SYMPHONY KOSMETIK', rankColor: 'bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-900 shadow-2xs border border-slate-300' },
                      { name: 'I.C.A COSMETIK', rankColor: 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-2xs border border-amber-500' },
                      { name: 'Alfamart_DC PEKANBARU', rankColor: 'bg-blue-100 text-blue-900 border border-blue-200' },
                      { name: 'TOKO CANTIK RIAU', rankColor: 'bg-purple-100 text-purple-900 border border-purple-200' },
                    ].map((store, idx) => {
                      const storeRecords = filteredRecords.filter((r) => r.NAMA_STORE.includes(store.name) || r.NAMA_STORE === store.name);
                      const storeVal = storeRecords.reduce((acc, curr) => acc + (curr.VALUE || 0), 0);
                      const storeQty = storeRecords.reduce((acc, curr) => acc + (curr.QTY || 0), 0);

                      return (
                        <div key={store.name} className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-md font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 ${store.rankColor}`}>
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-slate-900 truncate max-w-[130px] sm:max-w-[160px]">
                              {store.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-extrabold text-slate-900 block tabular-nums text-[11px]">
                              {formatRupiah(storeVal, true)}
                            </span>
                            <span className="text-[10px] text-amber-800 font-mono font-medium">
                              {storeQty} pcs
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Klasifikasi:</span>
                  <span className="font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-200 shadow-2xs text-[11px]">
                    🏆 Gerai Pilar Kelas A
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Link to Spreadsheet Raw Data */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Format Tabel Identik dengan Google Sheets
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tabel data mentah lengkap dengan 20 kolom (TANGGAL, BULAN, TAHUN, BA, SALES, SPV, BRAND, SKU, NAMA STORE, REGION, QTY, VALUE, KET).
                </p>
              </div>
              <button
                onClick={() => setActiveTab('table')}
                className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Buka Data Spreadsheet ({filteredRecords.length} Baris)
              </button>
            </div>
          </div>
        )}

        {/* Tab: Rangkuman Kuartal (Executive Summary Sales, BA & Trainer) */}
        {activeTab === 'rangkuman_kuartal' && (
          <QuarterlySummaryView
            records={records}
            filters={filters}
          />
        )}

        {/* Tab: Perbandingan (WoW, MoM, YoY) */}
        {activeTab === 'comparison' && (
          <ComparisonView
            records={filteredRecords}
            allRecords={records}
            filters={filters}
          />
        )}

        {/* Tab: Perbandingan Sell In vs Sell Out (Selisih Nilai & Deteksi >20%) */}
        {activeTab === 'sell_in_vs_sell_out' && (
          <SellInVsSellOutView
            records={records}
            filters={filters}
          />
        )}

        {/* Tab: Analisa Gap & Penyebab Penjualan Turun */}
        {activeTab === 'gap' && (
          <GapAnalysisView
            diagnosis={gapDiagnosis}
            filters={filters}
          />
        )}

        {/* Tab: Estimasi Cost Area (Gaji & Insentif Karyawan) */}
        {activeTab === 'cost' && (
          <CostAreaAnalysis
            records={filteredRecords}
            filters={filters}
          />
        )}

        {/* Tab: Profit Area (P&L, Margin 55%, Biaya 33% & Gaji) */}
        {activeTab === 'profit' && (
          <ProfitAreaAnalysis
            records={filteredRecords}
            allRecords={records}
            filters={filters}
          />
        )}

        {/* Tab: Daftar Tagihan Toko & Aging Piutang */}
        {activeTab === 'aging' && (
          <StoreAgingBills filters={filters} />
        )}

        {/* Tab: KPI Sales Scorecard (Balanced Scorecard 100 Poin) */}
        {activeTab === 'kpi' && (
          <KpiSalesScorecard filters={filters} />
        )}

        {/* Tab: KPI Trainer Scorecard (Balanced Scorecard 100 Poin) */}
        {activeTab === 'kpi_trainer' && (
          <KpiTrainerScorecard filters={filters} />
        )}

        {/* Tab: Review Weekly Sell Out BA (Cover Sales & Trainer) */}
        {activeTab === 'weekly_ba' && (
          <ReviewWeeklySellOutBa records={filteredRecords} filters={filters} />
        )}

        {/* Tab: Kontribusi Toko BA vs Non-BA */}
        {activeTab === 'kontribusi_toko_ba' && (
          <StoreBaContributionView
            records={records}
            filters={filters}
          />
        )}

        {/* Tab: Punishment BA (Denda Nihil Sell Out Harian Rp 25.000) */}
        {activeTab === 'punishment' && (
          <BaPunishmentView records={filteredRecords} filters={filters} />
        )}

        {/* Tab: Target & Pencapaian Produk Fokus BA (Insentif Rp 2.000 / Denda Rp 1.000) */}
        {activeTab === 'produk_fokus' && (
          <FocusProductBaManagement records={filteredRecords} filters={filters} />
        )}

        {/* Tab: Kelola Target Terpadu (Area, SPV, Sales & BA) */}
        {activeTab === 'target_mgmt' && (
          <TargetManagementView
            records={filteredRecords}
            filters={filters}
            onTargetUpdated={() => {
              showToast('Perubahan target berhasil disimpan dan disinkronkan!');
            }}
          />
        )}

        {/* Tab: Sales */}
        {activeTab === 'sales' && (
          <SalesAnalysis records={filteredRecords} />
        )}

        {/* Tab: SPV */}
        {activeTab === 'spv' && (
          <SpvAnalysis records={filteredRecords} />
        )}

        {/* Tab: Kategori */}
        {activeTab === 'category' && (
          <CategoryAnalysis
            records={filteredRecords}
            selectedCategory={filters.KATEGORI}
            onSelectCategory={(cat) => handleFilterChange('KATEGORI', cat)}
          />
        )}

        {/* Tab: Brand */}
        {activeTab === 'brand' && (
          <BrandAnalysis records={filteredRecords} />
        )}

        {/* Tab: Store */}
        {activeTab === 'store' && (
          <StoreAnalysis records={filteredRecords} />
        )}

        {/* Tab: SKU */}
        {activeTab === 'sku' && (
          <SkuAnalysis records={filteredRecords} />
        )}

        {/* Tab: Table */}
        {activeTab === 'table' && (
          <RawDataTable
            records={filteredRecords}
            filters={filters}
            summary={summary}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SalesPro Analytics</span>
            <span>·</span>
            <span>Platform Analisa Pencapaian Terintegrasi Google Sheets &amp; Apps Script</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="hover:text-slate-800 font-medium transition-colors"
            >
              Pengaturan Google Apps Script
            </button>
            <span>·</span>
            <button
              onClick={handleResetToSample}
              className="hover:text-slate-800 font-medium transition-colors"
            >
              Reset Data Contoh
            </button>
          </div>
        </div>
      </footer>

      {/* Google Apps Script Integration Modal */}
      <GasIntegrationModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        gasConfig={gasConfig}
        onUpdateGasConfig={setGasConfig}
        onDataLoaded={(data, source) => {
          setRecords(data);
          setGasConfig((prev) => ({
            ...prev,
            dataSourceType: source,
            status: source === 'google_sheet' ? 'connected' : 'idle',
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          }));
          showToast(`Berhasil memuat ${data.length} baris data transaksi!`);
        }}
        onResetToSample={handleResetToSample}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecord={handleAddRecord}
      />
    </div>
  );
}
