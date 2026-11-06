import { it, expect } from "vitest";
import { ESLint } from "eslint";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import baseline from "./fixtures/lint-rule-baseline.json";
import parser from "@typescript-eslint/parser";
const require = createRequire(import.meta.url);
it("preserves the exact pre-upgrade lint rule levels and options for TSX, TS and scripts", async () => {
  const eslint = new ESLint();
  for (const [file, expected] of Object.entries(baseline)) {
    const config = await eslint.calculateConfigForFile(file);
    const rules = config.rules as Record<string, unknown>;
    expect(Object.keys(rules)).toHaveLength(expected.count);
    const digest = createHash("sha256")
      .update(
        JSON.stringify(
          Object.fromEntries(
            Object.entries(rules).sort(([a], [b]) =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
          ),
        ),
      )
      .digest("hex");
    expect(digest).toBe(expected.sha256);
  }
}, 30_000);
it("still rejects TypeScript any, conditional hooks and inaccessible images", async () => {
  const eslint = new ESLint();
  const fixtures = [
    {
      text: "export const unsafe: any = 1;",
      file: "src/synthetic-check.ts",
      rule: "@typescript-eslint/no-explicit-any",
    },
    {
      text: 'import {useState} from "react"; export default function Bad({ready}:{ready:boolean}){if(ready){useState(0);}return null;}',
      file: "src/synthetic-check.tsx",
      rule: "react-hooks/rules-of-hooks",
    },
    {
      text: 'export default function Bad(){return <img src="/synthetic.png"/>;}',
      file: "src/synthetic-check.tsx",
      rule: "jsx-a11y/alt-text",
    },
  ];
  for (const fixture of fixtures) {
    const result = await eslint.lintText(fixture.text, {
      filePath: fixture.file,
    });
    expect(result.flatMap((r) => r.messages.map((m) => m.ruleId))).toContain(
      fixture.rule,
    );
    expect(result.some((r) => r.errorCount > 0 || r.warningCount > 0)).toBe(
      true,
    );
  }
});
it("uses the official patched matcher on only the parser edge and preserves its required matching API", () => {
  const scoped = createRequire(
    require.resolve("@typescript-eslint/typescript-estree"),
  );
  expect(scoped("minimatch/package.json").version).toBe("11.0.1");
  const match = scoped("minimatch").minimatch as (
    file: string,
    pattern: string,
    options: { dot: boolean },
  ) => boolean;
  expect(
    match("scripts/check-secrets.mjs", "scripts/*.mjs", { dot: true }),
  ).toBe(true);
  expect(match("scripts/.hidden.mjs", "scripts/*.mjs", { dot: true })).toBe(
    true,
  );
  expect(match("src/lib/domain.ts", "scripts/*.mjs", { dot: true })).toBe(
    false,
  );
  expect(
    match("src/app/page.tsx", "src/{app,lib}/*.{ts,tsx}", { dot: true }),
  ).toBe(true);
});
it("exercises the actual parser project-service allow-list using the patched dependency", () => {
  const options = {
    tsconfigRootDir: process.cwd(),
    sourceType: "module" as const,
    projectService: {
      allowDefaultProject: ["scripts/check-secrets.mjs"],
      defaultProject: "tsconfig.json",
    },
  };
  const result = parser.parseForESLint("export const synthetic = 1;", {
    ...options,
    filePath: `${process.cwd()}/scripts/check-secrets.mjs`,
  });
  expect(result.services.program).toBeDefined();
  expect(() =>
    parser.parseForESLint("export const synthetic = 1;", {
      ...options,
      filePath: `${process.cwd()}/scripts/start.mjs`,
    }),
  ).toThrow();
}, 30_000);
