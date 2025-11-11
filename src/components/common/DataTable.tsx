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

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface Action<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: 'primary' | 'outline';
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  filters?: FilterConfig[];
  searchPlaceholder?: string;
  onExport?: () => void;
  loading?: boolean;
  pageSize?: number;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFileName?: string;
  actions?: Action<TData>[];
}

export function DataTable<TData>({
  columns,
  data,
  filters = [],
  searchPlaceholder = 'Search...',
  onExport,
  loading = false,
  pageSize = 10,
  enableColumnVisibility = false,
  enableExport = true,
  exportFileName = 'data',
  actions,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
      columnVisibility,
      rowSelection,
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

  // === Toolbar (Search + Filter + Export) ===
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Dynamic Filters */}
          {filters.map((filter) => (
            <select
              key={filter.key}
              className="border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\'><path d=\\'M4 6l4 4 4-4\\'/></svg>')] bg-[right_0.75rem_center] bg-no-repeat"
              value={filterValues[filter.key] || 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                setFilterValues((prev) => ({ ...prev, [filter.key]: val }));
                if (val === 'ALL') table.resetGlobalFilter();
                else table.setGlobalFilter(val);
              }}
            >
              <option value="ALL">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
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
              onClick={exportToCSV}
            >
              Export
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              startIcon={<Download className="w-4 h-4" />}
              onClick={onExport}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* === Column Settings === */}
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

      {/* === Table Content === */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="w-8 h-8 text-gray-400" />
                      <p>Data tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === Pagination === */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
          <select
            value={table.getState().pagination?.pageSize ?? pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 pl-2 pr-7 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 appearance-none bg-[url('data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'14\\' height=\\'14\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\'><path d=\\'M3 5l4 4 4-4\\'/></svg>')] bg-[right_0.5rem_center] bg-no-repeat"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {table.getState().pagination?.pageIndex * table.getState().pagination?.pageSize + 1}–
          {Math.min(
            (table.getState().pagination?.pageIndex + 1) * table.getState().pagination?.pageSize,
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
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {table.getState().pagination?.pageIndex + 1} of {table.getPageCount()}
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
  );
}
