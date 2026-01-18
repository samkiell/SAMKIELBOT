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
  FaSync,
  FaTools,
  FaBullhorn,
  FaTag,
  FaEnvelope,
  FaHistory,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
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

  // Email Broadcast State
  const [activeTab, setActiveTab] = useState("inApp"); // "inApp" or "email"
  const [emailBroadcastData, setEmailBroadcastData] = useState({
    subject: "",
    message: "",
    announcementType: "general",
    priority: "normal",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailBroadcasts, setEmailBroadcasts] = useState([]);
  const [emailBroadcastsLoading, setEmailBroadcastsLoading] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications with filters
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterType !== "all") params.append("type", filterType);
      if (userSearch) params.append("userSearch", userSearch);

      const res = await fetch(`/api/admin/notifications?${params.toString()}`, {
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
  }, [debouncedSearch, filterType, userSearch]); // Re-fetch when filters change (ignoring direct searchQuery to avoid rapid fire)

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Send Broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.message) {
      toast.error("Message is required");
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

  // ========================================
  // EMAIL BROADCAST FUNCTIONS
  // ========================================

  // Handle Email Broadcast Input Change
  const handleEmailChange = (e) => {
    setEmailBroadcastData({
      ...emailBroadcastData,
      [e.target.name]: e.target.value,
    });
  };

  // Fetch Email Broadcast History
  const fetchEmailBroadcasts = async () => {
    setEmailBroadcastsLoading(true);
    try {
      const res = await fetch("/api/admin/email-broadcast?limit=10", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setEmailBroadcasts(data.data.broadcasts || []);
      }
    } catch (error) {
      console.error("Fetch email broadcasts error:", error);
    } finally {
      setEmailBroadcastsLoading(false);
    }
  };

  // Load email broadcasts when tab is switched or history is shown
  useEffect(() => {
    if (activeTab === "email" || showEmailHistory) {
      fetchEmailBroadcasts();
    }
  }, [activeTab, showEmailHistory]);

  // Send Email Broadcast
  const handleEmailBroadcast = async (e) => {
    e.preventDefault();

    if (!emailBroadcastData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!emailBroadcastData.message.trim()) {
      toast.error("Message is required");
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to send this email to ALL verified users?\n\nSubject: ${emailBroadcastData.subject}\nPriority: ${emailBroadcastData.priority}\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setSendingEmail(true);
    const toastId = toast.loading("Sending emails... This may take a while.");

    try {
      const res = await fetch("/api/admin/email-broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(emailBroadcastData),
      });

      const data = await res.json();

      if (data.success) {
        const stats = data.data.stats;
        toast.success(
          `Email broadcast complete!\n${stats.sent}/${stats.totalRecipients} emails sent (${stats.successRate}% success)`,
          { id: toastId, duration: 5000 }
        );
        setEmailBroadcastData({
          subject: "",
          message: "",
          announcementType: "general",
          priority: "normal",
        });
        fetchEmailBroadcasts(); // Refresh history
      } else {
        toast.error(data.message || "Failed to send email broadcast", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Email broadcast error:", error);
      toast.error("Error sending email broadcast", { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  // Get status badge for email broadcasts
  const getStatusBadge = (status) => {
    const badges = {
      completed:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      partial:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      processing:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      pending: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
    };
    return badges[status] || badges.pending;
  };

  // Get priority badge color
  const getPriorityBadge = (priority) => {
    const badges = {
      low: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      normal:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      high: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      urgent: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    };
    return badges[priority] || badges.normal;
  };

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
      case "update":
        return <FaSync className="text-indigo-500" />;
      case "maintenance":
        return <FaTools className="text-orange-500" />;
      case "alert":
        return <FaExclamationTriangle className="text-orange-600" />;
      case "announcement":
        return <FaBullhorn className="text-purple-500" />;
      case "offer":
        return <FaTag className="text-emerald-500" />;
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
            {/* Tab Switcher */}
            <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab("inApp")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === "inApp"
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <FaBell size={14} /> In-App
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === "email"
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <FaEnvelope size={14} /> Email
              </button>
            </div>

            {/* In-App Notification Form */}
            {activeTab === "inApp" && (
              <>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaPaperPlane className="text-indigo-500" /> Send In-App
                  Broadcast
                </h2>
                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      placeholder="e.g. System Maintenance"
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
                        <option value="update">Update</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="alert">Alert</option>
                        <option value="announcement">Announcement</option>
                        <option value="offer">Offer</option>
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
                      {sending ? "Sending..." : "Send In-App Broadcast"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Email Broadcast Form */}
            {activeTab === "email" && (
              <>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaEnvelope className="text-indigo-500" /> Send Email
                  Broadcast
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                  ⚠️ This will send an email to ALL verified users. Use
                  carefully.
                </p>
                <form onSubmit={handleEmailBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={emailBroadcastData.subject}
                      onChange={handleEmailChange}
                      maxLength={200}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      placeholder="e.g. Important System Update"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {emailBroadcastData.subject.length}/200
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={emailBroadcastData.message}
                      onChange={handleEmailChange}
                      rows="6"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      placeholder="Enter your email message..."
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        name="announcementType"
                        value={emailBroadcastData.announcementType}
                        onChange={handleEmailChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      >
                        <option value="general">General</option>
                        <option value="update">Update</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="security">Security</option>
                        <option value="feature">New Feature</option>
                        <option value="policy">Policy</option>
                        <option value="important">Important</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={emailBroadcastData.priority}
                        onChange={handleEmailChange}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className={`w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                        sendingEmail
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {sendingEmail ? (
                        <>
                          <FaSpinner className="animate-spin" /> Sending
                          Emails...
                        </>
                      ) : (
                        <>
                          <FaEnvelope /> Send Email Broadcast
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Email Broadcast History Toggle */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEmailHistory(!showEmailHistory)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <span className="flex items-center gap-2">
                      <FaHistory /> Recent Email Broadcasts
                    </span>
                    {showEmailHistory ? <FaChevronUp /> : <FaChevronDown />}
                  </button>

                  {showEmailHistory && (
                    <div className="mt-4 space-y-3">
                      {emailBroadcastsLoading ? (
                        <div className="text-center py-4 text-gray-500">
                          <FaSpinner className="animate-spin inline mr-2" />{" "}
                          Loading...
                        </div>
                      ) : emailBroadcasts.length === 0 ? (
                        <p className="text-center py-4 text-gray-500 text-sm">
                          No email broadcasts yet
                        </p>
                      ) : (
                        emailBroadcasts.map((broadcast) => (
                          <div
                            key={broadcast._id}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate flex-1">
                                {broadcast.subject}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                                  broadcast.status
                                )}`}
                              >
                                {broadcast.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {format(
                                  new Date(broadcast.createdAt),
                                  "MMM d, HH:mm"
                                )}
                              </span>
                              <span>•</span>
                              <span>
                                {broadcast.stats?.sent || 0}/
                                {broadcast.stats?.totalRecipients || 0} sent
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded ${getPriorityBadge(
                                  broadcast.priority
                                )}`}
                              >
                                {broadcast.priority}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Broadcast History
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Filter by User (Username/Email)"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="update">Update</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {notifications.length} Found
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Loading history...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No matching notifications found.
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
                        Recipient
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
                        <td className="p-4 align-top text-sm">
                          {notif.user ? (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold">
                              {typeof notif.user === "object"
                                ? notif.user.username
                                : "User"}
                            </span>
                          ) : (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                              BROADCAST
                            </span>
                          )}
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
