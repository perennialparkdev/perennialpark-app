"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RentalCalendarProps {
  /** Phase 2: from API */
  rentals?: unknown[];
  userUnit?: string | null;
  onAddRental?: (data: unknown) => void;
  onDeleteRental?: (id: string) => void;
  isAdmin?: boolean;
}

/** Placeholder: rentals from API in Phase 2; "List my unit" UI present but no submit. */
export default function RentalCalendar({
  rentals = [],
  userUnit,
  onAddRental,
  onDeleteRental,
  isAdmin,
}: RentalCalendarProps) {
  const canList = Boolean(userUnit);

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        rentals.length === 0 && "min-h-[140px]"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Units Available for Rent
        </CardTitle>
        <p className="text-xs text-slate-600">
          Weekend availability posted by residents
        </p>
      </CardHeader>
      <CardContent>
        {canList && (
          <div className="mb-4 space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60"
              onClick={() => onAddRental?.({})}
            >
              <Plus className="mr-1 h-4 w-4" /> List my unit
            </Button>
          </div>
        )}
        {rentals.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No rentals posted yet
          </p>
        ) : (
          <ul className="space-y-2">
            {(rentals as { id?: string }[]).map((r, index) => (
              <li
                key={r.id ?? `rental-${index}`}
                className="rounded-lg border border-slate-200 bg-white/50 p-3"
              >
                <span className="text-sm text-slate-700">Rental entry</span>
                {isAdmin && onDeleteRental && r.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600"
                    onClick={() => onDeleteRental(r.id!)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
