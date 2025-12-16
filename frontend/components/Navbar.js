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
      {/* Mobile Dropdown */}
      <div
        className={`md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-3 transition-all duration-300 ${
          menuOpen
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <Link
          href={user ? "/dashboard" : "/"}
          onClick={() => setMenuOpen(false)}
          className="block text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Home
        </Link>
        {user ? (
          <>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Dashboard
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold"
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
              className="block text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
