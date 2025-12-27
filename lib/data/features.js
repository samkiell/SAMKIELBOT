import {
  FaEye,
  FaDownload,
  FaMusic,
  FaFileVideo,
  FaRobot,
  FaCloud,
  FaCode,
  FaUsers,
  FaShieldAlt,
  FaGamepad,
  FaLanguage,
  FaNewspaper,
  FaMagic,
} from "react-icons/fa";

export const FEATURE_CATEGORIES = {
  TOP: "Top Capabilities",
  AI_MEDIA: "AI & Media Tools",
  PRODUCTIVITY_FUN: "Productivity, Fun & Group Tools",
};

export const featuresData = [
  // TOP CAPABILITIES
  {
    id: "view-once",
    title: "View Once Recovery",
    description:
      "Save 'View Once' photos and videos automatically. Never lose disappearing media again.",
    icon: <FaEye className="text-indigo-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: true,
    details:
      "Automatically saves any disappearing media sent to you or groups where the bot is active.",
  },
  {
    id: "video-downloader",
    title: "Universal Video Downloader",
    description:
      "Download videos from TikTok, Instagram, Facebook, YouTube, and more directly on WhatsApp.",
    icon: <FaDownload className="text-blue-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: true,
    workflow: [
      "Copy the video link from any social platform",
      "Send the command + link to the bot",
      "Receive the video file directly in your chat",
    ],
  },
  {
    id: "music-downloader",
    title: "Music & Audio Downloads",
    description:
      "Get any song by title, artist, or direct link. High-quality audio delivered instantly.",
    icon: <FaMusic className="text-purple-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: true,
  },
  {
    id: "high-quality",
    title: "High-Quality & Large Files",
    description:
      "Download even multi-GB videos with quality preserved. Delivered directly to you.",
    icon: <FaFileVideo className="text-green-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: false,
  },
  {
    id: "ai-tools",
    title: "Advanced AI Tools",
    description:
      "Generate AI videos, enhance blurry images, and create art using simple WhatsApp commands.",
    icon: <FaRobot className="text-orange-500" />,
    category: FEATURE_CATEGORIES.AI_MEDIA,
    isTop: true,
    subFeatures: [
      "AI Video Generation (via sora)",
      "Image Enhancement (via remini)",
      "Background Removal",
      "Text-to-Image Generation",
    ],
  },
  {
    id: "cloud-uptime",
    title: "Cloud-Powered Uptime",
    description:
      "Your bot stays online 24/7 on our high-speed servers, even when your phone is offline.",
    icon: <FaCloud className="text-sky-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: true,
  },
  {
    id: "zero-coding",
    title: "Zero Coding Required",
    description:
      "No technical skills needed. If you can scan a QR code, you can have a powerful bot running.",
    icon: <FaCode className="text-pink-500" />,
    category: FEATURE_CATEGORIES.TOP,
    isTop: true,
  },

  // AI & MEDIA TOOLS
  {
    id: "image-remini",
    title: "Image Enhancement",
    description:
      "Turn blurry, low-quality photos into high-definition masterpieces with the remini command.",
    icon: <FaMagic className="text-yellow-500" />,
    category: FEATURE_CATEGORIES.AI_MEDIA,
  },
  {
    id: "remove-bg",
    title: "Remove Background",
    description:
      "Instantly remove backgrounds from images to create professional-looking transparent PNGs.",
    icon: <FaMagic className="text-indigo-400" />,
    category: FEATURE_CATEGORIES.AI_MEDIA,
  },

  // PRODUCTIVITY & GROUP TOOLS
  {
    id: "group-mod",
    title: "Group Moderation",
    description:
      "Keep your groups safe with automated anti-link, anti-delete, and mute/unmute tools.",
    icon: <FaShieldAlt className="text-red-500" />,
    category: FEATURE_CATEGORIES.PRODUCTIVITY_FUN,
  },
  {
    id: "automation",
    title: "Welcome & Goodbye",
    description:
      "Automate greetings for new members and farewell messages for those who leave.",
    icon: <FaUsers className="text-teal-500" />,
    category: FEATURE_CATEGORIES.PRODUCTIVITY_FUN,
  },
  {
    id: "fun-games",
    title: "Games & Trivia",
    description:
      "Keep the chat alive with interactive games, trivia, and 100+ fun commands.",
    icon: <FaGamepad className="text-orange-400" />,
    category: FEATURE_CATEGORIES.PRODUCTIVITY_FUN,
  },
  {
    id: "lyrics-translation",
    title: "Lyrics & Translation",
    description:
      "Search for song lyrics or translate messages between dozens of languages instantly.",
    icon: <FaLanguage className="text-blue-400" />,
    category: FEATURE_CATEGORIES.PRODUCTIVITY_FUN,
  },
  {
    id: "news-weather",
    title: "Info & Utilities",
    description:
      "Get real-time news, weather updates, and interesting facts without leaving WhatsApp.",
    icon: <FaNewspaper className="text-gray-500" />,
    category: FEATURE_CATEGORIES.PRODUCTIVITY_FUN,
  },
];
