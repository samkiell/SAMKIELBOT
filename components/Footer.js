import Link from "next/link";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../lib/auth";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 px-6 py-10 mt-16 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-4 text-xs tracking-widest uppercase">
              Platform
            </h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Home
              </Link>
              <Link
                href="/support"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Support Center
              </Link>
              <Link
                href="/bots"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Community Bots
              </Link>
              <Link
                href="/credits/buy"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Pricing
              </Link>
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                  >
                    Register
                  </Link>
                </>
              )}
              {user && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Column 2: Resources */}
          <div className="text-center md:text-left">
            <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-4 text-xs tracking-widest uppercase">
              Resources
            </h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/whatsapp-bot"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                What is a WhatsApp Bot?
              </Link>
              <Link
                href="/deploy-whatsapp-bot"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Deployment Guide
              </Link>
              <Link
                href="/free-whatsapp-bot"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Free Bot Hosting
              </Link>
              <Link
                href="/view-once-whatsapp"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                View Once Recovery
              </Link>
              <Link
                href="/how-billing-works"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium"
              >
                How Billing Works (Transparency)
              </Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="text-center md:text-left">
            <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-4 text-xs tracking-widest uppercase">
              Legal
            </h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/terms"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Column 4: Connect With Us */}
          <div className="text-center md:text-right">
            <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-4 text-xs tracking-widest uppercase">
              Contact
            </h3>
            <div className="flex justify-center md:justify-end space-x-4">
              <a
                href="https://github.com/samkiell"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:scale-110"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://linkedin.com/in/samkiell"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:scale-110"
              >
                <FaLinkedin size={24} />
              </a>
              <a
                href="mailto:info@samkielbot.app"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:scale-110"
              >
                <FaEnvelope size={24} />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                info@samkielbot.app
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          © {new Date().getFullYear()} 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋. All rights reserved. <br />
          Made with ❤️ by{" "}
          <a
            href="https://www.samkiel.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            SAMKIEL
          </a>
        </div>
      </div>
    </footer>
  );
}
