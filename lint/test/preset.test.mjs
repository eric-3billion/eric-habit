import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { ESLint } from "eslint";

import { createEslintPreset } from "../index.mjs";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");

const eslint = new ESLint({
  cwd: FIXTURES_DIR,
  overrideConfigFile: true,
  overrideConfig: createEslintPreset({ effectAllowedFiles: ["external-sync/**"] }),
});

/** 각 줄의 `expect: a, b` 주석을 { 줄번호: [룰 id] } 로 읽는다 */
function listExpectedRuleIds(source) {
  return source
    .split("\n")
    .map((line, index) => [index + 1, line.match(/expect: ([^*]+?)\s*\*\//)?.[1]])
    .filter(([, ids]) => ids !== undefined)
    .map(([line, ids]) => `${line}: ${ids.split(",").map((id) => id.trim()).sort().join(", ")}`);
}

function listReportedRuleIds(messages) {
  const idsByLine = Object.groupBy(messages, (message) => message.line);
  return Object.entries(idsByLine)
    .map(([line, lineMessages]) => `${line}: ${lineMessages.map((message) => message.ruleId).sort().join(", ")}`)
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b));
}

const FIXTURE_FILES = ["clean.tsx", "violations.tsx", "order-panel.test.tsx", "external-sync/use-viewport-width.ts"];

FIXTURE_FILES.forEach((file) => {
  test(file, async () => {
    const [result] = await eslint.lintFiles([path.join(FIXTURES_DIR, file)]);
    const fatal = result.messages.filter((message) => message.ruleId === null);
    assert.deepEqual(fatal, [], "파싱/설정 오류");
    assert.deepEqual(listReportedRuleIds(result.messages), listExpectedRuleIds(readFileSync(result.filePath, "utf8")));
  });
});
