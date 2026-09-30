/**
 * esquery 셀렉터 목록을 받아 매칭 노드를 보고한다 — oxlint 에는 no-restricted-syntax 가 없어서 직접 둔다.
 * 룰 하나에 심각도가 하나라 plugin.mjs 에서 restricted-syntax(error)·discouraged-syntax(warn) 두 이름으로 등록한다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "셀렉터에 매칭되는 문법을 금지한다 (no-restricted-syntax 대체)" },
    schema: [{ type: "array", items: { type: "object", properties: { selector: { type: "string" }, message: { type: "string" } }, required: ["selector", "message"], additionalProperties: false } }],
    messages: { matched: "{{message}}" },
  },
  create(context) {
    const entries = context.options[0] ?? [];
    return Object.fromEntries(
      entries.map(({ selector, message }) => [selector, (node) => context.report({ node, messageId: "matched", data: { message } })]),
    );
  },
};
