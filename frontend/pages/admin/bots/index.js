import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";
import {
  Play,
  Square,
  RefreshCw,
  Trash2,
  Terminal,
  MoreHorizontal,
  PauseCircle,
} from "lucide-react";

export default function BotControl() {
  const { token } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBots();
  }, []);

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

  const handlePower = async (id, signal) => {
    setActionLoading(id);
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

      toast.success(`Signal ${signal} sent!`);
      fetchBots();
    } catch (err) {
      toast.error(err.message || "Failed");
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
      toast.success(`Bot ${action}ed`);
      fetchBots();
    } catch (err) {
      toast.error("Action failed");
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
      toast.success("Bot deleted");
      fetchBots();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-700 border-green-200";
      case "starting":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "stopped":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "suspended":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bot Orchestration</h1>
      </div>

      <div className="grid gap-4">
        {bots.map((bot) => (
          <div
            key={bot._id}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
          >
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${statusColor(
                    bot.status
                  )}`}
                >
                  {bot.status}
                </span>
                <h3 className="font-bold text-lg">{bot.botName}</h3>
                <span className="text-xs font-mono text-gray-400">
                  {bot.identifier || "No ID"}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Owner:{" "}
                <span className="text-indigo-500">{bot.user?.email}</span> •{" "}
                Created: {new Date(bot.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePower(bot._id, "start")}
                disabled={actionLoading === bot._id}
                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                title="Start"
              >
                <Play size={18} fill="currentColor" />
              </button>
              <button
                onClick={() => handlePower(bot._id, "restart")}
                disabled={actionLoading === bot._id}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Restart"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => handlePower(bot._id, "stop")}
                disabled={actionLoading === bot._id}
                className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Stop"
              >
                <Square size={18} fill="currentColor" />
              </button>

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <button
                onClick={() => handleSuspend(bot._id, bot.status)}
                className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
                title={bot.status === "suspended" ? "Unsuspend" : "Suspend"}
              >
                <PauseCircle size={18} />
              </button>

              <button
                onClick={() => handleDelete(bot._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title="Force Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {bots.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">No bots found.</div>
        )}
      </div>
    </AdminLayout>
  );
}
