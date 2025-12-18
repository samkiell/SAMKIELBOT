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
    className={`flex items-center gap-4 px-6 py-5 rounded-3xl transition-all duration-300 group ${
      active
        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 font-bold"
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

      {/* Premium Mobile Slide-over Menu */}
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all duration-500 ease-in-out ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[85%] max-w-[400px] bg-white dark:bg-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[110] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-gray-200 dark:border-slate-800 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
          {/* Drawer Header */}
          <div className="p-8 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Image
                src="/SAMKIELBOT-LOGO.png"
                alt="Logo"
                width={32}
                height={32}
              />
              <span className="font-bold tracking-tight text-gray-900 dark:text-gray-100">
                NAVIGATION
              </span>
            </div>
            <button
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-100 dark:bg-slate-800 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <MobileNavLink
              href={user ? "/dashboard" : "/"}
              icon={Monitor}
              label="Home"
              onClick={() => setMenuOpen(false)}
              active={
                router.pathname === "/dashboard" || router.pathname === "/"
              }
            />

            {user ? (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
                    My Workspace
                  </p>
                  <MobileNavLink
                    href="/dashboard"
                    icon={LayoutDashboard}
                    label="Dashboard"
                    onClick={() => setMenuOpen(false)}
                    active={router.pathname === "/dashboard"}
                  />
                  <MobileNavLink
                    href="/bots"
                    icon={Server}
                    label="Community Bots"
                    onClick={() => setMenuOpen(false)}
                    active={router.pathname === "/bots"}
                  />
                </div>

                <div className="pt-4 pb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
                    Credits & Rewards
                  </p>
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
                </div>

                <div className="pt-4 pb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
                    Support
                  </p>
                  <MobileNavLink
                    href="/suggest"
                    icon={MenuIcon}
                    label="Submit Suggestion"
                    onClick={() => setMenuOpen(false)}
                    active={router.pathname === "/suggest"}
                  />
                </div>

                {user.role === "admin" && (
                  <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <MobileNavLink
                      href="/admin"
                      icon={Shield}
                      label="Admin Control Panel"
                      onClick={() => setMenuOpen(false)}
                      active={false}
                      variant="admin"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="pt-8 space-y-4">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0">
                {user?.username?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base tracking-tight truncate text-gray-900 dark:text-gray-100 uppercase">
                  {user?.username || "Guest"}
                </p>
                <p className="text-xs font-medium text-gray-500 truncate lowercase">
                  {user?.email || "samkiel.dev"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
