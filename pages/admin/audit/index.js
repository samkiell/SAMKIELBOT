import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Shield,
  User,
  Server,
  Activity,
  Trash2,
  Edit2,
  Play,
  Square,
  AlertTriangle,
  CreditCard,
  Database,
  Terminal,
} from "lucide-react";

export default function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setLogs(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionColor = (action = "") => {
    const lower = action.toLowerCase();
    if (
      lower.includes("delete") ||
      lower.includes("stop") ||
      lower.includes("kill") ||
      lower.includes("suspend") ||
      lower.includes("deduct")
    ) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800";
    }
    if (
      lower.includes("create") ||
      lower.includes("add") ||
      lower.includes("start") ||
      lower.includes("resume") ||
      lower.includes("unsuspend")
    ) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800";
    }
    if (
      lower.includes("update") ||
      lower.includes("edit") ||
      lower.includes("restart")
    ) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
  };

  const getActionIcon = (action = "") => {
    const lower = action.toLowerCase();
    if (lower.includes("delete"))
      return <Trash2 className="w-3.5 h-3.5 mr-1.5" />;
    if (lower.includes("update"))
      return <Edit2 className="w-3.5 h-3.5 mr-1.5" />;
    if (lower.includes("start")) return <Play className="w-3.5 h-3.5 mr-1.5" />;
    if (lower.includes("stop"))
      return <Square className="w-3.5 h-3.5 mr-1.5" />;
    if (lower.includes("credits"))
      return <CreditCard className="w-3.5 h-3.5 mr-1.5" />;
    return <Activity className="w-3.5 h-3.5 mr-1.5" />;
  };

  const getTargetIcon = (type) => {
    if (type === "User") return <User className="w-4 h-4 text-purple-500" />;
    if (type === "Deployment")
      return <Server className="w-4 h-4 text-blue-500" />;
    if (type === "Node")
      return <Database className="w-4 h-4 text-orange-500" />;
    if (type === "System")
      return <Terminal className="w-4 h-4 text-gray-500" />;
    return <Shield className="w-4 h-4 text-green-500" />;
  };

  const filteredLogs = logs.filter(
    (log) =>
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.adminEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details &&
        JSON.stringify(log.details)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            System Audit Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all administrative actions and system events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          <RotateCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by action, admin, or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredLogs.length} events
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
          <div className="col-span-1"></div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-3">Admin</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-2">Target</div>
          <div className="col-span-2">Details</div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <AnimatePresence>
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No logs found matching your search.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log._id}
                  className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                >
                  {/* Row Content */}
                  <div
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                    onClick={() => toggleExpand(log._id)}
                  >
                    <div className="col-span-1 flex justify-center text-gray-400">
                      {expandedLogId === log._id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="col-span-11 sm:col-span-2 flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(log.timestamp), "MMM d, yyyy")}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {format(new Date(log.timestamp), "HH:mm:ss")}
                      </span>
                    </div>

                    <div className="col-span-11 sm:col-span-3 sm:block">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold hidden sm:flex">
                          {log.adminEmail.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-sm text-gray-700 dark:text-gray-300 truncate"
                          title={log.adminEmail}
                        >
                          {log.adminEmail}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-6 sm:col-span-2 mt-2 sm:mt-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getActionColor(
                          log.action
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </div>

                    <div className="col-span-6 sm:col-span-2 mt-2 sm:mt-0 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      {getTargetIcon(log.targetType)}
                      <span>{log.targetType}</span>
                    </div>

                    <div className="col-span-12 sm:col-span-2 mt-2 sm:mt-0">
                      <span className="text-xs text-indigo-500 group-hover:underline">
                        {expandedLogId === log._id
                          ? "Hide Details"
                          : "View Details"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLogId === log._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800"
                    >
                      <div className="p-6 sm:ml-12">
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                          <div className="flex-1 w-full">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Metadata
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div>
                                <span className="block text-gray-500 text-xs">
                                  Log ID
                                </span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                                  {log._id}
                                </span>
                              </div>
                              <div>
                                <span className="block text-gray-500 text-xs">
                                  Target ID
                                </span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                                  {log.targetId || "N/A"}
                                </span>
                              </div>
                              {log.ipAddress && (
                                <div className="col-span-2">
                                  <span className="block text-gray-500 text-xs">
                                    IP Address
                                  </span>
                                  <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                                    {log.ipAddress}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-[2] w-full">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Payload Details
                            </h4>
                            <div className="relative rounded-lg bg-gray-900 border border-gray-700 overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-8 bg-gray-800/50 flex items-center px-4 border-b border-gray-700">
                                <div className="flex space-x-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                </div>
                                <span className="ml-4 text-[10px] text-gray-500 font-mono">
                                  json_viewer
                                </span>
                              </div>
                              <div className="p-4 pt-10 overflow-x-auto">
                                <pre className="text-xs font-mono text-blue-300">
                                  {log.details ? (
                                    JSON.stringify(log.details, null, 2)
                                  ) : (
                                    <span className="text-gray-500">
                                      No additional details recorded.
                                    </span>
                                  )}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer/Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="text-xs text-center text-gray-400">
            Displaying most recent {filteredLogs.length} records
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
