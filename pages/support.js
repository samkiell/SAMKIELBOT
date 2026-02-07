import Head from "next/head";
import { motion } from "framer-motion";
import {
  FaWhatsapp,
  FaEnvelope,
  FaUsers,
  FaBell,
  FaShieldAlt,
  FaRobot,
  FaCreditCard,
  FaRocket,
  FaEye,
} from "react-icons/fa";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { getDeployments, submitSupportTicket } from "../lib/api";
import toast from "react-hot-toast";
import { FaBug, FaPaperPlane } from "react-icons/fa";

export default function Support() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "Deployment",
    description: "",
    botId: "",
  });

  useEffect(() => {
    if (user) {
      fetchBots();
    }
  }, [user]);

  // Handle Hash link
  useEffect(() => {
    if (window.location.hash === "#bug") {
      const element = document.getElementById("report-issue");
      if (element) {
        // Short delay to ensure rendering
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
          // Optional: Highlight effect
          element.classList.add("ring-4", "ring-indigo-300");
          setTimeout(
            () => element.classList.remove("ring-4", "ring-indigo-300"),
            2000,
          );
        }, 500);
      }
    }
  }, []);

  const fetchBots = async () => {
    try {
      const data = await getDeployments();
      setBots(data || []);
    } catch (error) {
      console.error("Error fetching bots:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      return toast.error("Please provide a description of the issue.");
    }

    setLoading(true);
    try {
      await submitSupportTicket(formData);
      toast.success("Bug report submitted! Our team will look into it.");
      setFormData({
        category: "Deployment",
        description: "",
        botId: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  const supportChannels = [
    {
      icon: <FaBell className="text-blue-500 text-3xl" />,
      title: "Official Updates Channel",
      label: "WhatsApp Channel",
      description: "For announcements, updates, and platform news.",
      link: "https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h",
      buttonText: "Join Channel",
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: <FaUsers className="text-green-500 text-3xl" />,
      title: "Community Support",
      label: "WhatsApp Group",
      description: "Ask questions, get help from community members and admins.",
      link: "https://chat.whatsapp.com/Jgrc79greN63Omt5T7LTzs",
      buttonText: "Join Group",
      color: "bg-green-50 dark:bg-green-900/20",
    },
    {
      icon: <FaWhatsapp className="text-indigo-500 text-3xl" />,
      title: "Direct Support",
      label: "Personal WhatsApp",
      description:
        "Direct support for urgent issues and technical emergencies.",
      link: "https://wa.me/2348087357158",
      buttonText: "Chat Now",
      color: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      icon: <FaEnvelope className="text-red-500 text-3xl" />,
      title: "Email Support",
      label: "support@samkielbot.app",
      description: "For account issues, billing, recovery, and formal support.",
      link: "mailto:support@samkielbot.app",
      buttonText: "Send Email",
      color: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  const faqs = [
    {
      icon: <FaRobot className="text-indigo-500" />,
      question: "Bot not connecting or staying offline?",
      answer:
        "Ensure your WhatsApp session is active. If issues persist, try deleting the deployment and creating a fresh one. Check the official channel for server status updates.",
    },
    {
      icon: <FaCreditCard className="text-indigo-500" />,
      question: "Credits not reflecting after purchase?",
      answer:
        "Transactions are processed instantly. If your balance doesn't update within 5 minutes, please send your payment reference and email to support@samkielbot.app.",
    },
    {
      icon: <FaRocket className="text-indigo-500" />,
      question: "Deployment stuck on 'Initializing'?",
      answer:
        "Deployment usually takes 2-5 minutes. If it exceeds 10 minutes, there might be a network lag. Refresh your dashboard or try redeploying.",
    },
    {
      icon: <FaEye className="text-indigo-500" />,
      question: "How does the View Once feature work?",
      answer:
        "Once enabled, the bot automatically saves View Once media to your storage. You can view them anytime through bot commands or designated media folder.",
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-slate-900 min-h-screen">
        <Head>
          <title>Support & Help Center | 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
          <meta
            name="description"
            content="Get help with 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋. Connect with our community, reach out for direct support, or find answers in our FAQ."
          />
        </Head>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          {/* Hero Section */}
          <motion.div {...fadeUp} className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
              Support & Help Center
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Need assistance? Our team and community are here to help you get
              the most out of SAMKIEL BOT. We are active and responsive across
              all channels.
            </p>
          </motion.div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {supportChannels.map((channel, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${channel.color} p-8 rounded-3xl border border-gray-100 dark:border-gray-800/50 flex flex-col h-full items-start group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300`}
              >
                <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {channel.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {channel.title}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
                  {channel.label}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 flex-grow">
                  {channel.description}
                </p>
                <a
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-bold rounded-xl text-center shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-slate-700"
                >
                  {channel.buttonText}
                </a>
              </motion.div>
            ))}
          </div>

          {/* Guidance Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gray-50 dark:bg-slate-800/50 rounded-3xl p-8 md:p-12 mb-20 border border-gray-100 dark:border-gray-800"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  When to use which channel?
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white italic">
                        General Questions
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Join the community group for quick help from other users
                        and moderators.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white italic">
                        Billing & Account
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Send an email for sensitive issues like credit recovery
                        or account restoration.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white italic">
                        Critical Failures
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Use direct WhatsApp support only for urgent technical
                        emergencies that block operations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-green-500" /> Trust & Escalation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                  We take your experience seriously. Most community queries are
                  answered within 2-4 hours. Email support typically responds
                  within 24 hours.
                </p>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    <strong>Response Expectation:</strong> <br />
                    • Chat: 1 - 6 Hours <br />• Email: 12 - 24 Hours
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bug Reporting Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
            id="report-issue"
          >
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
              {/* Decorative Background Circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-widest mb-6">
                    <FaBug className="text-indigo-200" /> Bug Reporting
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
                    Spotted a Bug? <br />
                    Let us squash it.
                  </h2>
                  <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                    Help us improve SAMKIEL BOT by reporting any issues or
                    irregularities you encounter. Our head of engineering
                    [Zabdiel] review every legitimate report.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-indigo-50 text-sm">
                        Deployment & Connectivity issues
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-indigo-50 text-sm">
                        Billing & Credit discrepancies
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-indigo-50 text-sm">
                        Dashboard & UI glitches
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Issue Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      >
                        <option value="Deployment">Deployment</option>
                        <option value="Credits & Billing">
                          Credits & Billing
                        </option>
                        <option value="Bot Runtime">Bot Runtime</option>
                        <option value="UI / Dashboard">UI / Dashboard</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {user && bots.length > 0 && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Related Bot (Optional)
                        </label>
                        <select
                          name="botId"
                          value={formData.botId}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                          <option value="">None / Selective</option>
                          {bots.map((bot) => (
                            <option key={bot._id} value={bot._id}>
                              {bot.botName} ({bot.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Issue Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="What happened? How can we reproduce it?"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[120px] resize-none"
                        required
                      ></textarea>
                    </div>

                    <p className="text-[10px] text-gray-400 leading-tight">
                      By submitting, you agree to share your account metadata
                      (email, ID, bot status) with our support team to help
                      diagnose the issue.
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FAQ Preview */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Quick answers to common hurdles.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="mt-1 text-xl">{faq.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Can't find what you're looking for? Reach out via the channels
                above.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
