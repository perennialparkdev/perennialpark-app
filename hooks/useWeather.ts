"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWeather } from "@/lib/weather";

const WEATHER_QUERY_KEY = ["weather", 41.7726, -74.6604] as const;

export function useWeather() {
  return useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: () => fetchWeather(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
