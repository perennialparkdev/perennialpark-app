const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export type CheckUnitResponse = {
  success: boolean;
  message: string;
  data?: { unitId: string; unit_number: string };
};

/** Response from POST /api/owners/check-phone (verify phone linked to a unit). */
export type CheckPhoneLinkResponse = {
  success: boolean;
  message: string;
  data?: { unit_number?: string; linkedAsOwner?: boolean };
};

export async function checkPhoneLink(phone: string): Promise<CheckPhoneLinkResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/check-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  const data = (await res.json()) as CheckPhoneLinkResponse;
  if (res.status >= 400) {
    return {
      success: false,
      message: data.message ?? "Request failed",
    };
  }
  return data;
}

export async function checkUnitAccess(
  unitNumber: string
): Promise<CheckUnitResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/check-unit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: unitNumber,
      contrasena: unitNumber,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      message: data.message ?? "Request failed",
    };
  }
  return data;
}

export type SignUpResponse = {
  success: boolean;
  message: string;
  data?: { email: string; uid: string };
};

export async function signUp(
  email: string,
  password: string
): Promise<SignUpResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message ?? "Signup failed" };
  }
  return data;
}

/** Role returned inside owner on login. */
export type LoginOwnerRole = {
  id: string;
  name: string;
};

/** Owner data returned by login when user is registered as owner (OWNERS.md). */
export type LoginOwner = {
  id: string;
  ownerType: "husband" | "wife";
  last_name?: string;
  husband_first?: string;
  husband_email?: string;
  husband_phone?: string;
  wife_first?: string;
  wife_email?: string;
  /** Role of the owner (e.g. Regular user, Administrator). */
  role?: LoginOwnerRole;
};

/** Unit data returned by login for the owner's unit (OWNERS.md). */
export type LoginUnit = {
  unit_number: string;
  address?: string;
  unitId?: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    expiresIn: string;
    uid: string;
    email: string;
    /** Owner data if registered in MongoDB; null otherwise. */
    owner?: LoginOwner | null;
    /** Unit (unit_number, address, unitId) if owner has unit; null otherwise. */
    unit?: LoginUnit | null;
  };
};

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contrasena: password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message ?? "Login failed" };
  }
  return data;
}

export type CompleteProfilePayload = {
  unit: {
    unit_number: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    colony_name?: string;
    notes?: string;
  };
  husband: {
    husband_first: string;
    husband_email: string;
    husband_phone: string;
    last_name: string;
    password: string;
  };
  wife?: {
    wife_first: string;
    wife_email: string;
    wife_phone: string;
    last_name: string;
    password: string;
  };
  children?: Array<{ name: string; age: number; genre: string }>;
};

export type CompleteProfileResponse = {
  success: boolean;
  message: string;
  data?: { unitId: string };
};

export async function completeProfile(
  token: string,
  payload: CompleteProfilePayload
): Promise<CompleteProfileResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/complete-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message ?? "Complete profile failed" };
  }
  return data;
}

export type PasswordRequestResponse = {
  success: boolean;
  message: string;
};

export async function requestPasswordReset(
  email: string
): Promise<PasswordRequestResponse> {
  const res = await fetch(`${getBaseUrl()}/api/owners/password-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      message: data.message ?? "Password reset request failed",
    };
  }
  return data;
}

export const AUTH_TOKEN_KEY = "pp_auth_token";
export const UNIT_ID_KEY = "pp_unit_id";
export const ROLE_KEY = "pp_role";
export const USER_INFO_KEY = "pp_user_info";

/** Stored after login for sidebar display (unit number, email, display name, owner id). */
export type StoredUserInfo = {
  id?: string;
  unitNumber?: string;
  email?: string;
  displayName?: string;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredUnitId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(UNIT_ID_KEY);
}

export function setStoredUnitId(unitId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNIT_ID_KEY, unitId);
}

export function clearStoredUnitId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(UNIT_ID_KEY);
}

export function getStoredRole(): LoginOwnerRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LoginOwnerRole;
    return parsed?.id && parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: LoginOwnerRole | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!role?.id || !role?.name) {
    localStorage.removeItem(ROLE_KEY);
    return;
  }
  localStorage.setItem(ROLE_KEY, JSON.stringify({ id: role.id, name: role.name }));
}

export function clearStoredRole(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}

export function getStoredUserInfo(): StoredUserInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserInfo;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredUserInfo(info: StoredUserInfo | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!info || (info.unitNumber == null && info.email == null && info.displayName == null)) {
    localStorage.removeItem(USER_INFO_KEY);
    return;
  }
  localStorage.setItem(USER_INFO_KEY, JSON.stringify({
    id: info.id ?? "",
    unitNumber: info.unitNumber ?? "",
    email: info.email ?? "",
    displayName: info.displayName ?? "",
  }));
}

export function clearStoredUserInfo(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_INFO_KEY);
}

/** Build display name from login owner (first name + last name). */
export function getOwnerDisplayName(owner: LoginOwner | null | undefined): string {
  if (!owner) return "";
  const first = owner.ownerType === "husband" ? owner.husband_first : owner.wife_first;
  const last = owner.last_name ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
}

/** Role IDs from backend (menu and page access follow old project rules). */
export const ROLE_IDS = {
  ADMIN: "69a4797d16285f80b89cb60b",
  REGULAR_USER: "69a4fe1d1c49fa661fecae12",
  GABAIM: "69a4fe4c1c49fa661fecae13",
  BOARD_MEMBER: "69a4fe711c49fa661fecae14",
} as const;

/** Manage Units + Manage Colonies: admin only. */
export function canAccessManageUnits(role: LoginOwnerRole | null | undefined): boolean {
  return role?.id === ROLE_IDS.ADMIN;
}

/** Manage Colonies: admin only. */
export function canAccessManageColonies(role: LoginOwnerRole | null | undefined): boolean {
  return role?.id === ROLE_IDS.ADMIN;
}

/** Davening Times: admin or gabaim. */
export function canAccessDaveningTimes(role: LoginOwnerRole | null | undefined): boolean {
  if (!role?.id) return false;
  return role.id === ROLE_IDS.ADMIN || role.id === ROLE_IDS.GABAIM;
}

/** Full admin menu (Manage Units, Manage Colonies, Davening Times). Used for "Administrator access" label. */
export function hasAdminAccess(role: LoginOwnerRole | null | undefined): boolean {
  return canAccessManageUnits(role);
}
