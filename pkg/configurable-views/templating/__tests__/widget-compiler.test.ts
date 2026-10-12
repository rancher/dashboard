import { compileWidget } from '@pkg/configurable-views/templating/widget-compiler';
import { widgetHash } from '@pkg/configurable-views/templating/widget-hash';

const SOURCE = `<template><p class="x">{{ label }}</p></template>
<script>
export default { props: ['api'], computed: { label() { return 'hi ' + this.api; } } };
</script>
<style scoped>.x { color: var(--primary); }</style>`;

describe('compileWidget', () => {
  afterEach(() => document.head.querySelectorAll('[data-generated-widget]').forEach((el) => el.remove()));

  it('turns a single-file component into a component, its scoped styles in the page', () => {
    const { component, styles } = compileWidget(SOURCE);

    expect(typeof component.render).toBe('function');
    expect(component.props).toStrictEqual(['api']);
    expect(component.__scopeId).toMatch(/^data-v-/);
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain(`[${ component.__scopeId }]`);
  });

  it('gives a widget vue, and nothing else to import', () => {
    expect(() => compileWidget(`<template><p /></template><script>import { ref } from 'vue';\nexport default { setup() { return { a: ref(1) }; } };</script>`)).not.toThrow();
    expect(() => compileWidget(`<template><p /></template><script>import x from '@shell/store';\nexport default {};</script>`)).toThrow(/cannot be imported/);
    expect(document.head.querySelectorAll('[data-generated-widget]')).toHaveLength(0);
  });

  it('says what is wrong with a source that does not compile', () => {
    expect(() => compileWidget('<template><p></template>')).toThrow();
  });
});

describe('widgetHash', () => {
  // The browser's Web Crypto: jsdom has none, Node's is the same API
  beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', { value: require('crypto').webcrypto, configurable: true });
  });

  it('is the SHA-256 of the source, so any change to it is a different hash', async() => {
    expect(await widgetHash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await widgetHash('abc ')).not.toBe(await widgetHash('abc'));
  });
});
