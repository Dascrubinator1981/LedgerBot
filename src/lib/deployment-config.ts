import { draftConfiguration } from "./draft-crypto";
import { PublicError } from "./errors";
export function assertProductionConfiguration(
  environment: Record<string, string | undefined> = process.env,
) {
  if (environment.NODE_ENV !== "production") return;
  try {
    if (
      environment.LEDGERBOT_BACKEND !== "postgres" ||
      !environment.LEDGERBOT_POSTGRES_URL ||
      !environment.LEDGERBOT_SUPABASE_ANON_KEY ||
      environment.LEDGERBOT_COOKIE_SECURE === "false"
    )
      throw new Error();
    for (const name of ["LEDGERBOT_APP_ORIGIN", "LEDGERBOT_SUPABASE_URL"]) {
      const value = new URL(environment[name] || "");
      if (
        value.protocol !== "https:" ||
        value.username ||
        value.password ||
        value.search ||
        value.hash ||
        value.pathname !== "/"
      )
        throw new Error();
    }
    const database = new URL(environment.LEDGERBOT_POSTGRES_URL);
    if (!["postgres:", "postgresql:"].includes(database.protocol))
      throw new Error();
    if (draftConfiguration(environment).version !== 2) throw new Error();
  } catch {
    throw new PublicError(
      "Secure production identity, database and versioned encryption must be configured",
      503,
    );
  }
}
