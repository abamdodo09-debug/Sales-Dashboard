import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  PlusCircle,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Package,
  Layers,
  Store,
  Table as TableIcon,
  AlertTriangle,
  FileText,
  ChevronDown,
  Sparkles,
  Wallet,
  DollarSign,
  ShieldAlert,
  Award,
  AlertCircle,
  Target,
  Sliders,
  GraduationCap,
  ArrowLeftRight,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab, GasConfig, DashboardFilters } from '../types/dashboard';

export interface SubMenuItem {
  id: ActiveTab;
  label: string;
  shortLabel?: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface MainMenuCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeColor: string;
  subMenus: SubMenuItem[];
}

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  gasConfig: GasConfig;
  totalRecordsCount: number;
  filteredCount: number;
  onOpenGasModal: () => void;
  onOpenAddModal: () => void;
  onExportCsv: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onSyncGas: () => void;
  isSyncing: boolean;
  filters?: DashboardFilters;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  gasConfig,
  totalRecordsCount,
  filteredCount,
  onOpenGasModal,
  onOpenAddModal,
  onExportCsv,
  onExportExcel,
  onExportPdf,
  onSyncGas,
  isSyncing,
  filters,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Grouped Menu and Sub-Menu structure
  const menuCategories: MainMenuCategory[] = [
    {
      id: 'sales_analytics',
      label: 'Analisis Penjualan',
      icon: <BarChart3 className="w-4 h-4" />,
      activeColor: 'from-blue-600 via-indigo-600 to-teal-600',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      subMenus: [
        {
          id: 'overview',
          label: 'Ringkasan Eksekutif',
          shortLabel: 'Ringkasan',
          description: 'Dashboard performa omzet area & diagnosa cepat',
          icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
        },
        {
          id: 'comparison',
          label: 'Perbandingan Growth',
          shortLabel: 'Growth (MoM/YoY)',
          description: 'Tren pertumbuhan WoW, MoM & YoY per entitas',
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
        },
        {
          id: 'sell_in_vs_sell_out',
          label: 'Sell In vs Sell Out',
          shortLabel: 'Sell In / Out',
          description: 'Perbandingan selisih nilai omzet & alert gap > 20%',
          icon: <ArrowLeftRight className="w-4 h-4 text-cyan-600" />,
          badge: 'Selisih',
        },
        {
          id: 'gap',
          label: 'Analisa Gap Defisit',
          shortLabel: 'Gap Omzet',
          description: 'Diagnosa penyebab penurunan & de-stocking',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        },
        {
          id: 'kontribusi_toko_ba',
          label: 'Kontribusi Toko BA & Non-BA',
          shortLabel: 'Toko BA vs Non-BA',
          description: 'Bauran kontribusi omzet gerai ber-BA vs non-BA',
          icon: <Store className="w-4 h-4 text-pink-600" />,
          badge: 'Rasio',
        },
      ],
    },
    {
      id: 'ba_team',
      label: 'Tim BA & Outlet',
      icon: <Users className="w-4 h-4" />,
      activeColor: 'from-sky-600 via-blue-600 to-indigo-600',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      subMenus: [
        {
          id: 'weekly_ba',
          label: 'Review Weekly Sell Out BA',
          shortLabel: 'Weekly Sell Out BA',
          description: 'Laporan mingguan toko coveran Sales & grafik performa BA',
          icon: <FileSpreadsheet className="w-4 h-4 text-sky-600" />,
          badge: 'Template Gambar',
        },
        {
          id: 'produk_fokus',
          label: 'Produk Fokus BA',
          shortLabel: 'Produk Fokus',
          description: 'Target, realisasi insentif Rp 2.000 & denda Rp 1.000',
          icon: <Target className="w-4 h-4 text-teal-600" />,
        },
        {
          id: 'punishment',
          label: 'Punishment & Denda BA',
          shortLabel: 'Denda Nihil BA',
          description: 'Rekap denda harian Rp 25.000 nihil & pembebasan izin off',
          icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
        },
      ],
    },
    {
      id: 'kpi_performance',
      label: 'Kinerja & KPI',
      icon: <Award className="w-4 h-4" />,
      activeColor: 'from-purple-600 via-indigo-600 to-pink-600',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      subMenus: [
        {
          id: 'rangkuman_kuartal',
          label: 'Achieve Quartal',
          shortLabel: 'Achieve Quartal',
          description: 'Rangkuman lengkap kuartal Q1-Q4 Sales, BA & Trainer',
          icon: <Award className="w-4 h-4 text-purple-600" />,
          badge: 'Quartal',
        },
        {
          id: 'kpi',
          label: 'KPI Sales Scorecard',
          shortLabel: 'KPI Sales',
          description: 'Balanced Scorecard 100 poin (Omzet, Tagihan, Disiplin)',
          icon: <Award className="w-4 h-4 text-indigo-600" />,
        },
        {
          id: 'kpi_trainer',
          label: 'KPI Trainer Scorecard',
          shortLabel: 'KPI Trainer',
          description: 'Balanced Scorecard 100 poin Trainer & event training',
          icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
        },
      ],
    },
    {
      id: 'finance_cost',
      label: 'Keuangan & Tagihan',
      icon: <Wallet className="w-4 h-4" />,
      activeColor: 'from-emerald-600 via-teal-600 to-cyan-600',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      subMenus: [
        {
          id: 'cost',
          label: 'Estimasi Cost Area (Gaji)',
          shortLabel: 'Cost Area & Gaji',
          description: 'Perhitungan kompensasi gaji pokok & insentif karyawan',
          icon: <Wallet className="w-4 h-4 text-indigo-600" />,
        },
        {
          id: 'profit',
          label: 'Profit Area',
          shortLabel: 'Profit & Margin',
          description: 'P&L area, margin kotor 55%, rasio biaya 33% & laba bersih',
          icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
        },
        {
          id: 'aging',
          label: 'Daftar Tagihan Toko',
          shortLabel: 'Aging Piutang',
          description: 'Aging tagihan toko, jatuh tempo & tindakan penarikan stok',
          icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
        },
      ],
    },
    {
      id: 'master_dimensions',
      label: 'Master & Dimensi',
      icon: <Building2 className="w-4 h-4" />,
      activeColor: 'from-slate-700 via-slate-800 to-slate-900',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      subMenus: [
        {
          id: 'sales',
          label: 'Analisis Sales Area',
          shortLabel: 'Sales Area',
          description: 'Performa pencapaian & peringkat tim sales',
          icon: <Users className="w-4 h-4 text-indigo-600" />,
        },
        {
          id: 'spv',
          label: 'Analisis Supervisor (SPV)',
          shortLabel: 'Supervisor SPV',
          description: 'Pencapaian & pengawasan wilayah supervisor',
          icon: <Building2 className="w-4 h-4 text-purple-600" />,
        },
        {
          id: 'store',
          label: 'Analisis Toko & Gerai',
          shortLabel: 'Store / Toko',
          description: 'Peringkat omset, pareto kelas gerai ritel',
          icon: <Store className="w-4 h-4 text-amber-600" />,
        },
        {
          id: 'brand',
          label: 'Analisis Brand Kosmetik',
          shortLabel: 'Brand',
          description: 'Bauran penjualan Lavojoy, YOU, BNB, Dazzle Me, Glamfix',
          icon: <Sparkles className="w-4 h-4 text-pink-600" />,
        },
        {
          id: 'category',
          label: 'Analisis Kategori Produk',
          shortLabel: 'Kategori',
          description: 'Pangsa omzet Lip Makeup, Body Care, Sunscreen, dll',
          icon: <Layers className="w-4 h-4 text-fuchsia-600" />,
        },
        {
          id: 'sku',
          label: 'SKU & Produk',
          shortLabel: 'SKU Produk',
          description: 'Kinerja penjualan detail per SKU & produk',
          icon: <Package className="w-4 h-4 text-teal-600" />,
        },
        {
          id: 'target_mgmt',
          label: 'Kelola Target Terpadu',
          shortLabel: 'Kelola Target',
          description: 'Pengaturan target bulanan Area, SPV, Sales & BA',
          icon: <Sliders className="w-4 h-4 text-cyan-600" />,
        },
        {
          id: 'table',
          label: 'Data Mentah Transaksi',
          shortLabel: 'Data Mentah',
          description: 'Format tabel spreadsheet lengkap 20 kolom',
          icon: <TableIcon className="w-4 h-4 text-slate-700" />,
        },
      ],
    },
  ];

  // Determine which category the current activeTab belongs to
  const activeCategory = menuCategories.find((cat) =>
    cat.subMenus.some((sub) => sub.id === activeTab)
  ) || menuCategories[0];

  const currentSubMenu = activeCategory.subMenus.find((sub) => sub.id === activeTab) || activeCategory.subMenus[0];

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Bar Zone: Brand wordmark - Contextual info - Primary Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark with Colorful Gradient */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-teal-600/20">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-900 bg-clip-text text-transparent whitespace-nowrap">
                  SalesPro Analytics
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                  FMCG &amp; Beauty
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Dashboard Pencapaian Terintegrasi Google Sheets
              </p>
            </div>
          </div>

          {/* Zone 2: Google Sheets Status & Quick Sync */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenGasModal}
              title="Kelola koneksi Google Sheets & Apps Script"
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shadow-2xs ${
                gasConfig.status === 'connected'
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-800 hover:border-emerald-400'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${gasConfig.status === 'connected' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">
                {gasConfig.status === 'connected' ? 'Google Sheet Terhubung' : 'Sumber Data: Google Apps Script'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 font-bold tabular-nums shadow-2xs">
                {filteredCount} / {totalRecordsCount} baris
              </span>
            </button>

            {gasConfig.webAppUrl && (
              <button
                onClick={onSyncGas}
                disabled={isSyncing}
                title="Sinkronisasi Data Terbaru dari Google Sheet"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            )}

            {/* Export Dropdown Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pilihan Unduhan Laporan
                    </span>
                  </div>

                  {/* Excel Download Option */}
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportExcel && onExportExcel();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors group cursor-pointer"
                  >
                    <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block">Excel Spreadsheet (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Format spreadsheet rapi &amp; formula</span>
                    </div>
                  </button>

                  {/* PDF Download Option */}
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportPdf && onExportPdf();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition-colors group cursor-pointer"
                  >
                    <div className="p-1 rounded-md bg-rose-100 text-rose-700 group-hover:bg-rose-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block">PDF Report (.pdf)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Laporan Eksekutif Berwarna</span>
                    </div>
                  </button>

                  {/* CSV Download Option */}
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportCsv();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors group border-t border-slate-100 mt-1 cursor-pointer"
                  >
                    <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold block">CSV Spreadsheet (.csv)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Data mentah untuk spreadsheet</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Zone 3: Primary Action with Gradient */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:shadow-md whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LEVEL 1: MAIN MENU CATEGORIES (5 Clean Grouped Dropdowns) */}
        {/* ======================================================== */}
        <div ref={navContainerRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-100">
          {menuCategories.map((cat) => {
            const isCatActive = activeCategory.id === cat.id;
            const isDropdownOpen = openDropdownId === cat.id;

            return (
              <div key={cat.id} className="relative shrink-0">
                <button
                  onClick={() => {
                    if (openDropdownId === cat.id) {
                      setOpenDropdownId(null);
                    } else {
                      setOpenDropdownId(cat.id);
                      // If clicking another category, switch to its first sub-menu
                      if (!isCatActive) {
                        onTabChange(cat.subMenus[0].id);
                      }
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer select-none shadow-2xs ${
                    isCatActive
                      ? `bg-gradient-to-r ${cat.activeColor} text-white shadow-md ring-2 ring-indigo-200/80`
                      : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200/70'
                  }`}
                >
                  <span className={isCatActive ? 'text-white' : 'text-slate-600'}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isCatActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.subMenus.length}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    } ${isCatActive ? 'text-white' : 'text-slate-400'}`}
                  />
                </button>

                {/* DROPDOWN SUB-MENU PANEL */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Sub Menu {cat.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {cat.subMenus.length} Menu
                      </span>
                    </div>

                    <div className="py-1 max-h-96 overflow-y-auto divide-y divide-slate-50">
                      {cat.subMenus.map((sub) => {
                        const isSubActive = activeTab === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onTabChange(sub.id);
                              setOpenDropdownId(null);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                              isSubActive
                                ? 'bg-blue-50/80 text-blue-900 font-extrabold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                isSubActive
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}
                            >
                              {sub.icon}
                            </div>
                            <div className="grow min-w-0">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className={`text-xs ${isSubActive ? 'font-black text-blue-950' : 'font-bold'}`}>
                                  {sub.label}
                                </span>
                                {sub.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {sub.description}
                              </p>
                            </div>
                            {isSubActive && (
                              <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* LEVEL 2: ACTIVE CATEGORY SUB-MENU PILLS (Instant 1-Click) */}
        {/* ======================================================== */}
        <div className="py-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100/80 bg-slate-50/70 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              {activeCategory.label}:
            </span>
            {activeCategory.subMenus.map((sub) => {
              const isSubActive = activeTab === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => onTabChange(sub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                    isSubActive
                      ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className={isSubActive ? 'text-emerald-400' : 'text-slate-500'}>
                    {sub.icon}
                  </span>
                  <span>{sub.shortLabel || sub.label}</span>
                  {sub.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSubActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sync with Filter Terintegrasi Indicator Badge */}
          <div className="flex items-center gap-2 text-xs shrink-0 font-medium text-slate-600">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Sinkron Filter Terintegrasi</span>
              {filters && filters.BULAN !== 'ALL' && (
                <span className="bg-emerald-200/80 text-emerald-950 px-1.5 py-0.2 rounded font-mono font-black ml-1">
                  {filters.BULAN}
                </span>
              )}
              {filters && filters.SALES !== 'ALL' && (
                <span className="bg-emerald-200/80 text-emerald-950 px-1.5 py-0.2 rounded font-mono font-black ml-1">
                  {filters.SALES}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
