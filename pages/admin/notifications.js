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
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen,
  FaFileAlt,
  FaFlask,
  FaExpand,
  FaCompress,
  FaPaperclip,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import dynamic from "next/dynamic";

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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
    senderName: "Ezekiel", // Default Sender Name
    announcementType: "general",
    priority: "normal",
  });
  const [attachments, setAttachments] = useState([]);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailBroadcasts, setEmailBroadcasts] = useState([]);
  const [emailBroadcastsLoading, setEmailBroadcastsLoading] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSearch, filterType, userSearch]); // Re-fetch when filters change (ignoring direct searchQuery to avoid rapid fire)

  // Pagination calculations
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Editor Change
  const handleEditorChange = (content) => {
    setEmailBroadcastData((prev) => ({ ...prev, message: content }));
  };

  // Handle File Attachments
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Process files
    files.forEach((file) => {
      // Limit file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            contentType: file.type,
            content: event.target.result.split(",")[1], // base64 content
            size: file.size,
            id: Date.now() + Math.random().toString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = null;
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
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
      `Are you sure you want to send this email to ALL verified users?\n\nSubject: ${emailBroadcastData.subject}\nPriority: ${emailBroadcastData.priority}\n\nThis action cannot be undone.`,
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
        body: JSON.stringify({
          ...emailBroadcastData,
          attachments: attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const stats = data.data.stats;
        toast.success(
          `Email broadcast complete!\n${stats.sent}/${stats.totalRecipients} emails sent (${stats.successRate}% success)`,
          { id: toastId, duration: 5000 },
        );
        setEmailBroadcastData({
          subject: "",
          message: "",
          senderName: "Samkiel Bot",
          announcementType: "general",
          priority: "normal",
        });
        setAttachments([]); // Clear attachments
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

  // Resume Email Broadcast
  const handleResumeEmailBroadcast = async (broadcastId) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to resume this email broadcast? It will only send to users who haven't received it yet.",
    );
    if (!confirmed) return;

    setSendingEmail(true);
    const toastId = toast.loading("Resuming email broadcast...");

    try {
      const res = await fetch("/api/admin/email-broadcast/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ broadcastId }),
      });

      const data = await res.json();

      if (data.success) {
        const stats = data.data.stats;
        toast.success(
          `Broadcast resumed and finished!\n${stats.sent}/${stats.totalRecipients} total emails sent`,
          { id: toastId, duration: 5000 },
        );
        fetchEmailBroadcasts(); // Refresh history
      } else {
        toast.error(data.message || "Failed to resume broadcast", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Resume email broadcast error:", error);
      toast.error("Error resuming broadcast", { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  // Send Test Email
  const handleTestEmail = async (e) => {
    e.preventDefault();

    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!emailBroadcastData.subject.trim()) {
      toast.error("Subject is required for test email");
      return;
    }
    if (!emailBroadcastData.message.trim()) {
      toast.error("Message is required for test email");
      return;
    }

    setSendingTestEmail(true);
    const toastId = toast.loading("Sending test email...");

    try {
      const res = await fetch("/api/admin/email-broadcast/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...emailBroadcastData,
          testEmail: testEmailAddress,
          attachments: attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Test email sent to ${testEmailAddress}!`, {
          id: toastId,
        });
        setShowTestEmailModal(false);
        setTestEmailAddress("");
      } else {
        toast.error(data.message || "Failed to send test email", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      toast.error("Error sending test email", { id: toastId });
    } finally {
      setSendingTestEmail(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  carefully. <br />
                  <b>Tip:</b> Use <code>@user</code> in the message to
                  automatically insert the recipient's first name.
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
                      Sender Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="senderName"
                      value={emailBroadcastData.senderName}
                      onChange={handleEmailChange}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      placeholder="e.g. Samkiel Bot"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between items-center">
                      <span>
                        Message <span className="text-red-500">*</span>
                      </span>
                      <div className="flex gap-2">
                        {/* Preview Button Removed */}
                        <button
                          type="button"
                          onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                          className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {isEditorExpanded ? (
                            <>
                              <FaCompress /> Collapse
                            </>
                          ) : (
                            <>
                              <FaExpand /> Expand
                            </>
                          )}
                        </button>
                      </div>
                    </label>
                    <div
                      className={`${isEditorExpanded ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-8 flex flex-col" : "relative"}`}
                    >
                      {isEditorExpanded && (
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                          <h3 className="text-xl font-bold dark:text-white">
                            Email Editor
                          </h3>
                          <button
                            type="button"
                            onClick={() => setIsEditorExpanded(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                          >
                            <FaTimes size={24} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 ${isEditorExpanded ? "flex-1 flex flex-col" : ""}`}
                      >
                        <ReactQuill
                          theme="snow"
                          value={emailBroadcastData.message}
                          onChange={handleEditorChange}
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              [
                                "bold",
                                "italic",
                                "underline",
                                "strike",
                                "blockquote",
                              ],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link", "image"],
                              [{ color: [] }, { background: [] }],
                              ["clean"],
                            ],
                          }}
                          className={`h-full ${isEditorExpanded ? "quill-fullscreen" : "quill-normal"}`}
                          placeholder="Compose your email..."
                          style={{
                            height: isEditorExpanded
                              ? "calc(100% - 42px)"
                              : "300px",
                          }}
                        />
                      </div>
                    </div>

                    {/* Attachments Section - Disabled as per request
                    <div className="mt-4">
                      ...
                    </div>
                    */}
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

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTestEmailModal(true)}
                      disabled={sendingEmail || sendingTestEmail}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaFlask /> Test Email
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail || sendingTestEmail}
                      className={`flex-[2] py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                        sendingEmail
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {sendingEmail ? (
                        <>
                          <FaSpinner className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <FaEnvelope /> Send Broadcast
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Test Email Modal */}
                {showTestEmailModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FaFlask className="text-indigo-500" /> Send Test Email
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        Enter an email address to receive a test copy of this
                        broadcast.
                      </p>
                      <form onSubmit={handleTestEmail}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recipient Email
                          </label>
                          <input
                            type="email"
                            value={testEmailAddress}
                            onChange={(e) =>
                              setTestEmailAddress(e.target.value)
                            }
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                            placeholder="your@email.com"
                            autoFocus
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowTestEmailModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={sendingTestEmail}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                          >
                            {sendingTestEmail ? (
                              <>
                                <FaSpinner className="animate-spin" />{" "}
                                Sending...
                              </>
                            ) : (
                              <>
                                <FaPaperPlane /> Send Test
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

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
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate flex-1">
                                {broadcast.subject}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(
                                  broadcast.status,
                                )}`}
                              >
                                {broadcast.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {format(
                                    new Date(broadcast.createdAt),
                                    "MMM d, HH:mm",
                                  )}
                                </span>
                                <span>•</span>
                                <span>
                                  {broadcast.stats?.sent || 0}/
                                  {broadcast.stats?.totalRecipients || 0} sent
                                </span>
                              </div>

                              {broadcast.status === "partial" &&
                                !sendingEmail && (
                                  <button
                                    onClick={() =>
                                      handleResumeEmailBroadcast(broadcast._id)
                                    }
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FaPaperPlane size={8} /> RESUME
                                  </button>
                                )}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${getPriorityBadge(
                                  broadcast.priority,
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

        {/* Right Column: Live Preview */}
        <div className="hidden lg:block">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaEye className="text-indigo-500" /> Live Preview
            </h2>

            {activeTab === "email" ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 w-full">
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-16">
                          Subject:
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium truncate">
                          {emailBroadcastData.subject || "(No Subject)"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-16">
                          To:
                        </span>
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs">
                          All Verified Users
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300 w-16">
                          From:
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium truncate">
                          {emailBroadcastData.senderName || "Samkiel Bot"}{" "}
                          &lt;info@samkielbot.app&gt;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Email Body Preview - Always Light Mode specific for Email simulation usually */}
                <div className="p-6 bg-white min-h-[400px] overflow-y-auto max-h-[600px]">
                  <div
                    className="prose max-w-none text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html:
                        emailBroadcastData.message ||
                        "<p class='text-gray-400 italic text-center mt-10'>Start composing your email to see the preview here...</p>",
                    }}
                  />

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Attachments
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600"
                          >
                            <FaFileAlt className="text-indigo-400" />
                            <span className="truncate max-w-[150px]">
                              {att.filename}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-100 dark:border-gray-700 border-l-4"
                  style={{
                    borderLeftColor:
                      formData.type === "error"
                        ? "#ef4444"
                        : formData.type === "warning"
                          ? "#f59e0b"
                          : "#6366f1",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(formData.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formData.title || "Notification Title"}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {formData.message ||
                          "Notification message content will appear here..."}
                      </p>
                      {formData.link && (
                        <div className="mt-2">
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center gap-1">
                            {formData.linkText || "Action"}{" "}
                            <FaChevronRight size={10} />
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      Just now
                    </span>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500">
                  Preview of how the user will see the notification card.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast History Table - Moved to Bottom */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FaHistory className="text-indigo-500" /> Broadcast History
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
              {notifications.length} Found | Page {currentPage} of{" "}
              {totalPages || 1}
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
                  {paginatedNotifications.map((notif) => (
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

          {/* Pagination Controls */}
          {notifications.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} -{" "}
                {Math.min(endIndex, notifications.length)} of{" "}
                {notifications.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaChevronLeft size={12} />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm rounded-md transition ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FaChevronRight size={12} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
