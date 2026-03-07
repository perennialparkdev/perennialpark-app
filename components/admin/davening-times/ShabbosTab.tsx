"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { MeetingCategory } from "@/lib/api/meetings";
import { findTypeByName } from "@/lib/api/meetings";
import {
  listMeetings,
  createMeeting,
  updateMeeting,
  anularMeeting,
} from "@/lib/api/meetings";
import { SHABBOS_MINYANIM_SEGMENTS, SHABBOS_MEVORCHIM_TYPE } from "@/lib/meetings-config";
import { TimePicker } from "@/components/ui/time-picker";
import { MinyanRow, type MinyanRowData } from "./MinyanRow";

const MEVORCHIM_MODEL = "shabbos-mevorchim-meeting";
const MEETING_MODEL = "meeting";

function recordToRow(r: Record<string, unknown>): MinyanRowData {
  return {
    _id: r._id as string,
    time: (r.time as string) ?? "",
    name: r.name as string | undefined,
    minyan_name: r.name as string | undefined,
    location: r.location as string | undefined,
  };
}

interface ShabbosTabProps {
  structure: MeetingCategory[];
  /** Monday of the week (YYYY-MM-DD). */
  period: string;
}

export function ShabbosTab({ structure, period }: ShabbosTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const mevorchimType = findTypeByName(
    structure,
    SHABBOS_MEVORCHIM_TYPE.categoryName,
    SHABBOS_MEVORCHIM_TYPE.typeName
  );

  const segmentsWithTypes = SHABBOS_MINYANIM_SEGMENTS.map((seg) => ({
    ...seg,
    type: findTypeByName(structure, seg.categoryName, seg.typeName),
  })).filter((s) => s.type);

  // Local overrides for Shabbos Mevorchim; displayed/saved values fall back to query data.
  const [mevorchimForm, setMevorchimForm] = useState<Partial<{ time: string; location: string; notes: string }>>({});
  const [localMinyanim, setLocalMinyanim] = useState<Record<string, MinyanRowData[]>>({});

  const mevorchimQuery = useQuery({
    queryKey: ["meetings", MEVORCHIM_MODEL, mevorchimType?._id, period],
    queryFn: async () => {
      if (!mevorchimType) return [];
      return listMeetings<Record<string, unknown>>(MEVORCHIM_MODEL, {
        status: 1,
        idType: mevorchimType._id,
        period,
      });
    },
    enabled: !!mevorchimType && !!period,
  });

  const minyanimQuery = useQuery({
    queryKey: ["meetings", "shabbos-minyanim", period, segmentsWithTypes.map((s) => s.type!._id)],
    queryFn: async () => {
      const results: Record<string, MinyanRowData[]> = {};
      for (const { segmentKey, type } of segmentsWithTypes) {
        const list = await listMeetings<Record<string, unknown>>(MEETING_MODEL, {
          status: 1,
          idType: type!._id,
          period,
        });
        results[segmentKey] = list.map(recordToRow);
      }
      return results;
    },
    enabled: segmentsWithTypes.length > 0 && !!period,
  });

  const mevorchimFirst = (mevorchimQuery.data ?? [])[0] as Record<string, unknown> | undefined;
  const mevorchimTime = mevorchimForm.time ?? (mevorchimFirst?.time as string) ?? "";
  const mevorchimLocation = mevorchimForm.location ?? (mevorchimFirst?.location as string) ?? "shul";
  const mevorchimNotes = mevorchimForm.notes ?? (mevorchimFirst?.notes as string) ?? "";

  const updateLocalMinyan = (
    segmentKey: string,
    index: number,
    field: keyof MinyanRowData,
    value: string
  ) => {
    setLocalMinyanim((prev) => {
      const base = prev[segmentKey] ?? (minyanimQuery.data ?? {})[segmentKey] ?? [];
      const arr = [...base];
      const current = arr[index] ?? { time: "", name: "", location: "" };
      arr[index] = {
        ...current,
        [field]: value,
        name: field === "minyan_name" ? value : current.name,
        minyan_name: field === "minyan_name" ? value : current.minyan_name,
      };
      return { ...prev, [segmentKey]: arr };
    });
  };

  const addMinyan = (segmentKey: string) => {
    setLocalMinyanim((prev) => ({
      ...prev,
      [segmentKey]: [...(prev[segmentKey] ?? (minyanimQuery.data ?? {})[segmentKey] ?? []), { time: "", name: "", location: "" }],
    }));
  };

  const removeMinyan = (segmentKey: string, index: number) => {
    setLocalMinyanim((prev) => {
      const base = prev[segmentKey] ?? (minyanimQuery.data ?? {})[segmentKey] ?? [];
      return { ...prev, [segmentKey]: base.filter((_, i) => i !== index) };
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      setMessage(null);
      const errors: string[] = [];

      if (mevorchimType) {
        const list = mevorchimQuery.data ?? [];
        const existing = list[0] as Record<string, unknown> | undefined;
        const payload = {
          idType: mevorchimType._id,
          time: mevorchimTime,
          location: mevorchimLocation,
          notes: mevorchimNotes,
          period,
        };
        try {
          if (existing?._id) {
            await updateMeeting(MEVORCHIM_MODEL, existing._id as string, payload);
          } else if (mevorchimTime) {
            await createMeeting(MEVORCHIM_MODEL, payload);
          }
        } catch (err) {
          errors.push(`Shabbos Mevorchim: ${err instanceof Error ? err.message : "Failed"}`);
        }
      }

      for (const { segmentKey, type } of segmentsWithTypes) {
        const existing = (minyanimQuery.data ?? {})[segmentKey] ?? [];
        const rows = localMinyanim[segmentKey] ?? existing;
        const toCreate = rows.filter((r) => r.time && !r._id);
        const toUpdate = rows.filter((r) => r._id && r.time);
        const toAnularIds = existing.filter((e) => !rows.some((r) => r._id === e._id)).map((e) => e._id!);

        for (const id of toAnularIds) {
          try {
            await anularMeeting(MEETING_MODEL, id);
          } catch (err) {
            errors.push(`${segmentKey}: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
        for (const row of toUpdate) {
          try {
            await updateMeeting(MEETING_MODEL, row._id!, {
              idType: type!._id,
              name: row.name ?? row.minyan_name ?? "",
              location: row.location ?? "",
              time: row.time,
              period,
            });
          } catch (err) {
            errors.push(`${segmentKey}: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
        for (const row of toCreate) {
          if (!row.time) continue;
          try {
            await createMeeting(MEETING_MODEL, {
              idType: type!._id,
              name: row.name ?? row.minyan_name ?? "",
              location: row.location ?? "",
              time: row.time,
              period,
            });
          } catch (err) {
            errors.push(`${segmentKey}: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
      }

      if (errors.length) throw new Error(errors.join("; "));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setMessage({ type: "success", text: "Saved." });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (e) => {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save." });
    },
    onSettled: () => setSaving(false),
  });

  const isLoading = mevorchimQuery.isLoading || minyanimQuery.isLoading;

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Shabbos Davening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {segmentsWithTypes.map(({ segmentKey, type }) => {
            const rows = localMinyanim[segmentKey] ?? (minyanimQuery.data ?? {})[segmentKey] ?? [];
            return (
              <div key={segmentKey} className="border-l-4 border-emerald-300 pl-4 py-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{type!.name}</h3>
                  <Button size="sm" variant="outline" onClick={() => addMinyan(segmentKey)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Minyan
                  </Button>
                </div>
                <div className="space-y-3">
                  {rows.map((m, idx) => (
                    <MinyanRow
                      key={m._id ?? idx}
                      minyan={m}
                      onChange={(field, value) => updateLocalMinyan(segmentKey, idx, field, value)}
                      onRemove={() => removeMinyan(segmentKey, idx)}
                    />
                  ))}
                  {rows.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No minyanim added yet</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Shabbos Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block font-semibold">Shabbos Mevorchim Time</Label>
            <TimePicker
            value={mevorchimTime}
            onChange={(v) => setMevorchimForm((p) => ({ ...p, time: v }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              When applicable, time for Shabbos Mevorchim during Shachris
            </p>
          </div>
          <div>
            <Label className="mb-2 block font-semibold">Kiddush Location</Label>
            <Select
            value={mevorchimLocation}
            onValueChange={(v) => setMevorchimForm((p) => ({ ...p, location: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shul">Shul</SelectItem>
                <SelectItem value="field">Field</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block font-semibold">Kiddush Notes</Label>
            <Input
              placeholder="e.g., Sponsored by the Cohen family"
              value={mevorchimNotes}
              onChange={(e) => setMevorchimForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
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
        {saving ? "Saving..." : "Save Shabbos"}
      </Button>
    </div>
  );
}
