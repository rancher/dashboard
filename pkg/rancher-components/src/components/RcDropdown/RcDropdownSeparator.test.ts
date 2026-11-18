import { mount } from '@vue/test-utils';
import { RcDropdownSeparator } from '@components/RcDropdown';

describe('component: RcDropdownSeparator', () => {
  it('renders a meaningful horizontal separator for menu and listbox contexts', () => {
    const wrapper = mount(RcDropdownSeparator);

    expect(wrapper.element.tagName).toBe('HR');
    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
  });

  it('passes attributes through to the underlying separator', () => {
    const wrapper = mount(RcDropdownSeparator, { attrs: { class: 'ns-divider' } });

    expect(wrapper.classes()).toContain('ns-divider');
  });
});
