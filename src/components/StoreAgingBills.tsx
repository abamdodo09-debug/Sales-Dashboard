import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  Building2,
  Users,
  Store,
  DollarSign,
  X,
  Sparkles,
} from 'lucide-react';
import { StoreInvoiceBillItem, StoreViolationSummary, SalesSpvDendaSummary, DashboardFilters, AgingCategory } from '../types/dashboard';
import {
  loadStoreBills,
  saveStoreBills,
  calculateStoreViolations,
  calculateSalesSpvDenda,
  determineAgingCategoryAndAction,
} from '../services/agingAndKpiService';
import { formatRupiah, formatNumber } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface StoreAgingBillsProps {
  filters: DashboardFilters;
}

export const StoreAgingBills: React.FC<StoreAgingBillsProps> = ({ filters }) => {
  const [bills, setBills] = useState<StoreInvoiceBillItem[]>(() => loadStoreBills());
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'violations' | 'denda'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [agingFilter, setAgingFilter] = useState<string>('all');
  const [selectedMonthPeriod, setSelectedMonthPeriod] = useState<string>(() => {
    return filters.BULAN && filters.BULAN !== 'ALL' ? filters.BULAN.toUpperCase() : 'ALL';
  });
  const [violationStatusFilter, setViolationStatusFilter] = useState<'all' | 'customer_cash' | 'peringatan_spv' | 'perhatian' | 'aman'>('all');

  // Modal Tambah Faktur Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInvNumber, setNewInvNumber] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newCoverArea, setNewCoverArea] = useState('AREA BARU');
  const [newRegion, setNewRegion] = useState('PEKAN BARU');
  const [newSalesName, setNewSalesName] = useState('ILHAMSYAH');
  const [newSpvName, setNewSpvName] = useState('WIDODO');
  const [newSellInDate, setNewSellInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newAmount, setNewAmount] = useState<number>(10000000);
  const [newBrandCategory, setNewBrandCategory] = useState('Y.O.U Skincare');
  const [newNotes, setNewNotes] = useState('');

  // Modal Dispensasi Denda
  const [selectedBillForDispensation, setSelectedBillForDispensation] = useState<StoreInvoiceBillItem | null>(null);
  const [dispensationReasonInput, setDispensationReasonInput] = useState('');

  // Persist bills whenever updated
  const updateBills = (updated: StoreInvoiceBillItem[]) => {
    setBills(updated);
    saveStoreBills(updated);
  };

  // Toggle paid status
  const handleTogglePaid = (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = bills.map((b) => {
      if (b.id === id) {
        const nextPaid = !b.isPaid;
        return {
          ...b,
          isPaid: nextPaid,
          paymentDate: nextPaid ? today : undefined,
          actionRequired: nextPaid ? 'LUNAS' : determineAgingCategoryAndAction(b.agingDays).actionRequired,
        };
      }
      return b;
    });
    updateBills(updated);
  };

  // Update payment date manually
  const handleDateChange = (id: string, date: string) => {
    const updated = bills.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          paymentDate: date,
          isPaid: Boolean(date),
          actionRequired: date ? 'LUNAS' : determineAgingCategoryAndAction(b.agingDays).actionRequired,
        };
      }
      return b;
    });
    updateBills(updated);
  };

  // Add new invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newInvNumber || newAmount <= 0) return;

    const invoiceDate = new Date(newSellInDate);
    const dueDateObj = new Date(invoiceDate);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDateStr = dueDateObj.toISOString().slice(0, 10);

    const now = new Date();
    const days = Math.max(0, Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
    const { category, actionRequired } = determineAgingCategoryAndAction(days);

    const newBill: StoreInvoiceBillItem = {
      id: `inv-custom-${Date.now()}`,
      invoiceNumber: newInvNumber,
      storeName: newStoreName,
      coverArea: newCoverArea,
      region: newRegion,
      salesName: newSalesName,
      spvName: newSpvName,
      sellInDate: newSellInDate,
      dueDate: dueDateStr,
      isPaid: false,
      amount: newAmount,
      brandCategory: newBrandCategory,
      agingDays: days,
      agingCategory: category,
      actionRequired,
      notes: newNotes,
    };

    updateBills([newBill, ...bills]);
    setIsAddModalOpen(false);
    setNewInvNumber('');
    setNewStoreName('');
    setNewNotes('');
  };

  // Handle Dispensasi
  const handleSaveDispensation = () => {
    if (!selectedBillForDispensation) return;
    const updated = bills.map((b) => {
      if (b.id === selectedBillForDispensation.id) {
        return {
          ...b,
          dispensationGranted: true,
          dispensationReason: dispensationReasonInput || 'Dispensasi resmi disetujui SPV/Manajemen.',
        };
      }
      return b;
    });
    updateBills(updated);
    setSelectedBillForDispensation(null);
    setDispensationReasonInput('');
  };

  // Available month periods extracted dynamically from bills
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { key: string; label: string; count: number }>();

    // Initial default months
    monthsMap.set('OKTOBER', { key: 'OKTOBER', label: 'Oktober 2026', count: 0 });
    monthsMap.set('SEPTEMBER', { key: 'SEPTEMBER', label: 'September 2026', count: 0 });
    monthsMap.set('AGUSTUS', { key: 'AGUSTUS', label: 'Agustus 2026', count: 0 });

    bills.forEach((b) => {
      if (b.sellInDate) {
        const d = new Date(b.sellInDate);
        if (!isNaN(d.getTime())) {
          const monthKey = d.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
          const year = d.getFullYear();
          const label = `${d.toLocaleString('id-ID', { month: 'long' })} ${year}`;
          if (!monthsMap.has(monthKey)) {
            monthsMap.set(monthKey, { key: monthKey, label, count: 0 });
          }
          monthsMap.get(monthKey)!.count += 1;
        }
      }
    });

    return Array.from(monthsMap.values());
  }, [bills]);

  // Bills filtered by selected month period
  const periodBills = useMemo(() => {
    if (selectedMonthPeriod === 'ALL') return bills;
    return bills.filter((b) => {
      if (!b.sellInDate) return false;
      const d = new Date(b.sellInDate);
      if (isNaN(d.getTime())) return false;
      const billMonth = d.toLocaleString('id-ID', { month: 'long' }).toUpperCase();
      return billMonth === selectedMonthPeriod;
    });
  }, [bills, selectedMonthPeriod]);

  // Filtered bills for Invoices sub-tab
  const filteredBills = useMemo(() => {
    return periodBills.filter((b) => {
      // Status
      if (statusFilter === 'unpaid' && b.isPaid) return false;
      if (statusFilter === 'paid' && !b.isPaid) return false;

      // Aging
      if (agingFilter !== 'all' && b.agingCategory !== agingFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.invoiceNumber.toLowerCase().includes(q) ||
          b.storeName.toLowerCase().includes(q) ||
          b.salesName.toLowerCase().includes(q) ||
          b.spvName.toLowerCase().includes(q) ||
          b.region.toLowerCase().includes(q) ||
          b.coverArea.toLowerCase().includes(q) ||
          (b.brandCategory && b.brandCategory.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [periodBills, statusFilter, agingFilter, searchQuery]);

  // Violations list calculated from periodBills and filtered by status & search
  const storeViolations = useMemo(() => {
    let list = calculateStoreViolations(periodBills);
    if (violationStatusFilter !== 'all') {
      list = list.filter((v) => v.statusBadge === violationStatusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.storeName.toLowerCase().includes(q) ||
          v.salesName.toLowerCase().includes(q) ||
          v.spvName.toLowerCase().includes(q) ||
          v.coverArea.toLowerCase().includes(q) ||
          v.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [periodBills, violationStatusFilter, searchQuery]);

  // Denda calculation using selectedMonthPeriod
  const dendaResult = useMemo(() => {
    return calculateSalesSpvDenda(bills, selectedMonthPeriod);
  }, [bills, selectedMonthPeriod]);

  // Summary Metrics based on periodBills
  const summaryMetrics = useMemo(() => {
    const totalBills = periodBills.length;
    const unpaidBills = periodBills.filter((b) => !b.isPaid);
    const totalUnpaidNominal = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);
    const over60Count = unpaidBills.filter((b) => b.agingDays > 60).length;
    const over45Count = unpaidBills.filter((b) => b.agingDays >= 46 && b.agingDays <= 60).length;
    const over30Count = unpaidBills.filter((b) => b.agingDays >= 31 && b.agingDays <= 45).length;

    return {
      totalBills,
      unpaidCount: unpaidBills.length,
      paidCount: totalBills - unpaidBills.length,
      totalUnpaidNominal,
      over60Count,
      over45Count,
      over30Count,
    };
  }, [periodBills]);

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Semua Tagihan
    const headers = [
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
      'Nominal Tagihan (Rp)',
      'Status Bayar',
      'Tanggal Bayar',
      'Tindakan & Eskalasi',
      'Catatan',
    ];
    const rows = filteredBills.map((b, idx) => [
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
      b.notes || '-',
    ]);
    const wsInvoices = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Daftar Tagihan');

    // Sheet 2: Riwayat Pelanggaran Toko
    const violHeaders = [
      'No',
      'Nama Toko',
      'Area',
      'Region',
      'Sales Cover',
      'SPV',
      'Terlambat Up 30H',
      'Terlambat Up 35H',
      'Terlambat Up 45H',
      'Terlambat Up 60H',
      'Total Piutang Belum Lunas',
      'Aging Terlama (Hari)',
      'Status Toko',
    ];
    const violRows = storeViolations.map((v, idx) => [
      idx + 1,
      v.storeName,
      v.coverArea,
      v.region,
      v.salesName,
      v.spvName,
      v.up30Count,
      v.up35Count,
      v.up45Count,
      v.up60Count,
      v.totalUnpaidAmount,
      v.oldestAgingDays,
      v.statusBadge === 'customer_cash'
        ? 'Customer Cash (Blacklist)'
        : v.statusBadge === 'peringatan_spv'
        ? 'Peringatan SPV'
        : v.statusBadge === 'perhatian'
        ? 'Perhatian'
        : 'Aman',
    ]);
    const wsViolations = XLSX.utils.aoa_to_sheet([violHeaders, ...violRows]);
    XLSX.utils.book_append_sheet(wb, wsViolations, 'Riwayat Toko');

    // Sheet 3: Rekap Denda Sales & SPV
    const dendaSalesHeaders = [
      'Nama Sales',
      'Bulan Periode',
      'Toko > 60 Hari',
      'Denda Toko >60H (Rp 200k/toko)',
      'Faktur 45-59 Hari',
      'Nominal Faktur 45-59H',
      'Denda 0.2%',
      'Total Frekuensi Didenda',
      'Total Denda Sales (Rp)',
    ];
    const dendaSalesRows = dendaResult.salesDendaList.map((s) => [
      s.personName,
      s.monthPeriod,
      s.storesUp60Count,
      s.dendaToko60Nominal,
      s.invoices45to59Count,
      s.totalNominalSellIn45to59,
      s.dendaPercent45to59Nominal,
      s.totalFrequencyDenda,
      s.totalDendaNominal,
    ]);
    const wsDenda = XLSX.utils.aoa_to_sheet([dendaSalesHeaders, ...dendaSalesRows]);
    XLSX.utils.book_append_sheet(wb, wsDenda, 'Denda Sales');

    XLSX.writeFile(wb, `SalesPro_Daftar_Tagihan_Aging_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getAgingBadge = (category: AgingCategory, days: number, isPaid: boolean) => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Lunas ({days} Hari)
        </span>
      );
    }
    if (category === 'up_60') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-900 border border-red-400 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-red-600" />
          &gt; 60 Hari (Cash Only)
        </span>
      );
    }
    if (category === 'up_52') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          52-60 Hari (Tarik Barang)
        </span>
      );
    }
    if (category === 'up_45') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          45-51 Hari (SPV Kejar)
        </span>
      );
    }
    if (category === 'up_35') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          36-45 Hari (Order Blokir)
        </span>
      );
    }
    if (category === 'up_30') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-900 border border-yellow-300">
          <Clock className="w-3 h-3 text-yellow-600" />
          31-35 Hari (Follow-up)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        &le; 30 Hari (Berjalan)
      </span>
    );
  };

  const getStoreStatusBadge = (badge: 'aman' | 'perhatian' | 'peringatan_spv' | 'customer_cash') => {
    if (badge === 'customer_cash') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-400 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-red-600" />
          Customer Cash (Blacklist)
        </span>
      );
    }
    if (badge === 'peringatan_spv') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          Peringatan SPV
        </span>
      );
    }
    if (badge === 'perhatian') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <AlertCircle className="w-3 h-3 text-yellow-600" />
          Perhatian
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Aman
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Rules & Escalation Matrix */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                SOP PENGENDALIAN AR &amp; AGING PIUTANG
              </span>
              <span className="text-xs text-slate-400">Aturan Tindakan Bertingkat</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white">
              Daftar Tagihan Toko &amp; Kontrol Aging Piutang
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Monitoring hari jatuh tempo otomatis: Tindakan eskalasi bertingkat mulai dari follow-up sales (30H), blokir order (35H), kunjungan SPV (45H), tarik barang (52H), hingga pengalihan mutlak ke Customer Cash (&gt;60H).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Faktur</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* 5-Step Escalation Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-[10px] font-mono font-bold text-yellow-400 block">TAHAP 1 (30 Hari)</span>
            <div className="font-extrabold text-white text-xs mt-0.5">Follow-Up Sales</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sudah jatuh tempo, sales tagih &amp; janji bayar</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-mono font-bold text-amber-400 block">TAHAP 2 (35 Hari)</span>
            <div className="font-extrabold text-white text-xs mt-0.5">Order Baru Diblokir</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Tidak bisa melakukan pengorderan</p>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <span className="text-[10px] font-mono font-bold text-orange-400 block">TAHAP 3 (45 Hari)</span>
            <div className="font-extrabold text-white text-xs mt-0.5">SPV Kejar ke Toko</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Kunjungan langsung supervisor ke owner</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] font-mono font-bold text-rose-400 block">TAHAP 4 (52 Hari)</span>
            <div className="font-extrabold text-white text-xs mt-0.5">Tarik Barang Fisik</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sales/SPV wajib penarikan aset produk</p>
          </div>
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono font-bold text-red-400 block">TAHAP 5 (&gt; 60 Hari)</span>
            <div className="font-extrabold text-white text-xs mt-0.5">Jadi Customer Cash</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Wajib COD tunai + Denda Sales &amp; SPV</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Piutang Belum Lunas</span>
          <div className="text-lg font-black font-mono text-slate-900 mt-1">
            {formatRupiah(summaryMetrics.totalUnpaidNominal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {summaryMetrics.unpaidCount} faktur aktif dari {summaryMetrics.totalBills} total faktur
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs bg-red-50/30">
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Toko Kritis (&gt; 60 Hari)</span>
          <div className="text-lg font-black font-mono text-red-700 mt-1">
            {summaryMetrics.over60Count} Faktur
          </div>
          <span className="text-[11px] text-red-600 font-semibold mt-0.5 block">
            Wajib Cash &amp; Denda Sales Rp 200k / SPV Rp 300k
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/30">
          <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">Eskalasi SPV (45 - 60 Hari)</span>
          <div className="text-lg font-black font-mono text-orange-800 mt-1">
            {summaryMetrics.over45Count} Faktur
          </div>
          <span className="text-[11px] text-orange-700 font-semibold mt-0.5 block">
            Denda 0.2% faktur &amp; SPV wajib kejar toko
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Faktur Berhasil Lunas</span>
          <div className="text-lg font-black font-mono text-emerald-800 mt-1">
            {summaryMetrics.paidCount} Faktur
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Tersimpan di LocalStorage
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'invoices'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Semua Faktur Tagihan ({filteredBills.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('violations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'violations'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Riwayat Pelanggaran Toko ({storeViolations.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('denda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'denda'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Denda Tagihan Sales &amp; SPV</span>
          </button>
        </div>

        {/* Filters and search for Invoices */}
        {activeSubTab === 'invoices' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Bulan Periode */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs font-bold text-indigo-900 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Bulan:</span>
              <select
                value={selectedMonthPeriod}
                onChange={(e) => setSelectedMonthPeriod(e.target.value)}
                className="bg-transparent font-black text-indigo-950 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.count} Faktur)
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="unpaid">Belum Lunas Saja</option>
              <option value="paid">Sudah Lunas Saja</option>
            </select>

            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">Semua Rentang Aging</option>
              <option value="current">&le; 30 Hari (Berjalan)</option>
              <option value="up_30">31 - 35 Hari (Follow Up)</option>
              <option value="up_35">36 - 45 Hari (Order Blokir)</option>
              <option value="up_45">46 - 51 Hari (SPV Kejar)</option>
              <option value="up_52">52 - 60 Hari (Tarik Barang)</option>
              <option value="up_60">&gt; 60 Hari (Customer Cash)</option>
            </select>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari faktur / toko / sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            {selectedMonthPeriod !== 'ALL' && (
              <button
                onClick={() => setSelectedMonthPeriod('ALL')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Reset Filter Bulan ke Semua"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUBTAB 1: SEMUA FAKTUR TAGIHAN */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Daftar Faktur Tagihan Sell In &amp; Kontrol Aging Piutang
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tanggal pelunasan dan toggle status lunas tersimpan otomatis di LocalStorage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600">
                Menampilkan {filteredBills.length} Faktur
              </span>
              {selectedMonthPeriod !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Periode: {selectedMonthPeriod}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">No Faktur</th>
                  <th className="py-3 px-3">Nama Toko</th>
                  <th className="py-3 px-3">Sales &amp; SPV</th>
                  <th className="py-3 px-3">Tgl Sell In</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-center">Hari Aging</th>
                  <th className="py-3 px-3 text-right">Nominal Tagihan</th>
                  <th className="py-3 px-3 text-center">Tindakan &amp; Eskalasi</th>
                  <th className="py-3 px-3 text-center">Status Lunas</th>
                  <th className="py-3 px-3 text-center">Tanggal Bayar</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada faktur yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b, idx) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !b.isPaid && b.agingDays > 60 ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{b.storeName}</div>
                        <div className="text-[11px] text-slate-400">
                          {b.coverArea} ({b.region})
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{b.salesName}</div>
                        <div className="text-[11px] text-slate-500">SPV: {b.spvName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{b.sellInDate}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{b.dueDate}</td>
                      <td className="py-3 px-3 text-center">
                        {getAgingBadge(b.agingCategory, b.agingDays, b.isPaid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(b.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-semibold text-slate-800 max-w-[220px]">
                          {b.actionRequired}
                        </div>
                        {b.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-[220px]">
                            {b.notes}
                          </div>
                        )}
                        {b.dispensationGranted && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            Dispensasi Resmi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleTogglePaid(b.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                            b.isPaid
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {b.isPaid ? 'LUNAS' : 'BELUM'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="date"
                          value={b.paymentDate || ''}
                          onChange={(e) => handleDateChange(b.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        {!b.isPaid && b.agingDays >= 45 && !b.dispensationGranted && (
                          <button
                            onClick={() => setSelectedBillForDispensation(b)}
                            className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 cursor-pointer"
                          >
                            Dispensasi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: RIWAYAT PELANGGARAN TOKO */}
      {activeSubTab === 'violations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-rose-600" />
                History Keterlambatan Toko &amp; Status Blacklist
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rekap akumulasi berapa kali toko melanggar batas waktu pembayaran (Up 30, 35, 45, dan 60 Hari)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600">
                Menampilkan {storeViolations.length} Toko
              </span>
              {selectedMonthPeriod !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Periode: {selectedMonthPeriod}
                </span>
              )}
            </div>
          </div>

          {/* Filter Bar for History Pelanggaran Toko */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              {/* Bulan Periode Selector */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 font-bold text-xs text-rose-900 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Bulan Periode:</span>
                <select
                  value={selectedMonthPeriod}
                  onChange={(e) => setSelectedMonthPeriod(e.target.value)}
                  className="bg-transparent font-black text-rose-950 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Semua Bulan Periode</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.count} Faktur)
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Badge Filter */}
              <select
                value={violationStatusFilter}
                onChange={(e) => setViolationStatusFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status Toko</option>
                <option value="customer_cash">Blacklist (Customer Cash)</option>
                <option value="peringatan_spv">Peringatan SPV (Up 45H)</option>
                <option value="perhatian">Perhatian (Up 30H-35H)</option>
                <option value="aman">Status Aman</option>
              </select>

              {selectedMonthPeriod !== 'ALL' && (
                <button
                  onClick={() => setSelectedMonthPeriod('ALL')}
                  className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Reset Filter Bulan ke Semua"
                >
                  <span>Reset Bulan</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari toko / sales / area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Toko</th>
                  <th className="py-3 px-3">Area &amp; Region</th>
                  <th className="py-3 px-3">Sales Person</th>
                  <th className="py-3 px-3">SPV</th>
                  <th className="py-3 px-2 text-center text-yellow-800 bg-yellow-50/50">Up 30H</th>
                  <th className="py-3 px-2 text-center text-amber-800 bg-amber-50/50">Up 35H</th>
                  <th className="py-3 px-2 text-center text-orange-800 bg-orange-50/50">Up 45H</th>
                  <th className="py-3 px-2 text-center text-red-800 bg-red-50/50">Up 60H</th>
                  <th className="py-3 px-3 text-right">Sisa Piutang Belum Lunas</th>
                  <th className="py-3 px-3 text-center">Aging Terlama</th>
                  <th className="py-3 px-3 text-center">Badge Status Toko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeViolations.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-400 font-medium">
                      Tidak ada riwayat pelanggaran toko pada periode atau filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  storeViolations.map((v, idx) => (
                  <tr key={v.storeName} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">{v.storeName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {v.coverArea} ({v.region})
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{v.salesName}</td>
                    <td className="py-3 px-3 text-slate-600">{v.spvName}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-yellow-800 bg-yellow-50/30">
                      {v.up30Count}x
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-amber-800 bg-amber-50/30">
                      {v.up35Count}x
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-orange-800 bg-orange-50/30">
                      {v.up45Count}x
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-red-800 bg-red-50/30">
                      {v.up60Count}x
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatRupiah(v.totalUnpaidAmount)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {v.oldestAgingDays > 0 ? `${v.oldestAgingDays} Hari` : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStoreStatusBadge(v.statusBadge)}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DENDA TAGIHAN SALES & SPV */}
      {activeSubTab === 'denda' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  SOP &amp; Rekapitulasi Denda Tagihan Piutang (Sales &amp; SPV)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Aturan Resmi: Sales denda Rp 200.000 (Toko &gt;60H) &amp; 0.2% faktur (45-59H). SPV denda Rp 300.000 (Toko &gt;60H).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Bulan Periode:</span>
                <select
                  value={selectedMonthPeriod}
                  onChange={(e) => setSelectedMonthPeriod(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold cursor-pointer"
                >
                  <option value="ALL">Semua Bulan</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.count} Faktur)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Denda Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Total Akumulasi Denda Sales Area
                </span>
                <div className="text-xl font-black font-mono text-amber-950 mt-1">
                  {formatRupiah(dendaResult.totalDendaSalesArea)}
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Mencakup denda toko macet &gt; 60 hari dan penalti 0.2% faktur 45-59 hari
                </p>
              </div>

              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200">
                <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                  Total Akumulasi Denda Supervisor (SPV) Area
                </span>
                <div className="text-xl font-black font-mono text-orange-950 mt-1">
                  {formatRupiah(dendaResult.totalDendaSpvArea)}
                </div>
                <p className="text-[11px] text-orange-700 mt-1">
                  Tanggung jawab pengawasan: Rp 300.000 per gerai yang lolos &gt; 60 hari
                </p>
              </div>
            </div>

            {/* Table Denda Sales */}
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-6 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Rekapitulasi Denda Personil Sales
            </h4>
            <div className="overflow-x-auto mt-2 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-3 px-3">Nama Sales</th>
                    <th className="py-3 px-3">Bulan Periode</th>
                    <th className="py-3 px-3 text-center">Toko &gt; 60 Hari</th>
                    <th className="py-3 px-3 text-right">Denda Toko &gt;60H (Rp 200k/tk)</th>
                    <th className="py-3 px-3 text-center">Faktur 45-59H</th>
                    <th className="py-3 px-3 text-right">Nominal Faktur 45-59H</th>
                    <th className="py-3 px-3 text-right">Denda 0.2%</th>
                    <th className="py-3 px-3 text-center">Frekuensi Denda</th>
                    <th className="py-3 px-3 text-right font-black text-rose-900 bg-rose-50/50">
                      Total Denda Sales (IDR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dendaResult.salesDendaList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400 font-medium">
                        Tidak ada denda sales tercatat pada periode ini (Semua tagihan tertib).
                      </td>
                    </tr>
                  ) : (
                    dendaResult.salesDendaList.map((s) => (
                      <tr key={s.personName} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-extrabold text-slate-900">{s.personName}</td>
                        <td className="py-3 px-3 text-slate-600">{s.monthPeriod}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-red-700">
                          {s.storesUp60Count} Toko
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-red-800">
                          {formatRupiah(s.dendaToko60Nominal)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-orange-700">
                          {s.invoices45to59Count} Faktur
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(s.totalNominalSellIn45to59)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-orange-800">
                          {formatRupiah(s.dendaPercent45to59Nominal)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {s.totalFrequencyDenda}x
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-900 bg-rose-50/30">
                          {formatRupiah(s.totalDendaNominal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Denda SPV */}
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-6 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Rekapitulasi Denda Supervisor (SPV)
            </h4>
            <div className="overflow-x-auto mt-2 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-3 px-3">Nama Supervisor (SPV)</th>
                    <th className="py-3 px-3">Bulan Periode</th>
                    <th className="py-3 px-3 text-center">Jumlah Toko &gt; 60 Hari</th>
                    <th className="py-3 px-3 text-center">Frekuensi Denda</th>
                    <th className="py-3 px-3 text-right font-black text-rose-900 bg-rose-50/50">
                      Total Akumulasi Denda SPV (Rp 300.000 / Toko)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dendaResult.spvDendaList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                        Tidak ada denda supervisor pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    dendaResult.spvDendaList.map((spv) => (
                      <tr key={spv.personName} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-extrabold text-slate-900">{spv.personName}</td>
                        <td className="py-3 px-3 text-slate-600">{spv.monthPeriod}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-red-700">
                          {spv.storesUp60Count} Toko
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {spv.totalFrequencyDenda}x
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-900 bg-rose-50/30">
                          {formatRupiah(spv.totalDendaNominal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH FAKTUR BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Faktur Tagihan Toko Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Faktur / Invoice</label>
                  <input
                    type="text"
                    required
                    placeholder="INV/2026/10/XXXX"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Toko / Outlet</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Toko..."
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Sales</label>
                  <input
                    type="text"
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama SPV</label>
                  <input
                    type="text"
                    value={newSpvName}
                    onChange={(e) => setNewSpvName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Faktur Sell In</label>
                  <input
                    type="date"
                    required
                    value={newSellInDate}
                    onChange={(e) => setNewSellInDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nominal Tagihan (IDR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori / Brand</label>
                <input
                  type="text"
                  placeholder="Misal: Y.O.U & lavojoy"
                  value={newBrandCategory}
                  onChange={(e) => setNewBrandCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan janji bayar / follow up..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  Simpan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPENSASI DENDA */}
      {selectedBillForDispensation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Persetujuan Dispensasi Denda
              </h3>
              <button
                onClick={() => setSelectedBillForDispensation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-700 space-y-2">
              <p>
                Berikan dispensasi (pembebasan denda penalti) untuk faktur{' '}
                <strong className="text-slate-900">{selectedBillForDispensation.invoiceNumber}</strong> (
                {selectedBillForDispensation.storeName}).
              </p>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 font-mono text-[11px]">
                <div>Nominal: {formatRupiah(selectedBillForDispensation.amount)}</div>
                <div>Aging: {selectedBillForDispensation.agingDays} Hari ({selectedBillForDispensation.agingCategory})</div>
                <div>Sales: {selectedBillForDispensation.salesName} | SPV: {selectedBillForDispensation.spvName}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Alasan Resmi Dispensasi (Misal: Toko Menyerahkan Bilyet Giro / Komitmen Tertulis):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan alasan dispensasi resmi..."
                  value={dispensationReasonInput}
                  onChange={(e) => setDispensationReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSelectedBillForDispensation(null)}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDispensation}
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Setujui Bebas Denda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
