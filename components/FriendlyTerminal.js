import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
  Zap,
  Coffee,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Friendly Terminal Component
 *
 * Props:
 * - logs: Array of raw log strings
 * - status: Current deployment status
 */
const FriendlyTerminal = ({ logs = [], status }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const terminalEndRef = useRef(null);
  const advancedEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (showAdvanced) {
      advancedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showAdvanced]);

  // Transform raw logs into friendly messages
  const transformLog = (log) => {
    if (!log) return null;
    const raw = log.toString();

    // Mapping rules - IMPROVED PATTERNS
    const mappings = [
      {
        pattern: /installing dependencies|npm install|yarn install|building/i,
        friendly: "Feeding your bot some Node.js vitamins 🍪",
        icon: <Coffee className="w-4 h-4 text-amber-400" />,
        type: "friendly",
      },
      {
        pattern:
          /connecting to whatsapp|connecting\.\.\.|initializing connection|wa connection/i,
        friendly: "Your bot is saying hi to WhatsApp servers 👋",
        icon: <Zap className="w-4 h-4 text-yellow-400" />,
        type: "friendly",
      },
      {
        pattern:
          /bot connected successfully|successfully logged in|client is ready|connected to whatsapp/i,
        friendly: "🎉 Your bot is awake and ready!",
        icon: <CheckCircle className="w-4 h-4 text-green-400" />,
        type: "success",
      },
      {
        pattern: /creating server|initializing server|pterodactyl|egg|nest/i,
        friendly: "Building a cozy home for your bot 🏠",
        icon: <Info className="w-4 h-4 text-blue-400" />,
        type: "friendly",
      },
      {
        pattern: /starting bot|npm start|node server|node \.|starting/i,
        friendly: "Waking up your bot... ☕",
        icon: <Zap className="w-4 h-4 text-indigo-400" />,
        type: "friendly",
      },
      {
        pattern: /git clone|cloning|fetching repository|pulling/i,
        friendly: "Grabbing your bot's clothes from GitHub 👗",
        icon: <Info className="w-4 h-4 text-purple-400" />,
        type: "friendly",
      },
      {
        pattern: /npm|yarn|dependency|package|installing/i,
        friendly: "Teaching your bot new tricks (Installing plugins) 📚",
        icon: <Coffee className="w-4 h-4 text-amber-400" />,
        type: "friendly",
      },
      {
        pattern: /success|ready|finished|done|complete|finalizing/i,
        friendly: "Almost there... finalizing the setup! ✨",
        icon: <CheckCircle className="w-4 h-4 text-green-400" />,
        type: "friendly",
      },
    ];

    for (const mapping of mappings) {
      if (mapping.pattern.test(raw)) {
        return mapping;
      }
    }

    // Generic progress catch-all for anything that looks like a task
    if (
      raw.length > 5 &&
      raw.length < 100 &&
      !raw.includes("error") &&
      !raw.includes("failed")
    ) {
      return {
        friendly: "Processing your bot's request... ⚙️",
        icon: <Info className="w-4 h-4 text-slate-400" />,
        type: "friendly",
      };
    }

    return null; // Not a friendly-mappable log
  };

  // Get only the unique friendly logs in order
  const friendlyLogs = logs
    .map((log) => {
      const transformed = transformLog(log);
      return transformed
        ? {
            ...transformed,
            raw: log,
            timestamp: new Date().toLocaleTimeString(),
          }
        : null;
    })
    .filter((log) => log && log.friendly);

  // Filter to only show unique friendly messages to keep it clean
  const uniqueFriendlyLogs = [];
  const seenFriendly = new Set();

  for (const log of friendlyLogs) {
    if (!seenFriendly.has(log.friendly)) {
      uniqueFriendlyLogs.push(log);
      seenFriendly.add(log.friendly);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 overflow-hidden bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Terminal size={14} /> deployment_process.log
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
              status === "active" || status === "connected"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}
          >
            {status || "initializing"}
          </span>
        </div>
      </div>

      {/* Main Friendly View */}
      <div className="p-6 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(30,41,59,0.5),rgba(15,23,42,1))]">
        <AnimatePresence initial={false}>
          {uniqueFriendlyLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-slate-500 py-10"
            >
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 font-mono text-sm tracking-tight text-slate-400 italic">
                Capturing signals from Pterodactyl...
              </p>
            </motion.div>
          ) : (
            <ul className="space-y-4">
              {uniqueFriendlyLogs.map((log, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10, y: 5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`mt-1 p-1.5 rounded-lg shrink-0 ${
                      log.type === "success"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {log.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] font-mono">
                        {log.timestamp}
                      </span>
                      {index === uniqueFriendlyLogs.length - 1 && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium tracking-tight ${
                        log.type === "success"
                          ? "text-green-50"
                          : "text-slate-200"
                      }`}
                    >
                      {log.friendly}
                      {index === uniqueFriendlyLogs.length - 1 && (
                        <span className="inline-block w-2 h-4 ml-1 bg-blue-500/80 animate-pulse align-middle" />
                      )}
                    </span>
                  </div>
                </motion.li>
              ))}
              <div ref={terminalEndRef} />
            </ul>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Logs Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors border-t border-slate-700/50 text-slate-400 text-xs font-mono"
      >
        <span className="flex items-center gap-2">
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAdvanced ? "Hide technical feed" : "Show technical feed"}
        </span>
        <span className="opacity-50 tracking-tighter">SIGNAL_RAW_DATA</span>
      </button>

      {/* Raw Console Logs (Collapsible) */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-black/40 border-t border-slate-800"
          >
            <div className="p-4 h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-500 custom-scrollbar whitespace-pre-wrap lowercase selection:bg-blue-500/30">
              {logs.length === 0 ? (
                <span className="italic opacity-30">
                  # scanning for raw technical logs...
                </span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 flex gap-2">
                    <span className="text-slate-700 shrink-0">
                      [
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      ]
                    </span>
                    <span className="text-slate-400/70 hover:text-slate-300 transition-colors">
                      {log}
                    </span>
                  </div>
                ))
              )}
              <div ref={advancedEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FriendlyTerminal;
