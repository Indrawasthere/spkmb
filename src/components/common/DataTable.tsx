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
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Export functions
  const exportToCSV = () => {
    if (!data.length) {
      toast.error('No data to export');
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
    toast.success('Data exported to CSV');
  };

  // Add actions column if actions are provided
  const tableColumns = actions ? [
    ...columns,
    {
      id: 'actions',
      header: 'Actions',
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
  ] : columns;

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
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  {Array.from({ length: (actions ? columns.length + 1 : columns.length) }).map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: (actions ? columns.length + 1 : columns.length) }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {enableColumnVisibility && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              startIcon={<Settings className="w-4 h-4" />}
            >
              Columns
            </Button>
          )}

          {enableExport && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                startIcon={<Download className="w-4 h-4" />}
                onClick={exportToCSV}
              >
                Export
              </Button>
            </div>
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

      {/* Column Visibility Settings */}
      {showColumnSettings && enableColumnVisibility && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">Show/Hide Columns</h4>
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

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''
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
                  <td
                    colSpan={table.getVisibleFlatColumns().length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Database className="w-8 h-8 text-gray-400" />
                      <p>No data found</p>
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 px-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length} results
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
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
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
  );
}
