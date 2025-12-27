import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function FreeWhatsAppBotPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <Layout>
      <Head>
        <title>Free WhatsApp Bot Hosting & Deployment | SAMKIEL BOT</title>
        <meta
          name="description"
          content="Looking for a free WhatsApp bot? SAMKIEL BOT offers free hosting for your WhatsApp automations. No credit card required. Start your journey for $0."
        />
        <meta
          property="og:title"
          content="Free WhatsApp Bot Hosting & Deployment | SAMKIEL BOT"
        />
        <meta
          property="og:description"
          content="SAMKIEL BOT offers free hosting for your WhatsApp automations. No credit card required."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta
          property="og:url"
          content="https://bot.samkiel.dev/free-whatsapp-bot"
        />
        <meta property="og:type" content="article" />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div {...fadeUp}>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-gray-900 dark:text-white">
            Get a Free WhatsApp Bot for Lifetime Automation
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p className="lead text-xl mb-6">
              Is it really possible to get a <strong>free WhatsApp bot</strong>?
              Yes! At SAMKIEL BOT, we believe that everyone — from curious
              students to dedicated community leaders — should have access to
              automation tools without a financial barrier.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Why We Offer Free Bot Hosting
            </h2>
            <p>
              We understand that many users are just starting their automation
              journey. Maybe you want to experiment with a basic group manager
              or just want to see how the <em>View Once Saver</em> works. Our
              "Free Forever" plan is designed to let you explore the power of
              SAMKIEL BOT without any risk.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              What You Get in the Free Plan
            </h2>
            <p>
              Our <strong>free WhatsApp bot</strong> package includes everything
              you need to get started:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>1 Bot Instance:</strong> Deploy one full-featured bot on
                your account.
              </li>
              <li>
                <strong>Shared Hosting:</strong> Your bot runs on our reliable
                community-shared resources.
              </li>
              <li>
                <strong>Basic Features:</strong> Access to standard commands,
                group management, and media handling.
              </li>
              <li>
                <strong>Community Support:</strong> Join our WhatsApp channel to
                get tips and tricks from other users.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              How to Claim Your Free Bot
            </h2>
            <p>
              Getting your free bot is simple. Just register for an account
              using your email. We don't ask for credit card information or any
              upfront payment. Once you're in the dashboard, the "Free" option
              is selected by default for your first deployment.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Comparing Free vs. Premium
            </h2>
            <p>
              While our free plan is powerful, users who need professional
              capabilities often upgrade to our Premium tiers. Premium users get
              dedicated RAM, priority support, and the ability to run multiple
              bots (up to 3) simultaneously. However, for 80% of personal users,
              the <strong>free WhatsApp bot</strong> plan is more than enough!
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Is Free Bot Hosting Safe?
            </h2>
            <p>
              Security is our priority. Even on the free plan, your bot's
              connection is end-to-end encrypted through WhatsApp's official
              protocol. We do not store your private messages; our platform
              simply provides the "engine" that runs your bot script.
            </p>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-2xl mt-12 border border-indigo-100 dark:border-indigo-500/30 text-center">
              <h3 className="text-2xl font-bold mb-4 text-indigo-900 dark:text-indigo-100">
                No Hidden Fees. No Credit Card Needed.
              </h3>
              <p className="mb-6">
                Join the SAMKIEL BOT community today and experience the future
                of WhatsApp automation for $0.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition"
                >
                  Get Started for Free
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}
