import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import Snowfall from "../../components/Snowfall";
import {
  Check,
  Zap,
  Server,
  Shield,
  CreditCard,
  HelpCircle,
  ArrowLeft,
  Coins,
  Info,
} from "lucide-react";
import Skeleton from "../../components/Skeleton";
import toast from "react-hot-toast";

export default function BuyCredits() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ currency: "NGN" });

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchPackages();
      fetchHistory();
    }
  }, [user, authLoading]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/credits/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistory(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      // Trying to fetch from the payment packages endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/packages`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPackages(data.data);
          if (data.meta) {
            setMeta(data.meta);
          }
          return;
        }
      }

      // Fallback if API fails
      setPackages([
        { id: "p1", credits: 50, price: 500, popular: false, currency: "NGN" },
        { id: "p2", credits: 120, price: 1000, popular: true, currency: "NGN" },
        {
          id: "p3",
          credits: 260,
          price: 2000,
          popular: false,
          currency: "NGN",
        },
        {
          id: "p4",
          credits: 700,
          price: 5000,
          popular: false,
          currency: "NGN",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    setProcessing(pkg._id || pkg.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageId: pkg._id || pkg.id }),
        }
      );

      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.authorization_url;
      } else {
        toast.error(data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize payment");
    } finally {
      setProcessing(null);
    }
  };

  const truncateString = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const getTransactionIcon = (type, amount) => {
    if (amount > 0)
      return (
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
          <Zap size={16} />
        </div>
      );
    return (
      <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
        <CreditCard size={16} />
      </div>
    );
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300">
      <Head>
        <title>Buy Credits - SAMKIEL BOT</title>
        <meta
          name="description"
          content="Top up your account with credits to power your WhatsApp bots."
        />
      </Head>

      <Navbar />
      <Snowfall />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 text-indigo-500 hover:text-indigo-400 font-medium transition-all mb-6 w-fit"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Dashboard
          </Link>
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-extrabold mb-4"
            >
              Power Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                AI Bots
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-400 mb-4"
            >
              Select a credit package below. Credits cover deployment fees and
              daily server maintenance.
            </motion.p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/how-billing-works"
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-500 hover:text-indigo-400 bg-indigo-500/5 px-4 py-2 rounded-full border border-indigo-500/20"
                >
                  <Info size={16} />
                  How Billing Works
                </Link>
              </motion.div>
              <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Active Wallet
                </span>
                <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {Math.round(user.credits)} Credits
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
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
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))
            : packages.map((pkg, idx) => (
                <motion.div
                  key={idx}
                  variants={item}
                  className={`relative group p-8 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:-translate-y-2 ${
                    pkg.popular
                      ? "bg-gradient-to-b from-indigo-600/10 to-purple-600/10 border-indigo-500 shadow-xl shadow-indigo-500/10"
                      : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:shadow-lg"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-lg">
                      BEST VALUE
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div
                        className={`p-4 rounded-2xl ${
                          pkg.popular
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-slate-700 text-indigo-500"
                        }`}
                      >
                        <Coins size={32} />
                      </div>
                    </div>
                    <div className="text-5xl font-bold mb-2">{pkg.credits}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credits
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {pkg.currency === "NGN"
                        ? "₦"
                        : pkg.currency === "USD"
                        ? "$"
                        : pkg.currency === "ZAR"
                        ? "R"
                        : pkg.currency === "GHS"
                        ? "GH₵"
                        : pkg.currency === "KES"
                        ? "KSh"
                        : ""}
                      {pkg.price.toLocaleString(undefined, {
                        minimumFractionDigits: pkg.currency === "NGN" ? 0 : 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        {pkg.currency}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>One-click Deployment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>24/7 Cloud Hosting</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0" size={18} />
                      <span>Premium Features Access</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={processing === (pkg._id || pkg.id)}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing === (pkg._id || pkg.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Buy Now
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
        </motion.div>

        {/* Transaction History Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <TrendingUp className="text-indigo-500" size={20} />
              </div>
              Wallet History
            </h2>
            {history.length > 0 && (
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                {history.length} Recent entries
              </span>
            )}
          </div>

          <div className="bg-[#161b2c]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {historyLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm font-medium">
                  Decrypting transaction ledger...
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <CreditCard className="text-gray-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-2">
                  No Transactions Found
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Your transaction history is empty. Purchase credits or claim
                  rewards to see activity here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                      <th className="px-8 py-5">Transaction</th>
                      <th className="px-8 py-5">Context</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5 text-right">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {history.map((tx, idx) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {getTransactionIcon(tx.type, tx.amount)}
                            <div>
                              <div className="font-bold text-gray-200 group-hover:text-white transition-colors">
                                {tx.description}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">
                                {tx.type.replace("_", " ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {tx.deployment ? (
                            <div className="flex items-center gap-2">
                              <Server size={12} className="text-indigo-400" />
                              <span className="text-xs font-bold text-gray-400">
                                {tx.deployment.botName}
                              </span>
                            </div>
                          ) : tx.referredUser ? (
                            <div className="flex items-center gap-2">
                              <Users size={12} className="text-purple-400" />
                              <span className="text-xs font-bold text-gray-400">
                                {tx.referredUser.username}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-bold text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono mt-1">
                            {new Date(tx.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div
                            className={`text-sm font-black ${
                              tx.amount > 0 ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1">
                            Bal: {Math.round(tx.balanceAfter)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                q: "What are credits used for?",
                a: "Credits are the currency of SAMKIEL BOT. They are used to pay the one-time deployment fee (50 credits) and the small daily hosting fee (2-5 credits).",
              },
              {
                q: "Do I get a refund if my bot fails?",
                a: "Yes! If the deployment fails at our end, your credits are automatically refunded to your account balance.",
              },
              {
                q: "Can I transfer credits?",
                a: "Currently, credits are non-transferable and are tied to the account that purchased them.",
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
