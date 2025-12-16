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
  FaTwitter,
  FaInstagram,
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
        <title>𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 - Automate Your WhatsApp Experience</title>
        <meta
          name="description"
          content="Deploy and manage your personal WhatsApp bot with ease. Automate tasks, save View Once media, and control everything from your dashboard."
        />
        <link rel="icon" href="/SAMKIELBOT-LOGO.png" />
      </Head>

      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center text-center px-6 py-12 min-h-screen bg-gray-50 dark:bg-[#0f172a]">
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
              𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              Automate your WhatsApp experience with power, simplicity, and full
              control.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-10">
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

      {/* About Section */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              About SAMKIEL BOT
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              SAMKIEL BOT helps individuals, students, communities, and group
              leaders automate WhatsApp tasks — from moderating groups to
              managing files and saving View Once messages. Works both in groups
              and private chats.
            </p>
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
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaLinkedin size={30} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaTwitter size={30} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition hover:scale-110"
              >
                <FaInstagram size={30} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
