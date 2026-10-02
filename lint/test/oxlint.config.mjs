import { createOxlintConfig } from "../index.mjs";

// 프리셋 룰만 대조하려고 oxlint 기본 카테고리는 끈다
export default {
  ...createOxlintConfig({
    effectAllowedFiles: ["**/external-sync/**"],
    andJoinedTerms: ["TermsAndConditions"],
    serverCommands: { files: ["**/server-command/**"], verbs: ["approve", "request"] },
  }),
  categories: { correctness: "off", suspicious: "off", pedantic: "off", style: "off", restriction: "off", perf: "off", nursery: "off" },
};
