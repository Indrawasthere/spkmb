// src/pages/BPKP/components/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import Badge from "../../../components/ui/badge/Badge";
import { ActionButtons } from "../../../components/common/ActionButtons";

interface TemuanBPKP {
  id: string;
  nomorTemuan: string;
  paketId: string | null;
  jenisTemuan: string;
  deskripsi: string;
  tingkatKualitasTemuan: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  status: "BARU" | "PROSES" | "SELESAI" | "DITUNDA";
  tanggal: string;
  auditor: string;
  pic: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
  paket?: {
    kodePaket: string;
    namaPaket: string;
    status: string;
  };
  dokumen?: Array<{
    id: string;
    namaDokumen: string;
    filePath: string;
    uploadedAt: string;
  }>;
}

const getKualitasTemuanColor = (kualitas: TemuanBPKP["tingkatKualitasTemuan"]) => {
  switch (kualitas) {
    case "KRITIS":
      return "error";
    case "TINGGI":
      return "warning";
    case "SEDANG":
      return "info";
    case "RENDAH":
      return "success";
    default:
      return "light";
  }
};

const getStatusColor = (status: TemuanBPKP["status"]) => {
  switch (status) {
    case "SELESAI":
      return "success";
    case "PROSES":
      return "warning";
    case "BARU":
      return "info";
    case "DITUNDA":
      return "error";
    default:
      return "light";
  }
};

export const createColumns = (
  onView: (temuan: TemuanBPKP) => void,
  onEdit: (temuan: TemuanBPKP) => void,
  onDelete: (id: string) => void,
  canDelete: boolean = true
): ColumnDef<TemuanBPKP>[] => [
  {
    accessorKey: "nomorTemuan",
    header: "No. Temuan",
    cell: ({ row }) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.original.nomorTemuan}
      </span>
    ),
  },
  {
    accessorKey: "paket",
    header: "Paket",
    cell: ({ row }) => (
      <div className="text-sm text-gray-700 dark:text-gray-400">
        {row.original.paket ? (
          <div>
            <p className="font-medium">{row.original.paket.kodePaket}</p>
            <p className="text-xs text-gray-500">{row.original.paket.namaPaket}</p>
          </div>
        ) : (
          <Badge size="sm" color="light">
            Tidak terkait
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "jenisTemuan",
    header: "Jenis",
  },
  {
    accessorKey: "deskripsi",
    header: "Deskripsi",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate block">
        {row.original.deskripsi}
      </span>
    ),
  },
  {
    accessorKey: "tingkatKualitasTemuan",
    header: "Kualitas Temuan",
    cell: ({ row }) => (
      <Badge size="sm" color={getKualitasTemuanColor(row.original.tingkatKualitasTemuan)}>
        {row.original.tingkatKualitasTemuan}
      </Badge>
    ),
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
    accessorKey: "auditor",
    header: "Auditor",
  },
  {
    accessorKey: "pic",
    header: "PIC",
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

export type { TemuanBPKP };