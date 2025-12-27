import { useState, useEffect } from "react";
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
} from "lucide-react";

import { TableSkeleton } from "../../../components/Skeleton";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ... rest of state
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

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          headers: /** @type {Record<string, string>} */ ({
            Authorization: `Bearer ${token}`,
          }),
        }
      );
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, payload) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      toast.success("User updated");
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const deleteUser = async (id) => {
    if (
      !confirm(
        "ARE YOU SURE? This will delete the user and ALL their bots permanently."
      )
    )
      return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error("Delete failed");
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

    // If reducing, check if user has enough credits
    if (creditAction === "reduce" && selectedUser.credits < amount) {
      toast.error(
        `User only has ${Math.round(
          selectedUser.credits
        )} credits. Cannot reduce by ${amount}.`
      );
      return;
    }

    setAddingCredits(true);
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
                creditAction === "add" ? "added" : "reduced"
              } ${amount} credits`,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(
          `${creditAction === "add" ? "Added" : "Reduced"} ${amount} credits ${
            creditAction === "add" ? "to" : "from"
          } ${selectedUser.username}`
        );
        setShowCreditModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to manage credits");
      }
    } catch (err) {
      toast.error("Failed to manage credits");
    } finally {
      setAddingCredits(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Governance</h1>
        <div className="text-sm text-gray-500">
          Total: <span className="font-bold">{users.length}</span>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Credits</th>
                  <th className="px-6 py-4">Bots</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">
                        {u.username}
                      </div>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs"
                        value={u.role}
                        onChange={(e) =>
                          updateUser(u._id, { role: e.target.value })
                        }
                      >
                        <option value="user">User</option>
                        <option value="power_user">Power User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className={`bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs font-bold ${
                          u.accountStatus === "suspended"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                        value={u.accountStatus || "active"}
                        onChange={(e) =>
                          updateUser(u._id, { accountStatus: e.target.value })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="deleted">Soft Deleted</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-yellow-500" />
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {Math.round(u.credits || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.stats?.totalBots || 0} bots
                      <div className="text-xs text-gray-400">
                        {(u.stats?.totalRamUsage || 0) / 1024} GB Used
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Add Credits */}
                        <button
                          onClick={() => openCreditModal(u, "add")}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Add Credits"
                        >
                          <Plus size={16} />
                        </button>
                        {/* Reduce Credits */}
                        <button
                          onClick={() => openCreditModal(u, "reduce")}
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          title="Reduce Credits"
                        >
                          <Minus size={16} />
                        </button>
                        {/* Hard Delete */}
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Hard Delete"
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
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold flex items-center gap-2 ${
                  creditAction === "add" ? "text-green-600" : "text-orange-600"
                }`}
              >
                <Coins
                  className={
                    creditAction === "add"
                      ? "text-green-500"
                      : "text-orange-500"
                  }
                />
                {creditAction === "add" ? "Add Credits" : "Reduce Credits"}
              </h2>
              <button
                onClick={() => setShowCreditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {creditAction === "add" ? "Adding" : "Reducing"} credits{" "}
                {creditAction === "add" ? "to" : "from"}:{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedUser.username}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Current balance:{" "}
                <span className="font-bold text-yellow-600">
                  {Math.round(selectedUser.credits || 0)} credits
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Credit Amount *
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={`w-full px-4 py-2 border ${
                    creditAction === "add"
                      ? "border-green-300 dark:border-green-600 focus:ring-green-500"
                      : "border-orange-300 dark:border-orange-600 focus:ring-orange-500"
                  } rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:border-transparent`}
                  min="1"
                  step="1"
                />
                {creditAction === "reduce" &&
                  creditAmount &&
                  parseFloat(creditAmount) > selectedUser.credits && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ User only has {Math.round(selectedUser.credits)}{" "}
                      credits
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder={`e.g., ${
                    creditAction === "add"
                      ? "Promotional bonus, Compensation"
                      : "Policy violation, Refund"
                  }, etc.`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={addingCredits}
                >
                  Cancel
                </button>
                <button
                  onClick={manageCredits}
                  disabled={addingCredits || !creditAmount}
                  className={`flex-1 px-4 py-2 ${
                    creditAction === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  } text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addingCredits
                    ? "Processing..."
                    : creditAction === "add"
                    ? "Add Credits"
                    : "Reduce Credits"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
