/**
 * Open-Meteo weather API (free, no API key).
 * https://open-meteo.com/en/docs
 */

const DEFAULT_LAT = 41.7726;
const DEFAULT_LON = -74.6604;
const TIMEZONE = "America/New_York";

export interface WeatherForecastDay {
  day: string;
  hi: number;
  lo: number;
  code: number;
  precip?: number;
}

export interface WeatherData {
  current: number;
  currentCode: number;
  forecast: WeatherForecastDay[];
}

export async function fetchWeather(
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", TIMEZONE);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      weather_code: number[];
      precipitation_probability_max?: number[];
    };
  };

  const forecast: WeatherForecastDay[] = data.daily.time.slice(0, 7).map((date, i) => ({
    day: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    hi: Math.round(data.daily.temperature_2m_max[i]),
    lo: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weather_code[i],
    precip: data.daily.precipitation_probability_max?.[i],
  }));

  return {
    current: Math.round(data.current.temperature_2m),
    currentCode: data.current.weather_code,
    forecast,
  };
}

/** WMO weather code -> icon component name / emoji for display */
export function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code === 85 || code === 86) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}
