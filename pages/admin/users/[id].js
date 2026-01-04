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
  const [referrals, setReferrals] = useState([]);
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
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
        /\/$/,
        ""
      );

      // Fetch User Details
      const userRes = await fetch(`${apiUrl}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      setUserDetail(userData.data);

      // Fetch User Bots
      const botsRes = await fetch(`${apiUrl}/admin/users/${id}/bots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const botsData = await botsRes.json();
      setUserBots(botsData.data || []);

      // Fetch User Referrals
      const referralsRes = await fetch(
        `${apiUrl}/admin/users/${id}/referrals`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const referralsData = await referralsRes.json();
      setReferrals(referralsData.data || []);
    } catch (err) {
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handlePowerAction = async (botId, signal) => {
    setActionLoading(botId);
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
      /\/$/,
      ""
    );
    try {
      const res = await fetch(`${apiUrl}/admin/bots/${botId}/power`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signal }),
      });

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
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
      /\/$/,
      ""
    );
    try {
      const res = await fetch(`${apiUrl}/admin/bots/${bot._id}/suspend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

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
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
      /\/$/,
      ""
    );
    try {
      const res = await fetch(`${apiUrl}/admin/bots/${botId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

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
      online: "bg-green-100 text-green-800 border-green-200",
      active: "bg-green-100 text-green-800 border-green-200",
      connected: "bg-green-100 text-green-800 border-green-200",
      installing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      starting: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paired: "bg-yellow-100 text-yellow-800 border-yellow-200",
      stopped: "bg-gray-100 text-gray-800 border-gray-200",
      offline: "bg-gray-100 text-gray-800 border-gray-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      error: "bg-red-100 text-red-800 border-red-200",
      suspended: "bg-orange-100 text-orange-800 border-orange-200",
      expired: "bg-orange-100 text-orange-800 border-orange-200",
      degraded: "bg-amber-100 text-amber-800 border-amber-200",
      awaiting_pairing: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-blue-100 text-blue-800 border-blue-200",
    };

    const icons = {
      running: "🟢",
      online: "🌐",
      active: "⚡",
      connected: "🔗",
      installing: "⚙️",
      starting: "🚀",
      paired: "🤝",
      stopped: "🛑",
      offline: "💤",
      failed: "⚠️",
      error: "❌",
      suspended: "⛔",
      expired: "⏰",
      degraded: "📉",
      awaiting_pairing: "🔑",
      pending: "⏲️",
    };

    const style = styles[status] || styles.stopped;
    const icon = icons[status] || "⚪";

    return (
      <span
        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${style} flex items-center gap-1 w-fit uppercase`}
      >
        <span>{icon}</span> {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Head>
          <title>User Details - Admin Panel</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-10">
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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b] text-gray-900 dark:text-white pb-20">
      <Head>
        <title>{userDetail.username} | User Command Center</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button */}
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-500 font-bold mb-8 transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to User Base
        </Link>

        {/* Identity Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[32px] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-500/20">
              {userDetail.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black tracking-tight">
                  {userDetail.username}
                </h1>
                <span
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    userDetail.role === "admin"
                      ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                      : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                  }`}
                >
                  {userDetail.role}
                </span>
              </div>
              <p className="text-gray-500 font-medium">{userDetail.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest ${
                userDetail.accountStatus === "active"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {userDetail.accountStatus || "ACTIVE"}
            </div>
          </div>
        </div>

        {/* Simplified Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <DetailStatCard
            label="WALLET BALANCE"
            value={Math.round(userDetail.credits || 0)}
            icon="🪙"
            suffix="CREDITS"
          />
          <DetailStatCard
            label="DEPLOYED FLEET"
            value={userBots.length}
            icon="🤖"
            suffix="BOTS"
          />
        </div>

        {/* User Intelligence Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Profile Card */}
          <div className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="text-xl">🆔</span> Subject Profile
            </h3>
            <div className="space-y-4">
              <ProfileInfoRow
                label="Legal Name"
                value={userDetail.fullName || "Not Provided"}
              />
              <ProfileInfoRow
                label="Direct Comms"
                value={userDetail.whatsappNumber || "Not Linked"}
              />
              <ProfileInfoRow
                label="Email Address"
                value={userDetail.email || "N/A"}
              />
              <ProfileInfoRow
                label="Username"
                value={userDetail.username || "N/A"}
              />
              <ProfileInfoRow
                label="First Access"
                value={new Date(userDetail.createdAt).toLocaleDateString()}
              />
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Referred By
                  </span>
                  {userDetail.referredBy ? (
                    <Link
                      href={`/admin/users/${userDetail.referredBy._id}`}
                      className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                    >
                      @{userDetail.referredBy.username}
                    </Link>
                  ) : (
                    <span className="text-xs font-mono text-gray-400">
                      Direct / None
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Referrals Card */}
          <div className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="text-xl">🤝</span> Referral Network
              </h3>
              <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg text-xs font-black">
                {referrals.length} USERS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 space-y-3 custom-scrollbar">
              {referrals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <span className="text-2xl mb-2">🕸️</span>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    No Referrals Logged
                  </span>
                </div>
              ) : (
                referrals.map((ref) => (
                  <Link
                    key={ref._id}
                    href={`/admin/users/${ref._id}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xs">
                        {ref.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-bold text-sm group-hover:text-indigo-500 transition-colors">
                          {ref.username}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {ref.email}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <span className="w-2 h-8 bg-indigo-600 rounded-full" />
            Active Deployments
          </h2>

          {userBots.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-20 text-center text-gray-400 font-bold">
              No active bot instances detected.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userBots.map((bot) => (
                <div
                  key={bot._id}
                  className="bg-white dark:bg-[#111827] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl">
                        🤖
                      </div>
                      <div>
                        <Link
                          href={`/admin/bots/${bot._id}`}
                          className="text-lg font-black hover:text-indigo-500 transition-colors"
                        >
                          {bot.botName || `Bot ${bot.botNumber}`}
                        </Link>
                        <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-wider">
                          ID: {bot._id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      {getStatusBadge(bot.status)}
                      <div className="h-6 w-px bg-gray-100 dark:bg-gray-800 hidden md:block" />
                      <div className="flex items-center gap-2">
                        <ControlBtn
                          icon={Play}
                          color="text-emerald-500"
                          bg="bg-emerald-500/10"
                          onClick={() => handlePowerAction(bot._id, "start")}
                        />
                        <ControlBtn
                          icon={Square}
                          color="text-red-500"
                          bg="bg-red-500/10"
                          onClick={() => handlePowerAction(bot._id, "stop")}
                        />
                        <ControlBtn
                          icon={RotateCcw}
                          color="text-blue-500"
                          bg="bg-blue-500/10"
                          onClick={() => handlePowerAction(bot._id, "restart")}
                        />
                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />
                        <ControlBtn
                          icon={PauseCircle}
                          color="text-amber-500"
                          bg="bg-amber-500/10"
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
                        />
                        <ControlBtn
                          icon={Trash2}
                          color="text-red-500"
                          bg="bg-red-500/10"
                          onClick={() =>
                            setConfirmModal({
                              show: true,
                              action: "delete",
                              bot,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl max-w-md w-full p-10 border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2">
                Authorize Action
              </h3>
              <p className="text-gray-500 font-medium mb-8">
                Confirm {confirmModal.action} signal for{" "}
                <span className="font-mono text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded">
                  {confirmModal.bot.botName || "instance"}
                </span>
                . This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    setConfirmModal({ show: false, action: null, bot: null })
                  }
                  className="px-6 py-4 text-gray-600 dark:text-gray-300 font-black text-sm uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={() =>
                    confirmModal.action === "delete"
                      ? handleDelete(confirmModal.bot._id)
                      : handleSuspend(confirmModal.bot)
                  }
                  className="px-6 py-4 bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Execute
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailStatCard({ label, value, icon, suffix }) {
  return (
    <div className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="text-2xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tighter">{value}</span>
        <span className="text-[10px] font-bold text-gray-400">{suffix}</span>
      </div>
    </div>
  );
}

function ProfileInfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function ControlBtn({ icon: Icon, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all hover:scale-110 active:scale-90 ${color} ${bg}`}
    >
      <Icon size={18} />
    </button>
  );
}
