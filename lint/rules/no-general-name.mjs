const GENERAL_NOUNS = new Set(["data", "item", "value", "state", "info", "result"]);
const GENERAL_SUFFIX = /(Info|Data)$/;

/**
 * habits/00 「좁은 명사」 — 변수와 "선언된 함수"의 파라미터만 본다.
 * 인라인 콜백 인자(`cell: info => …`, `setState(state => …)`)는 라이브러리 어휘이고 스코프가 한 줄이라 제외한다.
 * 객체 키는 외부 계약이라 대상이 아니다. 타입 이름(interface·type·class·enum)은 접미사 *Info·*Data 만 본다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "제너럴한 명사(data·item·value·state·info·result, *Info·*Data)로 변수·파라미터를 짓지 않는다 (habits/00)" },
    schema: [],
    messages: {
      generalName: "'{{name}}' 은 무엇이든 가리킬 수 있어 아무것도 가리키지 않는다 — 도메인의 무엇인지까지 좁힌다 (habits/00)",
    },
  },
  create(context) {
    const handleBinding = (node) => {
      if (!node) return;
      switch (node.type) {
        case "Identifier":
          if (GENERAL_NOUNS.has(node.name) || GENERAL_SUFFIX.test(node.name)) {
            context.report({ node, messageId: "generalName", data: { name: node.name } });
          }
          return;
        case "ObjectPattern":
          node.properties.forEach((property) => handleBinding(property.type === "RestElement" ? property.argument : property.value));
          return;
        case "ArrayPattern":
          node.elements.forEach(handleBinding);
          return;
        case "AssignmentPattern":
          handleBinding(node.left);
          return;
        case "RestElement":
          handleBinding(node.argument);
          return;
        default:
          return;
      }
    };
    const handleDeclaredFunction = (fnNode) => fnNode.params.forEach(handleBinding);
    const handleTypeName = (node) => {
      if (node.id && GENERAL_SUFFIX.test(node.id.name)) context.report({ node: node.id, messageId: "generalName", data: { name: node.id.name } });
    };
    const isFunction = (node) => node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";

    return {
      VariableDeclarator(node) {
        handleBinding(node.id);
        if (isFunction(node.init)) handleDeclaredFunction(node.init);
      },
      FunctionDeclaration: handleDeclaredFunction,
      TSInterfaceDeclaration: handleTypeName,
      TSTypeAliasDeclaration: handleTypeName,
      TSEnumDeclaration: handleTypeName,
      ClassDeclaration: handleTypeName,
    };
  },
};
