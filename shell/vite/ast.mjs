const FUNCTIONS = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];

export const isFunction = (node) => FUNCTIONS.includes(node?.type);

/**
 * Whether an ESTree node is `object.property`, or `<anything>.property` when no object name is given.
 *
 * @param {object} node
 * @param {string} property
 * @param {string} [object]
 */
export const isMember = (node, property, object) => node?.type === 'MemberExpression' && !node.computed && node.property.name === property && (!object || node.object.name === object);

function visitAll(node, visit, inFunction) {
  if (!node || typeof node.type !== 'string') {
    return;
  }

  visit(node, inFunction);

  const nested = inFunction || isFunction(node);

  Object.values(node).forEach((value) => {
    (Array.isArray(value) ? value : [value]).forEach((child) => {
      if (child && typeof child === 'object') {
        visitAll(child, visit, nested);
      }
    });
  });
}

/**
 * Visit an ESTree node and every node inside it, each node before the nodes inside it. `visit` is given each node and
 * whether it is inside a function: whether any node from the one the walk started at down to the node's parent is one.
 *
 * @param {object} node
 * @param {(node: object, inFunction: boolean) => void} visit
 */
export function walk(node, visit) {
  visitAll(node, visit, false);
}
