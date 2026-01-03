import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import Head from "next/head";
import {
  Server,
  Terminal,
  RefreshCw,
  Activity,
  HardDrive,
  Cpu,
  Database,
} from "lucide-react";
import Link from "next/link";

import Skeleton, { ServerCardSkeleton } from "../../../components/Skeleton";

export default function AdminOneServer() {
  const { token } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 10000); // Poll every 10s for "real-time" status
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    // Only set loading to true if we don't have servers yet to avoid UI clearing
    if (servers.length === 0) setLoading(true);
    try {
      const endpoint = "/admin/bots/sync-stats";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST", // It's a POST now to trigger sync
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch servers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Server Fleet | SAMKIEL ADMIN</title>
      </Head>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4 text-gray-900 dark:text-white">
            <Server className="text-indigo-600" size={36} />
            Fleet Command
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Real-time monitoring of all active bot modules on Pterodactyl.
          </p>
        </div>
        <button
          onClick={fetchServers}
          disabled={loading}
          className="group p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:scale-110 active:scale-95 transition-all text-gray-500 disabled:opacity-50"
        >
          <RefreshCw
            size={24}
            className={
              loading
                ? "animate-spin"
                : "group-hover:rotate-180 transition-transform duration-500"
            }
          />
        </button>
      </div>

      {loading && servers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#111827] h-80 rounded-[40px] border border-gray-100 dark:border-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servers.map((server) => (
            <div
              key={server._id}
              className="group bg-white dark:bg-[#111827] rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-8 pb-0 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xl">
                    {server.botName?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight text-gray-900 dark:text-gray-100 leading-none mb-1.5 line-clamp-1">
                      {server.botName}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest font-mono opacity-50">
                      {server.identifier}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    ["running", "online", "active"].includes(server.status)
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-500 border border-red-500/20"
                  }`}
                >
                  {server.status}
                </div>
              </div>

              {/* User Identity */}
              <div className="px-8 mt-4 mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-50">
                  OPERATOR
                </p>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 truncate lowercase font-mono">
                  {server.user?.email || "SYSTEM_DAEMON"}
                </p>
              </div>

              {/* Visual Stats */}
              <div className="p-8 flex-1">
                <div className="grid grid-cols-1 gap-4">
                  <ResourceMetric
                    icon={Cpu}
                    label="PROCESSOR LOAD"
                    used={server.resources?.usedCpu}
                    limit={server.resources?.cpuLimit}
                    unit="%"
                    color="indigo"
                  />
                  <ResourceMetric
                    icon={Activity}
                    label="MEMORY CONSUMPTION"
                    used={server.resources?.usedRam}
                    limit={server.resources?.ramLimit}
                    unit="MB"
                    color="indigo"
                  />
                  <ResourceMetric
                    icon={HardDrive}
                    label="DISK STORAGE"
                    used={server.resources?.usedDisk}
                    limit={server.resources?.diskLimit}
                    unit="MB"
                    color="indigo"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="p-4 pt-0">
                <Link href={`/admin/server/${server._id}`} className="block">
                  <button className="w-full py-5 bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 group/btn">
                    <Terminal
                      size={18}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                    Open Console
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {servers.length === 0 && !loading && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <Server className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-xl font-bold text-gray-400">
            No active servers found in fleet.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}

function ResourceMetric({ icon: Icon, label, used, limit, unit, color }) {
  const percent = Math.min((used / (limit || 1)) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Icon size={12} className="opacity-50" />
          {label}
        </p>
        <p className="text-xs font-black tracking-tight text-gray-900 dark:text-white">
          {used}
          {unit}{" "}
          <span className="opacity-30">
            / {limit}
            {unit}
          </span>
        </p>
      </div>
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
