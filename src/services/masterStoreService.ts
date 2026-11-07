import { TransactionRecord } from '../types/dashboard';
import { SALES_MASTER_6_CONFIG, VALID_KPI_SALES_NAMES } from './kpiSalesData';

export const MASTER_STORE_STORAGE_KEY = 'salespro_master_store_config_v2';
export const KA_MG_SALES_OVERRIDE_KEY = 'salespro_ka_mg_sales_override_v2';

export interface MasterStoreItem {
  id: string;
  storeName: string;
  hasBa: boolean;
  baName: string;
  baNumber?: string;
  salesName: string;
  trainerName: string;
  coverArea: string;
  region: string;
  spvName: string;
  channel: 'KA' | 'MG'; // KA: Key Account / Modern Trade | MG: Market Group / General Trade
  isCustom?: boolean;
  notes?: string;
}

export interface KaMgSalesOverride {
  isManual: boolean;
  spvSalesValue?: number; // Semua Penjualan SPV (WIDODO + HENDRA GUNAWAN)
  kaSalesValue: number; // Nilai Penjualan KA (Key Account)
  mgSalesValue: number; // PENJUALAN DAZZLE ME MG (Market Group)
  dazzleMeMgSalesValue?: number; // PENJUALAN DAZZLE ME MG
  notes?: string;
  updatedAt?: string;
}

/**
 * Helper untuk menentukan channel default berdasarkan nama toko
 */
export function detectStoreChannel(storeName: string): 'KA' | 'MG' {
  const upper = storeName.toUpperCase();
  if (
    upper.includes('GUARDIAN') ||
    upper.includes('WATSON') ||
    upper.includes('MISS GLAM') ||
    upper.includes('MALL') ||
    upper.includes('SWALAYAN') ||
    upper.includes('MART') ||
    upper.includes('PARETO') ||
    upper.includes('KEY ACCOUNT')
  ) {
    return 'KA';
  }
  return 'MG';
}

/**
 * Mencari sales dan trainer resmi untuk suatu toko berdasarkan SALES_MASTER_6_CONFIG
 */
export function findOfficialSalesAndTrainerForStore(storeName: string): {
  salesName: string;
  trainerName: string;
  coverArea: string;
} {
  const cleanName = storeName.trim().toUpperCase();

  for (const sName of VALID_KPI_SALES_NAMES) {
    const cfg = SALES_MASTER_6_CONFIG[sName];
    if (cfg) {
      const match = cfg.coveredStores.some(
        (cs) => cs.toUpperCase() === cleanName || cleanName.includes(cs.toUpperCase()) || cs.toUpperCase().includes(cleanName)
      );
      if (match) {
        return {
          salesName: cfg.salesName,
          trainerName: cfg.trainerCovered,
          coverArea: cfg.area,
        };
      }
    }
  }

  return {
    salesName: 'ILHAMSYAH',
    trainerName: 'ARA & RATIH',
    coverArea: 'PEKAN BARU',
  };
}

/**
 * Inisialisasi awal master toko dari transaksi Google Sheet yang terhubung
 */
export function extractInitialMasterStoresFromTransactions(
  transactions: TransactionRecord[]
): MasterStoreItem[] {
  const storeMap = new Map<string, MasterStoreItem>();

  // 1. Masukkan semua toko unik dari transaksi Google Sheet
  transactions.forEach((r, idx) => {
    const sName = (r.NAMA_STORE || '').trim();
    if (!sName) return;

    const key = sName.toUpperCase();
    const rawBa = (r.BA || '').trim();
    const isBaValid =
      Boolean(rawBa) &&
      rawBa !== '-' &&
      rawBa.toUpperCase() !== 'NON BA' &&
      rawBa.toUpperCase() !== 'STANDBY' &&
      rawBa.toUpperCase() !== 'BA STANDBY' &&
      rawBa.toUpperCase() !== 'ALL' &&
      rawBa.toUpperCase() !== 'EMPTY';

    if (!storeMap.has(key)) {
      const official = findOfficialSalesAndTrainerForStore(sName);
      storeMap.set(key, {
        id: `store-m-${idx + 1}-${Date.now().toString(36)}`,
        storeName: sName,
        hasBa: isBaValid,
        baName: isBaValid ? rawBa : '- (Non-BA)',
        baNumber: isBaValid ? (r.BA_Number || `BA-${Math.floor(100 + Math.random() * 900)}`) : undefined,
        salesName: (r.SALES && r.SALES !== '-' ? r.SALES : official.salesName).trim(),
        trainerName: official.trainerName,
        coverArea: (r.COVER_AREA && r.COVER_AREA !== '-' ? r.COVER_AREA : official.coverArea).trim(),
        region: (r.REGION && r.REGION !== '-' ? r.REGION : 'PEKAN BARU').trim(),
        spvName: (r.SPV && r.SPV !== '-' ? r.SPV : 'WIDODO').trim(),
        channel: detectStoreChannel(sName),
      });
    } else {
      // Jika sebelumnya belum tercatat BA valid namun di baris ini ada BA valid, perbarui BA-nya
      const current = storeMap.get(key)!;
      if (!current.hasBa && isBaValid) {
        current.hasBa = true;
        current.baName = rawBa;
        if (r.BA_Number) current.baNumber = r.BA_Number;
      }
      if (r.SALES && r.SALES !== '-' && (!current.salesName || current.salesName === '-')) {
        current.salesName = r.SALES;
      }
    }
  });

  // 2. Pastikan 69 toko resmi dari konfigurasi 6 Sales tercover
  VALID_KPI_SALES_NAMES.forEach((sName) => {
    const cfg = SALES_MASTER_6_CONFIG[sName];
    if (cfg && cfg.coveredStores) {
      cfg.coveredStores.forEach((cs, cIdx) => {
        const key = cs.toUpperCase();
        if (!storeMap.has(key)) {
          storeMap.set(key, {
            id: `store-official-${sName.toLowerCase().replace(/\s+/g, '')}-${cIdx + 1}`,
            storeName: cs,
            hasBa: true,
            baName: `BA ${cs.split(' ')[0]}`,
            baNumber: `BA-0${cIdx + 1}`,
            salesName: cfg.salesName,
            trainerName: cfg.trainerCovered,
            coverArea: cfg.area,
            region: 'PEKAN BARU',
            spvName: cfg.spv || 'WIDODO',
            channel: detectStoreChannel(cs),
          });
        }
      });
    }
  });

  return Array.from(storeMap.values()).sort((a, b) => a.storeName.localeCompare(b.storeName));
}

/**
 * Memuat master list toko (dengan dukungan localStorage persistensi)
 */
export function loadMasterStoreList(transactions: TransactionRecord[] = []): MasterStoreItem[] {
  try {
    const raw = localStorage.getItem(MASTER_STORE_STORAGE_KEY);
    if (raw) {
      const parsed: MasterStoreItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Jika ada toko baru di transactions yang belum terdaftar di localStorage, tambahkan otomatis
        if (transactions.length > 0) {
          const existingSet = new Set(parsed.map((p) => p.storeName.toUpperCase().trim()));
          const missingStores: MasterStoreItem[] = [];

          transactions.forEach((r) => {
            const sName = (r.NAMA_STORE || '').trim();
            if (!sName) return;
            const key = sName.toUpperCase();
            if (!existingSet.has(key)) {
              existingSet.add(key);
              const official = findOfficialSalesAndTrainerForStore(sName);
              const rawBa = (r.BA || '').trim();
              const isBaValid =
                Boolean(rawBa) &&
                rawBa !== '-' &&
                rawBa.toUpperCase() !== 'NON BA' &&
                rawBa.toUpperCase() !== 'STANDBY';

              missingStores.push({
                id: `store-new-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                storeName: sName,
                hasBa: isBaValid,
                baName: isBaValid ? rawBa : '- (Non-BA)',
                baNumber: r.BA_Number || undefined,
                salesName: (r.SALES && r.SALES !== '-' ? r.SALES : official.salesName).trim(),
                trainerName: official.trainerName,
                coverArea: (r.COVER_AREA && r.COVER_AREA !== '-' ? r.COVER_AREA : official.coverArea).trim(),
                region: (r.REGION && r.REGION !== '-' ? r.REGION : 'PEKAN BARU').trim(),
                spvName: (r.SPV && r.SPV !== '-' ? r.SPV : 'WIDODO').trim(),
                channel: detectStoreChannel(sName),
              });
            }
          });

          if (missingStores.length > 0) {
            const merged = [...parsed, ...missingStores];
            saveMasterStoreList(merged);
            return merged;
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca master store dari localStorage', e);
  }

  // Jika belum ada di localStorage, buat baru dari transaksi
  const initial = extractInitialMasterStoresFromTransactions(transactions);
  if (initial.length > 0) {
    saveMasterStoreList(initial);
  }
  return initial;
}

/**
 * Menyimpan master list toko ke localStorage
 */
export function saveMasterStoreList(stores: MasterStoreItem[]): void {
  try {
    localStorage.setItem(MASTER_STORE_STORAGE_KEY, JSON.stringify(stores));
  } catch (e) {
    console.warn('Gagal menyimpan master store ke localStorage', e);
  }
}

/**
 * Reset master list toko ke data awal transaksi Google Sheet
 */
export function resetMasterStoreListToSheet(transactions: TransactionRecord[]): MasterStoreItem[] {
  try {
    localStorage.removeItem(MASTER_STORE_STORAGE_KEY);
  } catch {}
  const fresh = extractInitialMasterStoresFromTransactions(transactions);
  saveMasterStoreList(fresh);
  return fresh;
}

/**
 * Memuat data override manual Penjualan KA & Penjualan MG
 */
export function loadKaMgSalesOverride(): KaMgSalesOverride {
  try {
    const raw = localStorage.getItem(KA_MG_SALES_OVERRIDE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Gagal membaca override KA & MG dari localStorage', e);
  }
  return {
    isManual: false,
    kaSalesValue: 0,
    mgSalesValue: 0,
    notes: '',
  };
}

/**
 * Menyimpan data override manual Penjualan KA & Penjualan MG
 */
export function saveKaMgSalesOverride(data: KaMgSalesOverride): void {
  try {
    localStorage.setItem(
      KA_MG_SALES_OVERRIDE_KEY,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.warn('Gagal menyimpan override KA & MG ke localStorage', e);
  }
}

/**
 * Reset override KA & MG ke hitungan otomatis
 */
export function resetKaMgSalesOverride(): void {
  try {
    localStorage.removeItem(KA_MG_SALES_OVERRIDE_KEY);
  } catch {}
}
