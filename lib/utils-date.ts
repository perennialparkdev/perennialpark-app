const getShabbosForDate = (date: Date) => {
  const dayOfWeek = date.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSaturday));
  saturday.setHours(0, 0, 0, 0);
  return saturday;
};

/**
 * Returns the Saturday of the current week (or today if today is Saturday) as YYYY-MM-DD.
 */
export function getThisShabbos(): string {
  return getShabbosForDate(new Date()).toISOString().split("T")[0];
}

export function getNextShabbosTransition(now = new Date()): Date {
  const thisShabbos = getShabbosForDate(now);
  const nextShabbos = new Date(thisShabbos);
  nextShabbos.setDate(thisShabbos.getDate() + 7);
  return nextShabbos;
}

export function formatShabbosDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Given a Shabbos date (Saturday) as YYYY-MM-DD, returns the Sunday–Saturday range for that week. */
export function getWeekRangeForShabbos(dateStr: string): { from: string; to: string } {
  const saturday = new Date(dateStr + "T12:00:00");
  const to = saturday.toISOString().split("T")[0];
  const dayOfWeek = saturday.getDay();
  const daysSinceSunday = dayOfWeek; // 0 for Sunday ... 6 for Saturday
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() - daysSinceSunday);
  const from = sunday.toISOString().split("T")[0];
  return { from, to };
}

/** Returns the Monday of the given date's week (or today's week if no date) as YYYY-MM-DD. Week = Mon–Sun. */
export function getThisWeekMonday(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + daysToMonday);
  return monday.toISOString().split("T")[0];
}

/** Given Monday YYYY-MM-DD, returns Sunday of that week (Mon+6). */
export function getSundayOfWeek(mondayStr: string): string {
  const monday = new Date(mondayStr + "T12:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split("T")[0];
}

/** Format week range for display: "Mon 2 - Sun 8" or "Mon 2 Mar - Sun 8 Mar". Weekday first, then day, so locale does not flip the order. */
export function formatWeekRangeMonSun(mondayStr: string, withMonth = false): string {
  const locale = "en-US";
  const monday = new Date(mondayStr + "T12:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => {
    const w = d.toLocaleDateString(locale, { weekday: "short" });
    const day = d.toLocaleDateString(locale, { day: "numeric" });
    return withMonth
      ? `${w} ${day} ${d.toLocaleDateString(locale, { month: "short" })}`
      : `${w} ${day}`;
  };
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

/** Approximate Gregorian dates for Jewish holidays in the given year (for week label). */
export function getJewishHolidayForWeek(dateStr: string): string | null {
  const date = new Date(dateStr + "T12:00:00");
  const year = date.getFullYear();
  const holidays: { name: string; start: Date; end: Date }[] = [
    { name: "Rosh Hashanah", start: new Date(year, 8, 23), end: new Date(year, 8, 25) },
    { name: "Yom Kippur", start: new Date(year, 9, 2), end: new Date(year, 9, 3) },
    { name: "Sukkot", start: new Date(year, 9, 7), end: new Date(year, 9, 14) },
    { name: "Simchat Torah", start: new Date(year, 9, 15), end: new Date(year, 9, 16) },
    { name: "Passover", start: new Date(year, 3, 13), end: new Date(year, 3, 21) },
    { name: "Shavuot", start: new Date(year, 5, 2), end: new Date(year, 5, 4) },
  ];
  for (const holiday of holidays) {
    if (date >= holiday.start && date <= holiday.end) return holiday.name;
  }
  return null;
}
