import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAuth } from "../lib/auth";
import { User, LogOut, Shield } from "lucide-react";

export default function UserAvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  const handleAdminDashboard = () => {
    setIsOpen(false);
    router.push("/admin");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="User menu"
      >
        {user?.profileImage ? (
          <div className="w-8 h-8 relative rounded-full overflow-hidden">
            <Image
              src={user.profileImage}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={handleViewProfile}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <User size={16} className="mr-2 text-indigo-500" />
              View Profile
            </button>

            {user?.role === "admin" && (
              <button
                onClick={handleAdminDashboard}
                className="flex items-center w-full px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <Shield size={16} className="mr-2" />
                Admin Dashboard
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
