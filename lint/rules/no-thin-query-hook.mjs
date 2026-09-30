const QUERY_HOOK = /^useSuspenseQuer(y|ies)$/;
const CUSTOM_HOOK = /^use[A-Z]/;

/**
 * 쿼리만 감싼 커스텀 훅을 막는다 (habits/01 §3, 03 얕은 포장).
 * 몸통이 "쿼리 호출 → (구조분해) → 반환" 뿐인 훅만 대상이다. 다른 훅과 조합하거나 가공 로직이 있으면 로직을 공유하는 훅이라 통과한다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "쿼리만 감싼 커스텀 훅 금지 — 소비처가 queryOptions 팩토리를 직접 쓴다 (habits/01 §3)" },
    schema: [],
    messages: {
      thinQueryHook: "'{{name}}' 은 쿼리만 감싼다 — 하는 일이 없으면 소비처가 queryOptions 팩토리를 직접 쓴다. 그래야 useSuspenseQueries 로 묶을 수 있다 (habits/01 §3)",
    },
  },
  create(context) {
    const handleHook = (nameNode, fnNode) => {
      if (!CUSTOM_HOOK.test(nameNode.name)) return;
      const isThin = fnNode.body.type === "BlockStatement" ? isThinBlock(fnNode.body.body) : isQueryResult(fnNode.body, new Set());
      if (isThin) context.report({ node: nameNode, messageId: "thinQueryHook", data: { name: nameNode.name } });
    };

    return {
      FunctionDeclaration(node) {
        if (node.id) handleHook(node.id, node);
      },
      VariableDeclarator(node) {
        const isFunctionInit = node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression";
        if (isFunctionInit && node.id.type === "Identifier") handleHook(node.id, node.init);
      },
    };
  },
};

// 허용되는 모양: `const x = useSuspenseQuery(…)` / `const { data } = …` 한 줄 + `return x` 한 줄, 또는 `return useSuspenseQuery(…)` 한 줄
function isThinBlock(statements) {
  const [first, second, ...rest] = statements;
  if (rest.length > 0 || !first) return false;
  if (!second) return first.type === "ReturnStatement" && isQueryResult(first.argument, new Set());
  if (first.type !== "VariableDeclaration" || first.declarations.length !== 1) return false;
  const [declarator] = first.declarations;
  if (!isQueryCall(declarator.init)) return false;
  return second.type === "ReturnStatement" && isQueryResult(second.argument, listBoundNames(declarator.id));
}

function isQueryCall(node) {
  return node?.type === "CallExpression" && node.callee.type === "Identifier" && QUERY_HOOK.test(node.callee.name);
}

// 쿼리 호출 그 자체, `.data` 접근, 또는 쿼리 결과를 담은 이름
function isQueryResult(node, boundNames) {
  if (!node) return false;
  if (isQueryCall(node)) return true;
  if (node.type === "Identifier") return boundNames.has(node.name);
  if (node.type === "MemberExpression" && !node.computed) return isQueryResult(node.object, boundNames);
  return false;
}

function listBoundNames(pattern) {
  if (pattern.type === "Identifier") return new Set([pattern.name]);
  if (pattern.type === "ObjectPattern") {
    return new Set(pattern.properties.flatMap((property) => (property.type === "Property" && property.value.type === "Identifier" ? [property.value.name] : [])));
  }
  return new Set();
}
