const SUSPENSE_QUERY_HOOK = /^useSuspenseQuer(y|ies)$/;
const NON_RUNTIME_KEYS = new Set(["parent", "typeAnnotation", "typeArguments", "typeParameters", "returnType"]);

/**
 * 같은 블록에서 바로 앞 suspense 쿼리 결과를 쓰지 않는 useSuspenseQuery 호출을 워터폴로 보고한다 (habits/01 §3).
 * suspense 쿼리는 바로 앞 쿼리가 끝나야 시작하므로, 더 앞의 쿼리만 쓰는 형제 쿼리(A → B, A → C)도 워터폴이다.
 * 이름마다 그 값을 만든 쿼리의 순번을 기록하고, 파생 선언(`const qcCriteria = getQcCriteria(test)`)은 참조한 이름 중 가장 늦은 순번을 물려받는다.
 * 이름만 비교하고 스코프는 보지 않는다. 안쪽 함수가 같은 이름을 다시 선언하면 의존으로 잘못 보고 놓친다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "바로 앞 쿼리 결과를 쓰지 않는 useSuspenseQuery 연속 호출(워터폴) — useSuspenseQueries 로 묶는다 (habits/01 §3)" },
    schema: [],
    messages: {
      waterfall: "바로 앞 suspense 쿼리 결과를 쓰지 않는 useSuspenseQuery 연속 호출은 워터폴이다 — 독립 조달이면 useSuspenseQueries 로 묶는다 (habits/01 §3)",
    },
  },
  create(context) {
    // 쿼리 호출 하나를 지난다. 바로 앞 쿼리 결과를 쓰지 않는 useSuspenseQuery 면 보고하고 순번을 하나 올린다
    const passQueryCall = (queryCount, call, queryOrdinalByName) => {
      const usesPrecedingQuery = findLatestQueryOrdinal(call.arguments, queryOrdinalByName) === queryCount;
      if (queryCount > 0 && !usesPrecedingQuery && call.callee.name === "useSuspenseQuery") context.report({ node: call, messageId: "waterfall" });
      return queryCount + 1;
    };

    // 한 문장에 declarator 가 여럿이거나 한 식에 쿼리가 여럿이어도 앞 호출이 suspend 하면 뒤 호출은 시작하지 않으므로, 호출 하나를 한 단계로 센다
    const passDeclarator = ({ queryCount, queryOrdinalByName }, declarator) => {
      const declaredNames = listPatternNames(declarator.id);
      const queryCalls = listSuspenseQueryCalls(declarator.init);
      if (queryCalls.length === 0) {
        const derivedOrdinal = findLatestQueryOrdinal([declarator.init], queryOrdinalByName);
        if (derivedOrdinal === null) return { queryCount, queryOrdinalByName };
        return { queryCount, queryOrdinalByName: new Map([...queryOrdinalByName, ...declaredNames.map((name) => [name, derivedOrdinal])]) };
      }
      const nextQueryCount = queryCalls.reduce((count, call) => passQueryCall(count, call, queryOrdinalByName), queryCount);
      return { queryCount: nextQueryCount, queryOrdinalByName: new Map([...queryOrdinalByName, ...declaredNames.map((name) => [name, nextQueryCount])]) };
    };

    // queryCount 는 지금까지 지난 suspense 쿼리 호출 수이자 바로 앞 쿼리의 순번이다(0 = 아직 없음)
    const checkStatements = (statements) => {
      statements
        .filter((statement) => statement.type === "VariableDeclaration")
        .flatMap((declaration) => declaration.declarations)
        .reduce(passDeclarator, { queryCount: 0, queryOrdinalByName: new Map() });
    };

    return {
      Program: (node) => checkStatements(node.body),
      BlockStatement: (node) => checkStatements(node.body),
    };
  },
};

// 선언 안의 suspense 쿼리 호출. 안쪽 함수 몸통은 이 블록의 조달이 아니라서 들어가지 않는다
function listSuspenseQueryCalls(node) {
  if (!isAstNode(node) || isFunctionNode(node)) return [];
  const isQueryCall = node.type === "CallExpression" && node.callee.type === "Identifier" && SUSPENSE_QUERY_HOOK.test(node.callee.name);
  return [...(isQueryCall ? [node] : []), ...listChildNodes(node).flatMap(listSuspenseQueryCalls)];
}

// 참조한 이름 중 가장 늦은 쿼리의 순번. 클로저도 값을 읽으므로 안쪽 함수까지 들어간다
function findLatestQueryOrdinal(nodes, queryOrdinalByName) {
  const ordinals = nodes
    .flatMap(listReferencedNames)
    .filter((name) => queryOrdinalByName.has(name))
    .map((name) => queryOrdinalByName.get(name));
  return ordinals.length > 0 ? Math.max(...ordinals) : null;
}

function listReferencedNames(node) {
  if (!isAstNode(node)) return [];
  if (node.type === "Identifier") return [node.name];
  if (node.type === "MemberExpression" && !node.computed) return listReferencedNames(node.object);
  if (node.type === "Property" && !node.computed) return listReferencedNames(node.value);
  return listChildNodes(node).flatMap(listReferencedNames);
}

function listPatternNames(pattern) {
  if (!isAstNode(pattern)) return [];
  switch (pattern.type) {
    case "Identifier":
      return [pattern.name];
    case "ObjectPattern":
      return pattern.properties.flatMap((property) => listPatternNames(property.type === "RestElement" ? property.argument : property.value));
    case "ArrayPattern":
      return pattern.elements.flatMap(listPatternNames);
    case "AssignmentPattern":
      return listPatternNames(pattern.left);
    case "RestElement":
      return listPatternNames(pattern.argument);
    default:
      return [];
  }
}

function listChildNodes(node) {
  return Object.entries(node)
    .filter(([key]) => !NON_RUNTIME_KEYS.has(key))
    .flatMap(([, child]) => (Array.isArray(child) ? child : [child]))
    .filter(isAstNode);
}

function isAstNode(value) {
  return typeof value === "object" && value !== null && typeof value.type === "string";
}

function isFunctionNode(node) {
  return node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression" || node.type === "FunctionDeclaration";
}
