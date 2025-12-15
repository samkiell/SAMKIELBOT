import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { getDeploymentById } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import {
  ArrowLeft,
  Copy,
  Smartphone,
  CheckCircle,
  Loader,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DeploymentSessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pollIntervalId, setPollIntervalId] = useState(null);

  // Initial fetch and setup polling
  useEffect(() => {
    if (!router.isReady || !id || !user) return;

    setLoading(true);

    const fetchDeployment = async () => {
      try {
        const data = await getDeploymentById(id);
        setDeployment(data);
        setLoading(false);

        // Decide whether to poll based on status
        if (!["running", "failed", "stopped"].includes(data.status)) {
          startPolling();
        }
      } catch (err) {
        console.error("Error fetching deployment:", err);
        setError("Deployment not found or access denied.");
        setLoading(false);
      }
    };

    fetchDeployment();

    return () => stopPolling();
  }, [router.isReady, id, user]);

  const startPolling = () => {
    if (pollIntervalId) return; // Already polling

    const interval = setInterval(async () => {
      try {
        const data = await getDeploymentById(id);
        setDeployment(data);

        // Stop polling if we reach a terminal state
        if (["running", "failed", "stopped"].includes(data.status)) {
          // If we just hit running, show success toast
          if (data.status === "running") {
            toast.success("Deployment successful! Bot is running.");
          }
          stopPolling();
        }

        // Special case: If we were waiting for code and now we have it (or status changed to awaiting_pairing)
        if (data.status === "awaiting_pairing" && data.pairingCode) {
          // We continue polling in awaiting_pairing because we want to know when it becomes "running"
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Don't stop polling on transient network errors, but maybe limit retries?
        // For now, keep trying.
      }
    }, 2000);

    setPollIntervalId(interval);
  };

  const stopPolling = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [pollIntervalId]);

  if (authLoading || (!deployment && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Render Logic based on Deployment Status
  const renderContent = () => {
    if (!deployment) return null;

    const { status, pairingCode, botName, botNumber } = deployment;

    // 1. Pending / Creating / Installing / Starting (No Code yet)
    if (["pending", "creating", "installing", "starting"].includes(status)) {
      return (
        <div className="text-center py-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Preparing your Bot...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Current Status:{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              {status}
            </span>
          </p>

          <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "creating"
                    ? "bg-blue-500 animate-ping"
                    : "bg-green-500"
                }`}
              ></div>
              <span>Initializing server resources</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "installing"
                    ? "bg-blue-500 animate-ping"
                    : ["starting"].includes(status)
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              ></div>
              <span>Installing dependencies</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "starting"
                    ? "bg-blue-500 animate-ping"
                    : "bg-gray-300"
                }`}
              ></div>
              <span>Starting bot services</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Awaiting Pairing (Show Code)
    if (status === "awaiting_pairing" || pairingCode) {
      return (
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <Smartphone
              size={40}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <h3 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Link Your WhatsApp
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Open WhatsApp on your phone and link this device using the code
            below.
          </p>

          <div className="bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-500/30 rounded-2xl p-8 max-w-lg mx-auto mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"></div>

            <h4 className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-4">
              Pairing Code
            </h4>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
              <code className="text-3xl md:text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-widest flex-1 text-center">
                {pairingCode ? pairingCode : "Waiting..."}
              </code>
              {pairingCode && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingCode);
                    toast.success("Code copied!");
                  }}
                  className="ml-4 p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
                  title="Copy Code"
                >
                  <Copy size={24} />
                </button>
              )}
            </div>

            <div className="text-left space-y-3 text-sm text-gray-600 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
              <div className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <p>Open WhatsApp on your phone.</p>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <p>
                  Go to{" "}
                  <span className="font-semibold">
                    Settings &gt; Linked Devices
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <p>
                  Tap <span className="font-semibold">Link a Device</span> &gt;{" "}
                  <span className="font-semibold">
                    Link with phone number instead
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <p>Enter the code shown above.</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400 animate-pulse">
            Waiting for connection...
          </div>
        </div>
      );
    }

    // 3. Success (Running)
    if (status === "running") {
      return (
        <div className="text-center py-12">
          <div className="bg-green-100 dark:bg-green-900/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Device Connected Successfully!
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your bot{" "}
            <span className="font-semibold text-indigo-600">{botName}</span> is
            now active and running.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/deploy"
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Deploy Another
            </Link>
          </div>
        </div>
      );
    }

    // 4. Failed / Other
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Deployment {status === "stopped" ? "Stopped" : "Failed"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {deployment.errorMessage || "An unexpected error occurred."}
        </p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <Head>
        <title>Deploying Bot... | 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Dashboard</span>
          </Link>

          <div className="text-sm font-mono text-gray-400">
            ID: {id?.slice(0, 8)}...
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 p-8 md:p-12 transition-all duration-300">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
