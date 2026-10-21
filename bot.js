/**
 * Score600Academy - Telegram Bot Server
 * Uses native Node.js fetch (No external npm dependencies required)
 * Handles /start, /study, welcome cards, and configures the native WebApp Menu Button.
 */

const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";
const WEBAPP_URL = process.env.WEBAPP_URL || "https://your-edugram-app.vercel.app";

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method, payload = {}) {
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(`Error calling ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// Set up the persistent Web App Menu Button in the Telegram Chat UI
async function configureMenuButton() {
  const result = await callTelegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "🎓 Open Academy",
      web_app: { url: WEBAPP_URL }
    }
  });

  if (result.ok) {
    console.log("✅ Chat Menu Button configured successfully -> '🎓 Open Academy'");
  } else {
    console.warn("⚠️ Could not set menu button. Check your BOT_TOKEN:", result.description);
  }
}

// Long-polling handler for interactive bot commands
let offset = 0;
async function pollUpdates() {
  try {
    const res = await callTelegram("getUpdates", {
      offset: offset,
      timeout: 30
    });

    if (res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }

  // Continue polling loop
  setTimeout(pollUpdates, 1000);
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "Scholar";
  const text = msg.text.trim();

  if (text.startsWith("/start") || text.startsWith("/study")) {
    const welcomeText = 
      `👋 *Welcome to Score600Academy, ${firstName}!*\n\n` +
      `📚 *Your Elite Grade 9–12 Exam Prep Companion*\n\n` +
      `🎯 *Available Curriculum Study Guides:*\n` +
      `• 🧪 *Chemistry*: Units 1 & 2 Guides (with 40 Solved Questions)\n` +
      `• 📊 *Economics*: Unit 1 EUEE Complete Guide\n` +
      `• 🌍 *Geography*: Unit 1 Spatial & Map Reading Guide\n` +
      `• 🏛️ *History*: Unit 1 Early Civilizations EUEE Guide\n` +
      `• ⚡ *Physics & Math*: Comprehensive Formulas & Mock Papers\n\n` +
      `🔒 *All documents are DRM-protected with anti-download security and personalized student watermarking.*\n\n` +
      `Tap the button below to start studying:`;

    await callTelegram("sendMessage", {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Launch Score600 Academy",
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: "📖 Open Chemistry Unit 1",
              web_app: { url: `${WEBAPP_URL}?subject=chemistry` }
            },
            {
              text: "📊 Open Economics",
              web_app: { url: `${WEBAPP_URL}?subject=economics` }
            }
          ]
        ]
      }
    });
  }
}

// Start Bot
async function start() {
  if (BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    console.log("-------------------------------------------------------------------");
    console.log("⚠️ Telegram Bot Setup Notice:");
    console.log("Please set your BOT_TOKEN and WEBAPP_URL to run this bot.");
    console.log("Example: BOT_TOKEN='123456:ABC...' WEBAPP_URL='https://your.vercel.app' node bot.js");
    console.log("Or follow the 2-minute @BotFather guide in the README!");
    console.log("-------------------------------------------------------------------");
    return;
  }

  const me = await callTelegram("getMe");
  if (!me.ok) {
    console.error("❌ Invalid BOT_TOKEN. Telegram API response:", me.description);
    return;
  }

  console.log(`🤖 Logged in as @${me.result.username} (${me.result.first_name})`);
  console.log(`🌐 Target WebApp URL: ${WEBAPP_URL}`);

  await configureMenuButton();
  console.log("👂 Listening for /start messages from students...");
  pollUpdates();
}

start();
