import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/router";
import {
  FaCheck,
  FaRocket,
  FaStar,
  FaCrown,
  FaArrowRight,
} from "react-icons/fa";

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing/plans`
      );
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setProcessingPlan(planId);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/billing/subscription/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorizationUrl;
      } else {
        alert(data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Failed to initialize payment");
    } finally {
      setProcessingPlan(null);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case "Starter":
        return <FaRocket className="text-4xl text-blue-500" />;
      case "Pro":
        return <FaStar className="text-4xl text-purple-500" />;
      case "Max":
        return <FaCrown className="text-4xl text-yellow-500" />;
      default:
        return <FaRocket className="text-4xl text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Head>
        <title>Pricing - SAMKIEL BOT</title>
        <meta
          name="description"
          content="Choose the perfect plan for your WhatsApp bot needs. Free forever or upgrade to premium."
        />
      </Head>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋
          </Link>
          <div className="flex gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="px-6 py-16 text-center">
        <motion.div {...fadeUp}>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            Start free forever. Upgrade anytime to unlock premium features and
            higher limits.
          </p>
          <div className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-green-700 dark:text-green-300 font-semibold">
              ✨ No credit card required for free plan
            </span>
          </div>
        </motion.div>
      </section>

      {/* Free Plan */}
      <section className="px-6 pb-12 max-w-7xl mx-auto">
        <motion.div
          {...fadeUp}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Free Plan
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Perfect for trying out SAMKIEL BOT
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                ₦0
              </div>
              <div className="text-sm text-gray-500">Forever free</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                1 bot maximum
              </span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                300 MB RAM
              </span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                25% CPU allocation
              </span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                500 MB disk space
              </span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                Community support
              </span>
            </div>
            <div className="flex items-start gap-3">
              <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                Basic features
              </span>
            </div>
          </div>
          <Link
            href="/register"
            className="block w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            Get Started Free
          </Link>
        </motion.div>
      </section>

      {/* Premium Plans */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Premium Plans
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Unlock more bots and higher resource limits
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <motion.div
                key={plan._id}
                {...fadeUp}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative ${
                  plan.isRecommended
                    ? "border-4 border-indigo-500 transform scale-105"
                    : "border-2 border-gray-200 dark:border-gray-700"
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>

                <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    ₦{plan.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan._id)}
                  disabled={processingPlan === plan._id}
                  className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    plan.isRecommended
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingPlan === plan._id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! You can upgrade to any premium plan at any time. If your
                subscription expires, you'll be automatically downgraded to the
                free plan.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                What happens to my bots if I downgrade?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                If you downgrade to free and have more than 1 bot, your oldest
                bots will be suspended. You can reactivate them by upgrading
                again.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                How do I pay?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We use Paystack for secure payments. You can pay with cards,
                bank transfers, and other payment methods supported in Nigeria.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
