/**
 * Health Dashboard Chat Server
 *
 * Lightweight Express server that:
 * - Reads pre-built OpenClaw health context (topics, Garmin, webhooks)
 * - Accepts chat messages from the dashboard frontend
 * - Calls Claude API with full health context as system prompt
 * - Optionally dispatches summaries to Discord #fitness/#sleep/#health
 *
 * Run: npx tsx chat-server/index.ts
 * Or:  ANTHROPIC_API_KEY=sk-... npx tsx chat-server/index.ts
 */

import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Config ────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.CHAT_PORT ?? "3001", 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const CONTEXT_PATH = join(__dirname, "health-context.json");

// ── Load health context ──────────────────────────────────────────────────

interface HealthContext {
  builtAt: string;
  topics: Record<string, string>;
  garminCache: {
    timestamp: string;
    date: string;
    summary: Record<string, number>;
    sleep: Record<string, number>;
    workouts: Array<{
      type: { typeKey: string };
      name: string;
      distance_km: number;
      duration_minutes: number;
      calories: number;
      heart_rate_avg: number;
      heart_rate_max: number;
    }>;
  } | null;
  discordWebhooks: {
    fitness: string;
    sleep: string;
    health: string;
  } | null;
}

let healthContext: HealthContext | null = null;

function loadContext(): HealthContext | null {
  if (!existsSync(CONTEXT_PATH)) {
    console.warn("⚠  health-context.json not found. Run: npx tsx scripts/build-health-context.ts");
    return null;
  }
  const raw = readFileSync(CONTEXT_PATH, "utf-8");
  return JSON.parse(raw) as HealthContext;
}

// ── Build system prompt from context ─────────────────────────────────────

function buildSystemPrompt(ctx: HealthContext | null, liveContext?: Record<string, unknown>): string {
  const parts: string[] = [];

  parts.push(`You are Alfred 🦞, Darren Arthur's personal health AI assistant.
You have deep knowledge of Darren's health data spanning 5+ years from Oura Ring, Garmin Connect, Medichecks bloodwork, and Nuffield Health assessments.

Key facts about Darren:
- Age 48 (DOB 01-Jan-1978), lives in Wickford, Essex
- Blood type O+, height ~178cm, weight ~86kg
- Oura Ring for sleep/recovery/activity, Garmin for running
- Conjugate strength training program (home gym)
- Daily cold plunge (5°C, 5min), occasional sauna
- Sleep protocol: 10pm bed, 5:30am wake, magnesium glycinate 400mg

Answer health questions using the data below. Be specific with numbers and trends.
Reference dates, percentages, and ranges. Flag concerning trends proactively.
Keep responses concise but data-rich. Use markdown formatting.`);

  if (ctx) {
    // Add each topic as a section
    for (const [key, content] of Object.entries(ctx.topics)) {
      const title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      parts.push(`\n## ${title}\n${content}`);
    }

    // Garmin latest workouts
    if (ctx.garminCache) {
      const runs = ctx.garminCache.workouts.filter((w) => w.type.typeKey === "running");
      const strength = ctx.garminCache.workouts.filter((w) => w.type.typeKey === "strength_training");
      parts.push(`\n## Latest Garmin Data (synced ${ctx.garminCache.date})
**Recent Runs:** ${runs.map((r) => `${r.name} ${r.distance_km}km in ${r.duration_minutes}min (${r.calories}cal)`).join("; ")}
**Strength Sessions:** ${strength.length} sessions, longest ${Math.max(...strength.map((s) => s.duration_minutes))}min`);
    }
  }

  // Live HA sensor data (injected per-request from frontend)
  if (liveContext && Object.keys(liveContext).length > 0) {
    parts.push(`\n## Live Sensor Data (real-time from Home Assistant)`);
    for (const [key, value] of Object.entries(liveContext)) {
      parts.push(`- **${key}**: ${JSON.stringify(value)}`);
    }
  }

  return parts.join("\n");
}

// ── Discord dispatch ─────────────────────────────────────────────────────

async function dispatchToDiscord(
  webhookUrl: string,
  content: string,
  username = "Health Dashboard"
): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        avatar_url: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
        content: content.slice(0, 2000), // Discord limit
      }),
    });
  } catch (e) {
    console.error("Discord dispatch failed:", e);
  }
}

function detectChannel(userMessage: string): "fitness" | "sleep" | "health" | null {
  const lower = userMessage.toLowerCase();
  if (/\b(run|running|garmin|workout|training|exercise|strength|gym|conjugate|squat|deadlift|bench)\b/.test(lower)) return "fitness";
  if (/\b(sleep|rem|hrv|readiness|recovery|nap|insomnia|melatonin|magnesium)\b/.test(lower)) return "sleep";
  if (/\b(blood|lab|ferritin|cholesterol|vitamin|thyroid|testosterone|iron|liver|kidney)\b/.test(lower)) return "health";
  return null;
}

// ── Express server ───────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", contextLoaded: !!healthContext, builtAt: healthContext?.builtAt });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, liveContext } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    liveContext?: Record<string, unknown>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY not set",
      content: "Chat server needs an Anthropic API key. Set ANTHROPIC_API_KEY environment variable.",
    });
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const systemPrompt = buildSystemPrompt(healthContext, liveContext);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Optionally dispatch to relevant Discord channel
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg && healthContext?.discordWebhooks) {
      const channel = detectChannel(lastUserMsg.content);
      if (channel) {
        const webhook = healthContext.discordWebhooks[channel];
        if (webhook) {
          const summary = `**Dashboard Q:** ${lastUserMsg.content.slice(0, 200)}\n**Alfred:** ${content.slice(0, 1500)}`;
          dispatchToDiscord(webhook, summary, "Health Dashboard 🏥").catch(() => {});
        }
      }
    }

    // Sources used for context badges
    const sources: string[] = [];
    if (healthContext?.topics["fitness-oura-analysis"]) sources.push("oura");
    if (healthContext?.garminCache) sources.push("garmin");
    if (healthContext?.topics["health-blood-tests"]) sources.push("labs");
    if (liveContext && Object.keys(liveContext).length > 0) sources.push("live");

    res.json({ content, sources });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message, content: `Error: ${message}` });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────

healthContext = loadContext();

app.listen(PORT, () => {
  console.log(`\n🏥 Health Chat Server running on port ${PORT}`);
  console.log(`   Context: ${healthContext ? `loaded (${Object.keys(healthContext.topics).length} topics)` : "NOT loaded"}`);
  console.log(`   Garmin: ${healthContext?.garminCache ? "available" : "not available"}`);
  console.log(`   Discord: ${healthContext?.discordWebhooks ? "#fitness #sleep #health" : "not configured"}`);
  console.log(`   Anthropic: ${ANTHROPIC_API_KEY ? "key set" : "⚠ NO KEY"}`);
  console.log(`\n   POST /api/chat  { messages: [...], liveContext?: {...} }`);
  console.log(`   GET  /health\n`);
});
