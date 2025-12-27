import { useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../../lib/auth";
import AdminLayout from "../../components/AdminLayout";
import { getAdminBugs, updateAdminBugStatus } from "../../lib/api";
import {
  Bug,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  User,
  Bot as BotIcon,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function AdminBugsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
  });
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchTickets();
    }
  }, [user, filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getAdminBugs(filters);
      setTickets(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bug reports");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateAdminBugStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchTickets();
      if (selectedTicket?._id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Deployment":
        return <ExternalLink size={14} />;
      case "Credits & Billing":
        return <AlertCircle size={14} />;
      case "Bot Runtime":
        return <BotIcon size={14} />;
      default:
        return <Bug size={14} />;
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Bug & Issue Tracking - Admin Panel</title>
      </Head>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="text-red-500" /> Bug Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and resolve user-reported platform issues.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">All Categories</option>
            <option value="Deployment">Deployment</option>
            <option value="Credits & Billing">Credits & Billing</option>
            <option value="Bot Runtime">Bot Runtime</option>
            <option value="UI / Dashboard">UI / Dashboard</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"
              />
            ))
          ) : tickets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Bug className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">
                No bug reports found matching your criteria.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 ${
                  selectedTicket?._id === ticket._id
                    ? "ring-2 ring-indigo-500 border-transparent shadow-sm"
                    : "border-gray-100 dark:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-500 text-[10px] font-bold border border-gray-100 dark:border-gray-800">
                      {getCategoryIcon(ticket.category)} {ticket.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />{" "}
                    {formatDistanceToNow(new Date(ticket.createdAt))} ago
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">
                  {ticket.description}
                </h3>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User size={14} className="text-indigo-400" />
                    {ticket.user?.fullName || ticket.metadata?.userName}
                  </div>
                  {ticket.bot && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <BotIcon size={14} className="text-emerald-400" />
                      {ticket.bot.botName}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-8 overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Issue Details
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {selectedTicket._id}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Reporter
                    </h4>
                    <p className="text-sm font-medium">
                      {selectedTicket.user?.fullName ||
                        selectedTicket.metadata?.userName}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {selectedTicket.user?.email ||
                        selectedTicket.metadata?.userEmail}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Related Bot
                    </h4>
                    {selectedTicket.bot ? (
                      <>
                        <p className="text-sm font-medium">
                          {selectedTicket.bot.botName}
                        </p>
                        <p className="text-[10px] text-gray-500 capitalize">
                          {selectedTicket.bot.status}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">None</p>
                    )}
                  </div>
                </div>

                {selectedTicket.metadata?.botState && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Internal Metadata
                    </h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-mono text-[10px] text-gray-600 dark:text-gray-400">
                      Bot State on Submit: {selectedTicket.metadata.botState}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Set Status
                  </h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedTicket._id, "IN_PROGRESS")
                      }
                      disabled={selectedTicket.status === "IN_PROGRESS"}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold text-sm border border-amber-100 dark:border-amber-900/40 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Clock size={16} /> Mark In Progress
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedTicket._id, "RESOLVED")
                      }
                      disabled={selectedTicket.status === "RESOLVED"}
                      className="w-full py-2.5 px-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold text-sm border border-green-100 dark:border-green-900/40 hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Mark Resolved
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedTicket._id, "OPEN")
                      }
                      disabled={selectedTicket.status === "OPEN"}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm border border-red-100 dark:border-red-900/40 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={16} /> Reopen Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-12 text-center h-[400px] flex flex-col justify-center items-center">
              <Search className="text-gray-300 mb-4" size={40} />
              <p className="text-gray-500 text-sm px-8">
                Select a report from the list to view full details and manage
                its status.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
