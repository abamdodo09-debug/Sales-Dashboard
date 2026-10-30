import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Database,
  ArrowRight,
  Code2
} from 'lucide-react';
import { GasConfig, TransactionRecord } from '../types/dashboard';
import { GOOGLE_APPS_SCRIPT_CODE, fetchGoogleSheetData, parseCsv } from '../services/gasService';

interface GasIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasConfig: GasConfig;
  onUpdateGasConfig: (config: GasConfig) => void;
  onDataLoaded: (data: TransactionRecord[], source: 'google_sheet' | 'imported_csv' | 'sample') => void;
  onResetToSample: () => void;
}

export const GasIntegrationModal: React.FC<GasIntegrationModalProps> = ({
  isOpen,
  onClose,
  gasConfig,
  onUpdateGasConfig,
  onDataLoaded,
  onResetToSample,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'code' | 'tutorial' | 'csv'>('connect');
  const [urlInput, setUrlInput] = useState(gasConfig.webAppUrl);
  const [sheetNameInput, setSheetNameInput] = useState(gasConfig.sheetName);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (e) {
      console.warn('Failed to copy to clipboard', e);
    }
  };

  const handleTestAndSync = async () => {
    if (!urlInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan Web App URL Google Apps Script Anda' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const result = await fetchGoogleSheetData(urlInput);

    if (result.success && result.data) {
      const updatedConfig: GasConfig = {
        ...gasConfig,
        webAppUrl: urlInput.trim(),
        sheetName: sheetNameInput.trim() || 'Sheet1',
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        status: 'connected',
        dataSourceType: 'google_sheet',
      };
      onUpdateGasConfig(updatedConfig);
      onDataLoaded(result.data, 'google_sheet');
      setStatusMessage({
        type: 'success',
        text: `Berhasil tersambung! Mengambil ${result.data.length} baris data dari Google Sheet.`,
      });
    } else {
      onUpdateGasConfig({
        ...gasConfig,
        status: 'error',
        errorMessage: result.message,
      });
      setStatusMessage({
        type: 'error',
        text: result.message || 'Gagal tersambung ke Google Apps Script',
      });
    }

    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: 'File CSV kosong atau format header tidak sesuai.' });
          return;
        }

        onDataLoaded(parsed, 'imported_csv');
        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor ${parsed.length} baris data dari file ${file.name}!`,
        });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Gagal membaca CSV: ${err?.message}` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Integrasi Sumber Data Google Sheet & Apps Script
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan dashboard langsung ke spreadsheet Google Anda via Google Apps Script (GAS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Sambungkan Web App
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Kode Apps Script (.gs)
          </button>
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'tutorial'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Panduan Pasang
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'csv'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File CSV
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: CONNECT */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  URL Web App Google Apps Script
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  URL diperoleh dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Apps Script editor.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Tab Sheet (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Sheet1"
                    value={sheetNameInput}
                    onChange={(e) => setSheetNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleTestAndSync}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Menghubungkan...' : 'Uji Koneksi & Tarik Data'}</span>
                  </button>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Sumber Data:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {gasConfig.dataSourceType === 'google_sheet'
                      ? '● Terhubung Google Sheet'
                      : gasConfig.dataSourceType === 'imported_csv'
                      ? '● File CSV Terunggah'
                      : '● Data Simulasi Bawaan (420+ baris)'}
                  </span>
                </div>
                {gasConfig.lastSyncedAt && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Terakhir Disinkronkan:</span>
                    <span className="font-mono text-slate-700">{gasConfig.lastSyncedAt}</span>
                  </div>
                )}
              </div>

              {/* Reset to Default */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500">Ingin kembali ke data contoh?</span>
                <button
                  onClick={() => {
                    onResetToSample();
                    setStatusMessage({ type: 'success', text: 'Berhasil dikembalikan ke dataset awal bawaan.' });
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                >
                  Kembalikan ke Data Simulasi Bawaan
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Kode Google Apps Script (.gs) Siap Pakai
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Salin kode di bawah ini lalu tempelkan di Extensions &gt; Apps Script spreadsheet Anda.
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 text-xs text-slate-700">
              <h3 className="font-bold text-slate-900 text-sm">
                Panduan Langkah demi Langkah Menghubungkan Google Sheet:
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="block text-slate-900">Buka Spreadsheet Google Anda</strong>
                    <span className="text-slate-600">
                      Pastikan header baris pertama persis: <code>TANGGAL, BULAN, TAHUN, BA, BA Number, COVER AREA, SALES, SPV, BRAND, NO SKU, SPU, SKU, PRODUK FOCUS, PRODUK NEW, NAMA STORE, REGION, KATEGORI, QTY, VALUE, KET</code>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="block text-slate-900">Buka Apps Script</strong>
                    <span className="text-slate-600">
                      Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong> di bilah atas spreadsheet Anda.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="block text-slate-900">Paste Kode Script</strong>
                    <span className="text-slate-600">
                      Hapus semua isi kode default di <code>Code.gs</code>, kemudian klik tab <strong>"Kode Apps Script"</strong> di atas dan klik <strong>"Salin Kode"</strong>, lalu paste ke editor Google Apps Script.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <strong className="block text-slate-900">Deploy sebagai Aplikasi Web (Web App)</strong>
                    <span className="text-slate-600">
                      Klik tombol <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; <strong>New deployment (Penerapan baru)</strong>.<br />
                      Pilih jenis <strong>Web app</strong>.<br />
                      Atur: <em>Execute as</em>: <strong>Me</strong> dan <em>Who has access</em>: <strong>Anyone (Siapa saja)</strong>.<br />
                      Klik <strong>Deploy</strong> dan berikan izin akses Google jika diminta.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div>
                    <strong className="block text-slate-900">Salin Web App URL ke Dashboard ini</strong>
                    <span className="text-slate-600">
                      Salin URL yang berakhiran <code>/exec</code>, buka tab <strong>"Sambungkan Web App"</strong> di modal ini, tempelkan URL tersebut, dan klik <strong>"Uji Koneksi &amp; Tarik Data"</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CSV UPLOAD */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Impor Langsung dari File CSV / Excel Export
                </h3>
                <p className="text-xs text-slate-500">
                  Jika Anda memiliki file export Google Sheet dalam format CSV, Anda dapat mengunggahnya secara langsung ke browser tanpa perantara server.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-800 mb-1">
                  Pilih file CSV untuk diimpor
                </span>
                <span className="block text-[11px] text-slate-500 mb-4">
                  Mendukung file CSV dengan header: TANGGAL, BULAN, TAHUN, SALES, SPV, BRAND, SKU, NAMA STORE, QTY, VALUE, KET
                </span>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs">
                  <span>Pilih File CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
