import { NextResponse } from "next/server";
import { z } from "zod";

const ShabbosSchema = z.object({
  parsha_hebrew: z.string().optional(),
  candle_lighting: z.string().nullable(),
  shkiah_plus_60: z.string().nullable(),
  rabbeinu_tam: z.string().nullable(),
  havdalah: z.string().nullable(),
});

const defaultConfig = {
  geonameId: "5134086",
  candleLightingMinutes: 18,
  havdalahMinutes: 50,
};

const addMinutes = (value: string | null, minutes: number) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setMinutes(parsed.getMinutes() + minutes);
  return parsed.toISOString();
};

const buildSaturday = (providedDate?: string) => {
  if (providedDate) {
    const [year, month, day] = providedDate.split("-").map(Number);
    if ([year, month, day].every((num) => Number.isInteger(num))) {
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  return saturday;
};

const formatDateParam = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;

type HebcalItem = {
  category?: string;
  hebrew?: string;
  date?: string;
};

const pickItem = (items: HebcalItem[], category: string) =>
  items?.find((item) => item?.category === category) ?? null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") ?? undefined;
  const geonameId = searchParams.get("geonameId") ?? defaultConfig.geonameId;
  const candleLightingMinutes = Number(
    searchParams.get("candleLightingMinutes") ?? defaultConfig.candleLightingMinutes,
  );
  const havdalahMinutes = Number(searchParams.get("havdalahMinutes") ?? defaultConfig.havdalahMinutes);

  const saturday = buildSaturday(dateParam);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() - 1);

  const shabbatUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geonameId}&b=${candleLightingMinutes}&m=${havdalahMinutes}&gy=${friday.getUTCFullYear()}&gm=${String(
    friday.getUTCMonth() + 1,
  ).padStart(2, "0")}&gd=${String(friday.getUTCDate()).padStart(2, "0")}&M=on&lg=he-x-NoNikud`;
  const zmanimUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${geonameId}&date=${formatDateParam(
    saturday,
  )}`;

  try {
    const [zmanimRes, shabbatRes] = await Promise.all([
      fetch(zmanimUrl, {
        headers: { "User-Agent": "perennialpark/1.0" },
      }),
      fetch(shabbatUrl, {
        headers: { "User-Agent": "perennialpark/1.0" },
      }),
    ]);

    if (!zmanimRes.ok || !shabbatRes.ok) {
      return NextResponse.json(
        {
          message: "Failed to load Shabbos data from Hebcal",
        },
        { status: 502 },
      );
    }

    const zmanimData = await zmanimRes.json();
    const shabbatData = await shabbatRes.json();

    const times = zmanimData?.times ?? {};
    const items = shabbatData?.items ?? [];

    const candles = pickItem(items, "candles");
    const parashat = pickItem(items, "parashat");
    const havdalah = pickItem(items, "havdalah");

    const result = {
      parsha_hebrew: parashat?.hebrew,
      candle_lighting: candles?.date ?? null,
      shkiah_plus_60: addMinutes(times.sunset ?? null, 60),
      rabbeinu_tam: addMinutes(times.sunset ?? null, 72),
      havdalah: havdalah?.date ?? null,
    };

    const parsed = ShabbosSchema.safeParse(result);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Hebcal returned malformed Shabbos data" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
