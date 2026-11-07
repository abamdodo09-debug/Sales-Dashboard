import React, { useState, useMemo } from 'react';
import {
  Store,
  Users,
  Building2,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Download,
  Search,
  Filter,
  CheckCircle2,
  X,
  Save,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
  MapPin,
  CheckSquare,
  Square,
  ArrowUpDown,
} from 'lucide-react';
import { TransactionRecord } from '../types/dashboard';
import {
  MasterStoreItem,
  loadMasterStoreList,
  saveMasterStoreList,
  resetMasterStoreListToSheet,
  detectStoreChannel,
} from '../services/masterStoreService';
import { VALID_KPI_SALES_NAMES, SALES_MASTER_6_CONFIG } from '../services/kpiSalesData';
import { OFFICIAL_SPV_WIDODO } from '../services/spvSellInSellOutService';
import * as XLSX from 'xlsx';

interface MasterStoreBaSettingsProps {
  records: TransactionRecord[];
  onDataUpdated?: () => void;
}

export const MasterStoreBaSettings: React.FC<MasterStoreBaSettingsProps> = ({
  records,
  onDataUpdated,
}) => {
  const [stores, setStores] = useState<MasterStoreItem[]>(() => loadMasterStoreList(records));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ba' | 'non_ba'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'KA' | 'MG'>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'sales_matrix' | 'trainer_matrix' | 'spv_view'>('table');

  // Selected Store IDs for Batch Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchSales, setBatchSales] = useState<string>('ALBERT FERNANDO');
  const [batchTrainer, setBatchTrainer] = useState<string>('ARA');

  // Modal State
  const [editingStore, setEditingStore] = useState<MasterStoreItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add New Store
  const [newStoreName, setNewStoreName] = useState('');
  const [newHasBa, setNewHasBa] = useState(true);
  const [newBaName, setNewBaName] = useState('');
  const [newBaNumber, setNewBaNumber] = useState('');
  const [newSalesName, setNewSalesName] = useState('ALBERT FERNANDO');
  const [newTrainerName, setNewTrainerName] = useState('ARA');
  const [newCoverArea, setNewCoverArea] = useState('PEKANBARU');
  const [newRegion, setNewRegion] = useState('PEKANBARU');
  const [newSpvName, setNewSpvName] = useState('WIDODO');
  const [newChannel, setNewChannel] = useState<'KA' | 'MG'>('MG');
  const [newNotes, setNewNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct Trainers
  const distinctTrainers = useMemo(() => {
    const set = new Set<string>(['ARA', 'RATIH', 'ARA & RATIH']);
    stores.forEach((s) => {
      if (s.trainerName) set.add(s.trainerName);
    });
    return Array.from(set).sort();
  }, [stores]);

  // Distinct Sales
  const allSalesList = useMemo(() => {
    const set = new Set<string>(VALID_KPI_SALES_NAMES);
    stores.forEach((s) => {
      if (s.salesName && s.salesName !== '-') set.add(s.salesName);
    });
    return Array.from(set);
  }, [stores]);

  // Filtered Stores List
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (statusFilter === 'ba' && !s.hasBa) return false;
      if (statusFilter === 'non_ba' && s.hasBa) return false;

      if (channelFilter !== 'all' && s.channel !== channelFilter) return false;

      if (salesFilter !== 'all' && s.salesName.toUpperCase() !== salesFilter.toUpperCase()) {
        return false;
      }

      if (trainerFilter !== 'all' && s.trainerName.toUpperCase() !== trainerFilter.toUpperCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          s.storeName.toLowerCase().includes(q) ||
          s.baName.toLowerCase().includes(q) ||
          s.salesName.toLowerCase().includes(q) ||
          s.trainerName.toLowerCase().includes(q) ||
          s.coverArea.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          (s.baNumber && s.baNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [stores, statusFilter, channelFilter, salesFilter, trainerFilter, searchQuery]);

  // Summary counts
  const totalStores = stores.length;
  const totalBaStores = stores.filter((s) => s.hasBa).length;
  const totalNonBaStores = stores.filter((s) => !s.hasBa).length;
  const totalKaStores = stores.filter((s) => s.channel === 'KA').length;
  const totalMgStores = stores.filter((s) => s.channel === 'MG').length;

  // Toggle quick BA status
  const handleToggleBaStatus = (id: string) => {
    const updated = stores.map((s) => {
      if (s.id === id) {
        const nextHasBa = !s.hasBa;
        return {
          ...s,
          hasBa: nextHasBa,
          baName: nextHasBa
            ? (s.baName && s.baName !== '- (Non-BA)' ? s.baName : `BA ${s.storeName.split(' ')[0]}`)
            : '- (Non-BA)',
        };
      }
      return s;
    });
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast('Status toko & BA berhasil diperbarui!');
  };

  // Quick Inline Change Sales
  const handleQuickChangeSales = (storeId: string, newSales: string) => {
    const updated = stores.map((s) => (s.id === storeId ? { ...s, salesName: newSales } : s));
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`Coverage toko berhasil dialihkan ke Sales: ${newSales}`);
  };

  // Quick Inline Change Trainer
  const handleQuickChangeTrainer = (storeId: string, newTrainer: string) => {
    const updated = stores.map((s) => (s.id === storeId ? { ...s, trainerName: newTrainer } : s));
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`Coverage toko berhasil dialihkan ke Trainer: ${newTrainer}`);
  };

  // Quick Inline Change Channel (KA / MG)
  const handleQuickChangeChannel = (storeId: string, newChannel: 'KA' | 'MG') => {
    const updated = stores.map((s) => (s.id === storeId ? { ...s, channel: newChannel } : s));
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`Kanal toko berhasil diubah ke: ${newChannel}`);
  };

  // Batch Select Handlers
  const toggleSelectStore = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === filteredStores.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStores.map((s) => s.id));
    }
  };

  const handleApplyBatchSales = () => {
    if (selectedIds.length === 0) return;
    const updated = stores.map((s) =>
      selectedIds.includes(s.id) ? { ...s, salesName: batchSales } : s
    );
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`${selectedIds.length} toko berhasil dipindahkan ke Sales ${batchSales}!`);
    setSelectedIds([]);
  };

  const handleApplyBatchTrainer = () => {
    if (selectedIds.length === 0) return;
    const updated = stores.map((s) =>
      selectedIds.includes(s.id) ? { ...s, trainerName: batchTrainer } : s
    );
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`${selectedIds.length} toko berhasil dialihkan ke Trainer ${batchTrainer}!`);
    setSelectedIds([]);
  };

  const handleApplyBatchBaStatus = (hasBa: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = stores.map((s) =>
      selectedIds.includes(s.id)
        ? {
            ...s,
            hasBa,
            baName: hasBa
              ? s.baName && s.baName !== '- (Non-BA)'
                ? s.baName
                : `BA ${s.storeName.split(' ')[0]}`
              : '- (Non-BA)',
          }
        : s
    );
    setStores(updated);
    saveMasterStoreList(updated);
    if (onDataUpdated) onDataUpdated();
    showToast(`${selectedIds.length} toko diubah statusnya menjadi ${hasBa ? 'Toko BA' : 'Non-BA'}!`);
    setSelectedIds([]);
  };

  // Open edit modal
  const handleOpenEdit = (store: MasterStoreItem) => {
    setEditingStore({ ...store });
  };

  // Save edited store
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    const updated = stores.map((s) => (s.id === editingStore.id ? editingStore : s));
    setStores(updated);
    saveMasterStoreList(updated);
    setEditingStore(null);
    if (onDataUpdated) onDataUpdated();
    showToast(`Data toko "${editingStore.storeName}" berhasil disimpan ke sistem!`);
  };

  // Delete store
  const handleDeleteStore = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus toko "${name}" dari master data? Semua penugasan toko ini akan dihapus.`)) {
      const updated = stores.filter((s) => s.id !== id);
      setStores(updated);
      saveMasterStoreList(updated);
      if (onDataUpdated) onDataUpdated();
      showToast(`Toko "${name}" berhasil dihapus dari master data.`);
    }
  };

  // Reset to Sheet data
  const handleResetToSheet = () => {
    if (
      window.confirm(
        'Reset semua master toko dan BA kembali mengikuti data transaksi Google Sheet asli? Perubahan manual akan ditimpa.'
      )
    ) {
      const fresh = resetMasterStoreListToSheet(records);
      setStores(fresh);
      if (onDataUpdated) onDataUpdated();
      showToast('Master data berhasil di-reset sesuai data Google Sheet!');
    }
  };

  // Save new store manual
  const handleSaveNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newStore: MasterStoreItem = {
      id: `store-manual-${Date.now()}`,
      storeName: newStoreName.trim().toUpperCase(),
      hasBa: newHasBa,
      baName: newHasBa ? (newBaName.trim() || `BA ${newStoreName.trim().split(' ')[0]}`) : '- (Non-BA)',
      baNumber: newHasBa ? (newBaNumber.trim() || undefined) : undefined,
      salesName: newSalesName,
      trainerName: newTrainerName,
      coverArea: newCoverArea.trim().toUpperCase(),
      region: newRegion.trim().toUpperCase(),
      spvName: newSpvName.trim().toUpperCase() || 'WIDODO',
      channel: newChannel,
      isCustom: true,
      notes: newNotes.trim(),
    };

    const updated = [newStore, ...stores];
    setStores(updated);
    saveMasterStoreList(updated);
    setIsAddModalOpen(false);

    // Reset Form
    setNewStoreName('');
    setNewBaName('');
    setNewBaNumber('');
    setNewNotes('');

    if (onDataUpdated) onDataUpdated();
    showToast(`Toko baru "${newStore.storeName}" berhasil ditambahkan & tersinkron!`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      'No',
      'Nama Toko',
      'Status Toko',
      'Nama BA',
      'Nomor BA',
      'Nama Sales Rep',
      'Nama Trainer',
      'Cover Area',
      'Region',
      'Supervisor (SPV)',
      'Kanal (Channel)',
      'Keterangan',
    ];

    const rows = filteredStores.map((s, idx) => [
      idx + 1,
      s.storeName,
      s.hasBa ? 'Toko dengan BA' : 'Toko Non-BA',
      s.baName,
      s.baNumber || '-',
      s.salesName,
      s.trainerName,
      s.coverArea,
      s.region,
      s.spvName,
      s.channel === 'KA' ? 'KA (Key Account / Modern)' : 'MG (Market Group / General)',
      s.notes || '-',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Master Toko & Coverage');
    XLSX.writeFile(wb, `Master_Data_Toko_Sales_BA_Trainer_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  List Data Sales, SPV, BA, Trainer &amp; Nama Toko
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Satu Tempat Edit Coverage
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  SPV: WIDODO (Area Riau)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Pusat kendali master data satu tempat: Tambah toko baru, ubah nama toko, ganti sales, BA, trainer atau SPV yang cover toko. Perubahan di sini otomatis merubah coverage di seluruh modul (Weekly BA, Kontribusi Toko, Scorecard, KPI, dsb.).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tambah Toko Baru Manual */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Toko &amp; Tim Manual</span>
            </button>

            {/* Ekspor Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            {/* Reset ke Data Sheet */}
            <button
              onClick={handleResetToSheet}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Reset master data mengikuti data transaksi Google Sheet asli"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Sesuai Sheet</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Toko</span>
            <span className="text-xl font-black font-mono text-slate-900 mt-0.5 block">{totalStores} Gerai</span>
          </div>
          <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-200">
            <span className="text-[10px] font-bold text-pink-700 uppercase block">Toko Ada BA</span>
            <span className="text-xl font-black font-mono text-pink-900 mt-0.5 block">{totalBaStores} Toko</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Toko Non-BA</span>
            <span className="text-xl font-black font-mono text-blue-900 mt-0.5 block">{totalNonBaStores} Toko</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase block">KA (Modern Trade)</span>
            <span className="text-xl font-black font-mono text-purple-900 mt-0.5 block">{totalKaStores} Toko</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">MG (General Trade)</span>
            <span className="text-xl font-black font-mono text-emerald-900 mt-0.5 block">{totalMgStores} Toko</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase block">SPV Area Riau</span>
            <span className="text-base font-black font-mono text-indigo-900 mt-0.5 block">WIDODO (6 Sales)</span>
          </div>
        </div>

        {/* Sub-Tabs Nav: Tabel Satu Tempat vs Matriks Sales vs Matriks Trainer vs SPV */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'table'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Tabel Lengkap "Satu Tempat Edit"</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sales_matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'sales_matrix'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Matriks 6 Sales Binaan WIDODO</span>
          </button>
          <button
            onClick={() => setActiveSubTab('trainer_matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'trainer_matrix'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Matriks Trainer (ARA &amp; RATIH)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('spv_view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'spv_view'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Supervisor WIDODO</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Tabel Lengkap Satu Tempat */}
      {activeSubTab === 'table' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari toko, BA, nomor BA, sales, trainer, area..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Gerai Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({totalStores})
                </button>
                <button
                  onClick={() => setStatusFilter('ba')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'ba' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Toko BA ({totalBaStores})
                </button>
                <button
                  onClick={() => setStatusFilter('non_ba')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'non_ba' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Non-BA ({totalNonBaStores})
                </button>
              </div>

              {/* Channel / Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="font-semibold text-slate-500">Tipe Toko:</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="KA">KA (Key Account)</option>
                  <option value="MG">MG (Market Group)</option>
                </select>
              </div>

              {/* Sales Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={salesFilter}
                  onChange={(e) => setSalesFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all">Semua Sales</option>
                  {allSalesList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trainer Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={trainerFilter}
                  onChange={(e) => setTrainerFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all">Semua Trainer</option>
                  {distinctTrainers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Batch Reassign Action Bar (Muncul bila ada toko yang dipilih via checkbox) */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white font-extrabold font-mono text-xs">
                  {selectedIds.length} Toko Dipilih
                </span>
                <span className="text-slate-300 font-medium">Ubah coverage massal sekaligus:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Pindahkan Sales */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/20">
                  <span className="text-[10px] text-slate-300 font-bold pl-1">Sales:</span>
                  <select
                    value={batchSales}
                    onChange={(e) => setBatchSales(e.target.value)}
                    className="bg-slate-800 text-white font-bold px-2 py-1 rounded-lg text-xs outline-none cursor-pointer"
                  >
                    {allSalesList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyBatchSales}
                    className="px-2 py-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Terapkan
                  </button>
                </div>

                {/* Ganti Trainer */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/20">
                  <span className="text-[10px] text-slate-300 font-bold pl-1">Trainer:</span>
                  <select
                    value={batchTrainer}
                    onChange={(e) => setBatchTrainer(e.target.value)}
                    className="bg-slate-800 text-white font-bold px-2 py-1 rounded-lg text-xs outline-none cursor-pointer"
                  >
                    <option value="ARA">ARA</option>
                    <option value="RATIH">RATIH</option>
                    <option value="ARA & RATIH">ARA &amp; RATIH</option>
                  </select>
                  <button
                    onClick={handleApplyBatchTrainer}
                    className="px-2 py-1 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Terapkan
                  </button>
                </div>

                {/* Status BA Massal */}
                <button
                  onClick={() => handleApplyBatchBaStatus(true)}
                  className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Set Toko BA
                </button>
                <button
                  onClick={() => handleApplyBatchBaStatus(false)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Set Non-BA
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Toko &amp; Tim Coverage Binaan WIDODO ({filteredStores.length} Gerai)</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Ubah Sales, Trainer, Status BA, atau Coverage langsung dari dropdown pada tabel ini. Cukup revisi satu tempat, semua modul tersinkron otomatis.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAllFiltered}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  {selectedIds.length === filteredStores.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Batal Pilih Semua</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pilih Semua Toko</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={filteredStores.length > 0 && selectedIds.length === filteredStores.length}
                        onChange={toggleSelectAllFiltered}
                        className="rounded text-indigo-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-10">No</th>
                    <th className="py-3 px-3">Nama Toko</th>
                    <th className="py-3 px-3">Status Toko</th>
                    <th className="py-3 px-3">Nama BA &amp; No BA</th>
                    <th className="py-3 px-3">Sales Rep (Ganti Cepat)</th>
                    <th className="py-3 px-3">Trainer Cover (Ganti Cepat)</th>
                    <th className="py-3 px-3">Area &amp; SPV</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada toko yang sesuai dengan kriteria pencarian dan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          selectedIds.includes(item.id) ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectStore(item.id)}
                            className="rounded text-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{item.storeName}</div>
                          {item.isCustom && (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                              Toko Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleBaStatus(item.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs ${
                              item.hasBa
                                ? 'bg-pink-100 text-pink-800 border border-pink-200 hover:bg-pink-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                            }`}
                            title="Klik untuk mengubah status Toko BA / Non-BA"
                          >
                            {item.hasBa ? '💄 Toko BA' : '🏪 Non-BA'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          {item.hasBa ? (
                            <div>
                              <span className="font-bold text-slate-900 block">{item.baName}</span>
                              {item.baNumber && (
                                <span className="text-[10px] font-mono text-pink-700 font-semibold block">
                                  {item.baNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">- (Non-BA)</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={item.salesName}
                            onChange={(e) => handleQuickChangeSales(item.id, e.target.value)}
                            className="font-bold text-xs text-indigo-950 bg-indigo-50/70 border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[170px]"
                          >
                            {allSalesList.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                            {!allSalesList.includes(item.salesName) && (
                              <option value={item.salesName}>{item.salesName}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={item.trainerName}
                            onChange={(e) => handleQuickChangeTrainer(item.id, e.target.value)}
                            className="font-bold text-[11px] text-violet-900 bg-violet-50/70 border border-violet-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                          >
                            <option value="ARA">ARA</option>
                            <option value="RATIH">RATIH</option>
                            <option value="ARA & RATIH">ARA &amp; RATIH</option>
                            {!['ARA', 'RATIH', 'ARA & RATIH'].includes(item.trainerName) && (
                              <option value={item.trainerName}>{item.trainerName}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800 font-medium">{item.coverArea}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">SPV: {item.spvName || 'WIDODO'}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                              title="Edit detail toko, nama BA, sales, trainer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStore(item.id, item.storeName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Hapus toko"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Subtab 2: Matriks 6 Sales Binaan WIDODO */}
      {activeSubTab === 'sales_matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Daftar 6 Sales Resmi Binaan SPV WIDODO &amp; Gerai Toko yang Dicover</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik nama sales untuk melihat gerai toko yang ditugaskan, atau gunakan tombol "Filter Tabel Toko" untuk mengubah penugasan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALID_KPI_SALES_NAMES.map((sName) => {
              const cfg = SALES_MASTER_6_CONFIG[sName];
              const coveredStores = stores.filter((st) => st.salesName.toUpperCase() === sName.toUpperCase());
              const baCount = coveredStores.filter((st) => st.hasBa).length;
              const nonBaCount = coveredStores.filter((st) => !st.hasBa).length;
              const kaCount = coveredStores.filter((st) => st.channel === 'KA').length;

              return (
                <div
                  key={sName}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{sName}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">Area: {cfg?.area || 'RIAU'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {coveredStores.length} Gerai
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs">
                      <div className="p-2 bg-pink-50 rounded-xl border border-pink-100">
                        <span className="text-[10px] text-pink-700 font-bold block">Toko BA</span>
                        <span className="text-sm font-black font-mono text-pink-900 mt-0.5 block">{baCount}</span>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-blue-700 font-bold block">Non-BA</span>
                        <span className="text-sm font-black font-mono text-blue-900 mt-0.5 block">{nonBaCount}</span>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-[10px] text-purple-700 font-bold block">Kanal KA</span>
                        <span className="text-sm font-black font-mono text-purple-900 mt-0.5 block">{kaCount}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">
                        Trainer Pendamping: <span className="text-purple-700 font-extrabold">{cfg?.trainerCovered || 'ARA & RATIH'}</span>
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                        {coveredStores.map((st) => (
                          <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0">
                            <span className="font-semibold text-slate-800 truncate max-w-[180px]">{st.storeName}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${st.hasBa ? 'bg-pink-100 text-pink-700' : 'text-slate-400'}`}>
                              {st.hasBa ? 'BA' : 'Non-BA'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSalesFilter(sName);
                        setActiveSubTab('table');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Kelola Toko Sales Ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: Matriks Trainer (ARA & RATIH) */}
      {activeSubTab === 'trainer_matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <span>Matriks 2 Trainer Resmi (ARA &amp; RATIH)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trainer resmi Area Riau hanya 2 orang yaitu ARA dan RATIH.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['ARA', 'RATIH'].map((trainer) => {
              const trainerStores = stores.filter((st) => st.trainerName.toUpperCase().includes(trainer));
              const baCount = trainerStores.filter((st) => st.hasBa).length;

              return (
                <div key={trainer} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">Trainer {trainer}</h4>
                        <span className="text-xs text-slate-500 font-medium">Melatih BA &amp; Counter Area Riau</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        {trainerStores.length} Gerai Tercover
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4 text-center">
                      <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                        <span className="text-xs text-pink-700 font-bold block">Total Toko dengan BA</span>
                        <span className="text-lg font-black font-mono text-pink-900 mt-0.5 block">{baCount} BA</span>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span className="text-xs text-indigo-700 font-bold block">Total Gerai Binaan</span>
                        <span className="text-lg font-black font-mono text-indigo-900 mt-0.5 block">{trainerStores.length} Toko</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Daftar Sebagian Toko Coveran:</span>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/60">
                        {trainerStores.map((st) => (
                          <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0">
                            <span className="font-medium text-slate-800">{st.storeName}</span>
                            <span className="text-indigo-600 font-bold text-[10px]">{st.salesName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setTrainerFilter(trainer);
                        setActiveSubTab('table');
                      }}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Filter Semua Toko Trainer {trainer}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 4: Supervisor WIDODO */}
      {activeSubTab === 'spv_view' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Supervisor Tunggal: {OFFICIAL_SPV_WIDODO.spvName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {OFFICIAL_SPV_WIDODO.region}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold block text-[11px]">SPV Resmi Area</span>
              <span className="text-lg font-black text-slate-900 block mt-1">WIDODO</span>
              <span className="text-slate-400 font-sans text-[10px] block mt-0.5">SPV Tunggal Resmi Area Riau</span>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-indigo-700 font-bold block text-[11px]">Tim Sales Binaan</span>
              <span className="text-lg font-black text-indigo-900 block mt-1">6 Sales Personil</span>
              <span className="text-indigo-600 font-sans text-[10px] block mt-0.5">Albert, Ilhamsyah, Tiwi, Abdul Rahim, Pareto, Luar Kota</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 font-bold block text-[11px]">Total Gerai Terdaftar</span>
              <span className="text-lg font-black text-emerald-900 block mt-1">{totalStores} Toko</span>
              <span className="text-emerald-600 font-sans text-[10px] block mt-0.5">{totalBaStores} Toko BA + {totalNonBaStores} Toko Non-BA</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Ketentuan Struktur SPV WIDODO &amp; Pencapaian:
            </h4>
            <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed text-[11px]">
              <li>SPV Area Riau hanya 1 orang yaitu <strong>WIDODO</strong>.</li>
              <li>Seluruh <strong>Sell In KA</strong> dan <strong>Sell In DAZZLE ME MG</strong> otomatis masuk ke Total Pencapaian Sell In SPV WIDODO dan Pencapaian Area Riau.</li>
              <li>Formula Resmi: <code>Total Sell In = Sell In Reguler (6 Sales) + Sell In KA + Sell In DAZZLE ME MG</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal 1: Tambah Toko Baru Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Tambah Toko &amp; Penugasan Baru
                </h3>
                <span className="text-xs text-slate-500">
                  Masukkan data toko baru manual, sales, BA, trainer, dan SPV.
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStore} className="space-y-4 mt-4 text-xs">
              {/* Nama Toko */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Outlet *</label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Contoh: TOKO BERKAH KOSMETIK PEKANBARU"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-emerald-500 focus:outline-none uppercase"
                  required
                />
              </div>

              {/* Channel & SPV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kanal (Channel)</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as 'KA' | 'MG')}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MG">MG (Market Group / General Trade)</option>
                    <option value="KA">KA (Key Account / Modern Trade)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supervisor (SPV)</label>
                  <input
                    type="text"
                    value={newSpvName}
                    onChange={(e) => setNewSpvName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:border-emerald-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Status BA Toggle */}
              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-900 text-xs">Status Penugasan BA:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={newHasBa}
                        onChange={() => setNewHasBa(true)}
                        className="text-pink-600"
                      />
                      <span className="font-bold text-pink-900 text-[11px]">Ada BA</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newHasBa}
                        onChange={() => setNewHasBa(false)}
                        className="text-slate-600"
                      />
                      <span className="font-bold text-slate-600 text-[11px]">Toko Non-BA</span>
                    </label>
                  </div>
                </div>

                {newHasBa && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-pink-800 font-bold block mb-0.5">Nama BA</label>
                      <input
                        type="text"
                        value={newBaName}
                        onChange={(e) => setNewBaName(e.target.value)}
                        placeholder="Nama Beauty Advisor..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-pink-800 font-bold block mb-0.5">Nomor BA (Opsional)</label>
                      <input
                        type="text"
                        value={newBaNumber}
                        onChange={(e) => setNewBaNumber(e.target.value)}
                        placeholder="BA-01..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Rep & Trainer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sales Rep yang Cover</label>
                  <select
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {allSalesList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer Cover</label>
                  <select
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ARA">ARA</option>
                    <option value="RATIH">RATIH</option>
                    <option value="ARA & RATIH">ARA &amp; RATIH</option>
                  </select>
                </div>
              </div>

              {/* Area & Region */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / Kota</label>
                  <input
                    type="text"
                    value={newCoverArea}
                    onChange={(e) => setNewCoverArea(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs uppercase"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Keterangan toko..."
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Toko Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Detail Toko, BA, Sales & Trainer */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  Edit Master Toko &amp; Penugasan
                </h3>
                <span className="text-xs text-slate-500">
                  Ubah data nama toko, BA, sales, trainer, kanal atau status toko.
                </span>
              </div>
              <button
                onClick={() => setEditingStore(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              {/* Nama Toko */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Gerai *</label>
                <input
                  type="text"
                  value={editingStore.storeName}
                  onChange={(e) => setEditingStore({ ...editingStore, storeName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-indigo-500 focus:outline-none uppercase"
                  required
                />
              </div>

              {/* Channel & SPV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kanal (Channel)</label>
                  <select
                    value={editingStore.channel}
                    onChange={(e) => setEditingStore({ ...editingStore, channel: e.target.value as 'KA' | 'MG' })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="MG">MG (Market Group / General Trade)</option>
                    <option value="KA">KA (Key Account / Modern Trade)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supervisor (SPV)</label>
                  <input
                    type="text"
                    value={editingStore.spvName}
                    onChange={(e) => setEditingStore({ ...editingStore, spvName: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:border-indigo-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Status BA Toggle & Nama BA */}
              <div className="p-3.5 bg-pink-50/60 rounded-xl border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-900 text-xs">Status Toko BA:</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={editingStore.hasBa}
                        onChange={() =>
                          setEditingStore({
                            ...editingStore,
                            hasBa: true,
                            baName:
                              editingStore.baName && editingStore.baName !== '- (Non-BA)'
                                ? editingStore.baName
                                : `BA ${editingStore.storeName.split(' ')[0]}`,
                          })
                        }
                        className="text-pink-600"
                      />
                      <span className="font-bold text-pink-900 text-[11px]">Ada BA</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editingStore.hasBa}
                        onChange={() =>
                          setEditingStore({
                            ...editingStore,
                            hasBa: false,
                            baName: '- (Non-BA)',
                          })
                        }
                        className="text-slate-600"
                      />
                      <span className="font-bold text-slate-600 text-[11px]">Non-BA</span>
                    </label>
                  </div>
                </div>

                {editingStore.hasBa && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-pink-800 font-bold block mb-0.5">Nama BA</label>
                      <input
                        type="text"
                        value={editingStore.baName}
                        onChange={(e) => setEditingStore({ ...editingStore, baName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-bold focus:outline-none"
                        required={editingStore.hasBa}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-pink-800 font-bold block mb-0.5">Nomor BA (Opsional)</label>
                      <input
                        type="text"
                        value={editingStore.baNumber || ''}
                        onChange={(e) => setEditingStore({ ...editingStore, baNumber: e.target.value })}
                        placeholder="BA-01..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-pink-200 bg-white text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Rep & Trainer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sales Rep yang Cover</label>
                  <select
                    value={editingStore.salesName}
                    onChange={(e) => setEditingStore({ ...editingStore, salesName: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {allSalesList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {!allSalesList.includes(editingStore.salesName) && (
                      <option value={editingStore.salesName}>{editingStore.salesName}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer Cover</label>
                  <select
                    value={editingStore.trainerName}
                    onChange={(e) => setEditingStore({ ...editingStore, trainerName: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ARA">ARA</option>
                    <option value="RATIH">RATIH</option>
                    <option value="ARA & RATIH">ARA &amp; RATIH</option>
                    {!['ARA', 'RATIH', 'ARA & RATIH'].includes(editingStore.trainerName) && (
                      <option value={editingStore.trainerName}>{editingStore.trainerName}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Area & Region */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cover Area</label>
                  <input
                    type="text"
                    value={editingStore.coverArea}
                    onChange={(e) => setEditingStore({ ...editingStore, coverArea: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region</label>
                  <input
                    type="text"
                    value={editingStore.region}
                    onChange={(e) => setEditingStore({ ...editingStore, region: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs uppercase"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Catatan</label>
                <input
                  type="text"
                  value={editingStore.notes || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, notes: e.target.value })}
                  placeholder="Keterangan toko..."
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
