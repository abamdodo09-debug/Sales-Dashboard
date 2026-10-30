import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  Users,
  Store,
  TrendingUp,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Percent,
  Search,
  ArrowUpDown,
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShieldCheck,
  Building2,
  Award,
  Edit3,
  X,
  AlertTriangle,
  Sparkles,
  Calendar,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters, SalesSalaryItem, BaSalaryItem, TrainerSalaryItem, KpiTrainerScorecardItem } from '../types/dashboard';
import { formatRupiah, formatNumber, formatPercent } from '../utils/analytics';
import { aggregateAreaCost, calculateSalesSalary, calculateBaSalary, calculateTrainerSalary, DEFAULT_TRAINERS_DATA } from '../utils/costCalculations';
import { loadKpiTrainerData } from '../services/kpiTrainerService';
import * as XLSX from 'xlsx';

// Helper to robustly parse date strings in either M/D/YYYY or YYYY-MM-DD
function parseRecordDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  const dt = new Date(trimmed);
  return isNaN(dt.getTime()) ? null : dt;
}

function getTrainerStatusBadge(status: 'insentif_500k' | 'insentif_300k' | 'aman' | 'denda_sp1') {
  switch (status) {
    case 'insentif_500k':
      return { label: 'Insentif +500rb (≥100%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'insentif_300k':
      return { label: 'Insentif +300rb (80-99%)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'aman':
      return { label: 'Aman (70-79%)', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'denda_sp1':
      return { label: 'SP1 & Denda -300rb (<70%)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}

function getTrainerKpiStatusBadge(status: 'insentif_2jt' | 'insentif_1jt' | 'insentif_500k' | 'aman' | 'denda_sp1', score?: number) {
  switch (status) {
    case 'insentif_2jt':
      return { label: 'Insentif +Rp 2.000.000 (100%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'insentif_1jt':
      return { label: 'Insentif +Rp 1.000.000 (90-99%)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'insentif_500k':
      return { label: 'Insentif +Rp 500.000 (80-89%)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'aman':
      return { label: 'Aman (70-79%)', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'denda_sp1':
      return { label: 'SP1 & Denda -Rp 300.000 (<70%)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}

interface CostAreaAnalysisProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
}

const STORAGE_KEY_SALES_TARGETS = 'salespro_custom_sales_targets';
const STORAGE_KEY_BA_NON_LAVOJOY = 'salespro_custom_ba_non_lavojoy_targets';
const STORAGE_KEY_BA_LAVOJOY = 'salespro_custom_ba_lavojoy_targets';
const STORAGE_KEY_SALES_BONUSES = 'salespro_custom_sales_bonuses';
const STORAGE_KEY_SALES_PENALTIES = 'salespro_custom_sales_penalties';
const STORAGE_KEY_TRAINER_FOCUS = 'salespro_custom_trainer_focus';
const STORAGE_KEY_TRAINER_INCENTIVES = 'salespro_custom_trainer_incentives';
const STORAGE_KEY_TRAINER_PENALTIES = 'salespro_custom_trainer_penalties';
const STORAGE_KEY_TRAINER_KPI_SCORES = 'salespro_custom_trainer_kpi_scores';
const STORAGE_KEY_TRAINER_KPI_INCENTIVES = 'salespro_custom_trainer_kpi_incentives';
const STORAGE_KEY_TRAINER_KPI_PENALTIES = 'salespro_custom_trainer_kpi_penalties';

export const CostAreaAnalysis: React.FC<CostAreaAnalysisProps> = ({ records, filters }) => {
  // Sub-tabs inside Cost Area
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sales' | 'ba' | 'trainer' | 'simulator'>('overview');

  // Target customization state with LocalStorage persistence
  const [defaultSalesTarget, setDefaultSalesTarget] = useState<number>(150000000); // 150 Jt default
  const [defaultBaNonLavojoyTarget, setDefaultBaNonLavojoyTarget] = useState<number>(30000000); // 30 Jt default
  const [defaultBaLavojoyTarget, setDefaultBaLavojoyTarget] = useState<number>(5000000); // 5 Jt default

  const [customSalesTargets, setCustomSalesTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES_TARGETS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customBaNonLavojoyTargets, setCustomBaNonLavojoyTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BA_NON_LAVOJOY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customBaLavojoyTargets, setCustomBaLavojoyTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BA_LAVOJOY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customSalesBonuses, setCustomSalesBonuses] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES_BONUSES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customSalesPenalties, setCustomSalesPenalties] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES_PENALTIES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerFocusTargets, setCustomTrainerFocusTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_FOCUS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerIncentives, setCustomTrainerIncentives] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_INCENTIVES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerPenalties, setCustomTrainerPenalties] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_PENALTIES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerKpiScores, setCustomTrainerKpiScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_KPI_SCORES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerKpiIncentives, setCustomTrainerKpiIncentives] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_KPI_INCENTIVES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTrainerKpiPenalties, setCustomTrainerKpiPenalties] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRAINER_KPI_PENALTIES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save to LocalStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SALES_TARGETS, JSON.stringify(customSalesTargets));
      localStorage.setItem(STORAGE_KEY_BA_NON_LAVOJOY, JSON.stringify(customBaNonLavojoyTargets));
      localStorage.setItem(STORAGE_KEY_BA_LAVOJOY, JSON.stringify(customBaLavojoyTargets));
      localStorage.setItem(STORAGE_KEY_SALES_BONUSES, JSON.stringify(customSalesBonuses));
      localStorage.setItem(STORAGE_KEY_SALES_PENALTIES, JSON.stringify(customSalesPenalties));
      localStorage.setItem(STORAGE_KEY_TRAINER_FOCUS, JSON.stringify(customTrainerFocusTargets));
      localStorage.setItem(STORAGE_KEY_TRAINER_INCENTIVES, JSON.stringify(customTrainerIncentives));
      localStorage.setItem(STORAGE_KEY_TRAINER_PENALTIES, JSON.stringify(customTrainerPenalties));
      localStorage.setItem(STORAGE_KEY_TRAINER_KPI_SCORES, JSON.stringify(customTrainerKpiScores));
      localStorage.setItem(STORAGE_KEY_TRAINER_KPI_INCENTIVES, JSON.stringify(customTrainerKpiIncentives));
      localStorage.setItem(STORAGE_KEY_TRAINER_KPI_PENALTIES, JSON.stringify(customTrainerKpiPenalties));
    } catch {
      // ignore storage error
    }
  }, [
    customSalesTargets,
    customBaNonLavojoyTargets,
    customBaLavojoyTargets,
    customSalesBonuses,
    customSalesPenalties,
    customTrainerFocusTargets,
    customTrainerIncentives,
    customTrainerPenalties,
    customTrainerKpiScores,
    customTrainerKpiIncentives,
    customTrainerKpiPenalties,
  ]);

  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(true);

  // Search & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'total' | 'actual' | 'achievement' | 'incentive'>('total');
  const [sortAsc, setSortAsc] = useState(false);

  // Date Range filter specifically for BA (Toko ber-BA)
  const [baStartDate, setBaStartDate] = useState<string>('');
  const [baEndDate, setBaEndDate] = useState<string>('');

  // Date Range filter specifically for Trainer
  const [trainerStartDate, setTrainerStartDate] = useState<string>('');
  const [trainerEndDate, setTrainerEndDate] = useState<string>('');

  // Month Period filter specifically for Trainer (Hubungan dengan Scorecard KPI Trainer)
  const [trainerMonthPeriod, setTrainerMonthPeriod] = useState<string>(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      return filters.BULAN.toUpperCase().includes('2026')
        ? filters.BULAN.toUpperCase()
        : `${filters.BULAN.toUpperCase()} 2026`;
    }
    return 'OKTOBER 2026';
  });

  // Available month periods for Trainer KPI from scorecard data
  const availableTrainerMonths = useMemo(() => {
    try {
      const kpiItems = loadKpiTrainerData();
      const set = new Set<string>();
      kpiItems.forEach((it: KpiTrainerScorecardItem) => {
        if (it.monthPeriod) set.add(it.monthPeriod);
      });
      ['OKTOBER 2026', 'SEPTEMBER 2026', 'AGUSTUS 2026'].forEach((m) => set.add(m));
      return Array.from(set);
    } catch {
      return ['OKTOBER 2026', 'SEPTEMBER 2026', 'AGUSTUS 2026'];
    }
  }, []);

  // Modal State for Editing BA Targets
  const [editingBa, setEditingBa] = useState<BaSalaryItem | null>(null);
  const [editBaNonLavojoyTarget, setEditBaNonLavojoyTarget] = useState<number>(30000000);
  const [editBaLavojoyTarget, setEditBaLavojoyTarget] = useState<number>(5000000);

  // Modal State for Editing Sales Target & Productivity Overrides
  const [editingSales, setEditingSales] = useState<SalesSalaryItem | null>(null);
  const [editSalesTarget, setEditSalesTarget] = useState<number>(150000000);
  const [editSalesBonus, setEditSalesBonus] = useState<number>(0);
  const [editSalesPenalty, setEditSalesPenalty] = useState<number>(0);

  // Modal State for Editing Trainer (Target Fokus & Poin KPI Trainer)
  const [editingTrainer, setEditingTrainer] = useState<TrainerSalaryItem | null>(null);
  const [editTrainerFocusTarget, setEditTrainerFocusTarget] = useState<number>(500);
  const [editTrainerFocusActual, setEditTrainerFocusActual] = useState<number>(480);
  const [editTrainerIncentive, setEditTrainerIncentive] = useState<number | null>(null);
  const [editTrainerPenalty, setEditTrainerPenalty] = useState<number | null>(null);
  const [editTrainerKpiScore, setEditTrainerKpiScore] = useState<number>(85);
  const [editTrainerKpiIncentive, setEditTrainerKpiIncentive] = useState<number | null>(null);
  const [editTrainerKpiPenalty, setEditTrainerKpiPenalty] = useState<number | null>(null);
  const [editTrainerNotes, setEditTrainerNotes] = useState<string>('');

  // Interactive Simulator State
  const [simRole, setSimRole] = useState<'sales' | 'ba' | 'trainer'>('ba');
  const [simTarget, setSimTarget] = useState<number>(150000000);
  const [simActual, setSimActual] = useState<number>(145000000);

  // Simulator BA Specific State
  const [simBaNonLavojoyActual, setSimBaNonLavojoyActual] = useState<number>(36000000);
  const [simBaNonLavojoyTarget, setSimBaNonLavojoyTarget] = useState<number>(30000000);
  const [simBaLavojoyActual, setSimBaLavojoyActual] = useState<number>(6000000);
  const [simBaLavojoyTarget, setSimBaLavojoyTarget] = useState<number>(5000000);

  // Simulator Trainer Specific State
  const [simTrainerFocusTarget, setSimTrainerFocusTarget] = useState<number>(500);
  const [simTrainerFocusActual, setSimTrainerFocusActual] = useState<number>(480);
  const [simTrainerKpiScore, setSimTrainerKpiScore] = useState<number>(95);

  // Calculate aggregated area cost
  const costSummary = useMemo(() => {
    return aggregateAreaCost(
      records,
      customSalesTargets,
      customBaNonLavojoyTargets,
      customBaLavojoyTargets,
      customSalesBonuses,
      customSalesPenalties,
      defaultSalesTarget,
      defaultBaNonLavojoyTarget,
      defaultBaLavojoyTarget,
      undefined,
      undefined,
      customTrainerFocusTargets,
      customTrainerIncentives,
      customTrainerPenalties,
      customTrainerKpiScores,
      customTrainerKpiIncentives,
      customTrainerKpiPenalties,
      trainerMonthPeriod
    );
  }, [
    records,
    customSalesTargets,
    customBaNonLavojoyTargets,
    customBaLavojoyTargets,
    customSalesBonuses,
    customSalesPenalties,
    defaultSalesTarget,
    defaultBaNonLavojoyTarget,
    defaultBaLavojoyTarget,
    customTrainerFocusTargets,
    customTrainerIncentives,
    customTrainerPenalties,
    customTrainerKpiScores,
    customTrainerKpiIncentives,
    customTrainerKpiPenalties,
    trainerMonthPeriod,
  ]);

  // Filtered records for BA date range
  const effectiveBaRecords = useMemo(() => {
    if (!baStartDate && !baEndDate) return records;
    const start = baStartDate ? new Date(`${baStartDate}T00:00:00`) : null;
    const end = baEndDate ? new Date(`${baEndDate}T23:59:59`) : null;

    return records.filter((r) => {
      const d = parseRecordDate(r.TANGGAL);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [records, baStartDate, baEndDate]);

  // BA specific cost summary calculated from date-filtered transactions
  const baCostSummary = useMemo(() => {
    return aggregateAreaCost(
      effectiveBaRecords,
      customSalesTargets,
      customBaNonLavojoyTargets,
      customBaLavojoyTargets,
      customSalesBonuses,
      customSalesPenalties,
      defaultSalesTarget,
      defaultBaNonLavojoyTarget,
      defaultBaLavojoyTarget,
      undefined,
      undefined,
      customTrainerFocusTargets,
      customTrainerIncentives,
      customTrainerPenalties,
      customTrainerKpiScores,
      customTrainerKpiIncentives,
      customTrainerKpiPenalties,
      trainerMonthPeriod
    );
  }, [
    effectiveBaRecords,
    customSalesTargets,
    customBaNonLavojoyTargets,
    customBaLavojoyTargets,
    customSalesBonuses,
    customSalesPenalties,
    defaultSalesTarget,
    defaultBaNonLavojoyTarget,
    defaultBaLavojoyTarget,
    customTrainerFocusTargets,
    customTrainerIncentives,
    customTrainerPenalties,
    customTrainerKpiScores,
    customTrainerKpiIncentives,
    customTrainerKpiPenalties,
    trainerMonthPeriod,
  ]);

  // Filtered records for Trainer date range
  const effectiveTrainerRecords = useMemo(() => {
    if (!trainerStartDate && !trainerEndDate) return records;
    const start = trainerStartDate ? new Date(`${trainerStartDate}T00:00:00`) : null;
    const end = trainerEndDate ? new Date(`${trainerEndDate}T23:59:59`) : null;

    return records.filter((r) => {
      const d = parseRecordDate(r.TANGGAL);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [records, trainerStartDate, trainerEndDate]);

  // Trainer specific cost summary calculated from date-filtered transactions
  const trainerCostSummary = useMemo(() => {
    return aggregateAreaCost(
      effectiveTrainerRecords,
      customSalesTargets,
      customBaNonLavojoyTargets,
      customBaLavojoyTargets,
      customSalesBonuses,
      customSalesPenalties,
      defaultSalesTarget,
      defaultBaNonLavojoyTarget,
      defaultBaLavojoyTarget,
      undefined,
      undefined,
      customTrainerFocusTargets,
      customTrainerIncentives,
      customTrainerPenalties,
      customTrainerKpiScores,
      customTrainerKpiIncentives,
      customTrainerKpiPenalties,
      trainerMonthPeriod
    );
  }, [
    effectiveTrainerRecords,
    customSalesTargets,
    customBaNonLavojoyTargets,
    customBaLavojoyTargets,
    customSalesBonuses,
    customSalesPenalties,
    defaultSalesTarget,
    defaultBaNonLavojoyTarget,
    defaultBaLavojoyTarget,
    customTrainerFocusTargets,
    customTrainerIncentives,
    customTrainerPenalties,
    customTrainerKpiScores,
    customTrainerKpiIncentives,
    customTrainerKpiPenalties,
    trainerMonthPeriod,
  ]);

  // Simulator result calculation
  const simSalesResult = useMemo(() => {
    return calculateSalesSalary('Simulasi Sales', simActual, simTarget, 'Area Simulasi', 'SPV Area');
  }, [simActual, simTarget]);

  const simBaResult = useMemo(() => {
    return calculateBaSalary(
      'Simulasi BA',
      'BA-SIM',
      'Toko Simulasi',
      simBaNonLavojoyActual,
      simBaLavojoyActual,
      simBaNonLavojoyTarget,
      simBaLavojoyTarget,
      'Area Simulasi',
      'Region Simulasi'
    );
  }, [simBaNonLavojoyActual, simBaLavojoyActual, simBaNonLavojoyTarget, simBaLavojoyTarget]);

  const simTrainerResult = useMemo(() => {
    return calculateTrainerSalary(
      'Simulasi Trainer',
      simTrainerFocusTarget,
      simTrainerFocusActual,
      'Area Simulasi',
      'Region Simulasi',
      0,
      350000000,
      undefined,
      undefined,
      undefined,
      simTrainerKpiScore,
      undefined,
      undefined,
      trainerMonthPeriod
    );
  }, [simTrainerFocusTarget, simTrainerFocusActual, simTrainerKpiScore, trainerMonthPeriod]);

  // Filtered & Sorted Sales List
  const filteredSalesList = useMemo(() => {
    let list = costSummary.salesList.filter((s) =>
      s.salesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.coverArea.toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'total') {
        valA = a.totalSalary;
        valB = b.totalSalary;
      } else if (sortField === 'actual') {
        valA = a.sellInActual;
        valB = b.sellInActual;
      } else if (sortField === 'achievement') {
        valA = a.achievementPercent;
        valB = b.achievementPercent;
      } else if (sortField === 'incentive') {
        valA = a.incentiveNominal + a.baProductivityBonus - a.baProductivityPenalty;
        valB = b.incentiveNominal + b.baProductivityBonus - b.baProductivityPenalty;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [costSummary.salesList, searchQuery, sortField, sortAsc]);

  // Filtered & Sorted BA List (Using baCostSummary which respects date range)
  const filteredBaList = useMemo(() => {
    let list = baCostSummary.baList.filter((b) =>
      b.baName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.coverArea.toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'total') {
        valA = a.totalSalary;
        valB = b.totalSalary;
      } else if (sortField === 'actual') {
        valA = a.sellOutActual;
        valB = b.sellOutActual;
      } else if (sortField === 'achievement') {
        valA = a.achievementPercent;
        valB = b.achievementPercent;
      } else if (sortField === 'incentive') {
        valA = a.totalIncentiveNominal;
        valB = b.totalIncentiveNominal;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [baCostSummary.baList, searchQuery, sortField, sortAsc]);

  // Filtered & Sorted Trainer List
  const filteredTrainerList = useMemo(() => {
    let list = (trainerCostSummary.trainerList || []).filter((t) =>
      t.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.areaCovered.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'total') {
        valA = a.totalSalary;
        valB = b.totalSalary;
      } else if (sortField === 'actual') {
        valA = a.focusActualPcs;
        valB = b.focusActualPcs;
      } else if (sortField === 'achievement') {
        valA = a.focusAchievementPct;
        valB = b.focusAchievementPct;
      } else if (sortField === 'incentive') {
        valA = a.focusIncentive - a.focusPenalty;
        valB = b.focusIncentive - b.focusPenalty;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [trainerCostSummary.trainerList, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Open BA Edit Modal
  const handleOpenEditBa = (ba: BaSalaryItem) => {
    setEditingBa(ba);
    setEditBaNonLavojoyTarget(ba.targetNonLavojoy);
    setEditBaLavojoyTarget(ba.targetLavojoy);
  };

  // Save BA Edit
  const handleSaveEditBa = () => {
    if (!editingBa) return;
    setCustomBaNonLavojoyTargets((prev) => ({
      ...prev,
      [editingBa.storeName]: editBaNonLavojoyTarget,
    }));
    setCustomBaLavojoyTargets((prev) => ({
      ...prev,
      [editingBa.storeName]: editBaLavojoyTarget,
    }));
    setEditingBa(null);
  };

  // Open Sales Edit Modal
  const handleOpenEditSales = (sales: SalesSalaryItem) => {
    setEditingSales(sales);
    setEditSalesTarget(sales.sellInTarget);
    setEditSalesBonus(sales.baProductivityBonus);
    setEditSalesPenalty(sales.baProductivityPenalty);
  };

  // Save Sales Edit
  const handleSaveEditSales = () => {
    if (!editingSales) return;
    setCustomSalesTargets((prev) => ({
      ...prev,
      [editingSales.salesName]: editSalesTarget,
    }));
    setCustomSalesBonuses((prev) => ({
      ...prev,
      [editingSales.salesName]: editSalesBonus,
    }));
    setCustomSalesPenalties((prev) => ({
      ...prev,
      [editingSales.salesName]: editSalesPenalty,
    }));
    setEditingSales(null);
  };

  // Open Trainer Edit Modal
  const handleOpenEditTrainer = (trainer: TrainerSalaryItem) => {
    setEditingTrainer(trainer);
    setEditTrainerFocusTarget(trainer.focusTargetPcs);
    setEditTrainerFocusActual(trainer.focusActualPcs);
    setEditTrainerIncentive(trainer.focusIncentive);
    setEditTrainerPenalty(trainer.focusPenalty);
    setEditTrainerKpiScore(trainer.kpiScore ?? 85);
    setEditTrainerKpiIncentive(trainer.kpiIncentive ?? null);
    setEditTrainerKpiPenalty(trainer.kpiPenalty ?? null);
    setEditTrainerNotes(trainer.notes || '');
  };

  // Save Trainer Edit
  const handleSaveEditTrainer = () => {
    if (!editingTrainer) return;
    setCustomTrainerFocusTargets((prev) => ({
      ...prev,
      [editingTrainer.trainerName]: editTrainerFocusTarget,
    }));
    if (editTrainerIncentive !== null) {
      setCustomTrainerIncentives((prev) => ({
        ...prev,
        [editingTrainer.trainerName]: editTrainerIncentive,
      }));
    }
    if (editTrainerPenalty !== null) {
      setCustomTrainerPenalties((prev) => ({
        ...prev,
        [editingTrainer.trainerName]: editTrainerPenalty,
      }));
    }
    setCustomTrainerKpiScores((prev) => ({
      ...prev,
      [editingTrainer.trainerName]: editTrainerKpiScore,
    }));
    if (editTrainerKpiIncentive !== null) {
      setCustomTrainerKpiIncentives((prev) => ({
        ...prev,
        [editingTrainer.trainerName]: editTrainerKpiIncentive,
      }));
    }
    if (editTrainerKpiPenalty !== null) {
      setCustomTrainerKpiPenalties((prev) => ({
        ...prev,
        [editingTrainer.trainerName]: editTrainerKpiPenalty,
      }));
    }
    setEditingTrainer(null);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Cost Area
    const summaryData = [
      ['LAPORAN ESTIMASI COST AREA (GAJI & INSENTIF KARYAWAN)'],
      ['Tanggal Cetak:', new Date().toLocaleString('id-ID')],
      ['Filter Bulan:', filters.BULAN],
      ['Filter Tahun:', filters.TAHUN],
      ['Filter Region:', filters.REGION],
      [''],
      ['KOMPONEN BIAYA', 'NOMINAL (IDR)', 'KETERANGAN'],
      ['Total Estimasi Cost Area', costSummary.totalCost, 'Total Beban Gaji & Insentif (Sales + BA + Trainer)'],
      ['Total Biaya Sales', costSummary.totalSalesCost, `${costSummary.salesCount} Personil Sales`],
      ['  - Gaji Pokok Sales', costSummary.totalSalesBase, 'Rp 4.900.000 / personil'],
      ['  - Insentif & Penalti Sales', costSummary.totalSalesIncentive, 'Sell In (0.2%-4%) & Insentif/Denda Prod BA'],
      ['Total Biaya BA Toko', costSummary.totalBaCost, `${costSummary.baCount} Toko Ber-BA`],
      ['  - Gaji Pokok BA', costSummary.totalBaBase, 'Berdasarkan pencapaian Sell Out Non-Lavojoy'],
      ['  - Insentif BA (Non-Lavojoy + Lavojoy 4%)', costSummary.totalBaIncentive, 'Insentif Non-Lavojoy + 4% Lavojoy'],
      ['Total Biaya Trainer', costSummary.totalTrainerCost || 0, `${costSummary.trainerCount || 4} Personil Trainer`],
      ['  - Gaji Pokok Trainer', costSummary.totalTrainerBase || 0, 'Rp 3.900.000 / personil'],
      ['  - Tunjangan Transportasi Trainer', costSummary.totalTrainerTransport || 0, 'Rp 500.000 / personil dalam kota'],
      ['  - Insentif Produk Fokus Trainer', costSummary.totalTrainerFocusIncentive || 0, '≥100%: +500rb, 80-99%: +300rb'],
      ['  - Denda Produk Fokus Trainer', costSummary.totalTrainerFocusPenalty || 0, '<70%: Denda -300rb & SP1'],
      ['  - Insentif Poin KPI Trainer', costSummary.totalTrainerKpiIncentive || 0, '100%: +2Jt, 90-99%: +1Jt, 80-89%: +500rb'],
      ['  - Denda Poin KPI Trainer', costSummary.totalTrainerKpiPenalty || 0, '<70%: Denda -300rb & SP1'],
      ['Total Omset Area', costSummary.totalAreaRevenue, 'Realisasi Penjualan'],
      ['Rasio Cost terhadap Omset', `${costSummary.costToRevenueRatio.toFixed(2)}%`, 'Efisiensi Beban Tenaga Kerja'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Cost');

    // Sheet 2: Gaji Sales
    const salesHeader = [
      'No',
      'Nama Sales',
      'Area',
      'SPV',
      'Target Sell In',
      'Realisasi Sell In',
      '% Pencapaian',
      'Gaji Pokok',
      'Insentif Sell In',
      'Bonus Produktivitas BA',
      'Denda Produktivitas BA',
      'Status SP1',
      'Total Gaji (THP)',
    ];
    const salesRows = costSummary.salesList.map((s, idx) => [
      idx + 1,
      s.salesName,
      s.coverArea,
      s.spv,
      s.sellInTarget,
      s.sellInActual,
      Number(s.achievementPercent.toFixed(2)),
      s.baseSalary,
      s.incentiveNominal,
      s.baProductivityBonus,
      s.baProductivityPenalty,
      s.baProductivitySpCount > 0 ? `SP1 (${s.baProductivitySpCount} BA <35Jt)` : 'AMAN',
      s.totalSalary,
    ]);
    const wsSales = XLSX.utils.aoa_to_sheet([salesHeader, ...salesRows]);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Gaji Sales (Sell In)');

    // Sheet 3: Gaji BA Toko
    const baHeader = [
      'No',
      'Nama BA',
      'No BA',
      'Nama Toko',
      'Area / Region',
      'Sales Cover',
      'Target Non-Lavojoy',
      'Sell Out Non-Lavojoy',
      '% Capai Non-Lavojoy',
      'Gaji Pokok Non-Lavojoy',
      'Insentif Non-Lavojoy',
      'Target Lavojoy',
      'Sell Out Lavojoy',
      '% Capai Lavojoy',
      'Insentif Lavojoy (4%)',
      'Total Sell Out Gerai',
      'Total Gaji (THP)',
    ];
    const baRows = costSummary.baList.map((b, idx) => [
      idx + 1,
      b.baName,
      b.baNumber,
      b.storeName,
      `${b.coverArea} (${b.region})`,
      b.salesName,
      b.targetNonLavojoy,
      b.sellOutNonLavojoy,
      Number(b.achievementNonLavojoyPercent.toFixed(2)),
      b.baseSalary,
      b.incentiveNonLavojoyNominal,
      b.targetLavojoy,
      b.sellOutLavojoy,
      Number(b.achievementLavojoyPercent.toFixed(2)),
      b.incentiveLavojoyNominal,
      b.sellOutActual,
      b.totalSalary,
    ]);
    const wsBa = XLSX.utils.aoa_to_sheet([baHeader, ...baRows]);
    XLSX.utils.book_append_sheet(wb, wsBa, 'Gaji BA (Sell Out)');

    // Sheet 4: Gaji Trainer (Produk Fokus & KPI 100 Poin)
    const trainerHeader = [
      'No',
      'Nama Trainer',
      'Area Cover',
      'Region',
      'Periode Bulan',
      'Poin KPI Trainer',
      'Status Poin KPI',
      'Insentif KPI',
      'Denda KPI (SP1)',
      'Target Produk Fokus (Pcs)',
      'Realisasi Produk Fokus (Pcs)',
      '% Capai Produk Fokus',
      'Status Fokus',
      'Gaji Pokok',
      'Tunjangan Transportasi',
      'Insentif Produk Fokus',
      'Denda Produk Fokus (SP1)',
      'Total Gaji (THP)',
    ];
    const trainerRows = (trainerCostSummary.trainerList || []).map((t, idx) => [
      idx + 1,
      t.trainerName,
      t.areaCovered,
      t.region,
      t.monthPeriod || trainerMonthPeriod,
      t.kpiScore ?? 85,
      t.kpiStatus === 'insentif_2jt'
        ? 'Insentif Rp 2.000.000 (100%)'
        : t.kpiStatus === 'insentif_1jt'
        ? 'Insentif Rp 1.000.000 (90-99%)'
        : t.kpiStatus === 'insentif_500k'
        ? 'Insentif Rp 500.000 (80-89%)'
        : t.kpiStatus === 'aman'
        ? 'Aman (70-79%)'
        : 'SP1 & Denda Rp 300.000 (<70%)',
      t.kpiIncentive,
      t.kpiPenalty,
      t.focusTargetPcs,
      t.focusActualPcs,
      Number(t.focusAchievementPct.toFixed(2)),
      t.focusStatus === 'insentif_500k'
        ? 'Insentif Rp 500.000 (≥100%)'
        : t.focusStatus === 'insentif_300k'
        ? 'Insentif Rp 300.000 (80-99%)'
        : t.focusStatus === 'aman'
        ? 'Aman (70-79%)'
        : 'SP1 & Denda Rp 300.000 (<70%)',
      t.baseSalary,
      t.transportAllowance,
      t.focusIncentive,
      t.focusPenalty,
      t.totalSalary,
    ]);
    const wsTrainer = XLSX.utils.aoa_to_sheet([trainerHeader, ...trainerRows]);
    XLSX.utils.book_append_sheet(wb, wsTrainer, 'Gaji Trainer (Fokus & KPI)');

    XLSX.writeFile(
      wb,
      `Laporan_Estimasi_Cost_Area_${filters.BULAN}_${filters.TAHUN}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-white via-indigo-50/20 via-teal-50/20 to-emerald-50/20 rounded-2xl border border-indigo-200/80 shadow-sm p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-indigo-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-teal-600 to-emerald-600 text-white shadow-md shadow-indigo-600/20">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Estimasi Cost Area (Gaji &amp; Insentif Karyawan Terpadu)
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Kalkulasi gaji Sales (Sell In + Insentif/Denda Produktivitas BA) dan BA Toko Multi-Brand (Non-Lavojoy + Skema Khusus Lavojoy 4%)
            </p>
          </div>

          {/* Quick Actions: Export & Target Setting */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsSettingOpen(!isSettingOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Atur Target Standar</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Target Settings Drawer (Collapsible) */}
        {isSettingOpen && (
          <div className="mt-4 p-4 rounded-xl bg-white/95 border border-indigo-200 shadow-inner grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Target Standar Sell In Sales (Rp)
              </label>
              <input
                type="number"
                step="5000000"
                value={defaultSalesTarget}
                onChange={(e) => setDefaultSalesTarget(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Format: {formatRupiah(defaultSalesTarget)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Target Standar Non-Lavojoy BA (Rp)
              </label>
              <input
                type="number"
                step="2500000"
                value={defaultBaNonLavojoyTarget}
                onChange={(e) => setDefaultBaNonLavojoyTarget(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Format: {formatRupiah(defaultBaNonLavojoyTarget)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Target Standar Lavojoy BA (Rp)
              </label>
              <input
                type="number"
                step="1000000"
                value={defaultBaLavojoyTarget}
                onChange={(e) => setDefaultBaLavojoyTarget(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Format: {formatRupiah(defaultBaLavojoyTarget)} (Syarat 4%)
              </span>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setDefaultSalesTarget(150000000);
                  setDefaultBaNonLavojoyTarget(30000000);
                  setDefaultBaLavojoyTarget(5000000);
                  setCustomSalesTargets({});
                  setCustomBaNonLavojoyTargets({});
                  setCustomBaLavojoyTargets({});
                  setCustomSalesBonuses({});
                  setCustomSalesPenalties({});
                  localStorage.removeItem(STORAGE_KEY_SALES_TARGETS);
                  localStorage.removeItem(STORAGE_KEY_BA_NON_LAVOJOY);
                  localStorage.removeItem(STORAGE_KEY_BA_LAVOJOY);
                  localStorage.removeItem(STORAGE_KEY_SALES_BONUSES);
                  localStorage.removeItem(STORAGE_KEY_SALES_PENALTIES);
                }}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset Semua Target Bawaan
              </button>
            </div>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Total Cost Area */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Estimasi Cost Area
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {formatRupiah(costSummary.totalCost)}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-2">
              <span>Rasio vs Omset:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  costSummary.costToRevenueRatio <= 15
                    ? 'bg-emerald-100 text-emerald-800'
                    : costSummary.costToRevenueRatio <= 25
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {costSummary.costToRevenueRatio.toFixed(1)}% ({costSummary.costToRevenueRatio <= 15 ? 'Efisien' : 'Wajar'})
              </span>
            </div>
          </div>

          {/* Card 2: Cost Sales */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
              Beban Gaji &amp; Insentif Sales
            </span>
            <div className="text-2xl font-black text-indigo-950 font-mono tabular-nums">
              {formatRupiah(costSummary.totalSalesCost)}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-mono">
              <span>Pokok: {formatRupiah(costSummary.totalSalesBase, true)}</span>
              <span className="text-indigo-600 font-bold">
                Insentif/Denda: {formatRupiah(costSummary.totalSalesIncentive, true)}
              </span>
            </div>
          </div>

          {/* Card 3: Cost BA */}
          <div className="bg-white p-4 rounded-xl border border-teal-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
              Beban Gaji &amp; Insentif BA Toko
            </span>
            <div className="text-2xl font-black text-teal-950 font-mono tabular-nums">
              {formatRupiah(costSummary.totalBaCost)}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-mono">
              <span>Pokok: {formatRupiah(costSummary.totalBaBase, true)}</span>
              <span className="text-teal-600 font-bold">
                Insentif: {formatRupiah(costSummary.totalBaIncentive, true)}
              </span>
            </div>
          </div>

          {/* Card 4: Cost Trainer */}
          <div className="bg-white p-4 rounded-xl border border-purple-200/90 shadow-xs hover:-translate-y-0.5 transition-all">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
              Beban Gaji &amp; Insentif Trainer
            </span>
            <div className="text-2xl font-black text-purple-950 font-mono tabular-nums">
              {formatRupiah(costSummary.totalTrainerCost || 0)}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1 font-mono">
              <div className="flex items-center justify-between">
                <span>Pokok+Transport: {formatRupiah((costSummary.totalTrainerBase || 0) + (costSummary.totalTrainerTransport || 0), true)}</span>
                <span className="text-purple-600 font-bold">
                  Fokus: {formatRupiah((costSummary.totalTrainerFocusIncentive || 0) - (costSummary.totalTrainerFocusPenalty || 0), true)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-100">
                <span className="text-emerald-700 font-bold">
                  Insentif KPI: +{formatRupiah(costSummary.totalTrainerKpiIncentive || 0, true)}
                </span>
                {(costSummary.totalTrainerKpiPenalty || 0) > 0 && (
                  <span className="text-rose-600 font-bold">
                    Denda KPI: -{formatRupiah(costSummary.totalTrainerKpiPenalty || 0, true)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SKEMA RESMI PERHITUNGAN (Banner Informatif Rapi) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFormulaGuide(!showFormulaGuide)}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Formula &amp; Ketentuan Resmi Gaji, Insentif &amp; Penalti Perusahaan
            </h3>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {showFormulaGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFormulaGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-100">
            {/* Skema 1: SALES */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                  1. Skema Sales (Sell In &amp; Produktivitas BA)
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-700">·</span>
                  <span>
                    <strong>Gaji Pokok:</strong> Rp 4.900.000 / personil.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-indigo-700">·</span>
                  <span>
                    <strong>Insentif Sell In:</strong> Capai <strong>≥ 100%</strong> (<strong>4%</strong> × Realisasi Sell In) | 80%-99% (<strong>0,2%</strong> × Sell In) | &lt; 80% (0%).
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-emerald-800 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Insentif Produktivitas BA yang Dicover:</strong>
                    <br />• BA Sell Out <strong>Rp 45 Jt – Rp 54 Jt:</strong> Bonus <strong>+Rp 500.000</strong> per BA
                    <br />• BA Sell Out <strong>≥ Rp 55 Jt:</strong> Bonus <strong>+Rp 1.000.000</strong> per BA
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-rose-800 bg-rose-50/60 p-1.5 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Denda Produktivitas BA:</strong> Jika Sell Out BA <strong>&lt; Rp 35.000.000</strong>, sales yang meng-cover dikenakan <strong>SP1</strong> &amp; <strong>Denda -Rp 300.000</strong>.
                  </span>
                </li>
              </ul>
            </div>

            {/* Skema 2: BA TOKO */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-50/60 to-white border border-teal-200">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-black text-teal-950 uppercase tracking-wide">
                  2. Skema Beauty Advisor Toko (1 BA Multi-Brand)
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="text-[11px] text-teal-900 bg-teal-50 p-1 rounded-md font-semibold">
                  * 1 BA melayani seluruh brand di toko (tidak ada BA Lavojoy terpisah; perhitungan dipisah per kelompok brand).
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-teal-700">·</span>
                  <span>
                    <strong>Non-Lavojoy (Y.O.U, bnb, dazzle me, glamfix, dll):</strong>
                    <br />• ≥ 120%: Pokok <strong>Rp 3.900.000</strong> + Insentif <strong>2%</strong>
                    <br />• 100% - 119%: Pokok <strong>Rp 3.900.000</strong> + Insentif <strong>1%</strong>
                    <br />• 70% - 99%: Gaji flat <strong>Rp 2.925.000</strong>
                    <br />• Rp 1 Jt - 25 Jt (&lt;70%): Gaji flat <strong>Rp 2.000.000</strong> | &lt;1 Jt: <strong>Rp 0</strong>
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-purple-900 bg-purple-50/60 p-1.5 rounded-lg border border-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Khusus Brand LAVOJOY:</strong>
                    <br />• Jika pencapaian Sell Out Lavojoy <strong>≥ 100%</strong>: Ditambahkan Insentif <strong>4% × Sell Out Lavojoy</strong>
                    <br />• Jika &lt; 100%: <strong>Tidak ada insentif Lavojoy (Rp 0)</strong>
                  </span>
                </li>
              </ul>
            </div>

            {/* Skema 3: TRAINER AREA */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50/60 to-white border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide">
                  3. Skema Trainer (Poin KPI &amp; Produk Fokus)
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-700">·</span>
                  <span>
                    <strong>Gaji Pokok:</strong> Rp 3.900.000 / personil.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-purple-700">·</span>
                  <span>
                    <strong>Tunjangan Transportasi Trainer:</strong> Rp 500.000 / bulan.
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-indigo-900 bg-indigo-50/70 p-2 rounded-lg border border-indigo-200">
                  <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Insentif Poin KPI Trainer (Skala 100 Poin):</strong>
                    <br />• Poin KPI <strong>100%:</strong> Insentif <strong>+Rp 2.000.000</strong>
                    <br />• Poin KPI <strong>90% – 99%:</strong> Insentif <strong>+Rp 1.000.000</strong>
                    <br />• Poin KPI <strong>80% – 89%:</strong> Insentif <strong>+Rp 500.000</strong>
                    <br />• Poin KPI <strong>70% – 79%:</strong> Aman / Netral (<strong>Rp 0</strong>)
                    <br />• Poin KPI <strong>&lt; 70%:</strong> Trainer diberi <strong>SP1</strong> &amp; <strong>Denda -Rp 300.000</strong>
                  </span>
                </li>
                <li className="flex items-start gap-1.5 text-emerald-800 bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Insentif Pencapaian Produk Fokus Trainer:</strong>
                    <br />• Capai <strong>≥ 100%:</strong> Insentif <strong>+Rp 500.000</strong>
                    <br />• Capai <strong>80% – 99%:</strong> Insentif <strong>+Rp 300.000</strong>
                    <br />• Capai <strong>&lt; 70%:</strong> Trainer diberi <strong>SP1</strong> &amp; <strong>Denda -Rp 300.000</strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rekapitulasi Cost</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gaji Sales &amp; Produktivitas BA ({costSummary.salesCount})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ba')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'ba'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Gaji BA Toko &amp; Insentif Lavojoy 4% ({costSummary.baCount})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('trainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'trainer'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Gaji Trainer ({costSummary.trainerCount || 4})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulator What-If</span>
          </button>
        </div>

        {/* Search Input for Tables */}
        {activeSubTab !== 'simulator' && activeSubTab !== 'overview' && (
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sales, toko, atau BA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: REKAPITULASI BIAYA AREA */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sales Cost Summary Box */}
          <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Rincian Beban Sales Representative
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {costSummary.salesCount} Personil
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Gaji Pokok Sales (Rp 4.900.000 × {costSummary.salesCount}):</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(costSummary.totalSalesBase)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Insentif Sell In (0,2% – 0,3%):</span>
                <span className="font-mono font-bold text-indigo-600">
                  {formatRupiah(costSummary.salesList.reduce((acc, s) => acc + s.incentiveNominal, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-700 font-semibold">Bonus Produktivitas BA (45-54M: +500rb, ≥55M: +1Jt):</span>
                <span className="font-mono font-bold text-emerald-600">
                  +{formatRupiah(costSummary.salesList.reduce((acc, s) => acc + s.baProductivityBonus, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-rose-700 font-semibold">Denda BA &lt; 35 Jt (-Rp 300.000 / SP1):</span>
                <span className="font-mono font-bold text-rose-600">
                  -{formatRupiah(costSummary.salesList.reduce((acc, s) => acc + s.baProductivityPenalty, 0))}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-indigo-950">
                <span>Total Beban Gaji &amp; Insentif Sales:</span>
                <span className="font-mono">{formatRupiah(costSummary.totalSalesCost)}</span>
              </div>
            </div>
          </div>

          {/* BA Cost Summary Box */}
          <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Rincian Beban Beauty Advisor (BA Toko)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {costSummary.baCount} Gerai
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Gaji Pokok BA (Non-Lavojoy):</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(costSummary.totalBaBase)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Insentif Non-Lavojoy (1% – 2%):</span>
                <span className="font-mono font-bold text-teal-600">
                  {formatRupiah(costSummary.baList.reduce((acc, b) => acc + b.incentiveNonLavojoyNominal, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-purple-50/50 px-2 py-1.5 rounded-lg border border-purple-200">
                <span className="text-purple-900 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Insentif Khusus Brand Lavojoy (4% jika capai 100%):
                </span>
                <span className="font-mono font-black text-purple-700">
                  +{formatRupiah(costSummary.baList.reduce((acc, b) => acc + b.incentiveLavojoyNominal, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-amber-50/50 px-2 py-1.5 rounded-lg border border-amber-200">
                <span className="text-amber-900 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Insentif &amp; Denda Produk Fokus BA (Netto):
                </span>
                <span className={`font-mono font-black ${(costSummary.totalBaFocusNetBonus || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {(costSummary.totalBaFocusNetBonus || 0) >= 0 ? '+' : ''}{formatRupiah(costSummary.totalBaFocusNetBonus || 0)}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">
                    (+{formatRupiah(costSummary.totalBaFocusIncentive || 0)} / -{formatRupiah(costSummary.totalBaFocusPenalty || 0)})
                  </span>
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-teal-950">
                <span>Total Beban Gaji &amp; Insentif BA:</span>
                <span className="font-mono">{formatRupiah(costSummary.totalBaCost)}</span>
              </div>
            </div>
          </div>

          {/* Trainer Cost Summary Box */}
          <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Rincian Beban Trainer Area
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {costSummary.trainerCount || 4} Personil
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Gaji Pokok Trainer (Rp 3.900.000 × {costSummary.trainerCount || 4}):</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(costSummary.totalTrainerBase || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Tunjangan Transportasi Trainer (Rp 500.000 × {costSummary.trainerCount || 4}):</span>
                <span className="font-mono font-bold text-purple-600">
                  {formatRupiah(costSummary.totalTrainerTransport || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-emerald-50/50 px-2 py-1.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-900 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Insentif Produk Fokus (≥100%: 500k, 80-99%: 300k):
                </span>
                <span className="font-mono font-black text-emerald-700">
                  +{formatRupiah(costSummary.totalTrainerFocusIncentive || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-rose-50/50 px-2 py-1.5 rounded-lg border border-rose-200">
                <span className="text-rose-900 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Denda &amp; Sanksi SP1 Produk Fokus (&lt;70%: -300k):
                </span>
                <span className="font-mono font-black text-rose-700">
                  -{formatRupiah(costSummary.totalTrainerFocusPenalty || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-indigo-50/50 px-2 py-1.5 rounded-lg border border-indigo-200">
                <span className="text-indigo-900 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  Insentif Poin KPI (100%: 2M, 90-99%: 1M, 80-89%: 500k):
                </span>
                <span className="font-mono font-black text-emerald-700">
                  +{formatRupiah(costSummary.totalTrainerKpiIncentive || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 bg-rose-50/50 px-2 py-1.5 rounded-lg border border-rose-200">
                <span className="text-rose-900 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Denda &amp; SP1 Poin KPI (&lt;70%: -300k):
                </span>
                <span className="font-mono font-black text-rose-700">
                  -{formatRupiah(costSummary.totalTrainerKpiPenalty || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-purple-950">
                <span>Total Beban Gaji &amp; Insentif Trainer:</span>
                <span className="font-mono">{formatRupiah(costSummary.totalTrainerCost || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABEL ESTIMASI GAJI SALES */}
      {activeSubTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Rincian Estimasi Gaji Sales, Insentif Sell In &amp; Produktivitas BA
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gaji Pokok Rp 4.900.000 + Insentif Sell In (≥100%: 4% | 80-99%: 0,2%) + Bonus BA (45-54M: +500rb, ≥55M: +1Jt) - Denda BA (&lt;35M: -300rb, SP1)
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Personil: <strong className="text-slate-800">{costSummary.salesCount}</strong> | Total Beban:{' '}
              <strong className="text-indigo-700 font-bold">{formatRupiah(costSummary.totalSalesCost)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Sales</th>
                  <th className="py-3 px-3">Area / SPV</th>
                  <th className="py-3 px-3 text-right">Target Sell In</th>
                  <th
                    onClick={() => toggleSort('actual')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Realisasi Sell In</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('achievement')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>% Capai</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Gaji Pokok</th>
                  <th className="py-3 px-3 text-right">Insentif Sell In</th>
                  <th className="py-3 px-3">BA Toko yang Dicover</th>
                  <th className="py-3 px-3 text-right text-emerald-800">Bonus BA</th>
                  <th className="py-3 px-3 text-right text-rose-800">Denda BA &amp; SP</th>
                  <th
                    onClick={() => toggleSort('total')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-indigo-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-indigo-950">
                      <span>Take Home Pay</span>
                      <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data sales yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSalesList.map((item, idx) => (
                    <tr key={item.salesName} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.salesName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.coverArea} ({item.spv})
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatRupiah(item.sellInTarget)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellInActual)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.achievementPercent >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementPercent >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.achievementPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.baseSalary)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                        {formatRupiah(item.incentiveNominal)}
                        <span className="text-[10px] text-slate-400 block font-normal">({item.incentivePercent}%)</span>
                      </td>
                      <td className="py-3 px-3">
                        {item.coveredBaList.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">- (Tidak ada BA)</span>
                        ) : (
                          <div className="space-y-1 max-w-[200px]">
                            {item.coveredBaList.map((b) => (
                              <div key={b.storeName} className="text-[10px] flex items-center justify-between gap-1 p-1 rounded bg-slate-50 border border-slate-200">
                                <span className="font-bold text-slate-800 truncate">{b.baName}</span>
                                <span className="font-mono text-slate-600">{formatRupiah(b.sellOut, true)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        {item.baProductivityBonus > 0 ? `+${formatRupiah(item.baProductivityBonus)}` : 'Rp 0'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {item.baProductivityPenalty > 0 ? (
                          <span className="font-bold text-rose-600 inline-flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                              SP1 ({item.baProductivitySpCount})
                            </span>
                            -{formatRupiah(item.baProductivityPenalty)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">AMAN</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-indigo-950 text-sm bg-indigo-50/40">
                        {formatRupiah(item.totalSalary)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenEditSales(item)}
                          className="p-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Target & Insentif Sales"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TABEL ESTIMASI GAJI BA (TOKO BER-BA) */}
      {activeSubTab === 'ba' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-teal-600" />
                Rincian Estimasi Gaji &amp; Insentif BA (1 BA Multi-Brand &amp; Skema Lavojoy 4%)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Non-Lavojoy: ≥120% (2%+3.9Jt) | 100-119% (1%+3.9Jt) | 70-99% (2.925Jt) | 1-25Jt (2Jt) + Khusus Lavojoy: 4% jika capai ≥ 100%
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Gerai BA: <strong className="text-slate-800">{baCostSummary.baCount}</strong> | Total Beban:{' '}
              <strong className="text-teal-700 font-bold">{formatRupiah(baCostSummary.totalBaCost)}</strong>
            </div>
          </div>

          {/* FILTER PERIODE TANGGAL BA (DARI TANGGAL S/D SAMPAI TANGGAL) */}
          <div className="mt-4 p-3.5 bg-gradient-to-r from-teal-50/60 via-slate-50 to-indigo-50/40 rounded-xl border border-teal-200/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mr-1">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>Filter Periode BA:</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-[11px] font-semibold text-slate-500">Dari:</label>
                  <input
                    type="date"
                    value={baStartDate}
                    onChange={(e) => setBaStartDate(e.target.value)}
                    className="text-xs font-medium text-slate-800 outline-none cursor-pointer bg-transparent"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">s/d</span>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-[11px] font-semibold text-slate-500">Sampai:</label>
                  <input
                    type="date"
                    value={baEndDate}
                    onChange={(e) => setBaEndDate(e.target.value)}
                    className="text-xs font-medium text-slate-800 outline-none cursor-pointer bg-transparent"
                  />
                </div>

                {(baStartDate || baEndDate) && (
                  <button
                    onClick={() => {
                      setBaStartDate('');
                      setBaEndDate('');
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Periode
                  </button>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 mr-1">Preset:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBaStartDate('2026-10-01');
                    setBaEndDate('2026-10-31');
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    baStartDate === '2026-10-01' && baEndDate === '2026-10-31'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Okt 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBaStartDate('2026-09-01');
                    setBaEndDate('2026-09-30');
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    baStartDate === '2026-09-01' && baEndDate === '2026-09-30'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Sep 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBaStartDate('2026-08-01');
                    setBaEndDate('2026-08-31');
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    baStartDate === '2026-08-01' && baEndDate === '2026-08-31'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ags 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBaStartDate('');
                    setBaEndDate('');
                  }}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    !baStartDate && !baEndDate
                      ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Periode
                </button>
              </div>
            </div>

            {/* Status indicator bar */}
            <div className="flex items-center justify-between text-[11px] text-teal-800 mt-2 pt-2 border-t border-teal-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>
                  {baStartDate || baEndDate ? (
                    <>
                      Menampilkan transaksi BA rentang:{' '}
                      <strong className="font-semibold text-teal-950">
                        {baStartDate || 'Awal'} s/d {baEndDate || 'Sekarang'}
                      </strong>
                    </>
                  ) : (
                    'Menampilkan akumulasi seluruh periode transaksi BA'
                  )}
                </span>
              </span>
              <span className="font-mono text-slate-600">
                Matched Transaksi: <strong className="text-teal-900 font-bold">{effectiveBaRecords.length}</strong> / {records.length} data
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama BA</th>
                  <th className="py-3 px-3">Nama Toko &amp; Area</th>
                  <th className="py-3 px-3">Sales Cover</th>
                  {/* Non-Lavojoy Group */}
                  <th className="py-3 px-3 text-right bg-teal-50/50">Target Non-Lavojoy</th>
                  <th className="py-3 px-3 text-right bg-teal-50/50">Sell Out Non-Lavojoy</th>
                  <th className="py-3 px-3 text-right bg-teal-50/50">% Capai</th>
                  <th className="py-3 px-3 text-right bg-teal-50/50">Gaji Pokok</th>
                  <th className="py-3 px-3 text-right bg-teal-50/50">Insentif Non-Lavojoy</th>
                  {/* Lavojoy Group */}
                  <th className="py-3 px-3 text-right bg-purple-50/50">Target Lavojoy</th>
                  <th className="py-3 px-3 text-right bg-purple-50/50">Sell Out Lavojoy</th>
                  <th className="py-3 px-3 text-right bg-purple-50/50">% Capai</th>
                  <th className="py-3 px-3 text-right bg-purple-50/50 text-purple-900 font-bold">Insentif Lavojoy (4%)</th>
                  {/* Produk Fokus Group */}
                  <th className="py-3 px-3 text-right bg-amber-50/50">Produk Fokus (Pcs)</th>
                  <th className="py-3 px-3 text-right bg-amber-50/50 text-amber-900 font-bold">Kompensasi Fokus</th>
                  {/* Total Group */}
                  <th className="py-3 px-3 text-right font-black">Total Sell Out</th>
                  <th
                    onClick={() => toggleSort('total')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-teal-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-teal-950">
                      <span>Total Gaji (THP)</span>
                      <ArrowUpDown className="w-3 h-3 text-teal-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBaList.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data toko ber-BA yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBaList.map((item, idx) => (
                    <tr key={item.storeName} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900">{item.baName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.baNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{item.storeName}</div>
                        <div className="text-[10px] text-slate-500">{item.coverArea} ({item.region})</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{item.salesName}</td>

                      {/* Non-Lavojoy */}
                      <td className="py-3 px-3 text-right font-mono text-slate-500 bg-teal-50/20">
                        {formatRupiah(item.targetNonLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-teal-50/20">
                        {formatRupiah(item.sellOutNonLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right bg-teal-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                            item.achievementNonLavojoyPercent >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.achievementNonLavojoyPercent >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.achievementNonLavojoyPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 bg-teal-50/20">
                        {formatRupiah(item.baseSalary)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700 bg-teal-50/20">
                        {formatRupiah(item.incentiveNonLavojoyNominal)}
                        <span className="text-[10px] text-slate-400 block font-normal">({item.incentiveNonLavojoyPercent}%)</span>
                      </td>

                      {/* Lavojoy */}
                      <td className="py-3 px-3 text-right font-mono text-slate-500 bg-purple-50/20">
                        {formatRupiah(item.targetLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-purple-50/20">
                        {formatRupiah(item.sellOutLavojoy)}
                      </td>
                      <td className="py-3 px-3 text-right bg-purple-50/20">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                            item.isLavojoyTargetMet
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {formatPercent(item.achievementLavojoyPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-purple-700 bg-purple-50/20">
                        {item.incentiveLavojoyNominal > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            +{formatRupiah(item.incentiveLavojoyNominal)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Rp 0 (&lt;100%)</span>
                        )}
                      </td>

                      {/* Produk Fokus Group */}
                      <td className="py-3 px-3 text-right bg-amber-50/20 font-mono">
                        <div className="font-bold text-slate-800">{item.focusActualPcs || 0} / {item.focusTargetPcs || 0} pcs</div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          item.focusStatus === 'insentif' ? 'bg-emerald-100 text-emerald-800' :
                          item.focusStatus === 'aman' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {item.focusAchievementPct ? item.focusAchievementPct.toFixed(1) : 0}% ({item.focusStatus === 'insentif' ? '≥80%' : item.focusStatus === 'aman' ? 'AMAN' : '<70%'})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-amber-50/20">
                        {(item.focusNetBonus || 0) > 0 ? (
                          <span className="text-emerald-700 font-black">+{formatRupiah(item.focusNetBonus || 0)}</span>
                        ) : (item.focusNetBonus || 0) < 0 ? (
                          <span className="text-rose-600 font-black">-{formatRupiah(Math.abs(item.focusNetBonus || 0))}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Rp 0 (Aman)</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.sellOutActual)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-teal-950 text-sm bg-teal-50/40">
                        {formatRupiah(item.totalSalary)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenEditBa(item)}
                          className="p-1.5 rounded-lg border border-teal-200 text-teal-600 hover:bg-teal-50 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Target Non-Lavojoy & Lavojoy"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TABEL ESTIMASI GAJI TRAINER (PRODUK FOKUS, TRANSPORT & POIN KPI) */}
      {activeSubTab === 'trainer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Rincian Estimasi Gaji &amp; Insentif Trainer (Gaji Pokok, Transport, Produk Fokus &amp; Poin KPI)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pokok Rp 3.9Jt + Transport Rp 500rb + Insentif Fokus + Insentif Poin KPI (100%: +2Jt | 90-99%: +1Jt | 80-89%: +500rb | 70-79%: Aman | &lt;70%: SP1 &amp; Denda -300rb)
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total Personil: <strong className="text-slate-800">{trainerCostSummary.trainerCount || 4}</strong> | Total Beban:{' '}
              <strong className="text-purple-700 font-bold">{formatRupiah(trainerCostSummary.totalTrainerCost || 0)}</strong>
            </div>
          </div>

          {/* FILTER PERIODE BULAN KPI & TANGGAL TRANSAKSI TRAINER */}
          <div className="mt-4 p-3.5 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 rounded-xl border border-purple-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* FILTER BULAN KPI TRAINER */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-purple-300 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <label className="text-[11px] font-bold text-slate-700">Periode Bulan KPI:</label>
                  <select
                    value={trainerMonthPeriod}
                    onChange={(e) => setTrainerMonthPeriod(e.target.value)}
                    className="text-xs font-black text-indigo-900 outline-none cursor-pointer bg-transparent"
                  >
                    {availableTrainerMonths.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Range Tanggal Transaksi */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tanggal Transaksi:</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-[11px] font-semibold text-slate-500">Dari:</label>
                  <input
                    type="date"
                    value={trainerStartDate}
                    onChange={(e) => setTrainerStartDate(e.target.value)}
                    className="text-xs font-medium text-slate-800 outline-none cursor-pointer bg-transparent"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">s/d</span>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-[11px] font-semibold text-slate-500">Sampai:</label>
                  <input
                    type="date"
                    value={trainerEndDate}
                    onChange={(e) => setTrainerEndDate(e.target.value)}
                    className="text-xs font-medium text-slate-800 outline-none cursor-pointer bg-transparent"
                  />
                </div>

                {(trainerStartDate || trainerEndDate) && (
                  <button
                    onClick={() => {
                      setTrainerStartDate('');
                      setTrainerEndDate('');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Tanggal</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono flex items-center gap-2">
                <span className="font-bold text-indigo-800 bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-600" />
                  KPI Terhubung: {trainerMonthPeriod}
                </span>
                {trainerStartDate || trainerEndDate ? (
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Filter: {trainerStartDate || 'Awal'} s/d {trainerEndDate || 'Sekarang'}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Trainer</th>
                  <th className="py-3 px-3">Area Cover</th>
                  <th className="py-3 px-3">Region</th>

                  {/* Kelompok Poin KPI Trainer */}
                  <th className="py-3 px-3 text-right bg-indigo-50/70 text-indigo-950 font-black">
                    Poin KPI Trainer
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-50/70 text-indigo-950 font-black">
                    Status KPI ({trainerMonthPeriod})
                  </th>
                  <th className="py-3 px-3 text-right bg-indigo-50/70 text-emerald-800 font-black">
                    Insentif KPI
                  </th>
                  <th className="py-3 px-3 text-right bg-indigo-50/70 text-rose-800 font-black">
                    Denda KPI / SP1
                  </th>

                  {/* Kelompok Produk Fokus */}
                  <th className="py-3 px-3 text-right bg-purple-50/50">Target Fokus</th>
                  <th
                    onClick={() => toggleSort('actual')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-purple-100/50 bg-purple-50/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Realisasi Fokus</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('achievement')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-purple-100/50 bg-purple-50/50"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>% Capai</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status Fokus</th>

                  {/* Gaji & Tunjangan */}
                  <th className="py-3 px-3 text-right">Gaji Pokok</th>
                  <th className="py-3 px-3 text-right">Transport</th>
                  <th className="py-3 px-3 text-right text-emerald-800">Insentif Fokus</th>
                  <th className="py-3 px-3 text-right text-rose-800">Denda Fokus</th>
                  <th
                    onClick={() => toggleSort('total')}
                    className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100 bg-purple-50/70"
                  >
                    <div className="flex items-center justify-end gap-1 font-black text-purple-950">
                      <span>Total Gaji (THP)</span>
                      <ArrowUpDown className="w-3 h-3 text-purple-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainerList.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada data trainer yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTrainerList.map((item, idx) => (
                    <tr key={item.trainerName} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          <span>{item.trainerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{item.areaCovered}</td>
                      <td className="py-3 px-3 text-slate-600">{item.region}</td>

                      {/* Poin KPI Trainer */}
                      <td className="py-3 px-3 text-right font-mono bg-indigo-50/20">
                        <div className="font-black text-indigo-950 text-xs">
                          {item.kpiScore ?? 85} Pts
                        </div>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (item.kpiScore ?? 85) >= 90
                                ? 'bg-emerald-500'
                                : (item.kpiScore ?? 85) >= 80
                                ? 'bg-indigo-500'
                                : (item.kpiScore ?? 85) >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, item.kpiScore ?? 85)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status KPI Trainer */}
                      <td className="py-3 px-3 text-center bg-indigo-50/20">
                        {(() => {
                          const badge = getTrainerKpiStatusBadge(item.kpiStatus, item.kpiScore);
                          return (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Insentif KPI Trainer */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-indigo-50/20">
                        {item.kpiIncentive > 0 ? (
                          <span>+{formatRupiah(item.kpiIncentive)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Rp 0</span>
                        )}
                      </td>

                      {/* Denda KPI Trainer */}
                      <td className="py-3 px-3 text-right font-mono bg-indigo-50/20">
                        {item.kpiPenalty > 0 ? (
                          <span className="font-bold text-rose-600 inline-flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-100 text-rose-800 border border-rose-300 font-black">
                              SP1
                            </span>
                            -{formatRupiah(item.kpiPenalty)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">AMAN</span>
                        )}
                      </td>

                      {/* Target & Realisasi Fokus */}
                      <td className="py-3 px-3 text-right font-mono text-slate-500 bg-purple-50/20">
                        {item.focusTargetPcs.toLocaleString('id-ID')} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-purple-50/20">
                        {item.focusActualPcs.toLocaleString('id-ID')} pcs
                      </td>
                      <td className="py-3 px-3 text-right bg-purple-50/20">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            item.focusAchievementPct >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.focusAchievementPct >= 80
                              ? 'bg-blue-100 text-blue-800'
                              : item.focusAchievementPct >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(item.focusAchievementPct)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {(() => {
                          const badge = getTrainerStatusBadge(item.focusStatus);
                          return (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.baseSalary)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(item.transportAllowance)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        {item.focusIncentive > 0 ? `+${formatRupiah(item.focusIncentive)}` : 'Rp 0'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {item.focusPenalty > 0 ? (
                          <span className="font-bold text-rose-600 inline-flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                              SP1
                            </span>
                            -{formatRupiah(item.focusPenalty)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">AMAN</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-purple-950 text-sm bg-purple-50/40">
                        {formatRupiah(item.totalSalary)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenEditTrainer(item)}
                          className="p-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Target, Realisasi & Poin KPI Trainer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULATOR WHAT-IF INTERAKTIF */}
      {activeSubTab === 'simulator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Simulator Cepat (What-If Calculator Gaji &amp; Insentif)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Uji langsung nominal omset dan target untuk menghitung besaran gaji pokok dan insentif sesuai aturan resmi.
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md border border-slate-200">
              <button
                onClick={() => setSimRole('ba')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  simRole === 'ba'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simulasi BA Toko
              </button>
              <button
                onClick={() => setSimRole('sales')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  simRole === 'sales'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simulasi Sales
              </button>
              <button
                onClick={() => setSimRole('trainer')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  simRole === 'trainer'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simulasi Trainer
              </button>
            </div>

            {/* Controls BA */}
            {simRole === 'ba' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                    <span className="text-xs font-bold text-teal-900 block">Brand Non-Lavojoy (Y.O.U, bnb, dll):</span>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Non-Lavojoy (Rp)</label>
                      <input
                        type="number"
                        step="1000000"
                        value={simBaNonLavojoyTarget}
                        onChange={(e) => setSimBaNonLavojoyTarget(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Realisasi Non-Lavojoy (Rp)</label>
                      <input
                        type="number"
                        step="1000000"
                        value={simBaNonLavojoyActual}
                        onChange={(e) => setSimBaNonLavojoyActual(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                    <span className="text-xs font-bold text-purple-900 block">Brand Lavojoy (Khusus 4%):</span>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Lavojoy (Rp)</label>
                      <input
                        type="number"
                        step="500000"
                        value={simBaLavojoyTarget}
                        onChange={(e) => setSimBaLavojoyTarget(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Realisasi Lavojoy (Rp)</label>
                      <input
                        type="number"
                        step="500000"
                        value={simBaLavojoyActual}
                        onChange={(e) => setSimBaLavojoyActual(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation Result Card BA */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-emerald-50/50 border border-teal-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-teal-100">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase">Hasil Perhitungan BA Toko</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        Non-Lavojoy: {formatPercent(simBaResult.achievementNonLavojoyPercent)} ({simBaResult.tierLabel})
                      </h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${simBaResult.tierColor}`}>
                      {simBaResult.tierLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-teal-100">
                      <span className="text-[11px] text-slate-500 font-medium block">Gaji Pokok:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatRupiah(simBaResult.baseSalary)}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-teal-100">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Insentif Non-Lavojoy ({simBaResult.incentiveNonLavojoyPercent}%):
                      </span>
                      <span className="text-base font-bold text-teal-600 font-mono">
                        {formatRupiah(simBaResult.incentiveNonLavojoyNominal)}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-200 bg-purple-50/40">
                      <span className="text-[11px] text-purple-900 font-bold block">
                        Insentif Lavojoy ({simBaResult.incentiveLavojoyPercent}%):
                      </span>
                      <span className="text-base font-black text-purple-700 font-mono">
                        {formatRupiah(simBaResult.incentiveLavojoyNominal)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Capai Lavojoy: {formatPercent(simBaResult.achievementLavojoyPercent)}
                      </span>
                    </div>
                    <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
                      <span className="text-[11px] text-teal-200 font-medium block">Total Take Home Pay:</span>
                      <span className="text-lg font-black font-mono">
                        {formatRupiah(simBaResult.totalSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : simRole === 'sales' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Target Sell In Sales (Rp)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={simTarget}
                      onChange={(e) => setSimTarget(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Realisasi Sell In Sales (Rp)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={simActual}
                      onChange={(e) => setSimActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Calculation Result Card Sales */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50/50 border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-700 uppercase">Hasil Perhitungan Sales</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        Pencapaian: {formatPercent(simSalesResult.achievementPercent)} ({simSalesResult.tierLabel})
                      </h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${simSalesResult.tierColor}`}>
                      {simSalesResult.tierLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="text-[11px] text-slate-500 font-medium block">Gaji Pokok:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatRupiah(simSalesResult.baseSalary)}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Insentif Sell In ({simSalesResult.incentivePercent}%):
                      </span>
                      <span className="text-base font-bold text-emerald-600 font-mono">
                        {formatRupiah(simSalesResult.incentiveNominal)}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <span className="text-[11px] text-indigo-200 font-medium block">Total Take Home Pay:</span>
                      <span className="text-lg font-black font-mono">
                        {formatRupiah(simSalesResult.totalSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Target Produk Fokus Trainer (Pcs)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={simTrainerFocusTarget}
                      onChange={(e) => setSimTrainerFocusTarget(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Realisasi Produk Fokus Trainer (Pcs)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={simTrainerFocusActual}
                      onChange={(e) => setSimTrainerFocusActual(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-black text-indigo-950 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Poin KPI Trainer (0-100 Poin)</span>
                      </label>
                      <span className="text-xs font-black font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-300">
                        {simTrainerKpiScore} Pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={simTrainerKpiScore}
                      onChange={(e) => setSimTrainerKpiScore(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="text-[10px] text-indigo-800 font-semibold mt-1">
                      {simTrainerKpiScore >= 100
                        ? '100% (+Rp 2.000.000)'
                        : simTrainerKpiScore >= 90
                        ? '90-99% (+Rp 1.000.000)'
                        : simTrainerKpiScore >= 80
                        ? '80-89% (+Rp 500.000)'
                        : simTrainerKpiScore >= 70
                        ? '70-79% (Aman / Rp 0)'
                        : '<70% (SP1 & Denda -Rp 300.000)'}
                    </div>
                  </div>
                </div>

                {/* Calculation Result Card Trainer */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 border border-purple-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-100">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 uppercase">Hasil Perhitungan Trainer</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        Fokus: {formatPercent(simTrainerResult.focusAchievementPct)} | KPI: {simTrainerResult.kpiScore ?? 85} Pts
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getTrainerStatusBadge(simTrainerResult.focusStatus).color}`}>
                        Fokus: {getTrainerStatusBadge(simTrainerResult.focusStatus).label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getTrainerKpiStatusBadge(simTrainerResult.kpiStatus, simTrainerResult.kpiScore).color}`}>
                        KPI: {getTrainerKpiStatusBadge(simTrainerResult.kpiStatus, simTrainerResult.kpiScore).label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <span className="text-[11px] text-slate-500 font-medium block">Gaji Pokok:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatRupiah(simTrainerResult.baseSalary)}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <span className="text-[11px] text-slate-500 font-medium block">Transportasi:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatRupiah(simTrainerResult.transportAllowance)}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-purple-100">
                      <span className="text-[11px] text-slate-500 font-medium block">Insentif / Denda Fokus:</span>
                      <span className={`text-base font-bold font-mono ${simTrainerResult.focusIncentive > 0 ? 'text-emerald-600' : simTrainerResult.focusPenalty > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {simTrainerResult.focusIncentive > 0 ? `+${formatRupiah(simTrainerResult.focusIncentive)}` : simTrainerResult.focusPenalty > 0 ? `-${formatRupiah(simTrainerResult.focusPenalty)} (SP1)` : 'Rp 0 (Aman)'}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                      <span className="text-[11px] text-indigo-900 font-bold block">Insentif / Denda KPI:</span>
                      <span className={`text-base font-black font-mono ${simTrainerResult.kpiIncentive > 0 ? 'text-emerald-700' : simTrainerResult.kpiPenalty > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                        {simTrainerResult.kpiIncentive > 0 ? `+${formatRupiah(simTrainerResult.kpiIncentive)}` : simTrainerResult.kpiPenalty > 0 ? `-${formatRupiah(simTrainerResult.kpiPenalty)} (SP1)` : 'Rp 0 (Aman)'}
                      </span>
                    </div>
                    <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs">
                      <span className="text-[11px] text-purple-200 font-medium block">Total Take Home Pay:</span>
                      <span className="text-lg font-black font-mono">
                        {formatRupiah(simTrainerResult.totalSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT BA TARGETS */}
      {editingBa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Edit Target BA: {editingBa.baName}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{editingBa.storeName}</p>
              </div>
              <button
                onClick={() => setEditingBa(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Non-Lavojoy (Y.O.U, bnb, dazzle me, glamfix) (Rp)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={editBaNonLavojoyTarget}
                  onChange={(e) => setEditBaNonLavojoyTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Realisasi saat ini: {formatRupiah(editingBa.sellOutNonLavojoy)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Khusus Lavojoy (Rp)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={editBaLavojoyTarget}
                  onChange={(e) => setEditBaLavojoyTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Realisasi saat ini: {formatRupiah(editingBa.sellOutLavojoy)} (Syarat bonus 4% jika ≥ 100%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingBa(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditBa}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-xs cursor-pointer"
              >
                Simpan Target BA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT SALES TARGET & OVERRIDES */}
      {editingSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Edit Target &amp; Penyesuaian Sales: {editingSales.salesName}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{editingSales.coverArea} ({editingSales.spv})</p>
              </div>
              <button
                onClick={() => setEditingSales(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Sell In Sales (Rp)
                </label>
                <input
                  type="number"
                  step="5000000"
                  value={editSalesTarget}
                  onChange={(e) => setEditSalesTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bonus Produktivitas BA (Rp)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={editSalesBonus}
                  onChange={(e) => setEditSalesBonus(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Standar sistem: Rp 500k (BA 45-54M), Rp 1M (BA ≥ 55M)
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Denda Produktivitas BA (Rp)
                </label>
                <input
                  type="number"
                  step="300000"
                  value={editSalesPenalty}
                  onChange={(e) => setEditSalesPenalty(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Standar sistem: Rp 300k per BA &lt; 35 Jt (SP1)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingSales(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditSales}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer"
              >
                Simpan Penyesuaian Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TRAINER TARGET & REALISASI */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Edit Trainer: {editingTrainer.trainerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingTrainer.areaCovered} ({editingTrainer.region})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTrainer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Produk Fokus (Pcs)
                </label>
                <input
                  type="number"
                  step="50"
                  value={editTrainerFocusTarget}
                  onChange={(e) => setEditTrainerFocusTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Realisasi Produk Fokus (Pcs)
                </label>
                <input
                  type="number"
                  step="50"
                  value={editTrainerFocusActual}
                  onChange={(e) => setEditTrainerFocusActual(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Capaian: {((editTrainerFocusActual / Math.max(1, editTrainerFocusTarget)) * 100).toFixed(1)}% | Ketentuan: ≥100% (+500k), 80-99% (+300k), 70-79% (Aman), &lt;70% (SP1 &amp; -300k)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Insentif Fokus (Rp)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={editTrainerIncentive ?? 0}
                    onChange={(e) => setEditTrainerIncentive(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 500k / 300k</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Denda Fokus / SP1 (Rp)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={editTrainerPenalty ?? 0}
                    onChange={(e) => setEditTrainerPenalty(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 300k jika &lt;70%</span>
                </div>
              </div>

              {/* POIN KPI TRAINER SECTION & MANUAL OVERRIDES */}
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Poin KPI Trainer (Skala 100 Poin)</span>
                  </label>
                  <span className="text-xs font-black font-mono text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-300">
                    {editTrainerKpiScore} Poin
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editTrainerKpiScore}
                    onChange={(e) => {
                      const score = Number(e.target.value);
                      setEditTrainerKpiScore(score);
                      setEditTrainerKpiIncentive(
                        score === 100 ? 2000000 : score >= 90 ? 1000000 : score >= 80 ? 500000 : 0
                      );
                      setEditTrainerKpiPenalty(score < 70 ? 300000 : 0);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editTrainerKpiScore}
                    onChange={(e) => {
                      const score = Math.min(100, Math.max(0, Number(e.target.value)));
                      setEditTrainerKpiScore(score);
                      setEditTrainerKpiIncentive(
                        score === 100 ? 2000000 : score >= 90 ? 1000000 : score >= 80 ? 500000 : 0
                      );
                      setEditTrainerKpiPenalty(score < 70 ? 300000 : 0);
                    }}
                    className="w-16 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg border border-indigo-300 bg-white"
                  />
                </div>

                <div className="text-[10px] text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-100 space-y-0.5">
                  <div className="font-bold">Ketentuan Skema Insentif Poin KPI:</div>
                  <div>• 100% (100 pt): <strong>+Rp 2.000.000</strong></div>
                  <div>• 90% - 99%: <strong>+Rp 1.000.000</strong></div>
                  <div>• 80% - 89%: <strong>+Rp 500.000</strong></div>
                  <div>• 70% - 79%: Aman (<strong>Rp 0</strong>)</div>
                  <div>• &lt; 70%: Diberi <strong>SP1</strong> &amp; <strong>Denda -Rp 300.000</strong></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      Insentif KPI (Rp)
                    </label>
                    <input
                      type="number"
                      step="100000"
                      value={editTrainerKpiIncentive ?? 0}
                      onChange={(e) => setEditTrainerKpiIncentive(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      Denda KPI / SP1 (Rp)
                    </label>
                    <input
                      type="number"
                      step="100000"
                      value={editTrainerKpiPenalty ?? 0}
                      onChange={(e) => setEditTrainerKpiPenalty(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Evaluasi Trainer
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Fokus SKU lipstik &amp; serum tercapai..."
                  value={editTrainerNotes}
                  onChange={(e) => setEditTrainerNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingTrainer(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditTrainer}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xs cursor-pointer"
              >
                Simpan Penyesuaian Trainer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
