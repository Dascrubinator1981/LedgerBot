export const sections = [
  "Dashboard",
  "Accounts",
  "Ledger",
  "Budget",
  "Forecaster",
  "Inbox",
  "Settings",
] as const;
export type Section = (typeof sections)[number];
export function sectionFromUrl(url: URL): Section {
  const key = url.searchParams.get("section")?.toLowerCase();
  return sections.find((s) => s.toLowerCase() === key) || "Dashboard";
}
export function sectionHref(section: Section, proposalId?: string) {
  const query = new URLSearchParams({ section: section.toLowerCase() });
  if (proposalId) query.set("proposal", proposalId);
  return `/?${query}`;
}
