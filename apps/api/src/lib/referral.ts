const platforms: Record<string, string> = {
  // Founder Portfolios & Personal Sites
  "gautam-kr.vercel.app": "🌟 Gautam's Portfolio (gautam-kr.vercel.app)",
  "gautam-portfolio.vercel.app": "🌟 Gautam's Portfolio",
  "gautamkumar.dev": "🌟 Gautam's Portfolio (gautamkumar.dev)",
  "theunstopabble.github.io": "🌟 Gautam's GitHub Pages",

  // Social & Professional Networks
  "linkedin.com": "💼 LinkedIn",
  "lnkd.in": "💼 LinkedIn",
  "twitter.com": "𝕏 (Twitter)",
  "x.com": "𝕏 (Twitter)",
  "t.co": "𝕏 (Twitter)",
  "github.com": "🐙 GitHub",
  "bsky.app": "🦋 Bluesky",
  "bsky.social": "🦋 Bluesky",
  "threads.net": "🧵 Threads",
  "facebook.com": "📘 Facebook",
  "fb.com": "📘 Facebook",
  "m.me": "📘 Facebook Messenger",
  "instagram.com": "📸 Instagram",
  "reddit.com": "🤖 Reddit",
  "youtube.com": "▶️ YouTube",
  "youtu.be": "▶️ YouTube",
  "pinterest.com": "📌 Pinterest",
  "tiktok.com": "🎵 TikTok",
  "twitch.tv": "🟣 Twitch",
  "quora.com": "❓ Quora",
  "t.me": "✈️ Telegram",
  "telegram.org": "✈️ Telegram",
  "wa.me": "💬 WhatsApp",
  "whatsapp.com": "💬 WhatsApp",
  "api.whatsapp.com": "💬 WhatsApp",
  "discord.com": "💬 Discord",
  "discord.gg": "💬 Discord",
  "slack.com": "💬 Slack",
  "mastodon.social": "🐘 Mastodon",

  // Developer, Creator & Tech Communities
  "peerlist.io": "🅿️ Peerlist",
  "polywork.com": "💼 Polywork",
  "medium.com": "📝 Medium",
  "substack.com": "💌 Substack",
  "dev.to": "👩‍💻 Dev.to",
  "hashnode.com": "📘 Hashnode",
  "hashnode.dev": "📘 Hashnode",
  "stackoverflow.com": "🥞 Stack Overflow",
  "ycombinator.com": "🔶 Hacker News",
  "news.ycombinator.com": "🔶 Hacker News",
  "producthunt.com": "😸 Product Hunt",

  // Recruiting, Hiring & Job Portals
  "wellfound.com": "🚀 Wellfound (AngelList)",
  "angel.co": "🚀 Wellfound (AngelList)",
  "naukri.com": "💼 Naukri.com",
  "indeed.com": "💼 Indeed",
  "internshala.com": "🎓 Internshala",
  "instahyre.com": "⚡ Instahyre",
  "glassdoor.com": "🏢 Glassdoor",
  "glassdoor.co.in": "🏢 Glassdoor",
  "ziprecruiter.com": "💼 ZipRecruiter",
  "foundit.in": "💼 Foundit",
  "monster.com": "💼 Monster",
  "cutshort.io": "⚡ Cutshort",
  "topmate.io": "🤝 Topmate",

  // Search Engines
  "bing.com": "🔎 Microsoft Bing",
  "duckduckgo.com": "🦆 DuckDuckGo",
  "yahoo.com": "🟣 Yahoo Search",
  "search.yahoo.com": "🟣 Yahoo Search",
  "baidu.com": "🇨🇳 Baidu",
  "yandex.com": "🟡 Yandex",
  "yandex.ru": "🟡 Yandex",
  "ya.ru": "🟡 Yandex",
  "ecosia.org": "🌱 Ecosia",
  "brave.com": "🦁 Brave Search",
  "search.brave.com": "🦁 Brave Search",
  "kagi.com": "🛡️ Kagi Search",
  "startpage.com": "🔒 Startpage",
  "naver.com": "🟢 Naver",
  "sogou.com": "🇨🇳 Sogou",
  "ask.com": "❓ Ask.com",

  // AI Chatbots & LLM Search
  "chatgpt.com": "🤖 ChatGPT (OpenAI)",
  "chat.openai.com": "🤖 ChatGPT (OpenAI)",
  "openai.com": "🤖 ChatGPT (OpenAI)",
  "perplexity.ai": "🔍 Perplexity AI",
  "claude.ai": "🧠 Claude (Anthropic)",
  "anthropic.com": "🧠 Claude (Anthropic)",
  "gemini.google.com": "✨ Google Gemini",
  "bard.google.com": "✨ Google Gemini",
  "aistudio.google.com": "✨ Google AI Studio",
  "copilot.microsoft.com": "🪟 Microsoft Copilot",
  "copilot.cloud.microsoft": "🪟 Microsoft Copilot",
  "deepseek.com": "🐳 DeepSeek AI",
  "chat.deepseek.com": "🐳 DeepSeek AI",
  "grok.com": "⚡ Grok (xAI)",
  "x.ai": "⚡ Grok (xAI)",
  "meta.ai": "🦙 Meta AI (Llama)",
  "poe.com": "🔮 Poe",
  "mistral.ai": "🌪️ Le Chat (Mistral)",
  "chat.mistral.ai": "🌪️ Le Chat (Mistral)",
  "character.ai": "🎭 Character.AI",
  "huggingface.co": "🤗 Hugging Face",
  "you.com": "🔍 You.com",
  "phind.com": "🔎 Phind (AI Developer Search)",
  "v0.dev": "▲ v0.dev (Vercel)",
  "bolt.new": "⚡ Bolt.new",
  "cursor.com": "🖱️ Cursor IDE",
  "cursor.sh": "🖱️ Cursor IDE",
  "qwen.ai": "🌐 Qwen (Alibaba)",
  "chat.qwen.ai": "🌐 Qwen (Alibaba)",
  "kimi.com": "🌙 Kimi AI",
  "kimi.ai": "🌙 Kimi AI",
};

const apps: Record<string, string> = {
  // Recruiting & Social Apps
  "com.linkedin.android": "💼 LinkedIn (Mobile App)",
  "com.facebook.katana": "📘 Facebook (Mobile App)",
  "com.instagram.android": "📸 Instagram (Mobile App)",
  "com.whatsapp": "💬 WhatsApp (Mobile App)",
  "com.twitter.android": "𝕏 (Mobile App)",
  "com.x.android": "𝕏 (Mobile App)",
  "com.discord": "💬 Discord (Mobile App)",
  "org.telegram.messenger": "✈️ Telegram (Mobile App)",
  "com.reddit.frontpage": "🤖 Reddit (Mobile App)",
  "com.github.android": "🐙 GitHub (Mobile App)",
  "com.Slack": "💬 Slack (Mobile App)",

  // Mail & Communication
  "com.google.android.gm": "📧 Gmail (Mobile App)",
  "com.microsoft.office.outlook": "📧 Outlook (Mobile App)",

  // AI Chat Mobile Apps
  "com.openai.chatgpt": "🤖 ChatGPT (Mobile App)",
  "com.anthropic.claude": "🧠 Claude (Mobile App)",
  "ai.perplexity.android": "🔍 Perplexity (Mobile App)",
  "com.deepseek.chat": "🐳 DeepSeek (Mobile App)",
  "com.google.android.apps.bard": "✨ Gemini (Mobile App)",
  "com.microsoft.copilot": "🪟 Copilot (Mobile App)",
};

export interface ReferralOptions {
  selfHost?: string;
  selfLabel?: string;
}

export function resolveReferral(source: string, opts: ReferralOptions = {}): string {
  if (!source) return "Direct / Bookmark";

  if (source.startsWith("android-app://")) {
    const pkg = source.slice("android-app://".length).split("/")[0].toLowerCase();
    return apps[pkg] ?? `App (${pkg})`;
  }

  const host = source.match(/https?:\/\/([^/?#]+)/i)?.[1]?.toLowerCase() ?? "";
  if (!host) return "Direct";

  const isSelf =
    host.includes("texfolio.com") ||
    host.includes("localhost") ||
    (opts.selfHost ? host === opts.selfHost.toLowerCase() : false);
  if (isSelf) return opts.selfLabel ?? "Internal Navigation";

  const clean = host.replace(/^(www|m|mobile)\./, "");

  // Founder portfolio direct check
  if (clean === "gautam-kr.vercel.app" || clean.endsWith(".gautam-kr.vercel.app")) {
    return "🌟 Gautam's Portfolio (gautam-kr.vercel.app)";
  }

  // Google Search domains (e.g. google.com, google.co.in, google.co.uk)
  if (clean.startsWith("google.")) return "🔍 Google Search";

  for (const [key, brand] of Object.entries(platforms)) {
    if (clean === key || clean.endsWith(`.${key}`)) return brand;
  }

  return clean;
}
