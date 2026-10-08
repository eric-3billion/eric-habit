const SUSPENSE_QUERY_HOOK = /^useSuspenseQuer(y|ies)$/;
const NON_RUNTIME_KEYS = new Set(["parent", "typeAnnotation", "typeArguments", "typeParameters", "returnType"]);

/**
 * 같은 블록에서 앞 suspense 쿼리 결과를 쓰지 않는 useSuspenseQuery 선언을 워터폴로 보고한다 (habits/01 §3).
 * 앞 쿼리 결과를 담은 이름과, 그 이름에서 파생한 선언(`const qcCriteria = getQcCriteria(test)`)을 의존으로 본다.
 * 이름만 비교하고 스코프는 보지 않는다. 안쪽 함수가 같은 이름을 다시 선언하면 의존으로 잘못 보고 놓친다.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "앞 쿼리 결과를 쓰지 않는 useSuspenseQuery 연속 호출(워터폴) — useSuspenseQueries 로 묶는다 (habits/01 §3)" },
    schema: [],
    messages: {
      waterfall: "앞 suspense 쿼리 결과를 쓰지 않는 useSuspenseQuery 연속 호출은 워터폴이다 — 독립 조달이면 useSuspenseQueries 로 묶는다 (habits/01 §3)",
    },
  },
  create(context) {
    const checkStatements = (statements) => {
      const declarations = statements.filter((statement) => statement.type === "VariableDeclaration");
      declarations.reduce(
        ({ hasPrecedingQuery, dependentNames }, declaration) => {
          const queryCalls = listSuspenseQueryCalls(declaration);
          const isDependent = queryCalls.length > 0
            ? queryCalls.some((call) => referencesAny(call.arguments, dependentNames))
            : referencesAny(declaration.declarations.map((declarator) => declarator.init), dependentNames);
          const isWaterfall = hasPrecedingQuery && !isDependent && queryCalls.some((call) => call.callee.name === "useSuspenseQuery");
          if (isWaterfall) context.report({ node: declaration, messageId: "waterfall" });
          const isQueryOrDerived = queryCalls.length > 0 || isDependent;
          return {
            hasPrecedingQuery: hasPrecedingQuery || queryCalls.length > 0,
            dependentNames: isQueryOrDerived ? new Set([...dependentNames, ...listDeclaredNames(declaration)]) : dependentNames,
          };
        },
        { hasPrecedingQuery: false, dependentNames: new Set() },
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

// 클로저도 값을 읽으므로 참조를 셀 때는 안쪽 함수까지 들어간다
function referencesAny(nodes, names) {
  return names.size > 0 && nodes.some((node) => listReferencedNames(node).some((name) => names.has(name)));
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
