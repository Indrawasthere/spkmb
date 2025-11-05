import { useState, useEffect } from "react";
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
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "USER" | "AUDITOR" | "MANAGER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export default function PengaturanAkses() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "" as User["role"] | "",
    isActive: true,
  });

  const { isOpen, openModal, closeModal } = useModal();

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([newUser, ...users]);
        closeModal();
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "",
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return "error";
      case "MANAGER":
        return "warning";
      case "AUDITOR":
        return "info";
      case "USER":
        return "light";
      default:
        return "light";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "error";
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'USER':
        return 'User';
      case 'AUDITOR':
        return 'Auditor';
      case 'MANAGER':
        return 'Manager';
      default:
        return role;
    }
  };

  const roleOptions = [
    { value: "ADMIN", label: "Administrator" },
    { value: "MANAGER", label: "Manager" },
    { value: "AUDITOR", label: "Auditor" },
    { value: "USER", label: "User" },
  ];

  const statusOptions = [
    { value: "true", label: "Aktif" },
    { value: "false", label: "Nonaktif" },
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
                        {`${user.firstName} ${user.lastName}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getRoleColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm" color={getStatusColor(user.isActive)}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
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
      <Modal isOpen={isOpen} onClose={closeModal} size="2xl"
              showHeader={true}>
        <div className="p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Tambah User
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Depan</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Masukkan nama depan"
                />
              </div>
              <div>
                <Label>Nama Belakang</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Masukkan nama belakang"
                />
              </div>
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

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Masukkan password"
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
                      isActive: value === "true",
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
