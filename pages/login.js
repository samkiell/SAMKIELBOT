import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import toast from "react-hot-toast";
import { useAuth } from "../lib/auth";
import Footer from "../components/Footer";

export default function Login() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    // Restore agreement state if user has agreed or read terms
    const agreed = localStorage.getItem("samkiel_agreed") === "true";
    const read = localStorage.getItem("samkiel_read_terms") === "true";
    if (agreed || read) setAgreeToTerms(true);
  }, []);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      const returnRoute = sessionStorage.getItem("return_route");
      if (user.isEmailVerified || user.isPhoneVerified) {
        if (returnRoute) {
          sessionStorage.removeItem("return_route");
          router.push(returnRoute);
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/verify");
      }
    }
  }, [user, authLoading, router]);

  // Loading state handling to prevent flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Update username for welcome message
    if (name === "identifier") {
      setUsername(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const read = localStorage.getItem("samkiel_read_terms") === "true";

    if (!read) {
      toast.error(
        "Abeg go read the Terms & Conditions and Privacy Policy first."
      );
      return;
    }

    if (!agreeToTerms) {
      toast.error("You must agree to the Terms & Conditions to proceed.");
      return;
    }

    setLoading(true);
    try {
      await login(formData.identifier, formData.password);
      // Clear all flags after successful login
      localStorage.removeItem("samkiel_agreed");
      localStorage.removeItem("samkiel_clicked_terms");
      localStorage.removeItem("samkiel_read_terms");
      sessionStorage.removeItem("return_route");
    } catch (error) {
      const err = JSON.parse(error.message);
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Login - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      {/* Left side - Welcome section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6 transition-opacity duration-500">
            Welcome back, {username || "friend"}!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Ready to manage your bots? Sign in to access your dashboard and
            deploy with ease.
          </p>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse delay-100"></div>
            <div className="w-20 h-20 bg-white/10 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
        {/* Animated shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-bounce delay-1000"></div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 pb-8 pt-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Sign in to 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your credentials to access your account
            </p>
            {/* Mobile welcome message */}
            <div className="lg:hidden mt-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white transition-opacity duration-500">
                Welcome back, {username || "friend"}!
              </h3>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email or Username
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email or username"
                  value={formData.identifier}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setAgreeToTerms(newValue);
                  if (newValue) {
                    localStorage.setItem("samkiel_agreed", "true");
                  } else {
                    localStorage.removeItem("samkiel_agreed");
                  }
                }}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  onClick={(e) => {
                    // record intent and route, then navigate
                    sessionStorage.setItem("return_route", "login");
                    localStorage.setItem("samkiel_clicked_terms", "true");
                    // let the normal link proceed (no preventDefault)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  onClick={(e) => {
                    // record intent and route, then navigate
                    sessionStorage.setItem("return_route", "login");
                    localStorage.setItem("samkiel_clicked_terms", "true");
                    // let the normal link proceed (no preventDefault)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center">
              <Link
                href="/register"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors duration-200"
              >
                Don't have an account? Sign up here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
