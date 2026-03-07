/**
 * API client for /api/meetings (structure + CRUD by modelKey).
 * Requires Bearer token; backend validates owner admin role.
 * @see perennialpark-api/docs/MEETINGS-STRUCTURE.md
 */

import { getStoredToken } from "./owners";

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return url.replace(/\/$/, "");
};

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// --- Structure (GET /api/meetings/structure) ---

export interface MeetingType {
  _id: string;
  name: string;
  weekDay: string | null;
  modelKey: string;
  fields: string[];
}

export interface MeetingCategory {
  _id: string;
  name: string;
  types: MeetingType[];
}

export interface StructureResponse {
  success: boolean;
  message?: string;
  data: MeetingCategory[];
}

export async function getMeetingsStructure(): Promise<MeetingCategory[]> {
  const res = await fetch(`${getBaseUrl()}/api/meetings/structure`, {
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as StructureResponse;
  if (res.status === 403)
    throw new Error("Access denied. Only administrators can manage meetings.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch structure");
  return json.data ?? [];
}

// --- Generic list response ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type MeetingRecord = Record<string, unknown> & {
  _id: string;
  idType: string;
  status?: number;
};

export interface ListMeetingsParams {
  status?: 1 | 2;
  idType?: string;
  /** Monday of the week (YYYY-MM-DD). Week = Mon–Sun. */
  period?: string;
}

export async function listMeetings<T = MeetingRecord>(
  modelKey: string,
  params?: ListMeetingsParams
): Promise<T[]> {
  const search = new URLSearchParams();
  if (params?.status !== undefined) search.set("status", String(params.status));
  if (params?.idType) search.set("idType", params.idType);
  if (params?.period) search.set("period", params.period);
  const qs = search.toString();
  const url = `${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<T[]>;
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to list meetings");
  return json.data ?? [];
}

export async function getMeetingById<T = MeetingRecord>(
  modelKey: string,
  id: string
): Promise<T | null> {
  const res = await fetch(
    `${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}/${encodeURIComponent(id)}`,
    { headers: getAuthHeaders() }
  );
  const json = (await res.json()) as ApiResponse<T>;
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch meeting");
  return json.data ?? null;
}

export async function createMeeting<T = MeetingRecord>(
  modelKey: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok) throw new Error(json.message ?? "Failed to create");
  if (!json.data) throw new Error("No record returned");
  return json.data;
}

export async function updateMeeting<T = MeetingRecord>(
  modelKey: string,
  id: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(
    `${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  );
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok) throw new Error(json.message ?? "Failed to update");
  return (json.data ?? body) as T;
}

export async function activateMeeting(
  modelKey: string,
  id: string
): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}/${encodeURIComponent(id)}/activate`,
    { method: "PATCH", headers: getAuthHeaders(), body: "{}" }
  );
  if (!res.ok) {
    const json = (await res.json()) as ApiResponse;
    throw new Error(json.message ?? "Failed to activate");
  }
}

export async function anularMeeting(
  modelKey: string,
  id: string
): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/api/meetings/${encodeURIComponent(modelKey)}/${encodeURIComponent(id)}/anular`,
    { method: "PATCH", headers: getAuthHeaders(), body: "{}" }
  );
  if (!res.ok) {
    const json = (await res.json()) as ApiResponse;
    throw new Error(json.message ?? "Failed to anular");
  }
}

/** Delete all meetings/announcements for a week. period = Monday YYYY-MM-DD. */
export interface DeleteByPeriodResult {
  period: string;
  deletedByModel: Record<string, number>;
  totalDeleted: number;
}

export async function deleteMeetingsByPeriod(period: string): Promise<DeleteByPeriodResult> {
  const res = await fetch(
    `${getBaseUrl()}/api/meetings/period/${encodeURIComponent(period)}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  const json = (await res.json()) as ApiResponse<DeleteByPeriodResult>;
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to delete by period");
  if (!json.data) throw new Error("No data returned");
  return json.data;
}

// --- Helpers: find type by category + name + weekDay ---

export function findType(
  categories: MeetingCategory[],
  categoryName: string,
  typeName: string,
  weekDay: string | null
): MeetingType | undefined {
  const cat = categories.find((c) => c.name === categoryName);
  if (!cat) return undefined;
  return cat.types.find(
    (t) =>
      t.name === typeName &&
      (weekDay == null ? t.weekDay == null : t.weekDay === weekDay)
  );
}

/** Find first type in category with given type name (any weekDay). Use when weekDay varies in API. */
export function findTypeByName(
  categories: MeetingCategory[],
  categoryName: string,
  typeName: string
): MeetingType | undefined {
  const cat = categories.find((c) => c.name === categoryName);
  if (!cat) return undefined;
  return cat.types.find((t) => t.name === typeName);
}
