import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import {
  Server,
  Shield,
  Zap,
  Info,
  ArrowLeft,
  Cpu,
  Database,
  Globe,
  Users,
  AlertCircle,
} from "lucide-react";

export default function HowBillingWorks() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white pb-20">
      <Head>
        <title>How Billing Works | 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        <meta
          name="description"
          content="An honest explanation of why credits exist and how they power your WhatsApp bots on the 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋 platform."
        />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <Link
          href="/credits/buy"
          className="inline-flex items-center text-indigo-500 hover:text-indigo-400 font-medium transition-all mb-8"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Pricing
        </Link>

        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Why Credits? <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              An Honest Explanation.
            </span>
          </motion.h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
            At SAMKIEL BOT, we believe in transparency. Running 24/7 WhatsApp
            bots requires significant infrastructure. Credits are not a
            "pay-to-play" gimmick—they directly fund the resources that keep
            your bot online.
          </p>
        </header>

        <section className="grid gap-12 mb-20">
          {/* Why Credits Exist */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Server className="text-indigo-500" size={24} />
              </div>
              Where your credits go
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu className="text-blue-500" size={20} />
                  <h3 className="font-bold">VPS Hosting</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Every bot runs on a dedicated Linux instance (Pterodactyl).
                  This ensures isolation, security, and high performance without
                  lagging your WhatsApp chats.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="text-purple-500" size={20} />
                  <h3 className="font-bold">Resource Allocation</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bots consume RAM and CPU cycles to process your media and
                  commands. Credits cover the cost of maintaining this hardware
                  24/7.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="text-emerald-500" size={20} />
                  <h3 className="font-bold">Network & Traffic</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Downloading videos, songs, and processing "View Once" media
                  involves significant data transfer. Your credits keep this
                  connection fast and reliable.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-amber-500" size={20} />
                  <h3 className="font-bold">Development & Support</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A portion of your credits helps us fix bugs, add new features
                  (like AI integration), and maintain the dashboard interface
                  you use daily.
                </p>
              </div>
            </div>
          </div>

          {/* How Billing Works */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="text-emerald-500" size={24} />
              </div>
              How Billing Works
            </h2>
            <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Server size={180} />
              </div>
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4">
                    Simple & Predictable
                  </h3>
                  <p className="text-indigo-100 lg:text-lg mb-8">
                    We hate hidden fees. Our billing logic is designed to be
                    affordable for individuals while remaining sustainable for
                    our infrastructure.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="bg-white/20 p-1 rounded-full shrink-0">
                        <CheckCircle size={18} />
                      </div>
                      <span className="font-medium">
                        50 Credits setup fee (one-time per bot)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="bg-white/20 p-1 rounded-full shrink-0">
                        <CheckCircle size={18} />
                      </div>
                      <span className="font-medium">
                        5 Credits daily maintenance (only when active)
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <h4 className="font-bold text-xl mb-4 text-white">
                    The Cost of "Free"
                  </h4>
                  <p className="text-sm text-indigo-50 leading-relaxed">
                    Most "free" platforms exploit users by selling their data,
                    serving intrusive ads, or shutting down without warning.
                    <br />
                    <br />
                    By using a credit system, we ensure **SAMKIEL BOT remains
                    ad-free**, your data stays private, and your bot stays
                    online as long as you want it to.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Promise */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="text-purple-500" size={24} />
              </div>
              Our Transparency Promise
            </h2>
            <div className="bg-white dark:bg-slate-800/40 p-8 rounded-2xl border border-gray-100 dark:border-slate-700/50 flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <h3 className="font-bold text-lg">We Will Never:</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>• Charge you for features you don't use</li>
                  <li>• Sell your private message logs</li>
                  <li>• Sell your WhatsApp account data</li>
                  <li>
                    • Use your bot's traffic for training AI without permission
                  </li>
                </ul>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="font-bold text-lg">We Will Always:</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>• Use credits to pay for high-speed hardware</li>
                  <li>• Refund credits for failed system deployments</li>
                  <li>• Provide clear logs of your credit usage</li>
                  <li>
                    • Warn you before your bot goes offline due to low balance
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center p-12 bg-gray-100 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <AlertCircle className="mx-auto mb-4 text-indigo-500" size={32} />
          <h3 className="text-xl font-bold mb-2">Got questions?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We are here to help. If you're unsure about anything, reach out to
            our team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/support"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
            >
              Contact Support
            </Link>
            <Link
              href="/credits/buy"
              className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold transition-all"
            >
              Back to Store
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function CheckCircle({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
