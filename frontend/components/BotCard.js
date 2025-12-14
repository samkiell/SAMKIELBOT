import { Eye, RotateCcw, Square, Play, Trash2 } from "lucide-react";
import { controlBot, deleteBot } from "../lib/api";
import toast from "react-hot-toast";
import { useState } from "react";

export default function BotCard({ deployment, refreshData }) {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "bg-green-600";
      case "stopped":
        return "bg-red-600";
      case "installing":
      case "pending":
        return "bg-yellow-600";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "stopped":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "installing":
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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
            {deployment.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {deployment.pairingCode && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            <span className="font-medium">Pairing Code:</span>{" "}
            {deployment.pairingCode}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-medium">Number:</span> {deployment.botNumber}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-medium">Deployed:</span>{" "}
          {new Date(
            deployment.deployedAt || deployment.createdAt
          ).toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {deployment.status !== "running" && (
          <button
            onClick={() => handleControl("start")}
            disabled={loading}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
          >
            <Play size={16} className="mr-1" />
            Start
          </button>
        )}
        {deployment.status === "running" && (
          <button
            onClick={() => handleControl("stop")}
            disabled={loading}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
          >
            <Square size={16} className="mr-1" />
            Stop
          </button>
        )}
        <button
          onClick={() => handleControl("restart")}
          disabled={loading}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
        >
          <RotateCcw size={16} className="mr-1" />
          Restart
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm disabled:opacity-50"
        >
          <Trash2 size={16} className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}
