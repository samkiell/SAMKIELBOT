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

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    socket = io(socketUrl);

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
        setDeployment((prev) => ({
          ...prev,
          status: data.status || prev.status,
          resources: {
            ...prev.resources,
            ...data.resources,
          },
        }));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-20">
      <Head>
        <title>{deployment.botName} - Management</title>
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 pt-8 max-w-7xl">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  {deployment.botName}
                  <StatusBadge
                    status={deployment.status}
                    billingStatus={deployment.billingStatus}
                  />
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {deployment.botNumber} • {deployment.configuration?.packName}
                </p>
              </div>
              <div
                className={`flex flex-col items-end ${
                  isSuspended ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Activity size={16} className="text-green-500" />
                  <span className="font-mono font-medium">
                    Uptime:{" "}
                    {formatUptime(
                      deployment.uptimeStart,
                      deployment.status,
                      deployment.resources
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Toolbar */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => handlePowerAction("start")}
                disabled={
                  actionLoading ||
                  ["active", "connected", "online"].includes(deployment.status)
                }
                className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={18} className="mr-2" /> Start
              </button>
              <button
                onClick={() => handlePowerAction("stop")}
                disabled={actionLoading || deployment.status === "stopped"}
                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square size={18} className="mr-2" /> Stop
              </button>
              <button
                onClick={() => handlePowerAction("restart")}
                disabled={actionLoading}
                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw size={18} className="mr-2" /> Restart
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-indigo-500" /> Billing
              </h2>
              <div className="space-y-4">
                <BillingItem
                  label="Daily Cost"
                  value={formatCredits(deployment.dailyBurn || 5)}
                />
                <BillingItem
                  label="Total Spent"
                  value={formatCredits(deployment.totalCreditsSpent || 50)}
                />
                <BillingItem
                  label="Next Renewal"
                  value={new Date(
                    deployment.nextRenewalAt || Date.now()
                  ).toLocaleDateString()}
                  sub={getRelativeTime(deployment.nextRenewalAt)}
                />
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 mb-2">Wallet Balance</p>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCredits(user?.credits || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="flex space-x-8">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Overview"
              icon={<Activity size={18} />}
            />
            <TabButton
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
              label="Live Logs"
              icon={<Terminal size={18} />}
            />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Deployment Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4">Deployment Details</h3>
              <div className="space-y-3">
                <DetailRow
                  label="Created"
                  value={new Date(
                    deployment.deployedAt || deployment.createdAt || Date.now()
                  ).toLocaleDateString()}
                />
                <DetailRow
                  label="Pterodactyl ID"
                  value={`#${deployment.identifier}`}
                />
                <DetailRow
                  label="Node"
                  value={`Node-${deployment.nodeId || "1"}`}
                />
                <DetailRow
                  label="Resources"
                  value={`${deployment.resources?.cpuLimit}% CPU / ${deployment.resources?.ramLimit}MB RAM`}
                />
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4">WhatsApp Connection</h3>
              {deployment.pairingCode &&
              !["online", "active", "connected"].includes(deployment.status) ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center">
                  <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-2">
                    Pairing Code
                  </p>
                  <div className="text-2xl font-mono font-bold tracking-widest text-indigo-700 dark:text-indigo-400">
                    {deployment.pairingCode}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      ["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "Connected via Baileys"
                        : "Waiting for connection..."}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Last update:{" "}
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
            <FriendlyTerminal logs={logs} status={deployment.status} />
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status, billingStatus }) {
  if (billingStatus === "suspended") {
    return (
      <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
        Suspended
      </span>
    );
  }

  const map = {
    online:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    degraded:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    installing:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    starting:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    stopped: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    offline: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={`${
        map[status] || map["offline"]
      } px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
    >
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

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors ${
        active
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
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
