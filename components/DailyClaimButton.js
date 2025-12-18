import { useState, useEffect, useCallback } from "react";
import { Gift, Clock, Loader2, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function DailyClaimButton({ onClaimSuccess }) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState({
    canClaim: false,
    nextClaimTime: null,
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchStatus = useCallback(async (retry = 0) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/credits/balance?t=${Date.now()}&mode=btn`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
      const data = await res.json();

      if (data.success && data.data.dailyClaim) {
        setClaimStatus(data.data.dailyClaim);

        if (
          !data.data.dailyClaim.canClaim &&
          data.data.dailyClaim.nextClaimTime
        ) {
          const next = new Date(data.data.dailyClaim.nextClaimTime).getTime();
          const now = Date.now();
          const diff = next - now;

          if (diff <= 1000 && retry < 2) {
            setTimeout(() => fetchStatus(retry + 1), 2000);
          }

          setTimeLeft(Math.max(0, diff));
        } else {
          setTimeLeft(0);
        }
      }
    } catch (error) {
      console.error("Error fetching claim status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Timer Effect
  useEffect(() => {
    if (claimStatus.canClaim || !claimStatus.nextClaimTime) {
      setTimeLeft(0);
      return;
    }

    const timer = setInterval(() => {
      const next = new Date(claimStatus.nextClaimTime).getTime();
      const now = Date.now();
      const diff = next - now;

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        fetchStatus();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [claimStatus.canClaim, claimStatus.nextClaimTime, fetchStatus]);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/credits/daily-claim", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message, { icon: "🎁" });
        setClaimStatus({
          canClaim: false,
          nextClaimTime: data.data.nextClaimTime,
        });
        if (onClaimSuccess) onClaimSuccess();
      } else {
        toast.error(data.message);
        fetchStatus();
      }
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Failed to claim credits. Try again.");
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  if (loading) {
    return (
      <div className="h-11 w-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"></div>
    );
  }

  if (claimStatus.canClaim) {
    return (
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="relative group overflow-hidden flex items-center gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></div>
        {claiming ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <Gift className="w-5 h-5 animate-bounce-slight" />
        )}
        <span className="whitespace-nowrap">Claim Day Benefit</span>

        <style jsx>{`
          @keyframes bounce-slight {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }
          .animate-bounce-slight {
            animation: bounce-slight 2s infinite;
          }
        `}</style>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-inner group transition-all duration-300 relative">
      <Clock className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">
          Next Reward
        </span>
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300 font-medium tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>
      <button
        onClick={() => fetchStatus()}
        className="ml-2 p-1 text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <RefreshCcw className="w-3 h-3" />
      </button>
    </div>
  );
}
