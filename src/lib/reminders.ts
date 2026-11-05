import { z } from "./schema";
export const reminderSchema = z.object({
  status: z.enum(["active", "dismissed", "not-applicable", "snoozed"]),
  until: z.number().int().nonnegative().max(8640000000000000).optional(),
});
export const remindersSchema = z
  .object({
    accounts: reminderSchema.optional(),
    budget: reminderSchema.optional(),
    forecast: reminderSchema.optional(),
  })
  .strict();
export type Reminders = z.infer<typeof remindersSchema>;
export function reminderVisible(
  value: z.infer<typeof reminderSchema> | undefined,
  now: number,
) {
  return (
    !value ||
    value.status === "active" ||
    (value.status === "snoozed" && (value.until || 0) <= now)
  );
}
