import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Footer from "../components/Footer";
import BotCard from "../components/BotCard";
import StatsOverview from "../components/StatsOverview";
import ReferralCard from "../components/ReferralCard";
import { getDeployments, verifyPayment } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Plus, Gift } from "lucide-react";
import toast from "react-hot-toast";
import CreditBalance from "../components/CreditBalance";
import DailyClaimButton from "../components/DailyClaimButton";

export default function Dashboard() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Handle payment verification on return from Paystack
  useEffect(() => {
    const handlePaymentVerification = async () => {
      const { payment, reference } = router.query;

      if (payment === "success" && reference && !verifyingPayment) {
        setVerifyingPayment(true);

        const verificationToast = toast.loading("Verifying payment...");

        try {
          const result = await verifyPayment(reference);

          if (result.success) {
            toast.success(
              `Payment successful! ${result.data.credits} credits added to your account.`,
              { id: verificationToast, duration: 5000 }
            );

            // Refresh user data to update credit balance
            if (refreshUser) {
              await refreshUser();
            }
            setRefreshKey((prev) => prev + 1);
          } else {
            toast.error(result.message || "Payment verification failed", {
              id: verificationToast,
            });
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error(
            error.response?.data?.message || "Failed to verify payment",
            { id: verificationToast }
          );
        } finally {
          setVerifyingPayment(false);

          // Clean up URL by removing query parameters
          router.replace("/dashboard", undefined, { shallow: true });
        }
      }
    };

    if (router.isReady && user) {
      handlePaymentVerification();
    }
  }, [router.isReady, router.query, user, verifyingPayment, refreshUser]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    console.log("[Dashboard] Checking verification status:", {
      user: user?.username,
      isEmailVerified: user?.isEmailVerified,
      isPhoneVerified: user?.isPhoneVerified,
    });

    if (user && !user.isEmailVerified && !user.isPhoneVerified) {
      console.warn("[Dashboard] User not verified, redirecting to /verify");
      router.push("/verify");
      return;
    }

    if (user) {
      fetchDeployments();
    }
  }, [user, authLoading, router]);

  const fetchDeployments = async () => {
    try {
      const data = await getDeployments();
      setDeployments(data);
    } catch (error) {
      console.error("Error fetching deployments:", error);
    } finally {
      setLoading(false);
    }
  };

  const onClaimSuccess = async () => {
    if (refreshUser) await refreshUser();
    setRefreshKey((prev) => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 py-8 pt-24 md:pt-32 min-h-screen">
        {/* Header Section with Credits */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              Welcome back, {user.username} 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Manage and monitor your bot deployments easily.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CreditBalance key={refreshKey} />
            <Link
              href="/deploy"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-white shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              Deploy Bot
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview deployments={deployments} />

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading deployments...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deployments.map((deployment) => (
              <BotCard
                key={deployment._id}
                deployment={deployment}
                refreshData={fetchDeployments}
              />
            ))}
            {deployments.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700/40 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    No deployments yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first bot deployment to get started!
                  </p>
                  <Link
                    href="/deploy"
                    className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg font-semibold transition-all duration-200"
                  >
                    Deploy Your First Bot
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketing & Rewards Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ReferralCard />

          <div className="relative group overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
              <Gift size={120} className="rotate-12" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Daily Bonus
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-[240px]">
                Loyalty pays off. Claim your daily free credits and keep your
                instances alive without spending a dime.
              </p>

              <div className="flex items-center gap-4">
                <DailyClaimButton onClaimSuccess={onClaimSuccess} />
                <Link
                  href="/credits/claim"
                  className="text-xs text-indigo-500 hover:text-indigo-400 underline font-medium"
                >
                  View claim history
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
