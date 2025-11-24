import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Badge from "../components/ui/badge/Badge";
import { PlusIcon, UserIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import { DataTable } from "../components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ActionButtons } from "../components/common/ActionButtons";
import { DetailsModal } from "../components/common/DetailsModal";
import { useToast } from "../hooks/useToast";

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

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: User["role"] | "";
  isActive: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
}

export default function PengaturanAkses() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const { isOpen, openModal, closeModal } = useModal();
  const { success, error, info, loading: toastLoading } = useToast();

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
        error("Gagal memuat data pengguna");
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error("Terjadi kesalahan saat memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Nama depan wajib diisi";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Nama belakang wajib diisi";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = "Password wajib diisi";
    }
    if (!formData.role) {
      newErrors.role = "Role wajib dipilih";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    toastLoading(editingUser ? "Memperbarui pengguna..." : "Membuat pengguna...");

    try {
      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include password for new users
      if (!editingUser) {
        payload.password = formData.password;
      }

      let response;
      if (editingUser) {
        response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:3001/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        await fetchUsers();
        closeModal();
        resetForm();
        setEditingUser(null);
        success(editingUser ? "Pengguna berhasil diperbarui!" : "Pengguna berhasil dibuat!");
      } else {
        const errorData = await response.json();
        error(`Gagal menyimpan: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to save user:', err);
      error("Terjadi kesalahan saat menyimpan pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Don't pre-fill password for security
      role: user.role,
      isActive: user.isActive,
    });
    openModal();
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setViewDetailsOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    setIsSubmitting(true);
    toastLoading("Menghapus pengguna...");

    try {
      const response = await fetch(`http://localhost:3001/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchUsers();
        success("Pengguna berhasil dihapus!");
      } else {
        const errorData = await response.json();
        error(`Gagal menghapus: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      error("Terjadi kesalahan saat menghapus pengguna");
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setDeletingUser(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    toastLoading("Mengubah status pengguna...");

    try {
      const response = await fetch(`http://localhost:3001/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          isActive: !user.isActive
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        success(`Status berhasil diubah menjadi ${updatedUser.isActive ? 'Aktif' : 'Nonaktif'}`);
      } else {
        error("Gagal mengubah status pengguna");
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      error("Terjadi kesalahan saat mengubah status");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      isActive: true,
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  // Filter users based on search query and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && user.isActive) ||
      (statusFilter === "INACTIVE" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  // Define table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "firstName",
      header: "Nama",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {`${row.original.firstName} ${row.original.lastName}`}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge size="sm" color={getRoleColor(row.original.role)}>
          {getRoleDisplayName(row.original.role)}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          size="sm" 
          color={getStatusColor(row.original.isActive)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleToggleStatus(row.original)}
        >
          {row.original.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => 
        row.original.lastLogin 
          ? new Date(row.original.lastLogin).toLocaleDateString('id-ID') 
          : "-",
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => 
        new Date(row.original.createdAt).toLocaleDateString('id-ID'),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <ActionButtons
          onView={() => handleViewDetails(row.original)}
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original)}
        />
      ),
    },
  ];

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

  const filterOptions = {
    role: [
      { value: "ALL", label: "Semua Role" },
      { value: "ADMIN", label: "Administrator" },
      { value: "MANAGER", label: "Manager" },
      { value: "AUDITOR", label: "Auditor" },
      { value: "USER", label: "User" },
    ],
    status: [
      { value: "ALL", label: "Semua Status" },
      { value: "ACTIVE", label: "Aktif" },
      { value: "INACTIVE", label: "Nonaktif" },
    ]
  };

  const detailsSections = selectedUser ? [
    {
      title: "Informasi Personal",
      fields: [
        { label: "Nama Lengkap", value: `${selectedUser.firstName} ${selectedUser.lastName}` },
        { label: "Email", value: selectedUser.email },
        { 
          label: "Role", 
          value: (
            <Badge color={getRoleColor(selectedUser.role)}>
              {getRoleDisplayName(selectedUser.role)}
            </Badge>
          ),
        },
        { 
          label: "Status", 
          value: (
            <Badge color={getStatusColor(selectedUser.isActive)}>
              {selectedUser.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
          ),
        },
        { label: "Terakhir Login", value: selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('id-ID') : "Belum pernah login" },
        { label: "Dibuat Pada", value: new Date(selectedUser.createdAt).toLocaleString('id-ID') },
        { label: "Diperbarui Pada", value: new Date(selectedUser.updatedAt).toLocaleString('id-ID') },
      ]
    }
  ] : [];

  return (
    <>
      <PageMeta
        title="SIPAKAT-PBJ - Pengaturan & Hak Akses"
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
            onClick={openAddModal}
            disabled={loading}
          >
            Tambah User
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              type="text"
              placeholder="Cari user berdasarkan nama, email, atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-96"
            />
            <div className="flex gap-2 flex-1 justify-end">
              <select 
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                {filterOptions.role.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select 
                className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {filterOptions.status.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <DataTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            searchPlaceholder="Cari user berdasarkan nama, email, atau role..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            enableExport={true}
            enableColumnVisibility={true}
            pageSize={10}
            fixedHeight="750px"
            fixedWidth="1300px"
            minVisibleRows={10}
          />
        </div>

        {/* Role Matrix */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Matrix Hak Akses
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Modul
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Administrator
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Auditor
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    User
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="2xl"
        title={editingUser ? "Edit User" : "Tambah User Baru"}
        showHeader={true}
      >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            {editingUser ? "Edit User" : "Tambah User Baru"}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama Depan *</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Masukkan nama depan"
                  error={!!formErrors.firstName}
                  hint={formErrors.firstName}
                />
              </div>
              <div>
                <Label>Nama Belakang *</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Masukkan nama belakang"
                  error={!!formErrors.lastName}
                  hint={formErrors.lastName}
                />
              </div>
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@sistem.go.id"
                error={!!formErrors.email}
                hint={formErrors.email}
              />
            </div>

            <div>
              <Label>Password {!editingUser && "*"}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                error={!!formErrors.password}
                hint={formErrors.password}
              />
              {editingUser && (
                <p className="mt-1 text-xs text-warning-600">
                  Kosongkan jika tidak ingin mengubah password
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Role *</Label>
                <Select
                  options={roleOptions}
                  placeholder="Pilih role"
                  onChange={(value) =>
                    setFormData({ ...formData, role: value as User["role"] })
                  }
                  value={formData.role}
                />
                {formErrors.role && (
                  <p className="mt-1 text-xs text-error-500">{formErrors.role}</p>
                )}
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
                  value={formData.isActive.toString()}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Menyimpan..."
                : editingUser
                ? "Update"
                : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${deletingUser?.firstName} ${deletingUser?.lastName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        loading={isSubmitting}
      />

      {/* Details Modal */}
      {selectedUser && (
        <DetailsModal
          isOpen={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          title="Detail User"
          sections={detailsSections}
        />
      )}
    </>
  );
}