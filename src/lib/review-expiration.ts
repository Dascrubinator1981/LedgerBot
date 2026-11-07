import { addDays, civilToday } from "./domain";
export type ExpirationChoice = "today" | "week" | "saturday" | "default";
// Resolve a local wall time without assuming a UTC offset. In a repeated hour,
// choose the later occurrence; if skipped, advance to the first valid minute.
export function localInstant(
  day: string,
  hour: number,
  minute: number,
  timezone: string,
) {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = (value: number) =>
    Object.fromEntries(
      format.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
    );
  const naive = Date.parse(
    `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
  );
  const offsets = new Set<number>();
  for (let i = -36; i <= 36; i += 6) {
    const n = naive + i * 3600000,
      p = parts(n);
    offsets.add(
      Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`) - n,
    );
  }
  for (let shift = 0; shift <= 180; shift++) {
    const target = naive + shift * 60000,
      iso = new Date(target).toISOString(),
      matches = [...offsets]
        .map((offset) => target - offset)
        .filter((value) => {
          const p = parts(value);
          return (
            `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` ===
            iso.slice(0, 16)
          );
        });
    if (matches.length) return Math.max(...matches);
  }
  throw new Error("Local expiration time could not be resolved");
}
export function reviewExpiration(
  choice: ExpirationChoice,
  timezone: string,
  reminderMinute = 30,
  now = Date.now(),
) {
  if (
    !Number.isInteger(reminderMinute) ||
    reminderMinute < 0 ||
    reminderMinute > 60
  )
    throw new Error("Reminder must be between 8 and 9 p.m.");
  let day = civilToday(timezone, new Date(now));
  if (choice === "saturday")
    day = addDays(day, 6 - new Date(`${day}T12:00:00Z`).getUTCDay());
  if (choice === "today" || choice === "saturday") {
    const next = addDays(day, 1);
    return {
      deadlineAt: localInstant(next, 0, 0, timezone),
      expiresAt: localInstant(next, 1, 0, timezone),
      remindAt: Math.max(
        now,
        localInstant(
          day,
          20 + Math.floor(reminderMinute / 60),
          reminderMinute % 60,
          timezone,
        ),
      ),
    };
  }
  const expiresAt = now + (choice === "week" ? 7 : 30) * 86400000;
  return {
    deadlineAt: expiresAt,
    expiresAt,
    remindAt: Math.max(
      now,
      localInstant(
        addDays(civilToday(timezone, new Date(expiresAt)), -1),
        20 + Math.floor(reminderMinute / 60),
        reminderMinute % 60,
        timezone,
      ),
    ),
  };
}
