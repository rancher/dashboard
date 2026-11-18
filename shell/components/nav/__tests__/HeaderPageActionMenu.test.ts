import { shallowMount } from '@vue/test-utils';
import { useStore } from 'vuex';
import HeaderPageActionMenu from '@shell/components/nav/HeaderPageActionMenu.vue';

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: jest.fn(),
}));

const mockStore = {
  getters:  { pageActions: [] },
  dispatch: jest.fn(),
};

describe('component: HeaderPageActionMenu', () => {
  beforeEach(() => {
    (useStore as jest.Mock).mockReturnValue(mockStore);
  });

  it('should pass button-aria-label from nav.actionMenu.label to the dropdown', () => {
    const wrapper = shallowMount(HeaderPageActionMenu);
    const menu = wrapper.find('rc-dropdown-menu-stub');

    // DOM lowercases attribute names, so buttonAriaLabel becomes buttonarialabel
    expect(menu.attributes('buttonarialabel')).toBe('%nav.actionMenu.label%');
  });

  it('should not include "menu" in the button-aria-label', () => {
    const wrapper = shallowMount(HeaderPageActionMenu);
    const menu = wrapper.find('rc-dropdown-menu-stub');

    // The word "menu" is already conveyed by aria-haspopup and should not
    // appear in the label to avoid redundant announcements by screen readers.
    expect(menu.attributes('buttonarialabel')).not.toContain('menu');
  });
});
