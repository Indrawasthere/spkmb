# COMPREHENSIVE SYSTEM UPDATE REQUEST - TODO LIST

## PHASE 1 (CRITICAL) - Table UI Improvements & Modal Enhancements

### 1. TABLE UI IMPROVEMENTS ✅ COMPLETED
**Status**: ✅ COMPLETED
**Details**: Created reusable DataTable component with:
- Sortable columns (click header to sort ascending/descending)
- Pagination (show 10, 25, 50, 100 rows per page)
- Column visibility toggle (show/hide columns)
- Export functionality (CSV)
- Row actions menu (Edit, Delete, View Details) with icons
- Responsive design (mobile-friendly with horizontal scroll)
- Loading states (skeleton loaders)
- Empty states (nice illustration when no data)
**Files Modified**:
- `src/components/common/DataTable.tsx` - Created new reusable component
- Dependencies installed: `@tanstack/react-table`, `date-fns`, `clsx`, `lucide-react`, `react-hot-toast`

### 2. MODAL IMPROVEMENTS FOR ALL PAGES
**Status**: ❌ NOT STARTED
**Requirements**:
- Consistent design across all pages
- Proper form validation with real-time error messages
- Field icons (left icons for input fields)
- Loading states (disable buttons and show spinner while saving)
- Success/Error toasts instead of browser alerts
- Delete confirmation modal with warning icon
- File upload preview (show uploaded file name/size)
- Required field indicators (red asterisk *)
- Help text (gray text under fields for guidance)
- Modal sizes (adjust based on form complexity: md, lg, xl, 2xl)

### 3. NEW PAGE: PPK DATA MANAGEMENT ✅ COMPLETED
**Status**: ✅ COMPLETED
**Details**: Created complete CRUD page at `/pengawasan-audit/ppk` with:
**Table Columns**: ✅
- Nama PPK
- Nama Proyek
- No Sertifikasi
- Jumlah Anggaran (formatted as Rupiah)
- Lama Proyek (in days, auto-calculated)
- Tanggal Mulai - Tanggal Selesai
- Realisasi Termin 1-4 (Rp)
- PHO Date, FHO Date
- Actions (Edit, Delete)

**Modal Fields**: ✅
- paketId (select from existing paket)
- namaPPK, noSertifikasi
- jumlahAnggaran (currency input)
- lamaProyek (auto-calculated)
- realisasiTermin1-4
- PHO, FHO dates

**Additional Features**: ✅
- Filter by paket
- Search by PPK name or sertifikasi number
- Stats cards: Total PPK, Total Budget, Average Completion Rate
- Progress bar showing termin realization vs budget

**Files Created/Modified**:
- `src/pages/PPKData.tsx` - Complete CRUD page
- `src/App.tsx` - Added route `/pengawasan-audit/ppk`
- `src/layout/AppSidebar.tsx` - Integrated into Pengawasan & Audit submenu

### 4. WARNING & FOLLOW-UP SYSTEM
**Status**: ❌ NOT STARTED
**Requirements**:
- Auto-trigger warning when TemuanBPKP or LaporanItwasda exists for vendor's paket
- Status is "KRITIS" or "TINGGI"
- UI warning component with AlertTriangle icon
- RTL (Rencana Tindak Lanjut) modal for follow-up actions

## PHASE 2 (HIGH) - Vendor Enhancements

### 5. VENDOR ENHANCEMENTS

#### A. Konsultan Perencanaan (KONSULTAN_PERENCANAAN)
**Status**: ❌ NOT STARTED
**New Fields to Add**:
- paketId (select dropdown)
- noKontrak (was nomorIzin)
- deskripsi (textarea)
- dokumenDED (File upload: .pdf, .dwg, .dxf)
- tanggalMulaiKerja, tanggalSelesaiKerja
- lamaKontrak (auto-calculated in months)
- warningTemuan (boolean, auto-set)

**Table Additions**:
- "Warning" column (badge with ⚠️ if warningTemuan = true)
- "Dokumen DED" column (download link if exists)
- "Status Kontrak" column (Aktif/Selesai based on dates)

#### B. Konsultan Pengawas (KONSULTAN_PENGAWAS)
**Status**: ❌ NOT STARTED
**New Fields to Add**:
- namaProyek
- tanggalMulaiKerja, tanggalSelesaiKontrak
- realisasiPekerjaan (percentage 0-100)
- deviasiPersentase (calculated, can be negative)
- deskripsiLaporanHarian, Mingguan, Bulanan (textareas)
- dokumenLaporanTermin (multiple uploads)
- warningTemuan, rencanaTindakLanjut (conditional)

#### C. Konstruksi (KONSTRUKSI)
**Status**: ❌ NOT STARTED
**New Fields to Add**:
- namaProyek
- rencanaProgress, realisasiProgress (arrays for weekly data)
- deviasiProgress (calculated)
- jaminanUangMuka, jaminanPelaksanaan, jaminanPemeliharaan (files)
- uploadDokumen, uploadFoto (multiple uploads)
- warningTemuan, rencanaTindakLanjut

**Special UI Elements**:
- Progress chart (Line chart showing rencana vs realisasi)
- Jaminan status badges
- Photo gallery with lightbox

### 6. NEW PAGE: PENGADUAN MASYARAKAT
**Status**: ❌ NOT STARTED
**Requirements**:
- Public form (no login required for submission)
- Admin dashboard to manage pengaduan
- Table columns: No. Pengaduan, Tanggal, Judul, Pelapor, Kategori, Status, Prioritas, Actions
- Status workflow with notes
- Email notification to pelapor (if provided)

### 7. DASHBOARD ENHANCEMENTS
**Status**: ❌ NOT STARTED
**Requirements**:
- Add MPMI Logo in top navbar (`/images/logo-mpmi.png`)
- KPI cards with icons and colors
- Interactive charts (Recharts):
  - Paket status distribution (Pie chart)
  - Vendor performance trend (Line chart)
  - Budget realization (Bar chart)
  - Temuan by kategori (Horizontal bar)

## PHASE 3 (MEDIUM) - Advanced Features

### 8. CHARTS AND ANALYTICS
**Status**: ❌ NOT STARTED
**Requirements**:
- Implement all dashboard charts
- Add chart components to relevant pages
- Real-time data updates

### 9. EXPORT FUNCTIONALITY ENHANCEMENT
**Status**: ❌ NOT STARTED
**Requirements**:
- Excel export (in addition to CSV)
- PDF export with proper formatting
- Custom export options (date range, filters)

### 10. EMAIL NOTIFICATIONS
**Status**: ❌ NOT STARTED
**Requirements**:
- Email notifications for pengaduan updates
- Email templates
- SMTP configuration

### 11. LKPP PORTAL LINK
**Status**: ❌ NOT STARTED
**Requirements**:
- Add link to navigation bar
- External link icon
- Proper styling

## TECHNICAL REQUIREMENTS

### 12. BACKEND ENHANCEMENTS
**Status**: ❌ NOT STARTED
**Requirements**:
- Add missing routes for PPKData CRUD
- Add file upload handling for all new file fields
- Add validation middleware
- Add relationship queries (include related data)

### 13. DATABASE UPDATES
**Status**: ❌ NOT STARTED
**Requirements**:
- Add migrations for new fields
- Add indexes for foreign keys
- Add check constraints (e.g., realisasiPekerjaan 0-100)

### 14. FILE UPLOAD SYSTEM
**Status**: ❌ NOT STARTED
**Requirements**:
- Max size: 10MB per file
- Allowed types: .pdf, .doc, .docx, .jpg, .png, .dwg, .dxf
- Store in `/uploads` with organized folders
- Return public URL in API response

## SUMMARY
- **Completed**: 2/14 major tasks (Table UI, PPK Data Management)
- **In Progress**: 0/14
- **Remaining**: 12/14 major tasks
- **Overall Progress**: ~14%

**Next Priority**: Modal improvements across all pages (Phase 1, Task 2)
