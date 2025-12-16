import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";
import {
  MoreVertical,
  Shield,
  Trash2,
  Lock,
  Unlock,
  Power,
} from "lucide-react";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Governance</h1>
        <div className="text-sm text-gray-500">
          Total: <span className="font-bold">{users.length}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
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
                    {u.stats?.totalBots || 0} bots
                    <div className="text-xs text-gray-400">
                      {(u.stats?.totalRamUsage || 0) / 1024} GB Used
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
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
    </AdminLayout>
  );
}
