import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import { Terminal, Power, Database, Activity, RefreshCw } from "lucide-react";
import FriendlyTerminal from "../../../components/FriendlyTerminal";

export default function AdminServerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [server, setServer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [wsAuth, setWsAuth] = useState(null);

  useEffect(() => {
    if (id) fetchServerDetails();
    return () => {
      if (socket) socket.close();
    };
  }, [id, token]);

  const fetchServerDetails = async () => {
    try {
      // 1. Get DB details
      // We can use the generic bots endpoint or create a specific one
      // Let's use generic list filtering for now or assume we can fetch by ID from bots
      // Actually Admin Bots API is list-only. We need specific detail.
      // Use client-side filtering from list or add detail API.
      // Let's add detail API `GET /api/admin/bots/:id` (which assumes deployment ID)
      // I'll assume we can use the existing `controlBot` logic or similar.
      // Wait, we need WEBSOCKET credentials. `adminController` doesn't expose them yet.
      // I will add a new endpoint /api/admin/server/:id/console

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/server/${id}/console`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 404) {
        toast.error("Endpoint not found (Backend update needed)");
        return;
      }
      const data = await res.json();

      if (data.success) {
        setServer(data.data.server);
        setWsAuth(data.data.websocket);
        connectWebsocket(data.data.websocket);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load server details");
    }
  };

  const connectWebsocket = (wsData) => {
    if (!wsData || !wsData.socket) return;

    const ws = new WebSocket(wsData.socket);

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: "auth", args: [wsData.token] }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === "auth success") {
        // Request logs
        ws.send(JSON.stringify({ event: "send logs", args: [null] }));
      }
      if (msg.event === "console output") {
        setLogs((prev) => [...prev, msg.args[0]].slice(-200));
      }
      if (msg.event === "stats") {
        // stats args: [{memory_bytes, cpu_absolute, ...}]
        const stats = JSON.parse(msg.args[0]);
        // We could update local state if we had one for stats
      }
    };

    ws.onerror = (e) => console.error("WS Error", e);

    setSocket(ws);
  };

  const sendCommand = (cmd) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "send command", args: [cmd] }));
    }
  };

  return (
    <AdminLayout>
      {!server ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-[#0b0f1a] rounded-3xl overflow-hidden p-6 border border-white/5 shadow-2xl relative">
          {/* Mesh Gradient Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="mb-8 flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 relative z-10">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-3">
                <Terminal size={28} className="text-indigo-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {server.botName}
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-mono tracking-widest uppercase mt-1">
                INSTANCE ID: {server.identifier}
              </p>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                  Cluster Status
                </div>
                <div
                  className={`font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full border ${
                    server.status === "running"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-white/5 text-gray-500 border-white/10"
                  }`}
                >
                  {server.status}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative z-10">
            <FriendlyTerminal
              logs={logs}
              status={server.status}
              onCommand={sendCommand}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
