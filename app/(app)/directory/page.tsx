"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import { getStoredToken, getStoredUnitId } from "@/lib/api/owners";
import { clearStoredToken } from "@/lib/api/owners";
import { fetchUnits, fetchUnitById } from "@/lib/api/units";
import type { UnitListItem } from "@/lib/api/units";
import { exportDirectoryToExcel, exportDirectoryToPdf } from "@/lib/export-directory";
import HomeUnitCard from "@/components/portal/HomeUnitCard";
import DirectoryCard from "@/components/portal/DirectoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function sortListByUnitNumber(items: UnitListItem[]): UnitListItem[] {
  return [...items].sort((a, b) => {
    const an = String(a.unit.unit_number ?? "");
    const bn = String(b.unit.unit_number ?? "");
    const aNum = parseInt(an.replace(/\D/g, ""), 10) || 0;
    const bNum = parseInt(bn.replace(/\D/g, ""), 10) || 0;
    if (aNum !== bNum) return aNum - bNum;
    return an.localeCompare(bn);
  });
}

export default function DirectoryPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userUnitItem, setUserUnitItem] = useState<UnitListItem | null>(null);
  const [userUnitLoading, setUserUnitLoading] = useState(true);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    queueMicrotask(() => setAuthChecked(true));
  }, [router]);

  const loadUserUnit = useCallback(async () => {
    const unitId = getStoredUnitId();
    setUserUnitLoading(true);
    setUserUnitItem(null);
    if (!unitId) {
      setUserUnitLoading(false);
      return;
    }
    try {
      const item = await fetchUnitById(unitId);
      setUserUnitItem(item ?? null);
    } catch {
      // Ignore; user may not have unit linked
    } finally {
      setUserUnitLoading(false);
    }
  }, []);

  const loadUnits = useCallback(async () => {
    setUnitsLoading(true);
    setError(null);
    try {
      const data = await fetchUnits();
      console.log("data directory page", data);
      setUnits(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load directory";
      const lower = msg.toLowerCase();
      if (
        lower.includes("access denied") ||
        lower.includes("invalid") ||
        lower.includes("expired") ||
        lower.includes("token")
      ) {
        clearStoredToken();
        router.replace("/sign-in");
        return;
      }
      setError(msg);
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    loadUserUnit();
    loadUnits();
  }, [authChecked, loadUserUnit, loadUnits]);

  const sortedUnits = useMemo(
    () => sortListByUnitNumber(units),
    [units]
  );

  const userUnitId = userUnitItem?.unit._id ?? null;

  const otherUnits = useMemo(() => {
    return sortedUnits.filter((item) => item.unit._id !== userUnitId);
  }, [sortedUnits, userUnitId]);

  const searchLower = search.trim().toLowerCase();
  const filteredUnits = useMemo(() => {
    if (!searchLower) return otherUnits;
    return otherUnits.filter((item) => {
      const u = item.unit;
      const h = item.husband;
      const w = item.wife;
      const prelim = item.preliminarOwner;
      return (
        u.unit_number?.toLowerCase().includes(searchLower) ||
        h?.last_name?.toLowerCase().includes(searchLower) ||
        h?.husband_first?.toLowerCase().includes(searchLower) ||
        w?.wife_first?.toLowerCase().includes(searchLower) ||
        w?.last_name?.toLowerCase().includes(searchLower) ||
        prelim?.last_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [otherUnits, searchLower]);

  const handleExportExcel = () => {
    setDownloading("excel");
    exportDirectoryToExcel(filteredUnits)
      .finally(() => setDownloading(null));
  };

  const handleExportPdf = () => {
    setDownloading("pdf");
    exportDirectoryToPdf(filteredUnits, "Perennial Park - Contact Directory")
      .finally(() => setDownloading(null));
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="icon" aria-label="Back to Home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Directory</h1>
              <p className="text-slate-600">
                Contact information for all units
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportExcel}
              disabled={!!downloading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading === "excel" ? "Downloading…" : "Excel"}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!!downloading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading === "pdf" ? "Downloading…" : "PDF"}
            </Button>
          </div>
        </div>

        {/* Your Unit */}
        {(userUnitItem || userUnitLoading) && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Your Unit
            </h2>
            <HomeUnitCard
              listItem={userUnitItem}
              loading={userUnitLoading}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or unit number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/60 bg-white/80 pl-10 backdrop-blur-md"
          />
        </div>

        {/* Directory list */}
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}
        {unitsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredUnits.map((item) => (
              <DirectoryCard
                key={item.unit._id}
                listItem={item}
                unitId={item.unit._id}
              />
            ))}
          </div>
        )}

        {!unitsLoading && filteredUnits.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            No units found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
