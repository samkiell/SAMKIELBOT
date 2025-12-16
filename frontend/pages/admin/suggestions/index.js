import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";

export default function AdminSuggestions() {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/suggestions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSuggestions(data.data || []);
    } catch (err) {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/suggestions/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      toast.success("Updated");
      fetchSuggestions();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const deleteSuggestion = async (id) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/suggestions/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ delete: true }),
        }
      );
      toast.success("Deleted");
      fetchSuggestions();
    } catch (err) {
      toast.error("Failed");
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">User Suggestions</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Suggestion</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {suggestions.map((s) => (
              <tr key={s._id}>
                <td className="px-6 py-4">
                  <div className="font-bold">{s.user?.username}</div>
                  <div className="text-xs text-gray-500">{s.user?.email}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <div className="font-bold mb-1">{s.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {s.message}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                      s.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : s.status === "implemented"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => updateStatus(s._id, "implemented")}
                    className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => deleteSuggestion(s._id)}
                    className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
