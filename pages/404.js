import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";
import { Home, Search, Ghost, AlertCircle } from "lucide-react";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <Head>
        <title>404 - Even the Bot is Lost | SAMKIEL BOT</title>
      </Head>

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Floating Ghost Icon */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block mb-8 p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm shadow-2xl shadow-blue-500/10"
          >
            <Ghost size={80} className="text-blue-400" />
          </motion.div>

          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
            404
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Houston, We Have a Problem...
          </h2>

          <div className="space-y-4 mb-10">
            <p className="text-gray-400 text-lg">
              Looks like our bot went for a coffee break and never came back.
              The page you're looking for has joined the underground bot
              resistance or simply doesn't exist.
            </p>
            <div className="flex items-center justify-center gap-2 text-indigo-400 bg-indigo-500/10 py-2 px-4 rounded-full w-fit mx-auto border border-indigo-500/20">
              <AlertCircle size={18} />
              <span className="text-sm font-medium tracking-wide">
                OBJECT_NOT_FOUND_EXCEPTION
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 w-full sm:w-auto"
            >
              <Home size={20} />
              Back to Safety
            </Link>
            <Link
              href="/commands"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 backdrop-blur-md w-full sm:w-auto"
            >
              <Search size={20} />
              Browse Commands
            </Link>
          </div>

          {/* Sarcastic Comment */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 text-gray-600 text-sm font-mono italic"
          >
            "Even my grandma's bot found it... wait, no she didn't."
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
    </div>
  );
}
