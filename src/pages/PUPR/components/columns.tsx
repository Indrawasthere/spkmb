// src/pages/PUPR/components/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import Badge from "../../../components/ui/badge/Badge";
import { ActionButtons } from "../../../components/common/ActionButtons";

interface ProyekPUPR {
  id: string;
  namaProyek: string;
  lokasi: string;
  anggaran: number;
  kontraktor: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "PERENCANAAN" | "PELAKSANAAN" | "SELESAI" | "DITUNDA";
  progress: number;
  deskripsiCatatan?: string;
  dokumenCatatan?: string;
  createdAt: string;
  updatedAt: string;
  dokumen?: Array<{
    id: string;
    namaDokumen: string;
    filePath: string;
    uploadedAt: string;
  }>;
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

const getStatusColor = (status: ProyekPUPR["status"]) => {
  switch (status) {
    case "SELESAI":
      return "success";
    case "PELAKSANAAN":
      return "warning";
    case "PERENCANAAN":
      return "info";
    case "DITUNDA":
      return "error";
    default:
      return "light";
  }
};

export const createColumns = (
  onView: (proyek: ProyekPUPR) => void,
  onEdit: (proyek: ProyekPUPR) => void,
  onDelete: (id: string) => void,
  canDelete: boolean = true
): ColumnDef<ProyekPUPR>[] => [
  {
    accessorKey: "namaProyek",
    header: "Nama Proyek",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-800 dark:text-white/90">
          {row.original.namaProyek}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(row.original.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
          {new Date(row.original.tanggalSelesai).toLocaleDateString("id-ID")}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "lokasi",
    header: "Lokasi",
  },
  {
    accessorKey: "anggaran",
    header: "Anggaran",
    cell: ({ row }) => (
      <span className="font-medium text-green-600 dark:text-green-400">
        {formatCurrency(row.original.anggaran)}
      </span>
    ),
  },
  {
    accessorKey: "kontraktor",
    header: "Kontraktor",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge size="sm" color={getStatusColor(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${row.original.progress}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-400">
          {row.original.progress}%
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <ActionButtons
        onView={() => onView(row.original)}
        onEdit={() => onEdit(row.original)}
        onDelete={() => onDelete(row.original.id)}
        canDelete={canDelete}
      />
    ),
  },
];

export type { ProyekPUPR };