/**
 * Build health context JSON from OpenClaw workspace memory files.
 * Reads all health-related topics and Garmin cache, outputs a single
 * context file used by the chat server as system prompt context.
 *
 * Run: npx tsx scripts/build-health-context.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const OPENCLAW_TOPICS = join(
  process.env.HOME ?? "/Users/darrenbrain",
  ".openclaw/workspace/memory/topics"
);

const GARMIN_CACHE = join(
  process.env.HOME ?? "/Users/darrenbrain",
  ".clawdbot/.garmin-cache.json"
);

const WEBHOOKS_FILE = join(
  process.env.HOME ?? "/Users/darrenbrain",
  ".openclaw/workspace/scripts/webhooks.json"
);

const HEALTH_TOPIC_FILES = [
  "fitness.md",
  "health-blood-tests.md",
  "fitness-oura-analysis.md",
  "fitness-conjugate-master-plan.md",
  "fitness-sessions.md",
  "sleep-analysis.md",
  "health-oura-longitudinal.md",
];

interface HealthContext {
  builtAt: string;
  topics: Record<string, string>;
  garminCache: unknown | null;
  discordWebhooks: {
    fitness: string;
    sleep: string;
    health: string;
  } | null;
}

function readIfExists(path: string): string | null {
  if (!existsSync(path)) {
    console.warn(`  ⚠  Not found: ${path}`);
    return null;
  }
  return readFileSync(path, "utf-8");
}

function main() {
  console.log("Building health context from OpenClaw workspace...\n");

  const topics: Record<string, string> = {};

  for (const file of HEALTH_TOPIC_FILES) {
    const fullPath = join(OPENCLAW_TOPICS, file);
    const content = readIfExists(fullPath);
    if (content) {
      const key = file.replace(".md", "");
      topics[key] = content;
      console.log(`  ✓  ${file} (${(content.length / 1024).toFixed(1)}KB)`);
    }
  }

  // Garmin cache
  let garminCache: unknown | null = null;
  const garminRaw = readIfExists(GARMIN_CACHE);
  if (garminRaw) {
    garminCache = JSON.parse(garminRaw);
    console.log(`  ✓  Garmin cache (${(garminRaw.length / 1024).toFixed(1)}KB)`);
  }

  // Discord webhooks (only health-relevant channels)
  let discordWebhooks: HealthContext["discordWebhooks"] = null;
  const webhooksRaw = readIfExists(WEBHOOKS_FILE);
  if (webhooksRaw) {
    const all = JSON.parse(webhooksRaw);
    discordWebhooks = {
      fitness: all.fitness ?? "",
      sleep: all.sleep ?? "",
      health: all.health ?? "",
    };
    console.log("  ✓  Discord webhooks (#fitness, #sleep, #health)");
  }

  const context: HealthContext = {
    builtAt: new Date().toISOString(),
    topics,
    garminCache,
    discordWebhooks,
  };

  const outPath = join(__dirname, "..", "chat-server", "health-context.json");
  writeFileSync(outPath, JSON.stringify(context, null, 2));

  const sizeKB = (JSON.stringify(context).length / 1024).toFixed(1);
  console.log(`\n✅ Written ${outPath} (${sizeKB}KB)`);
  console.log(`   ${Object.keys(topics).length} topics, garmin=${!!garminCache}, webhooks=${!!discordWebhooks}`);
}

main();
