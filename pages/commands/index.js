import { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Terminal,
  Filter,
  Github,
  Command,
  Shield,
  Zap,
  Box,
  ChevronRight,
  ExternalLink,
  Code,
  X,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { fetchCommands } from "../../lib/githubService";

export async function getStaticProps() {
  const commands = await fetchCommands();

  return {
    props: {
      commands,
      lastUpdated: new Date().toISOString(),
    },
    // Incremental Static Regeneration: Re-fetch from GitHub every hour
    revalidate: 3600,
  };
}

export default function CommandsPage({ commands, lastUpdated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCommand, setSelectedCommand] = useState(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(commands.map((c) => c.category));
    return ["all", ...Array.from(cats)];
  }, [commands]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesSearch =
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || cmd.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [commands, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300 font-sans">
      <Head>
        <title>Bot Commands - SAMKIEL BOT</title>
        <meta
          name="description"
          content={`Explore ${commands.length} powerful commands available on SAMKIEL BOT.`}
        />
      </Head>

      <Navbar />

      <main className="relative pt-24 pb-20">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-[#0f172a] dark:to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Command <span className="text-indigo-600">Reference.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Explore the capabilities of SAMKIEL BOT.{" "}
              <br className="hidden md:block" />
              Automated documentation pulled directly from our source code.
            </p>
          </div>

          {/* Controls */}
          <div className="sticky top-20 z-30 bg-gray-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md py-4 mb-8 border-y border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 px-2">
            <span>{filteredCommands.length} commands found</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <span>Updated {new Date(lastUpdated).toLocaleString()}</span>
          </div>

          {/* Grid */}
          {filteredCommands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommands.map((cmd) => (
                <CommandCard
                  key={cmd.id}
                  command={cmd}
                  onClick={() => setSelectedCommand(cmd)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-bold">No commands found</h3>
              <p className="text-gray-500">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}

          {/* Suggestion CTA */}
          <div className="mt-20 border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Have an idea for a command?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl">
                We thrive on community feedback. Suggest a feature or open a
                pull request on GitHub directly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/suggest"
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                <Zap className="mr-2" size={20} />
                Suggest Command
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCommand && (
          <CommandDetailModal
            command={selectedCommand}
            onClose={() => setSelectedCommand(null)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function CommandCard({ command, onClick }) {
  return (
    <motion.div
      layoutId={`card-${command.id}`}
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
            <Terminal
              className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              size={24}
            />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {command.name}
            </h3>
            <span className="text-xs font-mono text-gray-400">
              {command.category}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {command.permissions.includes("admin") && (
            <span
              title="Admin Only"
              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            >
              <Shield size={14} />
            </span>
          )}
          {command.credits > 0 && (
            <span
              title={`Costs ${command.credits} credits`}
              className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-bold px-2"
            >
              <Zap size={12} fill="currentColor" />
              {command.credits}
            </span>
          )}
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
        {command.description}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-500 font-mono">
          {command.usage}
        </code>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-indigo-500"
        />
      </div>
    </motion.div>
  );
}

function CommandDetailModal({ command, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        layoutId={`card-${command.id}`}
        className="relative w-full max-w-2xl bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between bg-gray-50 dark:bg-[#0f172a]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Command className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{command.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {command.category}
                </span>
                {command.permissions.map((perm) => (
                  <span
                    key={perm}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      perm === "admin"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {command.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Usage Syntax
              </h3>
              <div className="bg-gray-900 text-gray-100 p-2 pl-4 pr-2 rounded-xl font-mono text-sm shadow-inner flex items-center justify-between group border border-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                  <ChevronRight size={14} className="text-green-500 shrink-0" />
                  <span className="truncate select-all">{command.name}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white transition-all active:scale-95"
                  title="Copy command"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                Cost Per Use
              </h3>
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                <Zap className="text-amber-500" size={24} fill="currentColor" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg">
                    {command.credits === 0
                      ? "Free"
                      : `${command.credits} Credits`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deducted from balance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Source Link Removed (Private Repo) */}
        </div>
      </motion.div>
    </div>
  );
}
