"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";
import type { UnitListItem } from "@/lib/api/units";

interface HomeUnitCardProps {
  /** Unit data from GET /api/units/:id; null when loading or no unit. */
  listItem: UnitListItem | null;
  /** Show loading skeleton. */
  loading?: boolean;
  className?: string;
}

/**
 * Displays the current user's unit on the home page (same structure as old UnitCardWithEdit).
 * Data comes from GET /api/units/:id (getById).
 */
export default function HomeUnitCard({
  listItem,
  loading = false,
  className,
}: HomeUnitCardProps) {
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

  return (
    <Card
      className={`border-white/40 bg-white/70 shadow-lg backdrop-blur-xl ${className ?? ""}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
        <p className="text-sm text-slate-600">Unit #{unit.unit_number}</p>
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
  );
}
