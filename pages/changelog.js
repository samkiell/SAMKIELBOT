import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GitCommit,
  Tag,
  Calendar,
  User,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Layout from "../components/Layout";

export default function ChangelogPage({ commits, latestVersion, error }) {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-slate-900 min-h-screen">
        <Head>
          <title>Changelog | SAMKIEL BOT</title>
          <meta
            name="description"
            content="Recent updates and changes to SAMKIEL Bot"
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
              Changelog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Recent updates and changes to SAMKIEL Bot
            </p>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 mb-12 text-center"
            >
              <AlertCircle
                className="mx-auto mb-3 text-yellow-600 dark:text-yellow-400"
                size={32}
              />
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Unable to load changelog
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Please try again later
              </p>
            </motion.div>
          )}

          {/* Latest Version Section */}
          {!error && latestVersion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-slate-600 rounded-2xl p-8 mb-12"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-lg">
                    <Tag className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {latestVersion.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Latest Version
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar size={16} />
                  <span>{formatDate(latestVersion.date)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Development Build Message */}
          {!error && !latestVersion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-12 text-center"
            >
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Development build
              </p>
            </motion.div>
          )}

          {/* Recent Commits */}
          {!error && commits && commits.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Changes
              </h3>
              <div className="space-y-4">
                {commits.map((commit, index) => (
                  <motion.div
                    key={commit.sha}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <GitCommit
                            className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                            size={18}
                          />
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {commit.message}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ml-9">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>{commit.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{formatDate(commit.date)}</span>
                          </div>
                          <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {commit.shortSha}
                          </code>
                        </div>
                      </div>
                      {commit.url && (
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-semibold transition-colors"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Support CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-indigo-200 dark:border-slate-600 rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Want to contribute?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
              Check out our GitHub repository to see the latest changes and
              contribute to the project.
            </p>
            <a
              href="https://github.com/samkiell/SAMKIELBOT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
            >
              View on GitHub
            </a>
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}

// Server-side data fetching with ISR
export async function getStaticProps() {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const owner = "samkiell";
    const repo = "SAMKIELBOT";

    const headers = GITHUB_TOKEN
      ? {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        }
      : {
          Accept: "application/vnd.github.v3+json",
        };

    // Fetch latest release/tag
    let latestVersion = null;
    try {
      const releasesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        { headers }
      );

      if (releasesResponse.ok) {
        const release = await releasesResponse.json();
        latestVersion = {
          name: release.tag_name || release.name,
          date: release.published_at || release.created_at,
        };
      } else {
        // Try tags as fallback
        const tagsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/tags?per_page=1`,
          { headers }
        );

        if (tagsResponse.ok) {
          const tags = await tagsResponse.json();
          if (tags.length > 0) {
            latestVersion = {
              name: tags[0].name,
              date: null, // Tags don't have dates
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching release/tag:", error);
      // Continue without version info
    }

    // Fetch recent commits
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=15`,
      { headers }
    );

    if (!commitsResponse.ok) {
      throw new Error("Failed to fetch commits");
    }

    const commitsData = await commitsResponse.json();
    const commits = commitsData.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message.split("\n")[0], // First line only
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));

    return {
      props: {
        commits,
        latestVersion,
        error: null,
      },
      revalidate: 3600, // Revalidate every 1 hour
    };
  } catch (error) {
    console.error("Error fetching changelog data:", error);
    return {
      props: {
        commits: [],
        latestVersion: null,
        error: "Failed to load changelog data",
      },
      revalidate: 3600,
    };
  }
}
