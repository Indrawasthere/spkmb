// src/pages/PPKData/components/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../../../components/common/ActionButtons";

interface PPKData {
  id: string;
  paketId: string;
  namaPPK: string;
  noSertifikasi: string;
  jumlahAnggaran: number;
  lamaProyek: number;
  realisasiTermin1?: number;
  realisasiTermin2?: number;
  realisasiTermin3?: number;
  realisasiTermin4?: number;
  PHO?: string;
  FHO?: string;
  createdAt: string;
  updatedAt: string;
  paket: {
    kodePaket: string;
    namaPaket: string;
  };
}

const formatCurrency = (value: number): string =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

export const createColumns = (
  onView: (ppkData: PPKData) => void,
  onEdit: (ppkData: PPKData) => void,
  onDelete: (id: string) => void,
  canDelete: boolean = true
): ColumnDef<PPKData>[] => [
  {
    accessorKey: "namaPPK",
    header: "Nama PPK",
    cell: ({ row }) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {row.original.namaPPK}
      </span>
    ),
  },
  {
    accessorKey: "paket.kodePaket",
    header: "Kode Paket",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.paket?.kodePaket || "-"}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {row.original.paket?.namaPaket || "-"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "noSertifikasi",
    header: "No. Sertifikasi",
  },
  {
    accessorKey: "jumlahAnggaran",
    header: "Jumlah Anggaran",
    cell: ({ row }) => (
      <span className="font-medium text-green-600 dark:text-green-400">
        {formatCurrency(row.original.jumlahAnggaran)}
      </span>
    ),
  },
  {
    accessorKey: "lamaProyek",
    header: "Lama Proyek",
    cell: ({ row }) => `${row.original.lamaProyek} hari`,
  },
  {
    id: "realisasi",
    header: "Realisasi Termin",
    cell: ({ row }) => {
      const termin = [
        row.original.realisasiTermin1,
        row.original.realisasiTermin2,
        row.original.realisasiTermin3,
        row.original.realisasiTermin4,
      ];
      const completed = termin.filter(Boolean).length;
      const percentage = (completed / 4) * 100;
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {completed}/4
          </span>
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
        canDelete={canDelete}
      />
    ),
  },
];

export type { PPKData };