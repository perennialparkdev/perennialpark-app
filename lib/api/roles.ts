import { getStoredToken } from "./owners";
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

export interface Role {
  _id: string;
  name: string;
  description?: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchRoles(status?: 1 | 2): Promise<Role[]> {
  const url = `${getBaseUrl()}/api/roles`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<Role[]>;
  console.log("response roles", json);
  if (res.status === 403) throw new Error("Access denied. Only administrators can manage roles.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch roles");
  return json.data ?? [];
}

