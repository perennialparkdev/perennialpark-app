/**
 * UI segment definitions for Davening Times admin.
 * Maps segment keys to category + type for resolving idType from structure.
 * weekDay values match API seed (e.g. "Monday-thursday", "Friday", "Sunday").
 */

export interface SegmentDef {
  segmentKey: string;
  categoryName: string;
  typeName: string;
  weekDay: string | null;
}

export const MINYANIM_SEGMENTS: SegmentDef[] = [
  { segmentKey: "weekday-shachris", categoryName: "Minyanim", typeName: "Shachris", weekDay: "Monday-thursday" },
  { segmentKey: "weekday-mincha", categoryName: "Minyanim", typeName: "Mincha", weekDay: "Monday-thursday" },
  { segmentKey: "weekday-maariv", categoryName: "Minyanim", typeName: "Maariv", weekDay: "Monday-thursday" },
  { segmentKey: "friday-shachris", categoryName: "Minyanim", typeName: "Shachris", weekDay: "Friday" },
  { segmentKey: "sunday-shachris", categoryName: "Minyanim", typeName: "Shachris", weekDay: "Sunday" },
  { segmentKey: "sunday-mincha", categoryName: "Minyanim", typeName: "Mincha", weekDay: "Sunday" },
  { segmentKey: "sunday-maariv", categoryName: "Minyanim", typeName: "Maariv", weekDay: "Sunday" },
];

/** Shabbos minyanim (Kabolas Shabbos, Shachris, Mincha, Motzei Shabbos). Match by type name; weekDay may be "Shabbos" or null in API. */
export const SHABBOS_MINYANIM_SEGMENTS: SegmentDef[] = [
  { segmentKey: "shabbos-kabolas_shabbos", categoryName: "Shabbos", typeName: "Kabolas Shabbos", weekDay: null },
  { segmentKey: "shabbos-shachris", categoryName: "Shabbos", typeName: "Shachris", weekDay: null },
  { segmentKey: "shabbos-mincha", categoryName: "Shabbos", typeName: "Mincha", weekDay: null },
  { segmentKey: "shabbos-motzei_shabbos", categoryName: "Shabbos", typeName: "Motzei Shabbos", weekDay: null },
];

/** Single segment for Shabbos Mevorchim (time, location, notes). */
export const SHABBOS_MEVORCHIM_TYPE = {
  categoryName: "Shabbos",
  typeName: "Shabbos Mevorchim",
  weekDay: null as string | null,
};

export const PERIOD_WEEKLY = "Weekly";
