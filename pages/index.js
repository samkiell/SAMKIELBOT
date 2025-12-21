import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import Footer from "../components/Footer";
import {
  FaUsers,
  FaEye,
  FaRocket,
  FaSync,
  FaTachometerAlt,
  FaPen,
  FaCloud,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
} from "react-icons/fa";
import Snowfall from "../components/Snowfall";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setIsRedirecting(true); // Keep showing spinner/nothing while redirect happens
      window.location.href = "/dashboard";
    }
  }, [user, authLoading]);

  if (authLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const slideIn = {
    initial: { opacity: 0, x: -20 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const features = [
    {
      icon: <FaUsers className="text-blue-400 text-3xl" />,
      title: "Works in Groups & Private Chats",
      desc: "Manage groups or chat one-on-one — full control, same smooth experience.",
    },
    {
      icon: <FaEye className="text-blue-400 text-3xl" />,
      title: "View Once Saver",
      desc: "Automatically fetch and store View Once media for later viewing.",
    },
    {
      icon: <FaRocket className="text-blue-400 text-3xl" />,
      title: "Easy Deployment",
      desc: "Deploy your personal WhatsApp bot in minutes, directly from your browser.",
    },
    {
      icon: <FaSync className="text-blue-400 text-3xl" />,
      title: "Self-Update System",
      desc: "Stay up-to-date with one command — the bot updates itself instantly.",
    },
    {
      icon: <FaTachometerAlt className="text-blue-400 text-3xl" />,
      title: "Dashboard Control",
      desc: "Pause, resume, or delete your bot anytime from your web dashboard.",
    },
    {
      icon: <FaPen className="text-blue-400 text-3xl" />,
      title: "Custom Prefix",
      desc: "Change your bot prefix to make it truly yours.",
    },
    {
      icon: <FaCloud className="text-blue-400 text-3xl" />,
      title: "Cloud-Based Hosting",
      desc: "Each bot runs independently with 99% uptime — powered by Render.",
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <Snowfall />
      <Head>
        <title>
          SAMKIEL BOT | #1 WhatsApp Bot Deployment & Hosting Platform
        </title>
        <meta
          name="description"
          content="Deploy your WhatsApp bot in minutes with SAMKIEL BOT. The leading platform for WhatsApp automation, hosting, and View Once message recovery. Start for free now!"
        />
        <meta
          name="keywords"
          content="deploy WhatsApp bot, WhatsApp bot hosting, free WhatsApp bot, view once WhatsApp, WhatsApp automation, SAMKIEL Bot, WhatsApp bot manager"
        />
        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content="SAMKIEL BOT | #1 WhatsApp Bot Deployment & Hosting Platform"
        />
        <meta
          property="og:description"
          content="Professional WhatsApp bot deployment and hosting platform. Automate your chats and groups easily."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://bot.samkiel.dev" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/logo.png" />
      </Head>

      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center text-center px-6 pt-32 pb-12 min-h-screen bg-gray-50 dark:bg-[#0f172a]">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="relative z-10">
          <motion.div {...fadeUp}>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-500/30 shadow-sm animate-pulse">
                <span className="text-red-600 dark:text-red-200 font-bold text-sm tracking-wide flex items-center gap-2">
                  🎄 HAPPY HOLIDAYS 🎅
                </span>
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                <span className="text-cyan-600 dark:text-cyan-300 font-bold text-sm tracking-wide">
                  🚀 V3.0 NOW LIVE
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
              Deploy WhatsApp Bot with One Click
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Automate your WhatsApp experience with power, simplicity, and full
              control.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
              <span className="flex items-center bg-gray-200 dark:bg-white/5 px-3 py-1 rounded-lg">
                ✨ 99.9% Uptime
              </span>
              <span className="flex items-center bg-gray-200 dark:bg-white/5 px-3 py-1 rounded-lg">
                ⚡ Instant Setup
              </span>
              <span className="flex items-center bg-gray-200 dark:bg-white/5 px-3 py-1 rounded-lg">
                🔒 E2E Encrypted
              </span>
            </div>

            <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-400 mb-10 leading-relaxed italic">
              SAMKIEL BOT is the premier WhatsApp bot deployment and hosting
              platform for developers and group admins. Get your
              high-performance WhatsApp bot online instantly with our reliable
              hosting infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                Deploy your bot now!
              </Link>
              <Link
                href="/bots"
                className="bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Community Bots
              </Link>
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Animated shapes - darkened for light mode visibility if needed, or keeping subtle */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-bounce delay-1000"></div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Get your WhatsApp bot running in 3 simple steps.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Register Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your SAMKIEL BOT account to access the deployment
                dashboard.
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Configure Bot</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose your bot settings and features like View Once recovery.
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Deploy & Connect</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Click deploy and link your WhatsApp via QR or pairing code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              Why Choose SAMKIEL BOT?
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              SAMKIEL BOT provides the most stable WhatsApp bot hosting
              environment. Manage group moderation, media recovery, and custom
              automations with zero technical setup.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/whatsapp-bot"
                className="text-indigo-600 hover:underline"
              >
                WhatsApp Bot Guide
              </Link>
              <Link
                href="/deploy-whatsapp-bot"
                className="text-indigo-600 hover:underline"
              >
                Deployment Tips
              </Link>
              <Link
                href="/free-whatsapp-bot"
                className="text-indigo-600 hover:underline"
              >
                Free Hosting
              </Link>
              <Link
                href="/view-once-whatsapp"
                className="text-indigo-600 hover:underline"
              >
                View Once Recovery
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="px-6 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Key Features
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Discover what makes SAMKIEL BOT powerful and easy to use.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                {...slideIn}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-700/40 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Visual Showcase
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              See SAMKIEL BOT in action.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <motion.div {...slideIn} className="text-center">
              <Image
                src="/bot-menu-preview2.jpg"
                alt="Bot Command Menu"
                width={500}
                height={300}
                className="rounded-xl shadow-md mx-auto hover:shadow-lg transition-shadow duration-300"
              />
              <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Bot Command Menu
              </p>
            </motion.div>
            <motion.div {...slideIn} className="text-center">
              <Image
                src="/viewonce-demo.jpg"
                alt="View Once Saver in Action"
                width={500}
                height={300}
                className="rounded-xl shadow-md mx-auto hover:shadow-lg transition-shadow duration-300"
              />
              <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300">
                View Once Saver in Action
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What’s New Section */}
      <section className="px-6 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              🚀 What’s New in Version 3
            </h2>
            <ul className="text-left text-base md:text-lg text-gray-600 dark:text-gray-300 space-y-4 max-w-2xl mx-auto">
              <li>• Improved stability & message delivery.</li>
              <li>• Enhanced dashboard sync with Render.</li>
              <li>• New View Once Media Saver.</li>
              <li>• Advanced session recovery.</li>
              <li>• Upgraded .update auto-refresh system.</li>
            </ul>
            <p className="mt-6 text-sm md:text-base text-gray-600 dark:text-gray-300">
              Stay tuned for more exciting updates!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Simple Pricing
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Start free forever. Upgrade when you need more power.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              {...slideIn}
              className="bg-gray-50 dark:bg-gray-900 p-8 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Free Forever
              </h3>
              <div className="text-4xl font-bold mb-6 text-indigo-600">₦0</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Free signup credits
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Basic bot hosting
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Community support
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
              >
                Get Started Free
              </Link>
            </motion.div>
            <motion.div
              {...slideIn}
              className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-xl shadow-xl hover:shadow-2xl transition transform hover:scale-105"
            >
              <h3 className="text-2xl font-bold mb-4 text-white">
                Top-up Credits
              </h3>
              <div className="text-4xl font-bold mb-6 text-white">
                From ₦500
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Instant credit
                  delivery
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Pay as you deploy
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Priority bot
                  hosting
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition text-center"
              >
                Buy Credits Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Join the Community Section */}
      <section className="px-6 py-12 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join the Community
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-8">
              Join our growing community to stay updated.
            </p>
            <a
              href="https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105 inline-block shadow-lg"
            >
              Join Channel
            </a>
          </motion.div>
        </div>
      </section>

      {/* Connect with Us Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              Connect With Us
            </h2>
            <div className="flex justify-center space-x-6">
              <a
                href="https://github.com/samkiel488"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaGithub size={30} />
              </a>
              <a
                href="https://linkedin.com/in/samkiell"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaLinkedin size={30} />
              </a>
              <a
                href="mailto:samkielbot@gmail.com"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaEnvelope size={30} />
              </a>
            </div>
            <p className="mt-8 text-gray-500 dark:text-gray-400 font-medium">
              samkielbot@gmail.com
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
