import { useState, useEffect } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import {
  Server,
  Cpu,
  Database,
  HardDrive,
  Activity,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  Settings2,
  Zap,
  ChevronRight,
  ShieldAlert,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import toast from "react-hot-toast";

export default function InfrastructureControlPlane() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [socket, setSocket] = useState(null);

  // ... rest of the code ...

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/infrastructure/refresh`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
        toast.success("Host data synchronized");
      }
    } catch (err) {
      toast.error("Manual sync failed");
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch initial state
  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchData();
      const s = io(process.env.NEXT_PUBLIC_API_URL || "");

      s.on("connect", () => console.log("[Socket] Connected to Infra stream"));
      s.on("infra:update", (update) => {
        setData(update);
        setLastUpdate(new Date());
      });

      setSocket(s);
      return () => s.disconnect();
    }
  }, [token, user]);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/infrastructure/overview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      toast.error("Failed to sync infrastructure data");
    } finally {
      setLoading(false);
    }
  };

  const handleThrottle = async (botId, currentRam, currentCpu, currentDisk) => {
    const newRam = prompt("Enter new RAM limit (MB):", currentRam);
    if (newRam === null) return;

    const newCpu = prompt("Enter new CPU limit (%):", currentCpu || 100);
    if (newCpu === null) return;

    const newDisk = prompt("Enter new Disk limit (MB):", currentDisk || 1024);
    if (newDisk === null) return;

    setRefreshing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${botId}/throttle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memory: parseInt(newRam),
            cpu: parseInt(newCpu),
            disk: parseInt(newDisk),
          }),
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success("Resource limits updated");
        fetchData(); // Refresh data to show new limits
      } else {
        toast.error(resData.message || "Failed to update resources");
      }
    } catch (err) {
      toast.error("Failed to update resources");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap size={48} className="text-indigo-500" />
          </motion.div>
        </div>
      </AdminLayout>
    );

  const host = data?.host;
  const prediction = data?.prediction;

  const formatUptime = (minutes) => {
    if (!minutes) return "0m";
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = minutes % 60;
    return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${m}m`;
  };

  return (
    <AdminLayout>
      <Head>
        <title>Platform Workload | SAMKIEL BOT</title>
      </Head>

      <div className="min-h-screen bg-[#0a0f18] text-gray-100 p-4 md:p-8 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Zap className="text-indigo-400 fill-indigo-400/20" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
                Platform Workload
              </h1>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest mt-1">
                NODE: {data?.name || "CONNECTING..."} • ID: {data?.dropletId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-gray-300">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <span>Idle</span>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-gray-400 hover:text-white"
            >
              <RefreshCcw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Top Grid: Circular Capacity & Linear Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
          {/* Circular Capacity */}
          <div className="flex justify-center relative py-10">
            <CircularProgress value={host?.memory.usedPercent || 0} />
          </div>

          {/* Linear Stats */}
          <div className="space-y-10 max-w-md mx-auto w-full">
            <StatBar
              label="Memory Utilization"
              value={host?.memory.usedPercent || 0}
              displayValue={`${host?.memory.usedPercent || 0}%`}
              color="indigo"
            />
            <StatBar
              label="CPU Load Average"
              value={host?.cpu.usedPercent || 0}
              displayValue={`${host?.cpu.usedPercent || 0}%`}
              color="gray"
            />
            <StatBar
              label="Storage Distribution"
              value={host?.disk.usedPercent || 0}
              displayValue={`${host?.disk.usedPercent || 0}%`}
              color="amber"
            />
          </div>
        </div>

        {/* Bot List Section */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 border-b border-gray-800 pb-2 w-full">
              Active Bot Loads
            </h2>
          </div>

          <div className="space-y-3">
            {data?.bots?.slice(0, 5).map((bot) => (
              <BotLoadCard key={bot.id} bot={bot} />
            ))}
          </div>

          {data?.bots?.length > 5 && (
            <div className="mt-8 text-center">
              <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                View all {data.bots.length} bots
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function CircularProgress({ value }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-64 h-64 scale-110 md:scale-125">
      {/* Background Circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="128"
          cy="128"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center Text */}
      <div className="absolute text-center">
        <div className="text-6xl font-black text-white leading-none">
          {Math.round(value)}
          <span className="text-2xl opacity-40">%</span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-2">
          Capacity
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-3xl -z-10" />
    </div>
  );
}

function StatBar({ label, value, displayValue, color }) {
  const colors = {
    indigo: "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]",
    amber: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    gray: "bg-gray-700",
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          {label}
        </span>
        <span className="text-sm font-black text-white italic">
          {displayValue}
        </span>
      </div>
      <div className="h-2 bg-gray-900/50 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full rounded-full ${colors[color] || colors.indigo}`}
        />
      </div>
    </div>
  );
}

function BotLoadCard({ bot }) {
  const isRunning = bot.state === "running";
  return (
    <div className="bg-[#111827]/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all hover:translate-x-1">
      <div className="flex items-center gap-4">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              : "bg-gray-600"
          }`}
        />
        <span className="text-sm font-bold text-gray-200 tracking-tight uppercase">
          {bot.name}
        </span>
      </div>
      <div className="flex gap-8">
        <div className="text-right">
          <div className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">
            RAM
          </div>
          <div className="text-xs font-black text-white italic">
            {bot.usedRam}MB
          </div>
        </div>
        <div className="text-right min-w-[40px]">
          <div className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">
            CPU
          </div>
          <div className="text-xs font-black text-white italic">
            {bot.usedCpu}%
          </div>
        </div>
      </div>
    </div>
  );
}
