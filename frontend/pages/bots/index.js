import { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../lib/auth";
import toast from "react-hot-toast";

export default function BotsList() {
  const { user, token } = useAuth();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots-list`);
      const data = await res.json();
      setBots(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch bots");
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (minutes) => {
    if (!minutes) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Head>
        <title>Active Bots - SAMKIEL BOT</title>
      </Head>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-3xl font-bold mb-8">Community Deployed Bots</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bot Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uptime
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bots.map((bot) => (
                  <tr key={bot._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {bot.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                      {bot.botName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bot.isActive ? (
                        <span className="text-red-500 text-xl">❤️</span>
                      ) : (
                        <span className="text-gray-400 text-xl">🤍</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bot.lastActive).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {formatUptime(bot.uptime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bots.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No active bots yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
