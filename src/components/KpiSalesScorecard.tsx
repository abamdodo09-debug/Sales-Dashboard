import React, { useState, useMemo, useEffect } from 'react';
import {
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
  ShieldAlert,
  Search,
  Calculator,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  Plus,
  Trash2,
  Copy,
  FileText,
  Filter,
  BarChart3,
  Layers,
  Check,
} from 'lucide-react';
import { KpiSalesScorecardItem, DashboardFilters } from '../types/dashboard';
import {
  loadKpiSalesData,
  saveKpiSalesData,
  calculateKpiPoints,
  INITIAL_KPI_SALES,
} from '../services/agingAndKpiService';
import { formatRupiah, formatPercent } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface KpiSalesScorecardProps {
  filters: DashboardFilters;
}

export const KpiSalesScorecard: React.FC<KpiSalesScorecardProps> = ({ filters }) => {
  const [kpiList, setKpiList] = useState<KpiSalesScorecardItem[]>(() => loadKpiSalesData());
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
  const [historySalesFilter, setHistorySalesFilter] = useState<string>('ALL');
  const [historyGradeFilter, setHistoryGradeFilter] = useState<string>('ALL');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL'); // 'ALL' | '80-100' | '70-79' | '10-69'
  const [isDetailListExpanded, setIsDetailListExpanded] = useState<boolean>(true);

  // Sync with filters.BULAN when external filters change
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

    // Guarantee default months are present in standard chronological order
    if (!map.has('OKTOBER 2026')) map.set('OKTOBER 2026', 0);
    if (!map.has('SEPTEMBER 2026')) map.set('SEPTEMBER 2026', 0);
    if (!map.has('AGUSTUS 2026')) map.set('AGUSTUS 2026', 0);

    return Array.from(map.entries()).map(([period, count]) => ({
      period,
      count,
    }));
  }, [kpiList]);

  // Unique sales names for history filter
  const uniqueSalesNames = useMemo(() => {
    const set = new Set<string>();
    kpiList.forEach((item) => set.add(item.salesName));
    return Array.from(set).sort();
  }, [kpiList]);

  // -------------------------------------------------------------
  // EDIT / OVERRIDE MODAL STATE
  // -------------------------------------------------------------
  const [editingItem, setEditingItem] = useState<KpiSalesScorecardItem | null>(null);
  const [editMonthPeriod, setEditMonthPeriod] = useState<string>('');
  const [editSellOutTarget, setEditSellOutTarget] = useState<number>(0);
  const [editSellOutActual, setEditSellOutActual] = useState<number>(0);
  const [editOverdueStores, setEditOverdueStores] = useState<number>(0);
  const [editVisits, setEditVisits] = useState<number>(0);
  const [editBaReportWeekly, setEditBaReportWeekly] = useState<number>(100);
  const [editBaStockOpname, setEditBaStockOpname] = useState<number>(100);
  const [editBufferApp, setEditBufferApp] = useState<number>(100);
  const [editManualIncentive, setEditManualIncentive] = useState<number | null>(null);
  const [editManualPenalty, setEditManualPenalty] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  // -------------------------------------------------------------
  // ADD NEW RECORD MODAL STATE
  // -------------------------------------------------------------
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSalesName, setNewSalesName] = useState('ILHAMSYAH');
  const [newCoverArea, setNewCoverArea] = useState('AREA BARU');
  const [newSpv, setNewSpv] = useState('WIDODO');
  const [newMonthPeriod, setNewMonthPeriod] = useState('NOVEMBER 2026');
  const [newSellOutTarget, setNewSellOutTarget] = useState(80000000);
  const [newSellOutActual, setNewSellOutActual] = useState(85000000);
  const [newOverdueStores, setNewOverdueStores] = useState(0);
  const [newVisits, setNewVisits] = useState(90);
  const [newBaReportWeekly, setNewBaReportWeekly] = useState(100);
  const [newBaStockOpname, setNewBaStockOpname] = useState(100);
  const [newBufferApp, setNewBufferApp] = useState(100);
  const [newBaseSalary, setNewBaseSalary] = useState(4900000);
  const [newSellInIncentive, setNewSellInIncentive] = useState(300000);
  const [newBaBonus, setNewBaBonus] = useState(500000);
  const [newBaPenalty, setNewBaPenalty] = useState(0);
  const [newTagihanPenalty, setNewTagihanPenalty] = useState(0);
  const [newNotes, setNewNotes] = useState('');

  // Open edit modal
  const handleOpenEdit = (item: KpiSalesScorecardItem) => {
    setEditingItem(item);
    setEditMonthPeriod(item.monthPeriod);
    setEditSellOutTarget(item.sellOutTarget);
    setEditSellOutActual(item.sellOutActual);
    setEditOverdueStores(item.overdueStoresUp45Count);
    setEditVisits(item.visitLogsCount);
    setEditBaReportWeekly(item.baReportWeeklyPct);
    setEditBaStockOpname(item.baStockOpnameAppPct);
    setEditBufferApp(item.storesUsingBufferAppPct);
    setEditManualIncentive(item.isManualOverride ? item.kpiIncentive : null);
    setEditManualPenalty(item.isManualOverride ? item.kpiPenalty : null);
    setEditNotes(item.notes || '');
  };

  // Live simulation inside edit modal
  const livePreview = useMemo(() => {
    if (!editingItem) return null;
    const sellOutPct = editSellOutTarget > 0 ? (editSellOutActual / editSellOutTarget) * 100 : 0;
    const calculated = calculateKpiPoints({
      sellOutAchievementPct: sellOutPct,
      overdueStoresUp45Count: editOverdueStores,
      visitLogsCount: editVisits,
      baReportWeeklyPct: editBaReportWeekly,
      baStockOpnameAppPct: editBaStockOpname,
      storesUsingBufferAppPct: editBufferApp,
    });

    const finalIncentive = editManualIncentive !== null ? editManualIncentive : calculated.kpiIncentive;
    const finalPenalty = editManualPenalty !== null ? editManualPenalty : calculated.kpiPenalty;

    const finalTHP =
      editingItem.baseSalary +
      editingItem.sellInIncentive +
      editingItem.baBonus -
      editingItem.baPenalty +
      finalIncentive -
      finalPenalty -
      editingItem.tagihanPenalty;

    return {
      sellOutPct,
      ...calculated,
      finalIncentive,
      finalPenalty,
      finalTHP,
    };
  }, [
    editingItem,
    editSellOutTarget,
    editSellOutActual,
    editOverdueStores,
    editVisits,
    editBaReportWeekly,
    editBaStockOpname,
    editBufferApp,
    editManualIncentive,
    editManualPenalty,
  ]);

  // Live simulation inside add modal
  const newLivePreview = useMemo(() => {
    const sellOutPct = newSellOutTarget > 0 ? (newSellOutActual / newSellOutTarget) * 100 : 0;
    const calculated = calculateKpiPoints({
      sellOutAchievementPct: sellOutPct,
      overdueStoresUp45Count: newOverdueStores,
      visitLogsCount: newVisits,
      baReportWeeklyPct: newBaReportWeekly,
      baStockOpnameAppPct: newBaStockOpname,
      storesUsingBufferAppPct: newBufferApp,
    });

    const finalTHP =
      newBaseSalary +
      newSellInIncentive +
      newBaBonus -
      newBaPenalty +
      calculated.kpiIncentive -
      calculated.kpiPenalty -
      newTagihanPenalty;

    return {
      sellOutPct,
      ...calculated,
      finalTHP,
    };
  }, [
    newSellOutTarget,
    newSellOutActual,
    newOverdueStores,
    newVisits,
    newBaReportWeekly,
    newBaStockOpname,
    newBufferApp,
    newBaseSalary,
    newSellInIncentive,
    newBaBonus,
    newBaPenalty,
    newTagihanPenalty,
  ]);

  // Save changes from Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !livePreview) return;

    const targetKey = editingItem.id || `${editingItem.salesName}_${editingItem.monthPeriod}`;

    const updated = kpiList.map((item) => {
      const itemKey = item.id || `${item.salesName}_${item.monthPeriod}`;
      if (itemKey === targetKey) {
        return {
          ...item,
          monthPeriod: editMonthPeriod.trim().toUpperCase() || item.monthPeriod,
          sellOutTarget: editSellOutTarget,
          sellOutActual: editSellOutActual,
          sellOutAchievementPct: livePreview.sellOutPct,
          pointSellOut: livePreview.pointSellOut,
          overdueStoresUp45Count: editOverdueStores,
          pointTagihan45H: livePreview.pointTagihan45H,
          visitLogsCount: editVisits,
          pointKunjungan: livePreview.pointKunjungan,
          baReportWeeklyPct: editBaReportWeekly,
          pointBaReportWeekly: livePreview.pointBaReportWeekly,
          baStockOpnameAppPct: editBaStockOpname,
          pointBaStockOpname: livePreview.pointBaStockOpname,
          pointMonitoringBa: livePreview.pointMonitoringBa,
          storesUsingBufferAppPct: editBufferApp,
          pointBufferStock: livePreview.pointBufferStock,
          totalScore: livePreview.totalScore,
          grade: livePreview.grade,
          kpiIncentive: livePreview.finalIncentive,
          kpiPenalty: livePreview.finalPenalty,
          hasSp1: livePreview.hasSp1,
          finalTakeHomePay: livePreview.finalTHP,
          isManualOverride: true,
          notes: editNotes.trim(),
        };
      }
      return item;
    });

    setKpiList(updated);
    saveKpiSalesData(updated);
    setEditingItem(null);
  };

  // Save new record
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const periodUpper = newMonthPeriod.trim().toUpperCase() || 'NOVEMBER 2026';
    const newRecord: KpiSalesScorecardItem = {
      id: `kpi-custom-${Date.now()}`,
      salesName: newSalesName.trim().toUpperCase(),
      coverArea: newCoverArea.trim().toUpperCase(),
      spv: newSpv.trim().toUpperCase(),
      monthPeriod: periodUpper,
      sellOutTarget: newSellOutTarget,
      sellOutActual: newSellOutActual,
      sellOutAchievementPct: newLivePreview.sellOutPct,
      pointSellOut: newLivePreview.pointSellOut,
      overdueStoresUp45Count: newOverdueStores,
      pointTagihan45H: newLivePreview.pointTagihan45H,
      visitLogsCount: newVisits,
      pointKunjungan: newLivePreview.pointKunjungan,
      baReportWeeklyPct: newBaReportWeekly,
      pointBaReportWeekly: newLivePreview.pointBaReportWeekly,
      baStockOpnameAppPct: newBaStockOpname,
      pointBaStockOpname: newLivePreview.pointBaStockOpname,
      pointMonitoringBa: newLivePreview.pointMonitoringBa,
      storesUsingBufferAppPct: newBufferApp,
      pointBufferStock: newLivePreview.pointBufferStock,
      totalScore: newLivePreview.totalScore,
      grade: newLivePreview.grade,
      kpiIncentive: newLivePreview.kpiIncentive,
      kpiPenalty: newLivePreview.kpiPenalty,
      hasSp1: newLivePreview.hasSp1,
      baseSalary: newBaseSalary,
      sellInIncentive: newSellInIncentive,
      baBonus: newBaBonus,
      baPenalty: newBaPenalty,
      tagihanPenalty: newTagihanPenalty,
      finalTakeHomePay: newLivePreview.finalTHP,
      isManualOverride: true,
      notes: newNotes.trim() || 'Data rekapan manual baru',
    };

    const updated = [newRecord, ...kpiList];
    setKpiList(updated);
    saveKpiSalesData(updated);
    setIsAddingNew(false);
    setSelectedMonthPeriod(periodUpper);
  };

  // Duplicate record to another month
  const handleDuplicateToMonth = (item: KpiSalesScorecardItem) => {
    const nextMonthPrompt = window.prompt(
      `Masukkan periode bulan baru untuk menduplikasi KPI ${item.salesName}:`,
      'NOVEMBER 2026'
    );
    if (!nextMonthPrompt || !nextMonthPrompt.trim()) return;

    const targetPeriod = nextMonthPrompt.trim().toUpperCase();
    const duplicated: KpiSalesScorecardItem = {
      ...item,
      id: `kpi-dup-${Date.now()}`,
      monthPeriod: targetPeriod,
      isManualOverride: true,
      notes: `Duplikasi dari ${item.monthPeriod}`,
    };

    const updated = [duplicated, ...kpiList];
    setKpiList(updated);
    saveKpiSalesData(updated);
    setSelectedMonthPeriod(targetPeriod);
  };

  // Delete record
  const handleDeleteRecord = (item: KpiSalesScorecardItem) => {
    const confirmDelete = window.confirm(
      `Hapus rekap performa KPI ${item.salesName} pada periode ${item.monthPeriod}?`
    );
    if (!confirmDelete) return;

    const targetKey = item.id || `${item.salesName}_${item.monthPeriod}`;
    const updated = kpiList.filter((k) => (k.id || `${k.salesName}_${k.monthPeriod}`) !== targetKey);
    setKpiList(updated);
    saveKpiSalesData(updated);
  };

  // Reset to auto calculations for an item
  const handleResetToAuto = (item: KpiSalesScorecardItem) => {
    const original = INITIAL_KPI_SALES.find(
      (s) => s.salesName === item.salesName && s.monthPeriod === item.monthPeriod
    );
    if (!original) {
      alert('Data bawaan untuk personil dan periode ini tidak ditemukan di template awal.');
      return;
    }

    const targetKey = item.id || `${item.salesName}_${item.monthPeriod}`;
    const updated = kpiList.map((k) => {
      const kKey = k.id || `${k.salesName}_${k.monthPeriod}`;
      if (kKey === targetKey) {
        return { ...original, isManualOverride: false };
      }
      return k;
    });

    setKpiList(updated);
    saveKpiSalesData(updated);
    setEditingItem(null);
  };

  // Reset all to system seed
  const handleResetAll = () => {
    const confirmReset = window.confirm(
      'Kembalikan seluruh scorecard dan riwayat KPI sales ke standar bawaan sistem?'
    );
    if (!confirmReset) return;
    setKpiList(INITIAL_KPI_SALES);
    saveKpiSalesData(INITIAL_KPI_SALES);
    setSelectedMonthPeriod('OKTOBER 2026');
  };

  // -------------------------------------------------------------
  // FILTERED DATA
  // -------------------------------------------------------------

  // Filtered sales for Scorecard Tab (respects selectedMonthPeriod)
  const filteredScorecardSales = useMemo(() => {
    return kpiList.filter((s) => {
      // Month Period filter
      if (selectedMonthPeriod !== 'ALL' && s.monthPeriod !== selectedMonthPeriod) return false;

      // Global Filters
      if (filters.SALES !== 'ALL' && s.salesName !== filters.SALES) return false;
      if (filters.SPV !== 'ALL' && s.spv !== filters.SPV) return false;

      // Free Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.salesName.toLowerCase().includes(q) ||
          s.coverArea.toLowerCase().includes(q) ||
          s.spv.toLowerCase().includes(q) ||
          s.monthPeriod.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [kpiList, selectedMonthPeriod, filters, searchQuery]);

  // Filtered list of raw history records based on period, sales, grade, and search
  const filteredHistorySales = useMemo(() => {
    return kpiList.filter((s) => {
      // Period filter specifically for history
      if (historyPeriodFilter !== 'ALL' && s.monthPeriod !== historyPeriodFilter) return false;

      // Specific sales person filter
      if (historySalesFilter !== 'ALL' && s.salesName !== historySalesFilter) return false;

      // Grade filter
      if (historyGradeFilter !== 'ALL' && s.grade !== historyGradeFilter) return false;

      // Free Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.salesName.toLowerCase().includes(q) ||
          s.coverArea.toLowerCase().includes(q) ||
          s.spv.toLowerCase().includes(q) ||
          s.monthPeriod.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [kpiList, historyPeriodFilter, historySalesFilter, historyGradeFilter, searchQuery]);

  // Aggregated Category Frequency Per Sales Personil
  // Categories requested by user:
  // 1. Capai Poin 80-100 (Berapa kali) -> Grade A & B, Berhak Insentif Rp 500k - Rp 2jt
  // 2. Capai Poin 70-79 (Berapa kali) -> Grade C, Standar Aman, Rp 0
  // 3. Capai Poin 10-69 (Berapa kali) -> Grade D, Butuh Pembinaan / SP1 & Denda Rp 300k
  const salesCategoryHistory = useMemo(() => {
    const map = new Map<
      string,
      {
        salesName: string;
        coverArea: string;
        spv: string;
        count80to100: number;
        count70to79: number;
        count10to69: number;
        totalPeriods: number;
        totalPoints: number;
        totalIncentive: number;
        totalPenalty: number;
        details: { month: string; score: number; grade: string; isSp1: boolean }[];
        records: KpiSalesScorecardItem[];
      }
    >();

    filteredHistorySales.forEach((item) => {
      if (!map.has(item.salesName)) {
        map.set(item.salesName, {
          salesName: item.salesName,
          coverArea: item.coverArea,
          spv: item.spv,
          count80to100: 0,
          count70to79: 0,
          count10to69: 0,
          totalPeriods: 0,
          totalPoints: 0,
          totalIncentive: 0,
          totalPenalty: 0,
          details: [],
          records: [],
        });
      }

      const entry = map.get(item.salesName)!;
      entry.totalPeriods += 1;
      entry.totalPoints += item.totalScore;
      entry.totalIncentive += item.kpiIncentive;
      entry.totalPenalty += item.kpiPenalty;
      entry.records.push(item);
      entry.details.push({
        month: item.monthPeriod,
        score: item.totalScore,
        grade: item.grade,
        isSp1: item.hasSp1,
      });

      // Point categories: 80-100, 70-79, 10-69
      if (item.totalScore >= 80) {
        entry.count80to100 += 1;
      } else if (item.totalScore >= 70) {
        entry.count70to79 += 1;
      } else {
        entry.count10to69 += 1;
      }
    });

    let result = Array.from(map.values()).map((s) => {
      const avgScore = s.totalPeriods > 0 ? s.totalPoints / s.totalPeriods : 0;
      let consistencyStatus = 'Memenuhi Standar';
      let consistencyBadge = 'bg-blue-50 text-blue-800 border-blue-200';

      if (s.count10to69 > 0) {
        consistencyStatus = `${s.count10to69}x Butuh Pembinaan (SP1)`;
        consistencyBadge = 'bg-rose-50 text-rose-800 border-rose-300';
      } else if (s.count80to100 === s.totalPeriods && s.totalPeriods > 0) {
        consistencyStatus = 'Konsisten Unggul (100% Reward)';
        consistencyBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      } else if (s.count80to100 > 0) {
        consistencyStatus = `${s.count80to100}x Unggul Berprestasi`;
        consistencyBadge = 'bg-teal-50 text-teal-800 border-teal-200';
      }

      // Sort details chronologically if possible
      s.details.sort((a, b) => b.month.localeCompare(a.month));

      return {
        ...s,
        avgScore,
        consistencyStatus,
        consistencyBadge,
      };
    });

    // Filter by Category filter if active
    if (historyCategoryFilter === '80-100') {
      result = result.filter((r) => r.count80to100 > 0);
    } else if (historyCategoryFilter === '70-79') {
      result = result.filter((r) => r.count70to79 > 0);
    } else if (historyCategoryFilter === '10-69') {
      result = result.filter((r) => r.count10to69 > 0);
    }

    return result.sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredHistorySales, historyCategoryFilter]);

  // Overall Stats for Scorecard (computed from filteredScorecardSales)
  const kpiStats = useMemo(() => {
    const list = filteredScorecardSales;
    const total = list.length;
    const gradeACount = list.filter((s) => s.grade === 'A').length;
    const gradeBCount = list.filter((s) => s.grade === 'B').length;
    const gradeCCount = list.filter((s) => s.grade === 'C').length;
    const gradeDCount = list.filter((s) => s.grade === 'D').length;
    const sp1Count = list.filter((s) => s.hasSp1).length;
    const totalIncentive = list.reduce((acc, curr) => acc + curr.kpiIncentive, 0);
    const totalPenalty = list.reduce((acc, curr) => acc + curr.kpiPenalty, 0);
    const avgScore = total > 0 ? list.reduce((acc, curr) => acc + curr.totalScore, 0) / total : 0;
    const totalTHP = list.reduce((acc, curr) => acc + curr.finalTakeHomePay, 0);

    return {
      total,
      gradeACount,
      gradeBCount,
      gradeCCount,
      gradeDCount,
      sp1Count,
      totalIncentive,
      totalPenalty,
      avgScore,
      totalTHP,
    };
  }, [filteredScorecardSales]);

  // History Stats & Category Summaries
  const historyStats = useMemo(() => {
    const list = filteredHistorySales;
    const totalRecords = list.length;
    const avgScore = totalRecords > 0 ? list.reduce((a, c) => a + c.totalScore, 0) / totalRecords : 0;
    const totalIncentivePaid = list.reduce((a, c) => a + c.kpiIncentive, 0);
    const totalPenalties = list.reduce((a, c) => a + c.kpiPenalty, 0);
    const topPerformer = [...list].sort((a, b) => b.totalScore - a.totalScore)[0];

    const total80to100 = salesCategoryHistory.reduce((acc, s) => acc + s.count80to100, 0);
    const total70to79 = salesCategoryHistory.reduce((acc, s) => acc + s.count70to79, 0);
    const total10to69 = salesCategoryHistory.reduce((acc, s) => acc + s.count10to69, 0);

    return {
      totalRecords,
      avgScore,
      totalIncentivePaid,
      totalPenalties,
      topPerformer,
      total80to100,
      total70to79,
      total10to69,
    };
  }, [filteredHistorySales, salesCategoryHistory]);

  // Excel Export: Multi-sheet covering active scorecard & full history
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Scorecard Periode Terpilih
    const headersScorecard = [
      'No',
      'Periode Bulan',
      'Nama Sales',
      'Area',
      'SPV',
      'Target Sell Out (Rp)',
      'Realisasi Sell Out (Rp)',
      '% Capai Sell Out',
      'Poin Sell Out (Maks 40)',
      'Toko Up 45H',
      'Poin Tagihan (Maks 30)',
      'Log Kunjungan',
      'Poin Kunjungan (Maks 10)',
      '% Report Weekly BA',
      '% Tugas SO App',
      'Poin Monitoring BA (Maks 10)',
      '% Toko Buffer App',
      'Poin Buffer Stock (Maks 10)',
      'TOTAL SKOR KPI (Maks 100)',
      'GRADE',
      'Insentif KPI (Rp)',
      'Denda Penalti KPI (Rp)',
      'Status SP1',
      'Take Home Pay Final (Rp)',
      'Tipe Data',
    ];

    const rowsScorecard = filteredScorecardSales.map((s, idx) => [
      idx + 1,
      s.monthPeriod,
      s.salesName,
      s.coverArea,
      s.spv,
      s.sellOutTarget,
      s.sellOutActual,
      Number(s.sellOutAchievementPct.toFixed(1)),
      s.pointSellOut,
      s.overdueStoresUp45Count,
      s.pointTagihan45H,
      s.visitLogsCount,
      s.pointKunjungan,
      Number(s.baReportWeeklyPct.toFixed(0)),
      Number(s.baStockOpnameAppPct.toFixed(0)),
      s.pointMonitoringBa,
      Number(s.storesUsingBufferAppPct.toFixed(0)),
      s.pointBufferStock,
      s.totalScore,
      s.grade,
      s.kpiIncentive,
      s.kpiPenalty,
      s.hasSp1 ? 'SP1 (Denda Rp 300k)' : 'AMAN',
      s.finalTakeHomePay,
      s.isManualOverride ? 'Manual Override' : 'Otomatis',
    ]);

    const wsScorecard = XLSX.utils.aoa_to_sheet([headersScorecard, ...rowsScorecard]);
    XLSX.utils.book_append_sheet(wb, wsScorecard, 'Scorecard Terpilih');

    // Sheet 2: Rekapan Riwayat Lengkap
    const rowsHistory = filteredHistorySales.map((s, idx) => [
      idx + 1,
      s.monthPeriod,
      s.salesName,
      s.coverArea,
      s.spv,
      s.sellOutTarget,
      s.sellOutActual,
      Number(s.sellOutAchievementPct.toFixed(1)),
      s.pointSellOut,
      s.pointTagihan45H,
      s.pointKunjungan,
      s.pointMonitoringBa,
      s.pointBufferStock,
      s.totalScore,
      s.grade,
      s.kpiIncentive,
      s.kpiPenalty,
      s.hasSp1 ? 'SP1' : 'AMAN',
      s.finalTakeHomePay,
      s.notes || '-',
    ]);

    const headersHistory = [
      'No',
      'Periode Bulan',
      'Nama Sales',
      'Area',
      'SPV',
      'Target Sell Out (Rp)',
      'Realisasi Sell Out (Rp)',
      '% Capai Sell Out',
      'Poin SO (40)',
      'Poin AR (30)',
      'Poin Kunj (10)',
      'Poin BA (10)',
      'Poin Buffer (10)',
      'Total Skor KPI',
      'Grade',
      'Insentif KPI',
      'Denda Penalti',
      'Status SP1',
      'Final Take Home Pay',
      'Catatan Evaluasi',
    ];

    const wsHistory = XLSX.utils.aoa_to_sheet([headersHistory, ...rowsHistory]);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'History Rekapan KPI');

    XLSX.writeFile(
      wb,
      `SalesPro_Scorecard_dan_History_KPI_${selectedMonthPeriod.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const getGradeBadge = (grade: 'A' | 'B' | 'C' | 'D') => {
    if (grade === 'A') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          Grade A (&ge; 90)
        </span>
      );
    }
    if (grade === 'B') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
          Grade B (80-89)
        </span>
      );
    }
    if (grade === 'C') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
          Grade C (70-79)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
        Grade D (&lt; 70)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: KPI Overview */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-indigo-900">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                BALANCED SCORECARD 100 POIN
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Periode Terpilih:{' '}
                <strong className="text-amber-300 underline underline-offset-2">
                  {selectedMonthPeriod === 'ALL' ? 'Semua Periode Bulan' : selectedMonthPeriod}
                </strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1 text-white">
              Scorecard 5 Pilar KPI &amp; History Performa Sales
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Evaluasi kinerja sales multi-periode berdasarkan 5 pilar: Sell Out (40 pt), Piutang Up 45H (30 pt),
              Kunjungan (10 pt), Monitoring BA (10 pt), dan Buffer Stock (10 pt). Hasil terhubung langsung ke Take Home
              Pay dan riwayat performa dapat disesuaikan manual.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekap KPI</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 shadow-xs transition-all cursor-pointer"
              title="Reset semua data ke standar bawaan sistem"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Bawaan</span>
            </button>
          </div>
        </div>

        {/* 5 Pillars Metric Strip (Collapsible) */}
        <div className="mt-4 pt-3 border-t border-indigo-900/80">
          <button
            onClick={() => setShowPillarGuide(!showPillarGuide)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white cursor-pointer"
          >
            <span>Panduan Bobot 5 Pilar KPI (100 Poin)</span>
            {showPillarGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showPillarGuide && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3 text-xs animate-in fade-in duration-150">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-mono font-bold text-blue-400 block">PILAR 1 (MAKS 40 PT)</span>
                <div className="font-extrabold text-white text-xs mt-0.5">Poin Sell Out (26-25)</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  &ge;100% (40pt) | 80-90% (30pt) | 70-79% (25pt) | &lt;70% (20pt)
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-mono font-bold text-amber-400 block">PILAR 2 (MAKS 30 PT)</span>
                <div className="font-extrabold text-white text-xs mt-0.5">Tagihan Up 45 Hari</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  0 tk (30pt) | 1 tk (25pt) | 2 tk (20pt) | 3 tk (15pt) | &ge;4 tk (10pt)
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[10px] font-mono font-bold text-teal-400 block">PILAR 3 (MAKS 10 PT)</span>
                <div className="font-extrabold text-white text-xs mt-0.5">Log Kunjungan Toko</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  &gt;90 kunjungan (10pt) | 30-89 (5pt) | 1-29 (3pt) | 0 (0pt)
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] font-mono font-bold text-purple-400 block">PILAR 4 (MAKS 10 PT)</span>
                <div className="font-extrabold text-white text-xs mt-0.5">Monitoring BA (Weekly + SO)</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Report Weekly (maks 5pt) &amp; Tugas SO App 2x/bln (maks 5pt)
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono font-bold text-emerald-400 block">PILAR 5 (MAKS 10 PT)</span>
                <div className="font-extrabold text-white text-xs mt-0.5">Buffer Stock App Toko</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  All Toko (10pt) | 80-90% Toko (5pt) | &lt;80% Toko (3pt)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Sub-Tab Switcher & Global Period Selector Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('scorecard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'scorecard'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Tabel Scorecard 5 Pilar KPI ({filteredScorecardSales.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History Rekapan Performa KPI ({filteredHistorySales.length})</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Bulan Periode */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs font-bold text-indigo-900 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] text-indigo-700">Periode:</span>
            <select
              value={selectedMonthPeriod}
              onChange={(e) => setSelectedMonthPeriod(e.target.value)}
              className="bg-transparent font-black text-indigo-950 focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="ALL">Semua Periode Bulan</option>
              {availableMonthPeriods.map((m) => (
                <option key={m.period} value={m.period}>
                  {m.period} ({m.count} Personil)
                </option>
              ))}
            </select>
          </div>

          {selectedMonthPeriod !== 'ALL' && (
            <button
              onClick={() => setSelectedMonthPeriod('ALL')}
              className="px-2 py-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 rounded-xl flex items-center gap-1 cursor-pointer"
              title="Reset ke Semua Periode"
            >
              <span>Semua Periode</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sales / area / SPV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: TABEL SCORECARD 5 PILAR KPI & TAKE HOME PAY     */}
      {/* ========================================================= */}
      {activeSubTab === 'scorecard' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Personil Sales ({selectedMonthPeriod === 'ALL' ? 'Semua Bulan' : selectedMonthPeriod})
              </span>
              <div className="text-xl font-black font-mono text-slate-900 mt-1">{kpiStats.total} Sales</div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {kpiStats.gradeACount} Gr. A | {kpiStats.gradeBCount} Gr. B | {kpiStats.gradeCCount} Gr. C |{' '}
                {kpiStats.gradeDCount} Gr. D
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Insentif Reward KPI
              </span>
              <div className="text-xl font-black font-mono text-emerald-800 mt-1">
                +{formatRupiah(kpiStats.totalIncentive)}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                Reward pencapaian skor 80 - 100 poin
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Sanksi SP1 (&lt; 70 Poin)
              </span>
              <div className="text-xl font-black font-mono text-rose-800 mt-1">{kpiStats.sp1Count} Personil</div>
              <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
                Denda -{formatRupiah(kpiStats.totalPenalty)} (-Rp 300k/sales)
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/30">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                Rata-rata Skor KPI
              </span>
              <div className="text-xl font-black font-mono text-indigo-950 mt-1">
                {kpiStats.avgScore.toFixed(1)} / 100 Poin
              </div>
              <span className="text-[11px] text-indigo-700 font-semibold mt-0.5 block">
                Total THP Area: {formatRupiah(kpiStats.totalTHP)}
              </span>
            </div>
          </div>

          {/* Main Scorecard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Tabel Scorecard 5 Pilar KPI &amp; Take Home Pay Sales
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Periode aktif:{' '}
                  <span className="font-bold text-indigo-900">
                    {selectedMonthPeriod === 'ALL' ? 'Semua Periode' : selectedMonthPeriod}
                  </span>
                  . Klik tombol "Edit" untuk penyesuaian target atau pencapaian manual.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Data Sales</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3">Nama Sales</th>
                    <th className="py-3 px-3">Area &amp; SPV</th>
                    <th className="py-3 px-2 text-right">Pilar 1: SO (40)</th>
                    <th className="py-3 px-2 text-right">Pilar 2: AR (30)</th>
                    <th className="py-3 px-2 text-right">Pilar 3: Kunj (10)</th>
                    <th className="py-3 px-2 text-right">Pilar 4: BA (10)</th>
                    <th className="py-3 px-2 text-right">Pilar 5: Buffer (10)</th>
                    <th className="py-3 px-3 text-center bg-indigo-50/70 font-black text-indigo-950">
                      Total Skor (100)
                    </th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-3 text-right">Insentif KPI</th>
                    <th className="py-3 px-3 text-center">Status Sanksi</th>
                    <th className="py-3 px-3.5 text-right font-black text-slate-900 bg-slate-100">
                      Take Home Pay Final
                    </th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScorecardSales.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada data scorecard KPI pada filter dan periode bulan yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredScorecardSales.map((s, idx) => (
                      <tr key={s.id || `${s.salesName}_${s.monthPeriod}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                            {s.monthPeriod}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{s.salesName}</div>
                          {s.isManualOverride && (
                            <span className="text-[10px] text-indigo-600 font-semibold inline-block">
                              *Manual Override
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{s.coverArea}</div>
                          <div className="text-[11px] text-slate-500">SPV: {s.spv}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <span className="font-bold text-slate-900">{s.pointSellOut} pt</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({s.sellOutAchievementPct.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <span className="font-bold text-slate-900">{s.pointTagihan45H} pt</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({s.overdueStoresUp45Count} toko)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <span className="font-bold text-slate-900">{s.pointKunjungan} pt</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({s.visitLogsCount} visit)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <span className="font-bold text-slate-900">{s.pointMonitoringBa} pt</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({s.baReportWeeklyPct}% / {s.baStockOpnameAppPct}%)
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <span className="font-bold text-slate-900">{s.pointBufferStock} pt</span>
                          <span className="text-[10px] text-slate-500 block">
                            ({s.storesUsingBufferAppPct}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-sm bg-indigo-50/50 text-indigo-950">
                          {s.totalScore}
                        </td>
                        <td className="py-3 px-3 text-center">{getGradeBadge(s.grade)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {s.kpiIncentive > 0 ? `+${formatRupiah(s.kpiIncentive)}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.hasSp1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                              SP1 (-Rp 300k)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Aman (Rp 0)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 bg-slate-100/60">
                          {formatRupiah(s.finalTakeHomePay)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors"
                              title="Edit capaian 5 pilar atau insentif manual"
                            >
                              <Edit3 className="w-3 h-3 inline mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDuplicateToMonth(s)}
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Duplikasi data ke bulan berikutnya"
                            >
                              <Copy className="w-3.5 h-3.5" />
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

      {/* ========================================================= */}
      {/* SUBTAB 2: RIWAYAT PERFORMA KPI SALES DENGAN KATEGORI POIN */}
      {/* ========================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* History KPI Category Frequency Analytics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Kategori 80-100 Poin */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Capai Poin 80–100
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Reward Insentif
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-900 mt-1.5 flex items-baseline gap-1.5">
                <span>{historyStats.total80to100}</span>
                <span className="text-xs font-semibold text-emerald-700">Kali Tercapai</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center justify-between">
                <span>Grade A (&ge;90) &amp; Grade B (80-89)</span>
                <strong className="font-mono text-emerald-900">+{formatRupiah(historyStats.totalIncentivePaid)}</strong>
              </div>
            </div>

            {/* Card 2: Kategori 70-79 Poin */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Capai Poin 70–79
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  Standar Aman
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-950 mt-1.5 flex items-baseline gap-1.5">
                <span>{historyStats.total70to79}</span>
                <span className="text-xs font-semibold text-amber-700">Kali Tercapai</span>
              </div>
              <div className="text-[11px] text-amber-800 font-medium mt-1 flex items-center justify-between">
                <span>Grade C | Aman Tanpa Denda</span>
                <strong className="font-mono text-amber-900">Rp 0 Insentif</strong>
              </div>
            </div>

            {/* Card 3: Kategori 10-69 Poin */}
            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                  Capai Poin 10–69
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                  Sanksi SP1
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-900 mt-1.5 flex items-baseline gap-1.5">
                <span>{historyStats.total10to69}</span>
                <span className="text-xs font-semibold text-rose-700">Kali Tercapai</span>
              </div>
              <div className="text-[11px] text-rose-700 font-medium mt-1 flex items-center justify-between">
                <span>Grade D (&lt;70) | Butuh Pembinaan</span>
                <strong className="font-mono text-rose-900">-{formatRupiah(historyStats.totalPenalties)}</strong>
              </div>
            </div>

            {/* Card 4: Rata-rata Skor & Total Evaluasi */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Rata-rata Skor Tim
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {historyStats.totalRecords} Rekap
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-indigo-950 mt-1.5 flex items-baseline gap-1.5">
                <span>{historyStats.avgScore.toFixed(1)}</span>
                <span className="text-xs font-semibold text-indigo-700">Poin Rata-rata</span>
              </div>
              <div className="text-[11px] text-indigo-800 font-medium mt-1 flex items-center justify-between">
                <span>Top: {historyStats.topPerformer ? historyStats.topPerformer.salesName : '-'}</span>
                <strong className="font-mono text-indigo-950">
                  {historyStats.topPerformer ? `${historyStats.topPerformer.totalScore} pt` : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* TOOLBAR FILTER RIWAYAT KPI (PERIODE BULAN, SALES, KATEGORI POIN) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  Riwayat Performa KPI Berdasarkan Kategori Pencapaian Poin
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Rekapitulasi frekuensi pencapaian kategori poin 80–100 (Reward), 70–79 (Standar Aman), dan 10–69 (SP1) per sales.
                </p>
              </div>

              {/* Sub-Filters for History */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Filter Periode Bulan */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  <span className="text-[11px] text-purple-900 font-bold">Periode:</span>
                  <select
                    value={historyPeriodFilter}
                    onChange={(e) => setHistoryPeriodFilter(e.target.value)}
                    className="bg-transparent font-black text-purple-950 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Semua Periode (Lintas Bulan)</option>
                    {availableMonthPeriods.map((p) => (
                      <option key={p.period} value={p.period}>
                        {p.period}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter Personil Sales */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-500 font-medium">Sales:</span>
                  <select
                    value={historySalesFilter}
                    onChange={(e) => setHistorySalesFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Semua Personil Sales</option>
                    {uniqueSalesNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Filter Kategori Poin */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-500 font-medium">Kategori:</span>
                  <select
                    value={historyCategoryFilter}
                    onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori Poin</option>
                    <option value="80-100">Poin 80–100 (Reward)</option>
                    <option value="70-79">Poin 70–79 (Standar Aman)</option>
                    <option value="10-69">Poin 10–69 (SP1 & Denda)</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Riwayat</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* GRAFIK PERFORMA KPI SALES (DISTRIBUSI KATEGORI & TREN SKOR) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* GRAFIK 1: DISTRIBUSI FREKUENSI KATEGORI POIN PER SALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Distribusi Frekuensi Kategori Poin per Personil
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Jumlah kali sales mencapai kategori poin 80–100, 70–79, dan 10–69.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> 80–100 pt
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> 70–79 pt
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> 10–69 pt
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3.5">
                {salesCategoryHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data performa KPI sesuai filter.
                  </div>
                ) : (
                  salesCategoryHistory.map((s) => {
                    const total = s.totalPeriods || 1;
                    const pct80 = (s.count80to100 / total) * 100;
                    const pct70 = (s.count70to79 / total) * 100;
                    const pct10 = (s.count10to69 / total) * 100;

                    return (
                      <div key={s.salesName} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{s.salesName}</span>
                            <span className="text-[10px] text-slate-500">({s.coverArea})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              Rerata: <strong className="text-indigo-950 font-black">{s.avgScore.toFixed(1)} pt</strong>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({s.totalPeriods} Periode)</span>
                          </div>
                        </div>

                        {/* Stacked Segment Bar */}
                        <div className="h-4 w-full bg-slate-200 rounded-lg overflow-hidden flex shadow-inner">
                          {s.count80to100 > 0 && (
                            <div
                              style={{ width: `${pct80}%` }}
                              className="bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center text-[10px] font-black text-white"
                              title={`Capai 80-100 Poin: ${s.count80to100} kali (${pct80.toFixed(0)}%)`}
                            >
                              {s.count80to100}x
                            </div>
                          )}
                          {s.count70to79 > 0 && (
                            <div
                              style={{ width: `${pct70}%` }}
                              className="bg-amber-400 hover:bg-amber-500 transition-all flex items-center justify-center text-[10px] font-black text-slate-900"
                              title={`Capai 70-79 Poin: ${s.count70to79} kali (${pct70.toFixed(0)}%)`}
                            >
                              {s.count70to79}x
                            </div>
                          )}
                          {s.count10to69 > 0 && (
                            <div
                              style={{ width: `${pct10}%` }}
                              className="bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center text-[10px] font-black text-white"
                              title={`Capai 10-69 Poin (SP1): ${s.count10to69} kali (${pct10.toFixed(0)}%)`}
                            >
                              {s.count10to69}x
                            </div>
                          )}
                        </div>

                        {/* Breakdown pills below bar */}
                        <div className="flex items-center justify-between text-[10px] mt-1.5 text-slate-500 font-medium">
                          <span className="text-emerald-700 font-semibold">
                            Reward: {s.count80to100}x (+{formatRupiah(s.totalIncentive)})
                          </span>
                          <span className="text-amber-800">
                            Aman: {s.count70to79}x
                          </span>
                          <span className={`font-semibold ${s.count10to69 > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                            SP1: {s.count10to69}x ({s.count10to69 > 0 ? `-${formatRupiah(s.totalPenalty)}` : 'Rp 0'})
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* GRAFIK 2: TREN SKOR KPI SALES ANTAR PERIODE BULAN */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Tren Skor KPI Sales Antar Periode Bulan
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Garis batas benchmark: <strong className="text-emerald-700">&ge;80 pt (Reward)</strong> &amp;{' '}
                    <strong className="text-rose-700">&lt;70 pt (Sanksi SP1)</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Batas 80pt
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    Batas 70pt
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {salesCategoryHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada riwayat performa KPI sesuai filter.
                  </div>
                ) : (
                  salesCategoryHistory.map((s) => {
                    return (
                      <div key={`trend-${s.salesName}`} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-extrabold text-slate-900">{s.salesName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${s.consistencyBadge}`}>
                            {s.consistencyStatus}
                          </span>
                        </div>

                        {/* Visual Trend Bars across months */}
                        <div className="grid grid-cols-3 gap-2">
                          {s.details.map((m) => {
                            const isReward = m.score >= 80;
                            const isAman = m.score >= 70 && m.score < 80;
                            const isSP1 = m.score < 70;

                            return (
                              <div
                                key={m.month}
                                className={`p-2 rounded-lg border text-center transition-all ${
                                  isReward
                                    ? 'bg-emerald-50/80 border-emerald-200'
                                    : isAman
                                    ? 'bg-amber-50/80 border-amber-200'
                                    : 'bg-rose-50/80 border-rose-200'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                                  {m.month.split(' ')[0]}
                                </span>
                                <div
                                  className={`text-base font-black font-mono mt-0.5 ${
                                    isReward ? 'text-emerald-900' : isAman ? 'text-amber-950' : 'text-rose-900'
                                  }`}
                                >
                                  {m.score} pt
                                </div>
                                <span
                                  className={`inline-block mt-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    isReward
                                      ? 'bg-emerald-200 text-emerald-900'
                                      : isAman
                                      ? 'bg-amber-200 text-amber-900'
                                      : 'bg-rose-200 text-rose-900'
                                  }`}
                                >
                                  Grade {m.grade} {m.isSp1 ? '• SP1' : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TABEL UTAMA: RIWAYAT PERFORMA KPI KATEGORI POIN SALES     */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  Tabel Agregasi Frekuensi Kategori Pencapaian Poin Sales
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Rincian akumulatif berapa kali sales mencapai poin 80–100, 70–79, dan 10–69 di setiap periode evaluasi.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Total Personil: <strong className="text-slate-900">{salesCategoryHistory.length} Sales</strong> |{' '}
                Evaluasi: <strong className="text-purple-700 font-bold">{filteredHistorySales.length} Rekap</strong>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Sales</th>
                    <th className="py-3 px-3">Area &amp; SPV</th>
                    <th className="py-3 px-3 text-center bg-emerald-50/60 text-emerald-900 font-black">
                      Capai 80–100 Poin
                    </th>
                    <th className="py-3 px-3 text-center bg-amber-50/60 text-amber-900 font-black">
                      Capai 70–79 Poin
                    </th>
                    <th className="py-3 px-3 text-center bg-rose-50/60 text-rose-900 font-black">
                      Capai 10–69 Poin
                    </th>
                    <th className="py-3 px-2 text-center font-bold">Total Periode</th>
                    <th className="py-3 px-3 text-center bg-purple-50/50 font-black text-purple-950">
                      Rerata Skor
                    </th>
                    <th className="py-3 px-3 text-center">Predikat Konsistensi</th>
                    <th className="py-3 px-3 text-right bg-emerald-50/30 text-emerald-900 font-black">
                      Total Insentif
                    </th>
                    <th className="py-3 px-3 text-right bg-rose-50/30 text-rose-900 font-black">
                      Total Denda SP1
                    </th>
                    <th className="py-3 px-3">Riwayat Skor Bulanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesCategoryHistory.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada riwayat performa yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    salesCategoryHistory.map((item, idx) => (
                      <tr key={item.salesName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900">{item.salesName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{item.coverArea}</div>
                          <div className="text-[10px] text-slate-500 font-mono">SPV: {item.spv}</div>
                        </td>

                        {/* Kategori 80-100 Poin */}
                        <td className="py-3 px-3 text-center bg-emerald-50/30">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                              item.count80to100 > 0
                                ? 'bg-emerald-500 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Award className="w-3 h-3" />
                            {item.count80to100}x
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                            {item.count80to100 > 0
                              ? `${((item.count80to100 / item.totalPeriods) * 100).toFixed(0)}% Capai`
                              : 'Belum capai'}
                          </span>
                        </td>

                        {/* Kategori 70-79 Poin */}
                        <td className="py-3 px-3 text-center bg-amber-50/30">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                              item.count70to79 > 0
                                ? 'bg-amber-400 text-slate-900 shadow-2xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {item.count70to79}x
                          </span>
                          <span className="block text-[10px] text-amber-800 font-semibold mt-0.5">
                            {item.count70to79 > 0
                              ? `${((item.count70to79 / item.totalPeriods) * 100).toFixed(0)}% Periode`
                              : '0x'}
                          </span>
                        </td>

                        {/* Kategori 10-69 Poin */}
                        <td className="py-3 px-3 text-center bg-rose-50/30">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black font-mono ${
                              item.count10to69 > 0
                                ? 'bg-rose-500 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            {item.count10to69}x
                          </span>
                          <span className={`block text-[10px] font-semibold mt-0.5 ${item.count10to69 > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'}`}>
                            {item.count10to69 > 0 ? `${item.count10to69}x Sanksi SP1` : '0x SP1 (Aman)'}
                          </span>
                        </td>

                        {/* Total Periode */}
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-700">
                          {item.totalPeriods} Bln
                        </td>

                        {/* Rata-rata Skor */}
                        <td className="py-3 px-3 text-center font-mono font-black text-sm bg-purple-50/50 text-purple-950">
                          {item.avgScore.toFixed(1)}
                        </td>

                        {/* Predikat Konsistensi */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${item.consistencyBadge}`}>
                            {item.consistencyStatus}
                          </span>
                        </td>

                        {/* Total Insentif */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                          {item.totalIncentive > 0 ? `+${formatRupiah(item.totalIncentive)}` : '-'}
                        </td>

                        {/* Total Denda */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 bg-rose-50/20">
                          {item.totalPenalty > 0 ? `-${formatRupiah(item.totalPenalty)}` : 'Rp 0'}
                        </td>

                        {/* Riwayat Skor Tiap Bulan */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.details.map((d) => (
                              <span
                                key={d.month}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                  d.score >= 80
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : d.score >= 70
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                                title={`${d.month}: ${d.score} pt (Grade ${d.grade})`}
                              >
                                {d.month.split(' ')[0]}: {d.score} pt
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TABEL RINCIAN RECORD BULANAN LENGKAP (COLLAPSIBLE / EDIT) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Rincian Detail Record Riwayat KPI Bulanan (Bisa Di-Edit &amp; Hapus)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Daftar transaksi evaluasi per bulan. Klik tombol Edit untuk mengubah realisasi, target, poin pilar, atau insentif.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailListExpanded(!isDetailListExpanded)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  {isDetailListExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Sembunyikan Detail Record</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Buka {filteredHistorySales.length} Detail Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isDetailListExpanded && (
              <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Periode Bulan</th>
                      <th className="py-3 px-3">Nama Sales</th>
                      <th className="py-3 px-3">Area &amp; SPV</th>
                      <th className="py-3 px-3 text-right">Target SO</th>
                      <th className="py-3 px-3 text-right">Realisasi SO</th>
                      <th className="py-3 px-2 text-center">% Capai</th>
                      <th className="py-3 px-2 text-center">SO (40)</th>
                      <th className="py-3 px-2 text-center">AR (30)</th>
                      <th className="py-3 px-2 text-center">Kunj (10)</th>
                      <th className="py-3 px-2 text-center">BA (10)</th>
                      <th className="py-3 px-2 text-center">Buf (10)</th>
                      <th className="py-3 px-3 text-center bg-purple-50/70 font-black text-purple-950">
                        Total Skor
                      </th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-right">Insentif KPI</th>
                      <th className="py-3 px-3 text-center">Status SP1</th>
                      <th className="py-3 px-3.5 text-right font-black text-slate-900 bg-slate-100">
                        Final Take Home Pay
                      </th>
                      <th className="py-3 px-3 text-center">Aksi Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistorySales.length === 0 ? (
                      <tr>
                        <td colSpan={18} className="py-12 text-center text-slate-400 font-medium">
                          Tidak ada riwayat performa KPI yang cocok dengan filter yang ditentukan.
                        </td>
                      </tr>
                    ) : (
                      filteredHistorySales.map((item, idx) => (
                        <tr
                          key={item.id || `${item.salesName}_${item.monthPeriod}`}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-[10px] border border-purple-200">
                              {item.monthPeriod}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900">{item.salesName}</div>
                            {item.notes && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={item.notes}>
                                {item.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-800">{item.coverArea}</div>
                            <div className="text-[10px] text-slate-500">SPV: {item.spv}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatRupiah(item.sellOutTarget)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.sellOutActual)}
                          </td>
                          <td className="py-3 px-2 text-center font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.sellOutAchievementPct >= 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.sellOutAchievementPct >= 80
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.sellOutAchievementPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono">{item.pointSellOut}</td>
                          <td className="py-3 px-2 text-center font-mono">{item.pointTagihan45H}</td>
                          <td className="py-3 px-2 text-center font-mono">{item.pointKunjungan}</td>
                          <td className="py-3 px-2 text-center font-mono">{item.pointMonitoringBa}</td>
                          <td className="py-3 px-2 text-center font-mono">{item.pointBufferStock}</td>
                          <td className="py-3 px-3 text-center font-mono font-black text-sm bg-purple-50/50 text-purple-950">
                            {item.totalScore}
                          </td>
                          <td className="py-3 px-3 text-center">{getGradeBadge(item.grade)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            {item.kpiIncentive > 0 ? `+${formatRupiah(item.kpiIncentive)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.hasSp1 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                                SP1
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Aman
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 bg-slate-100/60">
                            {formatRupiah(item.finalTakeHomePay)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                                title="Edit rekap KPI ini"
                              >
                                <Edit3 className="w-3 h-3 inline mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDuplicateToMonth(item)}
                                className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Duplikasi ke periode berikutnya"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(item)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Hapus rekapan ini"
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
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT MANUAL / OVERRIDE CAPAIAN KPI SALES           */}
      {/* ========================================================= */}
      {editingItem && livePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  Edit Evaluasi KPI: {editingItem.salesName}
                </h3>
                <span className="text-xs text-slate-500">
                  {editingItem.coverArea} | SPV: {editingItem.spv}
                </span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              {/* Periode Bulan */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Periode Bulan Record:
                </label>
                <input
                  type="text"
                  value={editMonthPeriod}
                  onChange={(e) => setEditMonthPeriod(e.target.value)}
                  placeholder="Contoh: OKTOBER 2026"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                  required
                />
              </div>

              {/* Pilar 1: Sell Out */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="font-bold text-blue-900 block mb-1">
                  Pilar 1: Poin Sell Out (Maks 40 Poin)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Target Sell Out (IDR)</label>
                    <input
                      type="number"
                      value={editSellOutTarget}
                      onChange={(e) => setEditSellOutTarget(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Realisasi Sell Out (IDR)</label>
                    <input
                      type="number"
                      value={editSellOutActual}
                      onChange={(e) => setEditSellOutActual(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-blue-800 font-mono mt-1 block">
                  Pencapaian: {livePreview.sellOutPct.toFixed(1)}% &rarr; Poin:{' '}
                  <strong>{livePreview.pointSellOut} pt</strong>
                </span>
              </div>

              {/* Pilar 2 & 3 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">Pilar 2: Tagihan 45H (Maks 30 pt)</span>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Jumlah Toko Up 45 Hari</label>
                  <input
                    type="number"
                    min={0}
                    value={editOverdueStores}
                    onChange={(e) => setEditOverdueStores(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-amber-800 font-mono mt-1 block">
                    Poin: <strong>{livePreview.pointTagihan45H} pt</strong>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200">
                  <span className="font-bold text-teal-900 block mb-1">Pilar 3: Kunjungan (Maks 10 pt)</span>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Jumlah Kunjungan Toko</label>
                  <input
                    type="number"
                    min={0}
                    value={editVisits}
                    onChange={(e) => setEditVisits(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-teal-800 font-mono mt-1 block">
                    Poin: <strong>{livePreview.pointKunjungan} pt</strong>
                  </span>
                </div>
              </div>

              {/* Pilar 4 & 5 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="font-bold text-purple-900 block mb-1">Pilar 4: Monitoring BA (Maks 10 pt)</span>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 block">% Report BA Weekly</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editBaReportWeekly}
                        onChange={(e) => setEditBaReportWeekly(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 block">% Tugas SO App</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editBaStockOpname}
                        onChange={(e) => setEditBaStockOpname(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-purple-800 font-mono mt-1 block">
                    Total Poin BA: <strong>{livePreview.pointMonitoringBa} pt</strong>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Pilar 5: Buffer Stock (Maks 10 pt)</span>
                  <label className="text-[11px] text-slate-600 block mb-0.5">% Toko Buffer App</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editBufferApp}
                    onChange={(e) => setEditBufferApp(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-emerald-800 font-mono mt-1 block">
                    Poin: <strong>{livePreview.pointBufferStock} pt</strong>
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Catatan Evaluasi / Keterangan:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan tambahan hasil evaluasi bulanan..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Live Preview Strip */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Skor &amp; Grade:</span>
                  <span className="text-base font-black text-amber-300">
                    {livePreview.totalScore} Poin &bull; Grade {livePreview.grade}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Estimasi THP Akhir:</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatRupiah(livePreview.finalTHP)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleResetToAuto(editingItem)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  Reset ke Hitungan Bawaan
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH DATA REKAP KPI PERIODE BARU                 */}
      {/* ========================================================= */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Tambah Rekapitulasi KPI Periode Baru
                </h3>
                <span className="text-xs text-slate-500">
                  Input data target &amp; capaian performa sales untuk evaluasi bulanan
                </span>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-3 mt-4 text-xs">
              {/* Identitas Sales & Periode */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Nama Personil Sales</label>
                  <input
                    type="text"
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    placeholder="Contoh: ILHAMSYAH"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Periode Bulan</label>
                  <input
                    type="text"
                    value={newMonthPeriod}
                    onChange={(e) => setNewMonthPeriod(e.target.value)}
                    placeholder="Contoh: NOVEMBER 2026"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Cover Area</label>
                  <input
                    type="text"
                    value={newCoverArea}
                    onChange={(e) => setNewCoverArea(e.target.value)}
                    placeholder="Contoh: AREA BARU"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Supervisor (SPV)</label>
                  <input
                    type="text"
                    value={newSpv}
                    onChange={(e) => setNewSpv(e.target.value)}
                    placeholder="Contoh: WIDODO"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Pilar 1: Target & Realisasi Sell Out */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="font-bold text-blue-900 block mb-1">
                  Pilar 1: Sell Out (Maks 40 Poin)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Target Sell Out (Rp)</label>
                    <input
                      type="number"
                      value={newSellOutTarget}
                      onChange={(e) => setNewSellOutTarget(Number(e.target.value))}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Realisasi Sell Out (Rp)</label>
                    <input
                      type="number"
                      value={newSellOutActual}
                      onChange={(e) => setNewSellOutActual(Number(e.target.value))}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-blue-800 font-mono mt-1 block">
                  Capai: {newLivePreview.sellOutPct.toFixed(1)}% &rarr; Poin: {newLivePreview.pointSellOut} pt
                </span>
              </div>

              {/* Pilar 2 & 3 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">Pilar 2: Tagihan 45H</span>
                  <label className="text-[10px] text-slate-600 block">Jml Toko Up 45 Hari</label>
                  <input
                    type="number"
                    min={0}
                    value={newOverdueStores}
                    onChange={(e) => setNewOverdueStores(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono"
                  />
                  <span className="text-[10px] text-amber-800 font-mono mt-0.5 block">
                    Poin: {newLivePreview.pointTagihan45H} pt
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200">
                  <span className="font-bold text-teal-900 block mb-1">Pilar 3: Kunjungan Toko</span>
                  <label className="text-[10px] text-slate-600 block">Jml Visit Toko</label>
                  <input
                    type="number"
                    min={0}
                    value={newVisits}
                    onChange={(e) => setNewVisits(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono"
                  />
                  <span className="text-[10px] text-teal-800 font-mono mt-0.5 block">
                    Poin: {newLivePreview.pointKunjungan} pt
                  </span>
                </div>
              </div>

              {/* Pilar 4 & 5 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="font-bold text-purple-900 block mb-1">Pilar 4: Monitoring BA</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-slate-500 block">% Weekly</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newBaReportWeekly}
                        onChange={(e) => setNewBaReportWeekly(Number(e.target.value))}
                        className="w-full px-1.5 py-1 rounded border border-slate-200 bg-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">% SO App</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newBaStockOpname}
                        onChange={(e) => setNewBaStockOpname(Number(e.target.value))}
                        className="w-full px-1.5 py-1 rounded border border-slate-200 bg-white font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-800 font-mono mt-0.5 block">
                    Poin: {newLivePreview.pointMonitoringBa} pt
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Pilar 5: Buffer Stock</span>
                  <label className="text-[10px] text-slate-600 block">% Toko Buffer App</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newBufferApp}
                    onChange={(e) => setNewBufferApp(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-200 bg-white font-mono"
                  />
                  <span className="text-[10px] text-emerald-800 font-mono mt-0.5 block">
                    Poin: {newLivePreview.pointBufferStock} pt
                  </span>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">Catatan Evaluasi:</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan hasil penilaian kinerja..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Live Preview Strip */}
              <div className="p-3 rounded-xl bg-slate-900 text-white font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Skor &amp; Grade:</span>
                  <span className="text-sm font-black text-amber-300">
                    {newLivePreview.totalScore} Poin &bull; Grade {newLivePreview.grade}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Insentif / Denda:</span>
                  <span className="text-sm font-black text-emerald-400">
                    {newLivePreview.kpiIncentive > 0
                      ? `+${formatRupiah(newLivePreview.kpiIncentive)}`
                      : newLivePreview.hasSp1
                      ? `-Rp 300.000 (SP1)`
                      : 'Rp 0'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Record Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
