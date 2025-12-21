import { useState, useEffect, useRef } from "react";
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
  HelpCircle,
  Menu as MenuIcon,
  User,
  LogOut,
  BookOpen,
  Activity,
  ChevronDown,
  Terminal,
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

  // Refs for click-outside detection
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const isVerified = user && (user.isEmailVerified || user.isPhoneVerified);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside to close mobile menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled
          ? "bg-white/70 dark:bg-gray-900/70 shadow-sm border-gray-200 dark:border-gray-700"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 md:py-4 flex items-center justify-between">
        <Link
          href={isVerified ? "/dashboard" : "/"}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <Image
              src="/logo.png"
              alt="SAMKIEL BOT Logo"
              width={42}
              height={42}
              className="hover:scale-110 transition-transform duration-300 rounded-xl"
            />
          </div>
          <span className="flex items-center text-lg md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
            𝕊𝔸𝕄𝕂𝕀𝔼𝕃
            <span className="text-indigo-600 dark:text-indigo-400 ml-1">
              𝔹𝕆𝕋
            </span>
          </span>
        </Link>

        {/* Desktop Links */}
        {/* Desktop Links */}
        {/* Desktop Links */}
        <div className="hidden md:flex items-center flex-1 ml-4 text-center">
          <div className="flex-1 flex justify-center">
            <div className="flex gap-6 items-center text-gray-800 dark:text-gray-100">
              {/* Public Links */}
              <Link
                href="/commands"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                Commands
              </Link>
              <Link
                href="/bots"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
              >
                Community Bots
              </Link>

              {isVerified && (
                <>
                  <Link
                    href="/dashboard"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/credits/buy"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                  >
                    Buy Credits
                  </Link>
                  <Link
                    href="/credits/claim"
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                  >
                    Rewards
                  </Link>
                </>
              )}

              {/* More Dropdown */}
              <div className="relative group z-50">
                <button className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium py-2">
                  More
                  <ChevronDown size={16} />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-1 text-left">
                    <Link
                      href="/status"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200"
                    >
                      Status
                    </Link>
                    <Link
                      href="/docs"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200"
                    >
                      Docs
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200"
                    >
                      Support
                    </Link>

                    {isVerified && (
                      <>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                        <Link
                          href="/suggest"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200"
                        >
                          Suggest
                        </Link>
                        <Link
                          href="/referrals"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-700 dark:text-gray-200"
                        >
                          Referrals
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isVerified && (
                <>
                  <Link
                    href="/login"
                    className="ml-4 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all font-bold shadow-lg shadow-indigo-500/20"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4 flex-shrink-0">
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
            ref={buttonRef}
            className="text-gray-800 dark:text-gray-100 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Popover (Anchored to right, half-width) */}
      <div
        ref={menuRef}
        className={`md:hidden absolute top-[calc(100%-8px)] right-4 w-[280px] max-w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto no-scrollbar transition-all duration-300 ease-out bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-gray-100 dark:border-slate-800 z-[100] ${
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

          {isVerified && (
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
            </>
          )}

          {/* Public Mobile Links moved below profile */}
          <MobileNavLink
            href="/commands"
            icon={Terminal}
            label="Bot Commands"
            onClick={() => setMenuOpen(false)}
            active={router.pathname === "/commands"}
          />
          <MobileNavLink
            href="/bots"
            icon={Server}
            label="Community Bots"
            onClick={() => setMenuOpen(false)}
            active={router.pathname === "/bots"}
          />

          {/* More Public Mobile Links */}
          <MobileNavLink
            href="/status"
            icon={Activity}
            label="System Status"
            onClick={() => setMenuOpen(false)}
            active={router.pathname === "/status"}
          />
          <MobileNavLink
            href="/docs"
            icon={BookOpen}
            label="Documentation"
            onClick={() => setMenuOpen(false)}
            active={router.pathname === "/docs"}
          />
          <MobileNavLink
            href="/support"
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => setMenuOpen(false)}
            active={router.pathname === "/support"}
          />

          {/* Admin Link */}
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

          {!isVerified ? (
            <div className="pt-4 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-slate-800 mt-2">
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
          ) : (
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
          )}
        </div>
      </div>
    </nav>
  );
}
