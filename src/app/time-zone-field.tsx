"use client";
import { useId, useRef } from "react";
const common = [
  "Etc/UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];
export function TimeZoneField({ value }: { value: string }) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null);
  return (
    <div className="field">
      <label htmlFor={id}>Your time zone</label>
      <input
        id={id}
        ref={input}
        name="timezone"
        defaultValue={value}
        list={`${id}-options`}
        aria-describedby={`${id}-help`}
        required
      />
      <datalist id={`${id}-options`}>
        {common.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={() => {
          if (input.current)
            input.current.value =
              Intl.DateTimeFormat().resolvedOptions().timeZone;
        }}
      >
        Use this device’s time zone
      </button>
      <small id={`${id}-help`}>
        Choose a city/region such as America/Denver, or use this device. Then
        Save preferences. This controls dates and reminders; existing
        saved-review deadlines keep their original time zone.
      </small>
    </div>
  );
}
