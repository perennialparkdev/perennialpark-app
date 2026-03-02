"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, HelpCircle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const statusButtons = [
  {
    value: "yes",
    label: "Coming",
    short: "Yes",
    icon: Check,
    color: "bg-green-500/80 hover:bg-green-500",
  },
  {
    value: "maybe",
    label: "Maybe",
    short: "Maybe",
    icon: HelpCircle,
    color: "bg-amber-500/80 hover:bg-amber-500",
  },
  {
    value: "no",
    label: "Not Coming",
    short: "No",
    icon: X,
    color: "bg-slate-500/80 hover:bg-slate-500",
  },
] as const;

export type RsvpStatus = "yes" | "maybe" | "no";

interface RsvpCardProps {
  heading?: string;
  status: RsvpStatus;
  setStatus: (s: RsvpStatus) => void;
  menCount: number;
  setMenCount: (n: number) => void;
  guestMenCount?: number;
  setGuestMenCount?: (n: number) => void;
  onlyIfMinyan?: boolean;
  setOnlyIfMinyan?: (v: boolean) => void;
  onlyIfSeferTorah?: boolean;
  setOnlyIfSeferTorah?: (v: boolean) => void;
  haveSeferTorah?: boolean;
  setHaveSeferTorah?: (v: boolean) => void;
  baalKoreh?: boolean;
  setBaalKoreh?: (v: boolean) => void;
  onSave: () => void;
  onReset?: (() => void) | null;
  saving?: boolean;
}

export default function RsvpCard({
  heading = "Shabbos RSVP",
  status,
  setStatus,
  menCount,
  setMenCount,
  guestMenCount = 0,
  setGuestMenCount,
  onlyIfMinyan = false,
  setOnlyIfMinyan,
  onlyIfSeferTorah = false,
  setOnlyIfSeferTorah,
  haveSeferTorah = false,
  setHaveSeferTorah,
  baalKoreh = false,
  setBaalKoreh,
  onSave,
  onReset,
  saving = false,
}: RsvpCardProps) {
  return (
    <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">
          {heading}
        </CardTitle>
        <p className="text-xs text-slate-600">
          <span className="font-hebrew">שבת</span> RSVP so we know if there will
          be a <span className="font-hebrew">מנין</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex w-full gap-2">
          {statusButtons.map(({ value, label, short, icon: Icon, color }) => (
            <Button
              key={value}
              variant={status === value ? "default" : "outline"}
              className={cn(
                "min-w-0 flex-1 text-sm transition-all",
                status === value &&
                  "border-white/30 bg-white/90 text-white shadow-lg backdrop-blur-xl active:scale-95 " +
                    color
              )}
              onClick={() => setStatus(value)}
            >
              {status === value && <Icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </Button>
          ))}
        </div>

        {status !== "no" && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700">How many men</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setMenCount(Math.max(0, menCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{menCount}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setMenCount(menCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-700">Guests</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setGuestMenCount?.(Math.max(0, (guestMenCount ?? 0) - 1))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {guestMenCount ?? 0}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setGuestMenCount?.((guestMenCount ?? 0) + 1)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-3">
              <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-2">
                <Checkbox
                  id="minyan"
                  checked={onlyIfMinyan}
                  onCheckedChange={setOnlyIfMinyan}
                />
                <Label
                  htmlFor="minyan"
                  className="cursor-pointer text-sm font-medium text-slate-800"
                >
                  Only if <span className="font-hebrew">מנין</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-2">
                <Checkbox
                  id="seferTorah"
                  checked={onlyIfSeferTorah}
                  onCheckedChange={setOnlyIfSeferTorah}
                />
                <Label
                  htmlFor="seferTorah"
                  className="cursor-pointer text-sm font-medium text-slate-800"
                >
                  Only if <span className="font-hebrew">ספר תורה</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-2">
                <Checkbox
                  id="haveSeferTorah"
                  checked={haveSeferTorah}
                  onCheckedChange={setHaveSeferTorah}
                />
                <Label
                  htmlFor="haveSeferTorah"
                  className="cursor-pointer text-sm font-medium text-slate-800"
                >
                  I have a <span className="font-hebrew">ספר תורה</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg bg-slate-50 p-2">
                <Checkbox
                  id="baalKoreh"
                  checked={baalKoreh}
                  onCheckedChange={setBaalKoreh}
                />
                <Label
                  htmlFor="baalKoreh"
                  className="cursor-pointer text-sm font-medium text-slate-800"
                >
                  I am a <span className="font-hebrew">בעל קורא</span>
                </Label>
              </div>
            </div>
          </>
        )}

        <Button
          className="w-full border-white/40 bg-white/40 font-medium text-slate-800 backdrop-blur-md transition-all hover:bg-white/60 active:scale-95 active:bg-white/80"
          onClick={onSave}
          disabled={saving || (status !== "no" && menCount === 0)}
          title={status !== "no" && menCount === 0 ? "Enter at least 1 man" : ""}
        >
          {saving ? "Saving..." : "Save RSVP"}
        </Button>
        {onReset && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
            Reset RSVP
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
