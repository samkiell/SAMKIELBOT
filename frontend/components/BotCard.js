import { Eye, RotateCcw, Square, Play, Trash2, Clock } from "lucide-react";
import { controlBot, deleteBot } from "../lib/api";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import io from "socket.io-client";

let socket;

export default function BotCard({ deployment, refreshData }) {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Socket.IO for real-time updates
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    socket = io(socketUrl);

    socket.on("bot:status_change", (data) => {
      if (data.deploymentId === deployment._id) {
        if (refreshData) refreshData();
      }
    });

    socket.on("bot:connected", (data) => {
      if (data.deploymentId === deployment._id) {
        if (refreshData) refreshData();
      }
    });

    socket.on("bot:active", (data) => {
      if (data.deploymentId === deployment._id) {
        if (refreshData) refreshData();
      }
    });

    socket.on("bot:offline", (data) => {
      if (data.deploymentId === deployment._id) {
        if (refreshData) refreshData();
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [deployment._id, refreshData]);

  const getStatusConfig = (status) => {
    const config = {
      running: { label: "✅ Running", color: "green" },
      active: { label: "✅ Active", color: "green" },
      connected: { label: "✅ Connected", color: "green" },
      stopped: { label: "⛔ Stopped", color: "red" },
      offline: { label: "⚫ Offline", color: "gray" },
      installing: { label: "🛠 Installing", color: "yellow" },
      creating: { label: "🏗 Creating", color: "blue" },
      starting: { label: "🔄 Starting", color: "blue" },
      awaiting_pairing: { label: "📲 Awaiting Pairing", color: "purple" },
      paired: { label: "🔗 Paired", color: "purple" },
      failed: { label: "❌ Failed", color: "red" },
      pending: { label: "⏳ Pending", color: "gray" },
    };
    return config[status] || { label: status, color: "gray" };
  };

  const getStatusBadgeColor = (status) => {
    const color = getStatusConfig(status).color;
    const colors = {
      green:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      red: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      yellow:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      purple:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return colors[color] || colors.gray;
  };

  const formatUptime = () => {
    if (!deployment.isActive) {
      return "Offline";
    }

    let uptimeMs = deployment.resources?.uptimeMs || 0;

    // Add elapsed time since last update for smooth counting
    if (deployment.resources?.lastUptimeUpdate) {
      const elapsedSinceUpdate =
        currentTime - new Date(deployment.resources.lastUptimeUpdate).getTime();
      uptimeMs += elapsedSinceUpdate;
    } else if (deployment.uptimeStart) {
      const timeSinceStart =
        currentTime - new Date(deployment.uptimeStart).getTime();
      uptimeMs = Math.max(uptimeMs, timeSinceStart);
    }

    if (uptimeMs <= 0) return "0s";

    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const seconds = Math.floor((uptimeMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleControl = async (action) => {
    setLoading(true);
    try {
      await controlBot(deployment._id, action);
      toast.success(`Server ${action} signal sent.`);
      if (refreshData) refreshData();
    } catch (error) {
      toast.error(`Failed to ${action} server.`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this bot? This action cannot be undone."
      )
    )
      return;
    setLoading(true);
    try {
      await deleteBot(deployment._id);
      toast.success("Bot deleted successfully.");
      if (refreshData) refreshData();
    } catch (error) {
      toast.error("Failed to delete bot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-700/40 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {deployment.botName || `Bot ${deployment.botNumber}`}
          </h3>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
              deployment.status
            )}`}
          >
            {getStatusConfig(deployment.status).label}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {/* Info */}
        <div className="space-y-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm flex justify-between">
            <span className="font-medium">Number:</span>
            <span>{deployment.botNumber}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm flex justify-between">
            <span className="font-medium">Deployed:</span>
            <span>
              {new Date(
                deployment.deployedAt || deployment.createdAt
              ).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm flex justify-between items-center">
            <span className="font-medium flex items-center gap-1">
              <Clock size={14} />
              Uptime:
            </span>
            <span
              className={`font-mono ${
                deployment.isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500"
              }`}
            >
              {formatUptime()}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Helper values for logic */}
        {(() => {
          const isBusy = ["creating", "installing", "pending"].includes(
            deployment.status
          );
          const isActive = [
            "running",
            "starting",
            "awaiting_pairing",
            "active",
            "connected",
            "paired",
          ].includes(deployment.status);
          // Start: Show if stopped or failed
          const showStart = ["stopped", "failed", "offline"].includes(
            deployment.status
          );
          // Stop: Show if active (running, starting, waiting)
          const showStop = isActive;
          // Restart: Show if not busy/creating (can restart even if stopped usually)
          const showRestart = !isBusy;

          return (
            <>
              {showStart && (
                <button
                  onClick={() => handleControl("start")}
                  disabled={loading || isBusy}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  <Play size={16} className="mr-1" />
                  Start
                </button>
              )}
              {showStop && (
                <button
                  onClick={() => handleControl("stop")}
                  disabled={loading || isBusy}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  <Square size={16} className="mr-1" />
                  Stop
                </button>
              )}
              {showRestart && (
                <button
                  onClick={() => handleControl("restart")}
                  disabled={loading || isBusy}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  <RotateCcw size={16} className="mr-1" />
                  Restart
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
              >
                <Trash2 size={16} className="mr-1" />
                Delete
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
}
