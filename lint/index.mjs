import { fileURLToPath } from "node:url";

const PLUGIN_PATH = fileURLToPath(new URL("./plugin.mjs", import.meta.url));

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

const EFFECT_MESSAGE = "effect 는 최후 수단 — 파생은 렌더 중, 외부 값은 useSyncExternalStore. 허용 위치는 config 의 effectAllowedFiles 에만 (habits/01 §6)";

const RESTRICTED_SYNTAX = [
  { selector: "ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement", message: "명시적 루프 금지 → map/filter/reduce (habits/04)" },
  { selector: "VariableDeclaration[kind='let']", message: "재할당 대신 섀도잉·새 값 반환 (habits/04)" },
  {
    selector: "CallExpression[callee.name='useSuspenseQuery'] > ObjectExpression, CallExpression[callee.name='useSuspenseQueries'] Property[key.name='queries'] > ArrayExpression > ObjectExpression",
    message: "쿼리 옵션을 인라인으로 쓰지 않는다 — xxxQueries.detail() 팩토리를 넘기고 신선도 정책도 팩토리에 (habits/01 §3)",
  },
  {
    selector: "CallExpression[callee.name='useQuery']:not(:has(Property[key.name='enabled'])):not(:has(Identifier[name='skipToken']))",
    message: "useQuery 는 조건부 조회(enabled·skipToken)가 필요할 때만 쓴다 — 그 외에는 useSuspenseQuery (habits/01 §3)",
  },
  {
    selector: ":matches(FunctionDeclaration[id.name=/^(parse|validate)[A-Z]/], VariableDeclarator[id.name=/^(parse|validate)[A-Z]/]) ThrowStatement",
    message: "parse*/validate* 는 throw 대신 Result 로 실패를 반환한다 (habits/04)",
  },
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
];

/**
 * oxlint config 객체를 만든다 — 소비처의 `oxlint.config.mjs` 에서 `export default createOxlintConfig({ … })`.
 * categories 는 건드리지 않는다(oxlint 기본 correctness 는 소비처 몫).
 *
 * @param {object} [options]
 * @param {string[]} [options.effectAllowedFiles] - useEffect 를 허용할 파일 glob. 예외는 인라인 억제가 아니라 여기 한 곳에만 둔다
 * @param {string[]} [options.testFiles]
 * @param {string[]} [options.resultTypeNames] - parse·validate 함수가 반환해야 하는 Result 타입 이름
 * @param {string[]} [options.andJoinedTerms] - 함수 이름에 And 가 들어가도 되는 도메인 용어(예: "TermsAndConditions"). 두 동작의 나열이 아니라 한 명사구일 때만 올린다
 */
export function createOxlintConfig({
  effectAllowedFiles = [],
  testFiles = [
    "**/*.{test,spec}.{ts,tsx}",
    "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
    "**/*{fixture,fixtures,mock,mocks,test-helper,test-helpers,test-utils}.{ts,tsx}",
  ],
  resultTypeNames = ["Result"],
  andJoinedTerms = [],
} = {}) {
  const createRestrictedImports = ({ allowEffect }) => [
    "error",
    {
      paths: [
        // useQuery 는 조건부 조회에만 허용하므로 import 가 아니라 호출(RESTRICTED_SYNTAX)에서 본다
        { name: "@tanstack/react-query", importNames: ["useQueries", "useInfiniteQuery"], message: "useSuspenseQueries/useSuspenseInfiniteQuery 를 쓴다 — 경계 안은 성공만 (habits/01 §3)" },
        ...(allowEffect ? [] : [{ name: "react", importNames: ["useEffect", "useLayoutEffect"], message: EFFECT_MESSAGE }]),
      ],
    },
  ];
  const createRestrictedSyntax = ({ allowEffect, isTest }) => [
    "error",
    [
      ...RESTRICTED_SYNTAX,
      ...(allowEffect ? [] : [REACT_MEMBER_EFFECT]),
      ...(isTest ? TEST_RESTRICTED_SYNTAX : [NO_TEST_ID_ATTRIBUTE]),
    ],
  ];

  return {
    jsPlugins: [PLUGIN_PATH],
    rules: {
      // ── habits/05 타입 위생 ─────────────────────────────
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/no-non-null-assertion": "error",
      "typescript/no-explicit-any": "error",

      // ── habits/04 함수형 · 합타입 ────────────────────────
      "eric/explicit-return-type": "error",
      "no-param-reassign": ["error", { props: true }],
      "no-nested-ternary": "error",

      // ── habits/01 컴포넌트 설계 ──────────────────────────
      "typescript/consistent-type-definitions": ["error", "interface"],
      "eric/props-inline-type-single-line": "error",
      "eric/no-thin-query-hook": "error",

      // ── habits/02 구조 · 선언 순서 ───────────────────────
      // variables: false — 함수 몸통 안에서 아래 선언을 참조하는 건 TDZ 에 안 걸리므로 허용(styled·className 을 파일 아래에 두는 배치)
      "no-use-before-define": ["error", { functions: false, classes: true, variables: false, typedefs: true, ignoreTypeReferences: false }],

      // ── habits/00 이름 ──────────────────────────────────
      "eric/function-verb-whitelist": ["error", { verbs: FUNCTION_VERBS, exemptNames: VERB_EXEMPT_NAMES, andJoinedTerms }],
      "eric/no-general-name": "error",
      "eric/verb-return-contract": ["error", { resultTypeNames }],
      "eric/no-sentinel-arithmetic": "error",
      "no-warning-comments": ["warn", { terms: ["기존엔", "기존에는", "원래는", "예전엔"], location: "anywhere" }],

      // ── 제한 import · 셀렉터 ─────────────────────────────
      "no-restricted-imports": createRestrictedImports({ allowEffect: false }),
      "eric/restricted-syntax": createRestrictedSyntax({ allowEffect: false, isTest: false }),
      "eric/discouraged-syntax": ["warn", DISCOURAGED_SYNTAX],
    },
    overrides: [
      ...(effectAllowedFiles.length > 0
        ? [{
            files: effectAllowedFiles,
            rules: {
              "no-restricted-imports": createRestrictedImports({ allowEffect: true }),
              "eric/restricted-syntax": createRestrictedSyntax({ allowEffect: true, isTest: false }),
            },
          }]
        : []),
      {
        files: testFiles,
        rules: {
          "eric/restricted-syntax": createRestrictedSyntax({ allowEffect: false, isTest: true }),
          "eric/function-verb-whitelist": ["error", { verbs: [...FUNCTION_VERBS, ...TEST_FUNCTION_VERBS], exemptNames: [...VERB_EXEMPT_NAMES, ...TEST_EXEMPT_NAMES], andJoinedTerms }],
          // AAA 패턴의 result(= actual)·renderHook 의 result 는 테스트 관용구라 끈다. 나머지 위생 룰은 테스트에도 그대로
          "eric/no-general-name": "off",
          // testing-library 어휘(find* = 비동기·없으면 throw, query* = 없으면 null)가 동사 표의 반환 계약과 다르다
          "eric/verb-return-contract": "off",
        },
      },
    ],
  };
}
