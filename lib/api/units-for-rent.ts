/**
 * API client for units for rent (rentals).
 * All routes require Bearer token (owner, any role).
 * @see perennialpark-api/docs/UNITS_FOR_RENT.md
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

// --- Types ---

export interface UnitForRentOwner {
  type: "husband" | "wife";
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: { unit_number: string };
}

export interface UnitForRent {
  _id: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  only_my_colony: boolean;
  owner?: UnitForRentOwner | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ListRentalsParams {
  only_my_colony?: boolean;
}

export interface CreateRentalBody {
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  only_my_colony?: boolean;
}

// --- API ---

export async function listRentals(params?: ListRentalsParams): Promise<UnitForRent[]> {
  const search = new URLSearchParams();
  if (params?.only_my_colony !== undefined)
    search.set("only_my_colony", String(params.only_my_colony));
  const qs = search.toString();
  const url = `${getBaseUrl()}/api/units-for-rent${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<UnitForRent[]>;
  if (res.status === 401) throw new Error("Unauthorized.");
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch rentals");
  return json.data ?? [];
}

export async function getRentalById(id: string): Promise<UnitForRent | null> {
  const res = await fetch(
    `${getBaseUrl()}/api/units-for-rent/${encodeURIComponent(id)}`,
    { headers: getAuthHeaders() }
  );
  const json = (await res.json()) as ApiResponse<UnitForRent>;
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch rental");
  return json.data ?? null;
}

export async function createRental(body: CreateRentalBody): Promise<UnitForRent> {
  const res = await fetch(`${getBaseUrl()}/api/units-for-rent`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<UnitForRent>;
  if (!res.ok) throw new Error(json.message ?? "Failed to create rental");
  if (!json.data) throw new Error("No rental returned");
  return json.data;
}

export async function updateRental(
  id: string,
  body: Partial<CreateRentalBody>
): Promise<UnitForRent> {
  const res = await fetch(
    `${getBaseUrl()}/api/units-for-rent/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  );
  const json = (await res.json()) as ApiResponse<UnitForRent>;
  if (!res.ok) throw new Error(json.message ?? "Failed to update rental");
  return json.data ?? (body as UnitForRent);
}

export async function deleteRental(id: string): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/api/units-for-rent/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (res.status === 404) throw new Error("Rental not found.");
  if (!res.ok) {
    const json = (await res.json()) as ApiResponse;
    throw new Error(json.message ?? "Failed to delete rental");
  }
}
