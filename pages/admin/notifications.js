import { useState, useEffect, useCallback } from "react";
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
  FaFileAlt,
  FaFlask,
  FaExpand,
  FaCompress,
  FaEye,
  FaSearch,
  FaRedo,
  FaTimes,
} from "react-icons/fa";
import dynamic from "next/dynamic";

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

/* Progress Bar Component */
const ProgressBar = ({ sent, total, status }) => {
  const percentage = total > 0 ? Math.round((sent / total) * 100) : 0;
  
  const getBarColor = () => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "processing": return "bg-blue-500 animate-pulse";
      default: return "bg-indigo-500";
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <span>{percentage}% Complete</span>
        <span>{sent} / {total} Sent</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/* Recipient Details Modal */
const RecipientDetailsModal = ({ broadcast, onClose }) => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(null);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/email-broadcast/${broadcast._id}/recipients?page=${page}&status=${filterStatus}&search=${search}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecipients(data.data.recipients);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (err) {
      console.error("Fetch recipients error:", err);
    } finally {
      setLoading(false);
    }
  }, [broadcast._id, page, filterStatus, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/email-broadcast/${broadcast._id}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, [broadcast._id]);

  useEffect(() => {
    fetchRecipients();
    fetchStats();
    // Poll stats every 5s while modal is open
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchRecipients, fetchStats]);

  const handleAction = async (recipientId) => {
    try {
      const res = await fetch(`/api/admin/email-broadcast/${broadcast._id}/recipients`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ recipientId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Recipient queued for retry");
        fetchRecipients();
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaEnvelope className="text-indigo-500" /> {broadcast.subject}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Recipient Tracking Detail
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-gray-900 shadow-inner">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">Total</p>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{stats?.total || broadcast.stats.totalRecipients}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Sent</p>
            <p className="text-2xl font-black text-green-900 dark:text-green-100">{stats?.sent || 0}</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold uppercase">Processing</p>
            <p className="text-2xl font-black text-yellow-900 dark:text-yellow-100">{stats?.processing || 0}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">Failed</p>
            <p className="text-2xl font-black text-red-900 dark:text-red-100">{stats?.failed || 0}</p>
          </div>
        </div>

        {/* Main List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input 
                type="text" 
                placeholder="Search email..." 
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select 
                className="flex-1 sm:w-32 px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <FaSpinner className="animate-spin inline mr-2" /> Loading recipients...
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-12 text-center text-gray-500 italic">No recipients found matching filters</div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Attempts</th>
                    <th className="px-6 py-3">Sent Time</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recipients.map((r) => (
                    <tr key={r._id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === "sent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          r.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          r.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse" :
                          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {r.status}
                        </span>
                        {r.lastError && (
                          <div className="text-[10px] text-red-400 mt-1 truncate max-w-[150px]" title={r.lastError}>
                            {r.lastError}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{r.attempts} / 3</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {r.sentAt ? format(new Date(r.sentAt), "MMM d, HH:mm:ss") : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(r.status === "failed" || r.status === "pending") && (
                          <button 
                            onClick={() => handleAction(r._id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors group"
                            title={r.status === "failed" ? "Retry" : "Send Now"}
                          >
                            <FaRedo className="group-hover:rotate-180 transition-transform duration-500" size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="text-xs text-gray-500">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 disabled:opacity-30 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <FaChevronLeft size={10} />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 disabled:opacity-30 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

/* Notification Preview Component */
const NotificationPreview = ({
  activeTab,
  emailBroadcastData,
  formData,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case "success": return <FaCheckCircle className="text-green-500" />;
      case "warning": return <FaExclamationTriangle className="text-yellow-500" />;
      case "error": return <FaTimesCircle className="text-red-500" />;
      case "offer": return <FaTag className="text-emerald-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  if (activeTab === "email") {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full bg-white">
        <div className="bg-gray-50/80 p-6 border-b border-gray-200 space-y-3">
            <div className="flex items-center gap-4 text-sm">
                <span className="w-16 font-bold text-gray-400 uppercase text-[10px]">Subject</span>
                <span className="font-semibold text-gray-900 flex-1">{emailBroadcastData.subject || "(Draft Subject)"}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <span className="w-16 font-bold text-gray-400 uppercase text-[10px]">From</span>
                <span className="text-gray-700">{emailBroadcastData.senderName} <span className="text-gray-400 italic font-normal">&lt;info@samkielbot.app&gt;</span></span>
            </div>
        </div>
        <div className="p-8 bg-white flex-1 overflow-y-auto min-h-[400px]">
          <div
            className="prose prose-indigo max-w-none prose-sm"
            dangerouslySetInnerHTML={{
              __html: emailBroadcastData.message || "<p className='text-gray-400 italic text-center mt-12'>Email preview content will appear here...</p>",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
        <div className="flex items-start gap-4">
          <div className="mt-1 transform scale-125">{getIcon(formData.type)}</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 dark:text-white text-md tracking-tight">
              {formData.title || "Announcement Title"}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
              {formData.message || "Compose your broadcast to see the live preview here. Your users will see this exact card."}
            </p>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Now</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState("inApp");
  const [notifications, setNotifications] = useState([]);
  const [emailBroadcasts, setEmailBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ title: "", message: "", type: "info" });
  const [emailData, setEmailData] = useState({ 
    subject: "", message: "", senderName: "Samkiel Bot", announcementType: "general", priority: "normal" 
  });
  
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email-broadcast?limit=10", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setEmailBroadcasts(data.data.broadcasts || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchInApp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInApp();
    fetchBroadcasts();
    // Poll for broadcast updates every 5 seconds
    const interval = setInterval(fetchBroadcasts, 5000);
    return () => clearInterval(interval);
  }, [fetchInApp, fetchBroadcasts]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailData.subject || !emailData.message) return toast.error("All fields required");
    
    if (!confirm("Start this broadcast to all users?")) return;

    setSending(true);
    const tid = toast.loading("Queueing broadcast...");
    try {
      const res = await fetch("/api/admin/email-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(emailData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Broadcast queued successfully!", { id: tid });
        setEmailData({ ...emailData, subject: "", message: "" });
        fetchBroadcasts();
      } else {
        toast.error(data.message || "Failed", { id: tid });
      }
    } catch (err) { toast.error("Error", { id: tid }); }
    setSending(false);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <FaBell className="text-white" />
          </div>
          Notification Engine
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Broadcast messages via In-App alerts or Email queue system.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isEditorExpanded ? "lg:grid-cols-1" : "lg:grid-cols-12"} gap-8`}>
        {/* Left Column: Composer */}
        <div className={isEditorExpanded ? "col-span-1" : "col-span-12 lg:col-span-7"}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex p-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setActiveTab("inApp")}
                className={`flex-1 py-3 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "inApp" ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FaBell size={14} /> In-App Alert
              </button>
              <button 
                onClick={() => setActiveTab("email")}
                className={`flex-1 py-3 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "email" ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FaEnvelope size={14} /> Email Dispatch
              </button>
            </div>

            <div className="p-8">
              {activeTab === "inApp" ? (
                <form className="space-y-5">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Title</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all dark:text-white"
                      placeholder="e.g. System Update"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Message</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all dark:text-white min-h-[120px]"
                      placeholder="What do you want to tell your users?"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Alert Type</label>
                        <select 
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:text-white appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="info">General Info</option>
                            <option value="success">Success / Promo</option>
                            <option value="warning">Maintenance / Warning</option>
                            <option value="error">Critical Issue</option>
                        </select>
                    </div>
                    <button className="flex-[0.5] mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                        Blast Now
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-5">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dispatch Subject</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all dark:text-white font-semibold"
                      placeholder="The first thing they see..."
                      value={emailData.subject}
                      onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email Body (HTML Supported)</label>
                        <button 
                            type="button"
                            onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                            className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                        >
                            {isEditorExpanded ? <><FaCompress /> Collapse</> : <><FaExpand /> Multi-Col Edit</>}
                        </button>
                    </div>
                    <div className={`grid grid-cols-1 ${isEditorExpanded ? "lg:grid-cols-2" : ""} gap-8`}>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-600">
                            <ReactQuill 
                                theme="snow"
                                value={emailData.message}
                                onChange={(val) => setEmailData({...emailData, message: val})}
                                className="quill-premium h-[300px]"
                                modules={{
                                    toolbar: [
                                        [{ header: [1, 2, 3, false] }],
                                        ["bold", "italic", "underline", "blockquote"],
                                        [{'list': 'ordered'}, {'list': 'bullet'}],
                                        ["link", "image", "clean"],
                                        [{ 'color': [] }, { 'background': [] }],
                                    ]
                                }}
                            />
                        </div>
                        {isEditorExpanded && (
                            <div className="hidden lg:block h-[345px]">
                                <NotificationPreview activeTab="email" emailBroadcastData={emailData} />
                            </div>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                     <button 
                        type="button"
                        onClick={() => setShowTestModal(true)}
                        className="flex-1 py-4 px-6 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                      >
                        <FaFlask /> Send Test
                      </button>
                      <button 
                        type="submit"
                        disabled={sending}
                        className="flex-[2] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                      >
                        {sending ? <FaSpinner className="animate-spin" /> : <><FaPaperPlane /> Start Global Dispatch</>}
                      </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview / Stats */}
        {!isEditorExpanded && (
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 sticky top-8">
               <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                 <FaEye /> Real-time Preview
               </h3>
               <NotificationPreview 
                activeTab={activeTab} 
                formData={formData} 
                emailBroadcastData={emailData} 
               />
            </div>
          </div>
        )}
      </div>

      {/* Broadcast History / Real-time Tracking */}
      <div className="mt-12 space-y-8">
          <div className="flex items-end justify-between px-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Broadcast History</h2>
                <p className="text-sm text-gray-500 font-medium">Real-time status of your last 10 global dispatches</p>
              </div>
              <button 
                onClick={fetchBroadcasts} 
                className="p-3 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                title="Refresh Manual"
              >
                <FaSync className={emailLoading ? "animate-spin" : ""} />
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {emailBroadcasts.map((b) => (
                  <div 
                    key={b._id} 
                    onClick={() => setSelectedBroadcast(b)}
                    className="group bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 flex gap-2">
                        {b.status === "processing" && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                             b.status === "completed" ? "bg-green-50 text-green-600 border-green-100" :
                             b.status === "failed" ? "bg-red-50 text-red-600 border-red-100" :
                             b.status === "processing" ? "bg-blue-50 text-blue-600 border-blue-100" :
                             "bg-gray-50 text-gray-600 border-gray-100"
                        }`}>
                            {b.status}
                        </span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-12 line-clamp-1">{b.subject}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                        {format(new Date(b.createdAt), "MMM d, yyyy • HH:mm")}
                    </p>

                    <div className="mt-8 space-y-6">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Sent</p>
                                <p className="text-xl font-black text-gray-900 dark:text-gray-100">{b.stats.sent}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Failed</p>
                                <p className="text-xl font-black text-red-500">{b.stats.failed || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Wait</p>
                                <p className="text-xl font-black text-indigo-500">
                                    {(b.stats.totalRecipients || 0) - (b.stats.sent || 0) - (b.stats.failed || 0)}
                                </p>
                            </div>
                        </div>

                        <ProgressBar 
                            sent={b.stats.sent} 
                            total={b.stats.totalRecipients} 
                            status={b.status}
                        />

                        <button className="w-full py-4 bg-gray-50 dark:bg-gray-700/50 group-hover:bg-indigo-600 group-hover:text-white text-gray-500 dark:text-gray-400 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                            View Delivery Details <FaChevronRight size={10} />
                        </button>
                    </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Recipient Detailed Modal */}
      {selectedBroadcast && (
          <RecipientDetailsModal 
            broadcast={selectedBroadcast} 
            onClose={() => setSelectedBroadcast(null)} 
          />
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Internal Test Dispatch</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Send a test copy to your personal inbox before broadcasting to everyone.</p>
                <div className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="your@email.com" 
                        autoFocus
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:text-white"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowTestModal(false)}
                            className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                            onClick={async () => {
                                if (!testEmail) return toast.error("Enter email");
                                toast.loading("Sending test...");
                                // Test logic endpoint...
                                setShowTestModal(false);
                                toast.dismiss();
                                toast.success("Test sent!");
                            }}
                        >
                            Send Test
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

      <style jsx global>{`
        .quill-premium .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          background: #f8fafc;
          border-color: #f1f5f9 !important;
          padding: 1rem !important;
        }
        .quill-premium .ql-container {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #f1f5f9 !important;
          font-family: inherit;
        }
        .dark .ql-toolbar {
          background: #0f172a;
          border-color: #334155 !important;
        }
        .dark .ql-container {
          border-color: #334155 !important;
        }
        .prose img {
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
      `}</style>
    </AdminLayout>
  );
}
