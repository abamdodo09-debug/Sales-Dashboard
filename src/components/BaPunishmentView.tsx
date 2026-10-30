import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  Download,
  Search,
  Sparkles,
  DollarSign,
  Store,
  Users,
  FileSpreadsheet,
  X,
  Clock,
  HelpCircle,
  FileText,
  Edit3,
  Coffee,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  BaNihilIncidentRecord,
  BaPunishmentSummaryItem,
  DashboardFilters,
  TransactionRecord,
} from '../types/dashboard';
import {
  loadBaIncidents,
  saveBaIncidents,
  calculateBaPunishmentSummary,
} from '../services/agingAndKpiService';
import { aggregateAreaCost } from '../utils/costCalculations';
import { formatRupiah, formatNumber } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface BaPunishmentViewProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
}

const STORAGE_KEY_BA_CUSTOM_SALARY = 'salespro_ba_custom_salary_v2';

export const BaPunishmentView: React.FC<BaPunishmentViewProps> = ({ records, filters }) => {
  const [incidents, setIncidents] = useState<BaNihilIncidentRecord[]>(() => loadBaIncidents());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tertib' | 'peringatan'>('all');

  // Custom Salary & Denda Overrides per BA (bisa diedit)
  const [customSalaryOverrides, setCustomSalaryOverrides] = useState<
    Record<string, { baseSalary?: number; customDendaTotal?: number; customTakeHomePay?: number }>
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_CUSTOM_SALARY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customSalaryOverrides from localStorage', e);
    }
    return {};
  });

  // Modal Edit Gaji & Denda BA
  const [editingBaSalary, setEditingBaSalary] = useState<BaPunishmentSummaryItem | null>(null);
  const [editBaseSalaryInput, setEditBaseSalaryInput] = useState<number>(3900000);
  const [editDendaInput, setEditDendaInput] = useState<number>(0);
  const [editTakeHomePayInput, setEditTakeHomePayInput] = useState<number>(3900000);

  // Modal Tambah Hari Nihil / Catat BA OFF
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState<'nihil' | 'off'>('nihil');
  const [newBaName, setNewBaName] = useState('SITI RAHMAH');
  const [newStoreName, setNewStoreName] = useState('TOKO ALANA BEAUTY');
  const [newBrand, setNewBrand] = useState('Y.O.U');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newReason, setNewReason] = useState('Tidak mengirimkan laporan sell out harian');
  const [newDendaNominal, setNewDendaNominal] = useState<number>(25000);

  // Modal History Detail BA
  const [selectedBaForHistory, setSelectedBaForHistory] = useState<BaPunishmentSummaryItem | null>(null);

  // Modal Berikan Dispensasi
  const [selectedIncidentForDispensation, setSelectedIncidentForDispensation] = useState<BaNihilIncidentRecord | null>(null);
  const [dispensationNoteInput, setDispensationNoteInput] = useState('');
  const [approverInput, setApproverInput] = useState('SPV WIDODO');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Extract base BA list from records & costData
  const costData = useMemo(() => aggregateAreaCost(records), [records]);

  // Merge incidents with base BA salary data & custom salary overrides
  const punishmentList = useMemo(() => {
    const baseList = costData.baList.map((b) => ({
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

    return calculateBaPunishmentSummary(incidents, baseList, customSalaryOverrides);
  }, [costData, incidents, customSalaryOverrides]);

  // Persist incidents
  const updateIncidents = (updated: BaNihilIncidentRecord[]) => {
    setIncidents(updated);
    saveBaIncidents(updated);
  };

  // Add new incident (Hari Nihil atau BA OFF / Libur)
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaName || !newDate) return;

    const matchedBa = costData.baList.find((b) => b.baName.toLowerCase() === newBaName.toLowerCase());
    const isOff = newIncidentType === 'off';

    const newRecord: BaNihilIncidentRecord = {
      id: `inc-${Date.now()}`,
      baName: newBaName,
      baNumber: matchedBa?.baNumber || 'BA-NEW',
      storeName: newStoreName || matchedBa?.storeName || 'Counter Toko',
      brand: newBrand,
      date: newDate,
      dendaNominal: isOff ? 0 : newDendaNominal, // BA off: denda = 0 (tidak dihitung!)
      reason: isOff
        ? (newReason || 'Jadwal Hari Libur / Off Resmi BA')
        : (newReason || 'Tidak mengirimkan laporan sell out harian'),
      isDispensation: false,
      isOffDay: isOff,
      offNote: isOff ? 'BA Off / Libur Resmi (Bebas Denda)' : undefined,
    };

    updateIncidents([newRecord, ...incidents]);
    setIsAddModalOpen(false);
    setNewReason('Tidak mengirimkan laporan sell out harian');
    showToast(isOff ? `Hari libur/off untuk ${newBaName} berhasil dicatat (Bebas Denda)!` : `Hari nihil untuk ${newBaName} berhasil dicatat!`);
  };

  // Open Edit Salary Modal
  const handleOpenEditSalary = (ba: BaPunishmentSummaryItem) => {
    setEditingBaSalary(ba);
    setEditBaseSalaryInput(ba.baseSalary);
    setEditDendaInput(ba.totalDendaNominal);
    setEditTakeHomePayInput(ba.totalTakeHomePay);
  };

  // Save Edit Salary
  const handleSaveSalaryOverride = () => {
    if (!editingBaSalary) return;
    const updated = {
      ...customSalaryOverrides,
      [editingBaSalary.baName]: {
        baseSalary: editBaseSalaryInput,
        customDendaTotal: editDendaInput,
        customTakeHomePay: editTakeHomePayInput,
      },
    };
    setCustomSalaryOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_CUSTOM_SALARY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingBaSalary(null);
    showToast(`Penyesuaian gaji & denda ${editingBaSalary.baName} berhasil disimpan!`);
  };

  // Reset Salary Override
  const handleResetSalaryOverride = (baName: string) => {
    const updated = { ...customSalaryOverrides };
    delete updated[baName];
    setCustomSalaryOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_CUSTOM_SALARY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingBaSalary(null);
    showToast(`Gaji & denda ${baName} dikembalikan ke perhitungan sistem otomatis.`);
  };

  // Toggle incident status (Set jadi OFF / Bebas Denda, atau Terapkan Denda)
  const handleToggleIncidentOff = (incidentId: string) => {
    const updated = incidents.map((inc) => {
      if (inc.id === incidentId) {
        const nextIsOff = !inc.isOffDay;
        return {
          ...inc,
          isOffDay: nextIsOff,
          dendaNominal: nextIsOff ? 0 : 25000,
          reason: nextIsOff ? 'Jadwal Hari Libur / Off Resmi BA' : inc.reason,
        };
      }
      return inc;
    });
    updateIncidents(updated);
    if (selectedBaForHistory) {
      const refreshedBa = punishmentList.find((b) => b.baName === selectedBaForHistory.baName);
      if (refreshedBa) setSelectedBaForHistory(refreshedBa);
    }
    showToast('Status hari kejadian berhasil diubah!');
  };

  // Delete incident
  const handleDeleteIncident = (incidentId: string) => {
    const updated = incidents.filter((inc) => inc.id !== incidentId);
    updateIncidents(updated);
    if (selectedBaForHistory) {
      const refreshedBa = punishmentList.find((b) => b.baName === selectedBaForHistory.baName);
      if (refreshedBa) setSelectedBaForHistory(refreshedBa);
    }
    showToast('Catatan kejadian berhasil dihapus!');
  };

  // Approve dispensation
  const handleApproveDispensation = () => {
    if (!selectedIncidentForDispensation) return;

    const updated = incidents.map((inc) => {
      if (inc.id === selectedIncidentForDispensation.id) {
        return {
          ...inc,
          isDispensation: true,
          dispensationNote: dispensationNoteInput || 'Dispensasi resmi disetujui SPV.',
          approvedBy: approverInput || 'SPV Operasional',
        };
      }
      return inc;
    });

    updateIncidents(updated);
    setSelectedIncidentForDispensation(null);
    setDispensationNoteInput('');
    showToast('Dispensasi bebas denda berhasil disetujui!');
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return punishmentList.filter((item) => {
      if (statusFilter === 'tertib' && item.totalNihilDays > 0) return false;
      if (statusFilter === 'peringatan' && item.totalNihilDays === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.baName.toLowerCase().includes(q) ||
          item.storeName.toLowerCase().includes(q) ||
          item.salesName.toLowerCase().includes(q) ||
          item.spvName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [punishmentList, statusFilter, searchQuery]);

  // Stats
  const punishmentStats = useMemo(() => {
    const totalBa = punishmentList.length;
    const disciplinedBa = punishmentList.filter((b) => b.totalNihilDays === 0).length;
    const totalNihilDays = punishmentList.reduce((acc, curr) => acc + curr.totalNihilDays, 0);
    const totalDendaNominal = punishmentList.reduce((acc, curr) => acc + curr.totalDendaNominal, 0);
    const spCount = punishmentList.filter((b) => b.disciplineBadge === 'peringatan_sp').length;

    return {
      totalBa,
      disciplinedBa,
      totalNihilDays,
      totalDendaNominal,
      spCount,
    };
  }, [punishmentList]);

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap Gaji & Denda BA
    const headers = [
      'No',
      'Nama BA',
      'No BA',
      'Nama Toko / Outlet',
      'Cover Area',
      'Region',
      'Sales',
      'SPV',
      'Hari Nihil Sell Out',
      'Total Potongan Denda (Rp 25.000/hari)',
      'Tingkat Kedisiplinan',
      'Realisasi Sell Out (Rp)',
      'Gaji Sebelum Denda (Rp)',
      'Gaji Bersih Diterima (THP Final)',
    ];

    const rows = filteredList.map((b, idx) => [
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
      b.disciplineBadge === 'tertib'
        ? 'Sangat Tertib'
        : b.disciplineBadge === 'peringatan_1'
        ? 'Peringatan 1 (Ringan)'
        : b.disciplineBadge === 'peringatan_2'
        ? 'Peringatan 2 (Sedang)'
        : 'Peringatan SP (Berat)',
      b.sellOutActual,
      b.baseSalary,
      b.totalTakeHomePay,
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekap Denda BA');

    // Sheet 2: Log History Insiden Nihil
    const logHeaders = [
      'No',
      'ID Insiden',
      'Nama BA',
      'No BA',
      'Counter Toko',
      'Brand',
      'Tanggal Kejadian',
      'Denda (Rp)',
      'Alasan / Keterangan',
      'Status Dispensasi',
      'Catatan Dispensasi',
      'Disetujui Oleh',
    ];

    const logRows = incidents.map((inc, idx) => [
      idx + 1,
      inc.id,
      inc.baName,
      inc.baNumber,
      inc.storeName,
      inc.brand,
      inc.date,
      inc.isDispensation ? 0 : inc.dendaNominal,
      inc.reason,
      inc.isDispensation ? 'BEBAS DENDA (DISPENSASI)' : 'DIKENAKAN DENDA',
      inc.dispensationNote || '-',
      inc.approvedBy || '-',
    ]);

    const wsLogs = XLSX.utils.aoa_to_sheet([logHeaders, ...logRows]);
    XLSX.utils.book_append_sheet(wb, wsLogs, 'Log Kejadian Nihil');

    XLSX.writeFile(wb, `SalesPro_Punishment_Denda_BA_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getDisciplineBadge = (badge: 'tertib' | 'peringatan_1' | 'peringatan_2' | 'peringatan_sp') => {
    if (badge === 'tertib') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Sangat Tertib (0 Hari)
        </span>
      );
    }
    if (badge === 'peringatan_1') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <Clock className="w-3 h-3 text-yellow-600" />
          Peringatan 1 (Ringan)
        </span>
      );
    }
    if (badge === 'peringatan_2') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          Peringatan 2 (Sedang)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        <ShieldAlert className="w-3 h-3 text-rose-600" />
        Peringatan SP (Berat)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Punishment Rule */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-rose-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                SOP KEDISIPLINAN BEAUTY ADVISOR
              </span>
              <span className="text-xs text-slate-400">Aturan Denda Resmi Perusahaan</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white">
              Punishment BA: Denda Nihil Sell Out Harian Rp 25.000 / Hari
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Setiap Beauty Advisor (BA) yang tidak membukukan laporan penjualan Sell Out harian pada hari kerja operasional dikenakan denda resmi Rp 25.000 / hari yang memotong gaji bersih secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Hari Nihil BA</span>
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

        {/* Formula Box */}
        <div className="mt-4 p-3 rounded-xl bg-black/40 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="text-rose-200">
            <strong>Formula Gaji Bersih BA:</strong> Gaji Bersih = Gaji Pokok &amp; Insentif - (Hari Nihil &times; Rp 25.000)
          </div>
          <div className="text-slate-400 text-[11px]">
            *Dispensasi bebas denda dapat diberikan SPV jika ada izin sakit bersurat dokter / toko renovasi.
          </div>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Personil BA</span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">{punishmentStats.totalBa} BA</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            {punishmentStats.disciplinedBa} BA disiplin (0 hari nihil)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Total Hari Nihil Sell Out</span>
          <div className="text-xl font-black font-mono text-rose-800 mt-1">
            {punishmentStats.totalNihilDays} Hari
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">
            Akumulasi kesalahan pelaporan
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Total Potongan Denda Area</span>
          <div className="text-xl font-black font-mono text-rose-900 mt-1">
            -{formatRupiah(punishmentStats.totalDendaNominal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Dipotong dari beban gaji area
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Status SP Berat (&ge; 5 Hari)</span>
          <div className="text-xl font-black font-mono text-amber-900 mt-1">
            {punishmentStats.spCount} BA
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
            Perlu evaluasi SPV &amp; pembinaan intensif
          </span>
        </div>
      </div>

      {/* Main Table: BA Punishment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              Daftar Evaluasi Kedisiplinan &amp; Gaji Bersih Beauty Advisor (BA)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Klik tombol "History" untuk memeriksa rincian tanggal kejadian, denda, dan dispensasi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="all">Semua BA</option>
              <option value="tertib">Sangat Tertib Saja</option>
              <option value="peringatan">Ada Hari Nihil Saja</option>
            </select>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama BA / toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nama BA</th>
                <th className="py-3 px-3">Counter Toko</th>
                <th className="py-3 px-3">Area &amp; SPV</th>
                <th className="py-3 px-3 text-center">Hari Nihil &amp; Off</th>
                <th className="py-3 px-3 text-center">Tingkat Disiplin</th>
                <th className="py-3 px-3 text-right">Gaji Pokok (Bisa Diedit)</th>
                <th className="py-3 px-3 text-right">Total Denda (Rp 25k/hr)</th>
                <th className="py-3 px-3 text-right">Realisasi Sell Out</th>
                <th className="py-3 px-3.5 text-right font-black text-slate-900 bg-slate-100">
                  Gaji Bersih Diterima
                </th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((ba, idx) => (
                <tr
                  key={ba.baName}
                  className={`hover:bg-slate-50 transition-colors ${
                    ba.disciplineBadge === 'peringatan_sp' ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      {ba.baName}
                      {ba.isManualSalaryEdited && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{ba.baNumber}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{ba.storeName}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800">{ba.coverArea}</div>
                    <div className="text-[11px] text-slate-500">SPV: {ba.spvName}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <div className="font-bold">
                      {ba.totalNihilDays > 0 ? (
                        <span className="text-rose-700">{ba.totalNihilDays} Hari Nihil</span>
                      ) : (
                        <span className="text-emerald-700">0 Nihil</span>
                      )}
                    </div>
                    {(ba.totalOffDays ?? 0) > 0 && (
                      <div className="text-[10px] font-semibold text-sky-700 bg-sky-50 rounded px-1.5 py-0.5 inline-block mt-0.5 border border-sky-200">
                        ☕ {ba.totalOffDays} Hari Off (Bebas Denda)
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">{getDisciplineBadge(ba.disciplineBadge)}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                    {formatRupiah(ba.baseSalary)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-800">
                    {ba.totalDendaNominal > 0 ? `-${formatRupiah(ba.totalDendaNominal)}` : 'Rp 0'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900">
                    {formatRupiah(ba.sellOutActual)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 bg-slate-100/60">
                    {formatRupiah(ba.totalTakeHomePay)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditSalary(ba)}
                        className="px-2 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer flex items-center gap-1"
                        title="Edit Gaji Pokok & Denda BA"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit Gaji
                      </button>
                      <button
                        onClick={() => setSelectedBaForHistory(ba)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                      >
                        History ({ba.incidents.length})
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: HISTORY INSIDEN BA */}
      {selectedBaForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Riwayat Insiden &amp; Jadwal: {selectedBaForHistory.baName}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedBaForHistory.storeName} &bull; {selectedBaForHistory.coverArea}
                </span>
              </div>
              <button
                onClick={() => setSelectedBaForHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto">
              {selectedBaForHistory.incidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada catatan hari nihil atau off. BA ini sangat disiplin!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedBaForHistory.incidents.map((inc, i) => (
                    <div
                      key={inc.id}
                      className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        inc.isOffDay
                          ? 'bg-sky-50/70 border-sky-200'
                          : inc.isDispensation
                          ? 'bg-teal-50/60 border-teal-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900">
                            #{i + 1} &bull; {inc.date}
                          </span>
                          {inc.isOffDay ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              BA OFF / LIBUR (Bebas Denda Rp 0)
                            </span>
                          ) : inc.isDispensation ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                              Dispensasi Bebas Denda
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 font-mono">
                              Denda Rp 25.000
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 mt-1 font-medium">{inc.reason}</p>
                        {inc.dispensationNote && (
                          <p className="text-[11px] text-teal-800 font-medium mt-0.5 italic">
                            Catatan SPV: {inc.dispensationNote} (oleh {inc.approvedBy})
                          </p>
                        )}
                        {inc.isOffDay && (
                          <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
                            *BA sedang libur/off resmi, denda otomatis ditiadakan (Rp 0).
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle OFF vs Denda */}
                        <button
                          onClick={() => handleToggleIncidentOff(inc.id)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg border cursor-pointer ${
                            inc.isOffDay
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                          }`}
                          title="Ubah status hari kejadian"
                        >
                          {inc.isOffDay ? 'Ubah Jadi Hari Nihil (Denda)' : 'Tandai BA Libur/OFF (Rp 0)'}
                        </button>

                        {!inc.isDispensation && !inc.isOffDay && (
                          <button
                            onClick={() => {
                              setSelectedIncidentForDispensation(inc);
                              setSelectedBaForHistory(null);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-teal-700 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg cursor-pointer"
                          >
                            Dispensasi
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteIncident(inc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer hover:bg-rose-50"
                          title="Hapus Catatan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => {
                  if (selectedBaForHistory) handleOpenEditSalary(selectedBaForHistory);
                  setSelectedBaForHistory(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Gaji Pokok &amp; Denda BA
              </button>
              <button
                onClick={() => setSelectedBaForHistory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CATAT HARI NIHIL / BA OFF BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" />
                Catat Hari Nihil / Jadwal Off BA
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 mt-4 text-xs">
              {/* Jenis Catatan: Nihil vs Off */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kehadiran / Hari</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewIncidentType('nihil');
                      setNewDendaNominal(25000);
                      setNewReason('Tidak mengirimkan laporan sell out harian');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newIncidentType === 'nihil'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">⚠️ Hari Nihil</div>
                    <div className="text-[10px] mt-0.5 text-rose-700">Denda Rp 25.000 / Hari</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewIncidentType('off');
                      setNewDendaNominal(0);
                      setNewReason('Jadwal Hari Libur / Off Resmi BA');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newIncidentType === 'off'
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">☕ BA Off / Libur</div>
                    <div className="text-[10px] mt-0.5 text-sky-700 font-semibold">Bebas Denda (Rp 0)</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Beauty Advisor (BA)</label>
                <select
                  value={newBaName}
                  onChange={(e) => {
                    setNewBaName(e.target.value);
                    const b = costData.baList.find((x) => x.baName === e.target.value);
                    if (b) {
                      setNewStoreName(b.storeName);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  {costData.baList.map((b) => (
                    <option key={b.baName} value={b.baName}>
                      {b.baName} ({b.storeName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Kejadian / Off</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Counter Toko</label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal Denda</label>
                <input
                  type="text"
                  disabled
                  value={newIncidentType === 'off' ? 'Rp 0 (BA Off / Libur Resmi)' : 'Rp 25.000 / Hari'}
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                    newIncidentType === 'off'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-slate-100 text-rose-800 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan / Keterangan</label>
                <textarea
                  rows={2}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 font-bold text-white rounded-xl shadow-xs ${
                    newIncidentType === 'off'
                      ? 'bg-sky-600 hover:bg-sky-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {newIncidentType === 'off' ? 'Simpan Hari Libur' : 'Simpan Hari Nihil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GAJI POKOK & DENDA BA */}
      {editingBaSalary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Edit Gaji &amp; Denda BA
              </h3>
              <button
                onClick={() => setEditingBaSalary(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-extrabold text-sm text-slate-900">{editingBaSalary.baName}</div>
              <div className="text-slate-500 text-[11px]">
                {editingBaSalary.storeName} &bull; {editingBaSalary.coverArea}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Gaji Pokok (Rp)</label>
                <input
                  type="number"
                  step="10000"
                  value={editBaseSalaryInput}
                  onChange={(e) => {
                    const base = Number(e.target.value);
                    setEditBaseSalaryInput(base);
                    setEditTakeHomePayInput(Math.max(0, base - editDendaInput));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Potongan Denda (Rp)</label>
                <input
                  type="number"
                  step="25000"
                  value={editDendaInput}
                  onChange={(e) => {
                    const denda = Number(e.target.value);
                    setEditDendaInput(denda);
                    setEditTakeHomePayInput(Math.max(0, editBaseSalaryInput - denda));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/50 font-mono font-bold text-rose-800"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  *Otomatis terhitung dari hari nihil (Rp 25.000/hari non-off/dispensasi), bisa disesuaikan manual di sini.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gaji Bersih Diterima (Take Home Pay)</label>
                <input
                  type="number"
                  value={editTakeHomePayInput}
                  onChange={(e) => setEditTakeHomePayInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/60 font-mono font-black text-emerald-900 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => handleResetSalaryOverride(editingBaSalary.baName)}
                className="px-3 py-2 font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBaSalary(null)}
                  className="px-3 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSalaryOverride}
                  className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERSETUJUAN DISPENSASI BA */}
      {selectedIncidentForDispensation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Persetujuan Dispensasi Resmi SPV
              </h3>
              <button
                onClick={() => setSelectedIncidentForDispensation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-700 space-y-3">
              <p>
                Bebaskan denda Rp 25.000 untuk BA{' '}
                <strong className="text-slate-900">{selectedIncidentForDispensation.baName}</strong> pada tanggal{' '}
                <strong className="font-mono text-slate-900">{selectedIncidentForDispensation.date}</strong>.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pejabat yang Memberi Dispensasi</label>
                <input
                  type="text"
                  value={approverInput}
                  onChange={(e) => setApproverInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Sah Dispensasi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Misal: Izin sakit bersurat dokter / Toko renovasi listrik padam..."
                  value={dispensationNoteInput}
                  onChange={(e) => setDispensationNoteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSelectedIncidentForDispensation(null)}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleApproveDispensation}
                className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs"
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

