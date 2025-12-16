import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Use this if using app dir, but this is pages dir.
// In pages dir, use router. However, this is a component.
// We will just fetch.

export default function NotificationDropdown() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for notifications every 30s
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n) => !n.isRead).length);
      }
    } catch (e) {
      console.error("Notif fetch error", e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ all: true }),
      });
      fetchNotifications();
    } catch (e) {}
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute right-0 sm:right-0 mt-2 w-screen sm:w-80 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 sm:max-h-[80vh] max-h-screen overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-bold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() =>
                    !notification.isRead && markOneRead(notification._id)
                  }
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                    notification.isRead
                      ? "bg-white dark:bg-gray-800 opacity-60"
                      : "bg-indigo-50 dark:bg-indigo-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            Real-time updates active
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
