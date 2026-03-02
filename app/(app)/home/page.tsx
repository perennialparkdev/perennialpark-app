"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStoredToken, getStoredUnitId } from "@/lib/api/owners";
import { clearStoredToken } from "@/lib/api/owners";
import { fetchUnitById } from "@/lib/api/units";
import type { UnitListItem } from "@/lib/api/units";
import { getNextShabbosTransition, getThisShabbos } from "@/lib/utils-date";
import ShabbosCard from "@/components/portal/ShabbosCard";
import WeekNavigation from "@/components/portal/WeekNavigation";
import RsvpCard from "@/components/portal/RsvpCard";
import type { RsvpStatus } from "@/components/portal/RsvpCard";
import AttendanceCard from "@/components/portal/AttendanceCard";
import HomeUnitCard from "@/components/portal/HomeUnitCard";
import ZmanimCard from "@/components/portal/ZmanimCard";
import ChofetzChaimCard from "@/components/portal/ChofetzChaimCard";
import ClassifiedsPreview from "@/components/portal/ClassifiedsPreview";
import RentalCalendar from "@/components/portal/RentalCalendar";
import WeatherCard, { WeatherBar } from "@/components/portal/WeatherCard";
import DaveningTimesBar from "@/components/portal/DaveningTimesBar";

export default function HomePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [unitListItem, setUnitListItem] = useState<UnitListItem | null>(null);
  const [unitLoading, setUnitLoading] = useState(true);

  const [shabbosWeek, setShabbosWeek] = useState(getThisShabbos());
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>("no");
  const [menCount, setMenCount] = useState(0);
  const [guestMenCount, setGuestMenCount] = useState(0);
  const [onlyIfMinyan, setOnlyIfMinyan] = useState(false);
  const [onlyIfSeferTorah, setOnlyIfSeferTorah] = useState(false);
  const [haveSeferTorah, setHaveSeferTorah] = useState(false);
  const [baalKoreh, setBaalKoreh] = useState(false);
  const [savingRsvp, setSavingRsvp] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    const scheduleNextWeek = () => {
      const nextTransition = getNextShabbosTransition();
      const delay = Math.max(nextTransition.getTime() - Date.now(), 1000);
      timer = setTimeout(() => {
        if (!mounted) return;
        setShabbosWeek(getThisShabbos());
        scheduleNextWeek();
      }, delay);
    };

    scheduleNextWeek();

    return () => {
      mounted = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    queueMicrotask(() => setAuthChecked(true));
  }, [router]);

  const loadUnit = useCallback(async () => {
    const unitId = getStoredUnitId();
    setUnitLoading(true);
    setUnitListItem(null);
    if (!unitId) {
      setUnitLoading(false);
      return;
    }
    try {
      const item = await fetchUnitById(unitId);
      setUnitListItem(item ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load unit";
      if (msg.includes("Access denied") || msg.includes("invalid") || msg.includes("expired")) {
        clearStoredToken();
        router.replace("/sign-in");
        return;
      }
    } finally {
      setUnitLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    loadUnit();
  }, [authChecked, loadUnit]);

  const handleSaveRsvp = () => {
    setSavingRsvp(true);
    setTimeout(() => setSavingRsvp(false), 600);
  };

  const handleDeleteRsvp = (_rsvpId: string) => {
    // Phase 2: call API
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920')`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/30 backdrop-blur-[1px]" />

      <div className="relative z-10">
        <DaveningTimesBar />

        <main className="mx-auto max-w-[1400px] px-4 pb-12 pt-20">
          {/* Mobile */}
          <div className="max-w-full space-y-6 overflow-hidden pb-8 lg:hidden">
            <WeatherBar />
            <HomeUnitCard listItem={unitListItem} loading={unitLoading} />
            <ShabbosCard shabbosDate={shabbosWeek} />
            <WeekNavigation currentWeek={shabbosWeek} onWeekChange={setShabbosWeek} />
            <RsvpCard
              heading="RSVP"
              status={rsvpStatus}
              setStatus={setRsvpStatus}
              menCount={menCount}
              setMenCount={setMenCount}
              guestMenCount={guestMenCount}
              setGuestMenCount={setGuestMenCount}
              onlyIfMinyan={onlyIfMinyan}
              setOnlyIfMinyan={setOnlyIfMinyan}
              onlyIfSeferTorah={onlyIfSeferTorah}
              setOnlyIfSeferTorah={setOnlyIfSeferTorah}
              haveSeferTorah={haveSeferTorah}
              setHaveSeferTorah={setHaveSeferTorah}
              baalKoreh={baalKoreh}
              setBaalKoreh={setBaalKoreh}
              onSave={handleSaveRsvp}
              onReset={null}
              saving={savingRsvp}
            />
            <AttendanceCard
              comingList={[]}
              maybeList={[]}
              totalMen={0}
              isAdmin={false}
              onDeleteRsvp={handleDeleteRsvp}
            />
            <ZmanimCard />
            <ChofetzChaimCard />
            <ClassifiedsPreview />
            <RentalCalendar
              rentals={[]}
              userUnit={null}
              onAddRental={() => {}}
              onDeleteRental={() => {}}
              isAdmin={false}
            />
          </div>

          {/* Desktop */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-3">
            <div className="space-y-6">
              <HomeUnitCard listItem={unitListItem} loading={unitLoading} />
              <ZmanimCard />
              <ChofetzChaimCard />
            </div>
            <div className="space-y-6">
              <ShabbosCard shabbosDate={shabbosWeek} />
              <WeekNavigation currentWeek={shabbosWeek} onWeekChange={setShabbosWeek} />
              <RsvpCard
                heading="RSVP"
                status={rsvpStatus}
                setStatus={setRsvpStatus}
                menCount={menCount}
                setMenCount={setMenCount}
                guestMenCount={guestMenCount}
                setGuestMenCount={setGuestMenCount}
                onlyIfMinyan={onlyIfMinyan}
                setOnlyIfMinyan={setOnlyIfMinyan}
                onlyIfSeferTorah={onlyIfSeferTorah}
                setOnlyIfSeferTorah={setOnlyIfSeferTorah}
                haveSeferTorah={haveSeferTorah}
                setHaveSeferTorah={setHaveSeferTorah}
                baalKoreh={baalKoreh}
                setBaalKoreh={setBaalKoreh}
                onSave={handleSaveRsvp}
                onReset={null}
                saving={savingRsvp}
              />
              <AttendanceCard
                comingList={[]}
                maybeList={[]}
                totalMen={0}
                isAdmin={false}
                onDeleteRsvp={handleDeleteRsvp}
              />
            </div>
            <div className="space-y-6">
              <WeatherCard />
              <ClassifiedsPreview />
              <RentalCalendar
                rentals={[]}
                userUnit={null}
                onAddRental={() => {}}
                onDeleteRental={() => {}}
                isAdmin={false}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
