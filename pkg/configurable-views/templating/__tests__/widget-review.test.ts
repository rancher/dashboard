import { reviewWidget } from '@pkg/configurable-views/templating/widget-review';

const sfc = (template: string, script = 'export default {};', style = '') => `<template>${ template }</template>\n<script>\n${ script }\n</script>\n<style scoped>\n${ style }\n</style>`;

describe('reviewWidget', () => {
  it('names the Rancher components a widget draws with, and finds nothing in one that only uses them', () => {
    const out = reviewWidget(sfc('<Card :title="t"><SortableTable :rows="rows" :headers="h" /><PercentageBar :model-value="50" /></Card>'));

    expect(out.components).toStrictEqual(['Card', 'SortableTable', 'PercentageBar']);
    expect(out.findings).toStrictEqual([]);
  });

  it('reads a template whole, slots and all', () => {
    const out = reviewWidget(sfc('<SortableTable :rows="r"><template #cell:n="{ row }"><RcCounterBadge :count="row.n" /></template></SortableTable><Tag>x</Tag>'));

    expect(out.components).toStrictEqual(['SortableTable', 'RcCounterBadge', 'Tag']);
  });

  it('flags what a widget built by hand', () => {
    const out = reviewWidget(sfc(
      '<div><table><tr><td>x</td></tr></table><div class="bar" :style="{ width: p + \'%\' }" /></div>',
      'export default {};',
      '.bar { background: #ff0000; }'
    ));

    expect(out.findings).toStrictEqual(['rawTable', 'handBar', 'hardColour']);
  });

  it('finds a bar sized from a property, however it is written', () => {
    expect(reviewWidget(sfc('<div class="fill" :style="{ width: i.percent + \'%\' }" />')).findings).toStrictEqual(['handBar']);
    // A template literal, written without one here: width: `${ p }%`
    expect(reviewWidget(sfc(`<div :style="{ width: \`$\{ p }%\` }" />`)).findings).toStrictEqual(['handBar']);
  });

  it('flags components it is not given, and reaching outside its api', () => {
    const out = reviewWidget(sfc('<ResourceTable />', 'export default { mounted() { this.$store.dispatch("x"); fetch("/v1"); } };'));

    expect(out.unknown).toStrictEqual(['ResourceTable']);
    expect(out.findings).toStrictEqual(['unknownComponent', 'outsideApi']);
  });

  it('flags an import other than vue, and a lot of CSS', () => {
    const css = Array.from({ length: 45 }, (_, i) => `.c${ i } { margin: 0; }`).join('\n');

    expect(reviewWidget(sfc('<p />', "import { ref } from 'vue';\nexport default {};")).findings).toStrictEqual([]);
    expect(reviewWidget(sfc('<p />', "import x from 'lodash';\nexport default {};", css)).findings).toStrictEqual(['muchCss', 'imports']);
  });
});
