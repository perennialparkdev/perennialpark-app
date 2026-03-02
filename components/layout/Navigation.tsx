"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clearStoredToken,
  clearStoredUnitId,
  clearStoredRole,
  clearStoredUserInfo,
  getStoredToken,
  getStoredRole,
  getStoredUserInfo,
  hasAdminAccess,
  canAccessManageUnits,
  canAccessDaveningTimes,
  type LoginOwnerRole,
  type StoredUserInfo,
} from "@/lib/api/owners";

const mainNavLinks = [
  { href: "/home", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/classifieds", label: "Classifieds" },
  { href: "/rentals", label: "Units for Rent" },
] as const;

/** Admin only (Manage Units, Manage Colonies). */
const manageNavLinks = [
  { href: "/admin/units", label: "Manage Units" },
  { href: "/admin/colonies", label: "Manage Colonies" },
] as const;

/** Admin or Gabaim. */
const daveningTimesLink = { href: "/admin/davening-times", label: "Davening Times" } as const;

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [hasToken] = useState(() => !!getStoredToken());
  const [role] = useState<LoginOwnerRole | null>(() => getStoredRole());
  const [userInfo] = useState<StoredUserInfo | null>(() => getStoredUserInfo());

  const showManage = canAccessManageUnits(role);
  const showDaveningTimes = canAccessDaveningTimes(role);
  const showAdminLabel = hasAdminAccess(role);
  const showGabaimLabel = showDaveningTimes && !showManage;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  return (
    <div className="fixed left-0 right-0 top-0 z-50">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 p-2 transition-colors hover:opacity-80 md:top-6"
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <Menu size={28} className="text-emerald-600" />
        )}
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-gradient-to-b from-emerald-700 to-emerald-800 text-white shadow-xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-shrink-0 flex-col items-center gap-3 border-b border-emerald-600 p-6 pt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 text-3xl backdrop-blur-sm">
            🌿
          </div>
          <h1 className="text-center text-2xl font-bold">Perennial Park</h1>
        </div>

        <div className="flex-shrink-0 border-b border-emerald-600 bg-emerald-600/30 px-6 py-4">
          {hasToken && (
            <>
              {userInfo?.unitNumber != null && userInfo.unitNumber !== "" && (
                <p className="mb-1 text-xs text-emerald-200">
                  Unit {userInfo.unitNumber}
                </p>
              )}
              <p className="text-sm font-semibold text-white">
                {(userInfo?.displayName || userInfo?.email || role?.name) ?? "Member"}
              </p>
              {userInfo?.email && (
                <p className="mt-1 text-xs text-emerald-100 truncate" title={userInfo.email}>
                  {userInfo.email}
                </p>
              )}
              {showAdminLabel && (
                <p className="mt-1 text-xs text-yellow-300">Administrator</p>
              )}
              {showGabaimLabel && !showAdminLabel && (
                <p className="mt-1 text-xs text-yellow-300">Davening Times</p>
              )}
            </>
          )}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ul className="space-y-2">
            {mainNavLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block rounded-lg px-4 py-3 text-lg transition-colors hover:bg-emerald-600/50",
                    pathname === href
                      ? "font-semibold bg-emerald-600/50"
                      : "font-normal"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            {showManage &&
              manageNavLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block rounded-lg px-4 py-3 text-lg transition-colors hover:bg-emerald-600/50",
                      pathname === href
                        ? "font-semibold bg-emerald-600/50"
                        : "font-normal"
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            {showDaveningTimes && (
              <li key={daveningTimesLink.href}>
                <Link
                  href={daveningTimesLink.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block rounded-lg px-4 py-3 text-lg transition-colors hover:bg-emerald-600/50",
                    pathname === daveningTimesLink.href
                      ? "font-semibold bg-emerald-600/50"
                      : "font-normal"
                  )}
                >
                  {daveningTimesLink.label}
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-4 border-t border-emerald-600 pt-4">
            <Link
              href="/"
              onClick={() => {
                clearStoredToken();
                clearStoredUnitId();
                clearStoredRole();
                clearStoredUserInfo();
                setIsOpen(false);
              }}
              className="block w-full rounded-lg bg-emerald-500 px-4 py-3 text-center text-lg font-semibold text-white shadow-lg transition-colors hover:bg-emerald-400"
            >
              Logout
            </Link>
          </div>
        </nav>
      </aside>
    </div>
  );
}
