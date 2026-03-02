"use client";

import { Button } from "@/components/ui/button";
import {
  formatShabbosDate,
  getThisShabbos,
  getJewishHolidayForWeek,
} from "@/lib/utils-date";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigationProps {
  currentWeek: string;
  onWeekChange: (dateStr: string) => void;
}

export default function WeekNavigation({
  currentWeek,
  onWeekChange,
}: WeekNavigationProps) {
  const today = getThisShabbos();
  const canGoPrevious = currentWeek > today;
  const twoWeeksFromNow = new Date(today + "T12:00:00");
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const canGoNext =
    currentWeek < twoWeeksFromNow.toISOString().split("T")[0];

  const goToPrevious = () => {
    const current = new Date(currentWeek + "T12:00:00");
    current.setDate(current.getDate() - 7);
    const newDate = current.toISOString().split("T")[0];
    if (newDate >= today) onWeekChange(newDate);
  };

  const goToNext = () => {
    const current = new Date(currentWeek + "T12:00:00");
    current.setDate(current.getDate() + 7);
    const newDate = current.toISOString().split("T")[0];
    if (newDate <= twoWeeksFromNow.toISOString().split("T")[0]) {
      onWeekChange(newDate);
    }
  };

  const holiday = getJewishHolidayForWeek(currentWeek);

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
        <div className="text-lg font-bold text-slate-800">
          Weekend of {formatShabbosDate(currentWeek)}
        </div>
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
