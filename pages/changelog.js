import { useState } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  FaCodeBranch,
  FaRocket,
  FaBug,
  FaWrench,
  FaPlus,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Octokit } from "@octokit/rest";

const ITEMS_PER_PAGE = 15;

// Categorize commits based on message patterns
function categorizeCommit(message) {
  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes("fix") ||
    lowerMsg.includes("bug") ||
    lowerMsg.includes("patch")
  ) {
    return {
      type: "fix",
      icon: FaBug,
      color: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/30",
    };
  }
  if (
    lowerMsg.includes("feat") ||
    lowerMsg.includes("add") ||
    lowerMsg.includes("new")
  ) {
    return {
      type: "feature",
      icon: FaPlus,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/30",
    };
  }
  if (
    lowerMsg.includes("update") ||
    lowerMsg.includes("upgrade") ||
    lowerMsg.includes("improve")
  ) {
    return {
      type: "update",
      icon: FaSync,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    };
  }
  if (
    lowerMsg.includes("refactor") ||
    lowerMsg.includes("clean") ||
    lowerMsg.includes("optimize")
  ) {
    return {
      type: "refactor",
      icon: FaWrench,
      color: "text-yellow-500",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    };
  }
  if (
    lowerMsg.includes("release") ||
    lowerMsg.includes("deploy") ||
    lowerMsg.includes("version")
  ) {
    return {
      type: "release",
      icon: FaRocket,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    };
  }
  return {
    type: "commit",
    icon: FaCodeBranch,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-700",
  };
}

// Format date nicely
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function getStaticProps() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Fetch commits from the SAMKIEL-AI repo
    const { data: commits } = await octokit.repos.listCommits({
      owner: "samkiell",
      repo: "SAMKIEL-AI",
      per_page: 100, // Fetch last 100 commits
    });

    const formattedCommits = commits.map((commit) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split("\n")[0], // First line only
      fullMessage: commit.commit.message,
      date: commit.commit.author.date,
      author: commit.commit.author.name,
    }));

    return {
      props: {
        commits: formattedCommits,
        lastUpdated: new Date().toISOString(),
      },
      revalidate: 1800, // Revalidate every 30 minutes
    };
  } catch (error) {
    console.error("Failed to fetch commits:", error);
    return {
      props: {
        commits: [],
        lastUpdated: new Date().toISOString(),
      },
      revalidate: 300,
    };
  }
}

export default function ChangelogPage({ commits, lastUpdated }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("all");

  // Filter commits by type
  const filteredCommits = commits.filter((commit) => {
    if (filterType === "all") return true;
    const { type } = categorizeCommit(commit.message);
    return type === filterType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCommits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCommits = filteredCommits.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Group commits by date
  const groupedCommits = paginatedCommits.reduce((groups, commit) => {
    const date = new Date(commit.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(commit);
    return groups;
  }, {});

  const filterOptions = [
    { value: "all", label: "All Changes", icon: FaCodeBranch },
    { value: "feature", label: "Features", icon: FaPlus },
    { value: "fix", label: "Bug Fixes", icon: FaBug },
    { value: "update", label: "Updates", icon: FaSync },
    { value: "refactor", label: "Refactors", icon: FaWrench },
    { value: "release", label: "Releases", icon: FaRocket },
  ];

  return (
    <>
      <Head>
        <title>Changelog | SAMKIEL BOT - Deployment Platform</title>
        <meta
          name="description"
          content="View the latest updates, features, and bug fixes for SAMKIEL BOT deployment platform."
        />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <FaCodeBranch className="text-3xl text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Changelog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stay up to date with the latest improvements, features, and fixes
              to SAMKIEL BOT.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 justify-center mb-8"
          >
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterType(option.value);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === option.value
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8"
          >
            Showing {filteredCommits.length} changes
            {filterType !== "all" && ` (filtered)`}
          </motion.div>

          {/* Timeline */}
          {Object.keys(groupedCommits).length === 0 ? (
            <div className="text-center py-20">
              <FaCodeBranch className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                No changes found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try a different filter or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedCommits).map(
                ([date, dateCommits], groupIndex) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * groupIndex }}
                  >
                    {/* Date Header */}
                    <div className="sticky top-20 z-10 bg-gray-50/95 dark:bg-[#0f172a]/95 backdrop-blur-sm py-2 mb-4">
                      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {date}
                      </h2>
                    </div>

                    {/* Commits for this date */}
                    <div className="space-y-3">
                      {dateCommits.map((commit, index) => {
                        const category = categorizeCommit(commit.message);
                        const Icon = category.icon;

                        return (
                          <motion.div
                            key={commit.sha}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * index }}
                            className="relative pl-8 group"
                          >
                            {/* Timeline line */}
                            <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700 group-last:hidden" />

                            {/* Icon */}
                            <div
                              className={`absolute left-0 top-1 w-6 h-6 rounded-full ${category.bg} flex items-center justify-center`}
                            >
                              <Icon className={`text-xs ${category.color}`} />
                            </div>

                            {/* Content */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 dark:text-white font-medium">
                                    {commit.message}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                      {commit.sha}
                                    </span>
                                    <span>{formatDate(commit.date)}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${category.bg} ${category.color}`}
                                    >
                                      {category.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex items-center justify-center gap-2"
            >
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FaChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FaChevronRight size={14} />
              </button>
            </motion.div>
          )}

          {/* Page indicator */}
          {totalPages > 1 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
