import Head from "next/head";
import Link from "next/link";
import AdminLayout from "../../components/AdminLayout";
import {
  ExternalLink,
  FileText,
  Layout,
  Shield,
  Users,
  CreditCard,
} from "lucide-react";

export default function AdminRoutes() {
  const routes = [
    { name: "Landing Page", path: "/", icon: Layout, category: "Public" },
    { name: "Login", path: "/login", icon: Shield, category: "Auth" },
    { name: "Register", path: "/register", icon: Shield, category: "Auth" },
    {
      name: "Forgot Password",
      path: "/forgot-password",
      icon: Shield,
      category: "Auth",
    },
    {
      name: "Verify Email/Phone",
      path: "/verify",
      icon: Shield,
      category: "Auth",
    },

    { name: "Dashboard", path: "/dashboard", icon: Layout, category: "User" },
    { name: "Profile", path: "/profile", icon: Users, category: "User" },
    { name: "Referrals", path: "/referrals", icon: Users, category: "User" },
    { name: "Deploy Bot", path: "/deploy", icon: Layout, category: "User" },

    {
      name: "Pricing",
      path: "/pricing",
      icon: CreditCard,
      category: "Finance",
    },
    {
      name: "Buy Credits",
      path: "/credits/buy",
      icon: CreditCard,
      category: "Finance",
    },
    {
      name: "Claim Credits",
      path: "/credits/claim",
      icon: CreditCard,
      category: "Finance",
    },

    {
      name: "Admin Dashboard",
      path: "/admin",
      icon: Shield,
      category: "Admin",
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: Users,
      category: "Admin",
    },
    {
      name: "Bot Orchestration",
      path: "/admin/bots",
      icon: Layout,
      category: "Admin",
    },
    {
      name: "Node Management",
      path: "/admin/nodes",
      icon: Layout,
      category: "Admin",
    },
    {
      name: "Platform Settings",
      path: "/admin/settings",
      icon: Layout,
      category: "Admin",
    },
    {
      name: "Audit Logs",
      path: "/admin/audit",
      icon: FileText,
      category: "Admin",
    },
    {
      name: "Suggestions",
      path: "/admin/suggestions",
      icon: FileText,
      category: "Admin",
    },

    {
      name: "Status Page",
      path: "/status",
      icon: Activity,
      category: "Public",
    },
    {
      name: "Support",
      path: "/support",
      icon: ExternalLink,
      category: "Public",
    },
    {
      name: "Feature Suggestion",
      path: "/suggest",
      icon: FileText,
      category: "Public",
    },
    {
      name: "Privacy Policy",
      path: "/privacy",
      icon: FileText,
      category: "Legal",
    },
    {
      name: "Terms & Conditions",
      path: "/terms",
      icon: FileText,
      category: "Legal",
    },
    {
      name: "WhatsApp Bot Landing",
      path: "/whatsapp-bot",
      icon: Layout,
      category: "Landing",
    },
    {
      name: "Free WhatsApp Bot",
      path: "/free-whatsapp-bot",
      icon: Layout,
      category: "Landing",
    },
    {
      name: "Deploy WhatsApp Bot",
      path: "/deploy-whatsapp-bot",
      icon: Layout,
      category: "Landing",
    },
    {
      name: "View Once Recovery",
      path: "/view-once-whatsapp",
      icon: Layout,
      category: "Landing",
    },
    {
      name: "Documentation",
      path: "/docs",
      icon: FileText,
      category: "Public",
    },
  ];

  // Group routes by category
  const groupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = [];
    }
    acc[route.category].push(route);
    return acc;
  }, {});

  // Icon component wrapper to avoid reference errors if icon is missing
  const IconWrapper = ({ icon: Icon }) => {
    if (!Icon) return <ExternalLink size={18} />;
    return <Icon size={18} />;
  };

  return (
    <AdminLayout>
      <Head>
        <title>Route Map - Admin Panel</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Application Routes</h1>
        <p className="text-gray-500">
          Sitemap of all accessible pages in the application.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
          <div key={category}>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2 border-gray-200 dark:border-gray-700">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryRoutes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                    <IconWrapper icon={route.icon} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {route.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {route.path}
                    </p>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

// Simple Activity icon replacement since it was missing in imports
function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
