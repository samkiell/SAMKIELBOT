import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  Server,
  Clock,
  Activity,
  User,
  Heart,
  Shield,
} from "lucide-react";
import Snowfall from "../../components/Snowfall";
import io from "socket.io-client";

let socket;

// Real-time uptime counter component
const UptimeCounter = ({ bot }) => {
  const [uptime, setUptime] = useState("");

  useEffect(() => {
    const calculateUptime = () => {
      if (!bot.isActive || !bot.uptimeStart) {
        return "Offline";
      }

      const now = Date.now();
      const start = new Date(bot.uptimeStart).getTime();
      const diff = now - start;

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    };

    // Initial calculation
    setUptime(calculateUptime());

    // Update every second
    const interval = setInterval(() => {
      setUptime(calculateUptime());
    }, 1000);

    return () => clearInterval(interval);
  }, [bot.isActive, bot.uptimeStart]);

  return (
    <div
      className={`font-mono font-semibold ${
        bot.isActive ? "text-gray-700 dark:text-gray-200" : "text-gray-500"
      }`}
    >
      {uptime}
    </div>
  );
};

export default function BotsList() {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [filteredBots, setFilteredBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, online, offline

  useEffect(() => {
    fetchBots();

    // Initialize Socket.IO for real-time updates
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("[Bots Page] Socket.IO connected");
    });

    socket.on("bot:status_change", () => {
      fetchBots();
    });

    socket.on("bot:connected", () => {
      fetchBots();
    });

    socket.on("bot:active", () => {
      fetchBots();
    });

    socket.on("bot:offline", () => {
      fetchBots();
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let result = bots;

    if (searchTerm) {
      result = result.filter(
        (bot) =>
          bot.botName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bot.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === "online") {
      result = result.filter((bot) => bot.isActive);
    } else if (filter === "offline") {
      result = result.filter((bot) => !bot.isActive);
    }

    setFilteredBots(result);
  }, [bots, searchTerm, filter]);

  const fetchBots = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bots-list`
      );
      const data = await res.json();

      // Backend now provides uptimeStart directly
      setBots(data.data || []);
      setFilteredBots(data.data || []);
    } catch (err) {
      console.error("Failed to fetch bots:", err);
      toast.error("Failed to fetch bots");
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300">
      <Head>
        <title>Community Bots - SAMKIEL BOT</title>
      </Head>
      <Navbar />
      <Snowfall />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          >
            Community Deployed Bots
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Explore the active ecosystem of SAMKIEL bots deployed by our amazing
            community.
          </motion.p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-lg">
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search bots or owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            {["all", "online", "offline"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 dark:bg-slate-800/50 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-20 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
            <Server
              size={64}
              className="mx-auto text-gray-400 mb-4 opacity-50"
            />
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
              No bots found matching your criteria.
            </p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredBots.map((bot) => (
              <motion.div
                key={bot._id}
                variants={item}
                className="group relative bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Status Indicator Stripe */}
                <div
                  className={`h-1.5 w-full ${
                    bot.isActive
                      ? "bg-gradient-to-r from-green-400 to-emerald-600"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                ></div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          bot.isActive
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-gray-100 dark:bg-slate-700/50 text-gray-500"
                        }`}
                      >
                        <Server size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                          {bot.botName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <User size={12} />
                          {bot.username}
                        </div>
                      </div>
                    </div>

                    {bot.isActive ? (
                      <div className="relative">
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      </div>
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-slate-600"></div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock size={14} /> Uptime
                      </div>
                      <UptimeCounter bot={bot} />
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Activity size={14} /> Status
                      </div>
                      <div
                        className={`font-semibold ${
                          bot.isActive ? "text-green-500" : "text-gray-500"
                        }`}
                      >
                        {bot.isActive ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-4">
                    <span>
                      Last Active:{" "}
                      {new Date(bot.lastActive).toLocaleDateString()}
                    </span>
                    <Shield
                      size={14}
                      className="text-gray-300 dark:text-slate-600"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
