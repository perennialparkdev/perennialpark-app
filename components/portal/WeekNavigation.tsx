"use client";

import { Button } from "@/components/ui/button";
import {
  formatShabbosDate,
  formatWeekRangeMonSun,
  getThisShabbos,
  getThisWeekMonday,
  getJewishHolidayForWeek,
} from "@/lib/utils-date";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type WeekNavigationVariant = "shabbos" | "week-range";

interface WeekNavigationProps {
  /** For "shabbos": Saturday YYYY-MM-DD. For "week-range": Monday YYYY-MM-DD. */
  currentWeek: string;
  onWeekChange: (dateStr: string) => void;
  /** "shabbos" = "Weekend of Mar 8". "week-range" = "Mon 2 - Sun 8". Default: "shabbos". */
  variant?: WeekNavigationVariant;
}

export default function WeekNavigation({
  currentWeek,
  onWeekChange,
  variant = "shabbos",
}: WeekNavigationProps) {
  const isWeekRange = variant === "week-range";
  const thisWeekMonday = getThisWeekMonday();
  const todayShabbos = getThisShabbos();

  const minDate = isWeekRange ? undefined : todayShabbos;
  const twoWeeksLater = new Date((isWeekRange ? thisWeekMonday : todayShabbos) + "T12:00:00");
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  const maxDate = twoWeeksLater.toISOString().split("T")[0];

  const canGoPrevious = isWeekRange ? true : currentWeek > (minDate ?? "");
  const canGoNext = currentWeek < maxDate;

  const goToPrevious = () => {
    const current = new Date(currentWeek + "T12:00:00");
    current.setDate(current.getDate() - 7);
    const newDate = current.toISOString().split("T")[0];
    if (isWeekRange) {
      onWeekChange(newDate);
    } else if (newDate >= (minDate ?? "")) {
      onWeekChange(newDate);
    }
  };

  const goToNext = () => {
    const current = new Date(currentWeek + "T12:00:00");
    current.setDate(current.getDate() + 7);
    const newDate = current.toISOString().split("T")[0];
    if (newDate <= maxDate) onWeekChange(newDate);
  };

  const label = isWeekRange
    ? formatWeekRangeMonSun(currentWeek)
    : `Weekend of ${formatShabbosDate(currentWeek)}`;

  const holiday = isWeekRange ? null : getJewishHolidayForWeek(currentWeek);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-slate-200 px-4 py-3 shadow-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className="h-8 px-2 text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-lg font-bold text-slate-800">{label}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={!canGoNext}
          className="h-8 px-2 text-slate-800 hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      {holiday && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center">
          <div className="text-sm font-semibold text-amber-900">{holiday}</div>
        </div>
      )}
    </div>
  );
}
