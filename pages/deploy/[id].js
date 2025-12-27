import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
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
  Info,
  Activity,
  Shield,
  Terminal,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import toast from "react-hot-toast";
import io from "socket.io-client";

let socket;

export default function DeploymentSessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("logs"); // Default to logs during deployment
  const tabsRef = useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    if (!id) return;

    // In a unified app, we connect to the current origin
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected to", socketUrl);
      socket.emit("join", id);
    });

    socket.on("bot:status_change", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Status change:", data);
        fetchDeploymentStatus();
      }
    });

    socket.on("bot:log", (data) => {
      if (data.deploymentId === id) {
        setLogs((prev) => [...prev, data.log].slice(-100)); // Keep last 100 logs
      }
    });

    socket.on("bot:pairing_code", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Pairing code received:", data.code);
        setDeployment((prev) => ({
          ...prev,
          status: "awaiting_pairing",
          pairingCode: data.code,
        }));
        setActiveTab("overview");
        setLoading(false);
        toast.success("Pairing code found! 📱");
      }
    });

    socket.on("bot:connected", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Bot connected!");
        fetchDeploymentStatus();
        setActiveTab("overview");
        toast.success("Bot connected successfully! 🚀");
        // Trigger celebration
        triggerConfetti();
      }
    });

    socket.on("bot:active", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Bot is now active!");
        fetchDeploymentStatus();
        setActiveTab("overview");
        // Also trigger if it skips connected status
        triggerConfetti();
      }
    });

    socket.on("bot:stats", (data) => {
      if (data.deploymentId === id) {
        setDeployment((prev) => ({
          ...prev,
          status: data.status || prev.status,
          resources: {
            ...prev?.resources,
            ...data.resources,
          },
        }));
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id]);

  // Auto-scroll to tabs when pairing is ready
  useEffect(() => {
    if (deployment?.status === "awaiting_pairing" && tabsRef.current) {
      setTimeout(() => {
        tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500); // Small delay for tab switch animation
    }
  }, [deployment?.status]);

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

      if (!response.ok) {
        throw new Error("Failed to fetch deployment status");
      }

      const result = await response.json();
      setDeployment(result.data);
      setLoading(false);

      // Auto-switch to overview if finished or pairing and current tab is still logs
      if (
        ["online", "active", "connected", "awaiting_pairing"].includes(
          result.data.status
        ) &&
        activeTab === "logs"
      ) {
        setActiveTab("overview");
      }
    } catch (err) {
      console.error("Error fetching deployment:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const [showCelebration, setShowCelebration] = useState(false);

  const triggerConfetti = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000); // Hide after 5 seconds
  };

  // Handle power actions
  const handlePowerAction = async (signal) => {
    if (!id) return;

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

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      toast.success(`Bot ${signal} command sent!`);
      fetchDeploymentStatus();
    } catch (err) {
      console.error("Power action error:", err);
      toast.error(`Failed to ${signal} bot`);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy pairing code
  const handleCopyCode = () => {
    if (deployment?.pairingCode) {
      navigator.clipboard.writeText(deployment.pairingCode);
      toast.success("Pairing code copied to clipboard! 📋");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this bot? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/deploy/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete bot");
      }

      toast.success("Bot deleted successfully");
      router.push("/dashboard");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete bot");
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      fetchDeploymentStatus();
      // Poll every 5 seconds as fallback
      const interval = setInterval(fetchDeploymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [id, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <Head>
          <title>Deployment Error - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        </Head>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const getStatusDisplay = () => {
    if (!deployment) return null;

    const status = deployment.status;

    switch (status) {
      case "creating":
      case "installing":
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: "Setting Up Your Bot",
          message: "Creating server and installing dependencies...",
          color: "text-blue-600 dark:text-blue-400",
        };

      case "starting":
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: "Starting Bot",
          message: "Initializing WhatsApp connection...",
          color: "text-blue-600 dark:text-blue-400",
        };

      case "awaiting_pairing":
        return {
          icon: <AlertCircle size={48} />,
          title: "Pairing Required",
          message: "Scan the QR code or enter this pairing code in WhatsApp:",
          color: "text-yellow-600 dark:text-yellow-400",
          showPairingCode: true,
        };

      case "paired":
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: "Pairing Successful",
          message: "Establishing connection to WhatsApp...",
          color: "text-blue-600 dark:text-blue-400",
        };

      case "connected":
      case "active":
      case "online": // Handle new ONLINE state
        return {
          icon: <CheckCircle size={48} />,
          title: "Bot is Live! 🚀",
          message: "Your bot is now connected and ready to use.",
          color: "text-green-600 dark:text-green-400",
          success: true,
          showControls: true,
        };

      case "degraded": // Handle DEGRADED state
        return {
          icon: <AlertCircle size={48} />,
          title: "Connection Unstable",
          message: "Bot is running but experiencing connection issues.",
          color: "text-yellow-600 dark:text-yellow-400",
          showControls: true,
        };

      case "offline":
      case "stopped":
        return {
          icon: <AlertCircle size={48} />,
          title: "Bot Offline",
          message: "Your bot is currently stopped.",
          color: "text-gray-600 dark:text-gray-400",
          showControls: true,
        };

      case "error": // Handle Runtime ERROR
        return {
          icon: <AlertCircle size={48} />,
          title: "Runtime Error",
          message:
            deployment.errorMessage || "A fatal error interrupted the bot.",
          color: "text-red-600 dark:text-red-400",
          showControls: true,
        };

      case "failed":
        return {
          icon: <AlertCircle size={48} />,
          title: "Deployment Failed",
          message:
            deployment.errorMessage || "An error occurred during deployment.",
          color: "text-red-600 dark:text-red-400",
        };

      default:
        return {
          icon: <Loader className="animate-spin" size={48} />,
          title: "Processing",
          message: "Please wait...",
          color: "text-blue-600 dark:text-blue-400",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-20">
      <Head>
        <title>Deployment Status - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>
      <Navbar />

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: [
                  "#6366f1",
                  "#a855f7",
                  "#ec4899",
                  "#3b82f6",
                  "#10b981",
                  "#f59e0b",
                ][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                opacity: 0.8,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

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
          {/* Main Status Info */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 flex flex-wrap items-center gap-2 md:gap-3">
                  {deployment.botName}
                  <StatusBadge status={deployment.status} />
                </h1>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                  {deployment.botNumber} •{" "}
                  {deployment.configuration?.packName || "Standard Bot"}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2">
                  <Activity size={14} className="text-green-500" />
                  <span className="font-mono text-sm md:text-base font-medium">
                    {["online", "active", "connected"].includes(
                      deployment.status
                    )
                      ? `Uptime: ${formatUptime(
                          deployment.uptimeStart,
                          deployment.status,
                          deployment.resources
                        )}`
                      : "Session: Live"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-6 flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <div className={`${statusDisplay?.color}`}>
                {statusDisplay?.icon &&
                  React.cloneElement(statusDisplay.icon, { size: 24 })}
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200">
                  {statusDisplay?.title}
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {statusDisplay?.message}
                </p>
              </div>
            </div>

            {/* Controls Toolbar (Only if appropriate) */}
            {statusDisplay?.showControls && (
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => handlePowerAction("start")}
                  disabled={
                    actionLoading ||
                    ["active", "connected", "online"].includes(
                      deployment.status
                    )
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
            )}
          </div>

          {/* Quick Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-1">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield size={18} className="text-indigo-500" /> Security
            </h2>
            <div className="space-y-4">
              <DetailRow
                label="Node"
                value={`Node-${deployment.nodeId || "1"}`}
              />
              <DetailRow
                label="Resources"
                value={`${deployment.resources?.cpuLimit || 25}% CPU / ${
                  deployment.resources?.ramLimit || 300
                }MB RAM`}
              />
              <DetailRow
                label="Identifier"
                value={`#${deployment.identifier || "---"}`}
              />
              <DetailRow
                label="Created"
                value={
                  deployment.deployedAt || deployment.createdAt
                    ? new Date(
                        deployment.deployedAt || deployment.createdAt
                      ).toLocaleDateString()
                    : "Pending..."
                }
              />
            </div>
            {!["online", "active", "connected"].includes(deployment.status) ? (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 font-medium text-amber-600 flex items-center gap-2">
                <AlertCircle size={16} />
                Deployment in progress...
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 font-medium text-green-600 flex items-center gap-2">
                <CheckCircle size={16} />
                Bot fully operational
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className="border-b border-gray-200 dark:border-gray-700 mb-8 pt-4"
        >
          <nav className="flex space-x-8">
            {!["online", "active", "connected", "awaiting_pairing"].includes(
              deployment.status
            ) && (
              <TabButton
                active={activeTab === "logs"}
                onClick={() => setActiveTab("logs")}
                label="Deployment Logs"
                icon={<Terminal size={18} />}
              />
            )}
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Bot Info"
              icon={<Info size={18} />}
            />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "logs" && (
          <div className="bg-gray-900 rounded-2xl p-1 shadow-lg border border-gray-700">
            <FriendlyTerminal logs={logs} status={deployment?.status} />
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pairing Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4">WhatsApp Connection</h3>
              {deployment.pairingCode &&
              !["online", "active", "connected"].includes(deployment.status) ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-sm text-amber-600 dark:text-amber-300 mb-1 font-medium">
                    SCAN OR ENTER PAIRING CODE
                  </p>
                  <div className="flex items-center justify-center gap-3 my-4">
                    <div className="text-4xl font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300">
                      {deployment.pairingCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 rounded-lg transition-colors text-amber-700"
                      title="Copy"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                  <div className="mt-6 pt-6 border-t border-amber-200/50 dark:border-amber-800/50 text-left">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                      How to link:
                    </p>
                    <ul className="space-y-2 text-xs text-amber-600/80 dark:text-amber-400/70">
                      <li className="flex gap-2">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          1.
                        </span>
                        Open WhatsApp on your mobile phone.
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          2.
                        </span>
                        Go to <b>Settings</b> &gt; <b>Linked Devices</b>.
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          3.
                        </span>
                        Tap <b>Link a Device</b> &gt;{" "}
                        <b>Link with phone number instead</b>.
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          4.
                        </span>
                        Enter the 8-character code shown above.
                      </li>
                    </ul>
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
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {["online", "active", "connected"].includes(
                        deployment.status
                      )
                        ? "Bot Live & Connected"
                        : "Waiting for Pairing Code..."}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Process will update automatically
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Deployment Meta */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4">Deployment Metadata</h3>
              <div className="space-y-3">
                <DetailRow
                  label="Configuration"
                  value={deployment.configuration?.prefix || "."}
                />
                <DetailRow
                  label="Owner"
                  value={deployment.configuration?.ownerName || "---"}
                />
                <DetailRow
                  label="Features"
                  value={`${
                    Object.values(
                      deployment.configuration?.featureToggles || {}
                    ).filter((v) => v !== "off" && v !== false).length
                  } Enabled`}
                />
                <DetailRow label="Pricing Tier" value="Free Tier" />
              </div>
            </div>
          </div>
        )}

        {/* Global Action Buttons (Delete only here) */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 dark:hover:border-red-800"
          >
            <Trash2 size={18} /> Delete Bot Deployment
          </button>
        </div>
      </main>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

// Add necessary sub-components identical to BotManagementPage
function StatusBadge({ status }) {
  const map = {
    online:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    active:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    connected:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    degraded:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    installing:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    creating:
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

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
        {label}
      </span>
      <span className="font-semibold text-sm">{value}</span>
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
