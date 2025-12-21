import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function DeployWhatsAppBotPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <Layout>
      <Head>
        <title>How to Deploy WhatsApp Bot in 5 Minutes | SAMKIEL BOT</title>
        <meta
          name="description"
          content="Step-by-step guide on how to deploy a WhatsApp bot online. No coding required. Learn how to host your bot on SAMKIEL BOT with high uptime."
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div {...fadeUp}>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-gray-900 dark:text-white">
            How to Deploy a WhatsApp Bot: The Ultimate Step-by-Step Guide
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <p className="lead text-xl mb-6">
              Many people want to <strong>deploy a WhatsApp bot</strong>, but
              they are often intimidated by terms like "Heroku," "GitHub," or
              "VPS." SAMKIEL BOT was built to simplify this process. In this
              guide, we'll show you how to get your bot online in under 5
              minutes.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Why Deployment Matters
            </h2>
            <p>
              A bot script sitting on your computer is useless if it's not
              running. Proper deployment means hosting your bot on a server that
              stays connected to the internet 24/7. This ensures that your bot
              responds to users even when your phone is offline or your computer
              is turned off.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Prerequisites for Deployment
            </h2>
            <p>Before you begin, ensure you have:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A WhatsApp account (Personal or Business).</li>
              <li>
                A smartphone with an active internet connection (to scan the QR
                code).
              </li>
              <li>A SAMKIEL BOT account.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Step 1: Sign Up on SAMKIEL BOT
            </h2>
            <p>
              Visit our <Link href="/register">registration page</Link> and
              create an account. Our platform handles all the backend
              infrastructure, so you don't need to worry about server management
              or Linux commands.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Step 2: Choose Your Bot Template
            </h2>
            <p>
              Once logged in, navigate to the deployment dashboard. You can
              choose from our list of pre-configured community bots or deploy
              your own custom script if you're a developer. For beginners, we
              recommend starting with a standard multi-device bot template.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Step 3: Pair Your WhatsApp
            </h2>
            <p>
              This is the most critical step. Click on "Deploy" and our system
              will generate a Pairing Code or a QR code. Open WhatsApp on your
              phone, go to <strong>Linked Devices &gt; Link a Device</strong>,
              and scan the code. Your bot is now authenticated and ready to
              work!
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Common Deployment Challenges
            </h2>
            <p>
              When trying to <strong>deploy a WhatsApp bot</strong> on platforms
              like Heroku, users often face "Request Timed Out" or "Session
              Expired" errors. SAMKIEL BOT solves this by using persistent
              session management and dedicated hosting tailored specifically for
              WhatsApp's unique protocol requirements.
            </p>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-gray-100">
              Scaling Your Bot
            </h2>
            <p>
              As your bot grows and handles more groups, you might need more RAM
              or CPU power. SAMKIEL BOT offers flexible plans that allow you to
              upgrade your resources with a single click, ensuring your bot
              never lags during peak hours.
            </p>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-2xl mt-12 border border-indigo-100 dark:border-indigo-500/30">
              <h3 className="text-2xl font-bold mb-4 text-indigo-900 dark:text-indigo-100">
                Deploy Your First Bot Today
              </h3>
              <p className="mb-6">
                Ready to take the leap? Start your{" "}
                <strong>WhatsApp bot deployment</strong> on SAMKIEL BOT for free
                and see the magic happen.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition"
                >
                  Start Deployment
                </Link>
                <Link
                  href="/whatsapp-bot"
                  className="bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-6 py-3 rounded-lg font-bold transition"
                >
                  What is a Bot?
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </Layout>
  );
}
