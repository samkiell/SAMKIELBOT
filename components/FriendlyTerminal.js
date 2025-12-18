import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CheckCircle,
  Info,
  Zap,
  Coffee,
  Globe,
  Shield,
  Clock,
  Layout,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Friendly Terminal Component - Apple/Premium Inspired
 *
 * Props:
 * - logs: Array of raw log strings
 * - status: Current deployment status
 */
const FriendlyTerminal = ({ logs = [], status }) => {
  const terminalEndRef = useRef(null);
  const [displayedFriendlyLogs, setDisplayedFriendlyLogs] = useState([]);

  // Simulated stage management for when real logs haven't hit yet
  const [simulatedStage, setSimulatedStage] = useState(0);

  const stages = [
    {
      friendly: "Initializing bot deployment engine...",
      icon: <Zap className="w-4 h-4 text-blue-400" />,
      type: "friendly",
      delay: 0,
    },
    {
      friendly: "Configuring secure workspace...",
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      type: "friendly",
      delay: 8000,
    },
    {
      friendly: "Allocating dedicated CPU & RAM...",
      icon: <Layout className="w-4 h-4 text-cyan-400" />,
      type: "friendly",
      delay: 18000,
    },
    {
      friendly: "Establishing connection to secure vault...",
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      type: "friendly",
      delay: 35000,
    },
    {
      friendly: "Fetching bot modules from GitHub repository...",
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      type: "friendly",
      delay: 55000,
    },
    {
      friendly: "Teaching bot its core functions (Node.js)...",
      icon: <Coffee className="w-4 h-4 text-amber-400" />,
      type: "friendly",
      delay: 80000,
    },
    {
      friendly: "Connecting to global node network...",
      icon: <Zap className="w-4 h-4 text-yellow-400" />,
      type: "friendly",
      delay: 100000,
    },
    {
      friendly: "Finalizing system handshake with WhatsApp...",
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      type: "friendly",
      delay: 115000,
    },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedFriendlyLogs]);

  // Handle Simulated Stages
  useEffect(() => {
    if (
      logs.length === 0 &&
      (status === "creating" ||
        status === "installing" ||
        status === "starting")
    ) {
      const timers = stages.map((stage, index) => {
        return setTimeout(() => {
          setDisplayedFriendlyLogs((prev) => {
            if (prev.some((l) => l.friendly === stage.friendly)) return prev;
            return [
              ...prev,
              { ...stage, timestamp: new Date().toLocaleTimeString() },
            ];
          });
        }, stage.delay);
      });
      return () => timers.forEach((t) => clearTimeout(t));
    }
  }, [logs.length, status]);

  // Handle Real Logs Integration
  useEffect(() => {
    if (logs.length > 0) {
      const transformLog = (log) => {
        if (!log) return null;
        const raw = log.toString();

        const mappings = [
          {
            pattern:
              /installing dependencies|npm install|yarn install|building/i,
            friendly: "Teaching your bot its core functions... 📚",
            icon: <Coffee className="w-4 h-4 text-amber-400" />,
            type: "friendly",
          },
          {
            pattern:
              /connecting to whatsapp|connecting\.\.\.|initializing connection|wa connection/i,
            friendly: "Scanning the horizon for WhatsApp... 📡",
            icon: <Zap className="w-4 h-4 text-yellow-400" />,
            type: "friendly",
          },
          {
            pattern:
              /bot connected successfully|successfully logged in|client is ready|connected to whatsapp/i,
            friendly: "System Online. Your bot is now live! 🚀",
            icon: <CheckCircle className="w-4 h-4 text-green-400" />,
            type: "success",
          },
          {
            pattern: /git clone|cloning|fetching repository|pulling/i,
            friendly: "Syncing latest modules from secure vault... 📦",
            icon: <Shield className="w-4 h-4 text-purple-400" />,
            type: "friendly",
          },
          {
            pattern: /success|ready|finished|done|complete|finalizing/i,
            friendly: "Finalizing system handshake... ✨",
            icon: <CheckCircle className="w-4 h-4 text-green-400" />,
            type: "friendly",
          },
        ];

        for (const mapping of mappings) {
          if (mapping.pattern.test(raw)) return mapping;
        }
        return null;
      };

      const newFriendlyItems = logs
        .map((log) => {
          const transformed = transformLog(log);
          return transformed
            ? { ...transformed, timestamp: new Date().toLocaleTimeString() }
            : null;
        })
        .filter((item) => item !== null);

      setDisplayedFriendlyLogs((prev) => {
        const unique = [...prev];
        newFriendlyItems.forEach((newItem) => {
          if (!unique.some((u) => u.friendly === newItem.friendly)) {
            unique.push(newItem);
          }
        });
        return unique;
      });
    }
  }, [logs]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 relative">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

      {/* Main Terminal Body */}
      <div className="relative bg-slate-950/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Apple Style Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg">
              <Terminal size={12} className="text-blue-400/80" />
              <span className="text-[11px] font-mono text-white/40 tracking-wider">
                SECURE_DEPLOYMENT_CHANNEL
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <Clock size={10} className="text-blue-400" />
              <span className="text-[9px] font-mono text-blue-400/80 uppercase tracking-tighter">
                Live Session
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[300px] max-h-[450px] overflow-y-auto custom-scrollbar">
          <AnimatePresence initial={false}>
            <ul className="space-y-6">
              {displayedFriendlyLogs.map((log, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="group flex items-start gap-5"
                >
                  <div
                    className={`mt-0.5 p-3 rounded-xl transition-all duration-500 ${
                      log.type === "success"
                        ? "bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-110"
                        : "bg-white/5 text-blue-400 border border-white/5 group-hover:bg-blue-500/10 transition-colors"
                    }`}
                  >
                    {log.icon}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white/20 text-[10px] font-mono tracking-widest">
                        {log.timestamp}
                      </span>
                      {index === displayedFriendlyLogs.length - 1 && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest animate-pulse">
                            Running
                          </span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[16px] font-medium tracking-tight ${
                        log.type === "success" ? "text-white" : "text-white/80"
                      }`}
                    >
                      {log.friendly}
                    </span>

                    {index === displayedFriendlyLogs.length - 1 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                        className="h-0.5 mt-2 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full"
                      />
                    )}
                  </div>
                </motion.li>
              ))}

              {/* Waiting cursor */}
              {displayedFriendlyLogs.length > 0 &&
                status !== "active" &&
                status !== "connected" && (
                  <motion.li
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 pl-14 pt-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 animate-ping" />
                    <span className="text-[11px] font-mono text-white/10 uppercase tracking-[0.3em]">
                      Awaiting next sequence
                    </span>
                  </motion.li>
                )}

              <div ref={terminalEndRef} />
            </ul>
          </AnimatePresence>
        </div>

        {/* Glossy Footer Overlay */}
        <div className="h-12 absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default FriendlyTerminal;
