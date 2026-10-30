import React, { useState } from 'react';
import {
  Download,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { TransactionRecord, DashboardFilters, MetricSummary } from '../types/dashboard';
import { formatRupiah, formatNumber, calculateSummary } from '../utils/analytics';
import { downloadCsv } from '../services/gasService';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

interface RawDataTableProps {
  records: TransactionRecord[];
  filters?: DashboardFilters;
  summary?: MetricSummary;
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ records, filters, summary }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<keyof TransactionRecord>('TANGGAL');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tableSearch, setTableSearch] = useState('');

  // Local search filter
  const filtered = records.filter((r) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      r.SKU.toLowerCase().includes(q) ||
      r.NAMA_STORE.toLowerCase().includes(q) ||
      r.SALES.toLowerCase().includes(q) ||
      r.SPV.toLowerCase().includes(q) ||
      r.BRAND.toLowerCase().includes(q) ||
      r.NO_SKU.includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof TransactionRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Data Mentah Spreadsheet (Format Google Sheet)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan seluruh 20 kolom data transaksi persis seperti format Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative grow sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari dalam tabel..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const currentSummary = summary || calculateSummary(sorted);
                const currentFilters = filters || {
                  BULAN: 'ALL',
                  TAHUN: 'ALL',
                  SALES: 'ALL',
                  SPV: 'ALL',
                  BRAND: 'ALL',
                  KATEGORI: 'ALL',
                  SKU: 'ALL',
                  NAMA_STORE: 'ALL',
                  REGION: 'ALL',
                  KET: 'ALL',
                  searchQuery: '',
                };
                exportToExcel(sorted, currentSummary, currentFilters);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title="Download Data Tabel ke File Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                const currentSummary = summary || calculateSummary(sorted);
                const currentFilters = filters || {
                  BULAN: 'ALL',
                  TAHUN: 'ALL',
                  SALES: 'ALL',
                  SPV: 'ALL',
                  BRAND: 'ALL',
                  KATEGORI: 'ALL',
                  SKU: 'ALL',
                  NAMA_STORE: 'ALL',
                  REGION: 'ALL',
                  KET: 'ALL',
                  searchQuery: '',
                };
                exportToPdf(sorted, currentSummary, currentFilters);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title="Download Ringkasan Laporan ke PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF (.pdf)</span>
            </button>

            <button
              onClick={() => downloadCsv(sorted, `salespro_export_${new Date().toISOString().slice(0, 10)}.csv`)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title="Download Data Tabel ke File CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table with Exact Columns */}
      <div className="overflow-x-auto my-4 max-h-[600px] border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('TANGGAL')}>
                <div className="flex items-center gap-1">TANGGAL <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('BULAN')}>
                <div className="flex items-center gap-1">BULAN <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('TAHUN')}>
                <div className="flex items-center gap-1">TAHUN <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5">BA</th>
              <th className="py-2 px-2.5">BA Number</th>
              <th className="py-2 px-2.5">COVER AREA</th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('SALES')}>
                <div className="flex items-center gap-1">SALES <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('SPV')}>
                <div className="flex items-center gap-1">SPV <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('BRAND')}>
                <div className="flex items-center gap-1">BRAND <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5">NO SKU</th>
              <th className="py-2 px-2.5">SPU</th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('SKU')}>
                <div className="flex items-center gap-1">SKU <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5">PRODUK FOCUS</th>
              <th className="py-2 px-2.5">PRODUK NEW</th>
              <th className="py-2 px-2.5 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('NAMA_STORE')}>
                <div className="flex items-center gap-1">NAMA STORE <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5">REGION</th>
              <th className="py-2 px-2.5">KATEGORI</th>
              <th className="py-2 px-2.5 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('QTY')}>
                <div className="flex items-center justify-end gap-1">QTY <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5 text-right cursor-pointer hover:bg-slate-200" onClick={() => handleSort('VALUE')}>
                <div className="flex items-center justify-end gap-1">VALUE <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="py-2 px-2.5">KET</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={20} className="py-12 text-center text-slate-400 font-sans text-xs">
                  Tidak ada data yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const isNegative = (r.VALUE || 0) < 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2.5 text-slate-700">{r.TANGGAL}</td>
                    <td className="py-2 px-2.5 text-slate-700 font-sans">{r.BULAN}</td>
                    <td className="py-2 px-2.5 text-slate-700">{r.TAHUN}</td>
                    <td className="py-2 px-2.5 text-slate-500 font-sans">{r.BA}</td>
                    <td className="py-2 px-2.5 text-slate-500">{r.BA_Number}</td>
                    <td className="py-2 px-2.5 text-slate-600 font-sans">{r.COVER_AREA}</td>
                    <td className="py-2 px-2.5 text-slate-900 font-bold font-sans">{r.SALES}</td>
                    <td className="py-2 px-2.5 text-slate-800 font-sans">{r.SPV}</td>
                    <td className="py-2 px-2.5 font-bold font-sans">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        r.BRAND === 'barenbliss'
                          ? 'bg-pink-100 text-pink-900 border-pink-200'
                          : r.BRAND === 'Y.O.U'
                          ? 'bg-blue-100 text-blue-900 border-blue-200'
                          : r.BRAND === 'DAZZLE ME'
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : r.BRAND === 'GLAMFIX'
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}>
                        {r.BRAND}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-600">{r.NO_SKU}</td>
                    <td className="py-2 px-2.5 text-slate-500 font-sans max-w-xs truncate" title={r.SPU}>{r.SPU}</td>
                    <td className="py-2 px-2.5 text-slate-900 font-sans max-w-sm truncate font-semibold" title={r.SKU}>{r.SKU}</td>
                    <td className="py-2 px-2.5 font-sans">
                      {r.PRODUK_FOCUS === 'FOCUS' ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          FOCUS
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 font-sans">
                      {r.PRODUK_NEW === 'NEW' ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-extrabold">
                          NEW
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-slate-900 font-bold font-sans">{r.NAMA_STORE}</td>
                    <td className="py-2 px-2.5 text-slate-700 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {r.REGION}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-600 font-sans">{r.KATEGORI}</td>
                    <td className={`py-2 px-2.5 text-right font-black tabular-nums ${isNegative ? 'text-rose-600' : 'text-slate-900'}`}>
                      {r.QTY}
                    </td>
                    <td className={`py-2 px-2.5 text-right font-black tabular-nums ${isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatRupiah(r.VALUE)}
                    </td>
                    <td className="py-2 px-2.5 font-sans">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${
                          r.KET === 'RETURN'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : r.KET === 'SELL OUT'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {r.KET}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <div className="flex items-center gap-2">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-mono tabular-nums">
            Menampilkan {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sorted.length)} dari {sorted.length} baris
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 font-mono font-medium text-slate-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
