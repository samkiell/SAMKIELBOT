import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../../../lib/auth";
import toast from "react-hot-toast";
import { Gift } from "lucide-react";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function ReferralRegister() {
  const router = useRouter();
  const { refUsername } = router.query;
  const { register: registerUser, loading: authLoading, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    whatsappNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [validatingReferrer, setValidatingReferrer] = useState(true);

  useEffect(() => {
    const agreed = localStorage.getItem("samkiel_agreed") === "true";
    const read = localStorage.getItem("samkiel_read_terms") === "true";
    if (agreed || read) setAgreeToTerms(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (refUsername) {
      validateReferrer(refUsername);
    } else {
      setValidatingReferrer(false);
    }
  }, [refUsername]);

  const validateReferrer = async (username) => {
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/auth/validate-referrer/${username}`
      );
      const data = await res.json();

      if (data.success) {
        setReferrerInfo({ username: data.data.username });
      } else {
        toast.error("Invalid referral link");
        router.push("/register");
      }
    } catch (error) {
      console.error("Referrer validation error:", error);
      router.push("/register");
    } finally {
      setValidatingReferrer(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "username") {
      setUsername(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const read = localStorage.getItem("samkiel_read_terms") === "true";

    if (!read) {
      toast.error("Abeg read the Terms & Conditions and Privacy Policy first.");
      return;
    }

    if (!agreeToTerms) {
      toast.error("You must agree to the Terms & Conditions to proceed.");
      return;
    }

    const phoneRegex = /^\+?\d{8,15}$/;
    if (!phoneRegex.test(formData.whatsappNumber)) {
      toast.error(
        "Please enter a valid WhatsApp number (only digits, 8–15 characters)."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        ...formData,
        referredByUsername: refUsername,
      };

      const result = await registerUser(registrationData);
      if (result) {
        toast.success(`🎉 Registration successful! Welcome ${result.username}`);
        localStorage.removeItem("samkiel_agreed");
        localStorage.removeItem("samkiel_clicked_terms");
        localStorage.removeItem("samkiel_read_terms");
        sessionStorage.removeItem("return_route");
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || validatingReferrer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Head>
        <title>Join via Referral - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      {/* Left side - Welcome section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-6 transition-opacity duration-500">
            {username
              ? `${username}, we're glad to have you here!`
              : "Join the 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 community!"}
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Create your account and start deploying bots with ease. Join
            thousands of developers already using our platform.
          </p>
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse delay-100"></div>
            <div className="w-20 h-20 bg-white/10 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-bounce delay-1000"></div>
      </div>

      {/* Right side - Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 pb-8 pt-24 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
        <div className="max-w-md w-full space-y-8">
          {/* Referral Banner */}
          {referrerInfo && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Gift size={24} />
                <h3 className="text-lg font-bold">You're Invited!</h3>
              </div>
              <p className="text-indigo-100 mb-3">
                <span className="font-semibold">{referrerInfo.username}</span>{" "}
                invited you to join SAMKIEL BOT
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm font-semibold">
                  🎁 Signup Bonus: +25 credits
                </p>
                <p className="text-sm font-semibold">
                  🎉 Referral Bonus: +10 credits
                </p>
                <p className="text-xs text-indigo-100 mt-1">
                  Total: 35 credits to get started!
                </p>
              </div>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fill in your details to get started
            </p>
            {/* Mobile welcome message */}
            <div className="lg:hidden mt-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white transition-opacity duration-500">
                {username
                  ? `${username}, we're glad to have you here!`
                  : "Join the 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 community!"}
              </h3>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="whatsappNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  WhatsApp Phone Number
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="+2348087357158"
                  value={formData.whatsappNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^[\d+]*$/.test(value)) {
                      toast.error(
                        "Na Only valid WhatsApp numbers dey allowed."
                      );
                      return;
                    }
                    handleChange(e);
                  }}
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
                  placeholder="Create a password"
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

              <div className="relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <HiEyeOff size={20} />
                  ) : (
                    <HiEye size={20} />
                  )}
                </button>
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
                  onClick={() => {
                    sessionStorage.setItem("return_route", "register");
                    localStorage.setItem("samkiel_clicked_terms", "true");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  onClick={() => {
                    sessionStorage.setItem("return_route", "register");
                    localStorage.setItem("samkiel_clicked_terms", "true");
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
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors duration-200"
              >
                Already have an account? Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
