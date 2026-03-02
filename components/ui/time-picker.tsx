"use client";

import * as React from "react";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function parseTime(value: string): { hours: number; minutes: number } {
  if (!value) return { hours: 9, minutes: 0 };
  const parts = value.split(":").map(Number);
  const hours = Math.min(23, Math.max(0, parts[0] ?? 9));
  const minutes = Math.min(59, Math.max(0, parts[1] ?? 0));
  return { hours, minutes };
}

function formatDisplay(hours: number, minutes: number): string {
  const isPM = hours >= 12;
  const displayH = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayH}:${String(minutes).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
}

export function TimePicker({
  value,
  onChange,
  className,
  placeholder = "Select time",
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { hours, minutes } = parseTime(value);
  const isPM = hours >= 12;
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  const setHoursMinutes = React.useCallback(
    (h: number, m: number) => {
      h = Math.max(0, Math.min(23, h));
      m = Math.max(0, Math.min(59, m));
      onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    },
    [onChange]
  );

  const handleHourChange = React.useCallback(
    (newDisplayHour: number) => {
      let h = newDisplayHour;
      if (h === 12 && !isPM) h = 0;
      else if (h === 12 && isPM) h = 12;
      else if (isPM) h = newDisplayHour + 12;
      else h = newDisplayHour;
      setHoursMinutes(h, minutes);
    },
    [isPM, minutes, setHoursMinutes]
  );

  const handleMinuteChange = React.useCallback(
    (newMinute: number) => {
      setHoursMinutes(hours, newMinute);
    },
    [hours, setHoursMinutes]
  );

  const toggleAMPM = React.useCallback(() => {
    const h = isPM
      ? hours === 12
        ? 0
        : hours - 12
      : hours === 0
        ? 12
        : hours + 12;
    setHoursMinutes(h, minutes);
  }, [isPM, hours, minutes, setHoursMinutes]);

  const displayTime = value ? formatDisplay(hours, minutes) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-base font-medium text-left",
            className
          )}
        >
          <Clock className="mr-2 h-5 w-5 shrink-0 text-emerald-600" />
          {displayTime}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-4" align="start">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                handleHourChange(displayHour === 12 ? 1 : displayHour + 1)
              }
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <input
              type="number"
              min={1}
              max={12}
              value={displayHour}
              onChange={(e) => {
                const val = Math.max(
                  1,
                  Math.min(12, parseInt(e.target.value, 10) || 1)
                );
                handleHourChange(val);
              }}
              className="w-14 rounded border py-1 text-center text-3xl font-bold"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                handleHourChange(displayHour === 1 ? 12 : displayHour - 1)
              }
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <span className="mt-1 text-xs text-muted-foreground">Hours</span>
          </div>
          <div className="text-2xl font-bold">:</div>
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                handleMinuteChange(minutes === 59 ? 0 : minutes + 1)
              }
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <input
              type="number"
              min={0}
              max={59}
              value={String(minutes).padStart(2, "0")}
              onChange={(e) => {
                const val = Math.max(
                  0,
                  Math.min(59, parseInt(e.target.value, 10) || 0)
                );
                handleMinuteChange(val);
              }}
              className="w-14 rounded border py-1 text-center text-3xl font-bold"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                handleMinuteChange(minutes === 0 ? 59 : minutes - 1)
              }
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <span className="mt-1 text-xs text-muted-foreground">Minutes</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={!isPM ? "default" : "outline"}
              className="w-12"
              onClick={toggleAMPM}
            >
              AM
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isPM ? "default" : "outline"}
              className="w-12"
              onClick={toggleAMPM}
            >
              PM
            </Button>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
