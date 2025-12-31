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
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

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
        setDeployment((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status || prev.status,
            usageStats: data.usageStats || prev.usageStats,
            resources: {
              ...prev?.resources,
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

  // Auto-scroll logic
  useEffect(() => {
    if (deployment?.status === "awaiting_pairing" && tabsRef.current) {
      setTimeout(() => {
        tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    } else if (["online", "active", "connected"].includes(deployment?.status)) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 500);
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
    <div className="min-h-screen bg-[#0b0f1a] text-gray-100 pb-20 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <Head>
        <title>{deployment.botName} | Live Deployment</title>
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

      <main className="container mx-auto px-4 pt-10 max-w-7xl relative z-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="group inline-flex items-center text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft
              size={20}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-bold text-xs uppercase tracking-widest">
              Back to Dashboard
            </span>
          </Link>
        </div>

        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Main Status Info */}
          <div className="lg:col-span-2 bg-[#161b2c]/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-50" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-3 flex items-center gap-4">
                  {deployment.botName}
                  <StatusBadge status={deployment.status} />
                </h1>
                <p className="text-gray-400 font-medium flex items-center gap-2">
                  <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono">
                    {deployment.botNumber}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-indigo-400/80 tracking-wide uppercase text-xs font-bold">
                    {deployment.configuration?.packName || "Standard Bot"}
                  </span>
                </p>
              </div>
            </div>

            {/* Status Message */}
            <div className="mt-8 flex items-center gap-5 p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md">
              <div
                className={`${statusDisplay?.color} p-3 bg-white/5 rounded-xl`}
              >
                {statusDisplay?.icon &&
                  React.cloneElement(statusDisplay.icon, { size: 32 })}
              </div>
              <div>
                <h4 className="text-lg font-black uppercase tracking-widest text-white/90">
                  {statusDisplay?.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  {statusDisplay?.message}
                </p>
              </div>
            </div>

            {/* Controls Toolbar (Only if appropriate) */}
            {statusDisplay?.showControls && (
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={() => handlePowerAction("start")}
                  disabled={
                    actionLoading ||
                    ["active", "connected", "online"].includes(
                      deployment.status
                    )
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
            )}
          </div>

          {/* Quick Info Card */}
          <div className="bg-[#161b2c]/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <div>
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Shield size={20} />
                </div>
                Deployment Specs
              </h2>
              <div className="space-y-4">
                <DetailRow
                  label="Infrastructure"
                  value={`Node-${deployment.nodeId || "1"}`}
                />
                <DetailRow
                  label="Resource Quota"
                  value={`${deployment.resources?.cpuLimit || 25}% / ${
                    deployment.resources?.ramLimit || 300
                  }MB`}
                />
                <DetailRow
                  label="Network UID"
                  value={`#${deployment.identifier || "---"}`}
                />
                <DetailRow
                  label="Session Created"
                  value={
                    deployment.deployedAt || deployment.createdAt
                      ? new Date(
                          deployment.deployedAt || deployment.createdAt
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Handshaking..."
                  }
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              {!["online", "active", "connected"].includes(
                deployment.status
              ) ? (
                <div className="font-bold text-amber-400 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Orchestrating Instance...
                </div>
              ) : (
                <div className="font-bold text-emerald-400 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cluster Link Operational
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsRef}
          className="flex gap-1 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5"
        >
          {!["online", "active", "connected", "awaiting_pairing"].includes(
            deployment.status
          ) && (
            <TabButton
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
              label="Pipeline Output"
              icon={<Terminal size={14} />}
            />
          )}
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            label="Handshake Details"
            icon={<Info size={14} />}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "logs" && (
          <div className="rounded-3xl p-1 shadow-2xl">
            <FriendlyTerminal
              logs={logs}
              status={deployment?.status}
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

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pairing Section */}
            <div className="bg-[#161b2c]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-xl transition-all duration-500 hover:border-indigo-500/20">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-emerald-400">
                <CheckCircle size={20} /> Bot Connectivity
              </h3>
              {deployment.pairingCode &&
              !["online", "active", "connected"].includes(deployment.status) ? (
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-2xl text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/30" />
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">
                    SCAN OR ENTER PAIRING CODE
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-mono font-black tracking-[0.1em] sm:tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] break-all text-center">
                      {deployment.pairingCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/60 hover:text-white shrink-0"
                      title="Copy"
                    >
                      <Copy size={20} className="sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <div className="pt-8 border-t border-white/5 text-left">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                      LINKING INSTRUCTIONS
                    </p>
                    <ul className="space-y-3 text-xs text-gray-400">
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/40">
                          1
                        </span>
                        Launch WhatsApp on your mobile device.
                      </li>
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/40">
                          2
                        </span>
                        Navigate to <b>Settings</b> &gt; <b>Linked Devices</b>.
                      </li>
                      <li className="flex gap-4">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center font-bold text-[10px] text-white/40">
                          3
                        </span>
                        Select <b>Link a Device</b> &gt;{" "}
                        <b>Link with phone instead</b>.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5">
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
                  </div>
                </div>
              )}
            </div>

            {/* Deployment Meta */}
            <div className="bg-[#161b2c]/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-indigo-400">
                <Info size={20} /> Advanced Metadata
              </h3>
              <div className="grid gap-4">
                <DetailRow
                  label="Command Prefix"
                  value={deployment.configuration?.prefix || "."}
                />
                <DetailRow
                  label="Primary Controller"
                  value={deployment.configuration?.ownerName || "SAMKIEL-ADMIN"}
                />
                <DetailRow
                  label="Active Modules"
                  value={`${
                    Object.values(
                      deployment.configuration?.featureToggles || {}
                    ).filter((v) => v !== "off" && v !== false).length
                  } / Total`}
                />
                <DetailRow label="Service Plan" value="ENTERPRISE CORE" />
              </div>
            </div>
          </div>
        )}

        {/* Global Action Buttons */}
        <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-rose-500/20"
          >
            <Trash2 size={16} /> Terminate Instance
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
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10",
    active:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10",
    connected:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10",
    degraded:
      "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/10",
    error:
      "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-rose-500/10",
    installing:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10",
    creating:
      "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10",
    starting:
      "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/10",
    stopped: "bg-white/5 text-gray-400 border border-white/10 shadow-black/10",
    offline: "bg-white/5 text-gray-400 border border-white/10 shadow-black/10",
  };

  return (
    <span
      className={`${
        map[status] || map["offline"]
      } px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}
    >
      {["online", "active", "connected"].includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {status}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center group/row">
      <span className="text-gray-500 text-sm group-hover/row:text-gray-300 transition-colors">
        {label}
      </span>
      <span className="font-bold text-gray-200">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-2 px-5 rounded-xl transition-all duration-300 ${
        active
          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="font-bold text-[10px] uppercase tracking-widest">
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
