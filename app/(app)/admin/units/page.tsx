"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ArrowLeft, RefreshCw, Trash2, X } from "lucide-react";
import { getStoredToken, clearStoredToken } from "@/lib/api/owners";
import {
  type Unit,
  type UnitListItem,
  type UnitChild,
  fetchUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  activateUnit,
  anularUnit,
  unlinkUnit,
  resetOwnerPassword,
  sendOwnerInvitation,
} from "@/lib/api/units";
import AdminUnitCard from "@/components/admin/AdminUnitCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function AdminUnitsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "1" | "2">("");
  const [showModal, setShowModal] = useState(false);
  /** When set, we are in edit mode with full unit + husband + wife + children. */
  const [editingItem, setEditingItem] = useState<UnitListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    unit_number: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    colony_name: "",
    notes: "",
    last_name: "",
    husband_first: "",
    husband_email: "",
    husband_phone: "",
    husband_role: "",
    wife_first: "",
    wife_email: "",
    wife_phone: "",
    wife_role: "",
    children: [] as UnitChild[],
  });

  const loadUnits = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const statusParam = statusFilter === "1" || statusFilter === "2" ? (Number(statusFilter) as 1 | 2) : undefined;
      const data = await fetchUnits(statusParam);
      setUnits(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load units";
      const lower = msg.toLowerCase();
      const isTokenInvalid =
        lower.includes("token") && (lower.includes("inválido") || lower.includes("invalido") || lower.includes("expirado") || lower.includes("expired") || lower.includes("invalid"));
      if (isTokenInvalid) {
        clearStoredToken();
        router.replace("/sign-in");
        return;
      }
      setError(msg);
      if (msg.includes("denegado") || msg.includes("administrador") || msg.includes("403") || msg.includes("Access denied") || msg.includes("denied")) setForbidden(true);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    loadUnits();
  }, [mounted, router, loadUnits]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      unit_number: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      colony_name: "",
      notes: "",
      last_name: "",
      husband_first: "",
      husband_email: "",
      husband_phone: "",
      husband_role: "",
      wife_first: "",
      wife_email: "",
      wife_phone: "",
      wife_role: "",
      children: [],
    });
    setShowModal(true);
  };

  /** Normalize unit so form always gets strings (API may return numbers). */
  const getUnitFormValues = (item: UnitListItem) => {
    const u = item.unit;
    const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
    return {
      unit_number: str(u.unit_number),
      address: str(u.address),
      city: str(u.city),
      state: str(u.state),
      zip: str(u.zip),
      colony_name: str(u.colony_name),
      notes: str(u.notes),
    };
  };

  const openEdit = (item: UnitListItem) => {
    setEditingItem(item);
    const { husband, wife, children } = item;
    const unitValues = getUnitFormValues(item);
    setForm({
      ...unitValues,
      last_name: husband?.last_name ?? wife?.last_name ?? "",
      husband_first: husband?.husband_first ?? "",
      husband_email: husband?.husband_email ?? "",
      husband_phone: husband?.husband_phone ?? "",
      husband_role: "",
      wife_first: wife?.wife_first ?? "",
      wife_email: wife?.wife_email ?? "",
      wife_phone: wife?.wife_phone ?? "",
      wife_role: "",
      children: children?.length ? [...children] : [],
    });
    setShowModal(true);
  };

  const addChild = () => {
    setForm((f) => ({
      ...f,
      children: [...f.children, { name: "", age: 0, genre: "Boy" }],
    }));
  };
  const updateChild = (index: number, field: keyof UnitChild, value: string | number) => {
    setForm((f) => ({
      ...f,
      children: f.children.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };
  const removeChild = (index: number) => {
    setForm((f) => ({
      ...f,
      children: f.children.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_number.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateUnit(editingItem.unit._id, {
          unit: {
            unit_number: form.unit_number.trim(),
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            state: form.state.trim() || undefined,
            zip: form.zip.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
          husband:
            form.husband_email.trim() || form.husband_first.trim()
              ? {
                  husband_first: form.husband_first.trim() || undefined,
                  last_name: form.last_name.trim() || undefined,
                  husband_email: form.husband_email.trim() || undefined,
                  husband_phone: form.husband_phone.trim() || undefined,
                }
              : undefined,
          wife:
            form.wife_email.trim() || form.wife_first.trim()
              ? {
                  wife_first: form.wife_first.trim() || undefined,
                  last_name: form.last_name.trim() || undefined,
                  wife_email: form.wife_email.trim() || undefined,
                  wife_phone: form.wife_phone.trim() || undefined,
                }
              : undefined,
          children: form.children.length > 0 ? form.children : undefined,
        });
      } else {
        await createUnit({
          unit: {
            unit_number: form.unit_number.trim(),
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            state: form.state.trim() || undefined,
            zip: form.zip.trim() || undefined,
            colony_name: form.colony_name.trim() || undefined,
            notes: form.notes.trim() || undefined,
          },
          preliminar_owner: {
            husband_phone: form.husband_phone.trim() || undefined,
            last_name: form.last_name.trim() || undefined,
          },
        });
      }
      setShowModal(false);
      await loadUnits();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Delete Unit #${unit.unit_number}? This cannot be undone.`)) return;
    setActionLoading(unit._id);
    try {
      await deleteUnit(unit._id);
      await loadUnits();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (unit: Unit) => {
    setActionLoading(unit._id);
    try {
      await activateUnit(unit._id);
      await loadUnits();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Activate failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnular = async (unit: Unit) => {
    if (!confirm(`Anular Unit #${unit.unit_number}?`)) return;
    setActionLoading(unit._id);
    try {
      await anularUnit(unit._id);
      await loadUnits();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Anular failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async (unit: Unit) => {
    if (!confirm(`Unlink all owners and data from Unit #${unit.unit_number}? The unit will remain.`)) return;
    setActionLoading(unit._id);
    try {
      await unlinkUnit(unit._id);
      await loadUnits();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (unitId: string, email: string) => {
    if (!email.trim()) {
      alert("Enter owner email.");
      return;
    }
    setActionLoading(unitId);
    try {
      await resetOwnerPassword(unitId, email.trim());
      alert("Password reset. New password is the unit number.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvitation = async (unitId: string, email: string) => {
    if (!email.trim()) {
      alert("Enter owner email.");
      return;
    }
    setActionLoading(unitId);
    try {
      await sendOwnerInvitation(unitId, email.trim());
      alert("Invitation sent.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Send invitation failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (!mounted) return null;

  const filtered = sortListByUnitNumber(
    units.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const u = item.unit;
      const h = item.husband;
      const w = item.wife;
      const nameParts = [
        u.unit_number,
        h?.husband_first,
        h?.last_name,
        w?.wife_first,
        w?.last_name,
        item.preliminarOwner?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return nameParts.includes(q);
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-6 pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="outline" size="icon" aria-label="Back to Home">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">Manage units</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Unit
          </Button>
        </div>

        {forbidden && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-amber-800">Access denied. Only administrators can manage units.</p>
              <Button variant="outline" className="mt-2" onClick={() => router.replace("/home")}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {!forbidden && (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="Search by unit number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md bg-white/80 backdrop-blur-md"
              />
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "1" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("1")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "2" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("2")}
                >
                  Inactive
                </Button>
              </div>
            </div>
            {searchQuery && (
              <p className="mb-2 text-sm text-slate-600">
                Showing {filtered.length} of {units.length} units
              </p>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : error && !forbidden ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" className="mt-2" onClick={() => loadUnits()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <AdminUnitCard
                    key={item.unit._id}
                    listItem={item}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onActivate={handleActivate}
                    onAnular={handleAnular}
                    onUnlink={handleUnlink}
                    onResetPassword={handleResetPassword}
                    onSendInvitation={handleSendInvitation}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No units found. Add a unit to get started.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>
                {editingItem ? `Edit Unit #${editingItem.unit.unit_number}` : "Add New Unit"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* Unit section */}
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unit_number">Unit number *</Label>
                      <Input
                        id="unit_number"
                        value={form.unit_number}
                        onChange={(e) => setForm((f) => ({ ...f, unit_number: e.target.value }))}
                        placeholder="e.g. 102"
                        required
                        disabled={!!editingItem}
                        className={editingItem ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="456 Oak Ave"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="Brooklyn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={form.zip}
                        onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                        placeholder="11202"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Second floor"
                      />
                    </div>
                  </div>
                </section>

                {!editingItem ? (
                  /* Create: preliminar only */
                  <section className="space-y-4 border-t border-border pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Preliminar: Last name</Label>
                        <Input
                          id="last_name"
                          value={form.last_name}
                          onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="husband_phone">Preliminar: Husband phone</Label>
                        <Input
                          id="husband_phone"
                          value={form.husband_phone}
                          onChange={(e) => setForm((f) => ({ ...f, husband_phone: e.target.value }))}
                          placeholder="+1 555 111 2233"
                        />
                      </div>
                    </div>
                  </section>
                ) : (
                  /* Edit: husband, wife, roles, children */
                  <>
                    <div className="border-t border-border" />
                    <section className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="husband_first">Husband name</Label>
                          <Input
                            id="husband_first"
                            value={form.husband_first}
                            onChange={(e) => setForm((f) => ({ ...f, husband_first: e.target.value }))}
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wife_first">Wife name</Label>
                          <Input
                            id="wife_first"
                            value={form.wife_first}
                            onChange={(e) => setForm((f) => ({ ...f, wife_first: e.target.value }))}
                            placeholder="Mary"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="last_name">Last name</Label>
                          <Input
                            id="last_name"
                            value={form.last_name}
                            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                            placeholder="Smith"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="husband_email">Husband email</Label>
                          <Input
                            id="husband_email"
                            type="email"
                            value={form.husband_email}
                            onChange={(e) => setForm((f) => ({ ...f, husband_email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wife_email">Wife email</Label>
                          <Input
                            id="wife_email"
                            type="email"
                            value={form.wife_email}
                            onChange={(e) => setForm((f) => ({ ...f, wife_email: e.target.value }))}
                            placeholder="mary@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="husband_phone">Husband phone</Label>
                          <Input
                            id="husband_phone"
                            type="tel"
                            value={form.husband_phone}
                            onChange={(e) => setForm((f) => ({ ...f, husband_phone: e.target.value }))}
                            placeholder="+1 555 123 4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wife_phone">Wife phone</Label>
                          <Input
                            id="wife_phone"
                            type="tel"
                            value={form.wife_phone}
                            onChange={(e) => setForm((f) => ({ ...f, wife_phone: e.target.value }))}
                            placeholder="+1 555 987 6543"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="husband_role">Husband role (UI only)</Label>
                          <Input
                            id="husband_role"
                            value={form.husband_role}
                            onChange={(e) => setForm((f) => ({ ...f, husband_role: e.target.value }))}
                            placeholder="e.g. Admin"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wife_role">Wife role (UI only)</Label>
                          <Input
                            id="wife_role"
                            value={form.wife_role}
                            onChange={(e) => setForm((f) => ({ ...f, wife_role: e.target.value }))}
                            placeholder="e.g. Member"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-border pt-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-foreground">
                          Children
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={addChild}>
                          <Plus className="size-4" /> Add child
                        </Button>
                      </div>
                      {form.children.length > 0 && (
                        <ul className="space-y-4">
                          {form.children.map((child, index) => (
                            <li
                              key={index}
                              className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
                            >
                              <div className="min-w-[120px] flex-1 space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={child.name}
                                  onChange={(e) => updateChild(index, "name", e.target.value)}
                                  placeholder="Emma"
                                />
                              </div>
                              <div className="w-24 space-y-2">
                                <Label>Age</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={child.age || ""}
                                  onChange={(e) =>
                                    updateChild(index, "age", parseInt(e.target.value, 10) || 0)
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="w-28 space-y-2">
                                <Label>Gender</Label>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  value={child.genre}
                                  onChange={(e) => updateChild(index, "genre", e.target.value)}
                                >
                                  <option value="Boy">Boy</option>
                                  <option value="Girl">Girl</option>
                                </select>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeChild(index)}
                                aria-label="Remove child"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </>
                )}

                <div className="flex gap-2 border-t border-border pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
