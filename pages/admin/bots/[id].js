import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../../lib/auth";
import AdminLayout from "../../../components/AdminLayout";
import FriendlyTerminal from "../../../components/FriendlyTerminal";
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
  User,
  Clock3,
} from "lucide-react";
import toast from "react-hot-toast";
import io from "socket.io-client";
import Sparkline from "../../../components/Sparkline";

let socket;

export default function AdminBotDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: admin, loading: authLoading, token } = useAuth();

  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Initialize Socket.IO
  useEffect(() => {
    if (!id || !token) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
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
            usageStats: data.usageStats || prev.usageStats,
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
  }, [id, token]);

  const fetchDeploymentStatus = async () => {
    if (!id || !token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deploy/${id}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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

  // Update current time every second for real-time uptime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (id && token) {
      fetchDeploymentStatus();
      const interval = setInterval(fetchDeploymentStatus, 15000); // 15s poll for admin
      return () => clearInterval(interval);
    }
  }, [id, token]);

  const handlePowerAction = async (signal) => {
    if (!id || !token) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deploy/${id}/power`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signal }),
        },
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

  const handleBillDiscrepancy = async (amount) => {
    if (!token || !deployment.user?._id) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${deployment._id}/bill-arrears`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to bill user");

      toast.success(`Successfully billed user ${amount} credits!`);
      fetchDeploymentStatus();
    } catch (err) {
      console.error("Billing error:", err);
      toast.error("Failed to bill user for discrepancy");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader className="animate-spin text-indigo-500" size={40} />
        </div>
      </AdminLayout>
    );
  }

  if (!deployment) return <AdminLayout>Bot not found</AdminLayout>;

  const formatCredits = (val) => `${val} Credits`;
  const isSuspended = deployment.status === "suspended";

  return (
    <AdminLayout>
      <Head>
        <title>Manage {deployment.botName} | Admin Control</title>
      </Head>

      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/bots"
          className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Bot Control
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
          <User size={16} />
          <span className="text-sm font-bold">
            Owner:{" "}
            {deployment.user?.fullName ||
              deployment.user?.username ||
              "Unknown"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {deployment.botName}
                </h1>
                <StatusBadge status={deployment.status} />
              </div>
              <p className="text-gray-400 font-medium flex items-center gap-2">
                <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs font-mono">
                  {deployment.botNumber}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-indigo-400 tracking-wide uppercase text-xs font-bold font-mono">
                  ID: {deployment._id}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end">
              <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    deployment.isActive
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">
                    Uptime
                  </span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white leading-none text-sm">
                    {formatUptime(
                      deployment.uptimeStart,
                      deployment.status,
                      deployment.resources,
                      deployment.lastHeartbeatAt,
                      currentTime,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Usage Graphs */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
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
            <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
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
            <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
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

          {/* Power Controls */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => handlePowerAction("start")}
              disabled={
                actionLoading ||
                ["active", "connected", "online"].includes(deployment.status)
              }
              className="flex items-center px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Play size={18} className="mr-2" /> Start
            </button>
            <button
              onClick={() => handlePowerAction("stop")}
              disabled={actionLoading || deployment.status === "stopped"}
              className="flex items-center px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <Square size={18} className="mr-2" /> Stop
            </button>
            <button
              onClick={() => handlePowerAction("restart")}
              disabled={actionLoading}
              className="flex items-center px-6 py-2.5 bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              <RotateCw size={18} className="mr-2" /> Restart
            </button>
          </div>
        </div>

        {/* Ownership & Billing Card */}
        <div className="bg-white dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="text-indigo-400" size={20} />
              Owner Details
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                <p className="font-bold">
                  {deployment.user?.fullName || "N/A"}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {deployment.user?.email}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Owner Balance</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {deployment.user?.credits || 0}
                  </span>
                  <span className="text-xs font-bold text-gray-400 mb-1">
                    CREDITS
                  </span>
                </div>
              </div>
              <div className="space-y-3 px-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Daily Burn</span>
                  <span className="font-bold">
                    {deployment.dailyBurn || 5} Credits
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-bold">
                    {deployment.totalCreditsSpent || 0} Credits
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next Renewal</span>
                  <span className="font-bold text-xs">
                    {new Date(deployment.nextRenewalAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Billing Correction Block */}
                {(() => {
                  const runningDays = getRunningDays(deployment.deployedAt);
                  const expectedCredits =
                    runningDays * (deployment.dailyBurn || 5) +
                    (deployment.creationCost || 50);
                  const actualCredits = deployment.totalCreditsSpent || 50;
                  const discrepancy = expectedCredits - actualCredits;

                  if (discrepancy > 5) {
                    return (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3 text-red-500">
                          <AlertCircle size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Under-billed Detection
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                          This bot has been running for{" "}
                          <span className="text-white font-bold">
                            {runningDays} days
                          </span>{" "}
                          but has only consumed{" "}
                          <span className="text-white font-bold">
                            {actualCredits} credits
                          </span>
                          . Expected: {expectedCredits}.
                        </p>
                        <button
                          onClick={() => handleBillDiscrepancy(discrepancy)}
                          disabled={actionLoading}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard size={14} />
                          Bill Arrears ({discrepancy} Credits)
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href={`/admin/users/${deployment.user?._id}`}
              className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
            >
              View User Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "overview"
              ? "bg-indigo-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "logs"
              ? "bg-indigo-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Logs
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800/40 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
            <h3 className="font-bold mb-4">Infrastructure Info</h3>
            <div className="space-y-3">
              <DetailRow
                label="Pterodactyl UUID"
                value={deployment.pterodactylUuid || "N/A"}
              />
              <DetailRow
                label="Identifier"
                value={deployment.identifier || "N/A"}
              />
              <DetailRow
                label="Internal Node"
                value={deployment.nodeId || "1"}
              />
              <DetailRow
                label="Allocation ID"
                value={deployment.allocationId || "N/A"}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800/40 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
            <h3 className="font-bold mb-4">Configuration</h3>
            <div className="space-y-3">
              <DetailRow label="Bot Display Name" value={deployment.botName} />
              <DetailRow label="WhatsApp Number" value={deployment.botNumber} />
              <DetailRow
                label="Memory Limit"
                value={`${deployment.resources?.ramLimit}MB`}
              />
              <DetailRow
                label="CPU Limit"
                value={`${deployment.resources?.cpuLimit}%`}
              />
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                <DetailRow
                  label="Command Prefix"
                  value={deployment.configuration?.prefix || "."}
                  isCode
                />
                <DetailRow
                  label="Pack Name"
                  value={deployment.configuration?.packName || "Default"}
                />
                <DetailRow
                  label="Owner Watermark"
                  value={deployment.configuration?.ownerName || "N/A"}
                />
              </div>

              {deployment.configuration?.featureToggles &&
                Object.keys(deployment.configuration.featureToggles).length >
                  0 && (
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Enabled Features
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(deployment.configuration.featureToggles)
                        .filter(
                          ([_, value]) => value === true || value === "true",
                        )
                        .map(([key]) => (
                          <span
                            key={key}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded capitalize border border-indigo-100 dark:border-indigo-500/20"
                          >
                            {key.replace(/_/g, " ").toLowerCase()}
                          </span>
                        ))}
                      {Object.entries(
                        deployment.configuration.featureToggles,
                      ).filter(
                        ([_, value]) => value === true || value === "true",
                      ).length === 0 && (
                        <span className="text-xs text-gray-400 italic">
                          No specific features enabled
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-1 shadow-lg border border-gray-700">
          <FriendlyTerminal
            logs={logs}
            status={deployment.status}
            onCommand={(command) => {
              if (socket) {
                socket.emit("terminal:command", { deploymentId: id, command });
                toast.success("Command sent to bot terminal");
              }
            }}
          />
        </div>
      )}
    </AdminLayout>
  );
}

function StatusBadge({ status }) {
  const map = {
    online: "bg-green-100 text-green-700 border-green-200",
    active: "bg-green-100 text-green-700 border-green-200",
    connected: "bg-green-100 text-green-700 border-green-200",
    starting: "bg-yellow-100 text-yellow-700 border-yellow-200",
    installing: "bg-blue-100 text-blue-700 border-blue-200",
    stopped: "bg-gray-100 text-gray-700 border-gray-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    suspended: "bg-orange-100 text-orange-700 border-orange-200",
  };
  const style = map[status] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${style}`}
    >
      {status}
    </span>
  );
}

function DetailRow({ label, value, isCode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-mono text-gray-700 dark:text-gray-300 ${
          isCode
            ? "bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatUptime(
  startTime,
  status,
  resources,
  lastHeartbeatAt,
  currentTime,
) {
  if (status === "offline" || status === "stopped") return "Offline";

  let uptimeMs = resources?.uptimeMs || 0;

  // Use lastUptimeUpdate (updated every 60s) or fallback to lastHeartbeatAt
  const lastUpdate = resources?.lastUptimeUpdate
    ? new Date(resources.lastUptimeUpdate).getTime()
    : lastHeartbeatAt
      ? new Date(lastHeartbeatAt).getTime()
      : Date.now();

  const elapsedSinceUpdate = currentTime - lastUpdate;

  // Add elapsed time since last update for smooth counting
  if (elapsedSinceUpdate > 0) {
    uptimeMs += elapsedSinceUpdate;
  }

  // Fallback: If Ptero uptime is 0 but we have a start time, use whichever is larger
  if (startTime) {
    const timeSinceStart = currentTime - new Date(startTime).getTime();
    uptimeMs = Math.max(uptimeMs, timeSinceStart);
  }

  if (uptimeMs <= 0) return "Starting...";

  const days = Math.floor(uptimeMs / 86400000);
  const hours = Math.floor((uptimeMs % 86400000) / 3600000);
  const minutes = Math.floor((uptimeMs % 3600000) / 60000);
  const seconds = Math.floor((uptimeMs % 60000) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function getRunningDays(deployedAt) {
  if (!deployedAt) return 0;
  const deployDate = new Date(deployedAt);
  const now = new Date();
  const diffTime = Math.abs(now - deployDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
