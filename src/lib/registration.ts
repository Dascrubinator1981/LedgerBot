// Public signup requires a later release decision; production candidates are closed beta.
export function signupsDisabled(
  environment: Record<string, string | undefined> = process.env,
) {
  return (
    environment.NODE_ENV === "production" ||
    environment.LEDGERBOT_SIGNUPS_DISABLED === "true"
  );
}
