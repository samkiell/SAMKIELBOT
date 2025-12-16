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
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Governance", icon: Users },
    { href: "/admin/bots", label: "Bot Control", icon: Server },
    { href: "/admin/nodes", label: "Infrastructure", icon: HardDrive },
    { href: "/admin/audit", label: "Audit Logs", icon: Shield },
    { href: "/admin/settings", label: "System Policy", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/admin" && router.pathname === "/admin") return true;
    if (path !== "/admin" && router.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed z-40 top-4 left-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="text-indigo-600" size={32} />
            <h1 className="text-xl font-bold font-mono">ADMIN PANEL</h1>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(link.href)
                  ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                PROD ENVIRONMENT
              </p>
              <p className="text-[10px] text-red-500/80">
                Actions are irreversible.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen pt-16 md:pt-0">
        <div className="p-6 md:p-8 animate-fadeIn">{children}</div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
