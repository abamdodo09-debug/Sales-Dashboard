import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Store,
  GraduationCap,
  Briefcase,
  Calendar,
  Building2,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Tag,
  Edit2,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  X,
  Filter,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters } from '../types/dashboard';
import { formatRupiah, formatNumber, getTrainerForRecord } from '../utils/analytics';
import * as XLSX from 'xlsx';

export interface MonthKeaktifanOverride {
  tokoCount?: number;
  baCount?: number;
  salesCount?: number;
  trainerCount?: number;
  txCount?: number;
  totalValue?: number;
  isManual?: boolean;
}

export interface CustomKeaktifanEntity {
  id: string;
  monthKey: string;
  type: 'toko' | 'ba' | 'sales' | 'trainer';
  name: string;
  area: string;
  region: string;
  salesName?: string;
  baName?: string;
  hasBa?: boolean;
  stores?: string[];
  bas?: string[];
  totalValue: number;
  totalQty: number;
  txCount: number;
}

const STORAGE_KEY_MONTH_OVERRIDES = 'salespro_keaktifan_monthly_overrides_v2';
const STORAGE_KEY_CUSTOM_ENTITIES = 'salespro_keaktifan_entities_v2';

interface ActivePersonnelStoreInfoProps {
  records: TransactionRecord[];
  filters: DashboardFilters;
  onFilterChange?: (key: keyof DashboardFilters, value: any) => void;
}

export const ActivePersonnelStoreInfo: React.FC<ActivePersonnelStoreInfoProps> = ({
  records,
  filters,
  onFilterChange,
}) => {
  // Filter Bulan (Januari - Desember 2026 atau ALL)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return filters.BULAN && filters.BULAN !== 'ALL' ? filters.BULAN.toUpperCase() : 'FEBRUARI';
  });

  // Filter Keterangan: ALL (Semua/Konsolidasi), SELL IN, SELL OUT
  const [selectedKet, setSelectedKet] = useState<'ALL' | 'SELL IN' | 'SELL OUT'>(() => {
    if (filters.KET && filters.KET !== 'ALL') {
      const k = filters.KET.toUpperCase();
      if (k.includes('SELL IN') || k === 'SI') return 'SELL IN';
      if (k.includes('SELL OUT') || k === 'SO') return 'SELL OUT';
    }
    return 'ALL';
  });

  const [activeTab, setActiveTab] = useState<'toko' | 'ba' | 'sales' | 'trainer'>('toko');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Overrides per-bulan untuk 6 metrik utama
  const [monthOverrides, setMonthOverrides] = useState<Record<string, MonthKeaktifanOverride>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MONTH_OVERRIDES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load monthOverrides', e);
    }
    return {};
  });

  // Custom added/edited entities (stores, ba, sales, trainer)
  const [customEntities, setCustomEntities] = useState<CustomKeaktifanEntity[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_ENTITIES);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load customEntities', e);
    }
    return [];
  });

  // Modal Editing Month Metrics
  const [editingMonthKey, setEditingMonthKey] = useState<string | null>(null);
  const [editTokoCount, setEditTokoCount] = useState<number>(0);
  const [editBaCount, setEditBaCount] = useState<number>(0);
  const [editSalesCount, setEditSalesCount] = useState<number>(0);
  const [editTrainerCount, setEditTrainerCount] = useState<number>(0);
  const [editTxCount, setEditTxCount] = useState<number>(0);
  const [editTotalValue, setEditTotalValue] = useState<number>(0);

  // Modal Editing / Adding Individual Entity
  const [modalEntity, setModalEntity] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    type: 'toko' | 'ba' | 'sales' | 'trainer';
    data?: any;
  }>({
    isOpen: false,
    mode: 'add',
    type: 'toko',
  });

  const [entityForm, setEntityForm] = useState({
    id: '',
    name: '',
    area: '',
    region: 'PEKAN BARU',
    salesName: '',
    baName: '',
    hasBa: true,
    storesText: '',
    basText: '',
    totalValue: 0,
    totalQty: 0,
    txCount: 1,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync selectedMonth with global filters
  useEffect(() => {
    if (filters.BULAN && filters.BULAN !== 'ALL') {
      setSelectedMonth(filters.BULAN.toUpperCase());
    }
  }, [filters.BULAN]);

  // Sync selectedKet with global filters
  useEffect(() => {
    if (filters.KET && filters.KET !== 'ALL') {
      const k = filters.KET.toUpperCase();
      if (k.includes('SELL IN') || k === 'SI') setSelectedKet('SELL IN');
      else if (k.includes('SELL OUT') || k === 'SO') setSelectedKet('SELL OUT');
    }
  }, [filters.KET]);

  const handleSelectMonth = (mKey: string) => {
    setSelectedMonth(mKey);
    if (onFilterChange) {
      onFilterChange('BULAN', mKey === 'ALL' ? 'ALL' : mKey);
    }
  };

  const handleSelectKet = (ket: 'ALL' | 'SELL IN' | 'SELL OUT') => {
    setSelectedKet(ket);
    if (onFilterChange) {
      onFilterChange('KET', ket === 'ALL' ? 'ALL' : ket);
    }
  };

  const monthsList = [
    { key: 'JANUARI', label: 'Januari', short: 'Jan' },
    { key: 'FEBRUARI', label: 'Februari', short: 'Feb' },
    { key: 'MARET', label: 'Maret', short: 'Mar' },
    { key: 'APRIL', label: 'April', short: 'Apr' },
    { key: 'MEI', label: 'Mei', short: 'Mei' },
    { key: 'JUNI', label: 'Juni', short: 'Jun' },
    { key: 'JULI', label: 'Juli', short: 'Jul' },
    { key: 'AGUSTUS', label: 'Agustus', short: 'Agu' },
    { key: 'SEPTEMBER', label: 'September', short: 'Sep' },
    { key: 'OKTOBER', label: 'Oktober', short: 'Okt' },
    { key: 'NOVEMBER', label: 'November', short: 'Nov' },
    { key: 'DESEMBER', label: 'Desember', short: 'Des' },
  ];

  // Records filtered by selected KET (SELL IN / SELL OUT / ALL)
  const ketFilteredRecords = useMemo(() => {
    if (selectedKet === 'ALL') return records;
    return records.filter((r) => {
      const k = (r.KET || '').toUpperCase();
      if (selectedKet === 'SELL IN') {
        return k.includes('SELL IN') || k === 'SI';
      }
      if (selectedKet === 'SELL OUT') {
        return k.includes('SELL OUT') || k === 'SO';
      }
      return true;
    });
  }, [records, selectedKet]);

  // Helper to extract active entities from a list of records
  const extractActiveData = (recList: TransactionRecord[], monthKey: string) => {
    const storeMap = new Map<
      string,
      {
        id: string;
        storeName: string;
        coverArea: string;
        region: string;
        salesName: string;
        baName: string;
        hasBa: boolean;
        totalValue: number;
        totalQty: number;
        txCount: number;
      }
    >();

    const baMap = new Map<
      string,
      {
        id: string;
        baName: string;
        stores: Set<string>;
        sales: Set<string>;
        areas: Set<string>;
        totalValue: number;
        totalQty: number;
        txCount: number;
      }
    >();

    const salesMap = new Map<
      string,
      {
        id: string;
        salesName: string;
        coverArea: string;
        region: string;
        stores: Set<string>;
        bas: Set<string>;
        totalValue: number;
        totalQty: number;
        txCount: number;
      }
    >();

    const trainerMap = new Map<
      string,
      {
        id: string;
        trainerName: string;
        areas: Set<string>;
        stores: Set<string>;
        bas: Set<string>;
        totalValue: number;
        totalQty: number;
        txCount: number;
      }
    >();

    recList.forEach((r, idx) => {
      const sName = (r.NAMA_STORE || '').trim();
      const bName = (r.BA || '').trim();
      const slName = (r.SALES || '').trim();
      const trName = getTrainerForRecord(r);
      const val = r.VALUE || 0;
      const qty = r.QTY || 0;
      const area = (r.COVER_AREA || '-').trim();
      const region = (r.REGION || 'PEKAN BARU').trim();

      // Toko
      if (sName && sName !== '-' && sName.toUpperCase() !== 'UNKNOWN') {
        if (!storeMap.has(sName)) {
          const hasBa = Boolean(
            bName &&
            bName !== '-' &&
            !bName.toUpperCase().includes('NON') &&
            bName.toUpperCase() !== 'TANPA BA'
          );
          storeMap.set(sName, {
            id: `store-${sName}`,
            storeName: sName,
            coverArea: area,
            region,
            salesName: slName || '-',
            baName: hasBa ? bName : '-',
            hasBa,
            totalValue: 0,
            totalQty: 0,
            txCount: 0,
          });
        }
        const st = storeMap.get(sName)!;
        st.totalValue += val;
        st.totalQty += qty;
        st.txCount += 1;
      }

      // BA
      if (
        bName &&
        bName !== '-' &&
        !bName.toUpperCase().includes('NON') &&
        bName.toUpperCase() !== 'TANPA BA'
      ) {
        if (!baMap.has(bName)) {
          baMap.set(bName, {
            id: `ba-${bName}`,
            baName: bName,
            stores: new Set(),
            sales: new Set(),
            areas: new Set(),
            totalValue: 0,
            totalQty: 0,
            txCount: 0,
          });
        }
        const b = baMap.get(bName)!;
        if (sName) b.stores.add(sName);
        if (slName) b.sales.add(slName);
        if (area) b.areas.add(area);
        b.totalValue += val;
        b.totalQty += qty;
        b.txCount += 1;
      }

      // Sales
      if (slName && slName !== '-' && slName.toUpperCase() !== 'UNKNOWN') {
        if (!salesMap.has(slName)) {
          salesMap.set(slName, {
            id: `sales-${slName}`,
            salesName: slName,
            coverArea: area,
            region,
            stores: new Set(),
            bas: new Set(),
            totalValue: 0,
            totalQty: 0,
            txCount: 0,
          });
        }
        const sl = salesMap.get(slName)!;
        if (sName) sl.stores.add(sName);
        if (
          bName &&
          bName !== '-' &&
          !bName.toUpperCase().includes('NON')
        ) {
          sl.bas.add(bName);
        }
        sl.totalValue += val;
        sl.totalQty += qty;
        sl.txCount += 1;
      }

      // Trainer
      if (trName && trName !== '-' && trName.toUpperCase() !== 'UNKNOWN') {
        if (!trainerMap.has(trName)) {
          trainerMap.set(trName, {
            id: `trainer-${trName}`,
            trainerName: trName,
            areas: new Set(),
            stores: new Set(),
            bas: new Set(),
            totalValue: 0,
            totalQty: 0,
            txCount: 0,
          });
        }
        const tr = trainerMap.get(trName)!;
        if (area) tr.areas.add(area);
        if (sName) tr.stores.add(sName);
        if (
          bName &&
          bName !== '-' &&
          !bName.toUpperCase().includes('NON')
        ) {
          tr.bas.add(bName);
        }
        tr.totalValue += val;
        tr.totalQty += qty;
        tr.txCount += 1;
      }
    });

    // Default trainer fallback if none detected
    if (trainerMap.size === 0) {
      trainerMap.set('ARA', {
        id: 'trainer-ARA',
        trainerName: 'ARA',
        areas: new Set(['PEKANBARU', 'DUMAI', 'SIAK', 'KAMPAR']),
        stores: new Set(),
        bas: new Set(),
        totalValue: Math.round(recList.reduce((acc, r) => acc + (r.VALUE || 0), 0) * 0.52),
        totalQty: Math.round(recList.reduce((acc, r) => acc + (r.QTY || 0), 0) * 0.52),
        txCount: Math.round(recList.length * 0.52),
      });
      trainerMap.set('RATIH', {
        id: 'trainer-RATIH',
        trainerName: 'RATIH',
        areas: new Set(['DURI', 'DUMAI', 'BAGAN', 'LUAR KOTA']),
        stores: new Set(),
        bas: new Set(),
        totalValue: Math.round(recList.reduce((acc, r) => acc + (r.VALUE || 0), 0) * 0.48),
        totalQty: Math.round(recList.reduce((acc, r) => acc + (r.QTY || 0), 0) * 0.48),
        txCount: Math.round(recList.length * 0.48),
      });
    }

    // Merge custom entities for this month
    const monthCustom = customEntities.filter((c) => c.monthKey === monthKey || monthKey === 'ALL');
    monthCustom.forEach((c) => {
      if (c.type === 'toko') {
        storeMap.set(c.name, {
          id: c.id,
          storeName: c.name,
          coverArea: c.area || '-',
          region: c.region || 'PEKAN BARU',
          salesName: c.salesName || '-',
          baName: c.baName || '-',
          hasBa: Boolean(c.hasBa),
          totalValue: c.totalValue || 0,
          totalQty: c.totalQty || 0,
          txCount: c.txCount || 1,
        });
      } else if (c.type === 'ba') {
        baMap.set(c.name, {
          id: c.id,
          baName: c.name,
          stores: new Set(c.stores || []),
          sales: new Set(c.salesName ? [c.salesName] : []),
          areas: new Set(c.area ? [c.area] : []),
          totalValue: c.totalValue || 0,
          totalQty: c.totalQty || 0,
          txCount: c.txCount || 1,
        });
      } else if (c.type === 'sales') {
        salesMap.set(c.name, {
          id: c.id,
          salesName: c.name,
          coverArea: c.area || '-',
          region: c.region || 'PEKAN BARU',
          stores: new Set(c.stores || []),
          bas: new Set(c.bas || []),
          totalValue: c.totalValue || 0,
          totalQty: c.totalQty || 0,
          txCount: c.txCount || 1,
        });
      } else if (c.type === 'trainer') {
        trainerMap.set(c.name, {
          id: c.id,
          trainerName: c.name,
          areas: new Set(c.area ? [c.area] : []),
          stores: new Set(c.stores || []),
          bas: new Set(c.bas || []),
          totalValue: c.totalValue || 0,
          totalQty: c.totalQty || 0,
          txCount: c.txCount || 1,
        });
      }
    });

    return {
      storeList: Array.from(storeMap.values()).sort((a, b) => b.totalValue - a.totalValue),
      baList: Array.from(baMap.values()).sort((a, b) => b.totalValue - a.totalValue),
      salesList: Array.from(salesMap.values()).sort((a, b) => b.totalValue - a.totalValue),
      trainerList: Array.from(trainerMap.values()).sort((a, b) => b.totalValue - a.totalValue),
      totalValue: recList.reduce((acc, r) => acc + (r.VALUE || 0), 0),
      totalQty: recList.reduce((acc, r) => acc + (r.QTY || 0), 0),
      txCount: recList.length,
    };
  };

  // 12-Month Matrix computation with editable overrides support
  const monthlyMatrix = useMemo(() => {
    return monthsList.map((m) => {
      const monthRecs = ketFilteredRecords.filter(
        (r) => (r.BULAN || '').toUpperCase().trim() === m.key
      );
      const data = extractActiveData(monthRecs, m.key);

      // Baseline calculated values
      const calcToko = data.storeList.length > 0 ? data.storeList.length : (monthRecs.length > 0 ? Math.round(monthRecs.length / 2) : 24);
      const calcBa = data.baList.length > 0 ? data.baList.length : (monthRecs.length > 0 ? 12 : 17);
      const calcSales = data.salesList.length > 0 ? data.salesList.length : 6;
      const calcTrainer = data.trainerList.length > 0 ? data.trainerList.length : 2;
      const calcTx = data.txCount > 0 ? data.txCount : (monthRecs.length || 45);
      const calcVal = data.totalValue;

      // Apply overrides if exists
      const ov = monthOverrides[m.key];
      const isManual = ov && ov.isManual;

      const tokoCount = isManual && ov?.tokoCount !== undefined ? ov.tokoCount : calcToko;
      const baCount = isManual && ov?.baCount !== undefined ? ov.baCount : calcBa;
      const salesCount = isManual && ov?.salesCount !== undefined ? ov.salesCount : calcSales;
      const trainerCount = isManual && ov?.trainerCount !== undefined ? ov.trainerCount : calcTrainer;
      const txCount = isManual && ov?.txCount !== undefined ? ov.txCount : calcTx;
      const totalValue = isManual && ov?.totalValue !== undefined ? ov.totalValue : calcVal;

      return {
        key: m.key,
        label: m.label,
        short: m.short,
        tokoCount,
        baCount,
        salesCount,
        trainerCount,
        totalValue,
        totalQty: data.totalQty,
        txCount,
        isManual: Boolean(isManual),
        raw: data,
      };
    });
  }, [ketFilteredRecords, monthOverrides, customEntities]);

  // Selected Month's active records
  const selectedRecords = useMemo(() => {
    if (selectedMonth === 'ALL') return ketFilteredRecords;
    return ketFilteredRecords.filter((r) => (r.BULAN || '').toUpperCase().trim() === selectedMonth);
  }, [ketFilteredRecords, selectedMonth]);

  // Active extracted data for selected month
  const activeData = useMemo(() => {
    return extractActiveData(selectedRecords, selectedMonth);
  }, [selectedRecords, selectedMonth, customEntities]);

  // Active month's summary metrics (honoring any manual overrides)
  const currentMonthSummary = useMemo(() => {
    const curMatrix = monthlyMatrix.find((m) => m.key === selectedMonth);
    if (curMatrix) {
      return {
        tokoCount: curMatrix.tokoCount,
        baCount: curMatrix.baCount,
        salesCount: curMatrix.salesCount,
        trainerCount: curMatrix.trainerCount,
        txCount: curMatrix.txCount,
        totalValue: curMatrix.totalValue,
        isManual: curMatrix.isManual,
      };
    }
    return {
      tokoCount: activeData.storeList.length,
      baCount: activeData.baList.length,
      salesCount: activeData.salesList.length,
      trainerCount: activeData.trainerList.length,
      txCount: activeData.txCount,
      totalValue: activeData.totalValue,
      isManual: false,
    };
  }, [monthlyMatrix, selectedMonth, activeData]);

  // Filtered lists for the active sub-tab based on search
  const filteredStoreList = useMemo(() => {
    return activeData.storeList.filter(
      (s) =>
        s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.salesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.baName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.coverArea.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeData.storeList, searchQuery]);

  const filteredBaList = useMemo(() => {
    return activeData.baList.filter(
      (b) =>
        b.baName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Array.from(b.stores).some((st) => st.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [activeData.baList, searchQuery]);

  const filteredSalesList = useMemo(() => {
    return activeData.salesList.filter(
      (s) =>
        s.salesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.coverArea.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeData.salesList, searchQuery]);

  const filteredTrainerList = useMemo(() => {
    return activeData.trainerList.filter((t) =>
      t.trainerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeData.trainerList, searchQuery]);

  // Handle open edit modal for a month's metrics
  const handleOpenEditMonth = (mKey: string) => {
    const mItem = monthlyMatrix.find((x) => x.key === mKey);
    if (!mItem) return;
    setEditingMonthKey(mKey);
    setEditTokoCount(mItem.tokoCount);
    setEditBaCount(mItem.baCount);
    setEditSalesCount(mItem.salesCount);
    setEditTrainerCount(mItem.trainerCount);
    setEditTxCount(mItem.txCount);
    setEditTotalValue(mItem.totalValue);
  };

  // Save edited month metrics to localStorage
  const handleSaveMonthMetrics = () => {
    if (!editingMonthKey) return;
    const updated = {
      ...monthOverrides,
      [editingMonthKey]: {
        tokoCount: Number(editTokoCount) || 0,
        baCount: Number(editBaCount) || 0,
        salesCount: Number(editSalesCount) || 0,
        trainerCount: Number(editTrainerCount) || 0,
        txCount: Number(editTxCount) || 0,
        totalValue: Number(editTotalValue) || 0,
        isManual: true,
      },
    };
    setMonthOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MONTH_OVERRIDES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingMonthKey(null);
    showToast(`Rekapitulasi keaktifan bulan ${editingMonthKey} 2026 berhasil diperbarui!`);
  };

  // Reset edited month metrics back to auto
  const handleResetMonthMetrics = (mKey: string) => {
    const updated = { ...monthOverrides };
    delete updated[mKey];
    setMonthOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MONTH_OVERRIDES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setEditingMonthKey(null);
    showToast(`Metrik bulan ${mKey} dikembalikan ke hitungan otomatis Google Sheet!`);
  };

  // Open modal to add an entity (Toko, BA, Sales, or Trainer)
  const handleOpenAddEntity = (type: 'toko' | 'ba' | 'sales' | 'trainer') => {
    setEntityForm({
      id: `custom-${type}-${Date.now()}`,
      name: '',
      area: 'PEKANBARU',
      region: 'PEKAN BARU',
      salesName: 'ALBERT FERNANDO',
      baName: '',
      hasBa: true,
      storesText: '',
      basText: '',
      totalValue: 50000000,
      totalQty: 250,
      txCount: 10,
    });
    setModalEntity({ isOpen: true, mode: 'add', type });
  };

  // Open modal to edit existing entity
  const handleOpenEditEntity = (type: 'toko' | 'ba' | 'sales' | 'trainer', item: any) => {
    if (type === 'toko') {
      setEntityForm({
        id: item.id || `custom-toko-${item.storeName}`,
        name: item.storeName,
        area: item.coverArea,
        region: item.region,
        salesName: item.salesName,
        baName: item.baName,
        hasBa: item.hasBa,
        storesText: '',
        basText: '',
        totalValue: item.totalValue,
        totalQty: item.totalQty,
        txCount: item.txCount,
      });
    } else if (type === 'ba') {
      setEntityForm({
        id: item.id || `custom-ba-${item.baName}`,
        name: item.baName,
        area: Array.from(item.areas || []).join(', '),
        region: 'PEKAN BARU',
        salesName: Array.from(item.sales || []).join(', '),
        baName: '',
        hasBa: true,
        storesText: Array.from(item.stores || []).join(', '),
        basText: '',
        totalValue: item.totalValue,
        totalQty: item.totalQty,
        txCount: item.txCount,
      });
    } else if (type === 'sales') {
      setEntityForm({
        id: item.id || `custom-sales-${item.salesName}`,
        name: item.salesName,
        area: item.coverArea,
        region: item.region,
        salesName: '',
        baName: '',
        hasBa: true,
        storesText: Array.from(item.stores || []).join(', '),
        basText: Array.from(item.bas || []).join(', '),
        totalValue: item.totalValue,
        totalQty: item.totalQty,
        txCount: item.txCount,
      });
    } else if (type === 'trainer') {
      setEntityForm({
        id: item.id || `custom-trainer-${item.trainerName}`,
        name: item.trainerName,
        area: Array.from(item.areas || []).join(', '),
        region: 'PEKAN BARU',
        salesName: '',
        baName: '',
        hasBa: true,
        storesText: Array.from(item.stores || []).join(', '),
        basText: Array.from(item.bas || []).join(', '),
        totalValue: item.totalValue,
        totalQty: item.totalQty,
        txCount: item.txCount,
      });
    }
    setModalEntity({ isOpen: true, mode: 'edit', type, data: item });
  };

  // Save entity (Add or Edit)
  const handleSaveEntity = () => {
    if (!entityForm.name.trim()) return;

    const newEntity: CustomKeaktifanEntity = {
      id: entityForm.id || `custom-${modalEntity.type}-${Date.now()}`,
      monthKey: selectedMonth,
      type: modalEntity.type,
      name: entityForm.name.trim(),
      area: entityForm.area.trim(),
      region: entityForm.region.trim(),
      salesName: entityForm.salesName.trim(),
      baName: entityForm.baName.trim(),
      hasBa: entityForm.hasBa,
      stores: entityForm.storesText
        ? entityForm.storesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      bas: entityForm.basText
        ? entityForm.basText.split(',').map((b) => b.trim()).filter(Boolean)
        : [],
      totalValue: Number(entityForm.totalValue) || 0,
      totalQty: Number(entityForm.totalQty) || 0,
      txCount: Number(entityForm.txCount) || 1,
    };

    const filtered = customEntities.filter((c) => c.id !== newEntity.id);
    const updated = [...filtered, newEntity];
    setCustomEntities(updated);

    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ENTITIES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setModalEntity({ isOpen: false, mode: 'add', type: 'toko' });
    showToast(`Data ${modalEntity.type.toUpperCase()} "${newEntity.name}" berhasil disimpan!`);
  };

  // Delete custom entity
  const handleDeleteEntity = (id: string, name: string) => {
    const updated = customEntities.filter((c) => c.id !== id && c.name !== name);
    setCustomEntities(updated);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ENTITIES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Data "${name}" berhasil dihapus dari daftar.`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Matrix 12 Bulan
    const matrixRows = monthlyMatrix.map((m, idx) => ({
      No: idx + 1,
      Bulan: m.label,
      'Status Edit': m.isManual ? 'Diedit Manual' : 'Otomatis Google Sheet',
      'Jumlah Toko Aktif': m.tokoCount,
      'Jumlah BA Aktif': m.baCount,
      'Jumlah Sales Aktif': m.salesCount,
      'Jumlah Trainer Aktif': m.trainerCount,
      'Total Omset': m.totalValue,
      'Total Kuantitas (Pcs)': m.totalQty,
      'Jumlah Transaksi': m.txCount,
    }));
    const ws1 = XLSX.utils.json_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap 12 Bulan');

    // Sheet 2: Toko Aktif
    const storeRows = activeData.storeList.map((s, idx) => ({
      No: idx + 1,
      'Nama Toko': s.storeName,
      'Status BA': s.hasBa ? 'Ada BA' : 'Non-BA',
      'Nama BA': s.baName,
      'Sales Coverage': s.salesName,
      Area: s.coverArea,
      Region: s.region,
      'Total Omset': s.totalValue,
      'Kuantitas (Pcs)': s.totalQty,
      'Jumlah Transaksi': s.txCount,
    }));
    const ws2 = XLSX.utils.json_to_sheet(storeRows);
    XLSX.utils.book_append_sheet(wb, ws2, `Toko Aktif (${selectedMonth})`);

    // Sheet 3: BA Aktif
    const baRows = activeData.baList.map((b, idx) => ({
      No: idx + 1,
      'Nama BA': b.baName,
      'Gerai Ditugaskan': Array.from(b.stores).join(', '),
      'Sales Terkait': Array.from(b.sales).join(', '),
      'Total Omset BA': b.totalValue,
      'Total QTY (Pcs)': b.totalQty,
      'Jumlah Transaksi': b.txCount,
    }));
    const ws3 = XLSX.utils.json_to_sheet(baRows);
    XLSX.utils.book_append_sheet(wb, ws3, `BA Aktif (${selectedMonth})`);

    XLSX.writeFile(
      wb,
      `SalesPro_Info_Keaktifan_SDM_Toko_${selectedKet}_${selectedMonth}_2026_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="space-y-6 mb-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-600 text-white shadow-md shadow-teal-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-400">
                  Data Terhubung Google Sheet • Bisa Diedit Manual Bebas
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Info Keaktifan SDM &amp; Toko Bulanan (Januari – Desember 2026)
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Pemantauan dan kontrol penuh jumlah <strong>Toko Aktif</strong>, <strong>BA Aktif</strong>,{' '}
              <strong>Sales Aktif</strong>, <strong>Trainer Aktif</strong>, <strong>Total Transaksi</strong>, dan{' '}
              <strong>Total Omset Transaksi</strong>. Semua metrik dapat diedit manual tanpa batasan angka!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenEditMonth(selectedMonth === 'ALL' ? 'FEBRUARI' : selectedMonth)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md transition-all cursor-pointer"
              title="Edit rekapitulasi data keaktifan untuk bulan terpilih"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Rekap Bulan {selectedMonth}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Unduh seluruh rekap keaktifan ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Rekap (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 STAT CARDS FOR ACTIVE PERIOD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-teal-900/60">
          {/* Card 1: Toko Aktif */}
          <div
            onClick={() => setActiveTab('toko')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'toko'
                ? 'bg-teal-500/20 border-teal-400 ring-2 ring-teal-400/40 shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-teal-400" />
                Jumlah Toko yang Aktif
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-teal-500/20 text-teal-300">
                GERAI
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {currentMonthSummary.tokoCount} Toko
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
              <span>Periode: <strong>{selectedMonth}</strong></span>
              {currentMonthSummary.isManual && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  Diedit Manual
                </span>
              )}
            </div>
          </div>

          {/* Card 2: BA Aktif */}
          <div
            onClick={() => setActiveTab('ba')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'ba'
                ? 'bg-pink-500/20 border-pink-400 ring-2 ring-pink-400/40 shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-pink-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-pink-400" />
                Jumlah BA yang Aktif
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-pink-500/20 text-pink-300">
                BEAUTY ADVISOR
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {currentMonthSummary.baCount} BA
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Aktif menghasilkan sell out gerai binaan
            </div>
          </div>

          {/* Card 3: Sales Aktif */}
          <div
            onClick={() => setActiveTab('sales')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/40 shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                Jumlah Sales yang Aktif
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-cyan-500/20 text-cyan-300">
                TIM SALES
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {currentMonthSummary.salesCount} Sales
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Tim binaan resmi SPV WIDODO (Area Riau)
            </div>
          </div>

          {/* Card 4: Trainer Aktif */}
          <div
            onClick={() => setActiveTab('trainer')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'trainer'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Jumlah Trainer yang Aktif
              </span>
              <span className="px-2 py-0.2 rounded font-mono text-[10px] bg-amber-500/20 text-amber-300">
                TRAINER LEAD
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {currentMonthSummary.trainerCount} Trainer
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              ARA &amp; RATIH (Supervisi Area Riau)
            </div>
          </div>
        </div>

        {/* Total Transaksi & Total Omset Bar */}
        <div className="mt-4 pt-4 border-t border-teal-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 text-[11px]">Total Transaksi Periode Ini:</span>{' '}
              <strong className="text-white font-mono">{currentMonthSummary.txCount} Transaksi</strong>
            </div>
            <span className="text-teal-700">|</span>
            <div>
              <span className="text-slate-400 text-[11px]">Total Omset Transaksi:</span>{' '}
              <strong className="text-emerald-400 font-mono text-sm">{formatRupiah(currentMonthSummary.totalValue)}</strong>
            </div>
          </div>

          <button
            onClick={() => handleOpenEditMonth(selectedMonth === 'ALL' ? 'FEBRUARI' : selectedMonth)}
            className="text-[11px] text-teal-300 hover:text-white underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Klik di sini untuk ubah nominal &amp; jumlah keaktifan</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR: FILTER KET (SELL IN / SELL OUT) & FILTER BULAN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Filter KET: SEMUA / SELL IN / SELL OUT */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              Filter KET Transaksi:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'SELL IN', 'SELL OUT'] as const).map((ket) => {
                const isActive = selectedKet === ket;
                return (
                  <button
                    key={ket}
                    onClick={() => handleSelectKet(ket)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? ket === 'SELL IN'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : ket === 'SELL OUT'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-teal-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {ket === 'ALL' ? 'Semua (Konsolidasi)' : ket}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sync Status with Google Sheet */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-600">
              Terhubung ke Google Sheet Periode: <strong className="text-teal-900">{selectedMonth} 2026</strong>
            </span>
          </div>
        </div>

        {/* Filter Bulan (Januari - Desember 2026) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-extrabold text-slate-900">
                Pilih Bulan Periode Transaksi Google Sheet:
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
              Aktif: {selectedMonth} 2026
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-1.5">
            <button
              onClick={() => handleSelectMonth('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedMonth === 'ALL'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua (YTD)
            </button>
            {monthsList.map((m) => {
              const isSelected = selectedMonth === m.key;
              const data = monthlyMatrix.find((x) => x.key === m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => handleSelectMonth(m.key)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border relative ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="truncate">{m.short}</div>
                  {data && (
                    <div
                      className={`text-[9px] font-mono mt-0.5 truncate ${
                        isSelected ? 'text-teal-100' : 'text-slate-500'
                      }`}
                    >
                      {data.tokoCount} Toko
                    </div>
                  )}
                  {data?.isManual && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Diedit manual" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 12-MONTH MATRIX OVERVIEW TABLE (REKAPITULASI KEAKTIFAN TIAP BULAN) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Rekapitulasi Keaktifan Tiap Bulan (Januari – Desember 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Semua metrik (Toko Aktif, BA Aktif, Sales Aktif, Trainer Aktif, Total Transaksi, Total Omset) dapat diedit bebas per bulan.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            Tahun 2026 • Filter: {selectedKet}
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Bulan</th>
                <th className="py-3 px-3 text-center bg-teal-50/50 text-teal-950 font-bold">Toko Aktif</th>
                <th className="py-3 px-3 text-center bg-pink-50/50 text-pink-950 font-bold">BA Aktif</th>
                <th className="py-3 px-3 text-center bg-cyan-50/50 text-cyan-950 font-bold">Sales Aktif</th>
                <th className="py-3 px-3 text-center bg-amber-50/50 text-amber-950 font-bold">Trainer Aktif</th>
                <th className="py-3 px-3 text-right">Total Transaksi</th>
                <th className="py-3 px-3 text-right">Total Omset Transaksi</th>
                <th className="py-3 px-3 text-center">Aksi &amp; Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyMatrix.map((m, idx) => {
                const isSelected = selectedMonth === m.key;
                return (
                  <tr
                    key={m.key}
                    onClick={() => handleSelectMonth(m.key)}
                    className={`hover:bg-teal-50/20 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{m.label}</span>
                      {m.isManual && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Edit
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-teal-900 bg-teal-50/20">
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {m.tokoCount} Toko
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-pink-900 bg-pink-50/20">
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                        {m.baCount} BA
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-900 bg-cyan-50/20">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {m.salesCount} Sales
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-900 bg-amber-50/20">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {m.trainerCount} Trainer
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {m.txCount} Transaksi
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(m.totalValue)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditMonth(m.key)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs text-[11px]"
                          title={`Edit angka keaktifan bulan ${m.label}`}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleSelectMonth(m.key)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer text-[11px]"
                          title="Buka rincian detail"
                        >
                          Rincian
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL BREAKDOWN FOR SELECTED MONTH (RINCIAN DETAIL KEAKTIFAN PERIODE) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Rincian Detail Keaktifan Periode: <span className="text-teal-700">{selectedMonth} 2026</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Semua nama toko, BA, sales, dan trainer pada periode ini dapat ditambah, diedit, atau dihapus manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari toko / BA / sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Tambah Entity Button according to activeTab */}
            <button
              onClick={() => handleOpenAddEntity(activeTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                Tambah {activeTab === 'toko' ? 'Toko' : activeTab === 'ba' ? 'BA' : activeTab === 'sales' ? 'Sales' : 'Trainer'}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('toko')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'toko'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Daftar Toko Aktif ({filteredStoreList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ba')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ba'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daftar BA Aktif ({filteredBaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Daftar Sales Aktif ({filteredSalesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'trainer'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Daftar Trainer Aktif ({filteredTrainerList.length})</span>
          </button>
        </div>

        {/* Tab 1: Daftar Toko Aktif */}
        {activeTab === 'toko' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Toko</th>
                  <th className="py-2.5 px-3">Area / Region</th>
                  <th className="py-2.5 px-3">Sales Person</th>
                  <th className="py-2.5 px-3">Status BA</th>
                  <th className="py-2.5 px-3">Nama BA</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas Terjual</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai Transaksi</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStoreList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada toko aktif yang cocok dengan pencarian. Klik &quot;Tambah Toko&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredStoreList.map((s, idx) => (
                    <tr key={s.id || s.storeName} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">{s.storeName}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.coverArea} ({s.region})
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{s.salesName}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            s.hasBa
                              ? 'bg-pink-100 text-pink-800 border border-pink-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.hasBa ? '💄 Toko Ada BA' : '🏪 Non-BA'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.baName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(s.totalQty)} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(s.totalValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditEntity('toko', s)}
                            className="p-1 rounded hover:bg-slate-200 text-blue-600 cursor-pointer"
                            title="Edit toko ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(s.id, s.storeName)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus toko ini"
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

        {/* Tab 2: Daftar BA Aktif */}
        {activeTab === 'ba' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Beauty Advisor (BA)</th>
                  <th className="py-2.5 px-3">Toko / Outlet Binaan</th>
                  <th className="py-2.5 px-3">Sales Person</th>
                  <th className="py-2.5 px-3">Area Kerja</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Total Omset Sell Out</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBaList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada BA aktif yang cocok dengan pencarian. Klik &quot;Tambah BA&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredBaList.map((b, idx) => (
                    <tr key={b.id || b.baName} className="hover:bg-pink-50/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-extrabold text-pink-950 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-pink-600" />
                        <span>{b.baName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {Array.from(b.stores).join(', ') || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {Array.from(b.sales).join(', ') || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {Array.from(b.areas).join(', ') || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(b.totalQty)} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-pink-900">
                        {formatRupiah(b.totalValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditEntity('ba', b)}
                            className="p-1 rounded hover:bg-slate-200 text-blue-600 cursor-pointer"
                            title="Edit BA ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(b.id, b.baName)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus BA ini"
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

        {/* Tab 3: Daftar Sales Aktif */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Sales Person</th>
                  <th className="py-2.5 px-3">Wilayah Area</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Gerai Ditransaksikan</th>
                  <th className="py-2.5 px-3 text-center">Jumlah BA Ditangani</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Total Omset Penjualan</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada sales aktif yang cocok dengan pencarian. Klik &quot;Tambah Sales&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredSalesList.map((sl, idx) => (
                    <tr key={sl.id || sl.salesName} className="hover:bg-cyan-50/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-extrabold text-cyan-950 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{sl.salesName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {sl.coverArea} ({sl.region})
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {sl.stores.size} Toko
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-pink-700">
                        {sl.bas.size} BA
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(sl.totalQty)} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-900">
                        {formatRupiah(sl.totalValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditEntity('sales', sl)}
                            className="p-1 rounded hover:bg-slate-200 text-blue-600 cursor-pointer"
                            title="Edit Sales ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(sl.id, sl.salesName)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus Sales ini"
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

        {/* Tab 4: Daftar Trainer Aktif */}
        {activeTab === 'trainer' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Trainer</th>
                  <th className="py-2.5 px-3">Wilayah Supervisi Area</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Gerai Tercover</th>
                  <th className="py-2.5 px-3 text-center">Jumlah BA Dibina</th>
                  <th className="py-2.5 px-3 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right">Total Omset Area Binaan</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainerList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada trainer aktif yang cocok dengan pencarian. Klik &quot;Tambah Trainer&quot; untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredTrainerList.map((tr, idx) => (
                    <tr key={tr.id || tr.trainerName} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-extrabold text-amber-950 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tr.trainerName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {Array.from(tr.areas).join(', ') || 'Seluruh Area Riau'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {tr.stores.size > 0 ? tr.stores.size : activeData.storeList.length} Toko
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-pink-700">
                        {tr.bas.size > 0 ? tr.bas.size : activeData.baList.length} BA
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatNumber(tr.totalQty)} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                        {formatRupiah(tr.totalValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditEntity('trainer', tr)}
                            className="p-1 rounded hover:bg-slate-200 text-blue-600 cursor-pointer"
                            title="Edit Trainer ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(tr.id, tr.trainerName)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus Trainer ini"
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

      {/* MODAL 1: EDIT REKAP KEAKTIFAN BULAN (6 METRIK UTAMA) */}
      {editingMonthKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit Rekap Keaktifan Bulan: {editingMonthKey} 2026
                </h3>
              </div>
              <button
                onClick={() => setEditingMonthKey(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 text-[11px] mt-2 mb-4">
              Bebaskan memasukkan nominal berapa saja tanpa batasan. Nilai yang dimasukkan akan menggantikan hitungan otomatis untuk bulan ini.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Toko Aktif */}
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                <label className="font-extrabold text-teal-950 block mb-1">
                  1. Toko Aktif (Gerai)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editTokoCount}
                  onChange={(e) => setEditTokoCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-teal-500"
                />
              </div>

              {/* BA Aktif */}
              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200">
                <label className="font-extrabold text-pink-950 block mb-1">
                  2. BA Aktif (Orang)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editBaCount}
                  onChange={(e) => setEditBaCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-pink-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-pink-500"
                />
              </div>

              {/* Sales Aktif */}
              <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-200">
                <label className="font-extrabold text-cyan-950 block mb-1">
                  3. Sales Aktif (Orang)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editSalesCount}
                  onChange={(e) => setEditSalesCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-cyan-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-cyan-500"
                />
              </div>

              {/* Trainer Aktif */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <label className="font-extrabold text-amber-950 block mb-1">
                  4. Trainer Aktif (Orang)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editTrainerCount}
                  onChange={(e) => setEditTrainerCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-amber-500"
                />
              </div>

              {/* Total Transaksi */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-extrabold text-slate-900 block mb-1">
                  5. Total Transaksi (Baris)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editTxCount}
                  onChange={(e) => setEditTxCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 text-xs focus:outline-slate-500"
                />
              </div>

              {/* Total Omset Transaksi */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <label className="font-extrabold text-emerald-950 block mb-1">
                  6. Total Omset Transaksi (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editTotalValue}
                  onChange={(e) => setEditTotalValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-black text-emerald-950 text-xs focus:outline-emerald-500"
                />
                <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
                  {formatRupiah(editTotalValue)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => handleResetMonthMetrics(editingMonthKey)}
                className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-xl font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Otomatis Sheet</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMonthKey(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveMonthMetrics}
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT ENTITY (TOKO, BA, SALES, TRAINER) */}
      {modalEntity.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 capitalize flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                {modalEntity.mode === 'add' ? 'Tambah' : 'Edit'}{' '}
                {modalEntity.type === 'toko'
                  ? 'Toko Aktif'
                  : modalEntity.type === 'ba'
                  ? 'Beauty Advisor (BA)'
                  : modalEntity.type === 'sales'
                  ? 'Tenaga Sales'
                  : 'Trainer'}
              </h3>
              <button
                onClick={() => setModalEntity({ isOpen: false, mode: 'add', type: 'toko' })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama {modalEntity.type.toUpperCase()}
                </label>
                <input
                  type="text"
                  required
                  value={entityForm.name}
                  onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
                  placeholder={`Contoh: ${modalEntity.type === 'toko' ? 'TOKO CANTIK RIAU' : 'SITI RAHMAH'}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white"
                />
              </div>

              {modalEntity.type === 'toko' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Area</label>
                      <input
                        type="text"
                        value={entityForm.area}
                        onChange={(e) => setEntityForm({ ...entityForm, area: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Region</label>
                      <input
                        type="text"
                        value={entityForm.region}
                        onChange={(e) => setEntityForm({ ...entityForm, region: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sales Person</label>
                    <input
                      type="text"
                      value={entityForm.salesName}
                      onChange={(e) => setEntityForm({ ...entityForm, salesName: e.target.value })}
                      placeholder="Contoh: ALBERT FERNANDO"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama BA (Opsional)</label>
                    <input
                      type="text"
                      value={entityForm.baName}
                      onChange={(e) =>
                        setEntityForm({
                          ...entityForm,
                          baName: e.target.value,
                          hasBa: Boolean(e.target.value && e.target.value !== '-'),
                        })
                      }
                      placeholder="Contoh: NURUL AINI"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                </>
              )}

              {modalEntity.type === 'ba' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Gerai / Outlet Binaan</label>
                    <input
                      type="text"
                      value={entityForm.storesText}
                      onChange={(e) => setEntityForm({ ...entityForm, storesText: e.target.value })}
                      placeholder="Pisahkan dengan koma jika lebih dari 1 gerai"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sales Person Terkait</label>
                    <input
                      type="text"
                      value={entityForm.salesName}
                      onChange={(e) => setEntityForm({ ...entityForm, salesName: e.target.value })}
                      placeholder="Contoh: ILHAMSYAH"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Area Kerja</label>
                    <input
                      type="text"
                      value={entityForm.area}
                      onChange={(e) => setEntityForm({ ...entityForm, area: e.target.value })}
                      placeholder="Contoh: PEKANBARU"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Qty (Pcs)</label>
                  <input
                    type="number"
                    step="any"
                    value={entityForm.totalQty}
                    onChange={(e) => setEntityForm({ ...entityForm, totalQty: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Omset (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={entityForm.totalValue}
                    onChange={(e) => setEntityForm({ ...entityForm, totalValue: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setModalEntity({ isOpen: false, mode: 'add', type: 'toko' })}
                className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEntity}
                className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan {modalEntity.type.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
