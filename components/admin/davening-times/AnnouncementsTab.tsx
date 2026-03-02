"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MeetingCategory } from "@/lib/api/meetings";
import { findTypeByName } from "@/lib/api/meetings";
import {
  listMeetings,
  createMeeting,
  updateMeeting,
} from "@/lib/api/meetings";

const PERIOD = "Weekly";

const ANNOUNCEMENT_CONFIG = [
  {
    key: "pirkeiAvis",
    categoryName: "Announcements",
    typeName: "Pirkei Avis Shiur",
    modelKey: "pirkei-avis-shiur-announcements",
    field: "name" as const,
    label: "Who is giving the shiur?",
    placeholder: "Name",
    textarea: false,
  },
  {
    key: "mazelTov",
    categoryName: "Announcements",
    typeName: "Mazel Tov Announcements",
    modelKey: "mazel-tov-announcements",
    field: "description" as const,
    label: "Announcements",
    placeholder: "e.g., Mazel Tov to the Goldstein family on the engagement!",
    textarea: true,
  },
  {
    key: "avosUbonim",
    categoryName: "Announcements",
    typeName: "Avos U'Bonim Sponsor",
    modelKey: "avos-ubonim-sponsor-announcements",
    field: "name" as const,
    label: "Sponsor Name",
    placeholder: "Name",
    textarea: false,
  },
  {
    key: "announcementsNotes",
    categoryName: "Announcements",
    typeName: "Announcements Notes",
    modelKey: "announcements-notes-meeting",
    field: "additionalNotes" as const,
    label: "Additional Notes",
    placeholder: "Add any other announcements or notes...",
    textarea: true,
  },
];

interface AnnouncementsTabProps {
  structure: MeetingCategory[];
}

export function AnnouncementsTab({ structure }: AnnouncementsTabProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const configsWithType = ANNOUNCEMENT_CONFIG.map((c) => ({
    ...c,
    type: findTypeByName(structure, c.categoryName, c.typeName),
  })).filter((c) => c.type);

  // Local overrides typed by the user; initial values come from query data.
  const [form, setForm] = useState<Record<string, string>>({});

  const queries = useQuery({
    queryKey: ["meetings", "announcements", configsWithType.map((c) => [c.modelKey, c.type!._id])],
    queryFn: async () => {
      const values: Record<string, string> = {};
      const ids: Record<string, string> = {};
      for (const { key, modelKey, type, field } of configsWithType) {
        const list = await listMeetings<Record<string, unknown>>(modelKey, {
          status: 1,
          idType: type!._id,
        });
        const first = list[0] as Record<string, unknown> | undefined;
        values[key] = (first?.[field] as string) ?? "";
        if (first?._id) ids[key] = first._id as string;
      }
      return { values, ids };
    },
    enabled: configsWithType.length > 0,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      setMessage(null);
      const errors: string[] = [];

      for (const { key, modelKey, type, field } of configsWithType) {
        const valueFromQuery = queries.data?.values[key] ?? "";
        const value = form[key] ?? valueFromQuery;
        const existingId = queries.data?.ids[key];
        const payload = {
          idType: type!._id,
          [field]: value,
          period: PERIOD,
        };

        try {
          if (existingId) {
            await updateMeeting(modelKey, existingId, payload);
          } else if (value.trim()) {
            await createMeeting(modelKey, payload);
          }
        } catch (err) {
          errors.push(`${key}: ${err instanceof Error ? err.message : "Failed"}`);
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

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {configsWithType.map(({ key, label, placeholder, textarea }) => (
        <Card key={key} className="bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">
              {ANNOUNCEMENT_CONFIG.find((c) => c.key === key)?.typeName ?? key}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block font-semibold">{label}</Label>
            {textarea ? (
              <textarea
                placeholder={placeholder}
                value={form[key] ?? queries.data?.values[key] ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
              />
            ) : (
              <Input
                placeholder={placeholder}
                value={form[key] ?? queries.data?.values[key] ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
              />
            )}
          </CardContent>
        </Card>
      ))}

      {configsWithType.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-md">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No announcement types in structure.</p>
          </CardContent>
        </Card>
      )}

      {message && (
        <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"}>
          {message.text}
        </p>
      )}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        size="lg"
        disabled={saving || queries.isLoading}
        onClick={() => mutation.mutate()}
      >
        {saving ? "Saving..." : "Save Announcements"}
      </Button>
    </div>
  );
}
