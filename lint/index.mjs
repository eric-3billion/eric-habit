import tseslint from "typescript-eslint";

import discouragedSyntax from "./rules/discouraged-syntax.mjs";
import explicitReturnType from "./rules/explicit-return-type.mjs";
import functionVerbWhitelist from "./rules/function-verb-whitelist.mjs";
import noSentinelArithmetic from "./rules/no-sentinel-arithmetic.mjs";
import noSingleMemberContainer from "./rules/no-single-member-container.mjs";
import noThinQueryHook from "./rules/no-thin-query-hook.mjs";
import noGeneralName from "./rules/no-general-name.mjs";
import propsInlineTypeSingleLine from "./rules/props-inline-type-single-line.mjs";
import verbReturnContract from "./rules/verb-return-contract.mjs";

/** habits/00 동사 표 = 화이트리스트. 표를 바꾸면 여기와 rules/verb-return-contract 의 CONTRACTS 를 같이 맞출 것. */
export const FUNCTION_VERBS = [
  "get", "find", "list",
  "is", "has", "can",
  "to", "format", "normalize", "calculate", "clamp", "compare", "filter", "group",
  "parse", "validate",
  "create", "update", "delete", "add", "remove", "reset", "set",
  "open", "close", "render",
  "subscribe", "use", "handle", "on",
];

// 테스트 어휘 — 테스트 파일에서만 추가로 허용한다
export const TEST_FUNCTION_VERBS = ["setup", "mock", "expect", "query"];
// 테스트 관용 이름 — 단독 setup(), renderHook 의 wrapper 옵션
const TEST_EXEMPT_NAMES = ["setup", "wrapper"];
// 조합자는 동사가 아니어도 된다 (habits/00, 04 조합 닫힘). 컴포넌트(PascalCase)는 룰이 알아서 제외한다
const VERB_EXEMPT_NAMES = ["all", "any"];

const ericPlugin = {
  meta: { name: "eric" },
  rules: {
    "discouraged-syntax": discouragedSyntax,
    "explicit-return-type": explicitReturnType,
    "function-verb-whitelist": functionVerbWhitelist,
    "no-sentinel-arithmetic": noSentinelArithmetic,
    "no-single-member-container": noSingleMemberContainer,
    "no-thin-query-hook": noThinQueryHook,
    "no-general-name": noGeneralName,
    "props-inline-type-single-line": propsInlineTypeSingleLine,
    "verb-return-contract": verbReturnContract,
  },
};

const EFFECT_MESSAGE = "effect 는 최후 수단 — 파생은 렌더 중, 외부 값은 useSyncExternalStore. 허용 위치는 config 의 effectAllowedFiles 에만 (habits/01 §6)";

const RESTRICTED_SYNTAX = [
  { selector: "ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement", message: "명시적 루프 금지 → map/filter/reduce (habits/04)" },
  { selector: "VariableDeclaration[kind='let']", message: "재할당 대신 섀도잉·새 값 반환 (habits/04)" },
  {
    selector: "CallExpression[callee.name='useSuspenseQuery'] > ObjectExpression, CallExpression[callee.name='useSuspenseQueries'] Property[key.name='queries'] > ArrayExpression > ObjectExpression",
    message: "쿼리 옵션을 인라인으로 쓰지 않는다 — xxxQueries.detail() 팩토리를 넘기고 신선도 정책도 팩토리에 (habits/01 §3)",
  },
  { selector: "TSIndexedAccessType[objectType.type='TSTypeQuery'][indexType.type='TSNumberKeyword']", message: "배열에서 유니온을 파생하지 않는다 — 유니온이 원본, 배열은 satisfies (habits/02)" },
  {
    selector: ":matches(FunctionDeclaration[id.name=/^(parse|validate)[A-Z]/], VariableDeclarator[id.name=/^(parse|validate)[A-Z]/]) ThrowStatement",
    message: "parse*/validate* 는 throw 대신 Result 로 실패를 반환한다 (habits/04)",
  },
  { selector: "ReturnStatement > Literal[value='-']", message: "raw '-' 를 반환하지 않는다 — ReactNode 로 일관 반환 (habits/01 §7)" },
];
const REACT_MEMBER_EFFECT = { selector: "MemberExpression[object.name='React'][property.name=/^use(Layout)?Effect$/]", message: EFFECT_MESSAGE };
const NO_TEST_ID_ATTRIBUTE = { selector: "JSXAttribute[name.name='data-testid']", message: "data-testid 결합 대신 role/접근성 쿼리로 찾는다 (habits/06)" };
const TEST_RESTRICTED_SYNTAX = [
  { selector: "CallExpression[callee.name='getComputedStyle'], CallExpression[callee.property.name='getComputedStyle']", message: "jsdom 은 styled 중첩 CSS 를 못 읽는다 → toHaveStyle (habits/06)" },
  { selector: "CallExpression[callee.name=/ByTestId$/], CallExpression[callee.property.name=/ByTestId$/]", message: "*ByTestId 대신 role/접근성 쿼리 + within 스코프 (habits/06)" },
];

const DISCOURAGED_SYNTAX = [
  {
    selector: "VariableDeclaration:has(CallExpression[callee.name='useSuspenseQuery']) ~ VariableDeclaration:has(CallExpression[callee.name='useSuspenseQuery'])",
    message: "같은 경계의 useSuspenseQuery 연속 호출은 워터폴이다 — 독립 조달이면 useSuspenseQueries 로 묶는다. 의존 쿼리면 무시 (habits/01 §3)",
  },
  { selector: "JSXAttribute[name.name=/^(show|hide)[A-Z]/]", message: "show*/hide* boolean prop 대신 슬롯으로 화면을 JSX 에 드러낸다 (habits/03)" },
  {
    selector: "ArrayExpression > ObjectExpression > Property[key.name=/^(test|when|predicate|condition)$/][value.type=/FunctionExpression$/]",
    message: "판정을 테이블로 박지 않는다 — 유니온을 반환하는 함수 + Record 매핑 (habits/04)",
  },
];

/**
 * @param {object} options
 * @param {string[]} [options.files] - 대상 파일
 * @param {string[]} [options.effectAllowedFiles] - useEffect 를 허용할 파일 glob. 예외는 인라인 억제가 아니라 여기 한 곳에만 둔다
 * @param {string[]} [options.publicApiPatterns] - 딥임포트를 막을 경로 패턴. 예: ["@/entities/*\/*", "@/features/*\/*"]
 * @param {string[]} [options.testFiles]
 * @param {string[]} [options.resultTypeNames] - parse·validate 함수가 반환해야 하는 Result 타입 이름
 */
export function createEslintPreset({
  files = ["**/*.{ts,tsx}"],
  effectAllowedFiles = [],
  publicApiPatterns = [],
  testFiles = [
    "**/*.{test,spec}.{ts,tsx}",
    "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
    "**/*{fixture,fixtures,mock,mocks,test-helper,test-helpers,test-utils}.{ts,tsx}",
  ],
  resultTypeNames = ["Result"],
}) {
  const createRestrictedImports = ({ allowEffect }) => [
    "error",
    {
      paths: [
        { name: "@tanstack/react-query", importNames: ["useQuery", "useQueries", "useInfiniteQuery"], message: "useSuspenseQuery/useSuspenseQueries 를 쓴다 — 경계 안은 성공만 (habits/01 §3)" },
        ...(allowEffect ? [] : [{ name: "react", importNames: ["useEffect", "useLayoutEffect"], message: EFFECT_MESSAGE }]),
      ],
      ...(publicApiPatterns.length > 0 && { patterns: [{ group: publicApiPatterns, message: "슬라이스 내부로 딥임포트하지 않는다 — public API(index)로만 (habits/02, 06)" }] }),
    },
  ];
  const createRestrictedSyntax = ({ allowEffect, isTest }) => [
    "error",
    ...RESTRICTED_SYNTAX,
    ...(allowEffect ? [] : [REACT_MEMBER_EFFECT]),
    ...(isTest ? TEST_RESTRICTED_SYNTAX : [NO_TEST_ID_ATTRIBUTE]),
  ];

  return [
    {
      files,
      languageOptions: {
        parser: tseslint.parser,
        // 타입 정보를 쓰지 않는다 — 모든 룰이 문법만으로 판정한다
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: {
        "@typescript-eslint": tseslint.plugin,
        eric: ericPlugin,
      },
      rules: {
        // ── habits/05 타입 위생 ─────────────────────────────
        "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-explicit-any": "error",

        // ── habits/04 함수형 · 합타입 ────────────────────────
        "eric/explicit-return-type": "error",
        "no-param-reassign": ["error", { props: true }],
        "no-nested-ternary": "error",

        // ── habits/01 컴포넌트 설계 ──────────────────────────
        "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
        "eric/props-inline-type-single-line": "error",
        "eric/no-thin-query-hook": "error",

        // ── habits/02 구조 · 선언 순서 ───────────────────────
        // 상수·타입은 TDZ 순서, 호이스팅되는 function 은 읽는 순서(진입점 먼저)
        // variables: false — 함수 몸통 안에서 아래 선언을 참조하는 건 TDZ 에 안 걸리므로 허용(styled·className 을 파일 아래에 두는 배치)
        "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: false, typedefs: true, ignoreTypeReferences: false }],

        // ── habits/00 이름 ──────────────────────────────────
        "eric/function-verb-whitelist": ["error", { verbs: FUNCTION_VERBS, exemptNames: VERB_EXEMPT_NAMES }],
        "eric/no-general-name": "error",
        "@typescript-eslint/naming-convention": ["error", { selector: "typeLike", format: null, custom: { regex: "(Info|Data)$", match: false } }],
        "eric/verb-return-contract": ["error", { resultTypeNames }],
        "eric/no-sentinel-arithmetic": "error",
        "eric/no-single-member-container": "warn",
        "no-warning-comments": ["warn", { terms: ["기존엔", "기존에는", "원래는", "예전엔"], location: "anywhere" }],

        // ── 제한 import · 셀렉터 ─────────────────────────────
        "no-restricted-imports": createRestrictedImports({ allowEffect: false }),
        "no-restricted-syntax": createRestrictedSyntax({ allowEffect: false, isTest: false }),
        "eric/discouraged-syntax": ["warn", DISCOURAGED_SYNTAX],
      },
    },
    ...(effectAllowedFiles.length > 0
      ? [{
          files: effectAllowedFiles,
          rules: {
            "no-restricted-imports": createRestrictedImports({ allowEffect: true }),
            "no-restricted-syntax": createRestrictedSyntax({ allowEffect: true, isTest: false }),
          },
        }]
      : []),
    {
      files: testFiles,
      rules: {
        "no-restricted-syntax": createRestrictedSyntax({ allowEffect: false, isTest: true }),
        "eric/function-verb-whitelist": ["error", { verbs: [...FUNCTION_VERBS, ...TEST_FUNCTION_VERBS], exemptNames: [...VERB_EXEMPT_NAMES, ...TEST_EXEMPT_NAMES] }],
        // AAA 패턴의 result(= actual)·renderHook 의 result 는 테스트 관용구라 끈다. 나머지 위생 룰은 테스트에도 그대로
        "eric/no-general-name": "off",
        // testing-library 어휘(find* = 비동기·없으면 throw, query* = 없으면 null)가 동사 표의 반환 계약과 다르다
        "eric/verb-return-contract": "off",
      },
    },
  ];
}
