import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaBell,
  FaUser,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setNotifications(data.data);
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

  // Delete notification
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Notification deleted");
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
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaBell className="text-indigo-600" /> Notification History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage sent notifications.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications found.
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
                    Title & Message
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                    User
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">
                    Date
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr
                    key={notif._id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 capitalize">
                        {getIcon(notif.type)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {notif.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs md:max-w-md">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {notif.title}
                      </div>
                      <div
                        className="text-sm text-gray-600 dark:text-gray-400 truncate"
                        title={notif.message}
                      >
                        {notif.message}
                      </div>
                    </td>
                    <td className="p-4">
                      {notif.user ? (
                        <div className="flex flex-col text-sm">
                          <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                            <FaUser size={10} className="text-gray-400" />{" "}
                            {notif.user.username}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {notif.user.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          Unknown User
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(notif.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(notif._id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
                        title="Delete Notification"
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
    </AdminLayout>
  );
}
