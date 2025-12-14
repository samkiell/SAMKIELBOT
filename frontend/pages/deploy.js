import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { deployBot, getDeploymentById } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ArrowLeft, Copy, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

export default function DeployPage() {
  const [formData, setFormData] = useState({
    botName: "",
    botNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deployment, setDeployment] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState("idle"); // idle, deploying, success
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDeploymentStatus("deploying");

    try {
      const deploymentData = await deployBot(formData);
      setDeployment(deploymentData);
      toast.success("Bot deployment started!");

      // Poll for deployment status
      pollDeploymentStatus(deploymentData._id);
    } catch (error) {
      setError(error.response?.data?.error || "Deployment failed");
      toast.error("Deployment failed. Please try again.");
      setLoading(false);
      setDeploymentStatus("idle");
    }
  };

  const pollDeploymentStatus = async (deploymentId) => {
    const pollInterval = setInterval(async () => {
      try {
        const deploymentData = await getDeploymentById(deploymentId);
        console.log(
          "Polling Status:",
          deploymentData.status,
          "Code:",
          deploymentData.pairingCode
        );

        // Check for 'installing' or 'running' status. Even 'installing' is a success for 'deployment start'.
        // But if we want to wait for running:
        // Check for statuses
        // 1. Success (Running)
        if (deploymentData.status === "running") {
          setDeployment(deploymentData);
          setDeploymentStatus("success");
          setLoading(false);
          clearInterval(pollInterval);
          toast.success("Bot is running!");
        }
        // 2. Awaiting Pairing - Check for status OR just presence of code
        else if (
          deploymentData.status === "awaiting_pairing" ||
          deploymentData.pairingCode
        ) {
          console.log("Pairing code detected:", deploymentData.pairingCode);
          if (deploymentStatus !== "pairing") {
            toast.success("Pairing code received!");
          }
          setDeployment(deploymentData);
          setDeploymentStatus("pairing");
          setLoading(false);
          // Don't clear interval, wait for running
        }
        // 3. Failed
        else if (deploymentData.status === "failed") {
          const errorMsg =
            deploymentData.errorMessage ||
            "Deployment failed. Please try again.";
          setError(errorMsg);
          setDeploymentStatus("idle");
          setLoading(false);
          clearInterval(pollInterval);
          toast.error(errorMsg);
        }
        // 4. Intermediate states (installing, starting, creating)
        else {
          // Just update deployment object to reflect current intermediate status like 'installing' or 'starting'
          setDeployment(deploymentData);
        }
      } catch (error) {
        console.error("Error polling deployment status:", error);
      }
    }, 2000); // Poll every 2 seconds for faster feedback

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (deploymentStatus !== "success") {
        console.log("Polling timed out");
        setError("Deployment timed out. Please check your dashboard.");
        setDeploymentStatus("idle");
        setLoading(false);
      }
    }, 600000); // 10 minutes
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("return_route", router.asPath);
    }
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Head>
        <title>Deploy Bot - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 pb-8 md:pb-16 max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Deploy New Bot
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Configure and deploy your WhatsApp bot to get started
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700/40 p-8">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {deploymentStatus === "idle" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Bot Name
                </label>
                <input
                  type="text"
                  name="botName"
                  value={formData.botName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="My Awesome Bot"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  WhatsApp Bot Number
                </label>
                <input
                  type="text"
                  name="botNumber"
                  value={formData.botNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter international WhatsApp number (e.g., 1234567890)"
                  pattern="^\d{10,15}$"
                  title="Enter a valid international WhatsApp number (10-15 digits)"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the full international number without + or spaces
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <Link
                  href="/dashboard"
                  className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  {loading ? "Deploying..." : "Deploy Bot"}
                </button>
              </div>
            </form>
          )}

          {deploymentStatus === "deploying" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">
                Deploying your bot...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Current Status:{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                  {deployment?.status || "Initializing"}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few minutes. Please wait...
              </p>
            </div>
          )}

          {deploymentStatus === "pairing" && deployment && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">
                Link Device Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your bot is ready! Link your WhatsApp account to start.
              </p>

              <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 rounded-lg p-6 max-w-md mx-auto mb-6">
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-4">
                  <code className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200 tracking-wider">
                    {deployment.pairingCode || "Loading code..."}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(deployment.pairingCode);
                      toast.success("Copied!");
                    }}
                    className="text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors p-2"
                    title="Copy Code"
                  >
                    <Copy size={24} />
                  </button>
                </div>
                <div className="text-left space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>1. Open WhatsApp on your phone.</p>
                  <p>
                    2. Go to <strong>Settings &gt; Linked Devices</strong>.
                  </p>
                  <p>
                    3. Tap <strong>Link a Device</strong> &gt;{" "}
                    <strong>Link with phone number instead</strong>.
                  </p>
                  <p>4. Enter the code shown above.</p>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  I'll do this later (Go to Dashboard)
                </button>
              </div>
            </div>
          )}

          {deploymentStatus === "success" && deployment && (
            <div className="text-center py-8">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Bot Deployed Successfully!
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Server is {deployment.status}. Check dashboard for details.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                View All Bots
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Deployment Information
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>
              • Your bot will be deployed with the latest stable configuration
            </li>
            <li>• Deployment may take a few minutes to complete</li>
            <li>• You can monitor the status from your dashboard</li>
            <li>• Make sure your WhatsApp number is verified</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
