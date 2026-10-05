import { env } from "../config/env.js";
import { resolveReferral } from "../lib/referral.js";

interface DeviceInfo {
  type: string;
  os: string;
  browser: string;
}

class TelegramService {
  private gate = new Map<string, number>();
  private cachedChatId: string | null = null;

  /**
   * Parse user agent string into Device type, OS, and Browser.
   */
  public parseUserAgent(uaString: string = ""): DeviceInfo {
    const ua = uaString.toLowerCase();

    // 1. Device Type
    let type = "💻 Laptop / Desktop";
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      type = "📱 Tablet";
    } else if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(ua)) {
      type = "📱 Mobile";
    }

    // 2. Operating System
    let os = "Unknown OS";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("cros")) os = "ChromeOS";

    // 3. Browser
    let browser = "Browser";
    if (ua.includes("edg/")) browser = "Edge";
    else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
    else if (ua.includes("brave")) browser = "Brave";
    else if (ua.includes("chrome") && !ua.includes("edg/")) browser = "Chrome";
    else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
    else if (ua.includes("firefox")) browser = "Firefox";

    return { type, os, browser };
  }

  /**
   * Get current timestamp formatted in Indian Standard Time (IST).
   */
  private getIstTime(): string {
    return new Date().toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  /**
   * Automatically resolve the chat ID:
   * First checks env.TELEGRAM_CHAT_ID, then cachedChatId, then polls getUpdates.
   */
  private async resolveChatId(token: string): Promise<string | null> {
    if (env.TELEGRAM_CHAT_ID) {
      return env.TELEGRAM_CHAT_ID;
    }
    if (this.cachedChatId) {
      return this.cachedChatId;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        ok: boolean;
        result?: Array<{ message?: { chat?: { id?: number } } }>;
      };

      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        // Find latest valid chat id
        for (let i = data.result.length - 1; i >= 0; i--) {
          const chatId = data.result[i]?.message?.chat?.id;
          if (chatId) {
            this.cachedChatId = String(chatId);
            return this.cachedChatId;
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }

    return null;
  }

  /**
   * Core send message method (non-blocking, fire-and-forget).
   */
  public async sendAlert(message: string): Promise<boolean> {
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;

    const chatId = await this.resolveChatId(token);
    if (!chatId) return false;

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(6000),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Milestone 1: 👤 New User Registration
   */
  public async notifyNewUser(data: { email?: string; fullName?: string }): Promise<void> {
    const time = this.getIstTime();
    const name = data.fullName || "New User";
    const email = data.email || "No email provided";

    const msg = [
      "🎉 New User Registration!",
      "━━━━━━━━━━━━━━━━━━━━━━",
      `👤 Name: ${name}`,
      `📧 Email: ${email}`,
      `🕐 Time: ${time} IST`,
      "━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    this.sendAlert(msg).catch(() => {});
  }

  /**
   * Milestone 2: 👁️ Public Resume Viewed by Recruiter
   */
  public async notifyPublicResumeView(data: {
    shareId: string;
    resumeTitle: string;
    referer?: string;
    userAgent?: string;
    ip?: string;
  }): Promise<void> {
    const key = `${data.shareId}|${data.ip || "unknown"}`;
    const now = Date.now();
    const last = this.gate.get(key);
    // Debounce within 10 seconds to avoid duplicate pings
    if (last && now - last < 10000) return;
    this.gate.set(key, now);

    const time = this.getIstTime();
    const source = resolveReferral(data.referer || "");
    const device = this.parseUserAgent(data.userAgent || "");
    const clientIp = data.ip?.split(",")[0]?.trim() || "Local";

    const msg = [
      "👁️ Recruiter Alert! Public Resume Viewed",
      "━━━━━━━━━━━━━━━━━━━━━━",
      `📄 Resume: ${data.resumeTitle}`,
      `🔗 Share ID: /r/${data.shareId}`,
      `🌐 Via: ${source}`,
      `📱 Device: ${device.type} (${device.os} · ${device.browser})`,
      `🌍 IP: ${clientIp}`,
      `🕐 Time: ${time} IST`,
      "━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    this.sendAlert(msg).catch(() => {});
  }

  /**
   * Milestone 3: 📄 Resume Downloaded / PDF Generated
   */
  public async notifyPdfGenerated(data: {
    resumeTitle: string;
    email?: string;
    templateId?: string;
  }): Promise<void> {
    const time = this.getIstTime();
    const user = data.email || "Registered User";
    const template = data.templateId || "Classic";

    const msg = [
      "📄 Resume PDF Generated!",
      "━━━━━━━━━━━━━━━━━━━━━━",
      `📄 Title: ${data.resumeTitle}`,
      `🎨 Template: ${template}`,
      `👤 By: ${user}`,
      `🕐 Time: ${time} IST`,
      "━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    this.sendAlert(msg).catch(() => {});
  }

  /**
   * Milestone 4: 💰 Payment / Pro Upgrade
   */
  public async notifyPayment(data: {
    email?: string;
    amount?: string;
    paymentId: string;
  }): Promise<void> {
    const time = this.getIstTime();
    const user = data.email || "User";
    const amount = data.amount || "₹499";

    const msg = [
      "💰 Pro Subscription Purchased!",
      "━━━━━━━━━━━━━━━━━━━━━━",
      `👤 User: ${user}`,
      `💵 Amount: ${amount}`,
      `💳 Payment ID: ${data.paymentId}`,
      "🎉 Status: Pro Access Activated!",
      `🕐 Time: ${time} IST`,
      "━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    this.sendAlert(msg).catch(() => {});
  }
}

export const telegramService = new TelegramService();
