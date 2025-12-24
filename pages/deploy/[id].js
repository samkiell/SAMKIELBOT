import { useState, useEffect } from "react";
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
} from "lucide-react";
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
        setLoading(false);
        toast.success("Pairing code found! 📱");
      }
    });

    socket.on("bot:connected", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Bot connected!");
        fetchDeploymentStatus();
        toast.success("Bot connected successfully! 🚀");
        // Trigger celebration
        triggerConfetti();
      }
    });

    socket.on("bot:active", (data) => {
      if (data.deploymentId === id) {
        console.log("[Socket.IO] Bot is now active!");
        fetchDeploymentStatus();
        // Also trigger if it skips connected status
        triggerConfetti();
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

      if (!response.ok) {
        throw new Error("Failed to fetch deployment status");
      }

      const result = await response.json();
      setDeployment(result.data);
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Head>
        <title>Deployment Status - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

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

      <main className="container mx-auto px-4 pb-8 md:pb-16 max-w-2xl">
        {/* Back Button */}
        <div className="mb-6 pt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700/40 p-8">
          <div className="text-center">
            {/* Icon */}
            <div className={`flex justify-center mb-6 ${statusDisplay?.color}`}>
              {statusDisplay?.icon}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-4">{statusDisplay?.title}</h1>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              {statusDisplay?.message}
            </p>

            {/* Friendly Terminal */}
            {!statusDisplay?.showPairingCode && (
              <FriendlyTerminal logs={logs} status={deployment?.status} />
            )}

            {/* Pairing Code Display */}
            {statusDisplay?.showPairingCode && deployment?.pairingCode && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your Pairing Code:
                </p>

                <div className="flex items-center justify-center gap-3 my-4">
                  <div className="text-4xl font-mono font-bold text-yellow-700 dark:text-yellow-300 tracking-wider">
                    {deployment.pairingCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded-lg transition-colors text-yellow-700 dark:text-yellow-300"
                    title="Copy Pairing Code"
                  >
                    <Copy size={24} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Open WhatsApp → Settings → Linked Devices → Link a Device →
                  Enter this code
                </p>
              </div>
            )}

            {/* Control Buttons */}
            {statusDisplay?.showControls && (
              <div className="space-y-4 mt-8">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePowerAction("start")}
                    disabled={
                      actionLoading ||
                      deployment?.status === "active" ||
                      deployment?.status === "connected"
                    }
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    <Play size={20} />
                    Start
                  </button>
                  <button
                    onClick={() => handlePowerAction("stop")}
                    disabled={
                      actionLoading ||
                      deployment?.status === "stopped" ||
                      deployment?.status === "offline"
                    }
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    <Square size={20} />
                    Stop
                  </button>
                </div>
                <button
                  onClick={() => handlePowerAction("restart")}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  <RotateCw size={20} />
                  Restart
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  <Trash2 size={20} />
                  Delete Bot
                </button>
              </div>
            )}

            {/* Navigation Buttons (for success state without controls shown yet) */}
            {statusDisplay?.success && !statusDisplay?.showControls && (
              <div className="space-y-4 mt-8">
                <Link
                  href="/bots"
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  View My Bots
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

            {/* Bot Details */}
            {deployment && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Bot Name
                    </p>
                    <p className="font-semibold">{deployment.botName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <p className="font-semibold capitalize">
                      {deployment.status.replace("_", " ")}
                    </p>
                  </div>
                  {deployment.connectedAt && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Connected At
                      </p>
                      <p className="font-semibold">
                        {new Date(deployment.connectedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
