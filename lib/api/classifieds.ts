/**
 * API client for classifieds: categories and posts.
 * All routes require Bearer token (owner, any role).
 * @see perennialpark-api/docs/CLASSIFIEDS.md
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

export interface ClassifiedCategory {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassifiedPostCreator {
  type: "husband" | "wife";
  id: string;
  first: string;
  last_name: string;
  email: string;
  unit_number: string;
}

export interface ClassifiedPost {
  _id: string;
  title: string;
  category: { _id: string; name: string };
  description?: string;
  price?: number | null;
  contact_info?: string;
  visible_to_other_colonies: boolean;
  creator?: ClassifiedPostCreator;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ListPostsParams {
  category?: string;
  visible_to_other_colonies?: boolean;
}

export interface CreatePostBody {
  title: string;
  category: string;
  description: string;
  visible_to_other_colonies: boolean;
  price?: number | null;
  contact_info?: string;
}

// --- Categories ---

export async function listCategories(): Promise<ClassifiedCategory[]> {
  const res = await fetch(`${getBaseUrl()}/api/classified-categories`, {
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as ApiResponse<ClassifiedCategory[]>;
  if (res.status === 401) throw new Error("Unauthorized.");
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch categories");
  return json.data ?? [];
}

// --- Posts ---

export async function listPosts(params?: ListPostsParams): Promise<ClassifiedPost[]> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.visible_to_other_colonies !== undefined)
    search.set("visible_to_other_colonies", String(params.visible_to_other_colonies));
  const qs = search.toString();
  const url = `${getBaseUrl()}/api/classified-posts${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = (await res.json()) as ApiResponse<ClassifiedPost[]>;
  if (res.status === 401) throw new Error("Unauthorized.");
  if (res.status === 403) throw new Error("Access denied.");
  if (!res.ok) throw new Error(json.message ?? "Failed to fetch posts");
  return json.data ?? [];
}

export async function createPost(body: CreatePostBody): Promise<ClassifiedPost> {
  const res = await fetch(`${getBaseUrl()}/api/classified-posts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResponse<ClassifiedPost>;
  if (!res.ok) throw new Error(json.message ?? "Failed to create post");
  if (!json.data) throw new Error("No post returned");
  return json.data;
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/api/classified-posts/${encodeURIComponent(id)}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (res.status === 404) throw new Error("Post not found.");
  if (!res.ok) {
    const json = (await res.json()) as ApiResponse;
    throw new Error(json.message ?? "Failed to delete post");
  }
}
