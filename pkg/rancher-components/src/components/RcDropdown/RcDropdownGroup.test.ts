import { mount } from '@vue/test-utils';
import { RcDropdownGroup, RcDropdownItem } from '@components/RcDropdown';

describe('component: RcDropdownGroup', () => {
  it('exposes its children as a labelled group', () => {
    const wrapper = mount(RcDropdownGroup, { props: { label: 'Choose how to sign in' } });

    expect(wrapper.attributes('role')).toBe('group');
  });

  it('associates the group with its visible heading', () => {
    const wrapper = mount(RcDropdownGroup, { props: { label: 'Choose how to sign in' } });

    const labelledBy = wrapper.attributes('aria-labelledby');
    const heading = wrapper.find('.rc-dropdown-group-label');

    expect(labelledBy).toBeTruthy();
    expect(heading.attributes('id')).toBe(labelledBy);
    expect(heading.text()).toBe('Choose how to sign in');
  });

  it('gives sibling groups distinct heading ids so their labels do not collide', () => {
    const wrapper = mount({
      components: { RcDropdownGroup },
      template:   `
        <div>
          <rc-dropdown-group label="Providers" />
          <rc-dropdown-group label="Other" />
        </div>
      `,
    });

    const [first, second] = wrapper.findAllComponents(RcDropdownGroup);

    expect(first.attributes('aria-labelledby')).not.toBe(second.attributes('aria-labelledby'));
  });

  it('keeps nested items discoverable by the dropdown collection query', () => {
    // RcDropdown registers items with a descendant query for `[dropdown-menu-item]`,
    // so nesting inside a group must not hide them from keyboard navigation.
    const wrapper = mount({
      components: { RcDropdownGroup, RcDropdownItem },
      template:   `
        <rc-dropdown-group label="Providers">
          <rc-dropdown-item>Okta</rc-dropdown-item>
          <rc-dropdown-item>GitHub</rc-dropdown-item>
        </rc-dropdown-group>
      `,
    });

    expect(wrapper.element.querySelectorAll('[dropdown-menu-item]')).toHaveLength(2);
  });
});
