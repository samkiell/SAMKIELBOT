import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
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
    // Silent loading for background updates
    if (servers.length === 0) setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setServers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch servers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="text-indigo-600" /> Server Management
        </h1>
        <button
          onClick={fetchServers}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {servers.map((server) => (
          <div
            key={server._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{server.botName}</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {server.identifier}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    server.status === "running"
                      ? "bg-green-100 text-green-700"
                      : server.status === "suspended"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {server.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                User:{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {server.user?.email || "N/A"}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-500 flex items-center gap-1">
                    <Cpu size={14} /> CPU
                  </div>
                  <div className="font-mono font-bold mt-1">
                    {server.resources?.cpuLimit || 0}%
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-500 flex items-center gap-1">
                    <Activity size={14} /> RAM
                  </div>
                  <div className="font-mono font-bold mt-1">
                    {server.resources?.ramLimit || 0}MB
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  <div className="text-gray-500 flex items-center gap-1">
                    <HardDrive size={14} /> Disk
                  </div>
                  <div className="font-mono font-bold mt-1">
                    {server.resources?.diskLimit || 0}MB
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <Link href={`/admin/server/${server._id}`}>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 transition">
                  <Terminal size={18} /> View Console & Details
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
