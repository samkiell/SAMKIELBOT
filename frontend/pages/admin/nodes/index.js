import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";
import { RefreshCw, HardDrive, Server, Cpu, Database } from "lucide-react";

export default function NodeInfrastructure() {
  const { token } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/nodes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setNodes(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch nodes");
    } finally {
      setLoading(false);
    }
  };

  const syncNodes = async () => {
    setSyncing(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/nodes/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Nodes synced from Pterodactyl");
      fetchNodes();
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Infrastructure (Nodes)</h1>
        <button
          onClick={syncNodes}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
          Sync from Pterodactyl
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <div
            key={node._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <HardDrive className="text-indigo-500" />
                <span className="font-bold text-lg">{node.name}</span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  node.status === "online"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {node.status.toUpperCase()}
              </span>
            </div>

            {/* Stats */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Cpu size={16} /> Memory
                  </span>
                  <span className="font-mono font-bold">
                    {node.resources.usedRam} / {node.resources.totalRam} MB
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (node.resources.usedRam / node.resources.totalRam) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Database size={16} /> Disk
                  </span>
                  <span className="font-mono font-bold">
                    {node.resources.usedDisk} / {node.resources.totalDisk} MB
                  </span>
                </div>
                {/* Disk Mock Progress */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: "10%" }} // Mocked used disk usually
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                <span>FQDN: {node.fqdn}</span>
                <span>ID: {node.pterodactylId}</span>
              </div>
            </div>
          </div>
        ))}

        {nodes.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No nodes found. Click sync to fetch.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
