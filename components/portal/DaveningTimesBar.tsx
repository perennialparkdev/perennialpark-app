"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DaveningTimesBarProps {
  /** Phase 2: from API; Phase 1 unused */
  daveningTimes?: unknown;
  className?: string;
}

/** Placeholder: scrolling minyanim from API in Phase 2. */
export default function DaveningTimesBar({
  daveningTimes,
  className,
}: DaveningTimesBarProps) {
  const hasData = Boolean(daveningTimes);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-white/40 bg-white/60 px-4 py-2 shadow backdrop-blur-md",
        className
      )}
    >
      <Clock className="h-4 w-4 shrink-0 text-slate-600" />
      <div className="min-w-0 flex-1 overflow-hidden text-sm text-slate-700">
        {hasData ? (
          <span>Davening times</span>
        ) : (
          <span className="text-muted-foreground">Davening times —</span>
        )}
      </div>
    </div>
  );
}
