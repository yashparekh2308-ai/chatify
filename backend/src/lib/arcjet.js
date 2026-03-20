import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

import { ENV } from "./env.js";

const arcjetMode =
  String(ENV.ARCJET_ENV || "").toLowerCase() === "live" ||
  String(ENV.ARCJET_ENV || "").toLowerCase() === "production" ||
  String(ENV.NODE_ENV || "").toLowerCase() === "production"
    ? "LIVE"
    : "DRY_RUN";

const aj = arcjet({
  key: ENV.ARCJET_KEY,
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection
    shield({ mode: arcjetMode }),
    // Create a bot detection rule
    detectBot({
      mode: arcjetMode, // Blocks requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // Uncomment to allow these other common bot categories
        // See the full list at https://arcjet.com/bot-list
        //"CATEGORY:MONITOR", // Uptime monitoring services
        //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
      ],
    }),
    // Create a token bucket rate limit. Other algorithms are supported.
    slidingWindow({
      mode: arcjetMode, // Blocks requests. Use "DRY_RUN" to log only
      max: 100, // Max 100 requests
      interval: 60,
    }),
  ],
});

export default aj;
