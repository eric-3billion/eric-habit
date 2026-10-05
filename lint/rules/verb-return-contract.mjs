/**
 * habits/00 동사 표의 "이름이 약속한 반환"을 **적어둔 리턴 타입(문법)** 으로 검사한다.
 * 타입 checker 를 쓰지 않는다 — 리턴 타입이 없으면 검사하지 않고, export 함수의 리턴 타입은 explicit-return-type 이 강제한다.
 * 별칭(`type Maybe<T> = T | undefined`)은 풀지 못한다. 동사 목록은 habits/00 표에서 읽는다 — 표에서 동사의 반환 계약을 바꾸면 여기 CONTRACTS 를 맞출 것.
 */
const CONTRACTS = [
  // 없음은 null 하나로 표현한다 (habits/00) — undefined 는 "아직 안 정함"과 섞이고 TanStack queryFn 이 받지 못한다
  { pattern: /^find([A-Z]|$)/, messageId: "findMustIncludeNull", isSatisfied: ({ returnType }) => isAbsentAsNull(returnType) },
  // get 은 동작(꺼내기·만들기)을 말할 뿐 존재를 약속하지 않는다. 없을 수 있으면 null 로 드러내고, 없음을 undefined 로 표현하지 않는다
  { pattern: /^get([A-Z]|$)/, messageId: "getMustNotReturnUndefined", isSatisfied: ({ returnType }) => !hasUnionMember(returnType, isUndefinedType) },
  { pattern: /^(is|has|can)([A-Z]|$)/, messageId: "predicateMustReturnBoolean", isSatisfied: ({ returnType }) => returnType.type === "TSBooleanKeyword" || returnType.type === "TSTypePredicate" },
  { pattern: /^compare([A-Z]|$)/, messageId: "compareMustReturnNumber", isSatisfied: ({ returnType }) => returnType.type === "TSNumberKeyword" },
  { pattern: /^subscribe([A-Z]|$)/, messageId: "subscribeMustReturnUnsubscribe", isSatisfied: ({ returnType }) => returnType.type === "TSFunctionType" },
  // 실패가 반환 타입에 있으면 된다 — Result, 또는 Option(T | null) (habits/04)
  { pattern: /^(parse|validate)([A-Z]|$)/, messageId: "parseMustReturnResult", isSatisfied: ({ returnType, resultTypeNames }) => isTypeReferenceNamed(returnType, resultTypeNames) || isAbsentAsNull(returnType) },
  { pattern: /^filter([A-Z]|$)/, messageId: "filterMustReturnArray", isSatisfied: ({ returnType }) => isArrayType(returnType) },
  { pattern: /^normalize([A-Z]|$)/, messageId: "normalizeMustKeepType", isSatisfied: ({ returnType, firstParamType, sourceCode }) => firstParamType !== undefined && sourceCode.getText(returnType) === sourceCode.getText(firstParamType) },
];

export default {
  meta: {
    type: "problem",
    docs: { description: "함수 이름의 동사가 약속한 반환 타입을 적어둔 리턴 타입이 지키는지 검사 (habits/00 동사 표)" },
    schema: [{ type: "object", properties: { resultTypeNames: { type: "array", items: { type: "string" } } }, additionalProperties: false }],
    messages: {
      findMustIncludeNull: "find* 는 없을 수 있다 — 없음은 null 로 반환한다(undefined 금지). 항상 있으면 get* (habits/00)",
      getMustNotReturnUndefined: "get* 이 없음을 반환하면 null 로 드러낸다(undefined 금지) (habits/00)",
      predicateMustReturnBoolean: "is*/has*/can* 은 boolean 판정이다 (habits/00)",
      compareMustReturnNumber: "compare* 는 정렬 비교자 — number 를 반환한다 (habits/00)",
      subscribeMustReturnUnsubscribe: "subscribe* 는 해제 함수를 반환한다 (habits/00, 01 §6)",
      parseMustReturnResult: "parse*/validate* 는 실패를 반환 타입(Result 또는 T | null)에 드러낸다. undefined 는 쓰지 않는다 (habits/00, 04)",
      filterMustReturnArray: "filter* 는 입력 컬렉션의 부분집합(배열)을 반환한다 (habits/00)",
      normalizeMustKeepType: "normalize* 는 같은 타입을 표준형으로 되돌려준다 — 다른 타입으로 바꾸면 to* (habits/00)",
    },
  },
  create(context) {
    const resultTypeNames = context.options[0]?.resultTypeNames ?? ["Result"];
    const { sourceCode } = context;

    const handleFunction = (nameNode, fnNode) => {
      const contract = CONTRACTS.find((c) => c.pattern.test(nameNode.name));
      const annotation = fnNode.returnType?.typeAnnotation;
      if (!contract || !annotation) return;
      const returnType = toAwaitedType(annotation);
      const firstParamType = fnNode.params[0]?.typeAnnotation?.typeAnnotation;
      if (!contract.isSatisfied({ returnType, firstParamType, resultTypeNames, sourceCode })) {
        context.report({ node: nameNode, messageId: contract.messageId });
      }
    };

    return {
      FunctionDeclaration(node) {
        if (node.id) handleFunction(node.id, node);
      },
      VariableDeclarator(node) {
        const isFunctionInit = node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression";
        if (isFunctionInit && node.id.type === "Identifier") handleFunction(node.id, node.init);
      },
    };
  },
};

// Promise<T> 는 T 로 본다
function toAwaitedType(typeNode) {
  const isPromise = typeNode.type === "TSTypeReference" && typeNode.typeName.type === "Identifier" && typeNode.typeName.name === "Promise";
  const [awaited] = typeNode.typeArguments?.params ?? [];
  return isPromise && awaited ? toAwaitedType(awaited) : typeNode;
}

function hasUnionMember(typeNode, isMatch) {
  return typeNode.type === "TSUnionType" ? typeNode.types.some(isMatch) : isMatch(typeNode);
}

function isNullType(typeNode) {
  return typeNode.type === "TSNullKeyword";
}

function isAbsentAsNull(typeNode) {
  return hasUnionMember(typeNode, isNullType) && !hasUnionMember(typeNode, isUndefinedType);
}

function isUndefinedType(typeNode) {
  return typeNode.type === "TSUndefinedKeyword" || typeNode.type === "TSVoidKeyword";
}

function isTypeReferenceNamed(typeNode, names) {
  return typeNode.type === "TSTypeReference" && typeNode.typeName.type === "Identifier" && names.includes(typeNode.typeName.name);
}

function isArrayType(typeNode) {
  if (typeNode.type === "TSArrayType" || typeNode.type === "TSTupleType") return true;
  if (typeNode.type === "TSTypeOperator" && typeNode.operator === "readonly") return isArrayType(typeNode.typeAnnotation);
  return isTypeReferenceNamed(typeNode, ["Array", "ReadonlyArray"]);
}
