"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { MeetingCategory } from "@/lib/api/meetings";
import { findTypeByName } from "@/lib/api/meetings";
import {
  listMeetings,
  createMeeting,
  updateMeeting,
  anularMeeting,
} from "@/lib/api/meetings";
import { TimePicker } from "@/components/ui/time-picker";

const DAF_YOMI_MODEL = "daf-yomi-meeting";
const ADDITIONAL_SHIURIM_MODEL = "additional-shiurim-meeting";

interface ShiurimTabProps {
  structure: MeetingCategory[];
  /** Monday of the week (YYYY-MM-DD). */
  period: string;
}

export function ShiurimTab({ structure, period }: ShiurimTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const dafYomiType = findTypeByName(structure, "Shiurim", "Daf Yomi");
  const additionalShiurimType = findTypeByName(structure, "Shiurim", "Additional Shiurim");

  // Local override for Daf Yomi. If empty, UI falls back to current value from API.
  const [dafYomiTime, setDafYomiTime] = useState("");
  const [newShiur, setNewShiur] = useState({ name: "", time: "", description: "" });
  const [localShiurim, setLocalShiurim] = useState<Array<{ _id?: string; name?: string; time?: string; description?: string }>>([]);

  const dafYomiQuery = useQuery({
    queryKey: ["meetings", DAF_YOMI_MODEL, dafYomiType?._id, period],
    queryFn: async () => {
      if (!dafYomiType) return [];
      return listMeetings<Record<string, unknown>>(DAF_YOMI_MODEL, {
        status: 1,
        idType: dafYomiType._id,
        period,
      });
    },
    enabled: !!dafYomiType && !!period,
  });

  const shiurimQuery = useQuery({
    queryKey: ["meetings", ADDITIONAL_SHIURIM_MODEL, additionalShiurimType?._id, period],
    queryFn: async () => {
      if (!additionalShiurimType) return [];
      return listMeetings<Record<string, unknown>>(ADDITIONAL_SHIURIM_MODEL, {
        status: 1,
        idType: additionalShiurimType._id,
        period,
      });
    },
    enabled: !!additionalShiurimType && !!period,
  });

  const dafYomiList = (dafYomiQuery.data ?? []) as Record<string, unknown>[];
  const dafYomiFirst = dafYomiList[0] as Record<string, unknown> | undefined;
  const dafYomiEffectiveTime =
    dafYomiTime || ((dafYomiFirst?.time as string) ?? "");

  const existingShiurRecords = (shiurimQuery.data ?? []) as Record<string, unknown>[];
  const mappedExistingShiurim = existingShiurRecords.map((r) => ({
    _id: r._id as string,
    name: r.name as string,
    time: r.time as string,
    description: r.description as string,
  }));

  const effectiveShiurim =
    localShiurim.length > 0 ? localShiurim : mappedExistingShiurim;

  const mutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      setMessage(null);
      const errors: string[] = [];

      if (dafYomiType) {
        const existing = dafYomiFirst;
        try {
          if (existing?._id) {
            await updateMeeting(DAF_YOMI_MODEL, existing._id as string, {
              time: dafYomiEffectiveTime,
              period,
            });
          } else if (dafYomiEffectiveTime) {
            await createMeeting(DAF_YOMI_MODEL, {
              idType: dafYomiType._id,
              time: dafYomiEffectiveTime,
              period,
            });
          }
        } catch (err) {
          errors.push(`Daf Yomi: ${err instanceof Error ? err.message : "Failed"}`);
        }
      }

      if (additionalShiurimType) {
        const current = effectiveShiurim;
        const toAnular = mappedExistingShiurim.filter(
          (e) => !current.some((s) => s._id === e._id)
        );
        for (const r of toAnular) {
          try {
            await anularMeeting(ADDITIONAL_SHIURIM_MODEL, r._id as string);
          } catch (err) {
            errors.push(`Delete shiur: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
        for (const row of current) {
          if (!row._id && row.name && row.time) {
            try {
              await createMeeting(ADDITIONAL_SHIURIM_MODEL, {
                idType: additionalShiurimType._id,
                name: row.name,
                time: row.time,
                description: row.description ?? "",
                period,
              });
            } catch (err) {
              errors.push(`Add shiur: ${err instanceof Error ? err.message : "Failed"}`);
            }
          }
        }
      }

      if (errors.length) throw new Error(errors.join("; "));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setMessage({ type: "success", text: "Saved." });
      setNewShiur({ name: "", time: "", description: "" });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (e) => {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save." });
    },
    onSettled: () => setSaving(false),
  });

  const addNewShiur = () => {
    if (!newShiur.name.trim() || !newShiur.time.trim()) return;
    setLocalShiurim([...effectiveShiurim, { ...newShiur }]);
    setNewShiur({ name: "", time: "", description: "" });
  };

  const removeShiur = (index: number) => {
    setLocalShiurim(effectiveShiurim.filter((_, i) => i !== index));
  };

  const isLoading = dafYomiQuery.isLoading || shiurimQuery.isLoading;

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Daf Yomi</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block font-semibold">Daf Yomi Time</Label>
          <TimePicker value={dafYomiTime} onChange={setDafYomiTime} />
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Additional Shiurim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {additionalShiurimType && (
            <>
              <div className="border-t pt-4">
                <h3 className="mb-3 font-semibold">Add New Shiur</h3>
                <div className="mb-3 space-y-3">
                  <Input
                    placeholder="Shiur name (e.g., Mishnayos, Gemara)"
                    value={newShiur.name}
                    onChange={(e) => setNewShiur((p) => ({ ...p, name: e.target.value }))}
                  />
                  <TimePicker
                    value={newShiur.time}
                    onChange={(v) => setNewShiur((p) => ({ ...p, time: v }))}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newShiur.description}
                    onChange={(e) => setNewShiur((p) => ({ ...p, description: e.target.value }))}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={addNewShiur}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Shiur
                  </Button>
                </div>
              </div>

              {effectiveShiurim.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="mb-3 font-semibold">Shiurim This Week</h3>
                  <div className="space-y-2">
                    {effectiveShiurim.map((s, idx) => (
                      <div
                        key={s._id ?? idx}
                        className="flex items-start justify-between rounded bg-muted/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.time}</p>
                          {s.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeShiur(idx)}
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {!additionalShiurimType && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No Additional Shiurim type in structure.
            </p>
          )}
        </CardContent>
      </Card>

      {message && (
        <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"}>
          {message.text}
        </p>
      )}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        size="lg"
        disabled={saving || isLoading}
        onClick={() => mutation.mutate()}
      >
        {saving ? "Saving..." : "Save Shiurim"}
      </Button>
    </div>
  );
}
