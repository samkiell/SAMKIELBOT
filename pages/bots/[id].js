import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import FriendlyTerminal from "../../components/FriendlyTerminal";
import {
  ArrowLeft,
  CheckCircle,
  Loader,
  AlertCircle,
  Play,
  Square,
  RotateCw,
  Trash2,
  Copy,
  CreditCard,
  Clock,
  Terminal,
  Activity,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import io from "socket.io-client";
import Sparkline from "../../components/Sparkline";

let socket;

export default function BotManagementPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth(); // User credits come from here

  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Format currency/credits
  const formatCredits = (val) => `${val} Credits`;

  // Initialize Socket.IO
  useEffect(() => {
    if (!id) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join", id);
    });

    socket.on("bot:status_change", (data) => {
      if (data.deploymentId === id) {
        fetchDeploymentStatus();
      }
    });

    socket.on("bot:log", (data) => {
      if (data.deploymentId === id) {
        setLogs((prev) => [...prev, data.log].slice(-100));
      }
    });

    socket.on("bot:stats", (data) => {
      if (data.deploymentId === id) {
        setDeployment((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status || prev.status,
            usageStats: data.usageStats || prev.usageStats, // Allow real-time stats updates if sent
            resources: {
              ...prev.resources,
              ...data.resources,
            },
          };
        });
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  // Fetch deployment status
  const fetchDeploymentStatus = async () => {
    if (!id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/deploy/${id}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch bot data");

      const result = await response.json();
      setDeployment(result.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching deployment:", err);
      toast.error("Failed to load bot details");
      setLoading(false);
    }
  };

  // Poll for updates (fallback)
  useEffect(() => {
    if (id && user) {
      fetchDeploymentStatus();
      const interval = setInterval(fetchDeploymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [id, user]);

  // Handle Power Actions
  const handlePowerAction = async (signal) => {
    if (!id) return;

    // Credit Check for Restart/Start if Suspended
    if (
      (signal === "start" || signal === "restart") &&
      deployment?.billingStatus === "suspended"
    ) {
      if (user?.credits < 5) {
        toast.error("Insufficient credits to resume bot (Need 5 credits)");
        return;
      }
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/deploy/${id}/power`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signal }),
        }
      );

      if (!response.ok) throw new Error("Failed to perform action");

      toast.success(`Bot ${signal} command sent!`);
      fetchDeploymentStatus();
    } catch (err) {
      console.error("Power action error:", err);
      toast.error(`Failed to ${signal} bot`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!deployment) return null;

  const isSuspended =
    deployment.billingStatus === "suspended" ||
    deployment.status === "suspended";

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-gray-100 pb-20 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Head>
        <title>{deployment.botName} | Samkiel Bot</title>
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 pt-10 max-w-7xl relative z-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-[#161b2c]/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-50" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {deployment.botName}
                  </h1>
                  <StatusBadge
                    status={deployment.status}
                    billingStatus={deployment.billingStatus}
                  />
                </div>
                <p className="text-gray-400 font-medium flex items-center gap-2">
                  <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono">
                    {deployment.botNumber}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-indigo-400/80 tracking-wide uppercase text-xs font-bold">
                    {deployment.configuration?.packName}
                  </span>
                </p>
              </div>

              <div
                className={`flex flex-col items-end ${
                  isSuspended ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {deployment.status !== "starting" &&
                  formatUptime(
                    deployment.uptimeStart,
                    deployment.status,
                    deployment.resources
                  ) !== "Starting..." && (
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-inner">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">
                          Live Uptime
                        </span>
                        <span className="font-mono font-bold text-white leading-none">
                          {formatUptime(
                            deployment.uptimeStart,
                            deployment.status,
                            deployment.resources
                          )}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Resource Usage Graphs */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-white/10 group/card">
                <Sparkline
                  label="CPU Usage"
                  data={
                    deployment.usageStats?.cpuInfos?.length > 1
                      ? deployment.usageStats.cpuInfos
                      : [0, 0]
                  }
                  color="indigo"
                />
              </div>
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-white/10 group/card">
                <Sparkline
                  label="RAM Usage"
                  data={
                    deployment.usageStats?.ramInfos?.length > 1
                      ? deployment.usageStats.ramInfos
                      : [0, 0]
                  }
                  color="emerald"
                />
              </div>
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl transition-all duration-300 hover:bg-white/10 hover:border-white/10 group/card">
                <Sparkline
                  label="Recent Activity"
                  data={
                    deployment.usageStats?.activityInfos?.length > 1
                      ? deployment.usageStats.activityInfos
                      : [0, 0]
                  }
                  color="orange"
                />
              </div>
            </div>

            {/* Controls Toolbar */}
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => handlePowerAction("start")}
                disabled={
                  actionLoading ||
                  ["active", "connected", "online"].includes(deployment.status)
                }
                className="group flex items-center px-8 py-3 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 hover:border-green-500 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-green-500/5 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Play size={20} className="mr-2 fill-current" />{" "}
                <span>Start Bot</span>
              </button>
              <button
                onClick={() => handlePowerAction("stop")}
                disabled={actionLoading || deployment.status === "stopped"}
                className="group flex items-center px-8 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-red-500/5 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Square size={20} className="mr-2 fill-current" />{" "}
                <span>Stop Bot</span>
              </button>
              <button
                onClick={() => handlePowerAction("restart")}
                disabled={actionLoading}
                className="group flex items-center px-8 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-500 rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/5 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <RotateCw size={20} className="mr-2" /> <span>Restart</span>
              </button>
            </div>

            {isSuspended && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-700 dark:text-red-400">
                    Bot Suspended due to Insufficient Credits
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    Your bot cannot run because you have less than 5 credits.
                    Please top up your wallet to resume.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Billing Snapshot Card */}
          <div className="bg-[#161b2c]/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div>
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <CreditCard className="text-indigo-400" size={20} />
                </div>
                Billing Summary
              </h2>
              <div className="space-y-5">
                <BillingItem
                  label="Daily Consumption"
                  value={formatCredits(deployment.dailyBurn || 5)}
                />
                <BillingItem
                  label="Cumulative Usage"
                  value={formatCredits(deployment.totalCreditsSpent || 50)}
                />
                <BillingItem
                  label="Next Billing Cycle"
                  value={new Date(
                    deployment.nextRenewalAt || Date.now()
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  sub={getRelativeTime(deployment.nextRenewalAt)}
                />
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Account Balance
              </p>
              <div className="text-4xl font-black text-white">
                {formatCredits(user?.credits || 0)}
              </div>
              <p className="text-xs text-indigo-400 mt-2 font-medium">
                Auto-renew active
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            label="System Overview"
            icon={<Activity size={16} />}
          />
          <TabButton
            active={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
            label="Live Console"
            icon={<Terminal size={16} />}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Deployment Details */}
            <div className="bg-[#161b2c]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-indigo-400">
                <Activity size={20} /> Deployment Specification
              </h3>
              <div className="grid gap-4">
                <DetailRow
                  label="Deployment Date"
                  icon={<Clock size={16} />}
                  value={new Date(
                    deployment.deployedAt || deployment.createdAt || Date.now()
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <DetailRow
                  label="Pterodactyl ID"
                  icon={<Terminal size={16} />}
                  value={`#${deployment.identifier}`}
                />
                <DetailRow
                  label="Assigned Node"
                  icon={<ShieldAlert size={16} />}
                  value={`Cluster-Node-${deployment.nodeId || "01"}`}
                />
                <DetailRow
                  label="Resource Quota"
                  icon={<Activity size={16} />}
                  value={`${deployment.resources?.cpuLimit}% CPU / ${deployment.resources?.ramLimit}MB RAM`}
                />
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-[#161b2c]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-xl transition-all duration-500 hover:border-indigo-500/20">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-emerald-400">
                <CheckCircle size={20} /> Bot Connectivity
              </h3>
              {deployment.pairingCode &&
              !["online", "active", "connected"].includes(deployment.status) ? (
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/30" />
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-3">
                    Awaiting External Link
                  </p>
                  <div className="text-4xl font-mono font-black tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                    {deployment.pairingCode}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                    Enter this code in your WhatsApp linked devices section
                    <br />
                    to establish an encrypted session.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5">
                  <div
                    className={`p-4 rounded-2xl shadow-lg transition-all duration-1000 ${
                      ["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">
                      {["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "Tunnel Established"
                        : "Synchronizing..."}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "Securely bridged via Baileys API"
                        : "Waiting for handshake response"}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-3 font-mono">
                      LATENCY SYNC:{" "}
                      {new Date(deployment.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-gray-900 rounded-2xl p-1 shadow-lg border border-gray-700">
            <FriendlyTerminal
              logs={logs}
              status={deployment.status}
              onCommand={(command) => {
                if (socket) {
                  socket.emit("terminal:command", {
                    deploymentId: id,
                    command,
                  });
                  toast.success("Command sent to bot terminal");
                }
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status, billingStatus }) {
  if (billingStatus === "suspended") {
    return (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/10">
        Suspended
      </span>
    );
  }

  const map = {
    online:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10",
    active:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10",
    degraded:
      "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/10",
    error:
      "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-rose-500/10",
    installing:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10",
    starting:
      "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/10",
    stopped: "bg-white/5 text-gray-400 border border-white/10 shadow-black/10",
    offline: "bg-white/5 text-gray-400 border border-white/10 shadow-black/10",
  };

  const currentStyle = map[status] || map["offline"];

  return (
    <span
      className={`${currentStyle} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}
    >
      {["online", "active", "connected"].includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {status}
    </span>
  );
}

function BillingItem({ label, value, sub }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
      <div className="text-right">
        <span className="font-medium block">{value}</span>
        {sub && <span className="text-xs text-gray-400 block">{sub}</span>}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex justify-between items-center group/row">
      <span className="text-gray-500 text-sm flex items-center gap-2 group-hover/row:text-gray-300 transition-colors">
        {icon} {label}
      </span>
      <span className="font-bold text-gray-200">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-2.5 px-6 rounded-xl transition-all duration-300 ${
        active
          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="font-bold text-xs uppercase tracking-widest">
        {label}
      </span>
    </button>
  );
}

function formatUptime(startTime, status, resources) {
  if (status === "offline" || status === "stopped") return "Offline";

  // Use uptimeMs from resources as first-class fallback
  if (resources?.uptimeMs > 0) {
    const mins = Math.floor(resources.uptimeMs / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  }

  if (!startTime) return "Starting...";
  const diff = Date.now() - new Date(startTime).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}

function getRelativeTime(date) {
  if (!date) return "";
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `in ${hours} hours`;
}
