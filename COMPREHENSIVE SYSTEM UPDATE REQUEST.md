# COMPREHENSIVE SYSTEM UPDATE REQUEST

I need you to help me complete and enhance my SIP-KPBJ (Procurement Monitoring System) application. Below are the detailed requirements:

## CONTEXT
- Tech Stack: React + TypeScript, Express.js, Prisma ORM, PostgreSQL
- Current Status: Basic CRUD operations work, but missing several features
- Design System: Already using Tailwind CSS with dark mode support

## CRITICAL REQUIREMENTS

### 1. TABLE UI IMPROVEMENTS
**Current Issue**: Tables exist but need proper data table component with:
- **Sortable columns** (click header to sort ascending/descending)
- **Pagination** (show 10, 25, 50, 100 rows per page)
- **Column visibility toggle** (show/hide columns)
- **Export functionality** (CSV, Excel, PDF)
- **Row actions menu** (Edit, Delete, View Details) with icons
- **Responsive design** (mobile-friendly with horizontal scroll)
- **Loading states** (skeleton loaders)
- **Empty states** (nice illustration when no data)

**Reference**: Use patterns similar to TanStack Table or Shadcn/ui Data Table

### 2. MODAL IMPROVEMENTS FOR ALL PAGES
**Requirements for ALL modals (Add, Edit, Delete)**:
- **Consistent design**: Same styling across all pages
- **Proper form validation**: Real-time error messages
- **Field icons**: Left icons for input fields (user icon, calendar icon, etc.)
- **Loading states**: Disable buttons and show spinner while saving
- **Success/Error toasts**: Instead of browser alerts
- **Delete confirmation**: Dedicated modal with warning icon
- **File upload preview**: Show uploaded file name/size
- **Required field indicators**: Red asterisk (*)
- **Help text**: Gray text under fields for guidance
- **Modal sizes**: Adjust based on form complexity (md, lg, xl, 2xl)

### 3. NEW PAGE: PPK DATA MANAGEMENT
Create complete CRUD page at `/ppk-data` with:

**Table Columns**:
- Nama PPK
- Nama Proyek  
- No Sertifikasi
- Jumlah Anggaran (formatted as Rupiah)
- Lama Proyek (in days, auto-calculated)
- Tanggal Mulai - Tanggal Selesai
- Realisasi Termin 1 (Rp)
- Realisasi Termin 2 (Rp)
- Realisasi Termin 3 (Rp)
- Realisasi Termin 4 (Rp)
- PHO Date
- FHO Date
- Actions (Edit, Delete)

**Modal Fields** (Add/Edit):
```typescript
{
  paketId: string (select from existing paket)
  namaPPK: string
  noSertifikasi: string
  jumlahAnggaran: number (currency input)
  lamaProyek: number (auto-calculated from paket dates)
  realisasiTermin1?: number
  realisasiTermin2?: number
  realisasiTermin3?: number
  realisasiTermin4?: number
  PHO?: Date
  FHO?: Date
}
```

**Additional Features**:
- Filter by paket
- Search by PPK name or sertifikasi number
- Stats cards showing: Total PPK, Total Budget, Average Completion Rate
- Progress bar showing termin realization vs budget

### 4. VENDOR ENHANCEMENTS

#### A. Konsultan Perencanaan (KONSULTAN_PERENCANAAN)
**Add these fields to modal**:
```typescript
{
  // Existing fields remain...
  paketId: string (select dropdown)
  noKontrak: string (was nomorIzin)
  deskripsi: string (textarea)
  dokumenDED: File (upload .pdf, .dwg, .dxf)
  tanggalMulaiKerja: Date
  tanggalSelesaiKerja: Date
  lamaKontrak: number (auto-calculated in months)
  warningTemuan: boolean (auto-set if has related findings)
}
```

**Table additions**:
- Column: "Warning" (badge with ⚠️ if warningTemuan = true)
- Column: "Dokumen DED" (download link if exists)
- Column: "Status Kontrak" (Aktif/Selesai based on dates)

#### B. Konsultan Pengawas (KONSULTAN_PENGAWAS)  
**Add these fields**:
```typescript
{
  // Previous fields...
  namaProyek: string
  tanggalMulaiKerja: Date
  tanggalSelesaiKontrak: Date
  realisasiPekerjaan: number (percentage 0-100)
  deviasiPersentase: number (can be negative)
  deskripsiLaporanHarian: string (textarea)
  deskripsiLaporanMingguan: string (textarea)
  deskripsiLaporanBulanan: string (textarea)
  dokumenLaporanTermin: File[] (multiple uploads)
  warningTemuan: boolean
  rencanaTindakLanjut?: string (textarea, conditional if warningTemuan)
}
```

**Calculated Fields**:
- `deviasiPersentase` = realisasiPekerjaan - rencanaProgress (need rencanaProgress field)
- Color code: Green (positive), Red (negative)

#### C. Konstruksi (KONSTRUKSI)
**Add these fields**:
```typescript
{
  // Previous fields...
  namaProyek: string
  rencanaProgress: number[] (array for weekly plan)
  realisasiProgress: number[] (array for weekly actual)
  deviasiProgress: number[] (calculated: realisasi - rencana)
  jaminanUangMuka: File (upload)
  jaminanPelaksanaan: File (upload)
  jaminanPemeliharaan: File (upload)
  uploadDokumen: File[] (multiple uploads)
  uploadFoto: File[] (multiple image uploads with preview)
  warningTemuan: boolean
  rencanaTindakLanjut?: string (conditional field)
}
```

**Special UI Elements**:
- **Progress chart**: Line chart showing rencana vs realisasi over time
- **Jaminan status**: Badge showing "Uploaded" or "Missing" for each jaminan type
- **Photo gallery**: Grid view of uploaded photos with lightbox

### 5. WARNING & FOLLOW-UP SYSTEM

**Auto-trigger warning** when:
- TemuanBPKP or LaporanItwasda exists for vendor's paket
- Status is "KRITIS" or "TINGGI"

**UI for warning**:
```tsx
{vendor.warningTemuan && (
  <div className="border-l-4 border-warning-500 bg-warning-50 p-4">
    <div className="flex items-center gap-2">
      <AlertTriangleIcon className="text-warning-600" />
      <span className="font-semibold">Temuan Pengawasan Terdeteksi</span>
    </div>
    <p className="text-sm mt-2">Ada {temuanCount} temuan yang perlu ditindaklanjuti</p>
    <button onClick={showRTLModal}>Buat Rencana Tindak Lanjut</button>
  </div>
)}
```

**RTL Modal Fields**:
```typescript
{
  vendorId: string
  temuanId: string
  rencanaAksi: string (textarea, required)
  penanggungJawab: string
  targetPenyelesaian: Date
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
  buktiPelaksanaan?: File
}
```

### 6. DASHBOARD ENHANCEMENTS

**Add**:
- MPMI Logo in top navbar (provide logo path: `/images/logo-mpmi.png`)
- KPI cards with icons and colors
- Interactive charts (use Recharts):
  - Paket status distribution (Pie chart)
  - Vendor performance trend (Line chart)
  - Budget realization (Bar chart)
  - Temuan by kategori (Horizontal bar)

**Stats Cards Design**:
```tsx
<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-blue-100 text-sm">Total Paket</p>
      <p className="text-3xl font-bold mt-1">{totalPaket}</p>
      <p className="text-blue-100 text-xs mt-2">↑ 12% dari bulan lalu</p>
    </div>
    <div className="bg-white/20 rounded-full p-4">
      <PackageIcon className="w-8 h-8" />
    </div>
  </div>
</div>
```

### 7. NEW PAGE: PENGADUAN MASYARAKAT

Create page at `/pengaduan` with:

**Table Columns**:
- No. Pengaduan
- Tanggal
- Judul
- Pelapor (anonim/nama)
- Kategori (Dugaan KKN, Protes Kualitas, Komplain Waktu, Lainnya)
- Status (Baru, Ditinjau, Diproses, Selesai)
- Prioritas (Rendah, Sedang, Tinggi, Urgent)
- Actions

**Form Fields**:
```typescript
{
  judul: string (required)
  isi: string (textarea, required)
  kategori: enum
  pelapor: string (optional, "Anonim" if empty)
  kontak?: string (email/phone)
  lampiran?: File[]
  lokasi?: string
  paketTerkait?: string (select from paket)
}
```

**Features**:
- Public form (no login required for submission)
- Admin dashboard to manage pengaduan
- Status workflow with notes
- Email notification to pelapor (if provided)

### 8. LINK TO LKPP PORTAL

Add in navigation bar:
```tsx
<a 
  href="https://inaproc.lkpp.go.id" 
  target="_blank" 
  rel="noopener noreferrer"
  className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
>
  <ExternalLinkIcon className="w-4 h-4" />
  Portal LKPP
</a>
```

### 9. TECHNICAL REQUIREMENTS

**Backend** (Express + Prisma):
- Add missing routes for PPKData CRUD
- Add file upload handling for all new file fields
- Add validation middleware
- Add relationship queries (include related data)

**Frontend**:
- Use React Query for data fetching
- Implement optimistic updates
- Add toast notifications (react-hot-toast)
- Use Formik or React Hook Form for forms
- Add Yup validation schemas

**File Upload**:
- Max size: 10MB per file
- Allowed types: .pdf, .doc, .docx, .jpg, .png, .dwg, .dxf
- Store in `/uploads` with organized folders
- Return public URL in API response

**Database**:
- Add migrations for new fields
- Add indexes for foreign keys
- Add check constraints (e.g., realisasiPekerjaan 0-100)

## IMPLEMENTATION PRIORITY

1. **Phase 1** (Critical):
   - Fix table UI across all pages
   - Improve all modals (consistent design)
   - Add PPKData page
   - Add warning system for vendors

2. **Phase 2** (High):
   - Vendor enhancements (all 3 types)
   - Pengaduan Masyarakat page
   - Dashboard improvements with logo

3. **Phase 3** (Medium):
   - Charts and analytics
   - Export functionality
   - Email notifications
   - LKPP portal link

## DESIGN GUIDELINES

**Colors** (from existing theme):
- Primary: blue-600 (#2563eb)
- Success: green-600 (#16a34a)  
- Warning: yellow-600 (#ca8a04)
- Error: red-600 (#dc2626)
- Info: cyan-600 (#0891b2)

**Spacing**: Use Tailwind spacing scale (4, 6, 8, 12, 16, 24)
**Fonts**: Inter for UI, system fonts fallback
**Icons**: Use Lucide React icons consistently
**Shadows**: shadow-sm for cards, shadow-lg for modals

## OUTPUT FORMAT

Please provide:
1. **Updated Prisma schema** (if schema changes needed)
2. **Backend route handlers** (Express.js with Prisma)
3. **Frontend components** (React + TypeScript + Tailwind)
4. **Migration instructions** (step-by-step)
5. **File structure** (where to place new files)

Focus on ONE feature at a time, starting with **Table UI improvements** as it affects all pages.

For each feature, provide:
- Complete, production-ready code (no placeholders)
- Error handling
- Loading states
- TypeScript types
- Comments for complex logic

3. Rekomendasi Tambahan
Untuk concern Anda tentang table yang solid seperti di gambar:
A. Install Dependencies Tambahan
bashnpm install @tanstack/react-table date-fns clsx
npm install lucide-react react-hot-toast
B. Buat Reusable DataTable Component
Ini akan jadi base component yang bisa dipakai di semua page:
File: src/components/common/DataTable.tsx
tsximport { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
  onExport?: () => void;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onExport,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
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

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
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
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No data found
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
      <div className="flex items-center justify-between">
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
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
C. Contoh Penggunaan di Page
tsx// Dalam ManajemenPaket.tsx
const columns: ColumnDef<Paket>[] = [
  {
    accessorKey: 'kodePaket',
    header: 'Kode Paket',
  },
  {
    accessorKey: 'namaPaket',
    header: 'Nama Paket',
  },
  {
    accessorKey: 'nilaiPaket',
    header: 'Nilai',
    cell: ({ row }) => `Rp ${row.original.nilaiPaket.toLocaleString('id-ID')}`,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row.original)}>
          <PencilIcon className="w-5 h-5 text-blue-600" />
        </button>
        <button onClick={() => handleDelete(row.original.id)}>
          <TrashBinIcon className="w-5 h-5 text-red-600" />
        </button>
      </div>
    ),
  },
];

// Gunakan di render
<DataTable
  columns={columns}
  data={pakets}
  searchPlaceholder="Cari paket..."
  onExport={() => exportToCSV(pakets)}
/>

Please provide that

