"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getStoredToken } from "@/lib/api/owners";
import { getMeetingsStructure } from "@/lib/api/meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MinyanimTab } from "@/components/admin/davening-times/MinyanimTab";
import { ShabbosTab } from "@/components/admin/davening-times/ShabbosTab";
import { ShiurimTab } from "@/components/admin/davening-times/ShiurimTab";
import { AnnouncementsTab } from "@/components/admin/davening-times/AnnouncementsTab";

export default function AdminDaveningTimesPage() {
  const structureQuery = useQuery({
    queryKey: ["meetings", "structure"],
    queryFn: getMeetingsStructure,
    enabled: typeof window !== "undefined" && !!getStoredToken(),
    retry: (_, error) => {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("403") || msg.includes("Access denied")) return false;
      return true;
    },
  });

  const { data: structure = [], isLoading, isError, error } = structureQuery;
  const forbidden = isError && (error instanceof Error && (error.message.includes("403") || error.message.includes("Access denied")));

  if (typeof window !== "undefined" && !getStoredToken()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You must be logged in to manage davening times.
            </p>
            <Link href="/">
              <Button className="mt-4 w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don&apos;t have permission to edit davening times.
            </p>
            <Link href="/">
              <Button className="mt-4 w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
      <div className="mx-auto max-w-5xl py-6">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Shabbos Davening Times
          </h1>
          <p className="text-slate-600">
            Manage davening times, minyanim, and announcements
          </p>
        </div>

        <Tabs defaultValue="minyanim" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white/80">
            <TabsTrigger value="minyanim">Minyanim</TabsTrigger>
            <TabsTrigger value="shabbos">Shabbos</TabsTrigger>
            <TabsTrigger value="shiurim">Shiurim</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="minyanim" className="space-y-4">
            <MinyanimTab structure={structure} />
          </TabsContent>

          <TabsContent value="shabbos" className="space-y-4">
            <ShabbosTab structure={structure} />
          </TabsContent>

          <TabsContent value="shiurim" className="space-y-4">
            <ShiurimTab structure={structure} />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <AnnouncementsTab structure={structure} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
