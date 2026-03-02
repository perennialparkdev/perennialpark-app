import { NextResponse } from "next/server";
import { fetchChofetzChaimLesson } from "@/lib/chofetz-chaim";

export const revalidate = 3600;

export async function GET() {
  const lesson = await fetchChofetzChaimLesson();
  if (!lesson) {
    return NextResponse.json(
      { error: "Unable to load lesson" },
      { status: 502 }
    );
  }
  return NextResponse.json(lesson);
}
