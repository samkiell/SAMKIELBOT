import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Rocket,
  Smartphone,
  Coins,
  AlertCircle,
  Eye,
  HelpCircle,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Layout from "../components/Layout";

export default function DocsPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const sections = [
    {
      id: "getting-started",
      icon: Rocket,
      title: "Getting Started",
      color: "indigo",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to SAMKIEL BOT
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            SAMKIEL BOT is a WhatsApp bot deployment platform that lets you run
            your own bot 24/7 without managing servers. Here's how to get
            started:
          </p>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                <strong>Create an account</strong> – Sign up with your email and
                WhatsApp number
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                <strong>Verify your email</strong> – Check your inbox for the
                verification code
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                <strong>Get free credits</strong> – New users receive 25 credits
                to start
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                <strong>Deploy your bot</strong> – Follow the deployment guide
                below
              </span>
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "deploying",
      icon: Rocket,
      title: "Deploying a Bot",
      color: "purple",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How to Deploy Your Bot
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            Deploying a bot takes 2-5 minutes. Follow these steps:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle
                  className="text-green-600 dark:text-green-400"
                  size={18}
                />
                Step 1: Navigate to Deploy
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the <strong>"Deploy"</strong> button in your dashboard or
                navigation menu.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle
                  className="text-green-600 dark:text-green-400"
                  size={18}
                />
                Step 2: Configure Bot Settings
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Enter your <strong>Bot Name</strong>,{" "}
                <strong>WhatsApp Number</strong>, and{" "}
                <strong>Owner Number</strong>.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select your desired features like{" "}
                <strong>Auto Status View</strong>, <strong>Anti-Delete</strong>,
                and <strong>Command Mode</strong>.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle
                  className="text-green-600 dark:text-green-400"
                  size={18}
                />
                Step 3: Confirm & Deploy
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review your configuration and click{" "}
                <strong>"Deploy Bot"</strong>. Credits will be deducted upfront.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle
                  className="text-green-600 dark:text-green-400"
                  size={18}
                />
                Step 4: Wait for Deployment
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The system will provision your bot. This takes 2-5 minutes.
                You'll see a pairing code once ready.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "pairing",
      icon: Smartphone,
      title: "Pairing WhatsApp",
      color: "green",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How to Pair Your WhatsApp Number
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            After deployment, you'll receive an 8-character pairing code. Use it
            to connect your WhatsApp number:
          </p>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                Open <strong>WhatsApp</strong> on your phone
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                Go to <strong>Settings → Linked Devices → Link a Device</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                Tap <strong>"Link with phone number instead"</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                Enter the <strong>8-character pairing code</strong> shown on
                your dashboard
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              <span>
                Wait for confirmation – Your bot will go online within 30
                seconds
              </span>
            </li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> Pairing codes expire after 5 minutes. If it
              expires, restart your bot to generate a new code.
            </p>
          </div>
        </>
      ),
    },
    {
      id: "credits",
      icon: Coins,
      title: "Understanding Credits",
      color: "yellow",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How Credits Work
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            SAMKIEL BOT uses a credit-based billing system. Credits power your
            bot's runtime and resources.
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                💰 How to Get Credits
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  • <strong>Signup Bonus:</strong> 25 credits (one-time)
                </li>
                <li>
                  • <strong>Daily Claim:</strong> 5 credits every 24 hours
                </li>
                <li>
                  • <strong>Referrals:</strong> 10 credits per successful
                  referral
                </li>
                <li>
                  • <strong>Purchase:</strong> Buy credits via dashboard
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                ⚡ How Credits Are Used
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>
                  • <strong>Bot Creation:</strong> One-time cost based on
                  resources
                </li>
                <li>
                  • <strong>Daily Burn:</strong> Credits consumed every 24 hours
                  while bot runs
                </li>
                <li>
                  • <strong>Suspension:</strong> Bots pause when credits reach
                  zero
                </li>
              </ul>
            </div>
          </div>

          <Link
            href="/credits/buy"
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Coins size={18} />
            Buy Credits Now
          </Link>
        </>
      ),
    },
    {
      id: "errors",
      icon: AlertCircle,
      title: "Common Errors & Fixes",
      color: "red",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Troubleshooting Guide
          </h3>

          <div className="space-y-4">
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Bot Not Connecting / Staying Offline
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Possible Causes:</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li>• WhatsApp session expired</li>
                <li>• Pairing code not entered correctly</li>
                <li>• Bot crashed due to code errors</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Solution:</strong> Delete the deployment and create a
                fresh one. Check the{" "}
                <Link
                  href="/status"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  status page
                </Link>{" "}
                for server issues.
              </p>
            </div>

            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Credits Not Reflecting After Purchase
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Possible Causes:</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li>• Payment still processing</li>
                <li>• Webhook delivery delay</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Solution:</strong> Wait 5 minutes. If credits don't
                appear, email{" "}
                <a
                  href="mailto:support@samkielbot.app"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  support@samkielbot.app
                </a>{" "}
                with your payment reference.
              </p>
            </div>

            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Deployment Stuck on "Initializing"
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Possible Causes:</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                <li>• High server load</li>
                <li>• Network lag</li>
                <li>• Invalid GitHub repository</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Solution:</strong> Wait 10 minutes. If still stuck,
                refresh your dashboard or try redeploying. Contact{" "}
                <Link
                  href="/support"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  support
                </Link>{" "}
                if the issue persists.
              </p>
            </div>

            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Bot Suspended Due to Low Credits
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>What Happened:</strong> Your credit balance reached
                zero, so the bot was automatically paused.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Solution:</strong> Add credits via{" "}
                <Link
                  href="/credits/buy"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  purchase
                </Link>{" "}
                or{" "}
                <Link
                  href="/credits/claim"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  daily claim
                </Link>
                . Your bot will resume automatically.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "view-once",
      icon: Eye,
      title: "View Once Feature",
      color: "blue",
      content: (
        <>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            What is View Once?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            The View Once feature allows your bot to automatically save media
            sent as "View Once" messages on WhatsApp. This is useful for
            archiving or backup purposes.
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                How It Works
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>1. Someone sends a View Once photo/video to your bot</li>
                <li>2. The bot intercepts the media instantly</li>
                <li>3. Use the command below to retrieve it</li>
              </ol>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Using the Command
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                You cannot access server files directly. Instead, simply send
                this command to the bot:
              </p>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 inline-block">
                <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-lg">
                  deyplay
                </code>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Privacy Note:</strong> Use this feature responsibly.
                Respect user privacy and comply with local laws.
              </p>
            </div>
          </div>

          <Link
            href="/view-once-whatsapp"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
          >
            Learn more about View Once
            <ArrowRight size={16} />
          </Link>
        </>
      ),
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      indigo:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
      purple:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      green:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      yellow:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    };
    return colors[color] || colors.indigo;
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-slate-900 min-h-screen">
        <Head>
          <title>Documentation & Help | SAMKIEL BOT</title>
          <meta
            name="description"
            content="Complete guide to deploying and managing your WhatsApp bot on SAMKIEL BOT platform."
          />
        </Head>

        <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20">
          {/* Hero Section */}
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen
                className="text-indigo-600 dark:text-indigo-400"
                size={32}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Documentation & Help
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to deploy, manage, and troubleshoot your
              WhatsApp bot
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-gray-200 dark:border-slate-700"
                >
                  <div
                    className={`p-2 rounded-lg ${getColorClasses(
                      section.color
                    )}`}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                    {section.title}
                  </span>
                </a>
              );
            })}
          </motion.div>

          {/* Documentation Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 scroll-mt-24"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`p-3 rounded-xl ${getColorClasses(
                        section.color
                      )}`}
                    >
                      <Icon size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {section.content}
                  </div>
                </motion.section>
              );
            })}
          </div>

          {/* Support CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-slate-600 rounded-2xl p-8 md:p-12 text-center"
          >
            <MessageSquare
              className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400"
              size={40}
            />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Still need help?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
              Can't find what you're looking for? Our support team and community
              are ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
              >
                <HelpCircle size={18} />
                Contact Support
              </Link>
              <a
                href="https://chat.whatsapp.com/Jgrc79greN63Omt5T7LTzs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
              >
                <MessageSquare size={18} />
                Join WhatsApp Group
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}
