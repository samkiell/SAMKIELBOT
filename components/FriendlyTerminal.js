import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CheckCircle,
  Zap,
  Coffee,
  Shield,
  Clock,
  Layout,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FriendlyTerminal = ({ logs = [], status, onCommand }) => {
  const terminalEndRef = useRef(null);
  const [displayedFriendlyLogs, setDisplayedFriendlyLogs] = useState([]);
  const [isRawMode, setIsRawMode] = useState(false);
  const [command, setCommand] = useState("");
  const containerRef = useRef(null);

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
      delay: 5000,
    },
    {
      friendly: "Allocating dedicated CPU & RAM...",
      icon: <Layout className="w-4 h-4 text-cyan-400" />,
      type: "friendly",
      delay: 10000,
    },
    {
      friendly: "Establishing connection to secure vault...",
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      type: "friendly",
      delay: 15000,
    },
    {
      friendly: "Fetching bot modules from GitHub...",
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      type: "friendly",
      delay: 20000,
    },
    {
      friendly: "Teaching bot its core functions...",
      icon: <Coffee className="w-4 h-4 text-amber-400" />,
      type: "friendly",
      delay: 25000,
    },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [displayedFriendlyLogs, logs, isRawMode]);

  // Handle Simulated Stages
  useEffect(() => {
    if (
      logs.length === 0 &&
      ["creating", "installing", "starting"].includes(status)
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

  // Handle Real Logs Integration (Friendly)
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
            pattern:
              /(?:Your pairing code|Pairing code|Code)\s*[:\s-]*\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i,
            friendly: "Pairing code found! Check above to link WhatsApp. ✨",
            icon: <CheckCircle className="w-4 h-4 text-green-400" />,
            type: "success",
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

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    if (onCommand) {
      onCommand(command);
    }
    setCommand("");
  };

  return (
    <div className="w-full relative">
      <div className="relative bg-slate-950/90 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <div className="flex bg-black/40 rounded-lg p-1">
              <button
                onClick={() => setIsRawMode(false)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-all ${
                  !isRawMode
                    ? "text-white bg-indigo-600 shadow-lg"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Friendly
              </button>
              <button
                onClick={() => setIsRawMode(true)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md transition-all ${
                  isRawMode
                    ? "text-white bg-emerald-600 shadow-lg"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Raw Console
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400/80 uppercase">
                Live Stream
              </span>
            </div>
          </div>
        </div>

        {/* Console Area */}
        <div
          ref={containerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar font-mono"
        >
          {isRawMode ? (
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="text-[12px] text-white/70 break-all leading-relaxed flex gap-3"
                >
                  <span className="text-white/20 shrink-0">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span className="text-emerald-400 select-none">$</span>
                  <span>{log}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-white/30 italic text-sm">
                  Waiting for console output...
                </div>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <ul className="space-y-4">
                {displayedFriendlyLogs.map((log, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 group"
                  >
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        log.type === "success"
                          ? "bg-green-500/20 border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                          : "bg-white/5 border-white/5 text-blue-400"
                      }`}
                    >
                      {React.cloneElement(log.icon, { className: "w-4 h-4" })}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">
                          {log.timestamp}
                        </span>
                        {index === displayedFriendlyLogs.length - 1 && (
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                        )}
                      </div>
                      <span
                        className={`text-sm md:text-base font-medium ${
                          log.type === "success"
                            ? "text-white"
                            : "text-white/80"
                        }`}
                      >
                        {log.friendly}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Area */}
        <div className="p-3 bg-white/5 border-t border-white/5">
          <form
            onSubmit={handleCommandSubmit}
            className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-white/5 focus-within:border-indigo-500/50 transition-all"
          >
            <span className="text-emerald-500 font-bold font-mono">➜</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Execute command on bot... (e.g. .restart)"
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/20"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20"
            >
              Run
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default FriendlyTerminal;
