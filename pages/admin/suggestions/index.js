import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import {
  Lightbulb,
  CheckCircle,
  Trash2,
  Clock,
  User,
  Mail,
  Calendar,
  MessageSquare,
} from "lucide-react";

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
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="text-amber-500" size={32} />
          User Suggestions
        </h1>
        <p className="text-gray-500 mt-2">
          Review and manage feature requests from the community.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
          <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No suggestions found.</p>
        </div>
      ) : (
        <>
          {/* Desktop View Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Suggestion
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {suggestions.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-6 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                          {s.user?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {s.user?.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 max-w-xl">
                      <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {s.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                        {s.message}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border ${
                          s.status === "pending"
                            ? "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/40"
                            : s.status === "implemented"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40"
                            : "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {s.status === "pending" && (
                          <button
                            onClick={() => updateStatus(s._id, "implemented")}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors"
                            title="Mark as Implemented"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteSuggestion(s._id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden space-y-4">
            {suggestions.map((s) => (
              <div
                key={s._id}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {s.user?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white">
                        {s.user?.username}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {s.user?.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest border ${
                      s.status === "pending"
                        ? "bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {s.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {s.status === "pending" && (
                      <button
                        onClick={() => updateStatus(s._id, "implemented")}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold"
                      >
                        Implement
                      </button>
                    )}
                    <button
                      onClick={() => deleteSuggestion(s._id)}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
