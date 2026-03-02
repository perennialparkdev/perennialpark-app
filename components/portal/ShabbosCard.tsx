"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ShabbosCardProps {
  shabbosDate: string;
  className?: string;
}

type ShabbosPayload = {
  parsha_hebrew?: string;
  candle_lighting: string | null;
  shkiah_plus_60: string | null;
  rabbeinu_tam: string | null;
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const TimeCard = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="rounded-lg border border-slate-200 bg-white/60 p-3 text-center">
    <div className="font-hebrew mb-1 text-xs uppercase tracking-wide text-slate-600">{label}</div>
    <div className="text-2xl font-bold text-slate-900">{formatTime(value)}</div>
  </div>
);

export default function ShabbosCard({ shabbosDate, className }: ShabbosCardProps) {
  const [data, setData] = useState<ShabbosPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shabbosDate) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shabbos-zmanim?date=${encodeURIComponent(shabbosDate)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load Shabbos times");
        }
        const payload = (await response.json()) as ShabbosPayload;
        if (!mounted) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (!mounted || (err instanceof DOMException && err.name === "AbortError")) return;
        const message = err instanceof Error ? err.message : "Unable to load Shabbos times";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [shabbosDate]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <div className="h-4 w-20 rounded-full bg-slate-200" />
            <div className="mt-3 h-10 w-32 rounded-full bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((index) => (
              <div key={`skeleton-${index}`} className="rounded-lg border border-slate-200 bg-white/60 p-3">
                <div className="h-3 w-16 rounded-full bg-slate-200" />
                <div className="mt-2 h-8 w-24 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/60 p-3">
            <div className="h-3 w-24 rounded-full bg-slate-200" />
            <div className="mt-2 h-8 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-600">
          {error || "Unable to load Shabbos data"}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.parsha_hebrew && (
          <div className="border-b border-slate-200 pb-4 text-center">
            <div className="font-hebrew text-sm text-slate-600">פרשה</div>
            <div className="font-hebrew mt-2 text-3xl font-bold text-slate-900">{data.parsha_hebrew}</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TimeCard label="הדלקת נרות" value={data.candle_lighting} />
          <TimeCard label="60 דקות" value={data.shkiah_plus_60} />
        </div>
        {data.rabbeinu_tam && (
          <div className="rounded-lg border border-slate-200 bg-white/60 p-3 text-center">
            <div className="font-hebrew mb-1 text-xs uppercase tracking-wide text-slate-600">
              {"הבדלה (ר\"ת)"}
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatTime(data.rabbeinu_tam)}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("border-white/40 bg-white/70 shadow-lg backdrop-blur-xl", className)}>
      <CardContent className="pt-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
