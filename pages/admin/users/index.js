import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  MoreVertical,
  Shield,
  Trash2,
  Lock,
  Unlock,
  Power,
  Coins,
  Plus,
  Minus,
  X,
  Search,
  User as UserIcon,
  Crown,
  UserCheck,
  AlertTriangle,
  Mail,
  Calendar,
  LayoutGrid,
  Bot,
  Zap,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TableSkeleton } from "../../../components/Skeleton";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeTab, setActiveTab] = useState("list"); // "list" or "logs"
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditAction, setCreditAction] = useState("add"); // "add" or "reduce"
  const [addingCredits, setAddingCredits] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs" && token) {
      fetchLogs();
    }
  }, [activeTab, token]);

  const fetchUsers = async (query = searchTerm) => {
    if (!token) return;
    try {
      setLoading(true);
      const url = query
        ? `${
            process.env.NEXT_PUBLIC_API_URL
          }/admin/users?search=${encodeURIComponent(query)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/users`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, payload) => {
    const idToast = toast.loading("Updating user...");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      toast.success("User updated successfully", { id: idToast });
      fetchUsers();
    } catch (err) {
      toast.error("Update failed", { id: idToast });
    }
  };

  const deleteUser = async (id) => {
    if (
      !confirm(
        "ARE YOU SURE? This will delete the user and ALL their bots permanently."
      )
    )
      return;

    const idToast = toast.loading("Deleting user...");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User purged from system", { id: idToast });
      fetchUsers();
    } catch (err) {
      toast.error("Purge failed", { id: idToast });
    }
  };

  const openCreditModal = (user, action = "add") => {
    setSelectedUser(user);
    setCreditAmount("");
    setCreditReason("");
    setCreditAction(action);
    setShowCreditModal(true);
  };

  const manageCredits = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }

    const amount = parseFloat(creditAmount);

    if (creditAction === "reduce" && selectedUser.credits < amount) {
      toast.error(
        `Insufficient balance. User has ${Math.round(
          selectedUser.credits
        )} credits.`
      );
      return;
    }

    setAddingCredits(true);
    const idToast = toast.loading("Processing transaction...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser._id}/credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            credits: creditAction === "add" ? amount : -amount,
            reason:
              creditReason ||
              `Admin ${
                creditAction === "add" ? "granted" : "revoked"
              } ${amount} credits`,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Successfully ${
            creditAction === "add" ? "added" : "reduced"
          } ${amount} credits`,
          { id: idToast }
        );
        setShowCreditModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Transaction failed", { id: idToast });
      }
    } catch (err) {
      toast.error("Transaction failed", { id: idToast });
    } finally {
      setAddingCredits(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const query = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      suspended: users.filter((u) => u.accountStatus === "suspended").length,
    };
  }, [users]);

  return (
    <AdminLayout>
      <Head>
        <title>Users | SAMKIEL ADMIN</title>
      </Head>

      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Users
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Oversee community access, roles, and platform liquidities.
            </p>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "logs"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Activity Logs
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={UserIcon}
            color="indigo"
          />
          <StatCard
            title="Administrators"
            value={stats.admins}
            icon={Crown}
            color="amber"
          />
          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {activeTab === "list" ? (
          <>
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-[28px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-medium transition-all"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#111827] h-24 w-full rounded-[32px] border border-gray-100 dark:border-gray-800 animate-pulse flex items-center px-8 gap-4"
                  >
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/4 rounded" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="hidden lg:block bg-white dark:bg-[#111827] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-[11px] uppercase tracking-[0.15em] text-gray-500 font-black">
                          <th className="px-6 py-5">Identity</th>
                          <th className="px-6 py-5">Privileges</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5">Wallet</th>
                          <th className="px-6 py-5">BOT</th>
                          <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        <AnimatePresence mode="popLayout">
                          {filteredUsers.map((u) => (
                            <motion.tr
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              key={u._id}
                              className="group hover:bg-gray-50/50 dark:hover:bg-indigo-500/[0.02] transition-all"
                            >
                              <td className="px-6 py-6">
                                <Link
                                  href={`/admin/users/${u._id}`}
                                  className="group/link block"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-lg">
                                      {u.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                      <h3 className="font-black text-gray-900 dark:text-gray-100 group-hover/link:text-indigo-600 transition-colors">
                                        {u.username}
                                      </h3>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {u.email}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-6 py-6">
                                <div className="relative w-fit">
                                  <MoreVertical
                                    size={12}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                                  />
                                  <select
                                    className="appearance-none bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl px-4 pr-10 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={u.role}
                                    onChange={(e) =>
                                      updateUser(u._id, {
                                        role: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="user">USER</option>
                                    <option value="power_user">POWER</option>
                                    <option value="admin">ADMIN</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      u.accountStatus === "active"
                                        ? "bg-emerald-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {u.accountStatus || "ACTIVE"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                                    <Coins
                                      size={16}
                                      className="text-yellow-600"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-black text-gray-900 dark:text-gray-100 leading-none mb-1">
                                      {Math.round(u.credits || 0)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                      CREDITS
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-black text-indigo-500 leading-none mb-1 text-sm">
                                      {u.stats?.totalBots || 0}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">
                                      BOTS
                                    </p>
                                  </div>
                                  <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
                                  <div>
                                    <p className="font-black text-indigo-500 leading-none mb-1 text-sm">
                                      {u.stats?.totalRamUsage || 0} MB
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">
                                      RAM
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                  <ActionButton
                                    icon={Plus}
                                    color="text-emerald-500"
                                    bg="bg-emerald-500/10"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCreditAction("add");
                                      setShowCreditModal(true);
                                    }}
                                    title="Add Credits"
                                  />
                                  <ActionButton
                                    icon={Minus}
                                    color="text-amber-500"
                                    bg="bg-amber-500/10"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setCreditAction("reduce");
                                      setShowCreditModal(true);
                                    }}
                                    title="Deduct Credits"
                                  />
                                  <ActionButton
                                    icon={
                                      u.accountStatus === "active"
                                        ? Lock
                                        : Unlock
                                    }
                                    color={
                                      u.accountStatus === "active"
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                    }
                                    bg={
                                      u.accountStatus === "active"
                                        ? "bg-red-500/10"
                                        : "bg-emerald-500/10"
                                    }
                                    onClick={() =>
                                      updateUser(u._id, {
                                        accountStatus:
                                          u.accountStatus === "active"
                                            ? "suspended"
                                            : "active",
                                      })
                                    }
                                    title={
                                      u.accountStatus === "active"
                                        ? "Suspend"
                                        : "Activate"
                                    }
                                  />
                                  <ActionButton
                                    icon={Trash2}
                                    color="text-red-600"
                                    bg="bg-red-600/10"
                                    onClick={() => deleteUser(u._id)}
                                    title="Delete User"
                                  />
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden space-y-4">
                  <AnimatePresence>
                    {filteredUsers.map((u) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={u._id}
                        className="bg-white dark:bg-[#111827] p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                {u.username}
                              </h3>
                              <p className="text-[10px] text-gray-500 font-medium uppercase font-mono">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/admin/users/${u._id}`}
                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-indigo-500 transition-colors"
                          >
                            <UserIcon size={18} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              Role
                            </p>
                            <p className="text-xs font-bold uppercase">
                              {u.role}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              Status
                            </p>
                            <p
                              className={`text-xs font-bold uppercase ${
                                u.accountStatus === "active"
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }`}
                            >
                              {u.accountStatus || "Active"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                              <Coins size={14} className="text-yellow-600" />
                            </div>
                            <span className="font-black text-lg tracking-tight">
                              {Math.round(u.credits || 0)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <ActionButton
                              icon={Plus}
                              color="text-emerald-500"
                              bg="bg-emerald-500/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setCreditAction("add");
                                setShowCreditModal(true);
                              }}
                            />
                            <ActionButton
                              icon={Minus}
                              color="text-amber-500"
                              bg="bg-amber-500/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setCreditAction("reduce");
                                setShowCreditModal(true);
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <Search className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-xl font-bold text-gray-400">
                      No users found matching your search.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                Audit Trail
              </h2>
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 hover:scale-110 transition-all text-gray-500 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw
                  size={20}
                  className={logsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>

            {logsLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#111827] h-16 w-full rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse flex items-center px-6 gap-4"
                  >
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] rounded-[40px] border border-dashed border-gray-100 dark:border-gray-800 p-20 text-center">
                <p className="text-gray-400 font-bold">
                  No activity recorded yet.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-indigo-500/[0.02] transition-colors flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg">
                          📝
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                            {log.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {log.details}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                          @{log.adminUsername}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {showCreditModal && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreditModal(false)}
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#111827] rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl max-w-md w-full p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div
                  className={`p-4 rounded-3xl ${
                    creditAction === "add"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  <Coins size={28} />
                </div>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-black mb-2 leading-tight">
                  {creditAction === "add" ? "Grant Credits" : "Revoke Credits"}
                </h2>
                <p className="text-gray-500 font-medium">
                  Modifying balance for{" "}
                  <span className="text-indigo-500 font-bold">
                    {selectedUser.username}
                  </span>
                </p>
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    CURRENT BALANCE
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Coins size={18} className="text-amber-500" />
                    {Math.round(selectedUser.credits || 0)}{" "}
                    <span className="text-xs opacity-50">CREDITS</span>
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    TXN AMOUNT
                  </label>
                  <div className="relative">
                    <Coins
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-lg font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    AUDIT NOTE
                  </label>
                  <textarea
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="Provide context for this transaction..."
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]"
                  />
                </div>

                <button
                  onClick={manageCredits}
                  disabled={addingCredits || !creditAmount}
                  className={`w-full py-5 rounded-[24px] font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                    creditAction === "add"
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-amber-600 text-white shadow-amber-500/20"
                  } disabled:opacity-30 disabled:pointer-events-none`}
                >
                  {addingCredits ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <>
                      {creditAction === "add" ? (
                        <Plus size={20} />
                      ) : (
                        <Minus size={20} />
                      )}
                      Authorize Transaction
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    red: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, color, bg, onClick, title }) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 ${color} ${bg} rounded-xl transition-all active:scale-90`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}
