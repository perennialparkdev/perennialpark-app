"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitCardProps {
  unitNumber?: string | null;
  /** Phase 1: not used; Phase 2 can wire edit. */
  onEdit?: () => void;
  className?: string;
}

/** Displays the current user's unit. Phase 1: placeholder unit number; Phase 2: from API. */
export default function UnitCard({
  unitNumber,
  onEdit,
  className,
}: UnitCardProps) {
  const display = unitNumber ?? "—";

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Unit #{display}
          </CardTitle>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Edit unit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600">
          Your unit. Details from API in Phase 2.
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Address and contact info will appear when connected to the API.
        </p>
      </CardContent>
    </Card>
  );
}
