import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import {
  Server,
  HardDrive,
  Cpu,
  Activity,
  ArrowLeft,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NodeDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchNode();
  }, [id]);

  const fetchNode = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch node");
      const data = await res.json();
      setNode(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );

  if (!node)
    return (
      <AdminLayout>
        <div className="text-center py-20">Node not found</div>
      </AdminLayout>
    );

  const calculatePercent = (used, total) => {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Infrastructure
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              {node.name}
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1">{node.fqdn}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                node.status === "online"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {node.status}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity
                className="text-blue-600 dark:text-blue-400"
                size={24}
              />
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {calculatePercent(
                node.resources.usedRam,
                node.resources.totalRam
              )}
              %
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Memory Usage
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {node.resources.usedRam} MB / {node.resources.totalRam} MB
          </p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${calculatePercent(
                  node.resources.usedRam,
                  node.resources.totalRam
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <HardDrive
                className="text-purple-600 dark:text-purple-400"
                size={24}
              />
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {calculatePercent(
                node.resources.usedDisk,
                node.resources.totalDisk
              )}
              %
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Disk Usage
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {node.resources.usedDisk} MB / {node.resources.totalDisk} MB
          </p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${calculatePercent(
                  node.resources.usedDisk,
                  node.resources.totalDisk
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Server
                className="text-green-600 dark:text-green-400"
                size={24}
              />
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {node.serverCount}
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Active Servers
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Total Allocated Containers
          </p>
        </div>
      </div>

      {/* Server List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Terminal size={18} className="text-gray-400" />
            Allocated Servers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Identifier</th>
                <th className="px-6 py-4">Resources</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {node.servers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No servers allocated on this node.
                  </td>
                </tr>
              ) : (
                node.servers.map((server) => (
                  <tr
                    key={server.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {server.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                        {server.identifier}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>RAM: {server.memory} MB</div>
                      <div>Disk: {server.disk} MB</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                          server.status === "running" ||
                          server.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : server.status === "suspended"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {server.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {server.deploymentId ? (
                        <Link
                          href={`/admin/server/${server.deploymentId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <Terminal size={14} />
                          Console
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          External
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
