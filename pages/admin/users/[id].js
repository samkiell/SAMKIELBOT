import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../../../lib/auth";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Play,
  Square,
  RotateCcw,
  Trash2,
  PauseCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import Skeleton, { TableSkeleton } from "../../../components/Skeleton";

export default function UserDetails() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [userDetail, setUserDetail] = useState(null);
  const [userBots, setUserBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    bot: null,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (id) fetchUserDetails();
  }, [user, authLoading, id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Fetch User Details
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const userData = await userRes.json();
      setUserDetail(userData.data);

      // Fetch User Bots
      const botsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/bots`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const botsData = await botsRes.json();
      setUserBots(botsData.data || []);
    } catch (err) {
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handlePowerAction = async (botId, signal) => {
    setActionLoading(botId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${botId}/power`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signal }),
        }
      );

      if (!res.ok) throw new Error("Action failed");

      toast.success(`Signal ${signal} sent`);
      fetchUserDetails();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (bot) => {
    const action = bot.status === "suspended" ? "unsuspend" : "suspend";
    setActionLoading(bot._id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${bot._id}/suspend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!res.ok) throw new Error("Suspend failed");

      toast.success(`Bot ${action}ed`);
      fetchUserDetails();
      setConfirmModal({ show: false, action: null, bot: null });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (botId) => {
    setActionLoading(botId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bots/${botId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Bot deleted");
      fetchUserDetails();
      setConfirmModal({ show: false, action: null, bot: null });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      running: "bg-green-100 text-green-800 border-green-200",
      installing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      stopped: "bg-gray-100 text-gray-800 border-gray-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      suspended: "bg-orange-100 text-orange-800 border-orange-200",
    };

    const icons = {
      running: "🟢",
      installing: "⏳",
      stopped: "🔴",
      failed: "⚠️",
      suspended: "⛔",
    };

    const style = styles[status] || styles.stopped;
    const icon = icons[status] || "";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${style} flex items-center gap-1 w-fit`}
      >
        <span>{icon}</span> {status.toUpperCase()}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Head>
          <title>User Details - Admin Panel</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <div className="mb-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <TableSkeleton rows={3} cols={3} />
        </div>
      </div>
    );
  }

  if (!userDetail) return <div>User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-20">
      <Head>
        <title>{userDetail.username} - Admin Panel</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {userDetail.username}
            </h1>
            <p className="text-gray-500 text-sm font-mono">
              {userDetail.email}
            </p>
          </div>
          <div className="ml-auto">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                userDetail.role === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {userDetail.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* User Info Cards maybe? For now just simple header */}

        {/* Bots Selection */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-indigo-600" /> Deployed Bots (
          {userBots.length})
        </h2>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {userBots.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No bots deployed by this user.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4">Bot</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {userBots.map((bot) => (
                    <tr
                      key={bot._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-600">
                          {bot.botName || `Bot ${bot.botNumber}`}
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          ID: {bot._id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(bot.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handlePowerAction(bot._id, "start")}
                            disabled={actionLoading === bot._id}
                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            <Play size={16} />
                          </button>
                          <button
                            onClick={() => handlePowerAction(bot._id, "stop")}
                            disabled={actionLoading === bot._id}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            <Square size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handlePowerAction(bot._id, "restart")
                            }
                            disabled={actionLoading === bot._id}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <div className="w-px h-6 bg-gray-300 mx-1"></div>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                show: true,
                                action:
                                  bot.status === "suspended"
                                    ? "unsuspend"
                                    : "suspend",
                                bot,
                              })
                            }
                            className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
                          >
                            <PauseCircle size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                show: true,
                                action: "delete",
                                bot,
                              })
                            }
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle size={32} />
                <h3 className="text-xl font-bold">Confirm Action</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to
                <span className="font-bold text-red-500 mx-1 uppercase">
                  {confirmModal.action}
                </span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded ml-1">
                  {confirmModal.bot.botName || "Bot"}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ show: false, action: null, bot: null })
                  }
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    confirmModal.action === "delete"
                      ? handleDelete(confirmModal.bot._id)
                      : handleSuspend(confirmModal.bot)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-500/30"
                >
                  Confirm {confirmModal.action}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
