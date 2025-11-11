import {
  HomeIcon,
  FolderIcon,
  SwatchIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  DocumentCurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  PresentationChartLineIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

export const adminMenu = [
  {
    name: "Dashboard",
    path: "/",
    icon: HomeIcon,
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
    name: "Vendor / Penyedia",
    path: "#",
    icon: UsersIcon,
    subItems: [
      {
        name: "Konsultan Perencanaan",
        path: "/vendor-penyedia/konsultan-perencanaan",
        icon: BriefcaseIcon,
      },
      {
        name: "Konsultan Pengawas",
        path: "/vendor-penyedia/konsultan-pengawas",
        icon: PresentationChartLineIcon,
      },
      {
        name: "Konstruksi",
        path: "/vendor-penyedia/konstruksi",
        icon: BuildingLibraryIcon,
      },
    ],
  },
  {
    name: "Kompetensi PPK",
    path: "/kompetensi-ppk",
    icon: AcademicCapIcon,
  },
  {
    name: "Monitoring & Evaluasi",
    path: "/monitoring-evaluasi",
    icon: ChartBarIcon,
  },
  {
    name: "Pengaturan",
    path: "/pengaturan-akses",
    icon: CogIcon,
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
