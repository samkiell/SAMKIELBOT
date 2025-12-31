import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyPayment() {
  const router = useRouter();
  const { status, tx_ref, reference, transaction_id, provider } = router.query;
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, failed, cancelled
  const [message, setMessage] = useState("Verifying your payment...");
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    // Handle Flutterwave "cancelled" status directly from URL
    if (status === "cancelled") {
      setVerificationStatus("cancelled");
      setVerifying(false);
      return;
    }

    const verifyTransaction = async () => {
      // Use tx_ref (Flutterwave) or reference (Paystack)
      const ref = tx_ref || reference;

      if (!ref) {
        setVerificationStatus("failed");
        setMessage("Invalid transaction reference found.");
        setVerifying(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        // For Flutterwave, we might want to pass transaction_id if available, but our backend generic verifier takes reference
        // We can append transaction_id to query if needed, but let's stick to reference first as per our unified controller
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payments/verify?reference=${ref}${
            transaction_id ? `&transaction_id=${transaction_id}` : ""
          }`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.success) {
          setVerificationStatus("success");
          setPaymentData(data.data);
          toast.success("Payment verified successfully!");
        } else {
          setVerificationStatus("failed");
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error(error);
        setVerificationStatus("failed");
        setMessage("Network error occurred during verification.");
      } finally {
        setVerifying(false);
      }
    };

    verifyTransaction();
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center transition-all duration-300">
        {/* LOADING STATE */}
        {verifying && (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we confirm your transaction...
            </p>
          </div>
        )}

        {/* CANCELLED STATE */}
        {!verifying && verificationStatus === "cancelled" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Cancelled
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              It looks like you cancelled the payment process. No worries, no
              charges were made.
            </p>
            <div className="flex gap-4 w-full">
              <Link
                href="/checkout/summary"
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => router.back()} // Basic attempt to go back
              >
                Try Again
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!verifying && verificationStatus === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your account has been credited with{" "}
              <span className="font-bold text-indigo-500">
                {paymentData?.credits || "tokens"}
              </span>
              .
            </p>
            {paymentData?.balance && (
              <p className="text-sm text-gray-400 mb-8">
                New Balance: {Math.round(paymentData.balance)} credits
              </p>
            )}
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* FAILED STATE */}
        {!verifying && verificationStatus === "failed" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
            <div className="flex gap-4 w-full">
              <Link
                href="/credits/buy"
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Buy Credits
              </Link>
              <Link
                href="/contact"
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
