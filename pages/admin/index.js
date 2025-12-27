import { useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../../lib/auth";
import AdminLayout from "../../components/AdminLayout";
import {
  Activity,
  Users,
  Server,
  AlertOctagon,
  HardDrive,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";

import Skeleton, {
  StatCardSkeleton,
  NodeHealthSkeleton,
} from "../../components/Skeleton";

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role === "admin" && token) {
      fetchStats();
    }
  }, [user, token, authLoading]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load system stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <Head>
          <title>Admin Control Plane - SAMKIEL BOT</title>
        </Head>
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NodeHealthSkeleton />
            <NodeHealthSkeleton />
            <NodeHealthSkeleton />
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Admin Control Plane - SAMKIEL BOT</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Overview</h1>
        <p className="text-gray-500">Real-time platform metrics and health.</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Bots"
          value={stats?.runningBots || 0}
          total={stats?.totalBots}
          icon={Server}
          color="green"
        />
        <StatCard
          title="Failed Today"
          value={stats?.failedDeploymentsToday || 0}
          icon={AlertOctagon}
          color="red"
        />
        <StatCard
          title="Error Rate"
          value={`${stats?.errorRate || 0}%`}
          icon={TrendingDown}
          color="yellow"
        />
      </div>

      {/* Node Health Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <HardDrive size={20} /> Infrastructure Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.nodeHealth?.map((node, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">{node.name}</span>
                <span
                  className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                    node.status === "online"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {node.status}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">RAM Usage</span>
                    <span className="font-mono">{node.ramUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        node.ramUsage > 80 ? "bg-red-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(node.ramUsage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!stats?.nodeHealth || stats.nodeHealth.length === 0) && (
            <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed rounded-xl">
              No nodes detected. Run sync or check connection.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, total, icon: Icon, color }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    red: "text-red-600 bg-red-50 dark:bg-red-900/30",
    yellow: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:scale-[1.02] transition-transform">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold mt-1">
          {value}
          {total !== undefined && (
            <span className="text-sm text-gray-400 font-normal ml-1">
              / {total}
            </span>
          )}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
