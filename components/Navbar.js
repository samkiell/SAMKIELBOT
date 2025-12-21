import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../lib/auth";
import { useTheme } from "../context/ThemeContext";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Bell,
  LayoutDashboard,
  Users,
  Server,
  Gift,
  TrendingUp,
  Shield,
  Menu as MenuIcon,
  User,
  LogOut,
} from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import UserAvatarDropdown from "./UserAvatarDropdown";
import { useRouter } from "next/router";

const MobileNavLink = ({
  href,
  icon: Icon,
  label,
  onClick,
  active,
  variant = "default",
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
      active
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
        : variant === "admin"
        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-white"
    }`}
  >
    <Icon
      size={20}
      className={
        active ? "text-white" : "group-hover:scale-110 transition-transform"
      }
    />
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </Link>
);

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isVerified = user && (user.isEmailVerified || user.isPhoneVerified);

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
          href={isVerified ? "/dashboard" : "/"}
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
            {isVerified && (
              <>
                <Link
                  href="/bots"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Community Bots
                </Link>
                <Link
                  href="/suggest"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Suggest
                </Link>
                <Link
                  href="/credits/claim"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Rewards
                </Link>
                <Link
                  href="/credits/buy"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Buy Credits
                </Link>
                <Link
                  href="/referrals"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Referrals
                </Link>
              </>
            )}
            {isVerified ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Dashboard
                </Link>
                {user?.role === "admin" && (
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
            {isVerified && <NotificationDropdown />}

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
            {isVerified && <UserAvatarDropdown user={user} />}
          </div>
        </div>

        {/* Mobile Header: Notification + Theme Toggle + Profile + Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Notifications */}
          {isVerified && <NotificationDropdown />}

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
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-blue-400" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="text-gray-800 dark:text-gray-100 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Backdrop for closing menu on click-outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[90] md:hidden bg-black/5 dark:bg-black/20"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Popover (Anchored to right, half-width) */}
      <div
        className={`md:hidden absolute top-[calc(100%-8px)] right-4 w-[280px] max-w-[calc(100vw-32px)] overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-gray-100 dark:border-slate-800 z-[100] ${
          menuOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
        } origin-top-right`}
      >
        <div className="p-4 space-y-1">
          {isVerified && (
            <div className="pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-2xl">
                <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shrink-0">
                  {user?.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || "S"
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left text-sm">
                  <p className="font-bold truncate text-gray-900 dark:text-gray-100">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isVerified ? (
            <>
              <MobileNavLink
                href="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/dashboard"}
              />
              <MobileNavLink
                href="/profile"
                icon={User}
                label="My Profile"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/profile"}
              />
              <MobileNavLink
                href="/bots"
                icon={Server}
                label="Community Bots"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/bots"}
              />
              <MobileNavLink
                href="/credits/claim"
                icon={Gift}
                label="Daily Rewards"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/credits/claim"}
              />
              <MobileNavLink
                href="/credits/buy"
                icon={TrendingUp}
                label="Buy Credits"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/credits/buy"}
              />
              <MobileNavLink
                href="/referrals"
                icon={Users}
                label="Refer Friends"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/referrals"}
              />
              <MobileNavLink
                href="/suggest"
                icon={MenuIcon}
                label="Submit Suggestion"
                onClick={() => setMenuOpen(false)}
                active={router.pathname === "/suggest"}
              />
              {user?.role === "admin" && (
                <MobileNavLink
                  href="/admin"
                  icon={Shield}
                  label="Admin Control Panel"
                  onClick={() => setMenuOpen(false)}
                  active={false}
                  variant="admin"
                />
              )}

              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold text-sm"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center py-3.5 rounded-2xl bg-gray-100 dark:bg-slate-800 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
