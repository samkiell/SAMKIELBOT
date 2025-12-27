import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { deployBot, getDeploymentById } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  ArrowLeft,
  Settings,
  Shield,
  Activity,
  Lock,
  MessageSquare,
  Zap,
  Info,
  X,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DeployPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const templates = [
    {
      id: "all-rounder",
      name: "The All-Rounder",
      icon: "⚡",
      desc: "Perfect balance of features and efficiency.",
      config: {
        autoStatusView: "on",
        sendRead: false,
        alwaysOnline: true,
        rejectCall: true,
        commandMode: "public",
        antiDelete: true,
        antiDeleteType: "all",
        autoReaction: false,
      },
    },
    {
      id: "privacy-pro",
      name: "Privacy Pro",
      icon: "🛡️",
      desc: "Maximum security and discrete automation.",
      config: {
        autoStatusView: "off",
        sendRead: false,
        alwaysOnline: false,
        rejectCall: true,
        commandMode: "private",
        antiDelete: true,
        antiDeleteType: "all",
        autoReaction: false,
      },
    },
    {
      id: "social-hub",
      name: "Social Hub",
      icon: "🎉",
      desc: "Great for groups and interactive chats.",
      config: {
        autoStatusView: "msg",
        sendRead: true,
        alwaysOnline: true,
        rejectCall: false,
        commandMode: "public",
        antiDelete: false,
        antiDeleteType: "none",
        autoReaction: true,
      },
    },
  ];

  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      ...template.config,
    }));
    toast.success(`${template.name} template applied!`);
  };

  const [formData, setFormData] = useState({
    botName: "",
    botNumber: "",
    prefix: ".",
    packName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
    ownerName: user?.fullName || "User",
    ownerNumber: user?.whatsappNumber || "",
    // Feature Toggles
    autoStatusView: "on", // "off" | "on" | "msg"
    sendRead: false,
    alwaysOnline: true,
    rejectCall: true,
    commandMode: "public", // "public" | "private"
    antiDelete: true,
    antiDeleteType: "all", // "all" | "group" | "private"
    autoReaction: false,
  });

  useEffect(() => {
    if (user?.fullName) {
      setFormData((prev) => ({
        ...prev,
        ownerName: user.fullName,
        ownerNumber: user.whatsappNumber || prev.ownerNumber,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // client-side validation
    if (!/^\d{10,15}$/.test(formData.botNumber)) {
      toast.error(
        "Invalid WhatsApp number. Use international format without +."
      );
      setLoading(false);
      return;
    }

    if (formData.ownerNumber && !/^\d{10,15}$/.test(formData.ownerNumber)) {
      toast.error(
        "Invalid Owner Number. Use international format without + or spaces."
      );
      setLoading(false);
      return;
    }

    // Prepare Payload
    const payload = {
      botName: formData.botName,
      botNumber: formData.botNumber,
      prefix: formData.prefix,
      packName: formData.packName, // Backend will enforce locking if needed
      ownerName: formData.ownerName,
      ownerNumber: formData.ownerNumber, // Now passing this to backend
      featureToggles: {
        AUTO_STATUS_VIEW: formData.autoStatusView,
        SEND_READ: formData.sendRead,
        ALWAYS_ONLINE: formData.alwaysOnline,
        REJECT_CALL: formData.rejectCall,
        COMMAND_MODE: formData.commandMode,
        ANTI_DELETE: formData.antiDelete,
        ANTI_DELETE_TYPE: formData.antiDeleteType,
        AUTO_REACTION: formData.autoReaction,
        PACKNAME: formData.packName,
      },
      // Resources (Defaults for now, or allow editing if Pro?)
      // We'll let the backend determine default resources based on plan if not specified
    };

    try {
      const deploymentData = await deployBot(payload);
      toast.success("Deployment initialized!");
      router.push(`/deploy/${deploymentData._id}`);
    } catch (error) {
      console.error("Deployment error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Deployment failed. Please try again.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("return_route", router.asPath);
    }
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-20">
      <Head>
        <title>Deploy New Bot - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
      </Head>

      <main className="container mx-auto px-4 max-w-4xl pt-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-2"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Deploy Bot Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your bot's personality and security settings.
            </p>
          </div>

          <button
            onClick={() => setShowInfo(true)}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 text-indigo-500 hover:text-indigo-600 transition-all shadow-md border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-900 group"
            title="Deployment Information"
          >
            <Info
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
        </div>

        {/* Template Selector */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Quick Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="group relative bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t.desc}
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    APPLY
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Modal */}
        <AnimatePresence>
          {showInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInfo(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Info className="text-indigo-500" size={22} />
                    Deployment Guide
                  </h2>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Cost */}
                  <div className="flex gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Deployment Cost
                      </h3>
                      <ul className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>
                          • Setup Fee:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            50 Credits
                          </span>{" "}
                          (One-time)
                        </li>
                        <li>
                          • Maintenance:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            5 Credits
                          </span>{" "}
                          / day
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Provisioning Time
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Deployment is not instant. It typically takes{" "}
                        <span className="font-medium text-gray-900 dark:text-white">
                          2 to 5 minutes
                        </span>{" "}
                        to fully provision your instance and connect to
                        WhatsApp. Please avoid repeated clicks.
                      </p>
                    </div>
                  </div>

                  {/* Responsibility */}
                  <div className="flex gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Usage Responsibility
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Misuse of automation can lead to WhatsApp account bans.
                        Enforcement is outside our control.{" "}
                        <span className="font-medium text-gray-900 dark:text-white">
                          SAMKIEL Bot
                        </span>{" "}
                        is not responsible for any bans resulting from your
                        bot's activity.
                      </p>
                    </div>
                  </div>

                  {/* Monitoring */}
                  <div className="flex gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Operational Status
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        The bot state will update automatically once
                        initialization completes. Please rely on the dashboard
                        status indicators rather than assumptions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setShowInfo(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Core Identity */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Settings className="w-5 h-5 text-indigo-500" />
              Core Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Bot Name
                </label>
                <input
                  type="text"
                  name="botName"
                  value={formData.botName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="My Awesome Bot"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  name="botNumber"
                  value={formData.botNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="2348012345678"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  International format. No '+' or spaces.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Command Prefix
                </label>
                <select
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value=".">. (Dot)</option>
                  <option value=",">, (Comma)</option>
                  <option value="!">! (Exclamation)</option>
                  <option value="#"># (Hash)</option>
                  <option value="/">/ (Slash)</option>
                </select>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex justify-between">
                  Sticker Pack Name
                </label>
                <input
                  type="text"
                  name="packName"
                  value={formData.packName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Owner Name
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Owner Number (Optional)
                </label>
                <input
                  type="text"
                  name="ownerNumber"
                  value={formData.ownerNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="2348012345678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The primary admin number for this bot. Defaults to your linked
                  number if empty.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Privacy & Security */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Shield className="w-5 h-5 text-green-500" />
              Privacy & Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Command Mode
                </label>
                <select
                  name="commandMode"
                  value={formData.commandMode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="public">Public (Everyone can use)</option>
                  <option value="private">Private (Owner only)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <span className="block font-medium dark:text-gray-200">
                    Reject Calls
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Auto-reject voice/video calls
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="rejectCall"
                    checked={formData.rejectCall}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <span className="block font-medium dark:text-gray-200">
                    Anti-Delete
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Forward deleted messages to you
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="antiDelete"
                    checked={formData.antiDelete}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                </label>
              </div>

              {formData.antiDelete && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Anti-Delete Scope
                  </label>
                  <select
                    name="antiDeleteType"
                    value={formData.antiDeleteType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Chats</option>
                    <option value="group">Groups Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Activity & Automation */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Activity className="w-5 h-5 text-blue-500" />
              Activity & Automation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <span className="block font-medium dark:text-gray-200">
                    Always Online
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Keep bot status as 'Online'
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="alwaysOnline"
                    checked={formData.alwaysOnline}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div>
                  <span className="block font-medium dark:text-gray-200">
                    Send Read Receipts
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Blue ticks on messages
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="sendRead"
                    checked={formData.sendRead}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Auto Status View
                </label>
                <select
                  name="autoStatusView"
                  value={formData.autoStatusView}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="off">Off</option>
                  <option value="on">On (View Only)</option>
                  <option value="msg">View + Message</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg opacity-100 relative overflow-hidden">
                <div>
                  <span className="block font-medium dark:text-gray-200 flex items-center gap-2">
                    Auto Reaction
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    React to incoming messages
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="autoReaction"
                    checked={formData.autoReaction}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-4 rounded-xl font-bold transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Deploying...
                </>
              ) : (
                <>
                  <Zap size={20} /> Deploy Bot
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
