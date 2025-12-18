import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Gift, Clock, Loader2, Award, Calendar } from "lucide-react";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import Snowfall from "../../components/Snowfall";

export default function ClaimCredits() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState({
    canClaim: false,
    nextClaimTime: null,
    lastClaim: null,
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchStatus = useCallback(async (retry = 0) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/credits/balance?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data.dailyClaim) {
        const status = data.data.dailyClaim;
        setClaimStatus(status);

        if (!status.canClaim && status.nextClaimTime) {
          const next = new Date(status.nextClaimTime).getTime();
          const now = Date.now();
          const diff = next - now;

          // If server says we can't claim but timer is zero or very close,
          // might be a slight clock desync. Retry once after 2 seconds.
          if (diff <= 1000 && retry < 2) {
            setTimeout(() => fetchStatus(retry + 1), 2000);
          }

          setTimeLeft(Math.max(0, diff));
        } else {
          setTimeLeft(0);
        }
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchStatus();
    }
  }, [user, authLoading, router, fetchStatus]);

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
        fetchStatus(); // Refresh to enable button
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
          lastClaim: new Date().toISOString(),
        });
        if (refreshUser) refreshUser();
      } else {
        toast.error(data.message);
        fetchStatus();
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return "0h 0m 0s";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300">
      <Head>
        <title>Daily Rewards - SAMKIEL BOT</title>
      </Head>
      <Navbar />
      <Snowfall />

      <main className="relative z-10 container mx-auto px-4 py-8 pt-24">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Dashboard
        </Link>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Daily Rewards
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Come back every day to claim free credits for your bots.
            </p>
          </div>

          {/* Claim Card */}
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 p-8 md:p-12 text-center relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                  claimStatus.canClaim
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30 scale-110 animate-pulse"
                    : "bg-gray-200 dark:bg-slate-700"
                }`}
              >
                {claimStatus.canClaim ? (
                  <Gift className="w-12 h-12 text-white" />
                ) : (
                  <Clock className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {claimStatus.canClaim
                ? "Your Reward is Ready!"
                : "Come Back Tomorrow"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {claimStatus.canClaim
                ? "Claim your daily check-in bonus to keep your bots running."
                : "You've already claimed your credits for today."}
            </p>

            {claimStatus.canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
              >
                {claiming ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6" />
                    Claim 5 Credits
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                <div className="bg-gray-100 dark:bg-slate-900/50 rounded-xl p-4 w-full max-w-sm border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">
                    Next Reward In
                  </p>
                  <p className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatTime(timeLeft)}
                  </p>
                </div>
                {claimStatus.lastClaim && (
                  <p className="text-xs text-gray-400 font-mono italic">
                    Last rewarded:{" "}
                    {new Date(claimStatus.lastClaim).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats / Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Daily Bonus
                </p>
                <p className="text-xl font-bold">+5 Credits</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reset Time
                </p>
                <p className="text-xl font-bold">00:00 UTC</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
