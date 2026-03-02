"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { getStoredToken } from "@/lib/api/owners";
import { clearStoredToken } from "@/lib/api/owners";
import { fetchUnitById } from "@/lib/api/units";
import type { UnitListItem } from "@/lib/api/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : null;
  const [authChecked, setAuthChecked] = useState(false);
  const [item, setItem] = useState<UnitListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    queueMicrotask(() => setAuthChecked(true));
  }, [router]);

  useEffect(() => {
    if (!authChecked || !id) {
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
    });

    fetchUnitById(id)
      .then((data) => {
        if (!isMounted) return;
        setItem(data ?? null);
      })
      .catch((e) => {
        if (!isMounted) return;
        const msg = e instanceof Error ? e.message : "Failed to load unit";
        if (
          msg.includes("Access denied") ||
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("expired")
        ) {
          clearStoredToken();
          router.replace("/sign-in");
          return;
        }
        setError(msg);
        setItem(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authChecked, id, router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
        <div className="mx-auto max-w-2xl">
          <Link href="/directory">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
          <div className="py-12 text-center text-slate-500">
            {error || "Unit not found"}
          </div>
        </div>
      </div>
    );
  }

  const { unit, husband, wife, preliminarOwner, message } = item;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/directory">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        </Link>

        <Card className="border-white/60 bg-white/90 shadow-lg backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl">{title}</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              Unit #{unit.unit_number}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {addressLine && (
              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-slate-600">{addressLine}</p>
                </div>
              </div>
            )}

            {hasOwners ? (
              <>
                {husband &&
                  (husband.husband_first ||
                    husband.husband_phone ||
                    husband.husband_email) && (
                    <div className="border-t pt-6">
                      <p className="mb-3 font-semibold text-slate-700">Husband</p>
                      {(husband.husband_first || husband.last_name) && (
                        <p className="mb-2 text-slate-600">
                          {[husband.husband_first, husband.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      )}
                      {husband.husband_phone && (
                        <a
                          href={`tel:${husband.husband_phone}`}
                          className="mb-2 flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Phone className="h-4 w-4" />
                          {husband.husband_phone}
                        </a>
                      )}
                      {husband.husband_email && (
                        <a
                          href={`mailto:${husband.husband_email}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Mail className="h-4 w-4" />
                          {husband.husband_email}
                        </a>
                      )}
                    </div>
                  )}
                {wife &&
                  (wife.wife_first || wife.wife_phone || wife.wife_email) && (
                    <div className="border-t pt-6">
                      <p className="mb-3 font-semibold text-slate-700">Wife</p>
                      {(wife.wife_first || wife.last_name) && (
                        <p className="mb-2 text-slate-600">
                          {[wife.wife_first, wife.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      )}
                      {wife.wife_phone && (
                        <a
                          href={`tel:${wife.wife_phone}`}
                          className="mb-2 flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Phone className="h-4 w-4" />
                          {wife.wife_phone}
                        </a>
                      )}
                      {wife.wife_email && (
                        <a
                          href={`mailto:${wife.wife_email}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Mail className="h-4 w-4" />
                          {wife.wife_email}
                        </a>
                      )}
                    </div>
                  )}
              </>
            ) : (
              <div className="border-t pt-6">
                {message && (
                  <p className="mb-3 text-amber-700 rounded bg-amber-50 px-2 py-2 text-sm">
                    {message}
                  </p>
                )}
                {preliminarOwner && (preliminarOwner.last_name || preliminarOwner.husband_phone) && (
                  <div>
                    <p className="mb-2 font-semibold text-slate-700">Preliminar contact</p>
                    {preliminarOwner.last_name && (
                      <p className="mb-2 text-slate-600">{preliminarOwner.last_name}</p>
                    )}
                    {preliminarOwner.husband_phone && (
                      <a
                        href={`tel:${preliminarOwner.husband_phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Phone className="h-4 w-4" />
                        {preliminarOwner.husband_phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {unit.notes && (
              <div className="border-t pt-6">
                <p className="mb-2 font-semibold text-slate-700">Notes</p>
                <p className="text-slate-600">{unit.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
