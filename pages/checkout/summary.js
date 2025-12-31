import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import {
  ShieldCheck,
  CreditCard,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutSummary() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { packageId } = router.query;

  const [loading, setLoading] = useState(true); // Initial load
  const [calculating, setCalculating] = useState(false); // Quote calculation
  const [items, setItems] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [quote, setQuote] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Supported Currencies
  const currencies = [
    { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
    { code: "USD", name: "US Dollar", flag: "🇺🇸" },
    { code: "GBP", name: "British Pound", flag: "🇬🇧" },
    { code: "EUR", name: "Euro", flag: "🇪🇺" },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Fetch package details to show initially (using static list or finding from generic packages endpoint)
  // For simplicity, we trigger the quote generation immediately which returns the item details we need
  useEffect(() => {
    if (packageId && user) {
      generateQuote(selectedCurrency);
    }
  }, [packageId, selectedCurrency, user]);

  // Timer logic
  useEffect(() => {
    if (!quote || !quote.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = new Date(quote.expiresAt) - new Date();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quote]);

  const generateQuote = async (currency) => {
    setCalculating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/quote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageId, currency }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setQuote(data.data);
      } else {
        toast.error(data.message || "Failed to generate quote");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setCalculating(false);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!quote) return;

    if (timeLeft <= 0) {
      toast.error("Quote expired. Refreshing...");
      generateQuote(selectedCurrency);
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quoteId: quote._id }),
        }
      );
      const data = await res.json();

      if (data.success) {
        window.location.href = data.data.authorization_url;
      } else {
        toast.error(data.message || "Payment initialization failed");
        setProcessing(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Payment failed to start");
      setProcessing(false);
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms < 0) return "00:00";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!quote)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load checkout</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white font-sans">
      <Head>
        <title>Checkout Summary - SAMKIEL BOT</title>
      </Head>

      <Navbar />

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-500 hover:text-indigo-400 transition-colors mb-4"
          >
            <ArrowRight className="rotate-180 mr-2 w-4 h-4" />
            Back directly to packages
          </button>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <CreditCard className="text-indigo-500" />
            Checkout Summary
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Review your order details and select your preferred currency.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Item Card */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard size={100} />
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                Item Details
              </h3>
              <div className="flex items-center justify-between z-10 relative">
                <div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {quote.items[0].credits} Credits
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 text-xs rounded-full">
                      One-time
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Refill for bot deployments and maintenance fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Globe size={16} />
                Select Payment Currency
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCurrency(c.code)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                      selectedCurrency === c.code
                        ? "border-indigo-500 bg-indigo-500/5 text-indigo-500 ring-1 ring-indigo-500"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-2xl mb-2">{c.flag}</span>
                    <span className="font-bold">{c.code}</span>
                    <span className="text-[10px] text-gray-500">{c.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle
                  className="text-yellow-500 shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                  <strong>Note:</strong> We explicitly process payments through
                  Paystack. If you select <strong>{selectedCurrency}</strong>,
                  the final charge will be in
                  <strong> {quote.processingCurrency}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / breakdown */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl shadow-indigo-500/5">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={16} />
                    <span>Rate expires in:</span>
                  </div>
                  <div
                    className={`font-mono font-bold ${
                      timeLeft < 60000
                        ? "text-red-500 animate-pulse"
                        : "text-indigo-500"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                    <span>Base Price (NGN)</span>
                    <span>{formatCurrency(quote.subtotalNgn, "NGN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                    <span
                      className="flex items-center gap-1 cursor-help"
                      title={`Rate: 1 ${quote.selectedCurrency} ≈ ${(
                        1 / quote.exchangeRate
                      ).toFixed(2)} NGN`}
                    >
                      Exchange Rate <AlertCircle size={10} />
                    </span>
                    <span className="font-mono text-xs text-gray-400">
                      {quote.exchangeRate.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">
                      Subtotal ({quote.selectedCurrency})
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        quote.subtotalConverted,
                        quote.selectedCurrency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    <span>Tax (8.5%)</span>
                    <span>
                      {formatCurrency(quote.taxAmount, quote.selectedCurrency)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <div className="text-right">
                      <span className="block font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                        {formatCurrency(
                          quote.totalAmount,
                          quote.selectedCurrency
                        )}
                      </span>
                      {quote.processingCurrency !== quote.selectedCurrency && (
                        <span className="text-[10px] text-gray-400 font-mono block mt-1">
                          ~{" "}
                          {formatCurrency(
                            quote.paystackChargeAmount || 0,
                            quote.processingCurrency
                          )}{" "}
                          billed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || calculating || timeLeft <= 0}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="animate-spin" /> Processing...
                    </>
                  ) : calculating ? (
                    <>
                      <RefreshCw className="animate-spin" /> Calculating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck /> Pay Securely
                    </>
                  )}
                </button>

                <div className="mt-4 flex justify-center items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck size={12} />
                  <span>
                    Secured by{" "}
                    {quote.provider === "flutterwave"
                      ? "Flutterwave"
                      : "Paystack"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
