import { useState, useEffect } from "react";
import { FaCrown, FaCalendar, FaArrowRight, FaTimes } from "react-icons/fa";
import { useRouter } from "next/router";

export default function SubscriptionCard() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing/subscription/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  const isFree = subscription?.accountType === "FREE";
  const isActive = subscription?.subscriptionStatus === "active";
  const daysRemaining = getDaysRemaining(subscription?.expiresAt);

  return (
    <div
      className={`rounded-xl shadow-lg p-6 ${
        isFree
          ? "bg-white dark:bg-gray-800"
          : "bg-gradient-to-br from-indigo-600 to-purple-600"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!isFree && <FaCrown className="text-yellow-300 text-2xl" />}
          <h3
            className={`text-xl font-bold ${
              isFree ? "text-gray-900 dark:text-white" : "text-white"
            }`}
          >
            {isFree ? "Free Plan" : subscription?.currentPlan?.displayName}
          </h3>
        </div>
        {!isFree && isActive && (
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
            ACTIVE
          </span>
        )}
      </div>

      {/* Account Limits */}
      <div className="mb-6">
        <h4
          className={`text-sm font-semibold mb-3 ${
            isFree ? "text-gray-700 dark:text-gray-300" : "text-white/90"
          }`}
        >
          Your Limits
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-lg ${
              isFree
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white/10 backdrop-blur-sm"
            }`}
          >
            <div
              className={`text-xs ${
                isFree ? "text-gray-600 dark:text-gray-400" : "text-white/70"
              }`}
            >
              Max Bots
            </div>
            <div
              className={`text-2xl font-bold ${
                isFree ? "text-gray-900 dark:text-white" : "text-white"
              }`}
            >
              {subscription?.limits?.maxBots || 1}
            </div>
          </div>
          <div
            className={`p-3 rounded-lg ${
              isFree
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white/10 backdrop-blur-sm"
            }`}
          >
            <div
              className={`text-xs ${
                isFree ? "text-gray-600 dark:text-gray-400" : "text-white/70"
              }`}
            >
              RAM per Bot
            </div>
            <div
              className={`text-2xl font-bold ${
                isFree ? "text-gray-900 dark:text-white" : "text-white"
              }`}
            >
              {subscription?.limits?.ramLimit || 300} MB
            </div>
          </div>
          <div
            className={`p-3 rounded-lg ${
              isFree
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white/10 backdrop-blur-sm"
            }`}
          >
            <div
              className={`text-xs ${
                isFree ? "text-gray-600 dark:text-gray-400" : "text-white/70"
              }`}
            >
              CPU
            </div>
            <div
              className={`text-2xl font-bold ${
                isFree ? "text-gray-900 dark:text-white" : "text-white"
              }`}
            >
              {subscription?.limits?.cpuLimit || 25}%
            </div>
          </div>
          <div
            className={`p-3 rounded-lg ${
              isFree
                ? "bg-gray-50 dark:bg-gray-900"
                : "bg-white/10 backdrop-blur-sm"
            }`}
          >
            <div
              className={`text-xs ${
                isFree ? "text-gray-600 dark:text-gray-400" : "text-white/70"
              }`}
            >
              Disk Space
            </div>
            <div
              className={`text-2xl font-bold ${
                isFree ? "text-gray-900 dark:text-white" : "text-white"
              }`}
            >
              {subscription?.limits?.diskLimit || 500} MB
            </div>
          </div>
        </div>
      </div>

      {/* Expiration Info */}
      {!isFree && isActive && subscription?.expiresAt && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            daysRemaining <= 7
              ? "bg-yellow-500/20 border border-yellow-500/30"
              : "bg-white/10 backdrop-blur-sm"
          }`}
        >
          <FaCalendar
            className={daysRemaining <= 7 ? "text-yellow-300" : "text-white"}
          />
          <div>
            <div
              className={`text-xs ${
                daysRemaining <= 7 ? "text-yellow-200" : "text-white/70"
              }`}
            >
              {daysRemaining <= 7 ? "Expires Soon" : "Expires On"}
            </div>
            <div className="text-sm font-semibold text-white">
              {formatDate(subscription.expiresAt)}
              {daysRemaining !== null && (
                <span className="ml-2">({daysRemaining} days left)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      {isFree ? (
        <button
          onClick={() => router.push("/pricing")}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
        >
          Upgrade to Premium
          <FaArrowRight />
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/pricing")}
            className="flex-1 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Change Plan
          </button>
          {isActive && (
            <button
              onClick={async () => {
                if (
                  confirm(
                    "Are you sure you want to cancel your subscription? You'll lose premium features."
                  )
                ) {
                  try {
                    const token = localStorage.getItem("token");
                    await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL}/api/billing/subscription/cancel`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                    fetchSubscription();
                  } catch (error) {
                    console.error("Failed to cancel subscription:", error);
                  }
                }
              }}
              className="py-3 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
              title="Cancel Subscription"
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
