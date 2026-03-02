"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const zmanimList = [
  { label: "עלות השחר", labelEn: "Alos", key: "alos" },
  { label: "הנץ החמה", labelEn: "Sunrise", key: "sunrise" },
  { label: 'סוז"ש גר"א', labelEn: "Shma GRA", key: "sof_zman_shma_gra" },
  { label: 'סוז"ש מג"א', labelEn: "Shma MGA", key: "sof_zman_shma_mga" },
  { label: "חצות", labelEn: "Chatzos", key: "chatzos" },
  { label: "מנחה גדולה", labelEn: "Mincha Gedola", key: "mincha_gedola" },
  { label: "פלג המנחה", labelEn: "Plag", key: "plag_hamincha" },
  { label: "שקיעה", labelEn: "Shkiah", key: "shkiah" },
  { label: "צאת הכוכבים", labelEn: "Tzeis", key: "tzeis" },
  { label: 'ר"ת', labelEn: "R' Tam", key: "rabbeinu_tam" },
];

type ZmanimPayload = Record<(typeof zmanimList)[number]["key"], string | null>;

const formatTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export default function ZmanimCard({ className }: { className?: string }) {
  const [zmanim, setZmanim] = useState<ZmanimPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadZmanim = async () => {
      try {
        const response = await fetch("/api/zmanim?zip=12759", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load zmanim");
        }
        const payload: ZmanimPayload = await response.json();
        if (!isMounted) return;
        setZmanim(payload);
        setError(null);
      } catch (err) {
        if (!isMounted || (err instanceof DOMException && err.name === "AbortError"))
          return;
        const message = err instanceof Error ? err.message : "Failed to load zmanim";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadZmanim();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const statusContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2"
            >
              <span className="h-3 w-24 rounded-full bg-slate-200" />
              <span className="h-3 w-12 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    }

    if (error || !zmanim) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-600">
          {error || "Unable to display zmanim"}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {zmanimList.map(({ label, labelEn, key }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/60 px-3 py-2"
          >
            <div>
              <p className="font-hebrew text-sm text-slate-700">{label}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {labelEn}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {formatTime(zmanim[key])}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2 text-center">
        <CardTitle className="font-hebrew text-xl font-bold">
          זמני היום
        </CardTitle>
        <p className="text-xs text-slate-600">Today&apos;s Zmanim</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">{statusContent()}</div>
      </CardContent>
    </Card>
  );
}
