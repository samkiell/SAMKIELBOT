import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Activity,
  Maximize2,
  Trash2,
  ChevronRight,
  Wifi,
} from "lucide-react";

/**
 * Modern High-Performance Raw Console
 * Replaces the friendly terminal with a real-time, sleek developer console.
 */
const FriendlyTerminal = ({ logs = [], status, onCommand }) => {
  const containerRef = useRef(null);
  const [command, setCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs, autoScroll]);

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    if (onCommand) {
      onCommand(command);
    }
    setCommand("");
  };

  const getStatusColor = () => {
    const map = {
      online: "text-emerald-400",
      active: "text-emerald-400",
      starting: "text-purple-400",
      creating: "text-blue-400",
      offline: "text-gray-500",
      error: "text-rose-400",
    };
    return map[status] || "text-indigo-400";
  };

  return (
    <div
      className={`w-full transition-all duration-500 ${
        isExpanded ? "fixed inset-4 z-50 h-auto" : "relative h-[500px]"
      }`}
    >
      <div className="h-full bg-[#0d1117]/80 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col ring-1 ring-white/10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20" />
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <TerminalIcon size={14} className="text-gray-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                System Console <span className="text-white/20">|</span>{" "}
                <span className={getStatusColor()}>{status}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <Wifi size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">
                Live Stream
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div
          ref={containerRef}
          className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#090c10]/40"
          onScroll={(e) => {
            const bottom =
              e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
              e.currentTarget.clientHeight;
            setAutoScroll(bottom);
          }}
        >
          <div className="space-y-1.5 font-mono text-[13px] sm:text-[14px]">
            {/* System Info Boot Message */}
            <div className="text-indigo-400/60 pb-4 flex flex-col gap-1">
              <pre className="text-[10px] leading-none opacity-50">
                {`   _____  ___  ___  ___ _  _____ ___ _     
  / __| |/ _ \\|   \\| __| |/ / __/ __| |    
  \\__ \\ | (_) | |) | _|| ' <| _|| (__| |__  
  |___/_|\\___/|___/|___|_|\\_\\___|\\___|____|`}
              </pre>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">
                Samkiel OS v4.0.2-stable
              </span>
              <span className="text-[10px]">
                Kernel: Linux 5.15.0-87-generic x86_64
              </span>
            </div>

            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="group flex gap-4 transition-all hover:bg-white/5 -mx-2 px-2 py-0.5 rounded"
                >
                  <span className="text-gray-600/40 select-none shrink-0 w-12 text-right text-[10px] pt-1">
                    {i + 1}
                  </span>
                  <div className="flex gap-2 min-w-0">
                    <span className="text-emerald-500/50 select-none">$</span>
                    <span className="text-gray-300 break-all whitespace-pre-wrap leading-relaxed">
                      {log}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 border-t-indigo-500 animate-spin" />
                <p className="text-gray-500 font-mono text-xs animate-pulse lowercase tracking-widest">
                  Initializing stream pipeline...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
          <form
            onSubmit={handleCommandSubmit}
            className="flex items-center gap-3 bg-black/40 rounded-2xl px-5 py-3 border border-white/5 focus-within:border-indigo-500/30 transition-all group"
          >
            <ChevronRight
              size={18}
              className="text-indigo-500 group-focus-within:translate-x-1 transition-transform"
            />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Execute high-level command..."
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/20"
            />
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-1 rounded uppercase">
                ⏎ Enter
              </span>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default FriendlyTerminal;
