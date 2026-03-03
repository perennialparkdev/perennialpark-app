import { getStoredToken, getStoredUserInfo } from "./owners";
import type { ApiResponse } from "./units";

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

export type RsvpStatusApi = "Coming" | "Maybe" | "Not Coming";

export interface RsvpCheck {
  check: string;
}

export interface RsvpOwnerSummary {
  _id: string;
  husband_first?: string;
  husband_email?: string;
  last_name?: string;
}

export interface RsvpUnitSummary {
  _id: string;
  unit_number: string;
}

export interface RsvpRecord {
  _id: string;
  status: RsvpStatusApi;
  date: string | null;
  howManyMen: number;
  guests: number;
  checks: RsvpCheck[];
  idOwnerHusbandUser: RsvpOwnerSummary;
  idUnit: RsvpUnitSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RsvpListData {
  comings: RsvpRecord[];
  maybes: RsvpRecord[];
  totalHowManyMenComing: number;
  totalGuestsComing: number;
  total: number;
}

export interface RsvpListResponse extends ApiResponse<RsvpListData> {}

export type RsvpListByUnitResponse = ApiResponse<RsvpRecord[]>;

export interface CreateRsvpBody {
  status: RsvpStatusApi;
  howManyMen: number;
  guests: number;
  checks: RsvpCheck[];
  idOwnerHusbandUser: string;
  idUnit: string;
  date?: string;
}

export interface UpdateRsvpBody {
  status?: RsvpStatusApi;
  howManyMen?: number;
  guests?: number;
  checks?: RsvpCheck[];
  date?: string | null;
  idOwnerHusbandUser?: string;
  idUnit?: string;
}

const buildRangeSearchParams = (from: string, to: string): string => {
  const search = new URLSearchParams();
  search.set("from", from);
  search.set("to", to);
  return search.toString();
};

export async function listRsvps(from: string, to: string): Promise<RsvpListData> {
  const qs = buildRangeSearchParams(from, to);
  const res = await fetch(`${getBaseUrl()}/api/rsvps?${qs}`, {
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as RsvpListResponse;
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to fetch RSVPs");
  }
  if (!json.data) {
    return {
      comings: [],
      maybes: [],
      totalHowManyMenComing: 0,
      totalGuestsComing: 0,
      total: 0,
    };
  }
  return json.data;
}

export async function listRsvpsByUnit(
  unitId: string,
  from: string,
  to: string,
): Promise<RsvpRecord[]> {
  const qs = buildRangeSearchParams(from, to);
  const res = await fetch(
    `${getBaseUrl()}/api/rsvps/unit/${encodeURIComponent(unitId)}?${qs}`,
    {
      headers: getAuthHeaders(),
    },
  );
  const json = (await res.json()) as RsvpListByUnitResponse;
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to fetch RSVPs for unit");
  }
  return json.data ?? [];
}

export async function createRsvp(body: CreateRsvpBody): Promise<RsvpRecord> {
  const res = await fetch(`${getBaseUrl()}/api/rsvps`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<RsvpRecord>;
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to create RSVP");
  }
  if (!json.data) {
    throw new Error("No RSVP returned");
  }
  return json.data;
}

export async function updateRsvp(
  id: string,
  body: UpdateRsvpBody,
): Promise<RsvpRecord> {
  const res = await fetch(`${getBaseUrl()}/api/rsvps/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<RsvpRecord>;
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to update RSVP");
  }
  if (!json.data) {
    throw new Error("No RSVP returned");
  }
  return json.data;
}

export async function deleteRsvp(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/rsvps/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok) {
    throw new Error(json.message ?? "Failed to delete RSVP");
  }
}

export const RSVP_CHECK_ONLY_IF_MINYAN = "Only if minyan";
export const RSVP_CHECK_ONLY_IF_SEFER_TORAH = "Only if sefer torah";
export const RSVP_CHECK_HAVE_SEFER_TORAH = "I have a sefer torah";
export const RSVP_CHECK_BAAL_KOREH = "I am a baal koreh";

export function buildChecksFromFlags(options: {
  onlyIfMinyan: boolean;
  onlyIfSeferTorah: boolean;
  haveSeferTorah: boolean;
  baalKoreh: boolean;
}): RsvpCheck[] {
  const checks: RsvpCheck[] = [];
  if (options.onlyIfMinyan) {
    checks.push({ check: RSVP_CHECK_ONLY_IF_MINYAN });
  }
  if (options.onlyIfSeferTorah) {
    checks.push({ check: RSVP_CHECK_ONLY_IF_SEFER_TORAH });
  }
  if (options.haveSeferTorah) {
    checks.push({ check: RSVP_CHECK_HAVE_SEFER_TORAH });
  }
  if (options.baalKoreh) {
    checks.push({ check: RSVP_CHECK_BAAL_KOREH });
  }
  return checks;
}

export function extractFlagsFromChecks(checks: RsvpCheck[] | undefined): {
  onlyIfMinyan: boolean;
  onlyIfSeferTorah: boolean;
  haveSeferTorah: boolean;
  baalKoreh: boolean;
} {
  const list = checks ?? [];
  const has = (value: string) => list.some((c) => c.check === value);
  return {
    onlyIfMinyan: has(RSVP_CHECK_ONLY_IF_MINYAN),
    onlyIfSeferTorah: has(RSVP_CHECK_ONLY_IF_SEFER_TORAH),
    haveSeferTorah: has(RSVP_CHECK_HAVE_SEFER_TORAH),
    baalKoreh: has(RSVP_CHECK_BAAL_KOREH),
  };
}

export function getCurrentOwnerId(): string | null {
  const info = getStoredUserInfo();
  const id = (info as { id?: string } | null | undefined)?.id;
  if (!id) return null;
  return id;
}

