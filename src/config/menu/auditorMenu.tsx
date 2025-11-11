import {
  HomeIcon,
  FolderIcon,
  SwatchIcon,
  BuildingOffice2Icon,
  DocumentCurrencyDollarIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

export const auditorMenu = [
  {
    icon: HomeIcon,
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Manajemen Paket",
    path: "/manajemen-paket",
    icon: FolderIcon,
  },
  {
    name: "Dokumen & Arsip",
    path: "/dokumen-arsip",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Pengawasan & Audit",
    path: "#",
    icon: SwatchIcon,
    subItems: [
      {
        name: "Itwasda",
        path: "/pengawasan-audit/itwasda",
        icon: ShieldCheckIcon,
      },
      {
        name: "BPKP",
        path: "/pengawasan-audit/bpkp",
        icon: DocumentCurrencyDollarIcon,
      },
      {
        name: "PUPR",
        path: "/pengawasan-audit/pupr",
        icon: BuildingOffice2Icon,
      },
      {
        name: "PPK",
        path: "/pengawasan-audit/ppk",
        icon: DocumentTextIcon,
      },
    ],
  },
  {
    name: "Bantuan & Panduan",
    path: "/bantuan-panduan",
    icon: QuestionMarkCircleIcon,
  },
  {
    name: "Pengaduan Masyarakat",
    path: "/pengaduan",
    icon: ChatBubbleLeftRightIcon,
  },
];
