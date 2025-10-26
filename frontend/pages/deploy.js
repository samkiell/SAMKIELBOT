import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { deployBot, getDeploymentById } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function DeployPage() {
  const [formData, setFormData] = useState({
    botNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deployment, setDeployment] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState("idle"); // idle, deploying, success
  const { user } = useAuth();
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

        if (deploymentData.pairingCode) {
          setDeployment(deploymentData);
          setDeploymentStatus("success");
          setLoading(false);
          clearInterval(pollInterval);
          toast.success("Bot deployed successfully! Pairing code retrieved.");
        } else if (deploymentData.status === "failed") {
          const errorMsg =
            deploymentData.errorMessage ||
            "Deployment failed. Please try again.";
          setError(errorMsg);
          setDeploymentStatus("idle");
          setLoading(false);
          clearInterval(pollInterval);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Error polling deployment status:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (deploymentStatus !== "success") {
        setError("Deployment timed out. Please check your dashboard.");
        setDeploymentStatus("idle");
        setLoading(false);
      }
    }, 600000); // 10 minutes
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Head>
        <title>Deploy Bot - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 pt-20 pb-8 md:pb-16 max-w-2xl">
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
                This may take a few minutes. Please wait while we set up your
                WhatsApp bot.
              </p>
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
                  Your pairing code is:
                </p>
                <p className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {deployment.pairingCode}
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(deployment.pairingCode)
                  }
                  className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
                >
                  Copy to clipboard
                </button>
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Go to Dashboard
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
