"use client";

import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";
import { useCallback } from "react";

interface SectionWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionWrapper({
  id,
  title,
  children,
  className,
  noPadding,
}: SectionWrapperProps) {
  const copyLink = useCallback(() => {
    const url = new URL(window.location.href);
    url.hash = id;
    navigator.clipboard.writeText(url.toString());
  }, [id]);

  return (
    <div id={id} className={cn("group/section", className)}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <button
          onClick={copyLink}
          className="opacity-0 group-hover/section:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
          aria-label="Copy link"
        >
          <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className={cn(!noPadding && "space-y-4")}>{children}</div>
    </div>
  );
}
