/**
 * no-restricted-syntax 는 severity 가 룰 하나에 하나라서, 오탐 가능성이 있어 warn 으로 둘 셀렉터를 여기로 분리한다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "경고 수준의 셀렉터 목록 (no-restricted-syntax 의 warn 판)" },
    schema: [{ type: "array", items: { type: "object", properties: { selector: { type: "string" }, message: { type: "string" } }, required: ["selector", "message"], additionalProperties: false } }],
    messages: { discouraged: "{{message}}" },
  },
  create(context) {
    const entries = context.options[0] ?? [];
    return Object.fromEntries(
      entries.map(({ selector, message }) => [selector, (node) => context.report({ node, messageId: "discouraged", data: { message } })]),
    );
  },
};
