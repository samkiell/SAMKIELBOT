import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import AdminLayout from "../../components/AdminLayout";
import {
  Activity,
  Users,
  Server,
  AlertOctagon,
  HardDrive,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Zap,
  Cpu,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

import Skeleton, {
  StatCardSkeleton,
  NodeHealthSkeleton,
} from "../../components/Skeleton";

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      fetchAllData();
    }
  }, [user, token, authLoading]);

  const fetchAllData = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [statsRes, revenueRes, logsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const revenueData = await revenueRes.json();
      const logsData = await logsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (revenueData.success) setRevenue(revenueData.data);
      if (logsData.success) setRecentLogs(logsData.data.slice(0, 10));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTodayRevenue = () => {
    if (!revenue?.summary?.today) return 0;
    return revenue.summary.today.reduce((acc, curr) => acc + curr.total, 0);
  };

  if (loading)
    return (
      <AdminLayout>
        <Head>
          <title>Admin Control Plane - SAMKIEL BOT</title>
        </Head>
        <div className="mb-8 p-4">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="px-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard | SAMKIEL BOT</title>
      </Head>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            System Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time infrastructure and commercial metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className={`p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
              refreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw size={20} />
          </button>
          <Link
            href="/admin/settings"
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 font-bold text-sm tracking-wide hover:bg-indigo-700 transition-colors"
          >
            Manage System
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/admin/users"
          className="block transform transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Registered Users"
            value={stats?.totalUsers || 0}
            trend="+12%"
            trendUp={true}
            icon={Users}
            color="indigo"
          />
        </Link>
        <Link
          href="/admin/bots"
          className="block transform transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Live Deployments"
            value={stats?.runningBots || 0}
            total={stats?.totalBots}
            icon={Server}
            color="green"
          />
        </Link>
        <Link
          href="/admin/revenue"
          className="block transform transition-transform hover:scale-[1.02]"
        >
          <StatCard
            title="Today's Revenue"
            value={`$${getTodayRevenue()}`}
            trend="+8%"
            trendUp={true}
            icon={DollarSign}
            color="amber"
          />
        </Link>
        <StatCard
          title="System Health"
          value={`${100 - (stats?.errorRate || 0)}%`}
          trend={stats?.errorRate > 0 ? `-${stats.errorRate}%` : "Stable"}
          trendUp={stats?.errorRate === 0}
          icon={Activity}
          color={stats?.errorRate > 10 ? "red" : "indigo"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Insights Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bot Distribution & Resource Overview */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Zap size={18} className="text-indigo-500" /> Platform Workload
              </h3>
              <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                  Active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>{" "}
                  Idle
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="relative w-40 h-40 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-100 dark:text-gray-800"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={
                        440 -
                        (440 * (stats?.runningBots || 0)) /
                          (stats?.totalBots || 1)
                      }
                      className="text-indigo-600"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">
                      {Math.round(
                        ((stats?.runningBots || 0) / (stats?.totalBots || 1)) *
                          100
                      )}
                      %
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      Capacity
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-5">
                  <ResourceBar
                    label="Memory Utilization"
                    value={calculateTotalRam(stats?.nodeHealth)}
                    color="bg-indigo-500"
                  />
                  <ResourceBar
                    label="CPU Load Average"
                    value={15}
                    color="bg-emerald-500"
                  />
                  <ResourceBar
                    label="Storage Distribution"
                    value={42}
                    color="bg-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Clock size={18} className="text-indigo-500" /> Governance
                Activity
              </h3>
              <Link
                href="/admin/audit"
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {recentLogs.map((log, i) => (
                <div
                  key={i}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-start gap-4"
                >
                  <div
                    className={`mt-1 p-2 rounded-lg ${
                      log.action.includes("error") ||
                      log.action.includes("failed") ||
                      log.action.includes("delete")
                        ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500"
                    }`}
                  >
                    {log.action.includes("user") ? (
                      <Users size={16} />
                    ) : (
                      <Activity size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold">
                        {log.adminUsername}{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          performed
                        </span>{" "}
                        {log.action.replace("_", " ")}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatDistanceToNow(
                          new Date(log.timestamp || log.createdAt)
                        )}{" "}
                        ago
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                      {JSON.stringify(log.details || {})}
                    </p>
                  </div>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm italic">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls Area */}
        <div className="space-y-8">
          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-600/20 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-xl">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <h3 className="font-bold">Command Center</h3>
            </div>
            <div className="space-y-3">
              <QuickActionButton
                icon={RefreshCw}
                label="Force Status Sync"
                loading={refreshing}
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/sync-status`,
                      {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Bot statuses synced");
                      fetchAllData();
                    }
                  } catch (e) {
                    toast.error("Sync failed");
                  } finally {
                    setRefreshing(false);
                  }
                }}
              />
              <QuickActionButton
                icon={AlertOctagon}
                label="System Diagnostics"
                onClick={() => toast("Running diagnostics...", { icon: "🔍" })}
              />
              <Link href="/admin/suggestions" className="block">
                <QuickActionButton icon={Users} label="Pending Review" accent />
              </Link>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">
                Security Level
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-400"></div>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  Enhanced
                </span>
              </div>
            </div>
          </div>

          {/* Nodes Health List */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database size={18} className="text-indigo-500" />{" "}
                Infrastructure Nodes
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                Live
              </span>
            </h3>
            <div className="space-y-4">
              {stats?.nodeHealth?.map((node, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-indigo-500/30 transition-all cursor-default group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm tracking-tight">
                      {node.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        node.status === "online"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>RAM</span>
                        <span
                          className={node.ramUsage > 85 ? "text-red-500" : ""}
                        >
                          {node.ramUsage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            node.ramUsage > 85 ? "bg-red-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${Math.min(node.ramUsage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                      <Cpu size={14} />
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.nodeHealth || stats.nodeHealth.length === 0) && (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  No nodes reported.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, total, icon: Icon, color, trend, trendUp }) {
  const colors = {
    indigo:
      "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-500/10",
    green:
      "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/10",
    red: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/10",
    amber:
      "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/10",
  };

  const iconColors = {
    indigo: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
    green: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
    red: "bg-red-500 text-white shadow-lg shadow-red-500/30",
    amber: "bg-amber-500 text-white shadow-lg shadow-amber-500/30",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group h-full`}
    >
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-2xl ${iconColors[color]}`}>
            <Icon size={22} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                trendUp
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{" "}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 text-current mb-1 truncate">
            {title}
          </p>
          <p className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
            {value}
            {total !== undefined && (
              <span className="text-sm text-gray-400 font-bold ml-1 tracking-normal">
                / {total}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
        <Icon size={120} />
      </div>
    </div>
  );
}

function ResourceBar({ label, value, color }) {
  return (
    <div className="group cursor-default">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">
          {label}
        </span>
        <span className="text-xs font-black">{Math.min(value, 100)}%</span>
      </div>
      <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
        />
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, accent, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
        accent
          ? "bg-white text-indigo-600 border-white shadow-lg hover:translate-y-[-2px]"
          : "bg-white/5 text-white/90 border-white/5 hover:bg-white/10 hover:border-white/10"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={loading ? "animate-spin" : ""} />
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </div>
      {!accent && <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>}
    </button>
  );
}

function calculateTotalRam(nodes) {
  if (!nodes || nodes.length === 0) return 0;
  const total = nodes.reduce((acc, node) => acc + node.ramUsage, 0);
  return Math.round(total / nodes.length);
}
