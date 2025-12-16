import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import { Terminal, Power, Database, Activity, RefreshCw } from "lucide-react";

export default function AdminServerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [server, setServer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [wsAuth, setWsAuth] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (id) fetchServerDetails();
    return () => {
      if (socket) socket.close();
    };
  }, [id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
        setLogs((prev) => [...prev, msg.args[0]]);
      }
      if (msg.event === "status") {
        // Update status live?
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
        <div className="flex flex-col h-[calc(100vh-100px)]">
          <div className="mb-4 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Terminal size={24} className="text-indigo-500" />
                {server.botName}
              </h1>
              <p className="text-xs text-gray-500 font-mono">
                {server.identifier}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase font-bold">
                  Status
                </div>
                <div
                  className={`font-bold ${
                    server.status === "running"
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {server.status}
                </div>
              </div>
            </div>
          </div>

          {/* Console */}
          <div className="flex-1 bg-black rounded-xl p-4 font-mono text-sm text-gray-300 overflow-hidden flex flex-col shadow-inner">
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap break-all">
                  {log.replace(/\u001b\[.*?m/g, "")}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            <div className="mt-2 flex gap-2">
              <span className="text-green-500 select-none">$</span>
              <input
                className="flex-1 bg-transparent border-none outline-none text-white"
                placeholder="Type command..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendCommand(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
