import { useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";

export default function AdminNotifications() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      return toast.error("Fill all fields");
    }
    if (!confirm("This will send a notification to ALL users. Confirm?"))
      return;

    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, type: "info" }), // broadcast
      });
      toast.success("Broadcast sent!");
      setTitle("");
      setMessage("");
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
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="System Maintenance, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
