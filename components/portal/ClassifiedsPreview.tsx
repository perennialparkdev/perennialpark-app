"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Placeholder: list from API in Phase 2. */
export default function ClassifiedsPreview({
  className,
}: {
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-700" />
            <CardTitle className="text-base font-semibold text-slate-900">
              Classifieds
            </CardTitle>
          </div>
          <Link href="/classifieds">
            <Button variant="ghost" size="sm" className="h-8">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="py-4 text-center text-sm text-slate-500">
          No active classifieds
        </p>
      </CardContent>
    </Card>
  );
}
