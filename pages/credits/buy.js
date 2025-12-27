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
              className="text-lg text-gray-600 dark:text-gray-400"
            >
              Select a credit package below. Credits cover deployment fees and
              daily server maintenance.
            </motion.p>
            {meta && meta.isSupported === false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm"
              >
                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <p>
                  Your local currency ({meta.detectedLocalCurrency}) is not
                  directly supported by our payment processor. Prices have been
                  converted to <strong>{meta.currency}</strong> for your
                  convenience.
                </p>
              </motion.div>
            )}
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

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
            <Zap className="text-amber-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-3">Instant Activation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Credits are added to your account immediately after successful
              payment via Paystack.
            </p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
            <Shield className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All transactions are encrypted and processed securely. We never
              store your card details.
            </p>
          </div>
          <div className="bg-white/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
            <Server className="text-indigo-500 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-3">Low Maintenance</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Only burn credits when your bots are active. Stop a bot to pause
              his credit consumption.
            </p>
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
