const PASCAL_CASE = /^[A-Z]/;
const AND_JOINED = /And[A-Z]/;

/**
 * habits/00 동사 화이트리스트. 함수를 "선언하는 자리"만 본다 —
 * 구조분해(`const { refetch } = …`)나 호출 결과(`const navigate = useNavigate()`)는 이름을 선언처가 정하므로 대상이 아니다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "함수 이름의 동사는 habits/00 동사 표에 있는 것만 쓴다" },
    schema: [{
      type: "object",
      properties: {
        verbs: { type: "array", items: { type: "string" } },
        exemptNames: { type: "array", items: { type: "string" } },
        andJoinedTerms: { type: "array", items: { type: "string" } },
      },
      required: ["verbs"],
      additionalProperties: false,
    }],
    messages: {
      verbNotListed: "'{{name}}' — 동사가 habits/00 동사 표에 없다. 표의 동사로 개명하거나, 새 동사면 계약과 함께 표에 먼저 올린다",
      andJoined: "'{{name}}' — 이름에 And 가 붙었다 = 한 함수가 두 일을 한다. 쪼개고 호출부가 조합한다. And 가 든 도메인 용어면 andJoinedTerms 에 올린다 (habits/00)",
    },
  },
  create(context) {
    const { verbs, exemptNames = [], andJoinedTerms = [] } = context.options[0];
    const listedVerb = new RegExp(`^(${verbs.join("|")})[A-Z]`);
    // And 뒤가 동사인지는 동사 표로 가릴 수 없다(표 밖의 동사가 끝없다). 그래서 And 는 모두 막고, And 가 든 도메인 용어만 이름에서 지운 뒤 검사한다.
    const hasAndJoined = (name) => AND_JOINED.test(andJoinedTerms.reduce((rest, term) => rest.replaceAll(term, ""), name));

    const handleFunctionName = (nameNode) => {
      const { name } = nameNode;
      if (PASCAL_CASE.test(name) || exemptNames.includes(name)) return;
      if (hasAndJoined(name)) {
        context.report({ node: nameNode, messageId: "andJoined", data: { name } });
        return;
      }
      if (!listedVerb.test(name)) context.report({ node: nameNode, messageId: "verbNotListed", data: { name } });
    };

    return {
      FunctionDeclaration(node) {
        if (node.id) handleFunctionName(node.id);
      },
      VariableDeclarator(node) {
        const isFunctionInit = node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression";
        if (isFunctionInit && node.id.type === "Identifier") handleFunctionName(node.id);
      },
    };
  },
};
