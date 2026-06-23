export const meta = {
  name: 'eric-review',
  description: 'Eric 스타일 PR 리뷰: habits SSOT를 읽는 6렌즈 멀티에이전트 탐색 → 적대적 오탐 검증 → 고가치만 합산',
  phases: [
    { title: 'Review', detail: '각 렌즈가 habit 룰을 읽고 인라인된 PR 본문을 병렬 검토' },
    { title: 'Verify', detail: '인라인 본문 기준으로 회의적 검증자가 각 발견을 confirm/reject (불확실하면 기각)' },
    { title: 'Synthesize', detail: '확정/조정만 dedup + 심각도·렌즈로 정리' }
  ]
}

// 메인 루프가 args로 전달: { pr, habitsDir, baseDir, diffPath, files: [relative paths] }
//
// [오염 방지 설계 — 왜 로컬 repo가 아니라 /tmp 스냅샷 경로인가]
// finder를 로컬 repo cwd 에서 Explore 로 굴리면 본능적으로 git diff/status 를 쳐서
// 이 PR 과 무관한 "커밋되지 않은 working tree 변경"을 리뷰해버린다(실제로 오염됨). 그래서:
//   (1) PR head 를 /tmp 스냅샷(baseDir)으로 받아두고, 에이전트는 그 절대경로만 Read.
//   (2) diff 도 git 이 아니라 diffPath 파일에서 Read.
//   (3) agentType:'Explore'(검색·git 성향)를 쓰지 않고, git/Bash/live-repo 접근을 금지.
// 본문을 args 에 인라인하지 않는다 — 큰 파일(예: 수천 줄 types.ts)이 끼면 args 가 비대해져
// 메인 루프가 워크플로 호출로 재emit 하는 게 비현실적이라, 경로만 넘기고 내용은 Read 로 조달한다.
const HABITS = (args && args.habitsDir) || '~/code-style/habits'
const BASE = (args && args.baseDir) || ''
const DIFF = (args && args.diffPath) || ''
const FILES = (args && args.files) || []
const FILE_LIST = FILES.map(f => `- ${BASE}/${f}`).join('\n')

// 룰 텍스트는 여기에 박지 않는다 — habits/*.md(SSOT)를 finder가 런타임에 읽는다.
const LENSES = [
  { key: "intent", habit: ["00-intent.md"],
    focus: "모든 신규/변경 식별자(훅·함수·변수·prop·data-attr·모듈)를 의도-드러남/예측가능성 기준으로. 이름이 동작을 telegraph 못 하거나 숨은 부수효과/센티넬이 있으면 지적." },
  { key: "component", habit: ["01-component-design.md", "02-structure-cohesion.md", "03-composition.md"],
    focus: "제어흐름 보유 컴포넌트(분기 drilling, useEffect 거울 state, 중간 핸들러, 단일관심사) + 구조(흩어진 하드코딩/SSOT, 응집, 선언 의존성 순서/역전) + 조합(prop 드릴링 vs compound/슬롯, JSX=화면 1:1, 모달 blast radius)." },
  { key: "functional", habit: ["04-functional-domain.md", "canonical-examples.md"],
    focus: "유틸/매퍼/리듀서/포맷·도메인 함수. 명령형 루프·가변·throw·OOP 상용구·Result/Option 부재. 도메인 룰이 인라인 비교/하드코딩으로 흩어졌으면 entities/lib 순수함수로 추출(canonical-examples 참고)." },
  { key: "types", habit: ["05-types.md"],
    focus: "타입: 땜빵용 옵셔널(?) 남발, as/non-null/any, 도메인 규약 일관성(같은 개념의 표기 이원화) , DTO→model 매퍼 정합. 새 옵셔널 필드는 '왜 옵셔널인지' 정당한지." },
  { key: "correctness", habit: [],
    focus: "정확성/React 버그만(스타일 X): stale closure, key 충돌, memo, 페이지네이션 리셋/이중 fetch, 레이스, 포맷 엣지(NaN/음수/범위), 에러 vs 404 순서, URL 인코딩, 파싱. 실패 시나리오를 구체적으로 구성, 실제로 못 터지면 보고 금지." },
  { key: "test", habit: ["06-testing.md"],
    focus: "테스트 충실도: 스코프 없는 getByText, 구현 디테일(data-testid) 결합, mock이 쿼리 파라미터 무시(분기 가림), fixture/헬퍼 중복, 커버리지 공백(분기·폴백·에러복구). 테스트 파일 + 대상 컴포넌트 함께 읽기." }
]

const FINDINGS_SCHEMA = {
  type: "object", additionalProperties: false, required: ["findings"],
  properties: { findings: { type: "array", items: {
    type: "object", additionalProperties: false,
    required: ["file","line","severity","lens","title","detail","suggestion"],
    properties: {
      file: { type: "string", description: "repo-relative path, BASE prefix 제거" },
      line: { type: "integer", description: "PR head 파일의 1-based 라인" },
      severity: { type: "string", enum: ["blocker","high","medium","low","nit"] },
      lens: { type: "string", enum: ["intent","component","functional","types","correctness","test"] },
      title: { type: "string" },
      detail: { type: "string", description: "실제 코드를 인용한 구체 설명 + 어느 habit 룰 위반인지" },
      suggestion: { type: "string", description: "구체적 처방" }
    } } } }
}

const VERDICT_SCHEMA = {
  type: "object", additionalProperties: false, required: ["verdict","confidence","realityCheck","finalSeverity"],
  properties: {
    verdict: { type: "string", enum: ["confirmed","rejected","adjusted"] },
    confidence: { type: "string", enum: ["high","medium","low"] },
    realityCheck: { type: "string", description: "그 라인에서 실제로 본 코드 인용" },
    finalLine: { type: "integer" },
    finalSeverity: { type: "string", enum: ["blocker","high","medium","low","nit"] },
    note: { type: "string" }
  }
}

const ENGINEERING_NOTE = `[검증 품질 — 하네스 엔지니어링(스타일 룰 아님)]
목적은 오탐(false positive)을 죽이는 것. 발견을 그대로 믿지 말고 파일을 직접 열어 확인하라. 불확실하면 reject. 흔한 오탐: "미사용 같지만 헬퍼/맵 통해 쓰임", "race 같지만 컴포넌트별 격리 state", "memo 깨질 것 같지만 dep 안정", "타입 미스매치 같지만 동일 타입".`

phase('Review')

const results = await pipeline(
  LENSES,
  lens => {
    const habitList = lens.habit.length
      ? `먼저 다음 습관 파일(SSOT)을 Read로 읽고 그 룰을 기준으로 삼아라: ${lens.habit.map(h => `${HABITS}/${h}`).join(", ")}.`
      : `이 렌즈는 습관 파일 없이 일반 품질 기준으로 본다.`
    return agent(
`PR #${args && args.pr} 리뷰. ${habitList}

[리뷰 대상 — 오직 아래 /tmp 스냅샷만]
이 PR 의 변경 파일은 다음이 전부이며, head 스냅샷이 아래 절대경로에 저장돼 있다. 반드시 이 경로들만 Read 로 열어 검토하라:
${FILE_LIST}

변경 diff 전문은 이 파일에 있다(Read 로 열어 무엇이 어떻게 바뀌었는지 파악): ${DIFF}

[절대 금지 — 매우 중요]
- git status / git diff / git log / Bash 를 실행하지 마라. 변경 내역은 위 ${DIFF} 파일에 이미 다 있다.
- 로컬 작업 디렉터리(예: /Users/.../gebra.v2/src/...)를 Read·탐색하지 마라. 거긴 이 PR 과 무관한
  커밋되지 않은 변경이 섞여 있어 리뷰가 오염된다. 너의 근거는 위 ${BASE}/ 스냅샷 + ${DIFF} 뿐이다.
- habit 룰 파일 ${HABITS}/ 만 참조용 Read 허용.
- 보고하는 file 경로는 ${BASE}/ 를 뗀 repo-relative (예: src/pages/.../foo.tsx).

집중: ${lens.focus}

규칙: 스냅샷 파일을 실제로 Read 해 라인 번호를 확인(추측 금지). 발견마다 정확한 file+line + 무엇이 왜 문제인지(코드 인용 + 어느 habit 룰 위반) + 구체적 처방. 해당 렌즈에 진짜 해당하는 것만, 과잉보고 금지.`,
      { label: `find:${lens.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }
    ).then(r => ({ lens: lens.key, findings: (r && r.findings) ? r.findings : [] }))
  },
  found => parallel(found.findings.map((f, i) => () =>
    agent(
`적대적 검증자. 아래 발견을 스냅샷 파일을 직접 Read 해 confirm 또는 REFUTE하라. 코드로 확인 못 하면 기본값 "rejected".

${ENGINEERING_NOTE}

[근거는 ${BASE}/ 스냅샷 파일 + ${DIFF} 뿐. git/Bash/로컬 repo 접근 금지. habit 룰 파일 ${HABITS}/ 만 참조용 Read 허용.]

대상 파일(이 절대경로를 Read 하라): ${BASE}/${f.file}  — 주장 라인 ${f.line} 주변 확인. (이 경로에 파일이 없으면 PR 대상이 아니므로 rejected.)
발견[${found.lens}]: ${f.title}
- severity(주장): ${f.severity}
- detail: ${f.detail}
- suggestion: ${f.suggestion}

스타일 발견이면 habit 룰 기준으로 진짜 지적할 가치가 있는지(주관적 노이즈 아닌지) 판단. 필요하면 ${HABITS}/ 의 해당 룰 파일을 읽어 대조. 정확성 발견이면 실패 시나리오를 구성해보고 불가능하면 기각. 스냅샷의 줄번호로 라인 정확성을 확인해 틀렸으면 교정, 심각도 과/소 평가면 조정. 본 코드를 인용하고 판정하라.`,
      { label: `verify:${found.lens}#${i}`, phase: 'Verify', schema: VERDICT_SCHEMA }
    ).then(v => ({ finding: { ...f, lens: found.lens }, verdict: v })).catch(() => null)
  ))
)

phase('Synthesize')

const all = results.flat().filter(Boolean)
const kept = all.filter(x => x.verdict && (x.verdict.verdict === 'confirmed' || x.verdict.verdict === 'adjusted'))
const rejected = all.filter(x => x.verdict && x.verdict.verdict === 'rejected')

const order = { blocker: 0, high: 1, medium: 2, low: 3, nit: 4 }
const merged = kept.map(x => ({
  file: x.finding.file,
  line: x.verdict.finalLine != null ? x.verdict.finalLine : x.finding.line,
  severity: x.verdict.finalSeverity || x.finding.severity,
  lens: x.finding.lens,
  title: x.finding.title,
  detail: x.finding.detail,
  suggestion: x.finding.suggestion,
  confidence: x.verdict.confidence,
  verifierNote: x.verdict.note
})).sort((a, b) => (order[a.severity] - order[b.severity]) || a.file.localeCompare(b.file) || (a.line - b.line))

log(`confirmed/adjusted: ${merged.length}, rejected(오탐): ${rejected.length}`)

return {
  pr: args && args.pr,
  confirmedCount: merged.length,
  rejectedCount: rejected.length,
  findings: merged,
  rejectedSummary: rejected.map(x => ({ file: x.finding.file, line: x.finding.line, title: x.finding.title, why: x.verdict.note }))
}
