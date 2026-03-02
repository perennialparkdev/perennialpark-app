"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ChofetzChaimLesson } from "@/lib/chofetz-chaim";

const todayLabel = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function ChofetzChaimCard({ className }: { className?: string }) {
  const [data, setData] = useState<ChofetzChaimLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchLesson() {
      try {
        const res = await fetch("/api/chofetz-chaim");
        if (!res.ok) throw new Error("Fetch failed");
        const lesson = (await res.json()) as ChofetzChaimLesson;
        if (!cancelled) {
          setData(lesson);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLesson();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <CardTitle className="font-hebrew text-base font-semibold text-slate-900">
              חפץ חיים
            </CardTitle>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-white">
            Today
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-600">{todayLabel}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : error || !data ? (
          <div className="py-4 text-center text-slate-500">
            Unable to load lesson
          </div>
        ) : (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              {data.title}
            </h3>
            <div
              className="max-h-[400px] overflow-y-auto text-sm leading-relaxed text-slate-700 [&_p]:mb-2 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
