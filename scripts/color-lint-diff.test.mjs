import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compare, formatEntries, parseBaseline } from './color-lint-diff.mjs';

const THEME = 'shell/assets/styles/themes/_light.scss';
const BUTTON = 'shell/components/Button.vue';

const baseline = [
  {
    file: THEME, line: 10, color: '#141419'
  },
  {
    file: THEME, line: 20, color: '#FFF'
  },
  {
    file: BUTTON, line: 5, color: 'darken($primary, 10%)'
  },
];

describe('compare', () => {
  it('passes when the baselined colors have only moved', () => {
    const moved = baseline.map((color) => ({ ...color, line: color.line + 3 }));

    assert.deepStrictEqual(compare(baseline, moved), {
      added: [], newCount: 0, fixedCount: 0
    });
  });

  it('reports a color the file did not have', () => {
    const current = [...baseline, {
      file: THEME, line: 30, color: '#123456'
    }];

    assert.deepStrictEqual(compare(baseline, current).added, [{
      file: THEME, color: '#123456', lines: [30], allowed: 0
    }]);
  });

  it('reports a second copy of a baselined color with every line it is on', () => {
    const current = [...baseline, {
      file: THEME, line: 31, color: '#FFF'
    }];

    assert.deepStrictEqual(compare(baseline, current), {
      added: [{
        file: THEME, color: '#FFF', lines: [20, 31], allowed: 1
      }],
      newCount:   1,
      fixedCount: 0,
    });
  });

  it('reports a baselined color that appears in another file', () => {
    const current = [...baseline, {
      file: BUTTON, line: 9, color: '#141419'
    }];

    assert.strictEqual(compare(baseline, current).newCount, 1);
  });

  it('counts the baselined colors that are gone', () => {
    assert.deepStrictEqual(compare(baseline, baseline.slice(1)), {
      added: [], newCount: 0, fixedCount: 1
    });
  });
});

describe('parseBaseline', () => {
  it('reads back what formatEntries writes, skipping comments and blank lines', () => {
    const text = ['# Total colors: 3', '', ...formatEntries(baseline), ''].join('\n');

    assert.deepStrictEqual(parseBaseline(text), baseline);
  });

  it('keeps a color that contains colons and spaces', () => {
    assert.deepStrictEqual(parseBaseline(`${ BUTTON }:7: rgba(var(--x), 0.5)`), [{
      file: BUTTON, line: 7, color: 'rgba(var(--x), 0.5)'
    }]);
  });

  it('rejects a line that is not file:line: color', () => {
    assert.throws(() => parseBaseline('shell/x.scss #fff'), /Malformed baseline line/);
  });
});
