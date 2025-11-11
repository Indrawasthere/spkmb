# 📁 SIPAKAT-PBJ — Module Template Reference

> 🧠 Dokumen ini menjelaskan semua komponen template reusable yang digunakan di dalam module `Dokumen Arsip`.  
> Template ini dapat digunakan kembali di semua module lain seperti **Vendor**, **Audit**, **Keuangan**, dan **Monitoring** untuk menjaga konsistensi UI/UX dan struktur codebase.

---

## 🧱 Master Template Reference

---

### ⚙️ 1. `StatsCard.tsx`
**Path:** `src/components/common/StatsCard.tsx`

#### Fungsi
Menampilkan data ringkasan (statistik, total, summary) dalam bentuk kartu berwarna gradient.  
Biasanya digunakan di header module atau dashboard.

#### Props
| Prop | Type | Deskripsi |
|------|------|------------|
| `title` | `string` | Judul kartu (contoh: *Total Dokumen*) |
| `value` | `string \| number` | Angka utama/statistik |
| `subtitle` | `string?` | Deskripsi kecil di bawah title |
| `icon` | `React.ElementType` | Icon dari Heroicons (contoh: `ChartBarIcon`) |
| `fromColor` | `string?` | Warna gradient awal (Tailwind class) |
| `toColor` | `string?` | Warna gradient akhir (Tailwind class) |
| `iconBgOpacity` | `string?` | Opacity background icon (default `bg-white/20`) |

#### Contoh Pemakaian
```tsx
<StatsCard
  title="Total Vendor"
  value={vendors.length}
  subtitle="Jumlah vendor aktif"
  icon={UsersIcon}
  fromColor="from-blue-500"
  toColor="to-indigo-600"
/>
````

#### Use Case

* Dashboard summary
* Header statistik di tiap module (Audit, Vendor, Keuangan, dsb)

---

### ⚡ 2. `ActionButtons.tsx`

**Path:** `src/components/common/ActionButtons.tsx`

#### Fungsi

Kumpulan tombol aksi (View, Edit, Delete) yang reusable untuk setiap row di DataTable.

#### Props

| Prop       | Type         | Deskripsi                    |
| ---------- | ------------ | ---------------------------- |
| `onView`   | `() => void` | Fungsi untuk tombol *View*   |
| `onEdit`   | `() => void` | Fungsi untuk tombol *Edit*   |
| `onDelete` | `() => void` | Fungsi untuk tombol *Delete* |

#### Contoh Pemakaian

```tsx
<ActionButtons
  onView={() => handleViewDetails(row.original)}
  onEdit={() => handleEdit(row.original)}
  onDelete={() => handleDelete(row.original)}
/>
```

#### Use Case

* Kolom `actions` pada setiap DataTable
* CRUD module lain (misal: Vendor, Paket, Monitoring, Audit)

---

### 🔔 3. `ToastProvider.tsx` + `useToast.ts`

**Path:**

* `src/components/common/ToastProvider.tsx`
* `src/hooks/useToast.ts`

#### Fungsi

Sistem notifikasi global menggunakan **`react-hot-toast`**, supaya semua module bisa munculkan notifikasi dengan gaya dan posisi seragam.

#### 📦 `ToastProvider.tsx`

Dipanggil **sekali di `App.tsx`**:

```tsx
import { ToastProvider } from "./components/common/ToastProvider";

function App() {
  return (
    <>
      <AppRoutes />
      <ToastProvider />
    </>
  );
}
```

#### 📦 `useToast.ts`

```ts
import toast from "react-hot-toast";

export const useToast = () => ({
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg, { icon: "ℹ️" }),
  loading: (msg: string) => toast.loading(msg),
});
```

#### Contoh Pemakaian

```tsx
const { success, error, loading } = useToast();

loading("Mengirim data...");
await fetch(...);
success("Data berhasil disimpan!");
```

#### Use Case

* Semua aksi user (upload, delete, update, gagal fetch, dll)
* Konsisten di seluruh sistem SIPAKAT

---

### 🧩 4. `ConfirmModal.tsx`

**Path:** `src/components/ui/ConfirmModal.tsx`

#### Fungsi

Popup konfirmasi sebelum aksi berisiko dilakukan (misal: hapus data, reset, dsb).

#### Contoh Pemakaian

```tsx
<ConfirmModal
  isOpen={isConfirmModalOpen}
  onClose={() => setIsConfirmModalOpen(false)}
  onConfirm={confirmDelete}
  title="Hapus Data"
  message={`Apakah Anda yakin ingin menghapus data ini?`}
  confirmText="Hapus"
  cancelText="Batal"
  loading={isLoading}
/>
```

#### Use Case

* Konfirmasi delete data
* Reset status, cancel transaksi, dll

---

### 📋 5. `DetailsModal.tsx`

**Path:** `src/components/common/DetailsModal.tsx`

#### Fungsi

Modal untuk menampilkan detail data dengan struktur label & value yang rapi.

#### Contoh Pemakaian

```tsx
<DetailsModal
  isOpen={isDetailsOpen}
  onClose={() => setIsDetailsOpen(false)}
  title="Detail Vendor"
  sections={[
    {
      title: "Informasi Utama",
      fields: [
        { label: "Nama Vendor", value: vendor.nama },
        { label: "Kategori", value: vendor.kategori },
      ],
    },
  ]}
/>
```

#### Use Case

* Menampilkan detail entitas (dokumen, vendor, audit log, user, paket, dll)

---

### 📈 6. `DataTable.tsx`

**Path:** `src/components/common/DataTable.tsx`

#### Fungsi

Wrapper tabel berbasis `@tanstack/react-table` dengan fitur search, export, pagination, dan column visibility.

#### Contoh Kolom

```tsx
const columns: ColumnDef<Vendor>[] = [
  { accessorKey: "nama", header: "Nama Vendor" },
  { accessorKey: "kategori", header: "Kategori" },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <ActionButtons
        onView={() => handleView(row.original)}
        onEdit={() => handleEdit(row.original)}
        onDelete={() => handleDelete(row.original)}
      />
    ),
  },
];
```

#### Use Case

* Tabel utama semua module CRUD

---

### 🧠 7. `Modal.tsx` + `useModal.ts`

**Path:**

* `src/components/ui/modal.tsx`
* `src/hooks/useModal.ts`

#### Fungsi

Reusable modal hook dan container untuk form (Add/Edit) dengan kontrol open/close sederhana.

#### Contoh Pemakaian

```tsx
const { isOpen, openModal, closeModal } = useModal();

<Button onClick={openModal}>Tambah Data</Button>

<Modal isOpen={isOpen} onClose={closeModal} size="2xl" title="Tambah Data">
  <FormComponent />
</Modal>
```

#### Use Case

* Form input (Add/Edit) di semua module CRUD

---

## 🧭 Rangkuman Template yang Sudah Digunakan

| Komponen                     | Fungsi                         | Folder                         |
| ---------------------------- | ------------------------------ | ------------------------------ |
| **StatsCard**                | Tampilan statistik (summary)   | `components/common/`           |
| **ActionButtons**            | Tombol aksi (view/edit/delete) | `components/common/`           |
| **ToastProvider + useToast** | Sistem notifikasi global       | `components/common/`, `hooks/` |
| **ConfirmModal**             | Modal konfirmasi aksi          | `components/ui/`               |
| **DetailsModal**             | Modal detail data              | `components/common/`           |
| **Modal + useModal**         | Popup form (Add/Edit)          | `components/ui/`, `hooks/`     |
| **DataTable**                | Tampilan tabel CRUD utama      | `components/common/`           |

---

## 🧭 Implementasi di Module Lain

1. **Copy struktur `DokumenArsip.tsx`** ke module baru (misal: `Vendor.tsx`, `Audit.tsx`)
2. Ganti:

   * Endpoint API (`/api/vendor`, `/api/audit`, dll)
   * Field form dan kolom tabel
3. Gunakan komponen template di atas untuk menjaga konsistensi
4. Gunakan `useToast()` untuk semua aksi async
5. Gunakan `StatsCard` di header setiap module