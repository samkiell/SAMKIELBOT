import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";
import { Copy, Users, Gift, TrendingUp, Calendar } from "lucide-react";
import toast from "react-hot-toast";

import Skeleton, {
  StatCardSkeleton,
  TableSkeleton,
} from "../components/Skeleton";

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchReferralStats();
    }
  }, [user, authLoading, router]);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/credits/referral/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setReferralData(data.data);
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      toast.success("Referral link copied!");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300">
        <Head>
          <title>Referrals - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        </Head>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <TableSkeleton rows={3} cols={4} />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Referrals - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Refer & Earn 🎁
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Invite friends and earn credits together
          </p>
        </div>

        {/* Referral Link Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Gift size={32} />
            <div>
              <h2 className="text-2xl font-bold">Your Referral Link</h2>
              <p className="text-indigo-100">Share this link to earn credits</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={referralData?.referralLink || ""}
              readOnly
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 min-w-0"
            />
            <button
              onClick={copyReferralLink}
              className="px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Copy size={20} />
              Copy Link
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-indigo-100 mb-1">Signup Bonus</p>
              <p className="text-2xl font-bold">+25 Credits</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-indigo-100 mb-1">Referral Bonus</p>
              <p className="text-2xl font-bold">+10 Credits</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-indigo-100 mb-1">You Earn</p>
              <p className="text-2xl font-bold">+10 Credits</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Users
                  className="text-indigo-600 dark:text-indigo-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Referrals
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {referralData?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp
                  className="text-green-600 dark:text-green-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Credits Earned
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {referralData?.totalCreditsEarned || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Gift
                  className="text-purple-600 dark:text-purple-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Per Referral
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  1
                </span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Share Your Link
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copy your unique referral link and share it with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  2
                </span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                They Sign Up
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your friend creates an account and gets 35 credits (25 + 10
                bonus)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  3
                </span>
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
                You Both Win
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You earn 10 credits instantly for each successful referral
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Referral History
          </h3>

          {referralData?.referrals && referralData.referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {referralData.referrals.map((referral, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {referral.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {referral.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(referral.joinedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          ✓ Credited
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No referrals yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Start sharing your referral link to earn credits!
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
