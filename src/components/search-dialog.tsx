"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Grid3X3,
  Info,
  TestTube2,
  HeartPulse,
  Moon,
  Dumbbell,
  Stethoscope,
  Pill,
  Syringe,
  Scale,
  Flower2,
  Clock,
  MessageCircle,
  Search,
} from "lucide-react";

interface SearchItem {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const searchItems: SearchItem[] = [
  { id: "dashboard", label: "Dashboard", group: "Overview", icon: Grid3X3, keywords: ["home", "overview", "summary"] },
  { id: "info", label: "Patient Info", group: "Overview", icon: Info, keywords: ["patient", "about", "profile", "personal"] },
  { id: "lab-results", label: "Lab Results", group: "Health Data", icon: TestTube2, keywords: ["labs", "blood", "test", "bloodwork", "ferritin", "cholesterol", "medichecks"] },
  { id: "health-metrics", label: "Health Metrics", group: "Health Data", icon: HeartPulse, keywords: ["heart", "hrv", "heart rate", "spo2", "temperature", "vo2", "steps"] },
  { id: "sleep", label: "Sleep", group: "Health Data", icon: Moon, keywords: ["sleep", "oura", "rem", "deep", "efficiency", "bedtime"] },
  { id: "running", label: "Fitness", group: "Health Data", icon: Dumbbell, keywords: ["fitness", "running", "workout", "exercise", "garmin", "walking", "strength", "calories"] },
  { id: "conditions", label: "Conditions", group: "Health Data", icon: Stethoscope, keywords: ["conditions", "diagnosis", "medical"] },
  { id: "medications", label: "Medications", group: "Health Data", icon: Pill, keywords: ["medications", "drugs", "prescriptions"] },
  { id: "immunizations", label: "Immunizations", group: "Health Data", icon: Syringe, keywords: ["vaccines", "immunizations", "shots", "jab"] },
  { id: "body-composition", label: "Body Composition", group: "Analysis", icon: Scale, keywords: ["weight", "body fat", "bmi", "lean mass"] },
  { id: "supplements", label: "Supplements", group: "Analysis", icon: Flower2, keywords: ["supplements", "vitamins", "minerals"] },
  { id: "health-timeline", label: "Timeline", group: "Analysis", icon: Clock, keywords: ["timeline", "history", "events"] },
  { id: "chat", label: "Chat", group: "Analysis", icon: MessageCircle, keywords: ["chat", "alfred", "ask", "ai"] },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? searchItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
        );
      })
    : searchItems;

  const navigate = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      onOpenChange(false);
      setQuery("");
    },
    [onOpenChange]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].id);
      }
    },
    [filtered, selectedIndex, navigate]
  );

  // Group filtered results
  const groups = new Map<string, SearchItem[]>();
  for (const item of filtered) {
    const list = groups.get(item.group) ?? [];
    list.push(item);
    groups.set(item.group, list);
  }

  let flatIndex = 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Dialog.Title className="sr-only">Search sections</Dialog.Title>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sections..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-secondary text-[10px] font-medium text-muted-foreground border border-border">
              ESC
            </kbd>
          </div>
          <div className="max-h-[320px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              Array.from(groups.entries()).map(([group, items]) => (
                <div key={group}>
                  <div className="px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group}
                    </span>
                  </div>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          idx === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
