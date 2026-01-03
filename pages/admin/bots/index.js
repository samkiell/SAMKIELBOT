import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import {
  Play,
  Square,
  RefreshCw,
  Trash2,
  Search,
  Activity,
  ShieldAlert,
  LayoutGrid,
  Zap,
  MoreVertical,
  PauseCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BotControl() {
  const { token } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (token) fetchBots();
  }, [token]);

  const fetchBots = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBots(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch bots");
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = useMemo(() => {
    return bots.filter((bot) => {
      const query = searchQuery.toLowerCase();
      return (
        bot.botName?.toLowerCase().includes(query) ||
        bot.user?.email?.toLowerCase().includes(query) ||
        bot.identifier?.toLowerCase().includes(query)
      );
    });
  }, [bots, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: bots.length,
      online: bots.filter((b) =>
        ["running", "online", "active", "connected"].includes(b.status)
      ).length,
      issues: bots.filter((b) =>
        ["error", "failed", "suspended"].includes(b.status)
      ).length,
    };
  }, [bots]);

  const handlePower = async (id, signal) => {
    setActionLoading(id);
    const idToast = toast.loading(`Sending ${signal} signal...`);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${id}/power`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ signal }),
        }
      );
      if (!res.ok) throw new Error("Action failed");

      toast.success(`Signal ${signal} sent!`, { id: idToast });
      fetchBots();
    } catch (err) {
      toast.error(err.message || "Failed", { id: idToast });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    const action = currentStatus === "suspended" ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this bot?`))
      return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${id}/suspend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      toast.success(`Bot ${action}ed successfully`);
      fetchBots();
    } catch (err) {
      toast.error("Suspension toggle failed");
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "WARNING: This will FORCE DELETE the bot and server data. This cannot be undone."
      )
    )
      return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Bot purged from system");
      fetchBots();
    } catch (err) {
      toast.error("Purge failed");
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "running":
      case "online":
      case "active":
      case "connected":
        return {
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-500",
        };
      case "starting":
      case "installing":
      case "paired":
        return {
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          dot: "bg-amber-500",
        };
      case "awaiting_pairing":
      case "pending":
        return {
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          dot: "bg-indigo-500",
        };
      case "suspended":
      case "expired":
      case "error":
      case "failed":
        return {
          color: "text-red-500 bg-red-500/10 border-red-500/20",
          dot: "bg-red-500",
        };
      default:
        return {
          color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
          dot: "bg-gray-500",
        };
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Bot Orchestration | SAMKIEL ADMIN</title>
      </Head>

      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Bot Orchestration
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Real-time control over all platform deployments.
            </p>
          </div>

          <Link
            href="/deploy"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/30 font-bold hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            New Deployment
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="TOTAL BOTS"
            value={stats.total}
            icon={LayoutGrid}
            color="indigo"
          />
          <StatCard
            title="HEARTBEATS ACTIVE"
            value={stats.online}
            icon={Activity}
            color="emerald"
            isPulse
          />
          <StatCard
            title="ATTENTION REQUIRED"
            value={stats.issues}
            icon={ShieldAlert}
            color="red"
          />
        </div>

        {/* Search & Filter */}
        <div className="relative mb-8">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by bot name, owner email, or server ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-[28px] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg font-medium transition-all"
          />
        </div>

        {/* Bot List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredBots.map((bot) => {
              const config = getStatusConfig(bot.status);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={bot._id}
                  className="group bg-white dark:bg-[#111827] p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col xl:flex-row items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="relative">
                      <div
                        className={`w-3 h-3 rounded-full ${config.dot} shadow-[0_0_12px_rgba(0,0,0,0.2)]`}
                      />
                      {["running", "online"].includes(bot.status) && (
                        <motion.div
                          animate={{
                            scale: [1, 1.6, 1],
                            opacity: [0.6, 0, 0.6],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`absolute inset-0 rounded-full ${config.dot}`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <Link
                          href={`/admin/bots/${bot._id}`}
                          className="text-xl font-black text-gray-900 dark:text-white hover:text-indigo-600 transition-colors truncate tracking-tight"
                        >
                          {bot.botName}
                        </Link>
                        <div
                          className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-black border ${config.color} tracking-widest`}
                        >
                          {bot.status?.replace("_", " ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <span className="text-indigo-500/80">
                          {bot.user?.email || "System"}
                        </span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {bot.identifier || "NO_ID"}
                        </span>
                        <span className="opacity-30">•</span>
                        <span>
                          {new Date(
                            bot.deployedAt || bot.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-4 xl:pt-0 border-gray-100 dark:border-gray-800">
                    <div className="flex bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl gap-1">
                      <ActionButton
                        icon={Play}
                        color="text-emerald-500"
                        bg="hover:bg-emerald-500/10"
                        onClick={() => handlePower(bot._id, "start")}
                        loading={actionLoading === bot._id}
                        title="Power On"
                      />
                      <ActionButton
                        icon={RefreshCw}
                        color="text-blue-500"
                        bg="hover:bg-blue-500/10"
                        onClick={() => handlePower(bot._id, "restart")}
                        loading={actionLoading === bot._id}
                        title="Restart Instance"
                      />
                      <ActionButton
                        icon={Square}
                        color="text-gray-500"
                        bg="hover:bg-gray-500/10"
                        onClick={() => handlePower(bot._id, "stop")}
                        loading={actionLoading === bot._id}
                        title="Shutdown"
                      />
                    </div>

                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-2 hidden xl:block" />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSuspend(bot._id, bot.status)}
                        className="p-3 text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-all"
                        title="Toggle Suspension"
                      >
                        <PauseCircle size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(bot._id)}
                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        title="Emergency Purge"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!loading && filteredBots.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800"
            >
              <Search className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-xl font-bold text-gray-400">
                No deployments match your search.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-indigo-500 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, isPulse }) {
  const colors = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    red: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon size={24} className={isPulse ? "animate-pulse" : ""} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, color, bg, onClick, loading, title }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`p-2.5 ${color} ${bg} rounded-xl transition-all active:scale-90 disabled:opacity-30`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}
