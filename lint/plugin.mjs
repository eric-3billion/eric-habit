import explicitReturnType from "./rules/explicit-return-type.mjs";
import functionVerbWhitelist from "./rules/function-verb-whitelist.mjs";
import noGeneralName from "./rules/no-general-name.mjs";
import noSentinelArithmetic from "./rules/no-sentinel-arithmetic.mjs";
import noSuspenseQueryWaterfall from "./rules/no-suspense-query-waterfall.mjs";
import noThinQueryHook from "./rules/no-thin-query-hook.mjs";
import propsInlineTypeSingleLine from "./rules/props-inline-type-single-line.mjs";
import syntaxSelectors from "./rules/syntax-selectors.mjs";
import verbReturnContract from "./rules/verb-return-contract.mjs";

/** oxlint JS 플러그인 `eric` — config 의 jsPlugins 로 로드된다. */
export default {
  meta: { name: "eric" },
  rules: {
    "restricted-syntax": syntaxSelectors,
    "discouraged-syntax": syntaxSelectors,
    "explicit-return-type": explicitReturnType,
    "function-verb-whitelist": functionVerbWhitelist,
    "no-general-name": noGeneralName,
    "no-sentinel-arithmetic": noSentinelArithmetic,
    "no-suspense-query-waterfall": noSuspenseQueryWaterfall,
    "no-thin-query-hook": noThinQueryHook,
    "props-inline-type-single-line": propsInlineTypeSingleLine,
    "verb-return-contract": verbReturnContract,
  },
};
