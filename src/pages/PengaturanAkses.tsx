import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, UserIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";

interface User {
  id: string;
  nama: string;
  email: string;
  role: "Admin" | "PPK" | "Auditor" | "Viewer";
  status: "Aktif" | "Nonaktif";
  lastLogin: string;
}

// Dummy data users
const initialUsers: User[] = [
  {
    id: "1",
    nama: "Admin Sistem",
    email: "admin@sistem.go.id",
    role: "Admin",
    status: "Aktif",
    lastLogin: "15 Jan 2024, 10:30",
  },
  {
    id: "2",
    nama: "Ahmad PPK",
    email: "ahmad.ppk@sistem.go.id",
    role: "PPK",
    status: "Aktif",
    lastLogin: "14 Jan 2024, 14:20",
  },
  {
    id: "3",
    nama: "Siti Auditor",
    email: "siti.auditor@sistem.go.id",
    role: "Auditor",
    status: "Aktif",
    lastLogin: "13 Jan 2024, 09:15",
  },
  {
    id: "4",
    nama: "Budi Viewer",
    email: "budi.viewer@sistem.go.id",
    role: "Viewer",
    status: "Nonaktif",
    lastLogin: "10 Jan 2024, 16:45",
  },
];

export default function PengaturanAkses() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    role: "" as User["role"] | "",
    status: "" as User["status"] | "",
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handleSubmit = () => {
    const newUser: User = {
      id: Date.now().toString(),
      nama: formData.nama,
      email: formData.email,
      role: formData.role || "Viewer",
      status: formData.status || "Aktif",
      lastLogin: "Belum pernah login",
    };

    setUsers([newUser, ...users]);
    closeModal();
    setFormData({
      nama: "",
      email: "",
      role: "",
      status: "",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "Admin":
        return "error";
      case "PPK":
        return "warning";
      case "Auditor":
        return "info";
      case "Viewer":
        return "light";
      default:
        return "light";
    }
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "Aktif":
        return "success";
      case "Nonaktif":
        return "error";
      default:
        return "light";
    }
  };

  const roleOptions = [
    { value: "Admin", label: "Admin Sistem" },
    { value: "PPK", label: "PPK" },
    { value: "Auditor", label: "Auditor" },
    { value: "Viewer", label: "Viewer" },
  ];

  const statusOptions = [
    { value: "Aktif", label: "Aktif" },
    { value: "Nonaktif", label: "Nonaktif" },
  ];

  return (
    <>
      <PageMeta
        title="Pengaturan & Hak Akses - Sistem Pengawasan"
        description="Kelola pengguna dan hak akses sistem"
      />
      <PageBreadcrumb pageTitle="Pengaturan & Hak Akses" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Manajemen User & Hak Akses
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola pengguna sistem dan matrix permission
            </p>
          </div>
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={openModal}
          >
            Tambah User
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="text"
              placeholder="Cari user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2">
              <select className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option>Semua Role</option>
                <option>Admin</option>
                <option>PPK</option>
                <option>Auditor</option>
                <option>Viewer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        {user.nama}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {user.lastLogin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Matrix */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Matrix Hak Akses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Modul
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    PPK
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Auditor
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Viewer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Dashboard
                  </td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Manajemen Paket
                  </td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">❌</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Pengawasan & Audit
                  </td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">❌</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    Pengaturan & Hak Akses
                  </td>
                  <td className="px-6 py-4 text-center">✅</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Tambah User
          </h3>

          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                type="text"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@sistem.go.id"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select
                  options={roleOptions}
                  placeholder="Pilih role"
                  onChange={(value) =>
                    setFormData({ ...formData, role: value as User["role"] })
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  options={statusOptions}
                  placeholder="Pilih status"
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as User["status"],
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Batal
            </Button>
            <Button size="sm" variant="primary" onClick={handleSubmit}>
              Simpan User
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
