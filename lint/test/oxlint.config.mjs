import { createOxlintConfig } from "../index.mjs";

// 프리셋 룰만 대조하려고 oxlint 기본 카테고리는 끈다
export default {
  ...createOxlintConfig({
    effectAllowedFiles: ["**/external-sync/**"],
    andJoinedTerms: ["TermsAndConditions"],
    apiFiles: ["**/api/**"],
    domainVerbs: [{ verb: "signOut", contract: "세션을 끝내는 쓰기 — 토큰 폐기 + 로컬 세션 제거" }],
  }),
  categories: { correctness: "off", suspicious: "off", pedantic: "off", style: "off", restriction: "off", perf: "off", nursery: "off" },
};
