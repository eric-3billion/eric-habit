const ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/", "%"]);

export default {
  meta: {
    type: "problem",
    docs: { description: "이름 붙은 센티넬 상수를 산술 항으로 쓰지 않는다 (habits/00)" },
    schema: [{ type: "object", properties: { sentinels: { type: "array", items: { type: "number" } } }, additionalProperties: false }],
    messages: {
      arithmetic: "센티넬 '{{name}}' 을 산술에 섞었다 — 이름이 거짓이 된다. 센티넬이 필요 없는 표현(개수 등)으로 바꾼다 (habits/00)",
    },
  },
  create(context) {
    const sentinels = context.options[0]?.sentinels ?? [-1];

    return {
      "VariableDeclaration[kind='const'] > VariableDeclarator"(node) {
        if (node.id.type !== "Identifier" || !sentinels.includes(findNumericLiteralValue(node.init))) return;
        const [variable] = context.sourceCode.getDeclaredVariables(node);
        const arithmeticRefs = variable.references.filter((ref) => {
          const parent = ref.identifier.parent;
          return parent.type === "BinaryExpression" && ARITHMETIC_OPERATORS.has(parent.operator);
        });
        arithmeticRefs.forEach((ref) => context.report({ node: ref.identifier, messageId: "arithmetic", data: { name: node.id.name } }));
      },
    };
  },
};

function findNumericLiteralValue(node) {
  if (node?.type === "Literal" && typeof node.value === "number") return node.value;
  if (node?.type === "UnaryExpression" && node.operator === "-" && node.argument.type === "Literal" && typeof node.argument.value === "number") {
    return -node.argument.value;
  }
  return undefined;
}
