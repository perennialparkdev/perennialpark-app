"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { X } from "lucide-react";

export interface MinyanRowData {
  _id?: string;
  time: string;
  name?: string;
  location?: string;
  minyan_name?: string;
}

interface MinyanRowProps {
  minyan: MinyanRowData;
  onChange: (field: "time" | "name" | "location" | "minyan_name", value: string) => void;
  onRemove: () => void;
}

export function MinyanRow({ minyan, onChange, onRemove }: MinyanRowProps) {
  const name = minyan.name ?? minyan.minyan_name ?? "";

  return (
    <div className="flex items-end gap-2 rounded bg-muted/50 p-3">
      <div className="flex-1">
        <Label className="mb-1 block text-xs text-muted-foreground">Time</Label>
        <TimePicker
          value={minyan.time}
          onChange={(v) => onChange("time", v)}
        />
      </div>
      <div className="flex-1">
        <Label className="mb-1 block text-xs text-muted-foreground">Minyan Name (optional)</Label>
        <Input
          placeholder="e.g., Early Minyan"
          value={name}
          onChange={(e) => onChange("minyan_name", e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="flex-1">
        <Label className="mb-1 block text-xs text-muted-foreground">Location (optional)</Label>
        <Input
          placeholder="e.g., Main Hall"
          value={minyan.location ?? ""}
          onChange={(e) => onChange("location", e.target.value)}
          className="text-sm"
        />
      </div>
      <Button type="button" size="icon" variant="ghost" onClick={onRemove} aria-label="Remove">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
