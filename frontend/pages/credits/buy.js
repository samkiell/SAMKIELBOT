import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { FaCoins, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function BuyCredits() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchPackages();
    }
  }, [user, authLoading]);

  const fetchPackages = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/credits/packages`
      );
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (index) => {
    setProcessing(index);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/credits/purchase/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageIndex: index }),
        }
      );

      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.authorizationUrl;
      } else {
        alert(data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to initialize payment");
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Buy Credits - SAMKIEL BOT</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Buy Credits
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a package to top up your credits
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    pkg.popular
                      ? "border-4 border-indigo-500 transform scale-105"
                      : "border-2 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {pkg.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        POPULAR
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <FaCoins className="text-5xl md:text-6xl text-yellow-500 mx-auto mb-4" />
                    <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                      {pkg.credits}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Credits
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="text-2xl md:text-3xl font-bold text-indigo-600">
                      ₦{pkg.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ₦{(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(index)}
                    disabled={processing === index}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing === index ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      "Buy Now"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              How Credits Work
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                <p>
                  <strong>Bot Creation:</strong> 50 credits + resource upgrades
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                <p>
                  <strong>Daily Usage:</strong> 2-5 credits per day based on
                  resources
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                <p>
                  <strong>Never Expire:</strong> Your credits never expire
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                <p>
                  <strong>Secure Payment:</strong> Powered by Paystack
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
