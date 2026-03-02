import { NextResponse } from "next/server";
import { z } from "zod";

const ZmanimSchema = z.object({
  alos: z.string().nullable(),
  sunrise: z.string().nullable(),
  sof_zman_shma_gra: z.string().nullable(),
  sof_zman_shma_mga: z.string().nullable(),
  chatzos: z.string().nullable(),
  mincha_gedola: z.string().nullable(),
  plag_hamincha: z.string().nullable(),
  shkiah: z.string().nullable(),
  tzeis: z.string().nullable(),
  rabbeinu_tam: z.string().nullable(),
});

const defaultZip = "12759";

const addMinutes = (value: string | null, minutes: number) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip") ?? defaultZip;
  const url = `https://www.hebcal.com/zmanim?cfg=json&zip=${zip}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "perennialpark/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to load zmanim from Hebcal" },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const times = payload?.times ?? {};

    const result = {
      alos: times.alos ?? times.dawn ?? null,
      sunrise: times.sunrise ?? times.netz ?? null,
      sof_zman_shma_gra: times.sofZmanShma ?? null,
      sof_zman_shma_mga: times.sofZmanShmaMGA ?? null,
      chatzos: times.chatzot ?? times.chatzos ?? null,
      mincha_gedola: times.minchaGedola ?? null,
      plag_hamincha: times.plagHaMincha ?? null,
      shkiah: times.sunset ?? null,
      tzeis: addMinutes(times.sunset ?? null, 50),
      rabbeinu_tam: addMinutes(times.sunset ?? null, 72),
    };

    const parsed = ZmanimSchema.safeParse(result);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Received malformed zmanim data" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
