"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
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
  Sun,
  MoonIcon,
  Menu,
  X,
  Search,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  label: string;
  children: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    children: [
      { id: "dashboard", label: "Dashboard", icon: Grid3X3 },
      { id: "info", label: "Info", icon: Info },
    ],
  },
  {
    id: "health-data",
    label: "Health Data",
    children: [
      { id: "lab-results", label: "Lab Results", icon: TestTube2 },
      { id: "health-metrics", label: "Health Metrics", icon: HeartPulse },
      { id: "sleep", label: "Sleep", icon: Moon },
      { id: "running", label: "Fitness", icon: Dumbbell },
      { id: "conditions", label: "Conditions", icon: Stethoscope },
      { id: "medications", label: "Medications", icon: Pill },
      { id: "immunizations", label: "Immunizations", icon: Syringe },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    children: [
      { id: "body-composition", label: "Body Composition", icon: Scale },
      { id: "supplements", label: "Supplements", icon: Flower2 },
      { id: "health-timeline", label: "Timeline", icon: Clock },
      { id: "chat", label: "Chat", icon: MessageCircle },
    ],
  },
];

interface SidebarProps {
  activeSection: string;
}

export function Sidebar({ activeSection }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setIsOpen(true);
      else setIsOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
    document.documentElement.classList.toggle("light");
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (isMobile) setIsOpen(false);
    },
    [isMobile]
  );

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "fixed top-4 left-4 z-50 lg:hidden",
            "w-10 h-10 flex items-center justify-center",
            "rounded-xl bg-card/90 backdrop-blur-md",
            "border border-border/50 shadow-sm",
            "transition-all duration-300 active:scale-95",
            isOpen && "opacity-0 pointer-events-none"
          )}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" strokeWidth={2} />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar z-40 transform transition-transform duration-500 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => scrollTo("dashboard")}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-border group-hover:ring-primary/50 transition-all">
                  D
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    Darren&apos;s Health
                  </h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); scrollTo("info"); }}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                  >
                    About <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {isMobile && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 pb-2">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                "bg-secondary/50 hover:bg-secondary",
                "text-sm text-muted-foreground",
                "transition-all duration-200 group"
              )}
            >
              <Search className="w-4 h-4 group-hover:text-foreground transition-colors" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background text-[10px] font-medium border border-border">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {navGroups.map((group) => (
              <div key={group.id} className="mb-4">
                <div className="px-3 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {group.children.map((item) => {
                    const isActive = activeSection === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollTo(item.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm cursor-pointer transition-colors w-full text-left",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        <span className="shrink-0">
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl",
                "bg-secondary/50 hover:bg-secondary",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <MoonIcon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isDark ? "Dark" : "Light"} Mode
                </span>
              </div>
              <div
                className={cn(
                  "w-10 h-6 rounded-full p-1 transition-colors duration-300",
                  isDark ? "bg-primary/20" : "bg-amber-500/20"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300",
                    isDark
                      ? "bg-primary translate-x-4"
                      : "bg-amber-500 translate-x-0"
                  )}
                />
              </div>
            </button>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
              Last synced 28/03/2026
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div className="mobile-nav">
          <div className="mobile-nav-inner">
            {[
              { id: "dashboard", icon: Grid3X3, label: "Home" },
              { id: "lab-results", icon: TestTube2, label: "Labs" },
              { id: "sleep", icon: Moon, label: "Sleep" },
              { id: "running", icon: Dumbbell, label: "Fitness" },
              { id: "chat", icon: MessageCircle, label: "Chat" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "mobile-nav-item",
                    activeSection === item.id && "active"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
