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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import toast from "react-hot-toast";

export default function InfrastructureControlPlane() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [socket, setSocket] = useState(null);

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

  const handleThrottle = async (botId, currentRam) => {
    const newRam = prompt("Enter new RAM limit (MB):", currentRam);
    if (!newRam || isNaN(newRam)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${botId}/throttle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memory: parseInt(newRam) }),
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success("Resource limit updated");
      }
    } catch (err) {
      toast.error("Failed to update resources");
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

  return (
    <AdminLayout>
      <Head>
        <title>Infra Control Plane | SAMKIEL BOT</title>
      </Head>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Infra Control Plane
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 uppercase tracking-widest">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-green-500"
              />
              Live
            </div>
          </div>
          <p className="text-gray-500 flex items-center gap-2 text-sm">
            <Server size={14} /> {data?.name || "Initializing..."} •{" "}
            {data?.dropletId}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-gray-400">LAST HEARTBEAT</div>
            <div className="text-gray-900 dark:text-gray-100">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-indigo-500"
          >
            <Activity size={18} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Host Usage Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="CPU Usage"
            value={host?.cpu.usedPercent || 0}
            subtitle={`${host?.cpu.cores} vCPUs Reserved`}
            icon={Cpu}
            color="indigo"
          />
          <MetricCard
            title="RAM Usage"
            value={host?.memory.usedPercent || 0}
            subtitle={`${host?.memory.usedMB} / ${host?.memory.totalMB} MB`}
            icon={Database}
            color="emerald"
            breakdown={host?.memory.breakdown}
          />
          <MetricCard
            title="Storage"
            value={host?.disk.usedPercent || 0}
            subtitle={`${host?.disk.usedGB} / ${host?.disk.totalGB} GB`}
            icon={HardDrive}
            color="amber"
          />
        </div>

        {/* Prediction / Capacity Card */}
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`h-full p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
              prediction?.status === "critical"
                ? "bg-red-500 text-white border-red-600"
                : prediction?.status === "warning"
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-indigo-600 text-white border-indigo-700"
            }`}
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-tighter opacity-80">
                    Capacity Intelligence
                  </span>
                  <Zap size={20} className="fill-white/30 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {prediction?.status === "calculating"
                    ? "Learning Patterns..."
                    : prediction?.status === "stable"
                    ? "No Pressure Detected"
                    : prediction?.status === "critical"
                    ? "Exhaustion Imminent"
                    : "Healthy Scaling"}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed capitalize">
                  {prediction?.status === "calculating"
                    ? "Monitoring data drift. Stand by."
                    : prediction?.status === "stable"
                    ? "Current bot load is negligible."
                    : `Upgrade Urgency: ${prediction?.upgradeUrgency}`}
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-white/20">
                {prediction?.predictedHoursToLimit ? (
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm opacity-80 mb-1">
                        Estimated Exhaustion
                      </div>
                      <div className="text-4xl font-black">
                        {prediction.predictedHoursToLimit}
                        <span className="text-lg font-bold ml-1">HRS</span>
                      </div>
                    </div>
                    <TrendingUp size={32} className="opacity-40" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span className="text-sm font-medium">
                      Accumulating 24h history
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Dynamic BG Shape */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>

      {/* Bot Attribution Area */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-indigo-500" />
            Per-Bot Attribution
            <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-400 font-mono">
              {data?.bots?.length || 0} DEPLOYMENTS
            </span>
          </h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4">Bot Identity</th>
                  <th className="px-6 py-4 text-center">Core Status</th>
                  <th className="px-6 py-4">RAM Logic</th>
                  <th className="px-6 py-4">CPU Intensity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.bots?.map((bot) => (
                  <tr
                    key={bot.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {bot.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {bot.user} <ChevronRight size={10} />{" "}
                        {bot.id.substring(bot.id.length - 6)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            bot.state === "running"
                              ? "bg-green-500/10 text-green-600"
                              : bot.state === "offline"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {bot.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                (bot.usedRam / bot.limitRam) * 100,
                                100
                              )}%`,
                            }}
                            className={`h-full rounded-full ${
                              bot.usedRam / bot.limitRam > 0.8
                                ? "bg-red-500"
                                : "bg-indigo-500"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold">
                          {bot.usedRam} MB
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded font-bold">
                        {bot.usedCpu}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleThrottle(bot.id, bot.limitRam)}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 rounded-lg"
                          title="Adjust Limits"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
                          title="Emergency Stop"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.bots || data.bots.length === 0) && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500 font-medium italic"
                    >
                      Infrastructure is currently idle. No bots deployed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, breakdown }) {
  const colors = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            {title}
          </p>
          <div className="text-3xl font-black text-gray-900 dark:text-white flex items-baseline">
            {Math.round(value)}
            <span className="text-base font-bold ml-0.5 opacity-40">%</span>
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="w-full h-3 bg-gray-50 dark:bg-gray-900 rounded-full p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 1 }}
            className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
              value > 85
                ? "bg-red-500"
                : value > 70
                ? "bg-amber-500"
                : color === "indigo"
                ? "bg-indigo-500"
                : color === "emerald"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-gray-400">
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {subtitle}
          </span>
        </div>

        {breakdown && (
          <div className="pt-3 flex gap-2 border-t border-gray-50 dark:border-gray-700">
            <div className="flex-1">
              <div className="text-[10px] text-gray-400 mb-1">BOTS</div>
              <div className="text-sm font-mono font-bold text-emerald-500">
                {breakdown.botsMB}MB
              </div>
            </div>
            <div className="w-px bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="text-[10px] text-gray-400 mb-1">SYSTEM</div>
              <div className="text-sm font-mono font-bold text-indigo-500">
                {breakdown.systemMB}MB
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
