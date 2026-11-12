import { parseSync } from '@babel/core';
import { isFunction, isMember, walk } from '@shell/vite/ast.mjs';

const parse = (code: string) => {
  const parsed = parseSync(code, {
    sourceType: 'module', configFile: false, babelrc: false, parserOpts: { plugins: ['estree'] }
  });

  if (!parsed) {
    throw new Error('Could not parse the code');
  }

  return parsed.program;
};

const expressionOf = (code: string): any => (parse(code).body[0] as any).expression;

describe('fx: walk', () => {
  it('should visit each node before the nodes inside it', () => {
    const visited: string[] = [];

    walk(parse('a(b);'), (node: any) => visited.push(node.name || node.type));

    expect(visited).toStrictEqual(['Program', 'ExpressionStatement', 'CallExpression', 'a', 'b']);
  });

  it('should say which nodes are inside a function', () => {
    const inFunctions: Record<string, boolean> = {};

    walk(parse('outer(() => inner());'), (node: any, inFunction: boolean) => {
      if (node.type === 'Identifier') {
        inFunctions[node.name] = inFunction;
      }
    });

    expect(inFunctions).toStrictEqual({ outer: false, inner: true });
  });
});

describe('fx: isMember', () => {
  it.each([
    ['Promise.resolve', 'resolve', 'Promise', true],
    ['Promise.resolve', 'resolve', undefined, true],
    ['Promise.reject', 'resolve', 'Promise', false],
    ['other.resolve', 'resolve', 'Promise', false],
    ['Promise[\'resolve\']', 'resolve', 'Promise', false],
  ])('should say whether %s is the member %p of %p', (code, property, object, expected) => {
    expect(isMember(expressionOf(`${ code };`), property, object)).toStrictEqual(expected);
  });
});

describe('fx: isFunction', () => {
  it.each([
    ['an arrow function', '() => 1;', true],
    ['a function expression', '(function() {});', true],
    ['a call', 'a();', false],
  ])('should say whether %s is a function', (_, code, expected) => {
    expect(isFunction(expressionOf(code))).toStrictEqual(expected);
  });
});
