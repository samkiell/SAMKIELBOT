import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaGavel, FaArrowLeft, FaExclamationTriangle, FaRobot, FaBan, FaSyncAlt } from "react-icons/fa";

export default function Terms() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("samkiel_read_terms", "true");
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-800 dark:text-gray-100 py-12 px-6 transition-colors duration-300">
      <Head>
        <title>Terms & Conditions | SAMKIEL BOT</title>
        <meta name="description" content="The ground rules for using SAMKIEL BOT. Plain English, zero fluff." />
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
            Terms of <span className="text-indigo-600 dark:text-indigo-400">Service</span>
          </h1>
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl">
            <p className="text-lg italic leading-relaxed">
              "Look, we hate legalese as much as you do. We've tried to keep this short, honest, and human. 
              But let's be clear: by using SAMKIEL BOT, you're agreeing to these rules. No fingers crossed behind your back."
            </p>
          </div>
        </motion.div>

        <div className="space-y-12 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          {/* Section 1: Welcome */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaRobot className="text-2xl text-indigo-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">1. Welcome to the Mission</h2>
            </div>
            <p>
              Welcome to SAMKIEL BOT. We provide a platform that lets you deploy and manage WhatsApp bots on our cloud infrastructure. 
              It's fast, it's powerful, and it's built to make your life easier. By clicking "Deploy" or even just hanging out here, 
              you're entering into a contract with us.
            </p>
          </section>

          {/* Section 2: Is and Is Not */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-2xl text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">2. What We Are (and Are Not)</h2>
            </div>
            <p>
              SAMKIEL BOT is a deployment platform. We provide the tools and the hosting. 
              What we are <strong>not</strong> is a free pass to break WhatsApp's rules. 
              We don't own your bot, we don't control what it says, and we definitely don't have a "get out of jail free" card from Meta.
            </p>
          </section>

          {/* Section 3: User Responsibilities */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaGavel className="text-2xl text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">3. You Are in the Driver's Seat</h2>
            </div>
            <p>
              When you deploy a bot, you are 100% responsible for it. If your bot decides to start an argument in a group chat or 
              sends 5,000 messages to your ex, that's on you. You agree to follow all local laws and WhatsApp's own policies. 
              If you use our tools to do something illegal or mean, we reserve the right to kick you off the platform faster than 
              you can type "/help".
            </p>
          </section>

          {/* Section 4: WhatsApp Relationship */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaBan className="text-2xl text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">4. The WhatsApp Disclaimer</h2>
            </div>
            <p>
              <strong>Crucial bit:</strong> SAMKIEL BOT is not affiliated with, endorsed by, or even liked in a Facebook-official way by WhatsApp or Meta. 
              We use their platform to help you automate, but they can (and do) change their rules whenever they feel like it. 
              If they decide they don't like automation today, we might all have a bad day.
            </p>
          </section>

          {/* Section 5: Bans & Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaBan className="text-2xl text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5. Account Bans (The Ouch Section)</h2>
            </div>
            <p>
              WhatsApp is very protective of its users. If you use your bot to spam, harass, or generally be a nuisance, <strong>WhatsApp will ban you.</strong> 
              When that happens, we cannot help you get your account back. We are not responsible for any bans, lost data, 
              or the emotional trauma of having to use SMS for a week. Use automation wisely.
            </p>
          </section>

          {/* Section 6: Bot Usage & Abuse */}
          <section className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">The "Don't Be That Person" List:</h3>
            <ul className="space-y-3 list-disc list-inside">
              <li>No spamming. Seriously, nobody likes it.</li>
              <li>No harassment or hate speech. Be a decent human.</li>
              <li>No illegal content. Don't make us involve the police.</li>
              <li>No attempting to hack or disrupt our platform.</li>
            </ul>
          </section>

          {/* Section 7: Service Availability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FaSyncAlt className="text-2xl text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">6. Uptime & "Oopsies"</h2>
            </div>
            <p>
              We aim for 99.9% uptime, but sometimes servers have a "Monday" too. We do not guarantee that our service will be 
              available 24/7 without interruption. If the platform goes down for maintenance or because a digital meteor hit us, 
              we aren't liable for any lost "bot productivity."
            </p>
          </section>

          {/* Section 8: Updates to Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. We Change, You Change</h2>
          </div>
            <p>
              As we add new features (or as the internet changes), we might update these terms. If we make big changes, we'll try to let you know, 
              but it's ultimately your job to check back here occasionally. CONTINUED USE = AGREEMENT.
            </p>
          </section>

          {/* Section 9: Acceptance */}
          <section className="text-center py-12 border-t border-gray-100 dark:border-gray-800">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-6">
              Ready to be a responsible bot owner?
            </p>
            <Link
              href="/register"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
            >
              I Accept, Let's Go!
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
