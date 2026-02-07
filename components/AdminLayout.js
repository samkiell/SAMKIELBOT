import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Server,
  Activity,
  Shield,
  Settings,
  HardDrive,
  AlertTriangle,
  LogOut,
  Home,
  Menu,
  X,
  Bug,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/infrastructure", label: "Control Plane", icon: Activity },
    { href: "/admin/users", label: "User Governance", icon: Users },
    { href: "/admin/bots", label: "Bot Control", icon: Server },
    { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
    { href: "/admin/server", label: "Servers", icon: HardDrive },
    { href: "/admin/audit", label: "Audit Logs", icon: Shield },
    {
      href: "/admin/notifications",
      label: "Notifications",
      icon: AlertTriangle,
    },
    { href: "/admin/suggestions", label: "Suggestions", icon: Menu },
    { href: "/admin/bugs", label: "Bug Tracking", icon: Bug },
    { href: "/admin/routes", label: "Route Map", icon: Activity },
    { href: "/admin/settings", label: "System Policy", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/admin" && router.pathname === "/admin") return true;
    if (path !== "/admin" && router.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="SAMKIEL Admin Logo"
            className="w-7 h-7 rounded-lg"
          />
          <span className="font-bold tracking-tight text-sm uppercase text-gray-900 dark:text-white">
            Admin Panel
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar / Slider */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#111827] shadow-2xl md:shadow-none transform transition-all duration-300 ease-in-out border-r border-gray-100 dark:border-gray-800 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20" : "md:w-72"} w-72`}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          {/* Sidebar Header */}
          <div
            className={`hidden md:flex p-4 border-b border-gray-100 dark:border-gray-800 items-center transition-all ${isCollapsed ? "flex-col gap-4 py-6" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-3 ${isCollapsed ? "hidden" : "flex"}`}
            >
              <img
                src="/logo.png"
                alt="SAMKIEL Admin Logo"
                className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20"
              />
              <h1 className="text-lg font-bold tracking-tighter text-gray-900 dark:text-white">
                SAMKIEL <span className="text-indigo-600">ADMIN</span>
              </h1>
            </div>

            {isCollapsed && (
              <img
                src="/logo.png"
                alt="SAMKIEL Admin Logo"
                className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-500/20"
              />
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isCollapsed ? "" : ""}`}
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex-1 space-y-1 mt-4">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-white"
                  } ${isCollapsed ? "justify-center px-2" : ""}`}
                  title={isCollapsed ? link.label : ""}
                >
                  <link.icon
                    size={20}
                    className={
                      active
                        ? "text-white"
                        : "group-hover:scale-110 transition-transform"
                    }
                  />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{link.label}</span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 space-y-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-all ${isCollapsed ? "justify-center px-2" : ""}`}
                title={isCollapsed ? "Return to Site" : ""}
              >
                <Home size={18} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">Return to Site</span>
                )}
              </Link>
              <button
                onClick={() => logout()}
                className={`flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all ${isCollapsed ? "justify-center px-2" : ""}`}
                title={isCollapsed ? "Logout" : ""}
              >
                <LogOut size={18} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">Logout</span>
                )}
              </button>
            </div>
          </nav>

          {/* Sidebar Footer */}
          {!isCollapsed && (
            <div className="p-4 mt-auto">
              <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <AlertTriangle className="text-white" size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1">
                    Live Terminal
                  </p>
                  <p className="text-[10px] text-orange-500/80 leading-tight">
                    Proceed with extreme caution. All updates are immediate.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fadeIn scroll-smooth">
          {children}
        </div>
      </main>

      {/* Back-drop Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
