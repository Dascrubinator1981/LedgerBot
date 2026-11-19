import ts from "typescript";
import { readdir, readFile, writeFile } from "node:fs/promises";
const files = [];
async function walk(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = `${path}/${item.name}`;
    if (item.isDirectory()) await walk(child);
    else if (item.name.endsWith(".tsx")) files.push(child);
  }
}
await walk("src/app");
const rows = [];
for (const file of files) {
  const source = ts.createSourceFile(
    file,
    await readFile(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (
        [
          "button",
          "input",
          "select",
          "textarea",
          "form",
          "Input",
          "AccountSelect",
          "CategorySelect",
          "LabelEntry",
        ].includes(tag)
      ) {
        const attributes = node.attributes.properties
          .map((a) => a.getText(source))
          .join(" ");
        const label =
          attributes.match(/(?:label|aria-label|name)="([^"]+)"/)?.[1] ||
          (ts.isJsxElement(node.parent)
            ? node.parent.children
                .filter(ts.isJsxText)
                .map((c) => c.text.trim())
                .filter(Boolean)
                .join(" ")
            : "Dynamic label / inspect source");
        rows.push({
          file,
          line:
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1,
          tag,
          label: label.slice(0, 130),
          financial: attributes.includes("data-financial"),
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const text = [
  "# Interaction inventory",
  "",
  "This inventories controls from source; it does not claim every control has passed every browser/device scenario. The current automated test evidence and remaining gaps are in TODAY_UPDATE_REPORT.md and REQUIREMENTS_AUDIT.md. Disabled integrations are not working tools. Physical device/assistive-technology review remains outstanding.",
  "",
  "Regenerate with `node scripts/interaction-inventory.mjs`.",
  "",
  "| Source | Control | Label/name | QA scope |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| ${r.file}:${r.line} | ${r.tag} | ${r.label.replaceAll("|", "\\|")} | ${r.financial ? "Financial draft/review form; approval/auth/failure tests required" : "Review feature-level E2E evidence; physical QA pending"} |`,
  ),
];
await writeFile("docs/INTERACTION_INVENTORY.md", text.join("\n") + "\n");
console.log(`Inventoried ${rows.length} controls without reading user data.`);
