import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Globe,
  Zap,
  MessageSquare,
  CreditCard,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Layout from "../components/Layout";

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // System components with their current status
  // In production, fetch this from /api/status
  const [systemStatus, setSystemStatus] = useState({
    overall: "operational", // operational | degraded | down
    components: [
      {
        id: "website",
        name: "Website / Dashboard",
        description: "Main application interface and user dashboard",
        status: "operational",
        icon: Globe,
      },
      {
        id: "deployment",
        name: "Bot Deployment Service",
        description: "Bot creation and provisioning system",
        status: "operational",
        icon: Zap,
      },
      {
        id: "runtime",
        name: "Bot Runtime",
        description: "Active bot instances and execution environment",
        status: "operational",
        icon: Server,
      },
      {
        id: "whatsapp",
        name: "WhatsApp Connectivity",
        description: "WhatsApp API and messaging services",
        status: "operational",
        icon: MessageSquare,
      },
      {
        id: "billing",
        name: "Billing & Credits",
        description: "Payment processing and credit management",
        status: "operational",
        icon: CreditCard,
      },
    ],
  });

  // Maintenance notices (fetch from API in production)
  const maintenanceNotices = [];
  // Example:
  // {
  //   title: "Scheduled Maintenance",
  //   description: "Database optimization and performance improvements",
  //   scheduledFor: "2025-12-25 02:00 UTC",
  //   duration: "30 minutes",
  // }

  // Incident history (static for now, fetch from API later)
  const incidentHistory = [
    {
      id: 1,
      date: "2025-12-15",
      title: "WhatsApp API Rate Limiting",
      description: "Temporary slowdown in message delivery resolved",
      duration: "45 minutes",
      status: "resolved",
    },
    {
      id: 2,
      date: "2025-12-10",
      title: "Deployment Service Delay",
      description: "Increased deployment times due to high demand",
      duration: "2 hours",
      status: "resolved",
    },
  ];

  useEffect(() => {
    // In production, fetch real-time status from API
    // fetchSystemStatus();
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update timestamp every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "text-green-600 dark:text-green-400";
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "operational":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "degraded":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "down":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return (
          <CheckCircle2
            className="text-green-600 dark:text-green-400"
            size={24}
          />
        );
      case "degraded":
        return (
          <AlertTriangle
            className="text-yellow-600 dark:text-yellow-400"
            size={24}
          />
        );
      case "down":
        return <XCircle className="text-red-600 dark:text-red-400" size={24} />;
      default:
        return (
          <Activity className="text-gray-600 dark:text-gray-400" size={24} />
        );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded Performance";
      case "down":
        return "Service Down";
      default:
        return "Unknown";
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-slate-900 min-h-screen">
        <Head>
          <title>System Status | SAMKIEL BOT</title>
          <meta
            name="description"
            content="Real-time status of SAMKIEL BOT platform services and infrastructure."
          />
        </Head>

        <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20">
          {/* Back Link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          {/* Hero Section */}
          <motion.div {...fadeUp} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              System Status
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Real-time monitoring of all SAMKIEL BOT platform services
            </p>
          </motion.div>

          {/* Overall Status Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`${getStatusBg(
              systemStatus.overall
            )} border rounded-2xl p-6 md:p-8 mb-12 shadow-sm`}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(systemStatus.overall)}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemStatus.overall === "operational"
                      ? "All Systems Operational"
                      : systemStatus.overall === "degraded"
                      ? "Experiencing Issues"
                      : "Service Disruption"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All services are running smoothly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock size={16} />
                <span>
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Maintenance Notices */}
          {maintenanceNotices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Scheduled Maintenance
              </h3>
              <div className="space-y-4">
                {maintenanceNotices.map((notice, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <Clock
                        className="text-blue-600 dark:text-blue-400 mt-1"
                        size={20}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {notice.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notice.description}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            <strong>Scheduled:</strong> {notice.scheduledFor}
                          </span>
                          <span>
                            <strong>Duration:</strong> {notice.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* System Components */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Service Components
            </h3>
            <div className="space-y-4">
              {systemStatus.components.map((component, index) => {
                const Icon = component.icon;
                return (
                  <motion.div
                    key={component.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <Icon
                            className="text-gray-700 dark:text-gray-300"
                            size={24}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {component.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {component.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(component.status)}
                        <span
                          className={`font-semibold ${getStatusColor(
                            component.status
                          )}`}
                        >
                          {getStatusText(component.status)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Incident History */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Incidents
            </h3>
            {incidentHistory.length > 0 ? (
              <div className="space-y-4">
                {incidentHistory.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {incident.date}
                          </span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                            Resolved
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {incident.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {incident.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Duration: {incident.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                <CheckCircle2
                  className="mx-auto mb-3 text-green-600 dark:text-green-400"
                  size={32}
                />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  No incidents reported in the last 30 days
                </p>
              </div>
            )}
          </motion.div>

          {/* Support CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-slate-600 rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Still experiencing issues?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
              If you're encountering problems not reflected here, our support
              team is ready to help.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
            >
              Contact Support
            </Link>
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}
