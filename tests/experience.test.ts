import { describe, it, expect } from "vitest";
import { reminderVisible, remindersSchema } from "../src/lib/reminders";
import { sectionFromUrl, sectionHref } from "../src/lib/navigation";
describe("resumable navigation and reminder preferences", () => {
  it("accepts only known sections and safely encodes draft links", () => {
    expect(
      sectionFromUrl(new URL("https://example.test/?section=budget")),
    ).toBe("Budget");
    expect(
      sectionFromUrl(
        new URL("https://example.test/?section=https://untrusted.test"),
      ),
    ).toBe("Dashboard");
    const url = new URL(
      sectionHref("Inbox", "id&section=settings"),
      "https://example.test",
    );
    expect(sectionFromUrl(url)).toBe("Inbox");
    expect(url.searchParams.get("proposal")).toBe("id&section=settings");
  });
  it("expires snoozes without coupling promotions or other setup items", () => {
    expect(reminderVisible(undefined, 100)).toBe(true);
    expect(reminderVisible({ status: "snoozed", until: 101 }, 100)).toBe(false);
    expect(reminderVisible({ status: "snoozed", until: 101 }, 101)).toBe(true);
    expect(reminderVisible({ status: "not-applicable" }, 101)).toBe(false);
    expect(reminderVisible({ status: "dismissed" }, 101)).toBe(false);
    expect(
      remindersSchema.safeParse({ promotions: { status: "dismissed" } })
        .success,
    ).toBe(false);
  });
});
