"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import type { MeetingCategory, MeetingType } from "@/lib/api/meetings";
import {
  findType,
  listMeetings,
  createMeeting,
  updateMeeting,
  anularMeeting,
} from "@/lib/api/meetings";
import { MINYANIM_SEGMENTS } from "@/lib/meetings-config";
import { MinyanRow, type MinyanRowData } from "./MinyanRow";

const MODEL_KEY = "meeting";
const PERIOD = "Weekly";

function segmentToType(
  categories: MeetingCategory[],
  seg: { categoryName: string; typeName: string; weekDay: string | null }
): MeetingType | undefined {
  return findType(categories, seg.categoryName, seg.typeName, seg.weekDay);
}

function hasType<T extends { type?: MeetingType | undefined }>(
  seg: T
): seg is T & { type: MeetingType } {
  return !!seg.type;
}

/** Map API meeting record to row data (name used by API). */
function recordToRow(r: Record<string, unknown>): MinyanRowData {
  return {
    _id: r._id as string,
    time: (r.time as string) ?? "",
    name: r.name as string | undefined,
    minyan_name: r.name as string | undefined,
    location: r.location as string | undefined,
  };
}

/** Build create/update body for meeting. */
function rowToBody(idType: string, row: MinyanRowData) {
  return {
    idType,
    name: row.name ?? row.minyan_name ?? "",
    location: row.location ?? "",
    time: row.time,
    period: PERIOD,
  };
}

interface MinyanimTabProps {
  structure: MeetingCategory[];
}

export function MinyanimTab({ structure }: MinyanimTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const segmentsWithTypes = MINYANIM_SEGMENTS.map((seg) => ({
    ...seg,
    type: segmentToType(structure, seg),
  })).filter(hasType);

  const queries = segmentsWithTypes.map(({ segmentKey, type }) => ({
    key: [MODEL_KEY, type!._id] as const,
    segmentKey,
    type: type!,
  }));

  const listQueries = useQuery({
    queryKey: ["meetings", "minyanim", queries.map((q) => q.key)],
    queryFn: async () => {
      const results: Record<string, MinyanRowData[]> = {};
      for (const { segmentKey, type } of segmentsWithTypes) {
        const list = await listMeetings<Record<string, unknown>>(MODEL_KEY, {
          status: 1,
          idType: type._id,
        });
        results[segmentKey] = list.map(recordToRow);
      }
      return results;
    },
    enabled: segmentsWithTypes.length > 0,
  });

  const [local, setLocal] = useState<Record<string, MinyanRowData[]>>({});

  const updateLocal = (segmentKey: string, index: number, field: keyof MinyanRowData, value: string) => {
    setLocal((prev) => {
      const existingFromQuery = (listQueries.data ?? {})[segmentKey] ?? [];
      const base = prev[segmentKey] ?? existingFromQuery;
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

  const addRow = (segmentKey: string) => {
    setLocal((prev) => ({
      ...prev,
      [segmentKey]: [...(prev[segmentKey] ?? []), { time: "", name: "", location: "" }],
    }));
  };

  const removeRow = (segmentKey: string, index: number) => {
    setLocal((prev) => {
      const arr = (prev[segmentKey] ?? []).filter((_, i) => i !== index);
      return { ...prev, [segmentKey]: arr };
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      setMessage(null);
      const errors: string[] = [];
      for (const { segmentKey, type } of segmentsWithTypes) {
        const existing = (listQueries.data ?? {})[segmentKey] ?? [];
        const rows = local[segmentKey] ?? existing;
        const toCreate = rows.filter((r) => r.time && !r._id);
        const toUpdate = rows.filter((r) => r._id && r.time);
        const toAnularIds = existing.filter((e) => !rows.some((r) => r._id === e._id)).map((e) => e._id!);

        for (const id of toAnularIds) {
          try {
            await anularMeeting(MODEL_KEY, id);
          } catch (err) {
            errors.push(`${segmentKey} anular: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
        for (const row of toUpdate) {
          try {
            await updateMeeting(MODEL_KEY, row._id!, rowToBody(type._id, row) as Record<string, unknown>);
          } catch (err) {
            errors.push(`${segmentKey} update: ${err instanceof Error ? err.message : "Failed"}`);
          }
        }
        for (const row of toCreate) {
          if (!row.time) continue;
          try {
            await createMeeting(MODEL_KEY, rowToBody(type._id, row) as Record<string, unknown>);
          } catch (err) {
            errors.push(`${segmentKey} create: ${err instanceof Error ? err.message : "Failed"}`);
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

  if (segmentsWithTypes.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No Minyanim types found in structure.</p>
        </CardContent>
      </Card>
    );
  }

  const services = [
    { key: "weekdays", label: "Monday - Thursday", segments: segmentsWithTypes.filter((s) => s.segmentKey.startsWith("weekday-")) },
    { key: "friday", label: "Friday", segments: segmentsWithTypes.filter((s) => s.segmentKey.startsWith("friday-")) },
    { key: "sunday", label: "Sunday", segments: segmentsWithTypes.filter((s) => s.segmentKey.startsWith("sunday-")) },
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="weekdays" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white/80">
          <TabsTrigger value="weekdays">Monday - Thursday</TabsTrigger>
          <TabsTrigger value="friday">Friday</TabsTrigger>
          <TabsTrigger value="sunday">Sunday</TabsTrigger>
        </TabsList>

        {services.map(({ key, label, segments: segs }) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">{label} Davening</CardTitle>
                {key === "weekdays" && (
                  <p className="text-sm text-muted-foreground mt-2">These times apply to all weekdays</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {segs.map(({ segmentKey, type }) => {
                  const rows = local[segmentKey] ?? [];
                  const serviceLabel = type.name;
                  return (
                    <div key={segmentKey} className="border-l-4 border-emerald-300 pl-4 py-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{serviceLabel}</h3>
                        <Button size="sm" variant="outline" onClick={() => addRow(segmentKey)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Minyan
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {rows.map((m, idx) => (
                          <MinyanRow
                            key={m._id ?? idx}
                            minyan={m}
                            onChange={(field, value) => updateLocal(segmentKey, idx, field, value)}
                            onRemove={() => removeRow(segmentKey, idx)}
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
          </TabsContent>
        ))}
      </Tabs>

      {message && (
        <p className={message.type === "error" ? "text-destructive text-sm" : "text-emerald-600 text-sm"}>
          {message.text}
        </p>
      )}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        size="lg"
        disabled={saving || listQueries.isLoading}
        onClick={() => mutation.mutate()}
      >
        {saving ? "Saving..." : "Save Minyanim"}
      </Button>
    </div>
  );
}
