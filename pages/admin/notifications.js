import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaBell,
  FaPaperPlane,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    link: "",
    linkText: "",
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        // Filter for Broadcasts ONLY (where user is null)
        const broadcasts = data.data.filter((n) => !n.user);
        setNotifications(broadcasts);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error loading notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Send Broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error("Title and Message are required");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          userId: null, // Broadcast to all
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Broadcast sent successfully!");
        setFormData({
          title: "",
          message: "",
          type: "info",
          link: "",
          linkText: "",
        });
        fetchNotifications(); // Refresh list
      } else {
        toast.error(data.message || "Failed to send");
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Error sending broadcast");
    } finally {
      setSending(false);
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this broadcast log? This won't remove it from users who already received it."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Broadcast log deleted");
        setNotifications(notifications.filter((n) => n._id !== id));
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting notification");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "error":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
          <FaBell className="text-indigo-600" /> Notification Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send global broadcasts to all users and view history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Broadcast Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaPaperPlane className="text-indigo-500" /> Send Broadcast
            </h2>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  placeholder="e.g. System Maintenance"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  placeholder="Enter your announcement..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className={`w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                    sending
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {sending ? "Sending..." : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Broadcast History
              </h2>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {notifications.length} Sent
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Loading history...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No broadcast history found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                        Type
                      </th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                        Content
                      </th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                        Date
                      </th>
                      <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notif) => (
                      <tr
                        key={notif._id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                      >
                        <td className="p-4 align-top w-24">
                          <div className="flex flex-col items-center gap-1">
                            {getIcon(notif.type)}
                            <span className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                              {notif.type}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                            {notif.title}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {notif.message}
                          </p>
                        </td>
                        <td className="p-4 align-top whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-32">
                          {format(new Date(notif.createdAt), "MMM d, HH:mm")}
                        </td>
                        <td className="p-4 align-top text-right w-16">
                          <button
                            onClick={() => handleDelete(notif._id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Delete Log"
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
