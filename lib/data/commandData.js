/**
 * Command metadata with descriptions, usage, and categories
 * This data is used to enrich commands fetched from GitHub
 */
const commandData = {
  samkielai: {
    description:
      "Chat with SAMKIEL AI - your intelligent assistant for conversations, questions, and creative tasks.",
    usage: "samkielai <message>",
    category: "AI",
  },
  skai: {
    description: "Short alias for samkielai.",
    usage: "skai <message>",
    category: "AI",
  },
  gpt: {
    description:
      "Chat with the GPT AI model to get answers, write code, or just chat.",
    usage: "gpt <message>",
    category: "AI",
  },
  gemini: {
    description:
      "Interact with Google's Gemini AI for smart conversations and information.",
    usage: "gemini <message>",
    category: "AI",
  },
  dalle: {
    description:
      "Generate stunning AI images using DALL-E. Describe what you want to see.",
    usage: "dalle <prompt>",
    category: "AI",
  },
  imagine: {
    description:
      "Create AI-generated images from your text descriptions.",
    usage: "imagine <prompt>",
    category: "AI",
  },
  sticker: {
    description:
      "Convert images or text to WhatsApp stickers. Reply to an image or provide text.",
    usage: "sticker [text]",
    category: "Media",
  },
  toimg: {
    description:
      "Convert a sticker back to an image file.",
    usage: "toimg",
    category: "Media",
  },
  tomp3: {
    description:
      "Extract audio from a video file and convert it to MP3.",
    usage: "tomp3",
    category: "Media",
  },
  play: {
    description:
      "Search and play music from YouTube. Streams audio directly to the chat.",
    usage: "play <song name or URL>",
    category: "Media",
  },
  video: {
    description:
      "Download videos from YouTube or other platforms.",
    usage: "video <URL or search query>",
    category: "Media",
  },
  lyrics: {
    description:
      "Get the lyrics of any song. Search by song name and artist.",
    usage: "lyrics <song name>",
    category: "Media",
  },
  weather: {
    description:
      "Get current weather information for any city worldwide.",
    usage: "weather <city name>",
    category: "Utility",
  },
  translate: {
    description:
      "Translate text between languages using Google Translate.",
    usage: "translate <language> <text>",
    category: "Utility",
  },
  calc: {
    description:
      "Perform mathematical calculations. Supports basic and advanced math.",
    usage: "calc <expression>",
    category: "Utility",
  },
  qr: {
    description:
      "Generate a QR code from text or URL.",
    usage: "qr <text or URL>",
    category: "Utility",
  },
  shorten: {
    description:
      "Shorten long URLs using a URL shortener service.",
    usage: "shorten <URL>",
    category: "Utility",
  },
  ping: {
    description:
      "Check the bot's response time and server latency.",
    usage: "ping",
    category: "Utility",
  },
  menu: {
    description:
      "Display the bot's command menu with all available commands.",
    usage: "menu",
    category: "General",
  },
  help: {
    description:
      "Get help on how to use the bot or a specific command.",
    usage: "help [command]",
    category: "General",
  },
  owner: {
    description:
      "Display information about the bot owner.",
    usage: "owner",
    category: "General",
  },
  info: {
    description:
      "Show bot information including version, uptime, and stats.",
    usage: "info",
    category: "General",
  },
  runtime: {
    description:
      "Check how long the bot has been running.",
    usage: "runtime",
    category: "General",
  },
  tagall: {
    description:
      "Tag all members in a group. Admin only.",
    usage: "tagall [message]",
    category: "Group",
  },
  kick: {
    description:
      "Remove a member from the group. Admin only.",
    usage: "kick @user",
    category: "Group",
  },
  add: {
    description:
      "Add a new member to the group using their phone number.",
    usage: "add <phone number>",
    category: "Group",
  },
  promote: {
    description:
      "Promote a member to group admin.",
    usage: "promote @user",
    category: "Group",
  },
  demote: {
    description:
      "Demote an admin to regular member.",
    usage: "demote @user",
    category: "Group",
  },
  mute: {
    description:
      "Mute the group - only admins can send messages.",
    usage: "mute",
    category: "Group",
  },
  unmute: {
    description:
      "Unmute the group - everyone can send messages.",
    usage: "unmute",
    category: "Group",
  },
  antilink: {
    description:
      "Toggle anti-link protection. Automatically removes messages with links.",
    usage: "antilink on/off",
    category: "Group",
  },
  welcome: {
    description:
      "Set or toggle welcome messages for new group members.",
    usage: "welcome on/off [message]",
    category: "Group",
  },
  goodbye: {
    description:
      "Set or toggle goodbye messages when members leave.",
    usage: "goodbye on/off [message]",
    category: "Group",
  },
  tts: {
    description:
      "Convert text to speech. Bot will send an audio message.",
    usage: "tts <text>",
    category: "Fun",
  },
  joke: {
    description:
      "Get a random joke to brighten your day.",
    usage: "joke",
    category: "Fun",
  },
  quote: {
    description:
      "Get an inspirational or random quote.",
    usage: "quote",
    category: "Fun",
  },
  meme: {
    description:
      "Get a random meme from the internet.",
    usage: "meme",
    category: "Fun",
  },
  fact: {
    description:
      "Learn a random interesting fact.",
    usage: "fact",
    category: "Fun",
  },
  dare: {
    description:
      "Get a random dare challenge.",
    usage: "dare",
    category: "Fun",
  },
  truth: {
    description:
      "Get a random truth question.",
    usage: "truth",
    category: "Fun",
  },
  ship: {
    description:
      "Calculate the love compatibility between two people.",
    usage: "ship @user1 @user2",
    category: "Fun",
  },
  profile: {
    description:
      "View your or another user's profile and stats.",
    usage: "profile [@user]",
    category: "User",
  },
  register: {
    description:
      "Register yourself with the bot to access premium features.",
    usage: "register <name>.<age>",
    category: "User",
  },
  balance: {
    description:
      "Check your current credit balance.",
    usage: "balance",
    category: "User",
  },
  daily: {
    description:
      "Claim your daily credits reward.",
    usage: "daily",
    category: "User",
  },
  transfer: {
    description:
      "Transfer credits to another user.",
    usage: "transfer @user <amount>",
    category: "User",
  },
  leaderboard: {
    description:
      "View the top users ranked by credits or activity.",
    usage: "leaderboard",
    category: "User",
  },
  github: {
    description:
      "Search for GitHub repositories or users.",
    usage: "github <query>",
    category: "Search",
  },
  google: {
    description:
      "Search Google and get top results.",
    usage: "google <query>",
    category: "Search",
  },
  wiki: {
    description:
      "Search Wikipedia for articles and information.",
    usage: "wiki <query>",
    category: "Search",
  },
  image: {
    description:
      "Search for images on the web.",
    usage: "image <query>",
    category: "Search",
  },
  anime: {
    description:
      "Get information about an anime series.",
    usage: "anime <title>",
    category: "Search",
  },
  movie: {
    description:
      "Get information about a movie including ratings and plot.",
    usage: "movie <title>",
    category: "Search",
  },
  instagram: {
    description:
      "Download Instagram posts, reels, or stories.",
    usage: "instagram <URL>",
    category: "Download",
  },
  tiktok: {
    description:
      "Download TikTok videos without watermark.",
    usage: "tiktok <URL>",
    category: "Download",
  },
  facebook: {
    description:
      "Download Facebook videos.",
    usage: "facebook <URL>",
    category: "Download",
  },
  twitter: {
    description:
      "Download Twitter/X videos and media.",
    usage: "twitter <URL>",
    category: "Download",
  },
  pinterest: {
    description:
      "Download images and videos from Pinterest.",
    usage: "pinterest <URL>",
    category: "Download",
  },
  spotify: {
    description:
      "Download songs from Spotify.",
    usage: "spotify <song name or URL>",
    category: "Download",
  },
  broadcast: {
    description:
      "Send a broadcast message to all groups. Owner only.",
    usage: "broadcast <message>",
    category: "Owner",
  },
  ban: {
    description:
      "Ban a user from using the bot globally.",
    usage: "ban @user",
    category: "Owner",
  },
  unban: {
    description:
      "Unban a previously banned user.",
    usage: "unban @user",
    category: "Owner",
  },
  setprefix: {
    description:
      "Change the bot's command prefix.",
    usage: "setprefix <new prefix>",
    category: "Owner",
  },
  restart: {
    description:
      "Restart the bot. Owner only.",
    usage: "restart",
    category: "Owner",
  },
  eval: {
    description:
      "Execute JavaScript code. Owner only.. use with caution.",
    usage: "eval <code>",
    category: "Owner",
  },
};

module.exports = commandData;
