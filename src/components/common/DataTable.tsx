import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Settings,
  Database,
} from 'lucide-react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import toast from 'react-hot-toast';

interface Action<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: 'primary' | 'outline';
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
  onExport?: () => void;
  loading?: boolean;
  pageSize?: number;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFileName?: string;
  actions?: Action<TData>[];
  disableSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // NEW: Better height control
  fixedHeight?: string;
  fixedWidth?: string; // Total container height e.g. "700px"
  minVisibleRows?: number; // Minimum rows to show (for placeholder)
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onExport,
  loading = false,
  pageSize = 10,
  enableColumnVisibility = false,
  enableExport = true,
  exportFileName = 'data',
  actions,
  disableSearch = false,
  searchValue,
  onSearchChange,
  fixedHeight = '700px',
  fixedWidth = '700px',
  minVisibleRows = 8,
}: DataTableProps<TData>) {
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const currentSearchValue = searchValue !== undefined ? searchValue : internalSearchValue;
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
  };

  // === CSV Export ===
  const exportToCSV = () => {
    if (!data.length) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    const headers = columns
      .filter(col => col.id && !(columnVisibility as Record<string, boolean>)[col.id] !== false)
      .map(col => col.header as string)
      .join(',');

    const rows = data.map(row =>
      columns
        .filter(col => col.id && !(columnVisibility as Record<string, boolean>)[col.id] !== false)
        .map(col => {
          const accessorKey = (col as { accessorKey?: string }).accessorKey;
          const value = accessorKey ? row[accessorKey as keyof TData] : '';
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data berhasil diexport ke CSV');
  };

  // === Columns with optional actions ===
  const tableColumns = actions
    ? [
        ...columns,
        {
          id: 'actions',
          header: 'Aksi',
          cell: ({ row }: { row: { original: TData } }) => (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => action.onClick(row.original)}
                    startIcon={Icon ? <Icon className="w-4 h-4" /> : undefined}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </div>
          ),
        },
      ]
    : columns;

  // === Table Initialization ===
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: handleSearchChange,
    state: {
      globalFilter: currentSearchValue,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  // === Loading Skeleton ===
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-400">
        Memuat data...
      </div>
    );
  }

  const visibleRows = table.getRowModel().rows;
  const placeholderRowsCount = Math.max(0, minVisibleRows - visibleRows.length);

  // === FIXED HEIGHT LAYOUT ===
  return (
    <div className="space-y-4">
      {/* Toolbar - Outside fixed container */}
      {!disableSearch && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
              <Input
                placeholder={searchPlaceholder}
                value={currentSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enableColumnVisibility && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                startIcon={<Settings className="w-4 h-4" />}
              >
                Kolom
              </Button>
            )}
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                startIcon={<Download className="w-4 h-4" />}
                onClick={onExport || exportToCSV}
              >
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Column Settings */}
      {showColumnSettings && enableColumnVisibility && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Tampilkan/Sembunyikan Kolom</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {table.getAllColumns().map((column) => (
              <label key={column.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="rounded border-gray-300"
                />
                {column.id}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* === FIXED HEIGHT CONTAINER === */}
      <div 
        className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900"
        style={{ height: fixedHeight, width: fixedWidth }}
      >
        {/* Table Content - Scrollable with fixed header */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-full">
            {/* Sticky Header */}
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200'
                              : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-4 h-4" />}
                          {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-4 h-4" />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body with placeholder rows */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {visibleRows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={table.getVisibleFlatColumns().length} 
                    className="px-6 text-center text-gray-500"
                    style={{ height: `${minVisibleRows * 64}px` }}
                  >
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <Database className="w-12 h-12 text-gray-400" />
                      <p className="text-base font-medium">Data tidak ditemukan</p>
                      <p className="text-sm text-gray-400">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Actual data rows */}
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Placeholder rows to maintain minimum height */}
                  {placeholderRowsCount > 0 && Array.from({ length: placeholderRowsCount }).map((_, i) => (
                    <tr key={`placeholder-${i}`} style={{ height: '64px' }}>
                      {table.getVisibleFlatColumns().map((col, j) => (
                        <td key={`placeholder-${i}-${j}`} className="px-6 py-4 border-0"></td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-9 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.5rem_center] bg-no-repeat"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{' '}
              of {data.length}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Prev
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[100px] text-center">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}