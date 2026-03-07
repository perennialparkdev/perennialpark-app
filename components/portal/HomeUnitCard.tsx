"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Pencil, X, Loader2, Plus, Trash2 } from "lucide-react";
import type { UnitListItem, UnitChild } from "@/lib/api/units";
import { updateUnit } from "@/lib/api/units";

interface HomeUnitCardProps {
  /** Unit data from GET /api/units/:id; null when loading or no unit. */
  listItem: UnitListItem | null;
  /** Show loading skeleton. */
  loading?: boolean;
  /** Called after successful edit so parent can refresh. */
  onUnitUpdated?: (item: UnitListItem) => void;
  className?: string;
}

const emptyForm = () => ({
  address: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
  last_name: "",
  husband_first: "",
  husband_email: "",
  husband_phone: "",
  wife_first: "",
  wife_email: "",
  wife_phone: "",
  children: [] as UnitChild[],
});

/**
 * Displays the current user's unit on the home page (same structure as old UnitCardWithEdit).
 * Data comes from GET /api/units/:id (getById).
 */
export default function HomeUnitCard({
  listItem,
  loading = false,
  onUnitUpdated,
  className,
}: HomeUnitCardProps) {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  if (loading) {
    return (
      <Card
        className={`border-white/40 bg-white/70 shadow-lg backdrop-blur-xl ${className ?? ""}`}
      >
        <CardHeader className="pb-2">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-24 animate-pulse rounded bg-slate-100" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        </CardContent>
      </Card>
    );
  }

  if (!listItem) {
    return (
      <Card
        className={`border-white/40 bg-white/70 shadow-lg backdrop-blur-xl ${className ?? ""}`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Your Unit
          </CardTitle>
          <p className="text-xs text-slate-600">
            Unit details will appear when your unit is linked.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you just completed registration, refresh the page or sign in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { unit, husband, wife, children } = listItem;
  const lastName = husband?.last_name ?? wife?.last_name ?? "";
  const title =
    husband?.husband_first && wife?.wife_first && lastName
      ? `${husband.husband_first} & ${wife.wife_first} ${lastName}`
      : lastName
        ? lastName
        : "Your Unit";

  const addressParts = [
    unit.address,
    unit.city,
    unit.state,
    unit.zip,
  ].filter(Boolean);
  const addressLine = addressParts.length > 0 ? addressParts.join(", ") : null;

  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  const openEdit = () => {
    setForm({
      address: str(unit.address),
      city: str(unit.city),
      state: str(unit.state),
      zip: str(unit.zip),
      notes: str(unit.notes),
      last_name: husband?.last_name ?? wife?.last_name ?? "",
      husband_first: str(husband?.husband_first),
      husband_email: str(husband?.husband_email),
      husband_phone: str(husband?.husband_phone),
      wife_first: str(wife?.wife_first),
      wife_email: str(wife?.wife_email),
      wife_phone: str(wife?.wife_phone),
      children: children?.length ? [...children] : [],
    });
    setOpenEditModal(true);
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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUnit(unit._id, {
        unit: {
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
      onUnitUpdated?.(updated);
      setOpenEditModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Card
      className={`border-white/40 bg-white/70 shadow-lg backdrop-blur-xl ${className ?? ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
            <p className="text-sm text-slate-600">Unit #{unit.unit_number}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openEdit}
            className="flex-shrink-0"
            aria-label="Edit unit"
          >
            <Pencil className="h-4 w-4" />
            <span className="ml-1.5 sr-only sm:not-sr-only">Edit</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {addressLine && (
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <p>{addressLine}</p>
          </div>
        )}

        {husband && (husband.husband_first || husband.husband_email || husband.husband_phone) && (
          <div>
            <p className="font-semibold text-slate-700">
              {[husband.husband_first, husband.last_name].filter(Boolean).join(" ")}
            </p>
            {husband.husband_phone && (
              <a
                href={`tel:${husband.husband_phone}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-3 w-3" />
                {husband.husband_phone}
              </a>
            )}
            {husband.husband_email && (
              <a
                href={`mailto:${husband.husband_email}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Mail className="h-3 w-3" />
                {husband.husband_email}
              </a>
            )}
          </div>
        )}

        {wife && (wife.wife_first || wife.wife_email || wife.wife_phone) && (
          <div>
            <p className="font-semibold text-slate-700">
              {[wife.wife_first, wife.last_name].filter(Boolean).join(" ")}
            </p>
            {wife.wife_phone && (
              <a
                href={`tel:${wife.wife_phone}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-3 w-3" />
                {wife.wife_phone}
              </a>
            )}
            {wife.wife_email && (
              <a
                href={`mailto:${wife.wife_email}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Mail className="h-3 w-3" />
                {wife.wife_email}
              </a>
            )}
          </div>
        )}

        {unit.notes && (
          <div className="border-t border-slate-200 pt-2 text-slate-600">
            <strong>Notes:</strong> {unit.notes}
          </div>
        )}

        {children && children.length > 0 && (
          <div className="border-t border-slate-200 pt-2">
            <strong className="text-slate-600">Children:</strong>
            <ul className="ml-4 mt-1 text-slate-600">
              {children.map((child, idx) => (
                <li key={idx}>
                  {child.name} ({child.age})
                  {child.genre ? ` · ${child.genre}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>

    {openEditModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Edit Unit #{unit.unit_number}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpenEditModal(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit} className="flex flex-col gap-8">
              <section className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit_number">Unit number</Label>
                    <Input
                      id="edit-unit_number"
                      value={unit.unit_number}
                      disabled
                      placeholder="101"
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Brooklyn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zip">ZIP</Label>
                    <Input
                      id="edit-zip"
                      value={form.zip}
                      onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                      placeholder="11201"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Input
                      id="edit-notes"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Second floor"
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-border" />

              <section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-husband_name">Husband name</Label>
                    <Input
                      id="edit-husband_name"
                      value={form.husband_first}
                      onChange={(e) => setForm((f) => ({ ...f, husband_first: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-wife_name">Wife name</Label>
                    <Input
                      id="edit-wife_name"
                      value={form.wife_first}
                      onChange={(e) => setForm((f) => ({ ...f, wife_first: e.target.value }))}
                      placeholder="Mary"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="edit-last_name">Last name</Label>
                    <Input
                      id="edit-last_name"
                      value={form.last_name}
                      onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      placeholder="Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-husband_email">Husband email</Label>
                    <Input
                      id="edit-husband_email"
                      type="email"
                      value={form.husband_email}
                      onChange={(e) => setForm((f) => ({ ...f, husband_email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-wife_email">Wife email</Label>
                    <Input
                      id="edit-wife_email"
                      type="email"
                      value={form.wife_email}
                      onChange={(e) => setForm((f) => ({ ...f, wife_email: e.target.value }))}
                      placeholder="mary@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-husband_phone">Husband phone</Label>
                    <Input
                      id="edit-husband_phone"
                      type="tel"
                      value={form.husband_phone}
                      onChange={(e) => setForm((f) => ({ ...f, husband_phone: e.target.value }))}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-wife_phone">Wife phone</Label>
                    <Input
                      id="edit-wife_phone"
                      type="tel"
                      value={form.wife_phone}
                      onChange={(e) => setForm((f) => ({ ...f, wife_phone: e.target.value }))}
                      placeholder="+1 555 987 6543"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">
                    How many children do you have on ground?
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    <Plus className="size-4" />
                    Add child
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

              <div className="flex gap-2 border-t border-border pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenEditModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}
