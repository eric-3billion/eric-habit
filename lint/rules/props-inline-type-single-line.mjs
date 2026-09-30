const PASCAL_CASE = /^[A-Z]/;

export default {
  meta: {
    type: "suggestion",
    docs: { description: "컴포넌트 props 인라인 타입은 한 줄에 들어가는 것만 허용 (habits/01 §7)" },
    schema: [],
    messages: {
      multiline: "props 인라인 타입이 한 줄을 넘는다 — XxxProps 인터페이스로 뺀다 (habits/01 §7)",
    },
  },
  create(context) {
    const handlePropsAnnotation = (fnNode) => {
      const annotation = fnNode.params[0]?.typeAnnotation?.typeAnnotation;
      if (annotation?.type !== "TSTypeLiteral") return;
      if (annotation.loc.start.line !== annotation.loc.end.line) {
        context.report({ node: annotation, messageId: "multiline" });
      }
    };
    const isFunction = (node) => node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";

    return {
      FunctionDeclaration(node) {
        if (node.id && PASCAL_CASE.test(node.id.name)) handlePropsAnnotation(node);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && PASCAL_CASE.test(node.id.name) && isFunction(node.init)) handlePropsAnnotation(node.init);
      },
      // 정적 프로퍼티 컴포넌트: VariantForm.error = ({ resetError }: { … }) => …
      AssignmentExpression(node) {
        const isComponentStatic = node.left.type === "MemberExpression" && node.left.object.type === "Identifier" && PASCAL_CASE.test(node.left.object.name);
        if (isComponentStatic && isFunction(node.right)) handlePropsAnnotation(node.right);
      },
    };
  },
};
