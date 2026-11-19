import { z } from "./schema";
import type { Account } from "./domain";
export const workspacePreferencesSchema = z
  .object({
    defaultAccountId: z.uuid().nullable().default(null),
    accountOrder: z
      .array(z.uuid())
      .max(100)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Account order contains duplicates",
      )
      .default([]),
  })
  .strict();
export type WorkspacePreferences = z.infer<typeof workspacePreferencesSchema>;
export const defaultWorkspacePreferences = () =>
  workspacePreferencesSchema.parse({});
export function orderedAccounts(
  accounts: Account[],
  preferences?: WorkspacePreferences,
) {
  const p = preferences || defaultWorkspacePreferences();
  const rank = new Map(p.accountOrder.map((id, index) => [id, index]));
  return [...accounts].sort((a, b) => {
    if (a.id === b.id) return 0;
    if (a.id === p.defaultAccountId) return -1;
    if (b.id === p.defaultAccountId) return 1;
    return (rank.get(a.id) ?? 1000) - (rank.get(b.id) ?? 1000);
  });
}
