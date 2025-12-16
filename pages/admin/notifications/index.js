import { useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";

export default function AdminNotifications() {
  const { token } = useAuth();
  const [form, setForm] = useState({ userId: "", title: "", message: "" });
  const [loading, setLoading] = useState(false);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!form.message) {
      return toast.error("Message is required");
    }

    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: form.userId || null,
          title: form.title,
          message: form.message,
          type: "info",
        }),
      });
      toast.success("Notification sent!");
      setForm({ userId: "", title: "", message: "" });
    } catch (err) {
      toast.error("Failed to send");
    } finally {
      setLoading(false);
    } 
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Global Notifications</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Send Broadcast</h2>
        <form onSubmit={sendBroadcast} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User ID (Optional)</label>
            <input
              type="text"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              placeholder="Leave empty to broadcast to all users"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (Optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
              placeholder="Notification Title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
              rows="4"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="We are updating the system..."
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send to All Users"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
