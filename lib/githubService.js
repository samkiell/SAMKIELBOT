import { Octokit } from "@octokit/rest";

// Initialize Octokit (GitHub API Client)
// We use a PAT if available to increase rate limits, otherwise authenticated requests are limited
// But for ISR (build time) it's usually fine.
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Updated to match user's .env variable
});

const REPO_OWNER = "samkiell";
const REPO_NAME = "SAMKIEL-AI";
const COMMANDS_PATH = "commands";

/**
 * Parses raw JavaScript content to extract command metadata.
 * Validates that the file is actually a command by checking for required fields.
 */
function parseCommandFile(content, filename) {
  try {
    // Helper to extract string values (supports single/double quotes and backticks)
    const extract = (key) => {
      // Use backreference \1 to ensure the closing quote matches the opening quote
      const regex = new RegExp(`${key}\\s*:\\s*(["'\`])(.*?)\\1`, "i");
      const match = content.match(regex);
      return match ? match[2] : null;
    };

    // Helper to extract arrays (permissions/categories sometimes arrays)
    const extractArray = (key) => {
      const regex = new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`, "i");
      const match = content.match(regex);
      if (!match) return [];
      return match[1]
        .split(",")
        .map((s) => s.trim().replace(/['"`]/g, ""))
        .filter(Boolean);
    };

    let name = extract("name");

    // Check if the extracted name is "junk" (dynamic code snippets or too long)
    const isJunk = (val) =>
      !val ||
      val.includes("${") ||
      val.includes("||") ||
      val.includes("(") ||
      val.length > 30;

    // Fallback: If no name found or if it's a code snippet, use filename
    if (!name || isJunk(name)) {
      name = filename.replace(/\.(js|ts)$/, "");
    }

    // Strict validation: A file MUST have a name to be a valid command
    if (!name) return null;

    // Helper to generate varied automated descriptions
    const generateDescription = (cmdName) => {
      const templates = [
        `Execute the ${cmdName} command.`,
        `Runs the ${cmdName} functionality.`,
        `Use ${cmdName} to interact with the bot.`,
        `Trigger the ${cmdName} action.`,
        `Standard ${cmdName} operation.`,
      ];
      // Simple hash to consistently pick a template based on name
      const index = cmdName.length % templates.length;
      return templates[index];
    };

    let rawDescription = extract("description");
    if (isJunk(rawDescription)) rawDescription = null;
    const description = rawDescription || generateDescription(name);

    let rawUsage = extract("usage");
    if (isJunk(rawUsage)) rawUsage = null;
    const usage = rawUsage || name;

    const category = extract("category") || "general";
    const permissions = extractArray("permissions"); // e.g. ['admin', 'group']
    const credits = parseInt(extract("credits") || "0");
    const aliases = extractArray("aliases"); // Capture aliases for advanced counting if needed

    return {
      id: filename,
      name,
      description,
      category: category.toLowerCase(),
      usage,
      permissions: permissions.length > 0 ? permissions : ["public"],
      credits,
      aliases,
      filename,
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

export async function fetchCommands() {
  try {
    // 1. Get list of files in the commands directory
    const { data: files } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: COMMANDS_PATH,
    });

    if (!Array.isArray(files)) {
      throw new Error("Commands path is not a directory");
    }

    // 2. Filter for valid command files
    // Logic: Must be .js/.ts, not index.js, not hidden/test files (starting with _)
    const commandFiles = files.filter((file) => {
      const isJsOrTs = file.name.endsWith(".js") || file.name.endsWith(".ts");
      const isNotIndex = file.name.toLowerCase() !== "index.js";
      const isNotPrivate = !file.name.startsWith("_");
      const isFile = file.type === "file";

      return isJsOrTs && isNotIndex && isNotPrivate && isFile;
    });

    // 3. Fetch content for each file (in parallel)
    const processedCommands = await Promise.all(
      commandFiles.map(async (file) => {
        try {
          // Get raw content
          const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: file.path,
          });

          // Content is base64 encoded
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          const parsed = parseCommandFile(content, file.name);

          // If parsing failed or returned null (invalid command), safely filter it out later
          if (!parsed) return null;

          // Add simple URL to file for "View Source" feature
          parsed.githubUrl = file.html_url;

          return parsed;
        } catch (err) {
          console.error(`Failed to fetch content for ${file.name}`, err);
          return null;
        }
      })
    );

    // 4. Final Filter: Remove any files that failed to parse into valid commands
    const validCommands = processedCommands.filter(Boolean);

    // Sort alphabetically by name
    return validCommands.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (
      error.status === 403 &&
      error.headers &&
      error.headers["x-ratelimit-remaining"] === "0"
    ) {
      console.warn("GitHub API rate limit exceeded. Serving mock commands.");
    } else {
      console.error("Error fetching commands from GitHub:", error.message);
    }
    // Return mock data if GitHub fails (fallback / dev mode / rate limited)
    return getMockCommands();
  }
}

function getMockCommands() {
  return [
    {
      id: "menu.js",
      name: "menu",
      description: "Display all available commands",
      category: "utility",
      usage: "!menu",
      permissions: ["public"],
      credits: 0,
      githubUrl: "#",
    },
    {
      id: "sticker.js",
      name: "sticker",
      description: "Convert an image or video to a sticker",
      category: "media",
      usage: "!sticker (caption image)",
      permissions: ["group", "private"],
      credits: 1,
      githubUrl: "#",
    },
    {
      id: "kick.js",
      name: "kick",
      description: "Remove a user from the group",
      category: "moderation",
      usage: "!kick @user",
      permissions: ["admin", "group"],
      credits: 0,
      githubUrl: "#",
    },
    {
      id: "ai.js",
      name: "ai",
      description: "Ask the AI assistant a question",
      category: "ai",
      usage: "!ai [question]",
      permissions: ["public"],
      credits: 2,
      githubUrl: "#",
    },
  ];
}
