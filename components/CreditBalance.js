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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isLow
            ? "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
            : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
        }`}
      >
        <FaCoins className={isLow ? "text-red-600 dark:text-red-400" : ""} />
        <span
          className={`font-bold ${
            isLow ? "text-red-700 dark:text-red-300" : ""
          }`}
        >
          {Math.round(credits)} Credits
        </span>
      </div>
      {showBuyButton && (
        <button
          onClick={() => router.push("/credits/buy")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <FaShoppingCart />
          <span className="hidden sm:inline">Buy Credits</span>
        </button>
      )}
    </div>
  );
}
