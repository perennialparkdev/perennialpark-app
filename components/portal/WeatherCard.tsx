"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeather } from "@/hooks/useWeather";
import { weatherEmoji } from "@/lib/weather";

const LOCATION_LABEL = "Loch Sheldrake, NY";

function iconForCode(code: number) {
  if (code === 0) return <Sun className="h-8 w-8 text-yellow-500" />;
  if (code <= 3) return <Cloud className="h-8 w-8 text-gray-400" />;
  if (code >= 45 && code <= 48) return <Cloud className="h-8 w-8 text-gray-500" />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className="h-8 w-8 text-blue-500" />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <CloudSnow className="h-8 w-8 text-blue-300" />;
  if (code >= 95) return <CloudLightning className="h-8 w-8 text-purple-500" />;
  return <Cloud className="h-8 w-8 text-gray-400" />;
}

export default function WeatherCard({ className }: { className?: string }) {
  const { data: weather, isLoading, isError, refetch, isFetching } = useWeather();

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Weather
            </CardTitle>
            <p className="text-xs text-slate-600">{LOCATION_LABEL}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8"
            aria-label="Refresh weather"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : isError || !weather ? (
          <div className="py-4 text-center text-slate-500">
            Unable to load weather
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-4 border-b border-slate-200 pb-3">
              {iconForCode(weather.currentCode)}
              <div>
                <div className="text-3xl font-bold text-slate-900">
                  {weather.current}°F
                </div>
                <div className="text-sm text-slate-500">Current</div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weather.forecast.map((day) => (
                <div key={day.day} className="flex flex-col items-center">
                  <div className="font-medium text-slate-600">{day.day}</div>
                  <div className="my-1 text-lg">{weatherEmoji(day.code)}</div>
                  <div className="font-semibold text-slate-900">{day.hi}°</div>
                  <div className="text-slate-400">{day.lo}°</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Slim bar for mobile/top of home. Shares cache with WeatherCard via React Query. */
export function WeatherBar() {
  const { data: weather, isLoading, isError, refetch, isFetching } = useWeather();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/40 bg-white/70 p-3 shadow-lg backdrop-blur-xl">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !weather) {
    return (
      <div className="rounded-xl border border-white/40 bg-white/70 p-3 shadow-lg backdrop-blur-xl">
        <div className="text-center text-sm text-slate-500">
          Unable to load weather
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 p-3 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{weatherEmoji(weather.currentCode)}</div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {weather.current}°F
            </div>
            <div className="text-xs text-slate-600">{LOCATION_LABEL}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {weather.forecast.slice(0, 5).map((day) => (
            <div
              key={day.day}
              className="flex min-w-[45px] flex-col items-center"
            >
              <div className="text-[10px] font-medium text-slate-600">
                {day.day}
              </div>
              <div className="text-lg">{weatherEmoji(day.code)}</div>
              <div className="text-xs font-semibold text-slate-900">{day.hi}°</div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8 shrink-0"
          aria-label="Refresh weather"
        >
          <RefreshCw
            className={cn("h-4 w-4", isFetching && "animate-spin")}
          />
        </Button>
      </div>
    </div>
  );
}
