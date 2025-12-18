import { useState, useEffect } from "react";
import { Gift, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DailyClaimButton({ onClaimSuccess }) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState({
    canClaim: false,
    nextClaimTime: null,
  });
  const [targetTime, setTargetTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!targetTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, targetTime - now);
      setTimeLeft(remaining);
      if (remaining === 0) fetchStatus();
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/credits/balance?t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (data.success && data.data.dailyClaim) {
        setClaimStatus(data.data.dailyClaim);

        if (
          !data.data.dailyClaim.canClaim &&
          data.data.dailyClaim.nextClaimTime
        ) {
          const nextTime = new Date(
            data.data.dailyClaim.nextClaimTime
          ).getTime();
          setTargetTime(nextTime);
        } else {
          setTargetTime(null);
        }
      }
    } catch (error) {
      console.error("Error fetching claim status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/daily-claim`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setClaimStatus({
          canClaim: false,
          nextClaimTime: data.data.nextClaimTime,
        });

        // Start countdown
        const nextTime = new Date(data.data.nextClaimTime).getTime();
        setTargetTime(nextTime);

        if (onClaimSuccess) onClaimSuccess();
      } else {
        toast.error(data.message);
        // Refresh status in case of desync
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
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded-lg"></div>
    );
  }

  if (claimStatus.canClaim) {
    return (
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {claiming ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <Gift className="w-5 h-5" />
        )}
        <span>Claim 5 Credits</span>
      </button>
    );
  }

  return (
    <button
      disabled
      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-700 cursor-not-allowed"
    >
      <Clock className="w-5 h-5" />
      <span>Next in {formatTime(timeLeft)}</span>
    </button>
  );
}
