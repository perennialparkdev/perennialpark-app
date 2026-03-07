"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { getStoredUserInfo } from "@/lib/api/owners";
import {
  listRentals,
  createRental,
  deleteRental,
  type UnitForRent,
  type CreateRentalBody,
} from "@/lib/api/units-for-rent";
import { cn } from "@/lib/utils";

interface RentalCalendarProps {
  userUnit?: string | null;
  isAdmin?: boolean;
}

function formatRentalDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RentalCalendar({
  userUnit,
  isAdmin = false,
}: RentalCalendarProps) {
  const [rentals, setRentals] = useState<UnitForRent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRentalBody & { startDateStr?: string; endDateStr?: string }>({
    startDate: null,
    endDate: null,
    notes: null,
    only_my_colony: false,
    startDateStr: "",
    endDateStr: "",
  });

  const userInfo = getStoredUserInfo();
  const canList = Boolean(userUnit);

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listRentals();
      setRentals(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rentals");
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const canDelete = (rental: UnitForRent): boolean => {
    if (isAdmin) return true;
    if (!rental.owner?.id || !userInfo?.id) return false;
    return rental.owner.id === userInfo.id;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const startDate = form.startDateStr?.trim()
        ? `${form.startDateStr.trim()}T00:00:00.000Z`
        : null;
      const endDate = form.endDateStr?.trim()
        ? `${form.endDateStr.trim()}T00:00:00.000Z`
        : null;
      await createRental({
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        notes: form.notes?.trim() || null,
        only_my_colony: form.only_my_colony,
      });
      setForm({
        startDate: null,
        endDate: null,
        notes: null,
        only_my_colony: false,
        startDateStr: "",
        endDateStr: "",
      });
      setOpenCreateModal(false);
      await loadRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rental");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rental: UnitForRent) => {
    if (!window.confirm("Remove this rental entry?")) return;
    setDeletingId(rental._id);
    try {
      await deleteRental(rental._id);
      await loadRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        rentals.length === 0 && !loading && "min-h-[140px]"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Units Available for Rent
        </CardTitle>
        <p className="text-xs text-slate-600">
          Weekend availability posted by residents
        </p>
      </CardHeader>
      <CardContent>
        {canList && (
          <div className="mb-4 space-y-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/40 bg-white/40 backdrop-blur-md hover:bg-white/60"
              onClick={() => {
                setError(null);
                setForm({
                  startDate: null,
                  endDate: null,
                  notes: null,
                  only_my_colony: false,
                  startDateStr: "",
                  endDateStr: "",
                });
                setOpenCreateModal(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> List my unit
            </Button>
          </div>
        )}

        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : rentals.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No rentals posted yet
          </p>
        ) : (
          <ul className="space-y-2">
            {rentals.map((r) => (
              <li
                key={r._id}
                className="rounded-lg border border-slate-200 bg-white/50 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-sm text-slate-700">
                    <span className="font-medium">
                      Unit {r.owner?.unit?.unit_number ?? "—"}
                    </span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span>
                      {formatRentalDate(r.startDate)} – {formatRentalDate(r.endDate)}
                    </span>
                    {r.notes && (
                      <p className="mt-1 truncate text-xs text-slate-500">{r.notes}</p>
                    )}
                  </div>
                  {canDelete(r) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r._id}
                      aria-label="Remove"
                    >
                      {deletingId === r._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="ml-1">Remove</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Create modal */}
        {openCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">List my unit</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenCreateModal(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rc-start">Start date (optional)</Label>
                    <Input
                      id="rc-start"
                      type="date"
                      value={form.startDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, startDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc-end">End date (optional)</Label>
                    <Input
                      id="rc-end"
                      type="date"
                      value={form.endDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, endDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc-notes">Notes (optional)</Label>
                    <textarea
                      id="rc-notes"
                      value={form.notes ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Availability details..."
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rc-only-my-colony"
                      checked={form.only_my_colony}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, only_my_colony: !!checked }))
                      }
                    />
                    <Label htmlFor="rc-only-my-colony" className="text-sm font-normal">
                      Only visible to my colony
                    </Label>
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button type="submit" disabled={saving} size="sm">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenCreateModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
