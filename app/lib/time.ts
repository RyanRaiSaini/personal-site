// Clock helpers: what time it is in another city, without any library.

export type ZonedTime = {
  year: number;
  month: number; // 1 to 12
  day: number;
  hour: number; // 0 to 23
  minute: number;
  second: number;
  weekday: string; // "Thu"
};

export function zonedTime(date: Date, timeZone: string): ZonedTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

// "21:42"
export function clockText(date: Date, timeZone: string): string {
  const t = zonedTime(date, timeZone);
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

// "Thu 19 Nov"
export function dateText(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }).format(date);
}

// The real moment at which a city's clocks read hour:minute today.
// Used by the ?time=HH:MM test switch.
export function instantAtLocalTime(hour: number, minute: number, timeZone: string, reference = new Date()): Date {
  const local = zonedTime(reference, timeZone);
  // Pretend the wall-clock reading is UTC, then correct by the zone's
  // offset at that moment
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, hour, minute, 0);
  const seen = zonedTime(new Date(asUtc), timeZone);
  const seenUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
  return new Date(asUtc - (seenUtc - asUtc));
}

// Parses "22:30" or "2230" into hours and minutes
export function parseClock(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):?(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

// "Now", or the moment the ?time=HH:MM test switch asks for (read as
// a clock time in the given city)
export function currentInstant(timeOverride: string | null, timeZone: string): Date {
  if (timeOverride) {
    const clock = parseClock(timeOverride);
    if (clock) return instantAtLocalTime(clock.hour, clock.minute, timeZone);
  }
  return new Date();
}
