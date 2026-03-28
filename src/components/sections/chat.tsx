"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionWrapper } from "@/components/section-wrapper";
import { Send, Bot, User, Activity, Moon, Heart, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHAConfig, isHAAvailable } from "@/lib/ha-config";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const suggestedQuestions = [
  "How was my last run?",
  "What's my ferritin trend over the years?",
  "Compare my sleep this week vs last month",
  "What should I focus on improving?",
  "How's my HRV trending?",
  "Summarise my latest blood results",
];

const SOURCE_BADGES: Record<string, { label: string; icon: typeof Activity; className: string }> = {
  oura: { label: "Oura", icon: Moon, className: "bg-purple-500/15 text-purple-400" },
  garmin: { label: "Garmin", icon: Dumbbell, className: "bg-emerald-500/15 text-emerald-400" },
  labs: { label: "Labs", icon: Heart, className: "bg-red-500/15 text-red-400" },
  live: { label: "Live", icon: Activity, className: "bg-cyan-500/15 text-cyan-400" },
};

// Chat server URL: proxied via nginx in HA, direct in dev
function getChatUrl(): string {
  if (typeof window === "undefined") return "";
  // In HA add-on, nginx proxies /api/chat to the chat server
  if (isHAAvailable()) return "/api/chat";
  // Dev: chat server runs on 3001
  return process.env.NEXT_PUBLIC_CHAT_URL ?? "http://localhost:3001/api/chat";
}

// Fetch live HA sensor values for Oura
async function fetchLiveContext(): Promise<Record<string, unknown>> {
  if (!isHAAvailable()) return {};

  const { url, token } = getHAConfig({ useProxy: true });
  if (!token) return {};

  const sensors = [
    "sensor.oura_ring_sleep_score",
    "sensor.oura_ring_readiness_score",
    "sensor.oura_ring_hrv_balance_score",
    "sensor.oura_ring_total_sleep_duration",
    "sensor.oura_ring_deep_sleep_duration",
    "sensor.oura_ring_rem_sleep_duration",
    "sensor.oura_ring_cardiovascular_age",
    "sensor.oura_ring_resilience_level",
    "sensor.oura_ring_steps",
    "sensor.oura_ring_temperature_deviation",
  ];

  const context: Record<string, unknown> = {};

  try {
    const base = url || "";
    const res = await fetch(`${base}/api/states`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return {};
    const states = (await res.json()) as Array<{
      entity_id: string;
      state: string;
      attributes: Record<string, unknown>;
    }>;

    for (const sensor of sensors) {
      const entity = states.find((s) => s.entity_id === sensor);
      if (entity && entity.state !== "unavailable" && entity.state !== "unknown") {
        const name = sensor
          .replace("sensor.oura_ring_", "")
          .replace(/_/g, " ");
        context[name] = entity.state;
      }
    }
  } catch {
    // HA not reachable - that's fine, continue without live data
  }

  return context;
}

export function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gather live HA sensor data
      const liveContext = await fetchLiveContext();

      const chatUrl = getChatUrl();
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          liveContext,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process that request. Make sure the chat server is running (`npx tsx chat-server/index.ts`).",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionWrapper id="chat" title="AI Health Chat">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Alfred
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Ask questions about your health data. Powered by Claude with
            OpenClaw context.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ask me anything about your health data
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-left text-xs p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user"
                      ? "bg-primary/20"
                      : "bg-purple-500/20"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 max-w-[85%]",
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground text-sm"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h2]:text-sm [&>h2]:mt-2 [&>h2]:mb-1 [&>h3]:text-xs [&>h3]:mt-2 [&>h3]:mb-1 [&>table]:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-sm">{msg.content}</span>
                  )}
                  {/* Source badges */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/50">
                      {msg.sources.map((src) => {
                        const badge = SOURCE_BADGES[src];
                        if (!badge) return null;
                        const Icon = badge.icon;
                        return (
                          <span
                            key={src}
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                              badge.className
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-500" />
                </div>
                <div className="bg-secondary rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health data..."
                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
