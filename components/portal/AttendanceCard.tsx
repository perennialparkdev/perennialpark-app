"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2 } from "lucide-react";

export interface AttendanceItem {
  name: string;
  unit: string;
  men: number;
  tags?: string[];
  rsvpId: string;
}

interface AttendanceCardProps {
  comingList?: AttendanceItem[];
  maybeList?: AttendanceItem[];
  totalMen?: number;
  isAdmin?: boolean;
  onDeleteRsvp?: (rsvpId: string) => void;
}

export default function AttendanceCard({
  comingList = [],
  maybeList = [],
  totalMen = 0,
  isAdmin = false,
  onDeleteRsvp,
}: AttendanceCardProps) {
  const hasMinyan = totalMen >= 10;

  return (
    <Card className="border-white/40 bg-white/70 shadow-lg backdrop-blur-xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Who&apos;s Coming
            </CardTitle>
            <p className="text-xs text-slate-600">
              Live attendance + minyan count
            </p>
          </div>
          <div
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              hasMinyan ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {hasMinyan ? `✓ Minyan (${totalMen})` : `${totalMen}/10 men`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {comingList.length > 0 && (
          <div className="mb-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-green-700">
              Coming
            </div>
            <div className="space-y-2">
              {comingList.map((item, i) => (
                <div
                  key={item.rsvpId ?? i}
                  className="rounded-lg border border-white/40 bg-white/60 p-3 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        Unit #{item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {item.men} men
                        </div>
                        {item.tags?.map((tag, ti) => (
                          <div
                            key={ti}
                            className="mt-1 text-xs text-blue-600"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                      {isAdmin && onDeleteRsvp && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (
                              confirm(`Remove RSVP for ${item.name}?`)
                            ) {
                              onDeleteRsvp(item.rsvpId);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {maybeList.length > 0 && (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Maybe
            </div>
            <div className="space-y-2">
              {maybeList.map((item, i) => (
                <div
                  key={item.rsvpId ?? i}
                  className="rounded-lg border border-amber-200/40 bg-amber-50/60 p-3 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        Unit #{item.unit}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {item.men} men
                        </div>
                        {item.tags?.map((tag, ti) => (
                          <div
                            key={ti}
                            className="mt-1 text-xs text-blue-600"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                      {isAdmin && onDeleteRsvp && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (
                              confirm(`Remove RSVP for ${item.name}?`)
                            ) {
                              onDeleteRsvp(item.rsvpId);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {comingList.length === 0 && maybeList.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-500">
            <Users className="h-8 w-8 text-slate-300" />
            <p>No RSVPs yet. Save your RSVP above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
