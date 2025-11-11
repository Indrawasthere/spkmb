import {
  HomeIcon,
  FolderIcon,
  DocumentIcon,
  ShieldCheckIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export interface MenuItem {
  name: string;
  path: string;
  icon: any;
  roles: string[]; // Roles yang boleh akses
}

export const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: HomeIcon,
    roles: ["ADMIN", "USER", "AUDITOR", "MANAGER"],
  },
  {
    name: "Manajemen Paket",
    path: "/manajemen-paket",
    icon: FolderIcon,
    roles: ["ADMIN", "MANAGER", "USER"], // PPK bisa akses paketnya sendiri
  },
  {
    name: "Dokumen & Arsip",
    path: "/dokumen-arsip",
    icon: DocumentIcon,
    roles: ["ADMIN", "MANAGER", "USER", "AUDITOR"],
  },
  {
    name: "Pengawasan & Audit",
    path: "#",
    icon: ShieldCheckIcon,
    roles: ["ADMIN", "AUDITOR", "MANAGER"],
    submenu: [
      {
        name: "Itwasda",
        path: "/itwasda",
        icon: ShieldCheckIcon,
        roles: ["ADMIN", "AUDITOR"],
      },
      {
        name: "BPKP",
        path: "/bpkp",
        icon: ExclamationTriangleIcon,
        roles: ["ADMIN", "AUDITOR"],
      },
      {
        name: "PUPR",
        path: "/pupr",
        icon: BuildingOfficeIcon,
        roles: ["ADMIN", "MANAGER", "USER"],
      },
    ],
  },
  {
    name: "Vendor / Penyedia",
    path: "#",
    icon: UsersIcon,
    roles: ["ADMIN", "MANAGER", "USER"],
    submenu: [
      {
        name: "Konsultan Perencanaan",
        path: "/konsultan-perencanaan",
        icon: BriefcaseIcon,
        roles: ["ADMIN", "MANAGER", "USER"],
      },
      {
        name: "Konsultan Pengawas",
        path: "/konsultan-pengawas",
        icon: BriefcaseIcon,
        roles: ["ADMIN", "MANAGER", "USER"],
      },
      {
        name: "Konstruksi",
        path: "/konstruksi",
        icon: BriefcaseIcon,
        roles: ["ADMIN", "MANAGER", "USER"],
      },
    ],
  },
  {
    name: "Kompetensi PPK",
    path: "/kompetensi-ppk",
    icon: AcademicCapIcon,
    roles: ["ADMIN", "MANAGER"], // Biro SDM
  },
  {
    name: "Data PPK",
    path: "/ppk-data",
    icon: DocumentTextIcon,
    roles: ["ADMIN", "MANAGER"], // Keuangan
  },
  {
    name: "Monitoring & Evaluasi",
    path: "/monitoring",
    icon: ChartBarIcon,
    roles: ["ADMIN", "AUDITOR", "MANAGER"],
  },
  {
    name: "Pengaduan Masyarakat",
    path: "/pengaduan",
    icon: ExclamationTriangleIcon,
    roles: ["ADMIN", "AUDITOR", "MANAGER", "USER"],
  },
  {
    name: "Pengaturan",
    path: "/pengaturan",
    icon: CogIcon,
    roles: ["ADMIN"], // Only admin
  },
];

// Helper function to filter menu by user role
export const getMenuByRole = (userRole: string): MenuItem[] => {
  return menuItems
    .filter((item) => item.roles.includes(userRole))
    .map((item) => ({
      ...item,
      submenu: item.submenu?.filter((sub) => sub.roles.includes(userRole)),
    }));
};