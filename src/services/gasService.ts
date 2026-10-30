import { TransactionRecord, GasConfig } from '../types/dashboard';

const GAS_CONFIG_STORAGE_KEY = 'salespro_gas_config';
const TRANSACTIONS_STORAGE_KEY = 'salespro_transactions_data';

export const DEFAULT_GAS_CONFIG: GasConfig = {
  webAppUrl: '',
  sheetName: 'Sheet1',
  lastSyncedAt: null,
  autoSync: false,
  syncIntervalMinutes: 5,
  status: 'idle',
  dataSourceType: 'sample',
};

// Google Apps Script source code template for users to copy into Extensions > Apps Script
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CONNECTOR FOR SALESPRO ANALYTICS DASHBOARD
 * =========================================================================
 * Panduan Cepat Pemasangan:
 * 1. Di Google Sheets Anda, klik menu: Ekstensi (Extensions) > Apps Script
 * 2. Hapus semua baris kode yang ada di Code.gs, lalu Tempel (Paste) seluruh kode ini.
 * 3. (Opsional) Jika spreadsheet masih kosong, pilih fungsi "setupTemplateSheet" 
 *    di toolbar atas lalu klik "Jalankan" (Run) untuk membuat header kolom otomatis!
 * 4. Klik ikon Disket (Simpan proyek / Save project).
 * 5. Klik tombol biru "Deploy" (Terapkan) di pojok kanan atas > "New deployment" (Penerapan baru).
 * 6. Klik ikon gerigi di sebelah 'Select type' > pilih "Web app" (Aplikasi web).
 * 7. Konfigurasi:
 *    - Description: SalesPro Connector API
 *    - Execute as: Me (email Google Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING agar dashboard dapat membaca data
 * 8. Klik "Deploy", berikan izin akses (Review Permissions > pilih akun > Advanced > Go to Untitled (unsafe) > Allow).
 * 9. Salin URL "Web app" (akhiran /exec) dan paste ke dashboard pada menu "Google Sheets" > "Koneksi Web App".
 * =========================================================================
 */

// Format standar kolom header yang didukung SalesPro Dashboard
var STANDARD_HEADERS = [
  "TANGGAL",
  "BULAN",
  "TAHUN",
  "BA",
  "BA_Number",
  "COVER_AREA",
  "SALES",
  "SPV",
  "BRAND",
  "NO_SKU",
  "SPU",
  "SKU",
  "PRODUK_FOCUS",
  "PRODUK_NEW",
  "NAMA_STORE",
  "REGION",
  "KATEGORI",
  "QTY",
  "VALUE",
  "KET"
];

/**
 * Endpoint GET: Membaca seluruh baris data transaksi dari Google Sheet
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : null;
    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Sheet tidak ditemukan!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var range = sheet.getDataRange();
    var values = range.getValues();

    if (values.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        totalRows: 0,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Baris 1: Header Kolom
    var headers = values[0];
    var formattedHeaders = headers.map(function(h) {
      return String(h).trim();
    });

    var rows = [];
    var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || "Asia/Jakarta";

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Abaikan baris yang kosong semua
      var isBlank = row.every(function(cell) {
        return cell === "" || cell === null || cell === undefined;
      });
      if (isBlank) continue;

      var obj = { id: "gas-row-" + i };

      for (var j = 0; j < formattedHeaders.length; j++) {
        var key = formattedHeaders[j];
        if (!key) continue;
        var val = row[j];

        // Format tanggal jika instance of Date
        if (val instanceof Date) {
          val = Utilities.formatDate(val, tz, "M/d/yyyy");
        }

        obj[key] = val;
      }
      rows.push(obj);
    }

    var output = {
      status: "success",
      timestamp: new Date().toISOString(),
      sheetTitle: sheet.getName(),
      totalRows: rows.length,
      data: rows
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST: Menambahkan data transaksi baru ke Google Sheet
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var postData = JSON.parse(e.postData.contents);

    if (postData && postData.record) {
      var r = postData.record;
      var newRow = [
        r.TANGGAL || "",
        r.BULAN || "",
        r.TAHUN || "",
        r.BA || "",
        r.BA_Number || "",
        r.COVER_AREA || "",
        r.SALES || "",
        r.SPV || "",
        r.BRAND || "",
        r.NO_SKU || "",
        r.SPU || "",
        r.SKU || "",
        r.PRODUK_FOCUS || "",
        r.PRODUK_NEW || "",
        r.NAMA_STORE || "",
        r.REGION || "",
        r.KATEGORI || "",
        Number(r.QTY) || 0,
        Number(r.VALUE) || 0,
        r.KET || "SELL IN"
      ];

      sheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil disimpan ke Google Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Format data POST tidak valid (membutuhkan object record)"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * FUNGSI BANTUAN OPSIONAL: setupTemplateSheet()
 * Jalankan fungsi ini langsung dari editor Apps Script jika ingin
 * membuat header kolom dan format tabel standar secara otomatis.
 */
function setupTemplateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(STANDARD_HEADERS);
    var headerRange = sheet.getRange(1, 1, 1, STANDARD_HEADERS.length);
    headerRange.setBackground("#0f766e"); // Teal dark
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    Logger.log("Template header berhasil dibuat!");
  } else {
    Logger.log("Sheet sudah memiliki isi baris data.");
  }
}
`;

// -------------------------------------------------------------
// IndexedDB Storage Helpers (High capacity for large datasets)
// -------------------------------------------------------------
const DB_NAME = 'SalesPro_DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTransactionsToDb(records: TransactionRecord[]): Promise<boolean> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(records, 'transactions');
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function loadTransactionsFromDb(): Promise<TransactionRecord[] | null> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('transactions');
      req.onsuccess = () => {
        const val = req.result;
        if (Array.isArray(val) && val.length > 0) {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearTransactionsFromDb(): Promise<void> {
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('transactions');
  } catch {
    // Ignore
  }
}

export function loadGasConfig(): GasConfig {
  try {
    const raw = localStorage.getItem(GAS_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GAS_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load GAS config from localStorage', e);
  }
  return DEFAULT_GAS_CONFIG;
}

export function saveGasConfig(config: GasConfig): void {
  try {
    localStorage.setItem(GAS_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save GAS config to localStorage', e);
  }
}

export function loadStoredTransactions(): TransactionRecord[] | null {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy localStorage data to IndexedDB, then free localStorage space
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveTransactionsToDb(parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to migrate stored transactions from localStorage', e);
  }
  return null;
}

export function saveStoredTransactions(data: TransactionRecord[]): void {
  // Always persist dataset in IndexedDB (virtually unlimited quota for large Google Sheets)
  if (Array.isArray(data) && data.length > 0) {
    saveTransactionsToDb(data).catch(() => {});
  }

  // Ensure oversized transaction payload is purged from localStorage to free quota for app configs
  try {
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  } catch {}
}

export function clearStoredTransactions(): void {
  try {
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  } catch {}
  clearTransactionsFromDb().catch(() => {});
}

// Map any arbitrary object row from GAS or CSV to TransactionRecord
export function normalizeRawRow(raw: any, index: number): TransactionRecord {
  // Helper to get case-insensitive key
  const getVal = (possibleKeys: string[]): any => {
    for (const key of possibleKeys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
      const match = Object.keys(raw).find((k) => k.trim().toLowerCase() === key.toLowerCase());
      if (match && raw[match] !== undefined && raw[match] !== null) return raw[match];
    }
    return '';
  };

  const rawTanggal = String(getVal(['TANGGAL', 'Tanggal', 'DATE', 'Date']) || '');
  let tanggal = rawTanggal;
  let bulan = String(getVal(['BULAN', 'Bulan', 'MONTH', 'Month']) || '').toUpperCase();
  let tahun = parseInt(String(getVal(['TAHUN', 'Tahun', 'YEAR', 'Year']) || '2026'), 10);

  // If date contains / or -, calculate month/year if missing
  if (tanggal) {
    const d = new Date(tanggal);
    if (!isNaN(d.getTime())) {
      if (!bulan) {
        const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
        bulan = monthNames[d.getMonth()];
      }
      if (isNaN(tahun) || tahun === 0) {
        tahun = d.getFullYear();
      }
    }
  }

  const rawQty = getVal(['QTY', 'Qty', 'Jumlah', 'KUANTITAS']);
  const qty = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(/[^0-9.-]+/g, '')) || 0;

  const rawValue = getVal(['VALUE', 'Value', 'TOTAL', 'Total', 'NILAI', 'Nilai', 'AMOUNT']);
  const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue).replace(/[^0-9.-]+/g, '')) || 0;

  // Approximate week number
  let weekNumber = 1;
  if (tanggal) {
    const d = new Date(tanggal);
    if (!isNaN(d.getTime())) {
      const firstDay = new Date(d.getFullYear(), 0, 1);
      const pastDays = (d.getTime() - firstDay.getTime()) / 86400000;
      weekNumber = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    }
  }

  return {
    id: raw.id || `row-${index + 1}`,
    TANGGAL: tanggal || '9/29/2026',
    BULAN: bulan || 'SEPTEMBER',
    TAHUN: isNaN(tahun) ? 2026 : tahun,
    BA: String(getVal(['BA', 'Beauty Advisor', 'Ba']) || '-'),
    BA_Number: String(getVal(['BA Number', 'BA_Number', 'BA NO', 'Ba Number']) || '-'),
    COVER_AREA: String(getVal(['COVER AREA', 'COVER_AREA', 'Cover Area', 'AREA']) || 'AREA BARU'),
    SALES: String(getVal(['SALES', 'Sales', 'NAMA SALES', 'Salesperson']) || 'ILHAMSYAH'),
    SPV: String(getVal(['SPV', 'Supervisor', 'NAMA SPV']) || 'WIDODO'),
    BRAND: String(getVal(['BRAND', 'Brand', 'MEREK']) || 'Y.O.U'),
    NO_SKU: String(getVal(['NO SKU', 'NO_SKU', 'SKU NO', 'No Sku', 'ITEM_CODE']) || '18186'),
    SPU: String(getVal(['SPU', 'Spu', 'SPU NAME']) || ''),
    SKU: String(getVal(['SKU', 'Sku', 'NAMA SKU', 'PRODUK', 'ITEM_NAME']) || 'PRODUK COSMETIC'),
    PRODUK_FOCUS: String(getVal(['PRODUK FOCUS', 'PRODUK_FOCUS', 'FOCUS', 'Focus']) || 'REGULAR').toUpperCase(),
    PRODUK_NEW: String(getVal(['PRODUK NEW', 'PRODUK_NEW', 'NEW', 'New']) || 'EXISTING').toUpperCase(),
    NAMA_STORE: String(getVal(['NAMA STORE', 'NAMA_STORE', 'STORE', 'Store', 'OUTLET', 'NAMA TOKO']) || 'TOKO ALANA BEAUTY'),
    REGION: String(getVal(['REGION', 'Region', 'WILAYAH', 'KOTA']) || 'PEKAN BARU'),
    KATEGORI: String(getVal(['KATEGORI', 'Kategori', 'CATEGORY', 'Category']) || 'Makeup'),
    QTY: qty,
    VALUE: value,
    KET: String(getVal(['KET', 'Ket', 'KETERANGAN', 'STATUS']) || 'SELL IN').toUpperCase(),
    weekNumber,
  };
}

// Fetch live data from Google Apps Script Web App URL
export async function fetchGoogleSheetData(webAppUrl: string): Promise<{ success: boolean; data?: TransactionRecord[]; message?: string }> {
  try {
    if (!webAppUrl || !webAppUrl.trim()) {
      return { success: false, message: 'URL Google Apps Script tidak boleh kosong' };
    }

    const cleanUrl = webAppUrl.trim();
    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        message: 'Format URL tidak valid. Pastikan URL dimulai dengan https://script.google.com/macros/s/.../exec',
      };
    }

    const response = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    let rawList: any[] = [];
    if (Array.isArray(result)) {
      rawList = result;
    } else if (result && Array.isArray(result.data)) {
      rawList = result.data;
    } else if (result && result.status === 'error') {
      throw new Error(result.message || 'Google Apps Script mengembalikan status error.');
    } else {
      throw new Error('Format respon Google Apps Script tidak berupa array data valid.');
    }

    const normalizedData = rawList.map((row, idx) => normalizeRawRow(row, idx));

    return {
      success: true,
      data: normalizedData,
      message: `Berhasil mengimpor ${normalizedData.length} baris data dari Google Sheet`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal menyambung ke Google Apps Script. Pastikan Web App di-deploy dengan akses "Anyone".',
    };
  }
}

// Export records to CSV string
export function exportToCsv(records: TransactionRecord[]): string {
  const headers = [
    'TANGGAL', 'BULAN', 'TAHUN', 'BA', 'BA Number', 'COVER AREA',
    'SALES', 'SPV', 'BRAND', 'NO SKU', 'SPU', 'SKU',
    'PRODUK FOCUS', 'PRODUK NEW', 'NAMA STORE', 'REGION',
    'KATEGORI', 'QTY', 'VALUE', 'KET'
  ];

  const escapeField = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => [
    escapeField(r.TANGGAL),
    escapeField(r.BULAN),
    escapeField(r.TAHUN),
    escapeField(r.BA),
    escapeField(r.BA_Number),
    escapeField(r.COVER_AREA),
    escapeField(r.SALES),
    escapeField(r.SPV),
    escapeField(r.BRAND),
    escapeField(r.NO_SKU),
    escapeField(r.SPU),
    escapeField(r.SKU),
    escapeField(r.PRODUK_FOCUS),
    escapeField(r.PRODUK_NEW),
    escapeField(r.NAMA_STORE),
    escapeField(r.REGION),
    escapeField(r.KATEGORI),
    escapeField(r.QTY),
    escapeField(r.VALUE),
    escapeField(r.KET),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// Download CSV file directly
export function downloadCsv(records: TransactionRecord[], filename: string = 'salespro_data.csv'): void {
  const csvContent = exportToCsv(records);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Parse CSV text string to TransactionRecord array
export function parseCsv(csvText: string): TransactionRecord[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header line handling quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const records: TransactionRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length <= 1) continue;

    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    records.push(normalizeRawRow(rowObj, i));
  }

  return records;
}
