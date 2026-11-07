# Minimatch audit finding — verified resolution

The owner's GitHub log identified GHSA-g3hv-75wg-m249 in minimatch 7.0.0–11.0.0. Its dependency chain belonged to TypeScript lint tooling, not balance/budget/bill calculation or payment processing. The reported eight moderate findings represented the affected package and dependent packages, not eight independent financial bugs. The report describes potential excessive processing from crafted glob patterns; it is not evidence that a customer record was accessed.

## Chosen fix

The stable `@typescript-eslint/typescript-estree` 8.72.1 package still declares minimatch `^10.2.2`. The official minimatch 11.0.1 release fixes the reported advisory, retains the CommonJS/ESM exports and the named `minimatch(path, pattern, { dot: true })` API used by this parser, and supports Node 24. Its matching internals were substantially rewritten; a major bump should not be assumed compatible everywhere.

We use npm's supported, **narrowly scoped override** only on `@typescript-eslint/typescript-estree → minimatch`, pinned to official **11.0.1**. This is outside that parent's declared semver range and is a project-validated security override, not a claim that the parent maintainer has updated its support declaration. Other callers remain on their existing compatible minimatch versions. No ESLint/Next downgrade, package rename, advisory exclusion or rule removal was used.

This respects the prohibition on overriding incompatible major APIs by verifying the actual API surface used here rather than assuming compatibility from an audit result. Do not copy this override blindly into unrelated software or broaden it globally.

## Compatibility evidence

- Before changing resolution, recorded the exact effective rule counts and cryptographic hashes of rule levels/options for a TSX feature, TypeScript engine file and JavaScript operator script. All three remain identical afterward.
- Real ESLint fixture checks still detect explicit TypeScript `any`, a conditional React hook, and an inaccessible image. The existing React/compiler, Next, accessibility and TypeScript configurations are unchanged.
- Resolved the matcher from the actual parser dependency location and verified the patched version, CommonJS named API, dot-file handling, ordinary file allow-lists and representative brace/extension matching.
- Exercised the actual TypeScript parser's project-service allow-list path with one permitted file and one rejected file. This checks its real matcher call rather than merely testing an unrelated direct dependency.
- Strict typecheck and repository lint passed. The expanded normal suite passed **103 tests across 14 files** at this checkpoint.
- Both `npm audit` and `npm audit --omit=dev` reported **zero vulnerabilities** after installation. These are package-catalog results, not independent security certification.

`tests/lint-coverage.test.ts` preserves this regression coverage. `tests/fixtures/lint-rule-baseline.json` contains the pre-change rule counts/hashes; it contains no financial data or credentials. Review intentional future lint-rule changes rather than updating the baseline only to get a pass.

The lockfile records the resolution and integrity metadata; `npm ci` reproduces it. When the parent officially supports the patched major, evaluate removing the override through the same audit, parser, rule-parity, build and browser checks. Do not use `npm audit fix --force` as a substitute. A future green audit does not waive hosted recovery, privacy, accessibility, permission or release-approval gates.
