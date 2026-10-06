import { readFileSync } from "node:fs";

/**
 * habits/00 의 동사 표를 SSOT 로 읽는다 — 동사 목록을 코드에 복제하지 않는다.
 * 이 프리셋이 habits/ 와 같은 레포에 있어야 한다(`file:` 의존성은 심볼릭 링크가 실제 경로로 풀려 그대로 동작한다).
 * 표를 못 찾거나 비면 lint 가 조용히 다 통과시키지 않도록 config 를 만드는 시점에 throw 한다.
 */
const INTENT_HABIT_URL = new URL("../habits/00-intent.md", import.meta.url);

// 표 헤더는 칸 단위로 비교한다. 소비처 저장소의 포매터가 칸 너비를 공백으로 맞춰도 찾을 수 있어야 한다
const FUNCTION_VERB_TABLE_HEADER = ["동사", "이름만 보고 예측되는 것"];
const BANNED_VERB_TABLE_HEADER = ["동사", "왜 · 대신"];

export function listFunctionVerbs() {
  return listTableVerbs(FUNCTION_VERB_TABLE_HEADER);
}

export function listBannedVerbs() {
  return listTableVerbs(BANNED_VERB_TABLE_HEADER);
}

/** 헤더로 표를 찾아, 각 행 첫 열의 `` `verb*` `` 를 모은다. `create*` 처럼 두 행에 걸친 동사는 한 번만 센다 */
function listTableVerbs(header) {
  const lines = readFileSync(INTENT_HABIT_URL, "utf8").split("\n");
  const headerIndex = lines.findIndex((line) => toCells(line).join("|") === header.join("|"));
  if (headerIndex === -1) throw new Error(`habits/00-intent.md 에서 표 "${header.join(" | ")}" 를 찾지 못했다`);

  const rows = lines.slice(headerIndex + 2);
  const tableEndIndex = rows.findIndex((line) => !line.startsWith("|"));
  const verbs = rows
    .slice(0, tableEndIndex === -1 ? rows.length : tableEndIndex)
    .flatMap((row) => [...row.split("|")[1].matchAll(/`(\w+)\*`/g)].map((match) => match[1]));
  if (verbs.length === 0) throw new Error(`habits/00-intent.md 의 표 "${header.join(" | ")}" 에서 동사를 하나도 읽지 못했다`);
  return [...new Set(verbs)];
}

/** `| a | b |` 를 ["a", "b"] 로. 표 행이 아니면 빈 배열 */
function toCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  return trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
}
