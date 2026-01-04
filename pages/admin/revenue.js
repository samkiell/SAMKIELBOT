import { useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../../lib/auth";
import AdminLayout from "../../components/AdminLayout";
import {
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton, {
  StatCardSkeleton,
  TableSkeleton,
} from "../../components/Skeleton";

export default function AdminRevenue() {
  const { token, user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    currency: "",
    search: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      fetchRevenue();
    }
  }, [
    user,
    token,
    authLoading,
    page,
    filters.status,
    filters.currency,
    filters.startDate,
    filters.endDate,
  ]);

  // Debounced search
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      fetchRevenue();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchRevenue = async (isRefresh = false) => {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filters.status && { status: filters.status }),
        ...(filters.currency && { currency: filters.currency }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
        /\/$/,
        ""
      );
      const res = await fetch(`${apiUrl}/admin/revenue?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to load revenue data");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while fetching revenue stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const formatCurrency = (amount, currency = "NGN") => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      case "pending":
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const exportToCSV = () => {
    if (!data?.transactions?.length) return;

    const headers = [
      "Date",
      "User",
      "Email",
      "Amount",
      "Currency",
      "Credits",
      "Reference",
      "Status",
    ];
    const rows = data.transactions.map((t) => [
      new Date(t.createdAt).toLocaleString(),
      t.user?.fullName || t.user?.username || "N/A",
      t.user?.email || "N/A",
      t.amount,
      t.currency,
      t.creditsGranted,
      t.reference,
      t.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `revenue_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <TableSkeleton rows={10} cols={6} />
        </div>
      </AdminLayout>
    );
  }

  const summary = data?.summary || {};
  const transactions = data?.transactions || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Calculate some aggregate totals for display (Top row)
  const totalRevenueNGN =
    summary.allTime?.find((s) => s._id === "NGN")?.totalAmount || 0;
  const totalCreditsSold = summary.allTime?.reduce(
    (acc, s) => acc + s.totalCredits,
    0
  );
  const totalTransactions = summary.allTime?.reduce(0);

  const revenueTodayVal =
    summary.today?.find((s) => s._id === "NGN")?.total || 0;
  const revenueYesterdayVal =
    summary.yesterday?.find((s) => s._id === "NGN")?.total || 0;

  let revenueTrend = 0;
  if (revenueYesterdayVal > 0) {
    revenueTrend =
      ((revenueTodayVal - revenueYesterdayVal) / revenueYesterdayVal) * 100;
  } else if (revenueTodayVal > 0) {
    revenueTrend = 100;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Revenue & Sales - Admin Panel</title>
      </Head>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Revenue <span className="text-indigo-600">Analytics</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor financial performance and credit transactions.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchRevenue(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              size={18}
              className={`${refreshing ? "animate-spin" : ""}`}
            />
            Sync
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatItem
          title="Total Revenue (NGN)"
          value={formatCurrency(totalRevenueNGN, "NGN")}
          subValue={`Across ${totalTransactions} successful sales`}
          icon={DollarSign}
          color="indigo"
        />
        <StatItem
          title="Credits Distributed"
          value={totalCreditsSold?.toLocaleString()}
          subValue="Total credits sold all-time"
          icon={CreditCard}
          color="emerald"
        />
        <StatItem
          title="Revenue Today"
          value={formatCurrency(
            summary.today?.find((s) => s._id === "NGN")?.total || 0,
            "NGN"
          )}
          subValue="Growth vs yesterday"
          icon={TrendingUp}
          color="blue"
          trend={revenueTrend.toFixed(0)}
        />
        <StatItem
          title="Avg. Sale Value"
          value={formatCurrency(
            totalTransactions > 0 ? totalRevenueNGN / totalTransactions : 0,
            "NGN"
          )}
          subValue="Per successful transaction"
          icon={ArrowUpRight}
          color="purple"
        />
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                name="search"
                placeholder="Search by reference, email or name..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="abandoned">Abandoned</option>
              </select>
              <select
                name="currency"
                value={filters.currency}
                onChange={handleFilterChange}
                className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Currencies</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="GHS">GHS</option>
                <option value="ZAR">ZAR</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-center">Amount Paid</th>
                <th className="px-6 py-4 text-center">Credits</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((t) => (
                <tr
                  key={t._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {t.reference}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      via {t.provider}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">
                      {t.user?.fullName || t.user?.username || "Guest"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t.user?.email || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-black text-sm text-gray-900 dark:text-white">
                      {formatCurrency(t.amount, t.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black">
                      +{t.creditsGranted}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(t.status)}
                      <span className="text-xs font-bold capitalize">
                        {t.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing page <b>{pagination.page}</b> of <b>{pagination.pages}</b>{" "}
              ({pagination.total} results)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page === pagination.pages}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatItem({ title, value, subValue, icon: Icon, color, trend }) {
  const colors = {
    indigo: "bg-indigo-600 shadow-indigo-600/20",
    emerald: "bg-emerald-600 shadow-emerald-600/20",
    blue: "bg-blue-600 shadow-blue-600/20",
    purple: "bg-purple-600 shadow-purple-600/20",
  };

  const bgColors = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/10",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10",
    blue: "bg-blue-50 dark:bg-blue-900/10",
    purple: "bg-purple-50 dark:bg-purple-900/10",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColors[color]}`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
            <TrendingUp size={14} />+ {trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-black text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-1 italic">{subValue}</p>
      </div>
    </div>
  );
}
