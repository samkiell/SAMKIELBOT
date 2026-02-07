import { useEffect, useState } from "react";
import io from "socket.io-client";

export const useBotStatus = (deploymentId) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deploymentId) return;

    // Initialize Socket.IO
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const s = io(socketUrl);

    s.on("connect", () => {
      console.log("[useBotStatus] Connected to Socket.IO");
    });

    // Listen for status changes
    s.on("bot:status_change", (data) => {
      if (data.deploymentId === deploymentId) {
        console.log("[useBotStatus] Status change:", data);
        fetchStatus();
      }
    });

    s.on("bot:pairing_code", (data) => {
      if (data.deploymentId === deploymentId) {
        fetchStatus();
      }
    });

    s.on("bot:connected", (data) => {
      if (data.deploymentId === deploymentId) {
        fetchStatus();
      }
    });

    s.on("bot:active", (data) => {
      if (data.deploymentId === deploymentId) {
        fetchStatus();
      }
    });

    s.on("bot:offline", (data) => {
      if (data.deploymentId === deploymentId) {
        fetchStatus();
      }
    });

    // Initial fetch
    fetchStatus();

    return () => {
      s.disconnect();
    };
  }, [deploymentId]);

  const fetchStatus = async () => {
    if (!deploymentId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/deploy/${deploymentId}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);
      }
    } catch (error) {
      console.error("[useBotStatus] Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refetch: fetchStatus };
};

export const useAllBotsStatus = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Socket.IO
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const s = io(socketUrl);

    s.on("connect", () => {
      console.log("[useAllBotsStatus] Connected to Socket.IO");
    });

    // Listen for any status changes
    s.on("bot:status_change", () => {
      fetchBots();
    });

    s.on("bot:connected", () => {
      fetchBots();
    });

    s.on("bot:active", () => {
      fetchBots();
    });

    s.on("bot:offline", () => {
      fetchBots();
    });

    // Initial fetch
    fetchBots();

    return () => {
      s.disconnect();
    };
  }, []);

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/deploy`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        setBots(result.data || []);
      }
    } catch (error) {
      console.error("[useAllBotsStatus] Error fetching bots:", error);
    } finally {
      setLoading(false);
    }
  };

  return { bots, loading, refetch: fetchBots };
};
