"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail } from "lucide-react";
import type { UnitListItem } from "@/lib/api/units";

interface DirectoryCardProps {
  listItem: UnitListItem;
  /** Unit ID for the detail link (unit._id). */
  unitId: string;
  className?: string;
}

/**
 * One unit card in the directory list. Click navigates to unit detail.
 * Uses div+onClick instead of wrapping in Link to avoid nested <a> (tel/mailto inside).
 */
export default function DirectoryCard({
  listItem,
  unitId,
  className,
}: DirectoryCardProps) {
  const router = useRouter();
  const { unit, husband, wife, preliminarOwner, message } = listItem;
  const hasOwners = husband != null || wife != null;

  const title = hasOwners
    ? husband?.husband_first && wife?.wife_first && (husband?.last_name ?? wife?.last_name)
      ? `${husband.husband_first} & ${wife.wife_first} ${husband?.last_name ?? wife?.last_name}`
      : husband?.last_name ?? wife?.last_name ?? "Unknown"
    : preliminarOwner?.last_name ?? "Preliminar";

  const addressParts = [unit.address, unit.city, unit.state, unit.zip].filter(
    Boolean
  );
  const addressLine = addressParts.length > 0 ? addressParts.join(", ") : null;

  const goToDetail = () => router.push(`/unit/${unitId}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
      className="block h-full cursor-pointer"
    >
      <Card
        className={
          className ??
          "h-full cursor-pointer border-white/60 bg-white/80 shadow-lg transition-shadow hover:shadow-xl backdrop-blur-md"
        }
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                #{unit.unit_number}
              </span>
              <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {addressLine && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{addressLine}</span>
              </div>
            )}

            {hasOwners ? (
              <>
                <div className="flex flex-wrap gap-3">
                  {husband?.husband_phone && (
                    <a
                      href={`tel:${husband.husband_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-3 w-3" />
                      <span>
                        {husband.husband_first || "Husband"}: {husband.husband_phone}
                      </span>
                    </a>
                  )}
                  {wife?.wife_phone && (
                    <a
                      href={`tel:${wife.wife_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-3 w-3" />
                      <span>
                        {wife.wife_first || "Wife"}: {wife.wife_phone}
                      </span>
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {husband?.husband_email && (
                    <a
                      href={`mailto:${husband.husband_email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 truncate text-blue-600 hover:text-blue-800"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{husband.husband_email}</span>
                    </a>
                  )}
                  {wife?.wife_email && (
                    <a
                      href={`mailto:${wife.wife_email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 truncate text-blue-600 hover:text-blue-800"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{wife.wife_email}</span>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                {message && (
                  <p className="text-xs text-amber-700 rounded bg-amber-50 px-2 py-1">
                    {message}
                  </p>
                )}
                {preliminarOwner?.husband_phone && (
                  <a
                    href={`tel:${preliminarOwner.husband_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{preliminarOwner.husband_phone}</span>
                  </a>
                )}
              </>
            )}
          </div>

            {unit.notes && (
            <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-500">
              {unit.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
