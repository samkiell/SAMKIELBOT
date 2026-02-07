import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import Navbar from "../components/Navbar";
import {
  Check,
  Zap,
  Server,
  Shield,
  CreditCard,
  HelpCircle,
} from "lucide-react";

import Skeleton from "../components/Skeleton";

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      // Try fetching from credits API first
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/credits/packages`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPackages(data.data);
          return;
        }
      }

      // Fallback manual packages if API fails or is empty (for dev/presentation)
      setPackages([
        { credits: 50, price: 500, popular: false },
        { credits: 120, price: 1000, popular: true },
        { credits: 260, price: 2000, popular: false },
        { credits: 700, price: 5000, popular: false },
      ]);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (user) {
      router.push("/credits/buy");
    } else {
      router.push("/register");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300">
      <Head>
        <title>Pricing & Credits | 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        <meta
          name="description"
          content="Flexible credit-based pricing for your WhatsApp bots. Pay only for what you use with 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋."
        />
      </Head>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 pt-4 md:pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Pay As You Go
            </span>{" "}
            Power
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-400 mb-8"
          >
            No monthly subscriptions. Purchase credits and only burn what your
            bots use. Simple, transparent, and flexible.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20"
        >
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-100 dark:border-slate-700"
                >
                  <Skeleton className="h-12 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto mb-12" />
                  <Skeleton className="h-10 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto mb-12" />
                  <div className="space-y-4 mb-12">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))
            : packages.map((pkg, idx) => (
                <motion.div
                  key={idx}
                  variants={item}
                  className={`relative group p-8 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:-translate-y-2 ${
                    pkg.popular
                      ? "bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-indigo-500/50 shadow-xl shadow-indigo-500/10"
                      : "bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:shadow-lg"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold mb-2">{pkg.credits}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₦{pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ₦{(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>Create and run bots</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>Upgrade resources (RAM/CPU)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>Credits never expire</span>
                    </li>
                  </ul>

                  <button
                    onClick={handleAction}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    }`}
                  >
                    Buy Credits
                  </button>
                </motion.div>
              ))}
        </motion.div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How Credit Billing Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Understand where your credits go
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">One-Time Creation Fee</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Deploying a new bot costs a standard fee of{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  50 credits
                </span>
                . This covers the initial server setup and configuration.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Daily Usage Burn</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Active bots consume about{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  2-5 credits/day
                </span>{" "}
                depending on their resource usage (RAM/CPU). Offline bots don't
                consume credits.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                <Server size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Resource Upgrades</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Need more power? Upgrading RAM or CPU consumes additional
                credits daily. You specificy exactly what your bot needs.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Do my credits expire?",
                a: "No, your purchased credits never expire. They stay in your account until you use them.",
              },
              {
                q: "Can I get a refund?",
                a: "Since credits are digital goods, we generally do not offer refunds once they are used for deployment. However, if you haven't used them, contact support.",
              },
              {
                q: "What happens if I run out of credits?",
                a: "We'll send you a warning when you're low. If you reach 0 credits, your active bots will be suspended until you top up.",
              },
              {
                q: "Do I pay for stopped bots?",
                a: "No! If you stop your bot from the dashboard, it stops consuming daily credits.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700"
              >
                <div className="flex gap-4">
                  <HelpCircle
                    className="text-indigo-500 shrink-0 mt-1"
                    size={20}
                  />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
