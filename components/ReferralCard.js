import { useState, useEffect } from "react";
import { Copy, Users, Gift, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function ReferralCard() {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, []);

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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm border border-indigo-200 dark:border-gray-600 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Gift className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Refer & Earn
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Invite friends and earn credits
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralData?.referralLink || ""}
            readOnly
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Copy size={16} />
            Copy
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <Users
            className="mx-auto mb-1 text-indigo-600 dark:text-indigo-400"
            size={20}
          />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {referralData?.totalReferrals || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Referrals</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <TrendingUp
            className="mx-auto mb-1 text-green-600 dark:text-green-400"
            size={20}
          />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {referralData?.totalCreditsEarned || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Credits Earned
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <Gift
            className="mx-auto mb-1 text-purple-600 dark:text-purple-400"
            size={20}
          />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">10</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Per Referral
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          How it works:
        </p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Share your referral link with friends</li>
          <li>• They sign up and get +35 credits (25 signup + 10 bonus)</li>
          <li>• You earn +10 credits for each successful referral</li>
        </ul>
      </div>
    </div>
  );
}
