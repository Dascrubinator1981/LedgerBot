// Local, deterministic label comparisons. No financial records leave the app.
export const normalizeLabel = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
const singular = (value: string) =>
  value
    .split(" ")
    .map((t) =>
      t.endsWith("ies")
        ? t.slice(0, -3) + "y"
        : t.endsWith("s") && !t.endsWith("ss")
          ? t.slice(0, -1)
          : t,
    )
    .join(" ");
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(
        Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)),
      );
    row = next;
  }
  return row[b.length];
}
export function similarLabels(input: string, existing: string[]) {
  const key = normalizeLabel(input).slice(0, 100);
  if (key.length < 3) return [];
  return [...new Set(existing)]
    .slice(0, 200)
    .filter((v) => {
      const other = normalizeLabel(v).slice(0, 100);
      return (
        other === key ||
        singular(other) === singular(key) ||
        (Math.max(key.length, other.length) >= 5 &&
          Math.abs(key.length - other.length) <= 2 &&
          distance(key, other) <=
            Math.floor(Math.max(key.length, other.length) * 0.2))
      );
    })
    .slice(0, 3);
}
export function repeatedPrefix(existing: string[]) {
  const groups = new Map<string, string[]>();
  for (const label of existing) {
    const tokens = normalizeLabel(label).split(" ");
    if (tokens.length < 2) continue;
    const list = groups.get(tokens[0]) || [];
    if (!list.includes(label)) list.push(label);
    groups.set(tokens[0], list);
  }
  return [...groups.values()].find((g) => g.length >= 3)?.slice(0, 4) || [];
}
