// src/pages/PPKData/components/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import Badge from "../../../components/ui/badge/Badge";
import { ActionButtons } from "../../../components/common/ActionButtons";

export interface PPKDataRow {
  id: string;
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: number;
  lamaProyek: number;
  realisasiTermin1?: number | null;
  realisasiTermin2?: number | null;
  realisasiTermin3?: number | null;
  realisasiTermin4?: number | null;
  PHO?: string | null;
  FHO?: string | null;
  createdAt?: string;
  updatedAt?: string;
  paket?: {
    id?: string;
    kodePaket?: string;
    namaPaket?: string;
  };
  dokumen?: Array<{
    id?: string;
    namaDokumen?: string;
    filePath?: string;
    uploadedAt?: string;
  }>;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

const calcTerminCompleted = (r1?: number | null, r2?: number | null, r3?: number | null, r4?: number | null) =>
  [r1, r2, r3, r4].filter(Boolean).length;

export const createColumns = (
  onView: (row: PPKDataRow) => void,
  onEdit: (row: PPKDataRow) => void,
  onDelete: (id: string) => void
): ColumnDef<PPKDataRow>[] => [
  {
    accessorKey: "namaPPK",
    header: "Nama PPK",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">{row.original.namaPPK}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{row.original.noSertifikasi}</p>
      </div>
    ),
  },
  {
    accessorKey: "paket.kodePaket",
    header: "Kode Paket",
    cell: ({ row }) => row.original.paket?.kodePaket || "-",
  },
  {
    accessorKey: "paket.namaPaket",
    header: "Nama Paket",
    cell: ({ row }) => row.original.paket?.namaPaket || "-",
  },
  {
    accessorKey: "jumlahAnggaran",
    header: "Jumlah Anggaran",
    cell: ({ row }) => (
      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.original.jumlahAnggaran || 0)}</span>
    ),
  },
  {
    accessorKey: "lamaProyek",
    header: "Lama Proyek",
    cell: ({ row }) => `${row.original.lamaProyek ?? "-" } hari`,
  },
  {
    id: "realisasi",
    header: "Realisasi",
    cell: ({ row }) => {
      const completed = calcTerminCompleted(
        row.original.realisasiTermin1,
        row.original.realisasiTermin2,
        row.original.realisasiTermin3,
        row.original.realisasiTermin4
      );
      const percent = (completed / 4) * 100;
      return (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-xs text-gray-600">{completed}/4</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <ActionButtons
        onView={() => onView(row.original)}
        onEdit={() => onEdit(row.original)}
        onDelete={() => onDelete(row.original.id)}
      />
    ),
  },
];

export type { PPKDataRow };
