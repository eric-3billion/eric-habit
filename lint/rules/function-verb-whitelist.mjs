const PASCAL_CASE = /^[A-Z]/;
const AND_JOINED = /And[A-Z]/;

const toLeadingVerbPattern = (verbs) => new RegExp(`^(${verbs.join("|")})([A-Z]|$)`);

/**
 * habits/00 동사 표 화이트리스트(+ config 의 domainVerbs). 함수를 "선언하는 자리"만 본다 —
 * 구조분해(`const { refetch } = …`)나 호출 결과(`const navigate = useNavigate()`)는 이름을 선언처가 정하므로 대상이 아니다.
 * 표에 없는 동사는 등록 불가 동사인지에 따라 메시지를 가른다 — 등록하면 풀리는 것과 개명밖에 없는 것.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "함수 이름의 동사는 habits/00 동사 표나 config 의 domainVerbs 에 있는 것만 쓴다" },
    schema: [{
      type: "object",
      properties: {
        verbs: { type: "array", items: { type: "string" } },
        bannedVerbs: { type: "array", items: { type: "string" } },
        exemptNames: { type: "array", items: { type: "string" } },
        andJoinedTerms: { type: "array", items: { type: "string" } },
      },
      required: ["verbs", "bannedVerbs"],
      additionalProperties: false,
    }],
    messages: {
      verbNotListed: "'{{name}}' — 동사가 habits/00 동사 표에 없다. 표의 동사로 개명한다. 표의 동사로 바꾸면 뜻이 뭉개지는 인앱 도메인 동작이면 config 의 domainVerbs 에 계약과 함께 등록한다",
      verbBanned: "'{{name}}' — '{{verb}}' 는 등록 불가 동사다(habits/00 「등록 불가 동사」). domainVerbs 로도 열 수 없다 — 표의 동사로 개명하거나 쪼갠다",
      andJoined: "'{{name}}' — 이름에 And 가 붙었다 = 한 함수가 두 일을 한다. 쪼개고 호출부가 조합한다. And 가 든 도메인 용어면 andJoinedTerms 에 올린다 (habits/00)",
    },
  },
  create(context) {
    const { verbs, bannedVerbs, exemptNames = [], andJoinedTerms = [] } = context.options[0];
    const listedVerb = toLeadingVerbPattern(verbs);
    const bannedVerb = toLeadingVerbPattern(bannedVerbs);
    // And 뒤가 동사인지는 동사 표로 가릴 수 없다(표 밖의 동사가 끝없다). 그래서 And 는 모두 막고, And 가 든 도메인 용어만 이름에서 지운 뒤 검사한다.
    const hasAndJoined = (name) => AND_JOINED.test(andJoinedTerms.reduce((rest, term) => rest.replaceAll(term, ""), name));

    const handleFunctionName = (nameNode) => {
      const { name } = nameNode;
      if (PASCAL_CASE.test(name) || exemptNames.includes(name)) return;
      if (hasAndJoined(name)) {
        context.report({ node: nameNode, messageId: "andJoined", data: { name } });
        return;
      }
      if (listedVerb.test(name)) return;
      const banned = name.match(bannedVerb);
      if (banned !== null) {
        context.report({ node: nameNode, messageId: "verbBanned", data: { name, verb: banned[1] } });
        return;
      }
      context.report({ node: nameNode, messageId: "verbNotListed", data: { name } });
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
