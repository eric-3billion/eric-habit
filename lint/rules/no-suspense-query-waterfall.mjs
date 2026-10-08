const SUSPENSE_QUERY_HOOK = /^useSuspenseQuer(y|ies)$/;
const NON_RUNTIME_KEYS = new Set(["parent", "typeAnnotation", "typeArguments", "typeParameters", "returnType"]);

/**
 * 같은 블록에서 바로 앞 suspense 쿼리 결과를 쓰지 않는 useSuspenseQuery 선언을 워터폴로 보고한다 (habits/01 §3).
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
    const checkStatements = (statements) => {
      const declarations = statements.filter((statement) => statement.type === "VariableDeclaration");
      // queryCount 는 지금까지 지난 suspense 쿼리 선언 수이자 바로 앞 쿼리의 순번이다(0 = 아직 없음)
      declarations.reduce(
        ({ queryCount, queryOrdinalByName }, declaration) => {
          const queryCalls = listSuspenseQueryCalls(declaration);
          const declaredNames = listDeclaredNames(declaration);
          if (queryCalls.length === 0) {
            const inits = declaration.declarations.map((declarator) => declarator.init);
            const derivedOrdinal = findLatestQueryOrdinal(inits, queryOrdinalByName);
            if (derivedOrdinal === null) return { queryCount, queryOrdinalByName };
            return { queryCount, queryOrdinalByName: new Map([...queryOrdinalByName, ...declaredNames.map((name) => [name, derivedOrdinal])]) };
          }
          const usesPrecedingQuery = queryCalls.some((call) => findLatestQueryOrdinal(call.arguments, queryOrdinalByName) === queryCount);
          const isWaterfall = queryCount > 0 && !usesPrecedingQuery && queryCalls.some((call) => call.callee.name === "useSuspenseQuery");
          if (isWaterfall) context.report({ node: declaration, messageId: "waterfall" });
          const ordinal = queryCount + 1;
          return { queryCount: ordinal, queryOrdinalByName: new Map([...queryOrdinalByName, ...declaredNames.map((name) => [name, ordinal])]) };
        },
        { queryCount: 0, queryOrdinalByName: new Map() },
      );
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

function listDeclaredNames(declaration) {
  return declaration.declarations.flatMap((declarator) => listPatternNames(declarator.id));
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
