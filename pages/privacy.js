import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Privacy() {
  const router = useRouter();

  useEffect(() => {
    // Mark that user has read the privacy policy
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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-8">
      <Head>
        <title>Privacy Policy - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋</title>
        <meta name="description" content="Privacy Policy for SAMKIEL BOT" />
      </Head>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4">
            At Samkiel Bot, your privacy is important to us.
          </p>
          <ol className="list-decimal list-inside mb-6 space-y-2">
            <li>We do not store or read any personal WhatsApp messages.</li>
            <li>
              Your credentials and access tokens are securely managed and never
              shared with third parties.
            </li>
            <li>
              We may collect limited usage data (like number of deployments) for
              performance monitoring.
            </li>
            <li>
              No user data is sold, rented, or shared with external
              organizations.
            </li>
            <li>
              We comply with standard data protection practices to ensure your
              information remains secure.
            </li>
          </ol>
          <p className="mb-8">
            By using this service, you consent to this privacy policy.
          </p>
        </div>
        <Link
          href="/"
          className="text-blue-500 dark:text-blue-400 hover:underline transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Floating Go Back Button */}
      <button
        onClick={handleGoBack}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
    </div>
  );
}
