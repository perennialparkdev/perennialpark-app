/**
 * Fetches and parses the daily Chofetz Chaim lesson from chofetzchaimdaily.org RSS.
 * Run only on the server (API route or Server Component).
 */

import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";

const RSS_URL = "https://chofetzchaimdaily.org/feed/";

export interface ChofetzChaimLesson {
  title: string;
  content: string;
  link?: string;
  pubDate?: string;
}

/** Allowed HTML tags for lesson content (safe subset). */
const ALLOWED_TAGS = ["p", "br", "strong", "em", "a", "div", "span"];
const ALLOWED_ATTR: Record<string, string[]> = { a: ["href"] };

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https"],
  });
}

function getContentFromItem(it: Record<string, unknown>): string | undefined {
  const raw =
    it["content:encoded"] ??
    (it.content && typeof it.content === "object" && "encoded" in it.content
      ? (it.content as { encoded?: unknown }).encoded
      : null) ??
    it.description;
  return typeof raw === "string" ? raw : undefined;
}

function getFirstItemContent(parsed: unknown): { title?: string; content?: string; link?: string; pubDate?: string } {
  const channel = (parsed as { rss?: { channel?: unknown } })?.rss?.channel;
  if (!channel || typeof channel !== "object") return {};

  const items = (channel as { item?: unknown[] }).item;
  const firstItem: Record<string, unknown> | null = Array.isArray(items) && items.length > 0
    ? (items[0] as Record<string, unknown>)
    : (channel as { item?: unknown }).item && typeof (channel as { item: unknown }).item === "object"
      ? ((channel as { item: unknown }).item as Record<string, unknown>)
      : null;

  if (!firstItem) return {};

  const content = getContentFromItem(firstItem);
  return {
    title: typeof firstItem.title === "string" ? firstItem.title : undefined,
    content: content ?? undefined,
    link: typeof firstItem.link === "string" ? firstItem.link : undefined,
    pubDate: typeof firstItem.pubDate === "string" ? firstItem.pubDate : undefined,
  };
}

export async function fetchChofetzChaimLesson(): Promise<ChofetzChaimLesson | null> {
  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "PerennialPark/1.0 (community app)" },
    });
    if (!res.ok) return null;

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreDeclaration: true,
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    const parsed = parser.parse(xml);
    const item = getFirstItemContent(parsed);

    if (!item.title && !item.content) return null;

    return {
      title: item.title ?? "Chofetz Chaim Daily",
      content: item.content ? sanitize(item.content) : "",
      link: item.link,
      pubDate: item.pubDate,
    };
  } catch {
    return null;
  }
}
