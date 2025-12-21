import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useAuth } from "../lib/auth";

export default function Verify() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { user, token, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    // If not logged in, redirect to login
    if (!token) {
      router.replace("/login");
      return;
    }

    // If user is already verified, prohibit access to /verify
    if (user && (user.isEmailVerified || user.isPhoneVerified)) {
      router.replace("/dashboard");
    }
  }, [user, token, authLoading, router]);

  if (authLoading || (user && (user.isEmailVerified || user.isPhoneVerified))) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      return toast.error("Please enter a valid 6-digit code.");
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Welcome ${user?.username}!`);
        const updatedUser = await refreshUser();

        // If refreshUser returns the updated user, we can immediately check it
        if (
          updatedUser &&
          (updatedUser.isEmailVerified || updatedUser.isPhoneVerified)
        ) {
          router.replace("/dashboard");
        } else {
          router.replace("/dashboard");
        }
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (type) => {
    setResending(true);
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`OTP sent to your ${type}!`);
      } else {
        toast.error(data.message || `Failed to send OTP to ${type}`);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <Head>
        <title>Verify Account - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Verify Account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to your email or phone to activate your
            account.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-4xl tracking-widest font-bold py-4 bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 rounded-xl text-gray-900 dark:text-white focus:outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 ${
              loading || code.length !== 6
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02]"
            }`}
          >
            {loading ? "Verifying..." : "Verify Now"}
          </button>
        </form>

        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Didn't receive the code?
          </p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleResend("email")}
              disabled={resending}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Resend to Email
            </button>
            {/* Phone resend logic can be added here if implemented */}
          </div>
        </div>
      </div>
    </div>
  );
}
