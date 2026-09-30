const CONTAINER_SUFFIX = /(Config|Options|Context)$/;

export default {
  meta: {
    type: "suggestion",
    docs: { description: "그릇 이름(*Config·*Options·*Context)에 내용이 하나뿐이면 그 하나를 이름에 박는다 (habits/00)" },
    schema: [],
    messages: {
      singleMember: "'{{name}}' 은 여러 개를 담는다고 주장하는데 멤버가 하나뿐이다 — 남은 하나를 이름에 박는다 (habits/00)",
    },
  },
  create(context) {
    const handleContainerMembers = (nameNode, members) => {
      if (CONTAINER_SUFFIX.test(nameNode.name) && members.length === 1) {
        context.report({ node: nameNode, messageId: "singleMember", data: { name: nameNode.name } });
      }
    };
    const handleFunctionReturnType = (nameNode, fnNode) => {
      const returnType = fnNode.returnType?.typeAnnotation;
      if (returnType?.type === "TSTypeLiteral") handleContainerMembers(nameNode, returnType.members);
    };

    return {
      TSInterfaceDeclaration(node) {
        handleContainerMembers(node.id, node.body.body);
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation.type === "TSTypeLiteral") handleContainerMembers(node.id, node.typeAnnotation.members);
      },
      FunctionDeclaration(node) {
        if (node.id) handleFunctionReturnType(node.id, node);
      },
      VariableDeclarator(node) {
        const isFunctionInit = node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression";
        if (node.id.type === "Identifier" && isFunctionInit) handleFunctionReturnType(node.id, node.init);
      },
    };
  },
};
