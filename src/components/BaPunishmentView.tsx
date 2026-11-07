import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BaNihilIncidentRecord,
  BaPunishmentSummaryItem,
  BaDayStatus,
  BaDailyDayRecord,
  DashboardFilters,
  TransactionRecord,
} from '../types/dashboard';
import { loadBaIncidents, saveBaIncidents } from '../services/agingAndKpiService';
import { aggregateAreaCost } from '../utils/costCalculations';
import { formatRupiah, formatNumber, getTrainerForRecord } from '../utils/analytics';
import * as XLSX from 'xlsx';

interface BaPunishmentViewProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
}

const STORAGE_KEY_BA_CUSTOM_SALARY = 'salespro_ba_custom_salary_v2';
const STORAGE_KEY_BA_DAILY_HISTORY = 'salespro_ba_daily_history_v3';
const STORAGE_KEY_BA_FINE_RATE = 'salespro_ba_fine_rate_v2';
const STORAGE_KEY_BA_CUSTOM_CONFIGS = 'salespro_ba_custom_configs_v3';
const STORAGE_KEY_BA_ADDED_CUSTOM = 'salespro_ba_added_custom_v3';
const STORAGE_KEY_BA_DELETED_KEYS = 'salespro_ba_deleted_keys_v3';

export interface CustomAddedBa {
  id: string;
  baName: string;
  baNumber: string;
  storeName: string;
  salesName: string;
  spvName?: string;
  trainerName: 'ARA' | 'RATIH';
  coverArea: string;
  region: string;
  baseSalary: number;
}

export interface CustomBaConfig {
  baName?: string;
  storeName?: string;
  salesName?: string;
  trainerName?: 'ARA' | 'RATIH';
  coverArea?: string;
  baseSalary?: number;
  customDendaTotal?: number;
  customTakeHomePay?: number;
}

const MONTHS_LIST = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

export const BaPunishmentView: React.FC<BaPunishmentViewProps> = ({ records, filters }) => {
  const [incidents, setIncidents] = useState<BaNihilIncidentRecord[]>(() => loadBaIncidents());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tertib' | 'peringatan'>('all');
  const [trainerFilter, setTrainerFilter] = useState<'all' | 'ARA' | 'RATIH'>('all');

  // Custom BA Configurations (Edit Nama BA, Toko, Sales, Trainer, Gaji, Denda)
  const [customBaConfigs, setCustomBaConfigs] = useState<Record<string, CustomBaConfig>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_CUSTOM_CONFIGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return {};
  });

  // BA Tambahan Manual (+ Tambah BA)
  const [customAddedBas, setCustomAddedBas] = useState<CustomAddedBa[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_ADDED_CUSTOM);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // BA yang Dihapus oleh Pengguna (Hapus BA)
  const [deletedBaKeys, setDeletedBaKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_DELETED_KEYS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Modal Tambah BA Baru
  const [isAddBaModalOpen, setIsAddBaModalOpen] = useState(false);
  const [addBaNameInput, setAddBaNameInput] = useState('');
  const [addBaNumberInput, setAddBaNumberInput] = useState('');
  const [addStoreNameInput, setAddStoreNameInput] = useState('');
  const [addSalesNameInput, setAddSalesNameInput] = useState('ILHAMSYAH');
  const [addTrainerNameInput, setAddTrainerNameInput] = useState<'ARA' | 'RATIH'>('ARA');
  const [addCoverAreaInput, setAddCoverAreaInput] = useState('PEKANBARU');
  const [addBaseSalaryInput, setAddBaseSalaryInput] = useState<number>(3900000);

  // Modal Konfirmasi Hapus BA
  const [baToDelete, setBaToDelete] = useState<BaPunishmentSummaryItem | null>(null);

  // Modal Edit Detail Lengkap BA (Nama BA, Toko, Sales, Trainer, Gaji, Denda)
  const [editingBaItem, setEditingBaItem] = useState<BaPunishmentSummaryItem | null>(null);
  const [editBaNameInput, setEditBaNameInput] = useState('');
  const [editStoreNameInput, setEditStoreNameInput] = useState('');
  const [editSalesNameInput, setEditSalesNameInput] = useState('');
  const [editTrainerNameInput, setEditTrainerNameInput] = useState<'ARA' | 'RATIH'>('ARA');
  const [editCoverAreaInput, setEditCoverAreaInput] = useState('');

  // Filter Periode Bulan Berjalan (Default: SEPTEMBER atau sesuai Global Filter)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const cleaned = filters.BULAN.toUpperCase().replace(/\s*2026/g, '').trim();
      if (MONTHS_LIST.includes(cleaned)) return cleaned;
    }
    return 'SEPTEMBER';
  });

  // Sinkronisasi otomatis jika global filter BULAN berubah
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      const cleaned = filters.BULAN.toUpperCase().replace(/\s*2026/g, '').trim();
      if (MONTHS_LIST.includes(cleaned)) {
        setSelectedMonth(cleaned);
      }
    }
  }, [filters.BULAN]);

  // Tarif Denda Per Hari No Sell (Default Rp 25.000, bisa diedit)
  const [finePerDayRate, setFinePerDayRate] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_FINE_RATE);
      if (raw) {
        const parsed = Number(raw);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return 25000;
  });

  // Modal Edit Tarif Denda
  const [isEditFineRateModalOpen, setIsEditFineRateModalOpen] = useState(false);
  const [tempFineRateInput, setTempFineRateInput] = useState<number>(25000);

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

  // History Kedisiplinan Harian (Tanggal 1 - 30) per BA: Report, No sell, Off day
  const [baDailyOverrides, setBaDailyOverrides] = useState<
    Record<
      string,
      Record<
        number,
        {
          status: BaDayStatus;
          dendaNominal?: number;
          customSellOut?: number;
          note?: string;
        }
      >
    >
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BA_DAILY_HISTORY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load baDailyOverrides from localStorage', e);
    }
    return {};
  });

  // Modal Edit Gaji & Denda BA
  const [editingBaSalary, setEditingBaSalary] = useState<BaPunishmentSummaryItem | null>(null);
  const [editBaseSalaryInput, setEditBaseSalaryInput] = useState<number>(3900000);
  const [editDendaInput, setEditDendaInput] = useState<number>(0);
  const [editTakeHomePayInput, setEditTakeHomePayInput] = useState<number>(3900000);

  // Modal History & Evaluasi 30 Hari per BA
  const [selectedBaFor30DayHistory, setSelectedBaFor30DayHistory] = useState<BaPunishmentSummaryItem | null>(null);

  // Modal Tambah Hari Nihil / Catat BA OFF
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState<'nihil' | 'off'>('nihil');
  const [newBaName, setNewBaName] = useState('SITI RAHMAH');
  const [newStoreName, setNewStoreName] = useState('TOKO ALANA BEAUTY');
  const [newBrand, setNewBrand] = useState('Y.O.U');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newReason, setNewReason] = useState('Tidak mengirimkan laporan sell out harian');
  const [newDendaNominal, setNewDendaNominal] = useState<number>(25000);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Jumlah Hari dalam Bulan Berjalan (September = 30 hari, dsb.)
  const daysInSelectedMonth = useMemo(() => {
    const m = selectedMonth.toUpperCase();
    if (m === 'FEBRUARI') return 28;
    if (['APRIL', 'JUNI', 'SEPTEMBER', 'NOVEMBER'].includes(m)) return 30;
    return 31;
  }, [selectedMonth]);

  const selectedMonthIndex = useMemo(() => {
    const idx = MONTHS_LIST.indexOf(selectedMonth.toUpperCase());
    return idx >= 0 ? idx : 8; // Default September = 8
  }, [selectedMonth]);

  // Helper: Nama Hari Bahasa Indonesia (Senin, Selasa, dll.)
  const getIndonesianDayName = (dayNum: number, monthIdx: number, year: number = 2026): string => {
    const d = new Date(year, monthIdx, dayNum);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayNames[d.getDay()] || 'Hari';
  };

  // Extract base BA list from records & costData
  const costData = useMemo(() => aggregateAreaCost(records), [records]);

  // Save overrides to localStorage
  const saveBaDailyOverrides = (
    updated: Record<
      string,
      Record<
        number,
        {
          status: BaDayStatus;
          dendaNominal?: number;
          customSellOut?: number;
          note?: string;
        }
      >
    >
  ) => {
    setBaDailyOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_DAILY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Deteksi Penjualan Sell Out Harian per BA dari Google Sheet (Tanggal 1 s/d 30)
  const { baDailySalesMap, storeDailySalesMap } = useMemo(() => {
    const baMap: Record<string, Record<number, number>> = {};
    const storeMap: Record<string, Record<number, number>> = {};

    for (const r of records) {
      if (!r.TANGGAL) continue;
      if ((r.KET || '').toUpperCase() === 'RETURN') continue;

      // Sell out check
      const isSellOut = (r.KET || '').toUpperCase().includes('SELL OUT') || !r.KET;
      if (!isSellOut) continue;

      let rYear = r.TAHUN || 2026;
      let rMonth = selectedMonthIndex + 1;
      let rDay = 1;

      const trimmed = r.TANGGAL.trim();
      const parts = trimmed.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          rYear = parseInt(parts[0], 10);
          rMonth = parseInt(parts[1], 10);
          rDay = parseInt(parts[2], 10);
        } else {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          if (p2 > 1000) {
            rYear = p2;
            if (p0 <= 12 && p1 <= 31) {
              rMonth = p0;
              rDay = p1;
            } else {
              rDay = p0;
              rMonth = p1;
            }
          }
        }
      }

      const recordMonthName = (r.BULAN || '').toUpperCase().replace(/\s*2026/g, '').trim();
      const monthMatches =
        rMonth === selectedMonthIndex + 1 ||
        (recordMonthName && recordMonthName === selectedMonth.toUpperCase());

      if (monthMatches && rDay >= 1 && rDay <= 31) {
        const val = r.VALUE || 0;
        if (r.BA && r.BA !== '-' && r.BA.toUpperCase() !== 'NON BA' && r.BA.toUpperCase() !== 'STANDBY') {
          const bKey = r.BA.trim().toLowerCase();
          if (!baMap[bKey]) baMap[bKey] = {};
          baMap[bKey][rDay] = (baMap[bKey][rDay] || 0) + val;
        }
        if (r.NAMA_STORE) {
          const sKey = r.NAMA_STORE.trim().toLowerCase();
          if (!storeMap[sKey]) storeMap[sKey] = {};
          storeMap[sKey][rDay] = (storeMap[sKey][rDay] || 0) + val;
        }
      }
    }

    return { baDailySalesMap: baMap, storeDailySalesMap: storeMap };
  }, [records, selectedMonth, selectedMonthIndex]);

  // Helper: Deteksi Trainer ARA vs RATIH
  const resolveTrainerForBa = (
    storeName: string,
    salesName?: string,
    coverArea?: string,
    region?: string
  ): 'ARA' | 'RATIH' => {
    const t = getTrainerForRecord({
      NAMA_STORE: storeName,
      SALES: salesName,
      COVER_AREA: coverArea,
      REGION: region,
    } as TransactionRecord);
    const upper = (t || '').toUpperCase();
    if (upper.includes('RATIH')) return 'RATIH';
    if (upper.includes('ARA')) return 'ARA';
    const sUpper = (salesName || '').toUpperCase();
    if (sUpper.includes('ABDUL') || sUpper.includes('RAHIM') || sUpper.includes('SUPRIADI')) {
      return 'RATIH';
    }
    return 'ARA';
  };

  // Evaluasi Kedisiplinan & Gaji Bersih Lengkap (1 s/d 30 Hari per BA)
  // Dilengkapi deduplikasi toko dan BA, filter trainer, edit, hapus, dan tambah BA
  const punishmentList: BaPunishmentSummaryItem[] = useMemo(() => {
    // 1. Gabungkan BA dari transaksi sheet (costData.baList) dan BA kustom yang ditambahkan
    const rawCandidates: Array<{
      baName: string;
      baNumber: string;
      storeName: string;
      coverArea: string;
      region: string;
      salesName: string;
      spvName: string;
      baseSalary: number;
      sellOutActual: number;
      trainerName?: 'ARA' | 'RATIH';
      isCustomAdded?: boolean;
    }> = [];

    costData.baList.forEach((ba) => {
      rawCandidates.push({
        baName: ba.baName,
        baNumber: ba.baNumber,
        storeName: ba.storeName,
        coverArea: ba.coverArea,
        region: ba.region,
        salesName: ba.salesName || '-',
        spvName: ba.spv || '-',
        baseSalary: ba.baseSalary || 3900000,
        sellOutActual: ba.sellOutActual || 0,
        isCustomAdded: false,
      });
    });

    customAddedBas.forEach((b) => {
      rawCandidates.push({
        baName: b.baName,
        baNumber: b.baNumber || 'BA-NEW',
        storeName: b.storeName,
        coverArea: b.coverArea || 'Pekanbaru',
        region: b.region || 'Riau',
        salesName: b.salesName || 'ILHAMSYAH',
        spvName: b.spvName || 'SPV',
        baseSalary: b.baseSalary || 3900000,
        sellOutActual: 0,
        trainerName: b.trainerName,
        isCustomAdded: true,
      });
    });

    // 2. Strict Deduplication: Toko dan Nama BA yang sama TIDAK BOLEH ADA DUPLIKAT
    const seenStoreBaKeys = new Set<string>();
    const deduplicatedCandidates: typeof rawCandidates = [];

    for (const raw of rawCandidates) {
      const normStore = (raw.storeName || '').trim().toUpperCase();
      const normBa = (raw.baName || '').trim().toUpperCase();
      const compositeKey = `${normStore}___${normBa}`;

      // Lewati jika telah dihapus oleh pengguna
      if (
        deletedBaKeys.includes(compositeKey) ||
        deletedBaKeys.includes(normBa) ||
        deletedBaKeys.includes(normStore)
      ) {
        continue;
      }

      // Hilangkan duplikasi jika toko dan BA sama persis
      if (seenStoreBaKeys.has(compositeKey)) {
        continue;
      }
      seenStoreBaKeys.add(compositeKey);
      deduplicatedCandidates.push(raw);
    }

    return deduplicatedCandidates.map((ba) => {
      const origStore = (ba.storeName || '').trim().toUpperCase();
      const origBa = (ba.baName || '').trim().toUpperCase();
      const compositeKey = `${origStore}___${origBa}`;

      // Ambil override kustom jika nama BA, Toko, Sales, Trainer, Gaji, atau Denda diedit
      const cfg =
        customBaConfigs[compositeKey] ||
        customBaConfigs[origBa] ||
        customSalaryOverrides[ba.baName] ||
        customSalaryOverrides[ba.baNumber];

      const effectiveBaName =
        cfg && 'baName' in cfg && cfg.baName ? cfg.baName : ba.baName;
      const effectiveStoreName =
        cfg && 'storeName' in cfg && cfg.storeName ? cfg.storeName : ba.storeName;
      const effectiveSalesName =
        cfg && 'salesName' in cfg && cfg.salesName ? cfg.salesName : ba.salesName;
      const effectiveCoverArea =
        cfg && 'coverArea' in cfg && cfg.coverArea ? cfg.coverArea : ba.coverArea;
      const effectiveTrainer: 'ARA' | 'RATIH' =
        cfg && 'trainerName' in cfg && cfg.trainerName
          ? cfg.trainerName
          : ba.trainerName ||
            resolveTrainerForBa(
              effectiveStoreName,
              effectiveSalesName,
              effectiveCoverArea,
              ba.region
            );

      const baKey = effectiveBaName.trim().toLowerCase();
      const storeKey = effectiveStoreName.trim().toLowerCase();
      const storageKey = `${selectedMonth}_${baKey}`;
      const overridesForBa = baDailyOverrides[storageKey] || {};

      const actualBaDays =
        baDailySalesMap[baKey] || baDailySalesMap[origBa.toLowerCase()] || {};
      const actualStoreDays =
        storeDailySalesMap[storeKey] || storeDailySalesMap[origStore.toLowerCase()] || {};

      const dailySchedule: BaDailyDayRecord[] = [];

      for (let day = 1; day <= daysInSelectedMonth; day++) {
        const dayName = getIndonesianDayName(day, selectedMonthIndex, 2026);
        const dateStr = `2026-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(
          day
        ).padStart(2, '0')}`;
        const actualSales = actualBaDays[day] || actualStoreDays[day] || 0;
        const hasActualSellOut = actualSales > 0;

        const override = overridesForBa[day];

        if (override) {
          // Status kustom yang diset pengguna
          const status = override.status;
          const denda =
            override.dendaNominal !== undefined
              ? override.dendaNominal
              : status === 'no_sell'
              ? finePerDayRate
              : 0;
          const sellOut =
            override.customSellOut !== undefined ? override.customSellOut : actualSales;

          dailySchedule.push({
            dayNum: day,
            dateStr,
            dayName,
            status,
            dendaNominal: denda,
            sellOutAmount: sellOut,
            isSystemDetected: false,
            isCustomOverride: true,
            note: override.note,
          });
        } else {
          // Deteksi otomatis sistem:
          // Jika ada penjualan sell out -> Report (denda Rp 0)
          // Jika tidak ada penjualan sell out -> No sell (denda Rp 25.000)
          if (hasActualSellOut) {
            dailySchedule.push({
              dayNum: day,
              dateStr,
              dayName,
              status: 'report',
              dendaNominal: 0,
              sellOutAmount: actualSales,
              isSystemDetected: true,
              isCustomOverride: false,
            });
          } else {
            dailySchedule.push({
              dayNum: day,
              dateStr,
              dayName,
              status: 'no_sell',
              dendaNominal: finePerDayRate, // Default Rp 25.000
              sellOutAmount: 0,
              isSystemDetected: true,
              isCustomOverride: false,
            });
          }
        }
      }

      const reportDays = dailySchedule.filter((s) => s.status === 'report').length;
      const noSellDays = dailySchedule.filter((s) => s.status === 'no_sell').length;
      const offDays = dailySchedule.filter((s) => s.status === 'off_day').length;

      const totalCalculatedDenda = dailySchedule
        .filter((s) => s.status === 'no_sell')
        .reduce((sum, s) => sum + s.dendaNominal, 0);

      const effectiveBaseSalary =
        cfg?.baseSalary !== undefined ? cfg.baseSalary : ba.baseSalary;
      const effectiveDenda =
        cfg?.customDendaTotal !== undefined
          ? cfg.customDendaTotal
          : totalCalculatedDenda;
      const effectiveTakeHomePay =
        cfg?.customTakeHomePay !== undefined
          ? cfg.customTakeHomePay
          : Math.max(0, effectiveBaseSalary - effectiveDenda);

      let disciplineBadge: 'tertib' | 'peringatan_1' | 'peringatan_2' | 'peringatan_sp' = 'tertib';
      if (noSellDays >= 5) {
        disciplineBadge = 'peringatan_sp';
      } else if (noSellDays >= 3) {
        disciplineBadge = 'peringatan_2';
      } else if (noSellDays >= 1) {
        disciplineBadge = 'peringatan_1';
      }

      return {
        baName: effectiveBaName,
        baNumber: ba.baNumber,
        storeName: effectiveStoreName,
        coverArea: effectiveCoverArea,
        region: ba.region,
        salesName: effectiveSalesName,
        spvName: ba.spvName || '-',
        trainerName: effectiveTrainer,
        brand: 'Multi-Brand',
        totalNihilDays: noSellDays,
        totalOffDays: offDays,
        totalReportDays: reportDays,
        noSellDays,
        daysInMonthCount: daysInSelectedMonth,
        totalDendaNominal: effectiveDenda,
        disciplineBadge,
        incidents: incidents.filter((i) => i.baName.toLowerCase() === baKey),
        dailySchedule,
        sellOutActual:
          dailySchedule.reduce((sum, s) => sum + s.sellOutAmount, 0) || ba.sellOutActual,
        baseSalary: effectiveBaseSalary,
        totalTakeHomePay: effectiveTakeHomePay,
        isManualSalaryEdited: Boolean(cfg),
        customBaseSalary: cfg?.baseSalary,
        customDendaTotal: cfg?.customDendaTotal,
      };
    }).sort((a, b) => b.noSellDays - a.noSellDays);
  }, [
    costData,
    customAddedBas,
    deletedBaKeys,
    customBaConfigs,
    selectedMonth,
    daysInSelectedMonth,
    selectedMonthIndex,
    baDailyOverrides,
    baDailySalesMap,
    storeDailySalesMap,
    finePerDayRate,
    customSalaryOverrides,
    incidents,
  ]);

  // Handler: Set Status Tanggal Tertentu (Report, No sell, Off day)
  const handleSetDayStatus = (
    baName: string,
    dayNum: number,
    newStatus: BaDayStatus,
    customDenda?: number,
    note?: string
  ) => {
    const baKey = baName.trim().toLowerCase();
    const storageKey = `${selectedMonth}_${baKey}`;
    const existingForBa = { ...(baDailyOverrides[storageKey] || {}) };

    const finalDenda =
      customDenda !== undefined
        ? customDenda
        : newStatus === 'no_sell'
        ? finePerDayRate
        : 0;

    existingForBa[dayNum] = {
      ...existingForBa[dayNum],
      status: newStatus,
      dendaNominal: finalDenda,
      note: note || (newStatus === 'off_day' ? 'Jadwal Libur Resmi BA' : undefined),
    };

    const updatedOverrides = {
      ...baDailyOverrides,
      [storageKey]: existingForBa,
    };

    saveBaDailyOverrides(updatedOverrides);

    const statusLabel =
      newStatus === 'report' ? 'Report' : newStatus === 'no_sell' ? 'No sell' : 'Off day';
    showToast(
      `Tgl ${dayNum} ${selectedMonth} untuk ${baName} diubah jadi "${statusLabel}"!`
    );
  };

  // Handler: Jadwalkan Hari Minggu Jadi Off Day (Bebas Denda)
  const handleSetSundaysAsOff = (baName: string) => {
    const baKey = baName.trim().toLowerCase();
    const storageKey = `${selectedMonth}_${baKey}`;
    const existingForBa = { ...(baDailyOverrides[storageKey] || {}) };
    let count = 0;

    for (let d = 1; d <= daysInSelectedMonth; d++) {
      const dayName = getIndonesianDayName(d, selectedMonthIndex, 2026);
      if (dayName === 'Minggu') {
        existingForBa[d] = {
          ...existingForBa[d],
          status: 'off_day',
          dendaNominal: 0,
          note: 'Hari Libur Resmi Minggu (Bebas Denda)',
        };
        count++;
      }
    }

    const updatedOverrides = {
      ...baDailyOverrides,
      [storageKey]: existingForBa,
    };
    saveBaDailyOverrides(updatedOverrides);
    showToast(`${count} hari Minggu di ${selectedMonth} diset sebagai "Off day" (Bebas Denda)!`);
  };

  // Handler: Set Semua Hari Jadi Report
  const handleSetAllDaysReport = (baName: string) => {
    const baKey = baName.trim().toLowerCase();
    const storageKey = `${selectedMonth}_${baKey}`;
    const existingForBa = { ...(baDailyOverrides[storageKey] || {}) };

    for (let d = 1; d <= daysInSelectedMonth; d++) {
      existingForBa[d] = {
        ...existingForBa[d],
        status: 'report',
        dendaNominal: 0,
      };
    }

    const updatedOverrides = {
      ...baDailyOverrides,
      [storageKey]: existingForBa,
    };
    saveBaDailyOverrides(updatedOverrides);
    showToast(`Seluruh 30 hari untuk ${baName} diatur menjadi "Report" (Aktif)!`);
  };

  // Handler: Reset Riwayat Kehadiran BA Sesuai Sheet
  const handleResetBaHistory = (baName: string) => {
    const baKey = baName.trim().toLowerCase();
    const storageKey = `${selectedMonth}_${baKey}`;
    const updated = { ...baDailyOverrides };
    delete updated[storageKey];
    saveBaDailyOverrides(updated);
    showToast(`Riwayat kehadiran & denda ${baName} berhasil direset sesuai data transaksi sheet.`);
  };

  // Handler: Simpan Perubahan Tarif Denda Global
  const handleSaveFineRate = () => {
    setFinePerDayRate(tempFineRateInput);
    try {
      localStorage.setItem(STORAGE_KEY_BA_FINE_RATE, String(tempFineRateInput));
    } catch (e) {
      console.warn(e);
    }
    setIsEditFineRateModalOpen(false);
    showToast(`Tarif denda harian berhasil diubah menjadi ${formatRupiah(tempFineRateInput)} / Hari!`);
  };

  // Open Edit BA Modal (Full: Nama BA, Toko, Sales, Trainer, Gaji, Denda)
  const handleOpenEditBa = (ba: BaPunishmentSummaryItem) => {
    setEditingBaItem(ba);
    setEditBaNameInput(ba.baName);
    setEditStoreNameInput(ba.storeName);
    setEditSalesNameInput(ba.salesName);
    setEditTrainerNameInput((ba.trainerName as 'ARA' | 'RATIH') || 'ARA');
    setEditCoverAreaInput(ba.coverArea);
    setEditBaseSalaryInput(ba.baseSalary);
    setEditDendaInput(ba.totalDendaNominal);
    setEditTakeHomePayInput(ba.totalTakeHomePay);
  };

  // Save Edit BA Config
  const handleSaveBaConfig = () => {
    if (!editingBaItem) return;
    const origStore = (editingBaItem.storeName || '').trim().toUpperCase();
    const origBa = (editingBaItem.baName || '').trim().toUpperCase();
    const compositeKey = `${origStore}___${origBa}`;

    const updated: Record<string, CustomBaConfig> = {
      ...customBaConfigs,
      [compositeKey]: {
        baName: editBaNameInput.trim().toUpperCase(),
        storeName: editStoreNameInput.trim().toUpperCase(),
        salesName: editSalesNameInput.trim().toUpperCase(),
        trainerName: editTrainerNameInput,
        coverArea: editCoverAreaInput.trim(),
        baseSalary: editBaseSalaryInput,
        customDendaTotal: editDendaInput,
        customTakeHomePay: editTakeHomePayInput,
      },
    };
    setCustomBaConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_CUSTOM_CONFIGS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingBaItem(null);
    showToast(`Data Beauty Advisor ${editBaNameInput} berhasil diperbarui!`);
  };

  // Reset BA Config
  const handleResetBaConfig = (ba: BaPunishmentSummaryItem) => {
    const origStore = (ba.storeName || '').trim().toUpperCase();
    const origBa = (ba.baName || '').trim().toUpperCase();
    const compositeKey = `${origStore}___${origBa}`;

    const updated = { ...customBaConfigs };
    delete updated[compositeKey];
    delete updated[origBa];
    setCustomBaConfigs(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_CUSTOM_CONFIGS, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingBaItem(null);
    showToast(`Konfigurasi ${ba.baName} dikembalikan ke nilai awal.`);
  };

  // Handler: Tambah BA Baru (+ Tambah BA)
  const handleAddBa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBaNameInput.trim() || !addStoreNameInput.trim()) return;

    const newBa: CustomAddedBa = {
      id: `custom-ba-${Date.now()}`,
      baName: addBaNameInput.trim().toUpperCase(),
      baNumber: addBaNumberInput.trim() || `BA-${Math.floor(100 + Math.random() * 900)}`,
      storeName: addStoreNameInput.trim().toUpperCase(),
      salesName: addSalesNameInput.trim().toUpperCase() || 'ILHAMSYAH',
      trainerName: addTrainerNameInput,
      coverArea: addCoverAreaInput.trim() || 'PEKANBARU',
      region: 'RIAU',
      baseSalary: addBaseSalaryInput > 0 ? addBaseSalaryInput : 3900000,
    };

    const updated = [...customAddedBas, newBa];
    setCustomAddedBas(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BA_ADDED_CUSTOM, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setIsAddBaModalOpen(false);
    setAddBaNameInput('');
    setAddStoreNameInput('');
    setAddBaNumberInput('');
    showToast(`Beauty Advisor ${newBa.baName} di toko ${newBa.storeName} berhasil ditambahkan!`);
  };

  // Handler: Konfirmasi Hapus BA (Delete)
  const handleConfirmDeleteBa = () => {
    if (!baToDelete) return;
    const normStore = (baToDelete.storeName || '').trim().toUpperCase();
    const normBa = (baToDelete.baName || '').trim().toUpperCase();
    const compositeKey = `${normStore}___${normBa}`;

    const updatedDeleted = Array.from(new Set([...deletedBaKeys, compositeKey, normBa]));
    setDeletedBaKeys(updatedDeleted);
    try {
      localStorage.setItem(STORAGE_KEY_BA_DELETED_KEYS, JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn(e);
    }

    const updatedCustom = customAddedBas.filter((b) => {
      const bKey = `${(b.storeName || '').trim().toUpperCase()}___${(b.baName || '').trim().toUpperCase()}`;
      return bKey !== compositeKey && b.baName.trim().toUpperCase() !== normBa;
    });
    setCustomAddedBas(updatedCustom);
    try {
      localStorage.setItem(STORAGE_KEY_BA_ADDED_CUSTOM, JSON.stringify(updatedCustom));
    } catch (e) {
      console.warn(e);
    }

    const name = baToDelete.baName;
    setBaToDelete(null);
    showToast(`Beauty Advisor ${name} berhasil dihapus dari daftar.`);
  };

  // Handler: Pulihkan BA yang Dihapus
  const handleRestoreDeletedBas = () => {
    setDeletedBaKeys([]);
    try {
      localStorage.removeItem(STORAGE_KEY_BA_DELETED_KEYS);
    } catch (e) {
      console.warn(e);
    }
    showToast('Seluruh BA yang pernah dihapus berhasil dipulihkan.');
  };

  // Catat Hari Nihil / Off Baru Secara Manual
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaName || !newDate) return;

    const matchedBa = punishmentList.find(
      (b) => b.baName.toLowerCase() === newBaName.toLowerCase()
    );
    const isOff = newIncidentType === 'off';

    const newRecord: BaNihilIncidentRecord = {
      id: `inc-${Date.now()}`,
      baName: newBaName,
      baNumber: matchedBa?.baNumber || 'BA-NEW',
      storeName: newStoreName || matchedBa?.storeName || 'Counter Toko',
      brand: newBrand,
      date: newDate,
      dendaNominal: isOff ? 0 : newDendaNominal,
      reason: isOff
        ? newReason || 'Jadwal Hari Libur / Off Resmi BA'
        : newReason || 'Tidak mengirimkan laporan sell out harian',
      isDispensation: false,
      isOffDay: isOff,
      offNote: isOff ? 'BA Off / Libur Resmi (Bebas Denda)' : undefined,
    };

    const updatedInc = [newRecord, ...incidents];
    setIncidents(updatedInc);
    saveBaIncidents(updatedInc);

    // Sync juga ke daily schedule jika tanggal berada pada bulan berjalan
    const dayParsed = parseInt(newDate.split('-')[2] || '1', 10);
    if (dayParsed >= 1 && dayParsed <= daysInSelectedMonth) {
      handleSetDayStatus(newBaName, dayParsed, isOff ? 'off_day' : 'no_sell', isOff ? 0 : newDendaNominal);
    }

    setIsAddModalOpen(false);
    showToast(
      isOff
        ? `Hari libur/off untuk ${newBaName} berhasil dicatat (Bebas Denda)!`
        : `Hari nihil untuk ${newBaName} berhasil dicatat (Denda ${formatRupiah(newDendaNominal)})!`
    );
  };

  // Filtered List
  const filteredList = useMemo(() => {
    const effectiveSearch = (searchQuery || filters.searchQuery || '').trim().toLowerCase();
    return punishmentList.filter((item) => {
      if (statusFilter === 'tertib' && item.noSellDays > 0) return false;
      if (statusFilter === 'peringatan' && item.noSellDays === 0) return false;

      // Filter Trainer (Semua, ARA, RATIH)
      if (trainerFilter !== 'all') {
        const tr = (item.trainerName || '').toUpperCase();
        if (trainerFilter === 'ARA' && !tr.includes('ARA')) return false;
        if (trainerFilter === 'RATIH' && !tr.includes('RATIH')) return false;
      }

      // Global Sales
      if (
        filters.SALES &&
        filters.SALES !== 'ALL' &&
        item.salesName.toUpperCase() !== filters.SALES.toUpperCase()
      ) {
        return false;
      }

      // Global SPV
      if (
        filters.SPV &&
        filters.SPV !== 'ALL' &&
        item.spvName.toUpperCase() !== filters.SPV.toUpperCase()
      ) {
        return false;
      }

      // Global Store Name
      if (
        filters.NAMA_STORE &&
        filters.NAMA_STORE !== 'ALL' &&
        item.storeName.toUpperCase() !== filters.NAMA_STORE.toUpperCase()
      ) {
        return false;
      }

      // Global Region
      if (filters.REGION && filters.REGION !== 'ALL') {
        const reg = filters.REGION.toUpperCase();
        if (
          (item.region || '').toUpperCase() !== reg &&
          (item.coverArea || '').toUpperCase() !== reg
        ) {
          return false;
        }
      }

      // Free Search
      if (effectiveSearch) {
        const match =
          item.baName.toLowerCase().includes(effectiveSearch) ||
          item.storeName.toLowerCase().includes(effectiveSearch) ||
          item.salesName.toLowerCase().includes(effectiveSearch) ||
          item.spvName.toLowerCase().includes(effectiveSearch) ||
          (item.trainerName && item.trainerName.toLowerCase().includes(effectiveSearch)) ||
          (item.region && item.region.toLowerCase().includes(effectiveSearch)) ||
          (item.coverArea && item.coverArea.toLowerCase().includes(effectiveSearch));
        if (!match) return false;
      }

      return true;
    });
  }, [punishmentList, statusFilter, trainerFilter, searchQuery, filters]);

  // Hitungan BA per Trainer (ARA vs RATIH)
  const araBaCount = useMemo(
    () => punishmentList.filter((b) => (b.trainerName || '').toUpperCase().includes('ARA')).length,
    [punishmentList]
  );
  const ratihBaCount = useMemo(
    () => punishmentList.filter((b) => (b.trainerName || '').toUpperCase().includes('RATIH')).length,
    [punishmentList]
  );

  // KPI Stats
  const punishmentStats = useMemo(() => {
    const targetList = filteredList;
    const totalBa = targetList.length;
    const disciplinedBa = targetList.filter((b) => b.noSellDays === 0).length;
    const totalNoSellDays = targetList.reduce((acc, curr) => acc + (curr.noSellDays || 0), 0);
    const totalReportDays = targetList.reduce((acc, curr) => acc + (curr.totalReportDays || 0), 0);
    const totalOffDays = targetList.reduce((acc, curr) => acc + (curr.totalOffDays || 0), 0);
    const totalDendaNominal = targetList.reduce((acc, curr) => acc + curr.totalDendaNominal, 0);
    const spCount = targetList.filter((b) => b.disciplineBadge === 'peringatan_sp').length;

    return {
      totalBa,
      disciplinedBa,
      totalNoSellDays,
      totalReportDays,
      totalOffDays,
      totalDendaNominal,
      spCount,
    };
  }, [filteredList]);

  // Ekspor Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const headers = [
      'No',
      'Nama BA',
      'No BA',
      'Nama Toko / Outlet',
      'Trainer',
      'Cover Area',
      'Region',
      'Sales',
      'SPV',
      'Periode Bulan',
      'Hari Report (Ada Sell Out)',
      'Hari No Sell (Tanpa Penjualan)',
      'Hari Off Day (Libur Resmi)',
      'Tarif Denda Harian (Rp)',
      'Total Potongan Denda (Rp)',
      'Tingkat Kedisiplinan',
      'Realisasi Sell Out (Rp)',
      'Gaji Pokok Sebelum Denda (Rp)',
      'Gaji Bersih Diterima (Take Home Pay)',
    ];

    const rows = filteredList.map((b, idx) => [
      idx + 1,
      b.baName,
      b.baNumber,
      b.storeName,
      b.trainerName || 'ARA',
      b.coverArea,
      b.region,
      b.salesName,
      b.spvName,
      `${selectedMonth} 2026`,
      b.totalReportDays || 0,
      b.noSellDays || 0,
      b.totalOffDays || 0,
      finePerDayRate,
      b.totalDendaNominal,
      b.disciplineBadge === 'tertib'
        ? 'Sangat Disiplin (0 Nihil)'
        : b.disciplineBadge === 'peringatan_1'
        ? 'Peringatan 1 (SP1)'
        : b.disciplineBadge === 'peringatan_2'
        ? 'Peringatan 2 (SP2)'
        : 'Peringatan SP Berat (SP3)',
      b.sellOutActual,
      b.baseSalary,
      b.totalTakeHomePay,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, `Evaluasi_${selectedMonth}`);
    XLSX.writeFile(wb, `Evaluasi_Kedisiplinan_Gaji_BA_${selectedMonth}_2026.xlsx`);
    showToast('File Excel laporan evaluasi kedisiplinan BA berhasil diunduh!');
  };

  const getDisciplineBadge = (badge: string) => {
    switch (badge) {
      case 'tertib':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Sangat Tertib (0 Nihil)
          </span>
        );
      case 'peringatan_1':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Peringatan 1 (SP1)
          </span>
        );
      case 'peringatan_2':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            Peringatan 2 (SP2)
          </span>
        );
      case 'peringatan_sp':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            SP Berat (&ge; 5 Hari)
          </span>
        );
      default:
        return null;
    }
  };

  // Ambil data detail BA yang sedang dibuka di modal history 30 hari
  const liveBaHistoryData = useMemo(() => {
    if (!selectedBaFor30DayHistory) return null;
    return (
      punishmentList.find((b) => b.baName === selectedBaFor30DayHistory.baName) ||
      selectedBaFor30DayHistory
    );
  }, [punishmentList, selectedBaFor30DayHistory]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-md border border-rose-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white">
                Sistem Otomatis Evaluasi Penjualan Harian
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Periode: 1 s/d {daysInSelectedMonth} {selectedMonth} 2026
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Daftar Evaluasi Kedisiplinan &amp; Gaji Bersih Beauty Advisor (BA)
            </h2>
            <p className="text-xs text-rose-200/80 mt-1 max-w-3xl leading-relaxed">
              Sistem secara otomatis mengevaluasi pelaporan penjualan sell out dari tanggal 1 sampai {daysInSelectedMonth} sesuai bulan berjalan. Jika tidak ada penjualan sell out (<strong>No sell</strong>), BA dikenakan denda sebesar <strong>{formatRupiah(finePerDayRate)}</strong> per hari. Status dapat diedit per hari menjadi <strong>Report</strong>, <strong>No sell</strong>, atau <strong>Off day</strong> (hari libur/off resmi bebas denda).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Filter Bulan Berjalan */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              <span className="text-[11px] font-bold text-rose-200">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white font-bold">
                    {m} 2026 ({m === 'FEBRUARI' ? '28' : ['APRIL', 'JUNI', 'SEPTEMBER', 'NOVEMBER'].includes(m) ? '30' : '31'} Hari)
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Ubah Tarif Denda */}
            <button
              onClick={() => {
                setTempFineRateInput(finePerDayRate);
                setIsEditFineRateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-400/30 shadow-xs transition-all cursor-pointer"
              title="Ubah nominal denda harian No Sell"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-300" />
              <span>Denda: {formatRupiah(finePerDayRate)}/Hari</span>
              <Edit3 className="w-3 h-3 text-amber-300" />
            </button>

            {/* Tombol Tambah Catatan */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Manual</span>
            </button>

            {/* Tombol Ekspor Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Formula Box & Petunjuk Keterangan */}
        <div className="mt-4 p-3 rounded-xl bg-black/40 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="text-rose-200">
            <strong>Formula Gaji Bersih:</strong> Gaji Bersih = Gaji Pokok - (Hari No Sell &times; {formatRupiah(finePerDayRate)})
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <strong>Report:</strong> Ada penjualan (Rp 0)
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <strong>No sell:</strong> Tanpa penjualan (Denda {formatRupiah(finePerDayRate)})
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <strong>Off day:</strong> Libur resmi (Bebas denda)
            </span>
          </div>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total BA Terdaftar
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {punishmentStats.totalBa} BA
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            {punishmentStats.disciplinedBa} BA disiplin (0 hari nihil)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Hari Report (Ada Sell Out)
          </span>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {punishmentStats.totalReportDays} Hari
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            Tercatat ada transaksi penjualan
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/40">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
            Total Hari No Sell (Denda)
          </span>
          <div className="text-xl font-black font-mono text-rose-800 mt-1">
            {punishmentStats.totalNoSellDays} Hari
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">
            Tanpa penjualan sell out
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs bg-sky-50/30">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
            Total Hari Off Day (Libur)
          </span>
          <div className="text-xl font-black font-mono text-sky-700 mt-1">
            {punishmentStats.totalOffDays} Hari
          </div>
          <span className="text-[11px] text-sky-600 mt-0.5 block">
            Libur resmi &bull; Bebas denda (Rp 0)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-300 shadow-xs bg-rose-50/60 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">
            Total Potongan Denda
          </span>
          <div className="text-xl font-black font-mono text-rose-900 mt-1">
            -{formatRupiah(punishmentStats.totalDendaNominal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Akumulasi potongan gaji area
          </span>
        </div>
      </div>

      {/* Main Table: BA Punishment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              Daftar Evaluasi Kedisiplinan &amp; Gaji Bersih Beauty Advisor (BA) &bull; {selectedMonth} 2026
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Klik tombol <strong>"📅 Kalender &amp; History (1-{daysInSelectedMonth})"</strong> untuk memeriksa dan mengedit status harian (Report, No sell, Off day).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Trainer: Semua, ARA, RATIH */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTrainerFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  trainerFilter === 'all'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Trainer ({punishmentList.length})
              </button>
              <button
                type="button"
                onClick={() => setTrainerFilter('ARA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  trainerFilter === 'ARA'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span>Trainer ARA</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                  {araBaCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTrainerFilter('RATIH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  trainerFilter === 'RATIH'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-800 hover:bg-purple-50'
                }`}
              >
                <span>Trainer RATIH</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                  {ratihBaCount}
                </span>
              </button>
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="tertib">Tertib Saja (0 Hari No Sell)</option>
              <option value="peringatan">Ada Hari No Sell Saja</option>
            </select>

            {/* Free Search */}
            <div className="relative min-w-[190px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari BA / toko / sales / trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Tombol Tambah BA Baru */}
            <button
              type="button"
              onClick={() => setIsAddBaModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah BA</span>
            </button>

            {/* Pulihkan jika ada BA terhapus */}
            {deletedBaKeys.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreDeletedBas}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-all cursor-pointer"
                title="Pulihkan seluruh BA yang pernah dihapus"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Pulihkan ({deletedBaKeys.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabel Data Evaluasi */}
        <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nama BA</th>
                <th className="py-3 px-3">Counter Toko</th>
                <th className="py-3 px-3 text-center">Trainer</th>
                <th className="py-3 px-3">Coveran Sales &amp; Area</th>
                <th className="py-3 px-3 text-center">Rekap Kehadiran (1-{daysInSelectedMonth} {selectedMonth})</th>
                <th className="py-3 px-3 text-center">Hari No Sell (Tanpa Sell Out)</th>
                <th className="py-3 px-3 text-center">Tingkat Disiplin</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3 text-right">Total Denda ({formatRupiah(finePerDayRate)}/hr)</th>
                <th className="py-3 px-3 text-right">Realisasi Sell Out</th>
                <th className="py-3 px-3.5 text-right font-black text-slate-900 bg-slate-100">
                  Gaji Bersih Diterima
                </th>
                <th className="py-3 px-3 text-center">Aksi &amp; History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data Beauty Advisor yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((ba, idx) => (
                  <tr
                    key={`${ba.storeName}___${ba.baName}`}
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
                            Diedit
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{ba.baNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{ba.storeName}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          ba.trainerName === 'ARA'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-purple-100 text-purple-900 border-purple-300'
                        }`}
                      >
                        {ba.trainerName || 'ARA'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-semibold">{ba.salesName}</div>
                      <div className="text-[11px] text-slate-500">
                        {ba.coverArea} &bull; SPV: {ba.spvName}
                      </div>
                    </td>

                    {/* Rekap 3 Status: Report, No sell, Off day */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          title="Hari dengan laporan transaksi sell out"
                        >
                          ✓ {ba.totalReportDays || 0} Report
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            (ba.noSellDays || 0) > 0
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-black'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="Hari tanpa penjualan sell out"
                        >
                          ✗ {ba.noSellDays || 0} No sell
                        </span>
                        {(ba.totalOffDays ?? 0) > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200"
                            title="Hari libur/off resmi BA (Bebas Denda)"
                          >
                            ☕ {ba.totalOffDays} Off
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Hari No Sell & Hitungan Denda */}
                    <td className="py-3 px-3 text-center font-mono">
                      {ba.noSellDays > 0 ? (
                        <div>
                          <span className="font-black text-rose-700 text-xs">
                            {ba.noSellDays} Hari
                          </span>
                          <span className="block text-[10px] text-rose-600">
                            (-{formatRupiah(ba.totalDendaNominal)})
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-700 text-xs">0 Hari Nihil</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">{getDisciplineBadge(ba.disciplineBadge)}</td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatRupiah(ba.baseSalary)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-800">
                      {ba.totalDendaNominal > 0 ? `-${formatRupiah(ba.totalDendaNominal)}` : 'Rp 0'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-900 font-semibold">
                      {formatRupiah(ba.sellOutActual)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 bg-slate-100/70">
                      {formatRupiah(ba.totalTakeHomePay)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedBaFor30DayHistory(ba)}
                          className="px-2 py-1 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                          title="Buka Kalender & History Status Harian 1-30"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditBa(ba)}
                          className="px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer flex items-center gap-1"
                          title="Edit Data & Gaji BA"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setBaToDelete(ba)}
                          className="p-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-all"
                          title={`Hapus BA ${ba.baName}`}
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

      {/* MODAL: KALENDER & HISTORY 30 HARI INTERAKTIF (REPORT, NO SELL, OFF DAY) */}
      {selectedBaFor30DayHistory && liveBaHistoryData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    Riwayat Kehadiran &amp; Evaluasi Sell Out: {liveBaHistoryData.baName}
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800">
                      {selectedMonth} 2026
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {liveBaHistoryData.storeName} &bull; {liveBaHistoryData.coverArea} &bull; Sales: {liveBaHistoryData.salesName} &bull; SPV: {liveBaHistoryData.spvName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBaFor30DayHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Status BA & Tools Cepat */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Report: {liveBaHistoryData.totalReportDays || 0} Hari
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  No sell: {liveBaHistoryData.noSellDays || 0} Hari (-{formatRupiah(liveBaHistoryData.totalDendaNominal)})
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-sky-600" />
                  Off day: {liveBaHistoryData.totalOffDays || 0} Hari (Rp 0)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-900 border border-slate-300 font-mono">
                  Gaji Bersih: {formatRupiah(liveBaHistoryData.totalTakeHomePay)}
                </span>
              </div>

              {/* Tombol Aksi Cepat Massal */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetSundaysAsOff(liveBaHistoryData.baName)}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Otomatis tandai semua hari Minggu di bulan ini sebagai Off Day (Bebas Denda)"
                >
                  <Coffee className="w-3 h-3" />
                  <span>Set Hari Minggu Off</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllDaysReport(liveBaHistoryData.baName)}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Tandai semua hari jadi Report"
                >
                  <Check className="w-3 h-3" />
                  <span>Set Semua Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetBaHistory(liveBaHistoryData.baName)}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Kembalikan ke data transaksi sheet bawaan"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Sheet</span>
                </button>
              </div>
            </div>

            {/* Petunjuk Penggunaan */}
            <div className="mt-2.5 px-1 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                💡 Klik salah satu tombol (<strong>Report</strong>, <strong>No sell</strong>, atau <strong>Off day</strong>) pada tanggal yang ingin diubah. Perhitungan denda dan gaji bersih langsung diperbarui otomatis.
              </span>
              <span className="font-mono text-slate-700 font-bold">
                Tarif Denda: {formatRupiah(finePerDayRate)} / Hari No Sell
              </span>
            </div>

            {/* Grid Kalender 30 Hari */}
            <div className="overflow-y-auto flex-1 mt-3 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-100/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {liveBaHistoryData.dailySchedule?.map((dayRecord) => {
                  const isReport = dayRecord.status === 'report';
                  const isNoSell = dayRecord.status === 'no_sell';
                  const isOffDay = dayRecord.status === 'off_day';
                  const isSunday = dayRecord.dayName === 'Minggu';

                  return (
                    <div
                      key={dayRecord.dayNum}
                      className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        isReport
                          ? 'bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-200/50'
                          : isNoSell
                          ? 'bg-rose-50/70 border-rose-300 shadow-2xs ring-1 ring-rose-200/50'
                          : 'bg-sky-50/70 border-sky-300 shadow-2xs ring-1 ring-sky-200/50'
                      }`}
                    >
                      <div>
                        {/* Header Kartu Tanggal */}
                        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                          <span className={`font-black font-mono text-xs ${isSunday ? 'text-rose-700' : 'text-slate-900'}`}>
                            Tgl {String(dayRecord.dayNum).padStart(2, '0')} {selectedMonth.slice(0, 3)}
                          </span>
                          <span className={`text-[10px] font-bold ${isSunday ? 'text-rose-600' : 'text-slate-500'}`}>
                            {dayRecord.dayName}
                          </span>
                        </div>

                        {/* Status Aktif */}
                        <div className="my-2">
                          {isReport && (
                            <div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                                ✓ Report (Ada Sell Out)
                              </span>
                              <div className="text-[11px] font-mono font-bold text-slate-800 mt-1">
                                {dayRecord.sellOutAmount > 0
                                  ? formatRupiah(dayRecord.sellOutAmount)
                                  : 'Ada Transaksi (Rp 0)'}
                              </div>
                            </div>
                          )}

                          {isNoSell && (
                            <div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-block">
                                ✗ No sell (Tanpa Penjualan)
                              </span>
                              <div className="text-[11px] font-mono font-black text-rose-700 mt-1">
                                Denda: -{formatRupiah(dayRecord.dendaNominal)}
                              </div>
                            </div>
                          )}

                          {isOffDay && (
                            <div>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300 inline-block">
                                ☕ Off day (Libur Resmi)
                              </span>
                              <div className="text-[11px] font-mono font-bold text-sky-700 mt-1">
                                Bebas Denda (Rp 0)
                              </div>
                            </div>
                          )}

                          {dayRecord.isCustomOverride && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded inline-block mt-1">
                              *Diedit Manual
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3 Tombol Keterangan: Report, No sell, Off day */}
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <div className="text-[9.5px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Ubah Keterangan:
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleSetDayStatus(liveBaHistoryData.baName, dayRecord.dayNum, 'report')
                            }
                            className={`py-1 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                              isReport
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                            }`}
                            title="Tandai ada penjualan (Denda Rp 0)"
                          >
                            Report
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSetDayStatus(liveBaHistoryData.baName, dayRecord.dayNum, 'no_sell')
                            }
                            className={`py-1 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                              isNoSell
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800'
                            }`}
                            title={`Tandai tidak ada penjualan (Denda ${formatRupiah(finePerDayRate)})`}
                          >
                            No sell
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSetDayStatus(liveBaHistoryData.baName, dayRecord.dayNum, 'off_day')
                            }
                            className={`py-1 px-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                              isOffDay
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800'
                            }`}
                            title="Tandai hari libur resmi BA (Bebas Denda Rp 0)"
                          >
                            Off day
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-200 mt-3 shrink-0">
              <div className="text-xs text-slate-600">
                <span>
                  Total Evaluasi: <strong>{liveBaHistoryData.daysInMonthCount} Hari</strong> &bull;{' '}
                  <strong className="text-emerald-700">{liveBaHistoryData.totalReportDays} Report</strong> &bull;{' '}
                  <strong className="text-rose-700">{liveBaHistoryData.noSellDays} No sell</strong> &bull;{' '}
                  <strong className="text-sky-700">{liveBaHistoryData.totalOffDays} Off day</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBaFor30DayHistory(null)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBaFor30DayHistory(null);
                    showToast(`Riwayat evaluasi 30 hari untuk ${liveBaHistoryData.baName} berhasil disimpan!`);
                  }}
                  className="px-5 py-2 font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Simpan &amp; Terapkan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UBAH TARIF DENDA HARIAN NO SELL */}
      {isEditFineRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Ubah Tarif Denda No Sell
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFineRateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nominal Denda Per Hari Tanpa Penjualan (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={tempFineRateInput}
                  onChange={(e) => setTempFineRateInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-rose-50/50 font-mono font-black text-rose-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  *Default sistem: Rp 25.000 per hari jika BA tidak ada penjualan sell out.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTempFineRateInput(25000)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Reset Rp 25.000
                </button>
                <button
                  type="button"
                  onClick={() => setTempFineRateInput(50000)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Rp 50.000
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsEditFineRateModalOpen(false)}
                className="px-3 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFineRate}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Tarif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CATAT HARI NIHIL / BA OFF BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" />
                Catat Hari Nihil / Jadwal Off BA
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 mt-4">
              {/* Jenis Catatan: Nihil vs Off */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kehadiran / Hari</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewIncidentType('nihil');
                      setNewDendaNominal(finePerDayRate);
                      setNewReason('Tidak mengirimkan laporan sell out harian');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      newIncidentType === 'nihil'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">⚠️ Hari No sell (Denda)</div>
                    <div className="text-[10px] mt-0.5 text-rose-700 font-mono">
                      Denda {formatRupiah(finePerDayRate)} / Hari
                    </div>
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
                    <div className="text-[10px] mt-0.5 text-sky-700 font-semibold">
                      Bebas Denda (Rp 0)
                    </div>
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
                  value={
                    newIncidentType === 'off'
                      ? 'Rp 0 (BA Off / Libur Resmi)'
                      : `${formatRupiah(finePerDayRate)} / Hari`
                  }
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

      {/* MODAL: EDIT DETAIL & GAJI BEAUTY ADVISOR */}
      {editingBaItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                Edit Data &amp; Gaji Beauty Advisor (BA)
              </h3>
              <button
                type="button"
                onClick={() => setEditingBaItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 shrink-0 my-3 text-[11px] text-amber-900">
              Ubah nama BA, nama counter toko, sales penanggung jawab, trainer (ARA/RATIH), gaji pokok, dan potongan denda.
            </div>

            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama BA:</label>
                  <input
                    type="text"
                    required
                    value={editBaNameInput}
                    onChange={(e) => setEditBaNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Counter Toko:</label>
                  <input
                    type="text"
                    required
                    value={editStoreNameInput}
                    onChange={(e) => setEditStoreNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coveran Sales:</label>
                  <input
                    type="text"
                    value={editSalesNameInput}
                    onChange={(e) => setEditSalesNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer Penanggung Jawab:</label>
                  <select
                    value={editTrainerNameInput}
                    onChange={(e) => setEditTrainerNameInput(e.target.value as 'ARA' | 'RATIH')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="ARA">ARA (Trainer Area ARA)</option>
                    <option value="RATIH">RATIH (Trainer Area RATIH)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cover Area / Region:</label>
                <input
                  type="text"
                  value={editCoverAreaInput}
                  onChange={(e) => setEditCoverAreaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gaji Pokok (Rp):</label>
                  <input
                    type="number"
                    step="any"
                    value={editBaseSalaryInput}
                    onChange={(e) => {
                      const base = Number(e.target.value);
                      setEditBaseSalaryInput(base);
                      setEditTakeHomePayInput(Math.max(0, base - editDendaInput));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formatRupiah(editBaseSalaryInput)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Potongan Denda (Rp):</label>
                  <input
                    type="number"
                    step="any"
                    value={editDendaInput}
                    onChange={(e) => {
                      const denda = Number(e.target.value);
                      setEditDendaInput(denda);
                      setEditTakeHomePayInput(Math.max(0, editBaseSalaryInput - denda));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/50 font-mono font-bold text-rose-800"
                  />
                  <span className="text-[10px] text-rose-500 mt-0.5 block">
                    -{formatRupiah(editDendaInput)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                    Gaji Bersih Diterima (Take Home Pay)
                  </span>
                  <span className="text-base font-black font-mono text-emerald-900">
                    {formatRupiah(editTakeHomePayInput)}
                  </span>
                </div>
                <div className="w-36">
                  <input
                    type="number"
                    step="any"
                    value={editTakeHomePayInput}
                    onChange={(e) => setEditTakeHomePayInput(Number(e.target.value))}
                    className="w-full px-2 py-1 text-right bg-white rounded-lg border border-emerald-300 font-mono font-bold text-emerald-900 text-xs"
                    title="Override Gaji Bersih Langsung"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => handleResetBaConfig(editingBaItem)}
                className="px-3 py-2 font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Awal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBaItem(null)}
                  className="px-3 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBaConfig}
                  className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH BEAUTY ADVISOR BARU */}
      {isAddBaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Beauty Advisor (BA) Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBa} className="space-y-3.5 overflow-y-auto pr-1 flex-1 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama BA: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SITI AISYAH"
                    value={addBaNameInput}
                    onChange={(e) => setAddBaNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor / ID BA:</label>
                  <input
                    type="text"
                    placeholder="Contoh: BA-123 (opsional)"
                    value={addBaNumberInput}
                    onChange={(e) => setAddBaNumberInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Counter Toko: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TOKO CANTIK JELITA"
                  value={addStoreNameInput}
                  onChange={(e) => setAddStoreNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coveran Sales:</label>
                  <input
                    type="text"
                    placeholder="Contoh: ILHAMSYAH"
                    value={addSalesNameInput}
                    onChange={(e) => setAddSalesNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer:</label>
                  <select
                    value={addTrainerNameInput}
                    onChange={(e) => setAddTrainerNameInput(e.target.value as 'ARA' | 'RATIH')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="ARA">Trainer ARA</option>
                    <option value="RATIH">Trainer RATIH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cover Area:</label>
                  <input
                    type="text"
                    placeholder="Contoh: PEKANBARU"
                    value={addCoverAreaInput}
                    onChange={(e) => setAddCoverAreaInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gaji Pokok (Rp):</label>
                  <input
                    type="number"
                    step="any"
                    value={addBaseSalaryInput}
                    onChange={(e) => setAddBaseSalaryInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddBaModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Simpan &amp; Tambahkan BA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS BA */}
      {baToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Hapus Beauty Advisor?</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Tindakan ini akan menyembunyikan BA dari evaluasi.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 my-3">
              <div className="font-extrabold text-slate-900 text-sm">{baToDelete.baName}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Counter: {baToDelete.storeName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trainer: {baToDelete.trainerName || 'ARA'} &bull; Sales: {baToDelete.salesName}</div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              BA ini tidak akan dihitung dalam daftar kedisiplinan dan gaji bulan {selectedMonth}. Anda dapat memulihkannya sewaktu-waktu dengan tombol <strong>"Pulihkan"</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setBaToDelete(null)}
                className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBa}
                className="px-4 py-2 font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus BA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
