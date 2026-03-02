/**
 * API client for /api/units (admin only).
 * Requires Bearer token from login; backend validates owner admin role.
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

export interface Unit {
  _id: string;
  unit_number: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  colony_name?: string;
  notes?: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Owner status: -1 = pending, 0 = anulado, 1 = activo. */
export const OWNER_STATUS_PENDING = -1;
export const OWNER_STATUS_ANULADO = 0;
export const OWNER_STATUS_ACTIVE = 1;

/** Owner data in list response (husband or wife). */
export interface HusbandOwner {
  husband_first: string;
  last_name: string;
  husband_email: string;
  husband_phone?: string;
  password: string | null;
  /** -1 pending, 0 anulado, 1 activo */
  status: number;
}

export interface WifeOwner {
  wife_first: string;
  last_name: string;
  wife_email: string;
  wife_phone?: string;
  password: string | null;
  /** -1 pending, 0 anulado, 1 activo */
  status: number;
}

/** Preliminar owner in list (when unit has no owners). */
export interface PreliminarOwnerInfo {
  husband_phone?: string;
  last_name?: string;
}

/** Child in list response. */
export interface UnitChild {
  name: string;
  age: number;
  genre: string;
}

/** Each item in GET /api/units response. */
export interface UnitListItem {
  unit: Unit;
  husband: HusbandOwner | null;
  wife: WifeOwner | null;
  message: string | null;
  preliminarOwner: PreliminarOwnerInfo | null;
  children: UnitChild[];
}

export interface CreateUnitBody {
  unit: {
    unit_number: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    colony_name?: string;
    notes?: string;
  };
  preliminar_owner?: {
    husband_phone?: string;
    last_name?: string;
  };
}

/** PATCH /api/units/:id — only sent blocks are updated. */
export interface UpdateUnitBody {
  unit?: Partial<Unit>;
  husband?: Partial<HusbandOwner> & { husband_phone?: string };
  wife?: Partial<WifeOwner> & { wife_phone?: string };
  children?: UnitChild[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function fetchUnits(status?: 1 | 2): Promise<UnitListItem[]> {
  const url = status ? `${getBaseUrl()}/api/units?status=${status}` : `${getBaseUrl()}/api/units`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<UnitListItem[]>;
  if (res.status === 403) throw new Error("Access denied. Only administrators can manage units.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch units");
  return json.data ?? [];
}

export async function fetchUnitById(id: string): Promise<UnitListItem | null> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}`, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<UnitListItem>;
  if (res.status === 404) return null;
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch unit");
  return json.data ?? null;
}

export async function createUnit(body: CreateUnitBody): Promise<Unit> {
  const res = await fetch(`${getBaseUrl()}/api/units`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<Unit>;
  if (!res.ok) throw new Error(json.message ?? "Failed to create unit");
  if (!json.data) throw new Error("No unit returned");
  return json.data;
}

export async function updateUnit(id: string, data: UpdateUnitBody): Promise<UnitListItem> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as ApiResponse<UnitListItem>;
  if (!res.ok) throw new Error(json.message ?? "Failed to update unit");
  if (!json.data) throw new Error("No unit returned");
  return json.data;
}

export async function deleteUnit(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok) throw new Error(json.message ?? "Failed to delete unit");
}

export async function activateUnit(id: string): Promise<Unit> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}/activate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  const json = (await res.json()) as ApiResponse<Unit>;
  if (!res.ok) throw new Error(json.message ?? "Failed to activate unit");
  return json.data!;
}

export async function anularUnit(id: string): Promise<Unit> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}/anular`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  const json = (await res.json()) as ApiResponse<Unit>;
  if (!res.ok) throw new Error(json.message ?? "Failed to anular unit");
  return json.data!;
}

export async function unlinkUnit(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/units/${id}/unlink`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok) throw new Error(json.message ?? "Failed to unlink unit");
}

export async function resetOwnerPassword(unitId: string, email: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/units/${unitId}/owners/reset-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok) throw new Error(json.message ?? "Failed to reset password");
}

export async function sendOwnerInvitation(unitId: string, email: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/units/${unitId}/owners/send-invitation`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  const json = (await res.json()) as ApiResponse;
  if (!res.ok) throw new Error(json.message ?? "Failed to send invitation");
}
