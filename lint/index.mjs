import { fileURLToPath } from "node:url";
import { listBannedVerbs, listFunctionVerbs } from "./habit-lists.mjs";

const PLUGIN_PATH = fileURLToPath(new URL("./plugin.mjs", import.meta.url));
// 소비처 config 파일 위치와 무관하게 이 프리셋 기준으로 찾는다. 소비처가 peerDependency 로 설치해야 한다
const TESTING_LIBRARY_PLUGIN_PATH = fileURLToPath(import.meta.resolve("eslint-plugin-testing-library"));
const TANSTACK_QUERY_PLUGIN_PATH = fileURLToPath(import.meta.resolve("@tanstack/eslint-plugin-query"));

/** habits/00 동사 표 = 화이트리스트. 표가 SSOT 라 여기에 복제하지 않는다 (habit-lists.mjs) */
export const FUNCTION_VERBS = listFunctionVerbs();
/** habits/00 「등록 불가 동사」 — domainVerbs 로도 열 수 없다 */
export const BANNED_VERBS = listBannedVerbs();

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
    // 옵션을 통째로 인라인에 쓰는 경우는 @tanstack/query/prefer-query-options 가 잡는다. 여기서는 팩토리를 펼친 뒤 덧붙이는 경우만 본다
    selector: "CallExpression[callee.name='useSuspenseQuery'] > ObjectExpression:has(> SpreadElement), CallExpression[callee.name='useSuspenseQueries'] Property[key.name='queries'] > ArrayExpression > ObjectExpression:has(> SpreadElement)",
    message: "팩토리를 펼친 뒤 옵션을 덧붙이지 않는다 — 신선도 정책도 xxxQueries.detail() 팩토리에 둔다 (habits/01 §3)",
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
  { selector: "CallExpression[callee.name=/ByTestId$/], CallExpression[callee.property.name=/ByTestId$/]", message: "*ByTestId 대신 role/접근성 쿼리 + within 스코프 (habits/06)" },
];

// habits/06 — 테스트 파일에만 켠다
const TEST_RULES = {
  // 분기가 있으면 일부 경로의 단언이 돌지 않아도 테스트가 통과한다
  "vitest/no-conditional-expect": "error",
  "vitest/no-conditional-in-test": "error",
  "vitest/expect-expect": "error",
  "vitest/no-standalone-expect": "error",
  "vitest/valid-expect": "error",
  "vitest/no-identical-title": "error",
  "vitest/no-commented-out-tests": "error",
  // toThrow() 만 쓰면 아무 에러나 통과한다
  "vitest/require-to-throw-message": "error",
  // DOM 구조 대신 role·접근성 쿼리로 찾는다
  "testing-library/no-node-access": "error",
  "testing-library/no-container": "error",
  "testing-library/prefer-screen-queries": "error",
  "testing-library/prefer-presence-queries": "error",
  "testing-library/prefer-find-by": "error",
  // fireEvent 는 실제 사용자 이벤트 순서를 재현하지 않는다
  "testing-library/prefer-user-event": "error",
  "testing-library/await-async-queries": "error",
  "testing-library/await-async-utils": "error",
  "testing-library/no-await-sync-queries": "error",
  "testing-library/no-wait-for-multiple-assertions": "error",
  "testing-library/no-wait-for-side-effects": "error",
  "testing-library/no-unnecessary-act": "error",
  "testing-library/no-manual-cleanup": "error",
  "testing-library/no-debugging-utils": "error",
};

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
 * @param {string[]} [options.apiFiles] - 서버 엔드포인트를 부르는 API 파일. 함수 이름이 엔드포인트를 따르므로 동사 검사를 하지 않는다 (habits/00)
 * @param {{ verb: string, contract: string }[]} [options.domainVerbs] - 표의 동사로 바꾸면 뜻이 뭉개지는 인앱 도메인 동작(signOut 등)과 계약 한 문장(반환·부수효과).
 *   등록 불가 동사이거나 계약이 비면 config 를 만들 때 throw 한다 (habits/00)
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
  apiFiles = [],
  domainVerbs = [],
} = {}) {
  const domainVerbErrors = listDomainVerbErrors(domainVerbs);
  if (domainVerbErrors.length > 0) throw new Error(`domainVerbs 설정 오류 (habits/00):\n${domainVerbErrors.join("\n")}`);
  const createVerbWhitelistRule = ({ isTest }) => [
    "error",
    {
      verbs: [...FUNCTION_VERBS, ...domainVerbs.map(({ verb }) => verb), ...(isTest ? TEST_FUNCTION_VERBS : [])],
      bannedVerbs: BANNED_VERBS,
      exemptNames: isTest ? [...VERB_EXEMPT_NAMES, ...TEST_EXEMPT_NAMES] : VERB_EXEMPT_NAMES,
      andJoinedTerms,
    },
  ];
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
    // plugins 를 적으면 oxlint 기본 묶음(typescript·unicorn·oxc)을 덮으므로 기본 묶음에 react 만 더한다
    plugins: ["typescript", "unicorn", "oxc", "react", "vitest"],
    jsPlugins: [PLUGIN_PATH, TESTING_LIBRARY_PLUGIN_PATH, TANSTACK_QUERY_PLUGIN_PATH],
    rules: {
      // ── habits/05 타입 위생 ─────────────────────────────
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/no-non-null-assertion": "error",
      "typescript/no-explicit-any": "error",
      // 억제 주석으로 사유를 대는 회피는 위생 위반보다 나쁘다. 예외는 설정 파일 한 곳에만 둔다 (habits/05)
      "typescript/ban-ts-comment": ["error", { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true }],
      "unicorn/no-abusive-eslint-disable": "error",
      // 없음은 null 하나로 표현한다 (habits/00) — undefined 를 일부러 넘기거나 반환하지 않는다
      "unicorn/no-useless-undefined": "error",

      // ── habits/04 함수형 · 합타입 ────────────────────────
      "eric/explicit-return-type": "error",
      "no-param-reassign": ["error", { props: true }],
      "no-nested-ternary": "error",
      // 유한한 키의 매핑은 Record 로 쓴다 (habits/04 판정은 함수, Record 는 매핑)
      "typescript/consistent-indexed-object-style": ["error", "record"],
      "typescript/no-dynamic-delete": "error",
      "unicorn/no-array-for-each": "error",
      // 원본을 바꾸는 sort()·reverse() 대신 toSorted()·toReversed()
      // reduce 안에서 누적값을 매번 펼치면 O(n²) 이다
      "oxc/no-accumulating-spread": "error",
      "unicorn/no-array-sort": "error",
      "unicorn/no-array-reverse": "error",

      // ── habits/01 컴포넌트 설계 ──────────────────────────
      "typescript/consistent-type-definitions": ["error", "interface"],
      "eric/props-inline-type-single-line": "error",
      "eric/no-thin-query-hook": "error",
      // queryFn 이 쓰는 값이 queryKey 에 빠지면 다른 조건의 결과를 캐시에서 돌려준다 (habits/01 §3)
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/prefer-query-options": "error",
      "@tanstack/query/no-rest-destructuring": "error",
      "@tanstack/query/stable-query-client": "error",
      "@tanstack/query/no-unstable-deps": "error",
      "@tanstack/query/infinite-query-property-order": "error",
      "@tanstack/query/mutation-property-order": "error",
      "react/function-component-definition": ["error", { namedComponents: "function-declaration", unnamedComponents: "arrow-function" }],
      // 렌더할 때마다 새 컴포넌트가 되어 리마운트된다. ErrorBoundary fallback 같은 render prop 은 슬롯이라 허용한다 (habits/03)
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      // children 을 뜯어 고치지 말고 슬롯·컴파운드로 조합한다 (habits/03)
      "react/no-clone-element": "error",
      "react/no-react-children": "error",
      // 렌더마다 새 참조가 되어 memo·deps·context 소비처가 매번 바뀐 것으로 본다
      "react/no-object-type-as-default-prop": "error",
      "react/jsx-no-constructed-context-values": "error",
      // 분기는 조기 반환으로 편다 — 중첩이 깊으면 분기를 상위로 끌어올리거나 쪼갤 신호
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "unicorn/no-negated-condition": "error",
      // 바깥 스코프를 쓰지 않는 함수는 모듈 최상위로 뺀다(렌더마다 새로 만들지 않고, 순수함을 위치로 드러낸다)
      "unicorn/consistent-function-scoping": "error",

      // ── habits/02 구조 · 선언 순서 ───────────────────────
      // variables: false — 함수 몸통 안에서 아래 선언을 참조하는 건 TDZ 에 안 걸리므로 허용(styled·className 을 파일 아래에 두는 배치)
      "no-use-before-define": ["error", { functions: false, classes: true, variables: false, typedefs: true, ignoreTypeReferences: false }],

      // ── habits/00 이름 ──────────────────────────────────
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      // const [user, setUser] 처럼 값과 세터 이름이 짝을 이룬다 (habits/00)
      "react/hook-use-state": "error",
      "eric/function-verb-whitelist": createVerbWhitelistRule({ isTest: false }),
      "eric/no-general-name": "error",
      "eric/verb-return-contract": ["error", { resultTypeNames }],
      "eric/no-sentinel-arithmetic": "error",
      // 운영 콘솔에 디버그 출력과 민감 데이터가 남지 않게 한다. 의도한 경고·오류 보고만 허용한다
      "no-console": ["error", { allow: ["warn", "error"] }],
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
      ...(apiFiles.length > 0
        ? [{ files: apiFiles, rules: { "eric/function-verb-whitelist": "off" } }]
        : []),
      {
        files: testFiles,
        rules: {
          ...TEST_RULES,
          "eric/restricted-syntax": createRestrictedSyntax({ allowEffect: false, isTest: true }),
          "eric/function-verb-whitelist": createVerbWhitelistRule({ isTest: true }),
          // 잘못된 타입이 거부되는지 확인하는 테스트에서는 @ts-expect-error 가 단언 역할을 한다. 왜 틀린지 설명을 붙이게 한다
          "typescript/ban-ts-comment": ["error", { "ts-expect-error": "allow-with-description", "ts-ignore": true, "ts-nocheck": true }],
          // AAA 패턴의 result(= actual)·renderHook 의 result 는 테스트 관용구라 끈다. 나머지 위생 룰은 테스트에도 그대로
          "eric/no-general-name": "off",
          // testing-library 어휘(find* = 비동기·없으면 throw, query* = 없으면 null)가 동사 표의 반환 계약과 다르다
          "eric/verb-return-contract": "off",
        },
      },
    ],
  };
}

const DOMAIN_VERB_FORMAT = /^[a-z][a-zA-Z]*$/;
const toLeadingBannedVerb = (verb) => BANNED_VERBS.find((banned) => new RegExp(`^${banned}([A-Z]|$)`).test(verb)) ?? null;

/** domainVerbs 한 항목마다 어긴 것을 모은다. 등록 자체가 화이트리스트의 확장 지점이라, 넓은 동사가 여기로 들어오지 못하게 config 단계에서 막는다 */
function listDomainVerbErrors(domainVerbs) {
  return domainVerbs.flatMap(({ verb, contract }) => {
    const label = `- '${verb}'`;
    const bannedVerb = toLeadingBannedVerb(verb);
    return [
      ...(DOMAIN_VERB_FORMAT.test(verb) ? [] : [`${label}: 소문자로 시작하는 camelCase 동사여야 한다`]),
      ...(bannedVerb === null ? [] : [`${label}: '${bannedVerb}' 는 등록 불가 동사다 — 표의 동사로 개명하거나 쪼갠다`]),
      ...(FUNCTION_VERBS.includes(verb) ? [`${label}: 이미 공통 동사 표에 있다`] : []),
      ...(typeof contract === "string" && contract.trim().length > 0 ? [] : [`${label}: contract 에 계약 한 문장(반환·부수효과)을 적는다. 못 쓰면 도메인 동사가 아니다`]),
    ];
  });
}
