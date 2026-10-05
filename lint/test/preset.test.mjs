import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createOxlintConfig } from "../index.mjs";

const TEST_DIR = import.meta.dirname;
const SAMPLES_DIR = path.join(TEST_DIR, "samples");
const OXLINT_BIN = path.join(TEST_DIR, "..", "node_modules", ".bin", "oxlint");
const CONFIG_PATH = path.join(TEST_DIR, "oxlint.config.mjs");

/** oxlint 의 `eric(no-general-name)` · `typescript(x)` · `eslint(x)` 를 config 의 룰 이름으로 되돌린다 */
function toRuleId(code) {
  const [, plugin, rule] = code.match(/^([@\w/-]+)\((.+)\)$/);
  return plugin === "eslint" ? rule : `${plugin}/${rule}`;
}

function listDiagnostics(file) {
  const { stdout } = spawnSync(OXLINT_BIN, ["-c", CONFIG_PATH, "--format", "json", file], { encoding: "utf8" });
  return JSON.parse(stdout).diagnostics;
}

function listReportedRuleIds(file) {
  const diagnostics = listDiagnostics(file);
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

const SAMPLE_FILES = ["clean.tsx", "violations.tsx", "order-panel.test.tsx", "external-sync/use-viewport-width.ts", "api/order-api.ts", "filename-case/OrderPanel.ts", "order-list.test.tsx"];

SAMPLE_FILES.forEach((file) => {
  test(file, () => {
    const filePath = path.join(SAMPLES_DIR, file);
    assert.deepEqual(listReportedRuleIds(filePath), listExpectedRuleIds(readFileSync(filePath, "utf8")));
  });
});

// 등록하면 풀리는 것(미등록)과 개명밖에 없는 것(등록 불가)을 메시지로 가른다
test("function-verb-whitelist 메시지", () => {
  const messages = listDiagnostics(path.join(SAMPLES_DIR, "violations.tsx"))
    .filter((diagnostic) => toRuleId(diagnostic.code) === "eric/function-verb-whitelist")
    .map((diagnostic) => diagnostic.message);
  const findMessage = (name) => messages.find((message) => message.startsWith(`'${name}'`)) ?? null;
  assert.match(findMessage("resolveOrder"), /등록 불가 동사/);
  assert.match(findMessage("confirmOrder"), /domainVerbs 에 계약/);
});

test("domainVerbs 는 config 를 만들 때 검증한다", () => {
  const signOut = { verb: "signOut", contract: "세션을 끝내는 쓰기" };
  assert.doesNotThrow(() => createOxlintConfig({ domainVerbs: [signOut] }));
  assert.throws(() => createOxlintConfig({ domainVerbs: [{ ...signOut, verb: "processPayment" }] }), /'process' 는 등록 불가 동사/);
  assert.throws(() => createOxlintConfig({ domainVerbs: [{ ...signOut, verb: "resolve" }] }), /등록 불가 동사/);
  assert.throws(() => createOxlintConfig({ domainVerbs: [{ ...signOut, contract: " " }] }), /contract/);
  assert.throws(() => createOxlintConfig({ domainVerbs: [{ ...signOut, verb: "get" }] }), /공통 동사 표/);
});
