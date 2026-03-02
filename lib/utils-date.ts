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
