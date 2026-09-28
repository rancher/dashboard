import { shallowMount } from '@vue/test-utils';
import RcSeparator from './RcSeparator.vue';

describe('component: RcSeparator', () => {
  it('renders an hr element', () => {
    const wrapper = shallowMount(RcSeparator);

    expect(wrapper.element.tagName).toBe('HR');
  });

  it('hides the separator from the accessibility tree by default', () => {
    const wrapper = shallowMount(RcSeparator);

    expect(wrapper.attributes('role')).toBe('none');
    expect(wrapper.attributes('aria-orientation')).toBeUndefined();
  });

  it('exposes a horizontal separator role when it is not decorative', () => {
    const wrapper = shallowMount(RcSeparator, { props: { decorative: false } });

    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
  });

  it('exposes the orientation of a vertical separator when it is not decorative', () => {
    const wrapper = shallowMount(RcSeparator, { props: { decorative: false, orientation: 'vertical' } });

    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.attributes('aria-orientation')).toBe('vertical');
  });

  it('does not expose an orientation for a decorative vertical separator', () => {
    const wrapper = shallowMount(RcSeparator, { props: { orientation: 'vertical' } });

    expect(wrapper.attributes('role')).toBe('none');
    expect(wrapper.attributes('aria-orientation')).toBeUndefined();
  });

  it.each([
    ['horizontal' as const, false],
    ['vertical' as const, true],
  ])('applies the vertical class only for a vertical orientation: %s', (orientation, expected) => {
    const wrapper = shallowMount(RcSeparator, { props: { orientation } });

    expect(wrapper.classes().includes('vertical')).toBe(expected);
  });

  it('passes attributes through to the root element', () => {
    const wrapper = shallowMount(RcSeparator, { attrs: { class: 'ns-divider', 'data-testid': 'separator' } });

    expect(wrapper.classes()).toContain('ns-divider');
    expect(wrapper.attributes('data-testid')).toBe('separator');
  });
});
