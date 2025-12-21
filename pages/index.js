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
      icon: <FaUsers className="text-indigo-500 text-3xl" />,
      title: "Universal Compatibility",
      desc: "Seamlessly manages group permissions and private DMs without lag or downtime.",
    },
    {
      icon: <FaEye className="text-indigo-500 text-3xl" />,
      title: "Media Recovery Engine",
      desc: "Automatically capture and store View Once media securely. Never miss a moment.",
    },
    {
      icon: <FaRocket className="text-indigo-500 text-3xl" />,
      title: "One-Click Cloud Deploy",
      desc: "No terminal needed. Launch from your browser directly to our high-speed servers.",
    },
    {
      icon: <FaSync className="text-indigo-500 text-3xl" />,
      title: "Auto-Updating Core",
      desc: "Your bot stays patched and secure automatically. No manual maintenance required.",
    },
    {
      icon: <FaTachometerAlt className="text-indigo-500 text-3xl" />,
      title: "Real-Time Mission Control",
      desc: "Start, stop, restart, and monitor your bots from a centralized dashboard.",
    },
    {
      icon: <FaCloud className="text-indigo-500 text-3xl" />,
      title: "Isolated Environments",
      desc: "Every bot runs in its own container. No shared resource throttling or interference.",
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
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
                <span className="text-indigo-600 dark:text-indigo-300 font-bold text-xs md:text-sm tracking-wide uppercase">
                  🚀 V3 Stable Release Now Live
                </span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight drop-shadow-sm leading-tight">
              Deploy Production-Grade <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                WhatsApp Bots
              </span>{" "}
              in Seconds
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
              The only platform offering isolated cloud hosting, one-click
              deployments, and advanced media recovery tools. <br />
              <span className="font-medium text-gray-900 dark:text-white">
                Built for stability. Engineered for scale.
              </span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
              <span className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
                <FaCloud className="text-indigo-500" /> Isolated Instances
              </span>
              <span className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
                <FaRocket className="text-indigo-500" /> Instant Setup
              </span>
              <span className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
                <FaSync className="text-indigo-500" /> Auto-Healing
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 transform hover:-translate-y-1 shadow-lg shadow-indigo-600/30"
              >
                Deploy Bot Now
              </Link>
              <Link
                href="/bots"
                className="w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-1 shadow-sm"
              >
                Browse Community Bots
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Animated shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Launch in 3 Steps
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Go from zero to active bot in under 60 seconds.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">
                Create Developer Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Sign up for free to access your personal mission control
                dashboard.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Select Your Bot</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Choose from pre-built templates or configure your custom
                instance with one click.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-indigo-600/20">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Scan & Launch</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Link your WhatsApp via QR code. Your bot goes live instantly on
                our cloud.
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
              Why Developers Choose SAMKIEL BOT
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-light">
              Stop fighting with downtime and complex setups. We provide{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                enterprise-grade infrastructure
              </span>{" "}
              that keeps your bots running 24/7, so you can focus on building
              communities, not fixing servers.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/whatsapp-bot"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline font-medium"
              >
                WhatsApp Bot Guide
              </Link>
              <Link
                href="/deploy-whatsapp-bot"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline font-medium"
              >
                Deployment Architecture
              </Link>
              <Link
                href="/free-whatsapp-bot"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline font-medium"
              >
                Free Tier Limits
              </Link>
              <Link
                href="/view-once-whatsapp"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline font-medium"
              >
                View Once Technology
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
              Transparent, Developer-Friendly Pricing
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              No hidden fees. Pay only for the resources you use.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              {...slideIn}
              className="bg-gray-50 dark:bg-gray-900 p-8 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 dark:border-gray-800"
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Developer Tier
              </h3>
              <div className="text-4xl font-bold mb-6 text-indigo-600">₦0</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Daily Free Credits
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Full Cloud Hosting
                  Management
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-green-500">✓</span> Community Support
                  Access
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
                Power User Top-up
              </h3>
              <div className="text-4xl font-bold mb-6 text-white">
                From ₦500
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Instant Balance
                  Top-up
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Pay Only For Uptime
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="text-yellow-300">✓</span> Priority Instance
                  Allocation
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Automate your WhatsApp?
            </h2>
            <p className="text-base md:text-lg text-gray-200 mb-8 opacity-90">
              Join 500+ Developers building the future of chat automation.
            </p>
            <a
              href="https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition transform hover:scale-105 inline-block shadow-lg"
            >
              Join Developer Channel
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
                href="https://github.com/samkiell"
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
