import { useState, useEffect } from "react";
import { FaCoins, FaShoppingCart } from "react-icons/fa";
import { useRouter } from "next/router";

export default function CreditBalance({ showBuyButton = true }) {
  const router = useRouter();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/credits/balance?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setCredits(data.data.credits);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-5 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const isLow = credits < 50;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg border border-white/10 ${
          isLow
            ? "bg-gradient-to-r from-red-600 to-rose-700 text-white"
            : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
        }`}
      >
        <FaCoins className="text-white" />
        <span className="font-bold text-white">
          {Math.round(credits)} Credits
        </span>
      </div>
      {showBuyButton && (
        <button
          onClick={() => router.push("/credits/buy")}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 border border-white/10"
        >
          <FaShoppingCart className="text-white" />
          <span className="hidden sm:inline text-white">Buy Credits</span>
        </button>
      )}
    </div>
  );
}
