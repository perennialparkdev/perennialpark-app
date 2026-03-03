"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  getStoredToken,
  getStoredUnitId,
  getStoredRole,
  hasAdminAccess,
} from "@/lib/api/owners";
import { clearStoredToken } from "@/lib/api/owners";
import { fetchUnitById } from "@/lib/api/units";
import type { UnitListItem } from "@/lib/api/units";
import { getNextShabbosTransition, getThisShabbos, getWeekRangeForShabbos } from "@/lib/utils-date";
import ShabbosCard from "@/components/portal/ShabbosCard";
import WeekNavigation from "@/components/portal/WeekNavigation";
import RsvpCard from "@/components/portal/RsvpCard";
import type { RsvpStatus as UiRsvpStatus } from "@/components/portal/RsvpCard";
import AttendanceCard, { type AttendanceItem } from "@/components/portal/AttendanceCard";
import HomeUnitCard from "@/components/portal/HomeUnitCard";
import ZmanimCard from "@/components/portal/ZmanimCard";
import ChofetzChaimCard from "@/components/portal/ChofetzChaimCard";
import ClassifiedsPreview from "@/components/portal/ClassifiedsPreview";
import RentalCalendar from "@/components/portal/RentalCalendar";
import {
  buildChecksFromFlags,
  extractFlagsFromChecks,
  type RsvpRecord,
  type RsvpStatusApi,
  listRsvps,
  listRsvpsByUnit,
  createRsvp,
  updateRsvp,
  deleteRsvp,
  getCurrentOwnerId,
} from "@/lib/api/rsvps";
import WeatherCard, { WeatherBar } from "@/components/portal/WeatherCard";
import DaveningTimesBar from "@/components/portal/DaveningTimesBar";

export default function HomePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [unitListItem, setUnitListItem] = useState<UnitListItem | null>(null);
  const [unitLoading, setUnitLoading] = useState(true);

  const [shabbosWeek, setShabbosWeek] = useState(getThisShabbos());
  const [rsvpStatus, setRsvpStatus] = useState<UiRsvpStatus>("no");
  const [menCount, setMenCount] = useState(0);
  const [guestMenCount, setGuestMenCount] = useState(0);
  const [onlyIfMinyan, setOnlyIfMinyan] = useState(false);
  const [onlyIfSeferTorah, setOnlyIfSeferTorah] = useState(false);
  const [haveSeferTorah, setHaveSeferTorah] = useState(false);
  const [baalKoreh, setBaalKoreh] = useState(false);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [currentRsvpId, setCurrentRsvpId] = useState<string | null>(null);

  const [comingList, setComingList] = useState<AttendanceItem[]>([]);
  const [maybeList, setMaybeList] = useState<AttendanceItem[]>([]);
  const [totalMen, setTotalMen] = useState(0);

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

  const resetRsvpForm = useCallback(() => {
    setRsvpStatus("no");
    setMenCount(0);
    setGuestMenCount(0);
    setOnlyIfMinyan(false);
    setOnlyIfSeferTorah(false);
    setHaveSeferTorah(false);
    setBaalKoreh(false);
    setCurrentRsvpId(null);
  }, []);

  const hydrateRsvpFromRecord = useCallback(
    (record: RsvpRecord) => {
      let uiStatus: UiRsvpStatus = "no";
      if (record.status === "Coming") uiStatus = "yes";
      else if (record.status === "Maybe") uiStatus = "maybe";

      const flags = extractFlagsFromChecks(record.checks);

      setRsvpStatus(uiStatus);
      setMenCount(record.howManyMen ?? 0);
      setGuestMenCount(record.guests ?? 0);
      setOnlyIfMinyan(flags.onlyIfMinyan);
      setOnlyIfSeferTorah(flags.onlyIfSeferTorah);
      setHaveSeferTorah(flags.haveSeferTorah);
      setBaalKoreh(flags.baalKoreh);
      setCurrentRsvpId(record._id);
    },
    [],
  );

  const loadRsvpsForWeek = useCallback(
    async (week: string) => {
      const { from, to } = getWeekRangeForShabbos(week);
      const ownerId = getCurrentOwnerId();
      const unitId = getStoredUnitId();

      try {
        const [summary, unitRsvps] = await Promise.all([
          listRsvps(from, to),
          unitId ? listRsvpsByUnit(unitId, from, to) : Promise.resolve([]),
        ]);

        const mapToAttendanceItem = (record: RsvpRecord): AttendanceItem => {
          const owner = record.idOwnerHusbandUser;
          const unit = record.idUnit;
          const name = [owner?.husband_first, owner?.last_name].filter(Boolean).join(" ") || "Unknown";
          const tags = record.checks?.map((c) => c.check) ?? [];
          return {
            rsvpId: record._id,
            name,
            unit: unit?.unit_number ?? "",
            men: (record.howManyMen ?? 0) + (record.guests ?? 0),
            tags,
          };
        };

        setComingList(summary.comings.map(mapToAttendanceItem));
        setMaybeList(summary.maybes.map(mapToAttendanceItem));
        setTotalMen(summary.total ?? 0);

        if (ownerId && unitRsvps.length > 0) {
          const mine = unitRsvps.filter(
            (r) => r.idOwnerHusbandUser && r.idOwnerHusbandUser._id === ownerId,
          );
          if (mine.length > 0) {
            const latest = mine.reduce((acc, cur) => {
              const accDate = new Date(acc.updatedAt ?? acc.createdAt);
              const curDate = new Date(cur.updatedAt ?? cur.createdAt);
              return curDate > accDate ? cur : acc;
            });
            hydrateRsvpFromRecord(latest);
          } else {
            resetRsvpForm();
          }
        } else if (ownerId) {
          resetRsvpForm();
        }
      } catch (error) {
        // For now, silently fail and keep local state; errors can be surfaced with a toast if needed.
        console.error("Failed to load RSVPs", error);
      }
    },
    [hydrateRsvpFromRecord, resetRsvpForm],
  );

  useEffect(() => {
    if (!authChecked) return;
    loadUnit();
    loadRsvpsForWeek(shabbosWeek);
  }, [authChecked, loadUnit, loadRsvpsForWeek, shabbosWeek]);

  const handleSaveRsvp = useCallback(
    async () => {
      setSavingRsvp(true);
      try {
        const unitId = getStoredUnitId();
        const ownerId = getCurrentOwnerId();
        console.log("ownerId", ownerId, "unitId", unitId);
        if (!unitId || !ownerId) {
          throw new Error("Missing unit or owner information.");
        }

        const checks = buildChecksFromFlags({
          onlyIfMinyan,
          onlyIfSeferTorah,
          haveSeferTorah,
          baalKoreh,
        });

        const statusMap: Record<UiRsvpStatus, RsvpStatusApi> = {
          yes: "Coming",
          maybe: "Maybe",
          no: "Not Coming",
        };

        const status = statusMap[rsvpStatus];
        const dateIso = new Date(shabbosWeek + "T12:00:00").toISOString();

        if (currentRsvpId) {
          await updateRsvp(currentRsvpId, {
            status,
            howManyMen: menCount,
            guests: guestMenCount,
            checks,
            date: dateIso,
          });
        } else {
          const created = await createRsvp({
            status,
            howManyMen: menCount,
            guests: guestMenCount,
            checks,
            idOwnerHusbandUser: ownerId,
            idUnit: unitId,
            date: dateIso,
          });
          setCurrentRsvpId(created._id);
        }

        await loadRsvpsForWeek(shabbosWeek);
      } catch (error) {
        console.error("Failed to save RSVP", error);
      } finally {
        setSavingRsvp(false);
      }
    },
    [
      baalKoreh,
      currentRsvpId,
      guestMenCount,
      haveSeferTorah,
      menCount,
      onlyIfMinyan,
      onlyIfSeferTorah,
      rsvpStatus,
      shabbosWeek,
      loadRsvpsForWeek,
    ],
  );

  const handleDeleteRsvp = useCallback(
    async (rsvpId: string) => {
      try {
        await deleteRsvp(rsvpId);
        if (currentRsvpId === rsvpId) {
          resetRsvpForm();
        }
        await loadRsvpsForWeek(shabbosWeek);
      } catch (error) {
        console.error("Failed to delete RSVP", error);
      }
    },
    [currentRsvpId, loadRsvpsForWeek, resetRsvpForm, shabbosWeek],
  );

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isAdmin = hasAdminAccess(getStoredRole());

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
              comingList={comingList}
              maybeList={maybeList}
              totalMen={totalMen}
              isAdmin={isAdmin}
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
                comingList={comingList}
                maybeList={maybeList}
                totalMen={totalMen}
                isAdmin={isAdmin}
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
