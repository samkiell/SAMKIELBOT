import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/auth";
import { useTheme } from "../context/ThemeContext";
import { Menu, X, Sun, Moon, Monitor, Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import UserAvatarDropdown from "./UserAvatarDropdown";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled
          ? "bg-white/70 dark:bg-gray-900/70 shadow-sm border-gray-200 dark:border-gray-700"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center space-x-3"
        >
          <Image
            src="/SAMKIELBOT-LOGO.png"
            alt="SAMKIEL BOT Logo"
            width={40}
            height={40}
            className="-mt-1"
          />
          <span className="text-gray-800 dark:text-gray-100 text-xl font-bold">
            𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center justify-between px-4 py-2">
          <div className="flex gap-8 items-center text-gray-800 dark:text-gray-100">
            <Link
              href={user ? "/dashboard" : "/"}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  href="/bots"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Community Bots
                </Link>
                <Link
                  href="/credits/claim"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Rewards
                </Link>
                <Link
                  href="/suggest"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Suggest
                </Link>
                <Link
                  href="/referrals"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Referrals
                </Link>
              </>
            )}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && <NotificationDropdown />}

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const next =
                  theme === "light"
                    ? "dark"
                    : theme === "dark"
                    ? "system"
                    : "light";
                toggleTheme(next);
              }}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Sun
                  size={20}
                  className="text-yellow-500 transition-colors duration-300"
                />
              ) : theme === "dark" ? (
                <Moon
                  size={20}
                  className="text-blue-400 transition-colors duration-300"
                />
              ) : (
                <Monitor
                  size={20}
                  className="text-gray-500 transition-colors duration-300"
                />
              )}
            </button>

            {/* User Avatar */}
            {user && <UserAvatarDropdown user={user} />}
          </div>
        </div>

        {/* Mobile Header: Notification + Theme Toggle + Profile + Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Notifications */}
          {user && <NotificationDropdown />}

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={() => {
              const next =
                theme === "light"
                  ? "dark"
                  : theme === "dark"
                  ? "system"
                  : "light";
              toggleTheme(next);
            }}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Sun
                size={20}
                className="text-yellow-500 transition-colors duration-300"
              />
            ) : theme === "dark" ? (
              <Moon
                size={20}
                className="text-blue-400 transition-colors duration-300"
              />
            ) : (
              <Monitor
                size={20}
                className="text-gray-500 transition-colors duration-300"
              />
            )}
          </button>

          {/* Mobile Profile Avatar */}
          {user && <UserAvatarDropdown user={user} />}

          {/* Mobile Menu Button */}
          <button
            className="text-gray-800 dark:text-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-over Menu */}
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header to align X */}
          <div className="flex justify-end mb-8">
            <button
              className="text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={() => setMenuOpen(false)}
            >
              <X size={28} />
            </button>
          </div>

          {/* Links */}
          <div className="space-y-6 text-lg">
            <Link
              href={user ? "/dashboard" : "/"}
              onClick={() => setMenuOpen(false)}
              className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  href="/bots"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Community Bots
                </Link>
                <Link
                  href="/credits/claim"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Rewards
                </Link>
                <Link
                  href="/suggest"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Suggest
                </Link>
                <Link
                  href="/referrals"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Referrals
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block font-medium text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block font-medium text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
