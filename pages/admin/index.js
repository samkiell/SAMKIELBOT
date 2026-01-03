import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Zap,
  MoreVertical,
  ShieldAlert,
  ChevronRight,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [infra, setInfra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      fetchStats();
      fetchInfra();

      const socket = io(process.env.NEXT_PUBLIC_API_URL || "");
      socket.on("infra:update", (update) => {
        setInfra(update);
      });

      return () => socket.disconnect();
    }
  }, [user, token, authLoading]);

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfra = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/infrastructure/overview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) setInfra(data.data);
    } catch (err) {}
  };

  const handleSync = async () => {
    const id = toast.loading("Synchronizing nodes and stats...");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bots/sync-stats`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStats();
      toast.success("System sync complete", { id });
    } catch (err) {
      toast.error("Sync failed", { id });
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Zap className="animate-pulse text-indigo-500" size={48} />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Intelligence Center | SAMKIEL ADMIN</title>
      </Head>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            System Intelligence
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Real-time infrastructure and commercial metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-105 transition-transform"
          >
            <RotateCcw size={20} className="text-gray-500" />
          </button>
          <Link
            href="/admin/settings"
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 font-bold hover:bg-indigo-700 transition-colors"
          >
            Manage System
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard
          title="REGISTERED USERS"
          value={stats?.totalUsers || 0}
          trend={stats?.userGrowth || "+0%"}
          icon={Users}
          color="indigo"
        />
        <SummaryCard
          title="LIVE DEPLOYMENTS"
          value={`${stats?.runningBots || 0}`}
          total={stats?.totalBots || 0}
          icon={LayoutGrid}
          color="emerald"
        />
        <SummaryCard
          title="TODAY'S REVENUE"
          value={`₦${stats?.revenueToday || 0}`}
          trend={stats?.revenueGrowth || "+0%"}
          icon={DollarSign}
          color="amber"
        />
        <SummaryCard
          title="SYSTEM HEALTH"
          value="100%"
          trend="STABLE"
          icon={Activity}
          color="indigo"
          isPulse
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
        {/* Workload Section */}
        <div className="xl:col-span-8 bg-white dark:bg-[#111827] rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap size={20} className="text-indigo-500" /> Platform Workload
            </h2>
            <div className="flex items-center gap-4 text-xs font-bold font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> ACTIVE
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-500" /> IDLE
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Capacity Circle */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r="92"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    className="text-gray-100 dark:text-gray-800"
                  />
                  <motion.circle
                    cx="112"
                    cy="112"
                    r="92"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 92}
                    initial={{ strokeDashoffset: 2 * Math.PI * 92 }}
                    animate={{
                      strokeDashoffset:
                        2 *
                        Math.PI *
                        92 *
                        (1 - (infra?.host?.memory?.usedPercent || 0) / 100),
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-indigo-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black">
                    {infra?.host?.memory?.usedPercent || 0}%
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Capacity
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Bars */}
            <div className="space-y-6">
              <UsageBar
                label="MEMORY UTILIZATION"
                value={infra?.host?.memory?.usedPercent || 0}
                color="indigo"
              />
              <UsageBar
                label="CPU LOAD AVERAGE"
                value={infra?.host?.cpu?.usedPercent || 0}
                color="emerald"
              />
              <UsageBar
                label="STORAGE DISTRIBUTION"
                value={infra?.host?.disk?.usedPercent || 0}
                color="amber"
              />
            </div>
          </div>

          {/* Individual Bot Loads - Now UNDER both */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Active Bot Loads
              </p>
            </div>
            <div className="space-y-4">
              {infra?.bots
                ?.sort((a, b) => (b.usedRam || 0) - (a.usedRam || 0))
                ?.slice(0, 5)
                .map((bot) => (
                  <Link
                    key={bot.id}
                    href={`/admin/bots/${bot.id}`}
                    className="flex items-center justify-between p-5 bg-white dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-800/60 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer block"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              bot.state === "running"
                                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                : "bg-gray-400 dark:bg-gray-600 shadow-none"
                            }`}
                          />
                          {bot.state === "running" && (
                            <motion.div
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 rounded-full bg-emerald-500"
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none block mb-1">
                            {bot.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase tracking-widest">
                              OWNER
                            </span>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">
                              {bot.user || "System"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-1">
                            RAM ALLOC
                          </p>
                          <p className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                            {bot.usedRam}
                            <span className="text-xs ml-0.5 opacity-60">
                              MB
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-1">
                            CPU LOAD
                          </p>
                          <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {bot.usedCpu}
                            <span className="text-xs ml-0.5 opacity-60">%</span>
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                          <ChevronRight
                            size={20}
                            className="text-gray-400 dark:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
            {(!infra?.bots || infra.bots.length === 0) && (
              <p className="text-xs text-center text-gray-500 py-4 italic">
                No active deployments detected.
              </p>
            )}
            {infra?.bots?.length > 3 && (
              <Link
                href="/admin/infrastructure"
                className="block text-center text-[10px] font-bold text-indigo-500 hover:underline mt-6 uppercase tracking-widest"
              >
                View all {infra.bots.length} active bots
              </Link>
            )}
          </div>
        </div>

        {/* Command Center Section */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-[32px] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-bold">Command Center</span>
              </div>

              <div className="space-y-3">
                <CommandButton
                  label="Force Status Sync"
                  icon={RotateCcw}
                  onClick={handleSync}
                />
                <CommandButton
                  label="System Diagnostics"
                  icon={AlertOctagon}
                  onClick={() => router.push("/admin/infrastructure")}
                />
                <CommandButton
                  label="Pending Review"
                  icon={Users}
                  isSecondary
                  onClick={() => router.push("/admin/suggestions")}
                />
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold opacity-60 uppercase mb-1">
                    Security Level
                  </p>
                  <p className="font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />{" "}
                    Enhanced
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          </div>

          {/* Infrastructure Nodes Cards */}
          <div className="bg-white dark:bg-[#111827] rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold flex items-center gap-2 tracking-tight">
                <Server size={18} className="text-gray-400" /> Infrastructure
                Nodes
              </h2>
              <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded border border-emerald-500/20">
                LIVE
              </div>
            </div>

            <div className="space-y-4">
              {stats?.nodeHealth?.map((node, i) => (
                <div
                  key={i}
                  className="bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 group hover:border-indigo-500/30 transition-all hover:bg-white dark:hover:bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          node.status === "online"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        } animate-pulse`}
                      />
                      <span className="font-black text-sm tracking-tight uppercase">
                        {node.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      ID: {node.id || "N/A"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          RAM UTILIZATION
                        </span>
                        <span className="text-sm font-black text-indigo-500">
                          {node.ramUsage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${node.ramUsage}%` }}
                          className={`h-full rounded-full ${
                            node.ramUsage > 80
                              ? "bg-red-500"
                              : node.ramUsage > 60
                              ? "bg-amber-500"
                              : "bg-indigo-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div className="text-center border-r border-gray-50 dark:border-gray-800/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                          Total RAM
                        </p>
                        <p className="text-[11px] font-bold">
                          {node.totalRam}MB
                        </p>
                      </div>
                      <div className="text-center border-r border-gray-50 dark:border-gray-800/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                          Allocated
                        </p>
                        <p className="text-[11px] font-bold text-indigo-500">
                          {node.allocatedRam}MB
                        </p>
                      </div>
                      <div className="text-center border-r border-gray-50 dark:border-gray-800/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                          Free RAM
                        </p>
                        <p className="text-[11px] font-bold text-emerald-500">
                          {node.freeRam}MB
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                          CPU Limit
                        </p>
                        <p className="text-[11px] font-bold text-amber-500">
                          {node.totalCpu}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Governance Activity List */}
      <div className="bg-white dark:bg-[#111827] rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <Clock size={20} className="text-indigo-500" /> Governance Activity
          </h2>
          <Link
            href="/admin/audit"
            className="text-xs font-bold text-indigo-500 hover:scale-105 transition-transform"
          >
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {stats?.auditLogs?.map((log, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl hover:translate-x-1 transition-transform border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-xl bg-indigo-500/10 text-indigo-500`}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    <span className="text-indigo-500">admin</span>{" "}
                    <span className="font-medium text-gray-500">performed</span>{" "}
                    {log.action.replace("_", " ")}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 opacity-60">
                    ID:{" "}
                    {log.targetId?.substring(log.targetId.length - 6) ||
                      "SYSTEM"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {formatDistanceToNow(new Date(log.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({
  title,
  value,
  total,
  trend,
  icon: Icon,
  color,
  isPulse,
}) {
  const colorStyles = {
    indigo: "bg-[#6366f1]/10 text-indigo-500 shadow-indigo-500/10",
    emerald: "bg-[#10b981]/10 text-emerald-500 shadow-emerald-500/10",
    amber: "bg-[#f59e0b]/10 text-amber-500 shadow-amber-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-3xl ${colorStyles[color]}`}>
          <Icon size={24} className={isPulse ? "animate-pulse" : ""} />
        </div>
        {trend && (
          <div
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
              trend.includes("+")
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-indigo-500/10 text-indigo-500"
            }`}
          >
            {trend}
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
        {title}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tighter">{value}</span>
        {total && (
          <span className="text-sm font-bold text-gray-400">/{total}</span>
        )}
      </div>
      {/* Background Noise Image/Pattern */}
      <div className="absolute bottom-0 right-0 opacity-[0.03] text-gray-400 pointer-events-none group-hover:scale-110 transition-transform">
        <Icon size={120} />
      </div>
    </motion.div>
  );
}

function UsageBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
        <span>{label}</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">
          {value}%
        </span>
      </div>
      <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-full h-2.5 p-0.5 border border-gray-100 dark:border-gray-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full ${
            color === "indigo"
              ? "bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              : color === "emerald"
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              : "bg-amber-500"
          }`}
        />
      </div>
    </div>
  );
}

function CommandButton({ label, icon: Icon, isSecondary, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${
        isSecondary
          ? "bg-white text-indigo-600 hover:bg-gray-50"
          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
    </button>
  );
}

function Settings2({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}
