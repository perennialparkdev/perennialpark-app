"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredToken,
  clearStoredToken,
  getStoredRole,
  getStoredUserInfo,
  hasAdminAccess,
} from "@/lib/api/owners";
import {
  listRentals,
  createRental,
  updateRental,
  deleteRental,
  type UnitForRent,
  type CreateRentalBody,
} from "@/lib/api/units-for-rent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Pencil, X, User } from "lucide-react";

function formatRentalDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ownerLabel(owner: UnitForRent["owner"]): string {
  if (!owner) return "";
  const unit = owner.unit?.unit_number ? `Unit ${owner.unit.unit_number}` : "";
  return owner.name ? `${owner.name}${unit ? ` · ${unit}` : ""}` : unit || "—";
}

const emptyForm: CreateRentalBody & { startDateStr?: string; endDateStr?: string } = {
  startDate: null,
  endDate: null,
  notes: null,
  only_my_colony: false,
  startDateStr: "",
  endDateStr: "",
};

export default function RentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<UnitForRent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOnlyMyColony, setFilterOnlyMyColony] = useState<boolean | "">("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingRental, setEditingRental] = useState<UnitForRent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const role = getStoredRole();
  const userInfo = getStoredUserInfo();
  const isAdmin = hasAdminAccess(role);

  const loadRentals = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listRentals({
        only_my_colony:
          filterOnlyMyColony === true ? true : filterOnlyMyColony === false ? false : undefined,
      });
      setRentals(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load rentals";
      if (msg.includes("Access denied") || msg.includes("Unauthorized") || msg.includes("expired")) {
        clearStoredToken();
        router.replace("/sign-in");
        return;
      }
      setError(msg);
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [filterOnlyMyColony, router]);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/sign-in");
      return;
    }
    loadRentals();
  }, [loadRentals, router]);

  const filteredRentals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rentals;
    return rentals.filter((r) => {
      const notes = (r.notes ?? "").toLowerCase();
      const ownerName = (r.owner?.name ?? "").toLowerCase();
      const unitNum = (r.owner?.unit?.unit_number ?? "").toLowerCase();
      return notes.includes(q) || ownerName.includes(q) || unitNum.includes(q);
    });
  }, [rentals, searchQuery]);

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
      setForm(emptyForm);
      setOpenCreateModal(false);
      await loadRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rental");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    setSaving(true);
    setError(null);
    try {
      const startDate = form.startDateStr?.trim()
        ? new Date(form.startDateStr).toISOString()
        : null;
      const endDate = form.endDateStr?.trim() ? new Date(form.endDateStr).toISOString() : null;
      await updateRental(editingRental._id, {
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        notes: form.notes?.trim() || null,
        only_my_colony: form.only_my_colony,
      });
      setEditingRental(null);
      setForm(emptyForm);
      await loadRentals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rental");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rental: UnitForRent) => {
    if (!window.confirm("Delete this rental entry?")) return;
    setDeletingId(rental._id);
    try {
      await deleteRental(rental._id);
      await loadRentals();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (rental: UnitForRent) => {
    const start = rental.startDate
      ? new Date(rental.startDate).toISOString().slice(0, 10)
      : "";
    const end = rental.endDate
      ? new Date(rental.endDate).toISOString().slice(0, 10)
      : "";
    setForm({
      startDate: rental.startDate,
      endDate: rental.endDate,
      notes: rental.notes ?? "",
      only_my_colony: rental.only_my_colony ?? false,
      startDateStr: start,
      endDateStr: end,
    });
    setEditingRental(rental);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
      <main className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Units for Rent</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse and post unit availability for rent.
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setForm(emptyForm);
              setOpenCreateModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add rental
          </Button>
        </div>

        {/* Search and filter */}
        <Card className="mb-6 border-white/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label className="text-xs text-slate-600">Search</Label>
                <Input
                  placeholder="Search by notes, owner name, or unit number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-only-my-colony"
                  checked={filterOnlyMyColony === true}
                  onCheckedChange={(checked) =>
                    setFilterOnlyMyColony(checked === true ? true : "")
                  }
                />
                <Label htmlFor="filter-only-my-colony" className="text-sm font-normal">
                  My colony only
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredRentals.length === 0 ? (
              <Card className="border-white/60 bg-white/80 backdrop-blur-sm md:col-span-2">
                <CardContent className="py-12 text-center text-slate-600">
                  No rentals match your filters. Add one to get started.
                </CardContent>
              </Card>
            ) : (
              filteredRentals.map((rental) => (
                <Card
                  key={rental._id}
                  className="border-white/60 bg-white/80 shadow-md backdrop-blur-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>
                            {formatRentalDate(rental.startDate)} – {formatRentalDate(rental.endDate)}
                          </span>
                          {rental.only_my_colony && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                              My colony only
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg text-slate-900">
                          Unit {rental.owner?.unit?.unit_number ?? "—"}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {canDelete(rental) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(rental)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(rental)}
                              disabled={deletingId === rental._id}
                              aria-label="Delete"
                            >
                              {deletingId === rental._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {rental.notes && (
                      <p className="whitespace-pre-wrap text-slate-700">{rental.notes}</p>
                    )}
                    {rental.owner && (
                      <p className="flex items-center gap-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        {ownerLabel(rental.owner)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create modal */}
        {openCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>New rental</CardTitle>
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
                    <Label htmlFor="create-start">Start date (optional)</Label>
                    <Input
                      id="create-start"
                      type="date"
                      value={form.startDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, startDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-end">End date (optional)</Label>
                    <Input
                      id="create-end"
                      type="date"
                      value={form.endDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, endDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-notes">Notes (optional)</Label>
                    <textarea
                      id="create-notes"
                      value={form.notes ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Availability details..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-only-my-colony"
                      checked={form.only_my_colony}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, only_my_colony: !!checked }))
                      }
                    />
                    <Label htmlFor="create-only-my-colony" className="text-sm font-normal">
                      Only visible to my colony
                    </Label>
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
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

        {/* Edit modal */}
        {editingRental && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Edit rental</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingRental(null);
                    setForm(emptyForm);
                  }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start">Start date (optional)</Label>
                    <Input
                      id="edit-start"
                      type="date"
                      value={form.startDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, startDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end">End date (optional)</Label>
                    <Input
                      id="edit-end"
                      type="date"
                      value={form.endDateStr ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, endDateStr: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes (optional)</Label>
                    <textarea
                      id="edit-notes"
                      value={form.notes ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Availability details..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-only-my-colony"
                      checked={form.only_my_colony}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, only_my_colony: !!checked }))
                      }
                    />
                    <Label htmlFor="edit-only-my-colony" className="text-sm font-normal">
                      Only visible to my colony
                    </Label>
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingRental(null);
                        setForm(emptyForm);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
