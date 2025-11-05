import { useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Settings, Help, Logout } from "@mui/icons-material";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleSignOut() {
    logout();
    navigate("/signin");
  }

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-red-600';
      case 'MANAGER':
        return 'text-blue-600';
      case 'AUDITOR':
        return 'text-green-600';
      case 'USER':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 ring-2 ring-gray-200 dark:ring-gray-700">
          <img
            src="./images/user/owner.jpg"
            alt="User"
            className="w-full h-full object-cover"
          />
        </span>

        <span className="block mr-2 font-medium text-theme-sm truncate max-w-[120px]">
          {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
        </span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[300px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="./images/user/owner.jpg"
              alt="User"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
            />
            <div className="flex-1 min-w-0">
              <span className="block font-semibold text-gray-800 text-theme-sm dark:text-white truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </span>
              <span className={`text-xs font-medium ${getRoleColor(user?.role || '')} uppercase tracking-wide`}>
                {getRoleDisplayName(user?.role || '')}
              </span>
            </div>
          </div>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.email || 'Loading...'}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/account-settings"
              className="flex items-center gap-3 px-3 py-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 transition-colors"
            >
              <div className="flex items-center justify-center w-5 h-5">
                <Settings sx={{ fontSize: 20, color: '#6b7280' }} className="group-hover:!text-blue-600" />
              </div>
              <span>Account Settings</span>
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/bantuan-panduan"
              className="flex items-center gap-3 px-3 py-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 transition-colors"
            >
              <div className="flex items-center justify-center w-5 h-5">
                <Help sx={{ fontSize: 20, color: '#6b7280' }} className="group-hover:!text-blue-600" />
              </div>
              <span>Bantuan & Panduan</span>
            </DropdownItem>
          </li>
        </ul>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 w-full font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <Logout sx={{ fontSize: 20, color: '#6b7280' }} className="group-hover:!text-red-600" />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
