import {
  HomeIcon,
  DocumentIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";


export const userMenu = [
  {
    name: "Dashboard",
    path: "/",
    icon: HomeIcon,
  },
  {
    name: "Dokumen & Arsip",
    path: "/dokumen-arsip",
    icon: DocumentIcon,
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