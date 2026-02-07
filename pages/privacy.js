import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaArrowLeft,
  FaEyeSlash,
  FaDatabase,
  FaLock,
  FaUserShield,
} from "react-icons/fa";

export default function Privacy() {
  const router = useRouter();

  const handleGoBack = () => {
    const returnRoute = sessionStorage.getItem("return_route");
    if (returnRoute) {
      router.push(`/${returnRoute}`);
    } else {
      router.push("/");
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-800 dark:text-gray-100 py-12 px-6 transition-colors duration-300 font-sans">
      <Head>
        <title>Privacy Policy | 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        <meta
          name="description"
          content="Privacy Policy for 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋. Learn how we handle your data with care and transparency."
        />
      </Head>

      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all font-medium mb-8 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-gray-900 dark:text-white">
            Privacy{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Policy</span>
          </h1>
          <div className="p-6 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-r-xl">
            <p className="text-lg italic leading-relaxed">
              "We take your privacy seriously. Like,
              'hacker-movie-terminal-scrolling' seriously. We're not here to spy
              on you; we're just here to host your bots. Here is the breakdown
              of what we know, what we don't, and why we care."
            </p>
          </div>
        </motion.div>

        <div className="space-y-12 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {/* Section 1: Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="text-2xl text-indigo-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                1. The Privacy Promise
              </h2>
            </div>
            <p>
              Privacy is a human right. In the age of big data, we want to be
              small on data. We collect the absolute minimum required to keep
              your bots alive and your billing accurate. We believe your
              business should stay your business.
            </p>
          </section>

          {/* Section 2: What we do NOT read */}
          <section className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaEyeSlash className="text-2xl text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                2. What We DO NOT Read
              </h2>
            </div>
            <p className="mb-4">
              Let's be 100% clear:{" "}
              <strong>We do not read your messages.</strong>
            </p>
            <p>
              Your bots run on isolated instances. We don't have a giant screen
              in our office showing your private chats. Your 3 AM sticker wars
              and high-level group strategies are between you and WhatsApp. We
              provide the engine; we don't watch the road.
            </p>
          </section>

          {/* Section 3: Data We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaDatabase className="text-2xl text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                3. Data We Actually Collect
              </h2>
            </div>
            <p className="mb-4">
              To make this platform work, we need a few things:
            </p>
            <ul className="space-y-3 list-disc list-inside">
              <li>
                <strong>Basic Info:</strong> Your email and username so we know
                who you are.
              </li>
              <li>
                <strong>Billing Data:</strong> Credit balance and transaction
                history (money matters!).
              </li>
              <li>
                <strong>Bot Stats:</strong> How many bots you've deployed and
                their online status.
              </li>
              <li>
                <strong>Logs:</strong> Technical logs (errors, crashes) so we
                can fix things when they break.
              </li>
            </ul>
          </section>

          {/* Section 4: Credentials */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaLock className="text-2xl text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                4. Your Credentials (The Important Stuff)
              </h2>
            </div>
            <p>
              When you scan the QR code, a session token is generated. This
              token stays encrypted and is used ONLY to identify your instance
              to WhatsApp. We treat these tokens like gold. They are not shared,
              sold, or used for anything other than running your bot.
            </p>
          </section>

          {/* Section 5: Transparency */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaUserShield className="text-2xl text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                5. No Shady Business
              </h2>
            </div>
            <p>
              We do not sell your data to advertisers. We don't have 50 hidden
              trackers on this page. We're a bot platform, not an ad agency. We
              make money when you buy credits, not by selling your digital soul
              to third parties.
            </p>
          </section>

          {/* Section 6: User Rights */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              6. Your Data, Your Rules
            </h2>
            <p>
              Want to see what we have on you? Ask. Want to be forgotten? Delete
              your account. We respect your right to be forgotten (though we'd
              be sad to see you go). Most data is deleted instantly when you
              remove a bot or your account.
            </p>
          </section>

          {/* Section 7: Final Reassurance */}
          <section className="text-center py-12 bg-indigo-600 rounded-3xl text-white shadow-xl">
            <h2 className="text-3xl font-black mb-4">Still Worried?</h2>
            <p className="text-indigo-100 max-w-2xl mx-auto mb-8 px-6">
              Our code is built on the principle of isolation. Each bot lives in
              its own "room." No cross-over, no spying, just pure automation
              efficiency.
            </p>
            <Link
              href="/support"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all font-sans"
            >
              Ask Us Anything
            </Link>
          </section>
        </div>
      </div>

      {/* Floating Go Back Button */}
      <button
        onClick={handleGoBack}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Go back"
      >
        <FaArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
