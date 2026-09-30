const PASCAL_CASE = /^[A-Z]/;

/**
 * export 되는 함수는 리턴 타입을 명시한다 (habits/04). 컴포넌트(PascalCase)는 제외한다.
 * explicit-module-boundary-types 는 이름으로 거를 수 없어서 리턴 타입 부분만 따로 둔다 — 파라미터 타입은 tsc 의 noImplicitAny 몫.
 */
export default {
  meta: {
    type: "suggestion",
    docs: { description: "export 되는 함수(컴포넌트 제외)는 리턴 타입을 명시한다 (habits/04)" },
    schema: [],
    messages: {
      missingReturnType: "'{{name}}' 의 리턴 타입을 명시한다 — 시그니처가 이름의 약속을 드러낸다 (habits/04)",
    },
  },
  create(context) {
    const handleExportedFunction = (nameNode, fnNode) => {
      if (fnNode.returnType || PASCAL_CASE.test(nameNode.name)) return;
      context.report({ node: nameNode, messageId: "missingReturnType", data: { name: nameNode.name } });
    };
    const isFunction = (node) => node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
    const handleDeclaration = (declaration) => {
      if (declaration?.type === "FunctionDeclaration" && declaration.id) {
        handleExportedFunction(declaration.id, declaration);
        return;
      }
      if (declaration?.type === "VariableDeclaration") {
        declaration.declarations
          .filter((declarator) => declarator.id.type === "Identifier" && isFunction(declarator.init))
          .forEach((declarator) => handleExportedFunction(declarator.id, declarator.init));
      }
    };

    return {
      ExportNamedDeclaration(node) {
        handleDeclaration(node.declaration);
      },
      ExportDefaultDeclaration(node) {
        handleDeclaration(node.declaration);
      },
    };
  },
};
