import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  Download,
  Edit3,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  Plus,
  Copy,
  BarChart3,
  Check,
  CalendarDays,
  Store,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { KpiTrainerScorecardItem, DashboardFilters } from '../types/dashboard';
import {
  loadKpiTrainerData,
  saveKpiTrainerData,
  calculateTrainerKpiPoints,
  INITIAL_KPI_TRAINER,
} from '../services/kpiTrainerService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface KpiTrainerScorecardProps {
  filters: DashboardFilters;
}

export const KpiTrainerScorecard: React.FC<KpiTrainerScorecardProps> = ({ filters }) => {
  const [kpiList, setKpiList] = useState<KpiTrainerScorecardItem[]>(() => loadKpiTrainerData());
  const [searchQuery, setSearchQuery] = useState('');
  const [showPillarGuide, setShowPillarGuide] = useState(true);

  // Sub-Tab Switcher: 'scorecard' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'scorecard' | 'history'>('scorecard');

  // Month Period Filter
  const [selectedMonthPeriod, setSelectedMonthPeriod] = useState<string>(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      return filters.BULAN.toUpperCase().includes('2026')
        ? filters.BULAN.toUpperCase()
        : `${filters.BULAN.toUpperCase()} 2026`;
    }
    return 'OKTOBER 2026';
  });

  // History Tab Specific Filters
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<string>('ALL');
  const [historyTrainerFilter, setHistoryTrainerFilter] = useState<string>('ALL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL'); // 'ALL' | '80-100' | '70-79' | '10-69'

  // Sync with external filters.BULAN
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const formatted = filters.BULAN.toUpperCase().includes('2026')
        ? filters.BULAN.toUpperCase()
        : `${filters.BULAN.toUpperCase()} 2026`;
      setSelectedMonthPeriod(formatted);
    }
  }, [filters.BULAN]);

  // Dynamic list of available month periods
  const availableMonthPeriods = useMemo(() => {
    const map = new Map<string, number>();
    kpiList.forEach((item) => {
      const period = item.monthPeriod || 'OKTOBER 2026';
      map.set(period, (map.get(period) || 0) + 1);
    });

    if (!map.has('OKTOBER 2026')) map.set('OKTOBER 2026', 0);
    if (!map.has('SEPTEMBER 2026')) map.set('SEPTEMBER 2026', 0);
    if (!map.has('AGUSTUS 2026')) map.set('AGUSTUS 2026', 0);

    return Array.from(map.entries()).map(([period, count]) => ({
      period,
      count,
    }));
  }, [kpiList]);

  // Unique trainer names
  const uniqueTrainerNames = useMemo(() => {
    const set = new Set<string>();
    kpiList.forEach((item) => set.add(item.trainerName));
    return Array.from(set).sort();
  }, [kpiList]);

  // -------------------------------------------------------------
  // EDIT / OVERRIDE MODAL STATE
  // -------------------------------------------------------------
  const [editingItem, setEditingItem] = useState<KpiTrainerScorecardItem | null>(null);
  const [editMonthPeriod, setEditMonthPeriod] = useState<string>('');
  const [editSellOutTarget, setEditSellOutTarget] = useState<number>(0);
  const [editSellOutActual, setEditSellOutActual] = useState<number>(0);
  const [editEventOmsetTarget, setEditEventOmsetTarget] = useState<number>(0);
  const [editEventOmsetActual, setEditEventOmsetActual] = useState<number>(0);
  const [editEventCountTarget, setEditEventCountTarget] = useState<number>(3);
  const [editEventCountActual, setEditEventCountActual] = useState<number>(3);
  const [editVisitTarget, setEditVisitTarget] = useState<number>(20);
  const [editVisitActual, setEditVisitActual] = useState<number>(20);
  const [editTrainingTarget, setEditTrainingTarget] = useState<number>(6);
  const [editTrainingActual, setEditTrainingActual] = useState<number>(6);
  const [editBaProductivityTarget, setEditBaProductivityTarget] = useState<number>(100);
  const [editBaProductivityActual, setEditBaProductivityActual] = useState<number>(100);
  const [editNotes, setEditNotes] = useState<string>('');

  // Add / Duplicate Period Modal State
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('NOVEMBER 2026');
  const [sourcePeriodForCopy, setSourcePeriodForCopy] = useState('OKTOBER 2026');

  // Open Edit Modal
  const handleOpenEdit = (item: KpiTrainerScorecardItem) => {
    setEditingItem(item);
    setEditMonthPeriod(item.monthPeriod || selectedMonthPeriod);
    setEditSellOutTarget(item.sellOutTarget);
    setEditSellOutActual(item.sellOutActual);
    setEditEventOmsetTarget(item.eventOmsetTarget);
    setEditEventOmsetActual(item.eventOmsetActual);
    setEditEventCountTarget(item.eventCountTarget || 3);
    setEditEventCountActual(item.eventCountActual || 3);
    setEditVisitTarget(item.visitTarget);
    setEditVisitActual(item.visitActual);
    setEditTrainingTarget(item.trainingTarget);
    setEditTrainingActual(item.trainingActual);
    setEditBaProductivityTarget(item.baProductivityTarget);
    setEditBaProductivityActual(item.baProductivityActual);
    setEditNotes(item.notes || '');
  };

  // Preview Points Live in Modal
  const modalLivePoints = useMemo(() => {
    return calculateTrainerKpiPoints({
      sellOutTarget: editSellOutTarget,
      sellOutActual: editSellOutActual,
      eventOmsetTarget: editEventOmsetTarget,
      eventOmsetActual: editEventOmsetActual,
      visitTarget: editVisitTarget,
      visitActual: editVisitActual,
      trainingTarget: editTrainingTarget,
      trainingActual: editTrainingActual,
      baProductivityTarget: editBaProductivityTarget,
      baProductivityActual: editBaProductivityActual,
    });
  }, [
    editSellOutTarget,
    editSellOutActual,
    editEventOmsetTarget,
    editEventOmsetActual,
    editVisitTarget,
    editVisitActual,
    editTrainingTarget,
    editTrainingActual,
    editBaProductivityTarget,
    editBaProductivityActual,
  ]);

  // Save Edit Item
  const handleSaveEdit = () => {
    if (!editingItem) return;

    const calc = calculateTrainerKpiPoints({
      sellOutTarget: editSellOutTarget,
      sellOutActual: editSellOutActual,
      eventOmsetTarget: editEventOmsetTarget,
      eventOmsetActual: editEventOmsetActual,
      visitTarget: editVisitTarget,
      visitActual: editVisitActual,
      trainingTarget: editTrainingTarget,
      trainingActual: editTrainingActual,
      baProductivityTarget: editBaProductivityTarget,
      baProductivityActual: editBaProductivityActual,
    });

    const updatedItem: KpiTrainerScorecardItem = {
      ...editingItem,
      monthPeriod: editMonthPeriod,
      sellOutTarget: editSellOutTarget,
      sellOutActual: editSellOutActual,
      sellOutAchievementPct: calc.sellOutAchievementPct,
      pointSellOut: calc.pointSellOut,

      eventOmsetTarget: editEventOmsetTarget,
      eventOmsetActual: editEventOmsetActual,
      eventOmsetAchievementPct: calc.eventOmsetAchievementPct,
      pointEvent: calc.pointEvent,
      eventCountTarget: editEventCountTarget,
      eventCountActual: editEventCountActual,

      visitTarget: editVisitTarget,
      visitActual: editVisitActual,
      visitAchievementPct: calc.visitAchievementPct,
      pointKunjungan: calc.pointKunjungan,

      trainingTarget: editTrainingTarget,
      trainingActual: editTrainingActual,
      trainingAchievementPct: calc.trainingAchievementPct,
      pointTraining: calc.pointTraining,

      baProductivityTarget: editBaProductivityTarget,
      baProductivityActual: editBaProductivityActual,
      baProductivityAchievementPct: calc.baProductivityAchievementPct,
      pointBaProductivity: calc.pointBaProductivity,

      totalScore: calc.totalScore,
      grade: calc.grade,
      scoreCategory: calc.scoreCategory,
      hasSp1: calc.hasSp1,
      notes: editNotes,
      isCustom: true,
    };

    const updatedList = kpiList.map((item) =>
      item.id === editingItem.id ? updatedItem : item
    );

    setKpiList(updatedList);
    saveKpiTrainerData(updatedList);
    setEditingItem(null);
  };

  // Reset to initial seed
  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh data KPI Trainer ke data simulasi bawaan?')) {
      setKpiList(INITIAL_KPI_TRAINER);
      saveKpiTrainerData(INITIAL_KPI_TRAINER);
    }
  };

  // Add / Duplicate Period
  const handleCreateNewPeriod = () => {
    if (!newPeriodName.trim()) return;
    const cleanPeriod = newPeriodName.trim().toUpperCase();

    // Check if period already exists
    const exists = kpiList.some((k) => k.monthPeriod === cleanPeriod);
    if (exists) {
      alert(`Periode "${cleanPeriod}" sudah ada di database.`);
      return;
    }

    // Clone trainers from source period
    const sourceItems = kpiList.filter((k) => k.monthPeriod === sourcePeriodForCopy);
    const fallbackSource = sourceItems.length > 0 ? sourceItems : INITIAL_KPI_TRAINER.slice(0, 4);

    const newItems: KpiTrainerScorecardItem[] = fallbackSource.map((src, idx) => ({
      ...src,
      id: `trn-kpi-${cleanPeriod.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
      monthPeriod: cleanPeriod,
      isCustom: true,
      notes: `Duplikasi target awal dari periode ${sourcePeriodForCopy}`,
    }));

    const combined = [...newItems, ...kpiList];
    setKpiList(combined);
    saveKpiTrainerData(combined);
    setSelectedMonthPeriod(cleanPeriod);
    setIsAddPeriodModalOpen(false);
  };

  // Filtered KPI items for Active Period Scorecard Table
  const currentPeriodItems = useMemo(() => {
    const effectiveSearch = (searchQuery || filters.searchQuery || '').trim().toLowerCase();
    return kpiList
      .filter((item) => (item.monthPeriod || 'OKTOBER 2026') === selectedMonthPeriod)
      .filter((item) => {
        // Global Region filter
        if (filters.REGION && filters.REGION !== 'ALL') {
          const reg = filters.REGION.toUpperCase();
          if (item.region.toUpperCase() !== reg && item.areaCovered.toUpperCase() !== reg) {
            return false;
          }
        }

        if (!effectiveSearch) return true;
        return (
          item.trainerName.toLowerCase().includes(effectiveSearch) ||
          item.areaCovered.toLowerCase().includes(effectiveSearch) ||
          item.region.toLowerCase().includes(effectiveSearch)
        );
      });
  }, [kpiList, selectedMonthPeriod, searchQuery, filters.REGION, filters.searchQuery]);

  // Overall Statistics for Active Period
  const activePeriodStats = useMemo(() => {
    const items = currentPeriodItems;
    const count = items.length || 1;
    const avgScore = items.length > 0 ? items.reduce((acc, k) => acc + k.totalScore, 0) / count : 0;
    const cat80to100 = items.filter((k) => k.scoreCategory === '80-100').length;
    const cat70to79 = items.filter((k) => k.scoreCategory === '70-79').length;
    const cat10to69 = items.filter((k) => k.scoreCategory === '10-69').length;
    const totalSellOut = items.reduce((acc, k) => acc + k.sellOutActual, 0);

    return {
      count: items.length,
      avgScore,
      cat80to100,
      cat70to79,
      cat10to69,
      totalSellOut,
    };
  }, [currentPeriodItems]);

  // -------------------------------------------------------------
  // ALL-TIME / FILTERED HISTORY ANALYSIS
  // -------------------------------------------------------------
  const filteredHistoryItems = useMemo(() => {
    return kpiList.filter((item) => {
      if (historyPeriodFilter !== 'ALL' && item.monthPeriod !== historyPeriodFilter) return false;
      if (historyTrainerFilter !== 'ALL' && item.trainerName !== historyTrainerFilter) return false;
      if (historyCategoryFilter !== 'ALL' && item.scoreCategory !== historyCategoryFilter) return false;
      return true;
    });
  }, [kpiList, historyPeriodFilter, historyTrainerFilter, historyCategoryFilter]);

  // Category counts across historical records
  const historyCategoryStats = useMemo(() => {
    const total = filteredHistoryItems.length;
    const count80to100 = filteredHistoryItems.filter((i) => i.scoreCategory === '80-100').length;
    const count70to79 = filteredHistoryItems.filter((i) => i.scoreCategory === '70-79').length;
    const count10to69 = filteredHistoryItems.filter((i) => i.scoreCategory === '10-69').length;

    const pct80to100 = total > 0 ? (count80to100 / total) * 100 : 0;
    const pct70to79 = total > 0 ? (count70to79 / total) * 100 : 0;
    const pct10to69 = total > 0 ? (count10to69 / total) * 100 : 0;

    return {
      total,
      count80to100,
      count70to79,
      count10to69,
      pct80to100,
      pct70to79,
      pct10to69,
    };
  }, [filteredHistoryItems]);

  // Group performance by Trainer for History Chart
  const trainerPerformanceSummary = useMemo(() => {
    const map: Record<
      string,
      {
        trainerName: string;
        evalCount: number;
        cat80to100Count: number;
        cat70to79Count: number;
        cat10to69Count: number;
        scores: number[];
        latestScore: number;
      }
    > = {};

    filteredHistoryItems.forEach((item) => {
      if (!map[item.trainerName]) {
        map[item.trainerName] = {
          trainerName: item.trainerName,
          evalCount: 0,
          cat80to100Count: 0,
          cat70to79Count: 0,
          cat10to69Count: 0,
          scores: [],
          latestScore: item.totalScore,
        };
      }
      map[item.trainerName].evalCount += 1;
      map[item.trainerName].scores.push(item.totalScore);
      if (item.scoreCategory === '80-100') map[item.trainerName].cat80to100Count += 1;
      else if (item.scoreCategory === '70-79') map[item.trainerName].cat70to79Count += 1;
      else if (item.scoreCategory === '10-69') map[item.trainerName].cat10to69Count += 1;
    });

    return Object.values(map).map((t) => {
      const avgScore = t.scores.reduce((a, b) => a + b, 0) / t.scores.length;
      return {
        ...t,
        avgScore,
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredHistoryItems]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Scorecard Periode Terpilih
      const periodHeaders = [
        'No',
        'Periode',
        'Nama Trainer',
        'Area Cover',
        'Region',
        'Target Sell Out (Rp)',
        'Aktual Sell Out (Rp)',
        '% Capai Sell Out',
        'Poin Sell Out (Maks 40)',
        'Target Omset Event (Rp)',
        'Aktual Omset Event (Rp)',
        '% Capai Event',
        'Poin Event (Maks 30)',
        'Target Kunjungan',
        'Aktual Kunjungan',
        '% Capai Kunjungan',
        'Poin Kunjungan (Maks 10)',
        'Target Training',
        'Aktual Training',
        '% Capai Training',
        'Poin Training (Maks 10)',
        'Target Prod BA',
        'Aktual Prod BA',
        '% Capai Prod BA',
        'Poin Prod BA (Maks 10)',
        'Total Skor KPI (0-100)',
        'Kategori Poin',
        'Grade',
        'Status SP1',
        'Catatan Evaluasi',
      ];

      const periodRows = currentPeriodItems.map((item, idx) => [
        idx + 1,
        item.monthPeriod,
        item.trainerName,
        item.areaCovered,
        item.region,
        item.sellOutTarget,
        item.sellOutActual,
        Number(item.sellOutAchievementPct.toFixed(2)),
        item.pointSellOut,
        item.eventOmsetTarget,
        item.eventOmsetActual,
        Number(item.eventOmsetAchievementPct.toFixed(2)),
        item.pointEvent,
        item.visitTarget,
        item.visitActual,
        Number(item.visitAchievementPct.toFixed(2)),
        item.pointKunjungan,
        item.trainingTarget,
        item.trainingActual,
        Number(item.trainingAchievementPct.toFixed(2)),
        item.pointTraining,
        item.baProductivityTarget,
        item.baProductivityActual,
        Number(item.baProductivityAchievementPct.toFixed(2)),
        item.pointBaProductivity,
        item.totalScore,
        item.scoreCategory,
        item.grade,
        item.hasSp1 ? 'SP1 DIBERIKAN' : 'AMAN',
        item.notes || '-',
      ]);

      const wsPeriod = XLSX.utils.aoa_to_sheet([periodHeaders, ...periodRows]);
      XLSX.utils.book_append_sheet(wb, wsPeriod, `KPI_${selectedMonthPeriod.replace(/\s+/g, '_')}`);

      // Sheet 2: Riwayat Semua Periode
      const historyHeaders = [
        'No',
        'Periode',
        'Nama Trainer',
        'Area Cover',
        'Total Skor KPI',
        'Kategori Poin',
        'Grade',
        'Status SP1',
        'Poin Sell Out',
        'Poin Event',
        'Poin Kunjungan',
        'Poin Training',
        'Poin Prod BA',
        'Catatan',
      ];

      const historyRows = kpiList.map((item, idx) => [
        idx + 1,
        item.monthPeriod,
        item.trainerName,
        item.areaCovered,
        item.totalScore,
        item.scoreCategory,
        item.grade,
        item.hasSp1 ? 'SP1' : 'AMAN',
        item.pointSellOut,
        item.pointEvent,
        item.pointKunjungan,
        item.pointTraining,
        item.pointBaProductivity,
        item.notes || '-',
      ]);

      const wsHistory = XLSX.utils.aoa_to_sheet([historyHeaders, ...historyRows]);
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Riwayat_Semua_Periode');

      XLSX.writeFile(
        wb,
        `SalesPro_KPI_Trainer_${selectedMonthPeriod.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (e) {
      console.warn('Failed to export KPI Trainer Excel', e);
    }
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-white via-purple-50/30 via-indigo-50/20 to-teal-50/20 rounded-2xl border border-purple-200/80 shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-600 text-white shadow-md shadow-purple-600/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                KPI TRAINER (Balanced Scorecard 100 Poin)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Evaluasi kinerja Trainer Area berdasarkan 5 pilar berbobot: Sell Out (40 pt), Event (30 pt), Kunjungan (10 pt), Training (10 pt), dan Produktivitas BA (10 pt)
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsAddPeriodModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>Kelola Periode Baru</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleResetToDefault}
              title="Reset data ke simulasi bawaan"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Rata-rata Skor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Rata-rata Skor KPI Trainer
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums flex items-baseline gap-2">
              <span>{activePeriodStats.avgScore.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-500">/ 100 Poin</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 font-medium">
              Periode Evaluasi: <strong className="text-purple-700">{selectedMonthPeriod}</strong>
            </div>
          </div>

          {/* Card 2: Kategori 80 - 100 Poin */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Kategori 80 - 100 Poin (Unggul)
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {activePeriodStats.cat80to100}{' '}
              <span className="text-xs font-semibold text-emerald-600">Trainer</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Kinerja sangat baik &amp; melampaui target
            </div>
          </div>

          {/* Card 3: Kategori 70 - 79 Poin */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
              Kategori 70 - 79 Poin (Standar)
            </span>
            <div className="text-2xl font-black text-amber-800 font-mono tabular-nums">
              {activePeriodStats.cat70to79}{' '}
              <span className="text-xs font-semibold text-amber-700">Trainer</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Kategori standar cukup (bebas SP1)
            </div>
          </div>

          {/* Card 4: Kategori 10 - 69 Poin (SP1) */}
          <div className="bg-gradient-to-br from-white via-rose-50 to-pink-50/50 p-4 rounded-xl border border-rose-300 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
              Kategori 10 - 69 Poin (SP1)
            </span>
            <div className="text-2xl font-black text-rose-700 font-mono tabular-nums">
              {activePeriodStats.cat10to69}{' '}
              <span className="text-xs font-semibold text-rose-600">Trainer</span>
            </div>
            <div className="text-xs text-rose-700 font-semibold mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Diberikan SP1 &amp; evaluasi ketat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Rule & Formula Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPillarGuide(!showPillarGuide)}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Ketentuan Resmi Skema Poin KPI Trainer (Total 100 Poin)
            </h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {showPillarGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showPillarGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
            {/* Pilar 1: Sell Out */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[11px]">1</span>
                <span>Pencapaian Sell Out</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Bobot Maksimal <strong>40 Poin</strong></p>
              <ul className="space-y-1 text-slate-700 font-medium">
                <li>• Capai ≥ 100%: <strong>40 Poin</strong></li>
                <li>• Capai 90% - 99%: <strong>35 Poin</strong></li>
                <li>• Capai 80% - 89%: <strong>30 Poin</strong></li>
                <li>• Capai &lt; 80%: <strong className="text-slate-400">0 Poin</strong></li>
              </ul>
            </div>

            {/* Pilar 2: Event & Omset Event */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[11px]">2</span>
                <span>Jumlah &amp; Omset Event</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Bobot Maksimal <strong>30 Poin</strong></p>
              <ul className="space-y-1 text-slate-700 font-medium">
                <li>• Capai ≥ 100%: <strong>30 Poin</strong></li>
                <li>• Capai 90% - 99%: <strong>25 Poin</strong></li>
                <li>• Capai 80% - 89%: <strong>20 Poin</strong></li>
                <li>• Capai &lt; 80%: <strong className="text-slate-400">0 Poin</strong></li>
              </ul>
            </div>

            {/* Pilar 3: Absensi & Kunjungan */}
            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200">
              <div className="font-bold text-teal-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-[11px]">3</span>
                <span>Absensi &amp; Kunjungan</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Bobot Maksimal <strong>10 Poin</strong></p>
              <ul className="space-y-1 text-slate-700 font-medium">
                <li>• Capai ≥ 100%: <strong>10 Poin</strong></li>
                <li>• Capai 90% - 99%: <strong>5 Poin</strong></li>
                <li className="text-rose-700">• Capai 80% - 89%: <strong>-5 Poin</strong></li>
                <li className="text-rose-700">• Capai &lt; 80%: <strong>-5 Poin</strong></li>
              </ul>
            </div>

            {/* Pilar 4: Jumlah Training */}
            <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200">
              <div className="font-bold text-cyan-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-200 text-cyan-800 flex items-center justify-center text-[11px]">4</span>
                <span>Jumlah Training</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Bobot Maksimal <strong>10 Poin</strong></p>
              <ul className="space-y-1 text-slate-700 font-medium">
                <li>• Capai ≥ 100%: <strong>10 Poin</strong></li>
                <li>• Capai 90% - 99%: <strong>5 Poin</strong></li>
                <li className="text-rose-700">• Capai 80% - 89%: <strong>-5 Poin</strong></li>
                <li className="text-rose-700">• Capai &lt; 80%: <strong>-5 Poin</strong></li>
              </ul>
            </div>

            {/* Pilar 5: Report & Produktivitas BA */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[11px]">5</span>
                <span>Produktivitas BA</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Bobot Maksimal <strong>10 Poin</strong></p>
              <ul className="space-y-1 text-slate-700 font-medium">
                <li>• Capai ≥ 100%: <strong>10 Poin</strong></li>
                <li>• Capai 90% - 99%: <strong>5 Poin</strong></li>
                <li className="text-rose-700">• Capai 80% - 89%: <strong>-5 Poin</strong></li>
                <li className="text-rose-700">• Capai &lt; 80%: <strong>-5 Poin</strong></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('scorecard')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'scorecard'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>Scorecard KPI Trainer ({currentPeriodItems.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Performa KPI Trainer Antar Periode</span>
          </button>
        </div>

        {/* Month Selector for Scorecard Tab */}
        {activeSubTab === 'scorecard' && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Periode:</span>
            <select
              value={selectedMonthPeriod}
              onChange={(e) => setSelectedMonthPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-purple-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
            >
              {availableMonthPeriods.map((p) => (
                <option key={p.period} value={p.period}>
                  {p.period} ({p.count} Trainer)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: SCORECARD KPI TRAINER PERIODE TERPILIH          */}
      {/* ========================================================= */}
      {activeSubTab === 'scorecard' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">
                Data Balanced Scorecard Periode: <strong className="text-purple-700">{selectedMonthPeriod}</strong>
              </span>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama trainer atau area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Scorecard Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Trainer &amp; Area</th>
                  <th className="py-3 px-3 text-right bg-purple-50/50 border-x border-purple-100">
                    1. Sell Out (40 pt)
                  </th>
                  <th className="py-3 px-3 text-right bg-indigo-50/50 border-r border-indigo-100">
                    2. Event (30 pt)
                  </th>
                  <th className="py-3 px-3 text-right bg-teal-50/50 border-r border-teal-100">
                    3. Kunjungan (10 pt)
                  </th>
                  <th className="py-3 px-3 text-right bg-cyan-50/50 border-r border-cyan-100">
                    4. Training (10 pt)
                  </th>
                  <th className="py-3 px-3 text-right bg-amber-50/50 border-r border-amber-100">
                    5. Prod. BA (10 pt)
                  </th>
                  <th className="py-3 px-3 text-center">Total Skor</th>
                  <th className="py-3 px-3 text-center">Kategori Capaian</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPeriodItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Tidak ada data KPI Trainer untuk periode {selectedMonthPeriod}.
                    </td>
                  </tr>
                ) : (
                  currentPeriodItems.map((item, idx) => {
                    const isSp1 = item.hasSp1;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{item.trainerName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {item.areaCovered} ({item.region})
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[200px] truncate" title={item.notes}>
                              {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Pilar 1: Sell Out */}
                        <td className="py-3 px-3 text-right bg-purple-50/20 border-x border-purple-100 font-mono">
                          <div className="font-bold text-slate-900">{formatRupiah(item.sellOutActual, true)}</div>
                          <div className="text-[10px] text-slate-500">
                            {formatPercent(item.sellOutAchievementPct, false)} vs {formatRupiah(item.sellOutTarget, true)}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            +{item.pointSellOut} pt
                          </span>
                        </td>

                        {/* Pilar 2: Event */}
                        <td className="py-3 px-3 text-right bg-indigo-50/20 border-r border-indigo-100 font-mono">
                          <div className="font-bold text-slate-900">{formatRupiah(item.eventOmsetActual, true)}</div>
                          <div className="text-[10px] text-slate-500">
                            {formatPercent(item.eventOmsetAchievementPct, false)} ({item.eventCountActual || 0} event)
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            +{item.pointEvent} pt
                          </span>
                        </td>

                        {/* Pilar 3: Kunjungan */}
                        <td className="py-3 px-3 text-right bg-teal-50/20 border-r border-teal-100 font-mono">
                          <div className="font-bold text-slate-900">{item.visitActual} / {item.visitTarget} toko</div>
                          <div className="text-[10px] text-slate-500">{formatPercent(item.visitAchievementPct, false)}</div>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.pointKunjungan < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {item.pointKunjungan > 0 ? `+${item.pointKunjungan}` : item.pointKunjungan} pt
                          </span>
                        </td>

                        {/* Pilar 4: Training */}
                        <td className="py-3 px-3 text-right bg-cyan-50/20 border-r border-cyan-100 font-mono">
                          <div className="font-bold text-slate-900">{item.trainingActual} / {item.trainingTarget} sesi</div>
                          <div className="text-[10px] text-slate-500">{formatPercent(item.trainingAchievementPct, false)}</div>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.pointTraining < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}
                          >
                            {item.pointTraining > 0 ? `+${item.pointTraining}` : item.pointTraining} pt
                          </span>
                        </td>

                        {/* Pilar 5: Prod BA */}
                        <td className="py-3 px-3 text-right bg-amber-50/20 border-r border-amber-100 font-mono">
                          <div className="font-bold text-slate-900">{item.baProductivityActual}%</div>
                          <div className="text-[10px] text-slate-500">Tgt: {item.baProductivityTarget}%</div>
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.pointBaProductivity < 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.pointBaProductivity > 0 ? `+${item.pointBaProductivity}` : item.pointBaProductivity} pt
                          </span>
                        </td>

                        {/* Total Skor */}
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-base font-black text-slate-900">{item.totalScore}</span>
                          <span className="text-[10px] text-slate-400 block">/ 100 pt</span>
                        </td>

                        {/* Kategori Capaian */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 ${
                              item.scoreCategory === '80-100'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.scoreCategory === '70-79'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.scoreCategory === '80-100' && <Sparkles className="w-3 h-3 text-emerald-600" />}
                            {item.scoreCategory === '70-79' && <Check className="w-3 h-3 text-amber-600" />}
                            {item.scoreCategory === '10-69' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            <span>Poin {item.scoreCategory}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                            {item.grade}
                          </span>
                        </td>

                        {/* Status SP1 / Aman */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isSp1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>SP1 &amp; Denda</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Lolos Evaluasi
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Target &amp; Aktual</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: RIWAYAT PERFORMA KPI TRAINER ANTAR PERIODE      */}
      {/* ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Top History Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-extrabold text-slate-900">
                Filter Riwayat &amp; Rekapitulasi Capaian Poin:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Periode */}
              <select
                value={historyPeriodFilter}
                onChange={(e) => setHistoryPeriodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Periode Bulan</option>
                {availableMonthPeriods.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.period}
                  </option>
                ))}
              </select>

              {/* Filter Trainer */}
              <select
                value={historyTrainerFilter}
                onChange={(e) => setHistoryTrainerFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Trainer ({uniqueTrainerNames.length})</option>
                {uniqueTrainerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Filter Kategori Poin */}
              <select
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Kategori Capaian</option>
                <option value="80-100">Poin 80 - 100 (Unggul)</option>
                <option value="70-79">Poin 70 - 79 (Standar)</option>
                <option value="10-69">Poin 10 - 69 (SP1)</option>
              </select>
            </div>
          </div>

          {/* 3 Main Kategori Cards requested by user: Berapa Kali 80-100, 70-79, 10-69 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Poin 80 - 100 Berapa Kali */}
            <div className="p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="text-xs font-bold text-emerald-900 uppercase">
                  Capaian Poin 80 - 100
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  Sangat Baik / Reward
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700 font-mono">
                  {historyCategoryStats.count80to100}
                </span>
                <span className="text-sm font-bold text-emerald-800">Kali Tercapai</span>
              </div>
              <div className="mt-2 text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>Rasio Keberhasilan:</span>
                <strong className="text-emerald-700 font-mono">
                  {formatPercent(historyCategoryStats.pct80to100, false)}
                </strong>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, historyCategoryStats.pct80to100)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Poin 70 - 79 Berapa Kali */}
            <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/30 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <span className="text-xs font-bold text-amber-900 uppercase">
                  Capaian Poin 70 - 79
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  Standar / Cukup
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-800 font-mono">
                  {historyCategoryStats.count70to79}
                </span>
                <span className="text-sm font-bold text-amber-900">Kali Tercapai</span>
              </div>
              <div className="mt-2 text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>Rasio Standar:</span>
                <strong className="text-amber-800 font-mono">
                  {formatPercent(historyCategoryStats.pct70to79, false)}
                </strong>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, historyCategoryStats.pct70to79)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Poin 10 - 69 Berapa Kali */}
            <div className="p-4 rounded-2xl border border-rose-300 bg-gradient-to-br from-white via-rose-50/60 to-red-50/30 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="text-xs font-bold text-rose-900 uppercase">
                  Capaian Poin 10 - 69
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                  Kurang / SP1 Diberikan
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-700 font-mono">
                  {historyCategoryStats.count10to69}
                </span>
                <span className="text-sm font-bold text-rose-800">Kali Tercapai (SP1)</span>
              </div>
              <div className="mt-2 text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>Rasio Defisit Kinerja:</span>
                <strong className="text-rose-700 font-mono">
                  {formatPercent(historyCategoryStats.pct10to69, false)}
                </strong>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, historyCategoryStats.pct10to69)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Visual Charts: Bar Chart Skor per Trainer & Distribusi Kategori */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Rata-rata Skor per Trainer */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Grafik Rata-rata Skor KPI Trainer Antar Periode
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Skala 0 - 100 Poin</span>
              </div>

              <div className="mt-4 space-y-4">
                {trainerPerformanceSummary.map((t) => (
                  <div key={t.trainerName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800">{t.trainerName}</span>
                      <span className="font-mono font-black text-purple-950">
                        {t.avgScore.toFixed(1)} Poin{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({t.evalCount} evaluasi)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          t.avgScore >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                            : t.avgScore >= 70
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-rose-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, t.avgScore))}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="text-emerald-700 font-semibold">{t.cat80to100Count}x Unggul</span>
                      <span>·</span>
                      <span className="text-amber-700 font-semibold">{t.cat70to79Count}x Standar</span>
                      <span>·</span>
                      <span className="text-rose-700 font-semibold">{t.cat10to69Count}x SP1</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Komposisi Distribusi Kategori Capaian */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Distribusi Kategori Capaian Keseluruhan
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Total {historyCategoryStats.total} Evaluasi
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {/* Category 80-100 */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-950">Poin 80 - 100 (Unggul / Reward)</div>
                        <div className="text-[11px] text-emerald-700">Pencapaian melampaui target indikator</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800 font-mono">
                        {historyCategoryStats.count80to100} Kali
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold">
                        {formatPercent(historyCategoryStats.pct80to100, false)}
                      </div>
                    </div>
                  </div>

                  {/* Category 70-79 */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-950">Poin 70 - 79 (Standar / Cukup)</div>
                        <div className="text-[11px] text-amber-700">Mencapai ambang batas aman</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-800 font-mono">
                        {historyCategoryStats.count70to79} Kali
                      </div>
                      <div className="text-[11px] text-amber-600 font-semibold">
                        {formatPercent(historyCategoryStats.pct70to79, false)}
                      </div>
                    </div>
                  </div>

                  {/* Category 10-69 */}
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-rose-950">Poin 10 - 69 (Kurang / Diberi SP1)</div>
                        <div className="text-[11px] text-rose-700">Wajib pembinaan &amp; perbaikan kinerja</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-rose-800 font-mono">
                        {historyCategoryStats.count10to69} Kali
                      </div>
                      <div className="text-[11px] text-rose-600 font-semibold">
                        {formatPercent(historyCategoryStats.pct10to69, false)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Rekomendasi Area:</span>
                <span className="font-bold text-purple-700">
                  {historyCategoryStats.count10to69 > 0
                    ? `Fokus pembinaan pada ${historyCategoryStats.count10to69} kejadian SP1`
                    : 'Seluruh trainer berada di zona aman standar'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Historical Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Rincian Riwayat Evaluasi KPI Trainer ({filteredHistoryItems.length} Log)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3">Nama Trainer</th>
                    <th className="py-2.5 px-3">Area &amp; Region</th>
                    <th className="py-2.5 px-3 text-right">Sell Out</th>
                    <th className="py-2.5 px-3 text-right">Event</th>
                    <th className="py-2.5 px-3 text-right">Kunjungan</th>
                    <th className="py-2.5 px-3 text-right">Training</th>
                    <th className="py-2.5 px-3 text-right">Prod BA</th>
                    <th className="py-2.5 px-3 text-center">Total Skor</th>
                    <th className="py-2.5 px-3 text-center">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-purple-800">{item.monthPeriod}</td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">{item.trainerName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.areaCovered}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        +{item.pointSellOut} pt <span className="text-[10px] text-slate-400">({formatPercent(item.sellOutAchievementPct, false)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        +{item.pointEvent} pt
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={item.pointKunjungan < 0 ? 'text-rose-600 font-bold' : ''}>
                          {item.pointKunjungan > 0 ? `+${item.pointKunjungan}` : item.pointKunjungan} pt
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={item.pointTraining < 0 ? 'text-rose-600 font-bold' : ''}>
                          {item.pointTraining > 0 ? `+${item.pointTraining}` : item.pointTraining} pt
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={item.pointBaProductivity < 0 ? 'text-rose-600 font-bold' : ''}>
                          {item.pointBaProductivity > 0 ? `+${item.pointBaProductivity}` : item.pointBaProductivity} pt
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                        {item.totalScore}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.scoreCategory === '80-100'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.scoreCategory === '70-79'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.scoreCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.hasSp1 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                            SP1
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">AMAN</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                          title="Edit evaluasi ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT TARGET & REALISASI KPI TRAINER              */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-purple-200 shadow-2xl p-6 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit KPI Trainer: {editingItem.trainerName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingItem.areaCovered} ({editingItem.region}) · Periode: {editMonthPeriod}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Point Indicator Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">Kalkulasi Skor Langsung:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-purple-950 font-mono">
                    {modalLivePoints.totalScore} Poin
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      modalLivePoints.scoreCategory === '80-100'
                        ? 'bg-emerald-100 text-emerald-800'
                        : modalLivePoints.scoreCategory === '70-79'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Kategori {modalLivePoints.scoreCategory} ({modalLivePoints.grade})
                  </span>
                </div>
              </div>

              {modalLivePoints.hasSp1 ? (
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Diberikan SP1</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lolos Standar</span>
                </span>
              )}
            </div>

            {/* 5 Indicator Edit Inputs */}
            <div className="mt-5 space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {/* Indikator 1: Sell Out */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-purple-900 uppercase">
                    1. Sell Out Area (Maks 40 Poin)
                  </span>
                  <span className="text-xs font-bold text-purple-800">
                    Poin: +{modalLivePoints.pointSellOut} pt ({formatPercent(modalLivePoints.sellOutAchievementPct, false)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Sell Out (Rp)
                    </label>
                    <input
                      type="number"
                      step="5000000"
                      value={editSellOutTarget}
                      onChange={(e) => setEditSellOutTarget(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Realisasi Sell Out (Rp)
                    </label>
                    <input
                      type="number"
                      step="5000000"
                      value={editSellOutActual}
                      onChange={(e) => setEditSellOutActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Indikator 2: Event & Omset Event */}
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-indigo-900 uppercase">
                    2. Event &amp; Omset Event (Maks 30 Poin)
                  </span>
                  <span className="text-xs font-bold text-indigo-800">
                    Poin: +{modalLivePoints.pointEvent} pt ({formatPercent(modalLivePoints.eventOmsetAchievementPct, false)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Omset Event (Rp)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={editEventOmsetTarget}
                      onChange={(e) => setEditEventOmsetTarget(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Realisasi Omset Event (Rp)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={editEventOmsetActual}
                      onChange={(e) => setEditEventOmsetActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Target Jumlah Event</label>
                    <input
                      type="number"
                      value={editEventCountTarget}
                      onChange={(e) => setEditEventCountTarget(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Realisasi Jumlah Event</label>
                    <input
                      type="number"
                      value={editEventCountActual}
                      onChange={(e) => setEditEventCountActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Indikator 3: Absensi & Kunjungan */}
              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-teal-900 uppercase">
                    3. Absensi &amp; Report Kunjungan (Maks 10 Poin, Penalti -5 pt)
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      modalLivePoints.pointKunjungan < 0 ? 'text-rose-700' : 'text-teal-800'
                    }`}
                  >
                    Poin: {modalLivePoints.pointKunjungan > 0 ? `+${modalLivePoints.pointKunjungan}` : modalLivePoints.pointKunjungan} pt ({formatPercent(modalLivePoints.visitAchievementPct, false)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Kunjungan Toko
                    </label>
                    <input
                      type="number"
                      value={editVisitTarget}
                      onChange={(e) => setEditVisitTarget(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Realisasi Kunjungan
                    </label>
                    <input
                      type="number"
                      value={editVisitActual}
                      onChange={(e) => setEditVisitActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Indikator 4: Jumlah Training */}
              <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-cyan-900 uppercase">
                    4. Jumlah Training (Maks 10 Poin, Penalti -5 pt)
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      modalLivePoints.pointTraining < 0 ? 'text-rose-700' : 'text-cyan-800'
                    }`}
                  >
                    Poin: {modalLivePoints.pointTraining > 0 ? `+${modalLivePoints.pointTraining}` : modalLivePoints.pointTraining} pt ({formatPercent(modalLivePoints.trainingAchievementPct, false)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Sesi Training
                    </label>
                    <input
                      type="number"
                      value={editTrainingTarget}
                      onChange={(e) => setEditTrainingTarget(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Realisasi Training
                    </label>
                    <input
                      type="number"
                      value={editTrainingActual}
                      onChange={(e) => setEditTrainingActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Indikator 5: Produktivitas BA */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-amber-900 uppercase">
                    5. Report &amp; Produktivitas BA (Maks 10 Poin, Penalti -5 pt)
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      modalLivePoints.pointBaProductivity < 0 ? 'text-rose-700' : 'text-amber-800'
                    }`}
                  >
                    Poin: {modalLivePoints.pointBaProductivity > 0 ? `+${modalLivePoints.pointBaProductivity}` : modalLivePoints.pointBaProductivity} pt ({formatPercent(modalLivePoints.baProductivityAchievementPct, false)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Capaian (%)
                    </label>
                    <input
                      type="number"
                      value={editBaProductivityTarget}
                      onChange={(e) => setEditBaProductivityTarget(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Realisasi Capaian (%)
                    </label>
                    <input
                      type="number"
                      value={editBaProductivityActual}
                      onChange={(e) => setEditBaProductivityActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Catatan Evaluasi / Rekomendasi
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Perlu peningkatan kunjungan toko area luar kota..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan KPI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: KELOLA PERIODE BULAN BARU (TAMBAH / DUPLIKASI)   */}
      {/* ========================================================= */}
      {isAddPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-purple-200 shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Tambah / Duplikasi Periode Evaluasi
                </h3>
              </div>
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Periode Baru (Contoh: NOVEMBER 2026)
                </label>
                <input
                  type="text"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  placeholder="NOVEMBER 2026"
                  className="w-full px-3 py-2 text-xs font-bold uppercase rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Duplikasi Target Awal Dari Periode:
                </label>
                <select
                  value={sourcePeriodForCopy}
                  onChange={(e) => setSourcePeriodForCopy(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  {availableMonthPeriods.map((p) => (
                    <option key={p.period} value={p.period}>
                      {p.period}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai target dan realisasi akan diduplikasi sehingga Anda dapat langsung mengeditnya per trainer.
                </span>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreateNewPeriod}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Buat Periode Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
