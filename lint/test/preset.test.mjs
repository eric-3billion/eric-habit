import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const TEST_DIR = import.meta.dirname;
const SAMPLES_DIR = path.join(TEST_DIR, "samples");
const OXLINT_BIN = path.join(TEST_DIR, "..", "node_modules", ".bin", "oxlint");
const CONFIG_PATH = path.join(TEST_DIR, "oxlint.config.mjs");

/** oxlint 의 `eric(no-general-name)` · `typescript(x)` · `eslint(x)` 를 config 의 룰 이름으로 되돌린다 */
function toRuleId(code) {
  const [, plugin, rule] = code.match(/^([@\w/-]+)\((.+)\)$/);
  return plugin === "eslint" ? rule : `${plugin}/${rule}`;
}

function listReportedRuleIds(file) {
  const { stdout } = spawnSync(OXLINT_BIN, ["-c", CONFIG_PATH, "--format", "json", file], { encoding: "utf8" });
  const { diagnostics } = JSON.parse(stdout);
  const idsByLine = Object.groupBy(diagnostics, (diagnostic) => diagnostic.labels[0].span.line);
  return Object.entries(idsByLine)
    .map(([line, lineDiagnostics]) => `${line}: ${lineDiagnostics.map((diagnostic) => toRuleId(diagnostic.code)).sort().join(", ")}`)
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
}

/** 각 줄의 `expect: a, b` 주석을 { 줄번호: [룰 id] } 로 읽는다 */
function listExpectedRuleIds(source) {
  return source
    .split("\n")
    .map((line, index) => [index + 1, line.match(/expect: ([^*]+?)\s*\*\//)?.[1]])
    .filter(([, ids]) => ids !== undefined)
    .map(([line, ids]) => `${line}: ${ids.split(",").map((id) => id.trim()).sort().join(", ")}`);
}

const SAMPLE_FILES = ["clean.tsx", "violations.tsx", "order-panel.test.tsx", "external-sync/use-viewport-width.ts", "server-command/order-api.ts", "filename-case/OrderPanel.ts", "order-list.test.tsx", "import-cycle/cycle-a.ts"];

SAMPLE_FILES.forEach((file) => {
  test(file, () => {
    const filePath = path.join(SAMPLES_DIR, file);
    assert.deepEqual(listReportedRuleIds(filePath), listExpectedRuleIds(readFileSync(filePath, "utf8")));
  });
});

test("typeAware: false 면 타입 정보를 읽는 룰과 옵션을 뺀다", async () => {
  const { createOxlintConfig } = await import("../index.mjs");
  const typeAwareRuleIds = ["typescript/strict-boolean-expressions", "typescript/no-unnecessary-condition", "typescript/switch-exhaustiveness-check", "typescript/no-floating-promises", "typescript/no-misused-promises", "typescript/consistent-return", "typescript/prefer-nullish-coalescing", "typescript/use-unknown-in-catch-callback-variable", "typescript/prefer-optional-chain"];
  const syntaxOnly = createOxlintConfig({ typeAware: false });
  assert.equal(syntaxOnly.options.typeAware, false);
  assert.deepEqual(typeAwareRuleIds.filter((ruleId) => ruleId in syntaxOnly.rules), []);
  assert.deepEqual(typeAwareRuleIds.filter((ruleId) => !(ruleId in createOxlintConfig().rules)), []);
});
