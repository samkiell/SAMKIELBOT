import Link from "next/link";
import { Coins, Zap, Server, TrendingUp } from "lucide-react";

/**
 * Empty State: No Credits
 * Displayed when user has zero credits
 * Placement: Dashboard, Deploy page, anywhere credit balance is shown
 */
export function NoCreditsState() {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-8 md:p-10 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Coins className="text-orange-600 dark:text-orange-400" size={32} />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        You're out of credits
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-lg mx-auto">
        Credits power your bot operations. They enable bot runtime, resource
        allocation, and continuous uptime so your WhatsApp bot stays online
        24/7.
      </p>

      {/* What Credits Unlock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
          <Zap
            className="text-indigo-600 dark:text-indigo-400 mb-2"
            size={20}
          />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
            Bot Runtime
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Keep your bot active and responding to messages
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
          <Server
            className="text-indigo-600 dark:text-indigo-400 mb-2"
            size={20}
          />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
            Resource Allocation
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            CPU, RAM, and storage for smooth performance
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
          <TrendingUp
            className="text-indigo-600 dark:text-indigo-400 mb-2"
            size={20}
          />
          <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
            Continuous Uptime
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            24/7 availability without interruptions
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/credits/buy"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Coins size={18} />
          Get Credits
        </Link>
        <Link
          href="/credits/claim"
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold px-6 py-3 rounded-xl transition-all border border-gray-200 dark:border-slate-700"
        >
          Claim Daily Bonus
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
        Need help?{" "}
        <Link
          href="/support"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Contact support
        </Link>
      </p>
    </div>
  );
}

/**
 * Empty State: No Activity
 * Displayed when user has no bot activity/deployments yet
 * Placement: Dashboard (when deployments.length === 0), Activity logs
 */
export function NoActivityState() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-700/40 p-8 md:p-12 text-center max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
      <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No activity yet
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed max-w-md mx-auto">
        Once you deploy your first bot, you'll see all your activity here
        including:
      </p>

      {/* What Will Appear */}
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
        <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-3">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              •
            </span>
            <span>
              <strong className="font-semibold">Deployments:</strong> Track when
              your bots go live
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              •
            </span>
            <span>
              <strong className="font-semibold">Restarts:</strong> Monitor bot
              health and uptime
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              •
            </span>
            <span>
              <strong className="font-semibold">Credit Usage:</strong> See how
              credits are consumed
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              •
            </span>
            <span>
              <strong className="font-semibold">Errors & Logs:</strong> Debug
              issues quickly
            </span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <Link
        href="/deploy"
        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Deploy Your First Bot
      </Link>

      <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
        New to SAMKIEL BOT?{" "}
        <Link
          href="/support"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Check our getting started guide
        </Link>
      </p>
    </div>
  );
}

/**
 * Empty State: Low Credits Warning
 * Displayed when user has credits but they're running low
 * Placement: Dashboard banner, before deployment
 */
export function LowCreditsWarning({ currentCredits = 0 }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-yellow-900 dark:text-yellow-200 text-sm mb-1">
            Credits running low
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
            You have {currentCredits} credits remaining. Top up now to avoid
            service interruptions.
          </p>
          <Link
            href="/credits/buy"
            className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200 hover:text-yellow-700 dark:hover:text-yellow-100 transition-colors"
          >
            Add credits now
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
