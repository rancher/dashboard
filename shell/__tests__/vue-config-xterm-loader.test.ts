import { runInNewContext } from 'vm';
import xtermLoader from '@shell/vue-config-xterm-loader';

describe('vue-config-xterm-loader', () => {
  it('declares a module level process before the source', () => {
    expect(xtermLoader('const a = 1;')).toStrictEqual('var process;const a = 1;');
  });

  it('keeps the same number of lines', () => {
    const source = 'line1\nline2\nline3';

    expect(xtermLoader(source).split('\n')).toHaveLength(3);
  });

  it('hides the process polyfill from the xterm node check', () => {
    const source = 'return typeof process !== "undefined" && "title" in process;';
    // Webpack wraps each module in a function, so run the result inside one too
    const isNode = runInNewContext(`(function() { ${ xtermLoader(source) } })();`, { process: { title: 'browser' } });

    expect(isNode).toStrictEqual(false);
  });
});
