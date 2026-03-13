import { mount } from '@vue/test-utils';
import RcSectionActions from './RcSectionActions.vue';
import type { ActionConfig } from './types';

// Stubs for child components to isolate unit tests
const RcButtonStub = {
  name:     'RcButton',
  props:    ['variant', 'size', 'leftIcon', 'ariaLabel'],
  emits:    ['click'],
  template: '<button class="rc-button" :data-variant="variant" :data-left-icon="leftIcon" :aria-label="ariaLabel" @click="$emit(\'click\', $event)"><slot /></button>',
};

const RcDropdownStub = {
  name:     'RcDropdown',
  template: '<div class="rc-dropdown"><slot /><slot name="dropdownCollection" /></div>',
};

const RcDropdownTriggerStub = {
  name:     'RcDropdownTrigger',
  template: '<button class="rc-dropdown-trigger"><slot /></button>',
};

const RcDropdownItemStub = {
  name:     'RcDropdownItem',
  props:    ['ariaLabel'],
  emits:    ['click'],
  template: '<div class="rc-dropdown-item" :aria-label="ariaLabel" @click="$emit(\'click\', $event)"><slot name="before" /><slot /></div>',
};

const RcIconStub = {
  name:     'RcIcon',
  props:    ['type', 'size'],
  template: '<span class="rc-icon" :data-type="type" />',
};

const globalStubs = {
  RcButton:          RcButtonStub,
  RcDropdown:        RcDropdownStub,
  RcDropdownTrigger: RcDropdownTriggerStub,
  RcDropdownItem:    RcDropdownItemStub,
  RcIcon:            RcIconStub,
};

describe('component: RcSectionActions', () => {
  function createWrapper(actions: ActionConfig[]) {
    return mount(RcSectionActions, {
      props:  { actions },
      global: { stubs: globalStubs },
    });
  }

  describe('with fewer than 3 actions', () => {
    it('should render all actions as primary buttons when 1 action is provided', () => {
      const action = jest.fn();
      const wrapper = createWrapper([{ label: 'Edit', action }]);

      const buttons = wrapper.findAll('.rc-button');

      expect(buttons).toHaveLength(1);
      expect(buttons[0].text()).toContain('Edit');
    });

    it('should render all actions as primary buttons when 2 actions are provided', () => {
      const wrapper = createWrapper([
        { label: 'Edit', action: jest.fn() },
        { label: 'Delete', action: jest.fn() },
      ]);

      expect(wrapper.findAll('.rc-button')).toHaveLength(2);
    });

    it('should not render the overflow dropdown when fewer than 3 actions', () => {
      const wrapper = createWrapper([
        { label: 'Edit', action: jest.fn() },
        { label: 'Delete', action: jest.fn() },
      ]);

      expect(wrapper.find('.rc-dropdown').exists()).toBe(false);
    });
  });

  describe('with 3 or more actions', () => {
    it('should render only the first 2 actions as primary buttons', () => {
      const wrapper = createWrapper([
        { label: 'A', action: jest.fn() },
        { label: 'B', action: jest.fn() },
        { label: 'C', action: jest.fn() },
      ]);

      const buttons = wrapper.findAll('.rc-button');

      expect(buttons).toHaveLength(2);
      expect(buttons[0].text()).toContain('A');
      expect(buttons[1].text()).toContain('B');
    });

    it('should render the overflow dropdown', () => {
      const wrapper = createWrapper([
        { label: 'A', action: jest.fn() },
        { label: 'B', action: jest.fn() },
        { label: 'C', action: jest.fn() },
      ]);

      expect(wrapper.find('.rc-dropdown').exists()).toBe(true);
    });

    it('should place remaining actions in the overflow dropdown', () => {
      const wrapper = createWrapper([
        { label: 'A', action: jest.fn() },
        { label: 'B', action: jest.fn() },
        { label: 'C', action: jest.fn() },
        { label: 'D', action: jest.fn() },
      ]);

      const dropdownItems = wrapper.findAll('.rc-dropdown-item');

      expect(dropdownItems).toHaveLength(2);
      expect(dropdownItems[0].text()).toContain('C');
      expect(dropdownItems[1].text()).toContain('D');
    });
  });

  describe('action callbacks', () => {
    it('should invoke the action callback when a primary button is clicked', async() => {
      const action = jest.fn();
      const wrapper = createWrapper([{ label: 'Edit', action }]);

      await wrapper.find('.rc-button').trigger('click');

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should invoke the correct action callback for overflow items', async() => {
      const actionC = jest.fn();
      const wrapper = createWrapper([
        { label: 'A', action: jest.fn() },
        { label: 'B', action: jest.fn() },
        { label: 'C', action: actionC },
      ]);

      await wrapper.find('.rc-dropdown-item').trigger('click');

      expect(actionC).toHaveBeenCalledTimes(1);
    });
  });

  describe('variant resolution', () => {
    it('should use "link" variant for actions with a label', () => {
      const wrapper = createWrapper([{ label: 'Edit', action: jest.fn() }]);

      expect(wrapper.find('.rc-button').attributes('data-variant')).toBe('link');
    });

    it('should use "link" variant for icon-only actions', () => {
      const wrapper = createWrapper([{ icon: 'copy', action: jest.fn() }]);

      expect(wrapper.find('.rc-button').attributes('data-variant')).toBe('link');
    });

    it('should render icon inside button for icon-only actions', () => {
      const wrapper = createWrapper([{ icon: 'copy', action: jest.fn() }]);

      expect(wrapper.find('.rc-button .rc-icon').exists()).toBe(true);
      expect(wrapper.find('.rc-button .rc-icon').attributes('data-type')).toBe('copy');
    });

    it('should use left-icon for labeled actions with an icon', () => {
      const wrapper = createWrapper([{
        label: 'Edit', icon: 'edit', action: jest.fn()
      }]);

      expect(wrapper.find('.rc-button').attributes('data-left-icon')).toBe('edit');
    });
  });

  describe('ariaLabel', () => {
    it('should set aria-label on a primary button when ariaLabel is provided', () => {
      const wrapper = createWrapper([{
        icon: 'copy', ariaLabel: 'Copy item', action: jest.fn()
      }]);

      expect(wrapper.find('.rc-button').attributes('aria-label')).toBe('Copy item');
    });

    it('should not set aria-label on a primary button when ariaLabel is omitted', () => {
      const wrapper = createWrapper([{ label: 'Edit', action: jest.fn() }]);

      expect(wrapper.find('.rc-button').attributes('aria-label')).toBeUndefined();
    });

    it('should set aria-label on overflow dropdown items when ariaLabel is provided', () => {
      const wrapper = createWrapper([
        { label: 'A', action: jest.fn() },
        { label: 'B', action: jest.fn() },
        {
          label: 'C', ariaLabel: 'Do C action', action: jest.fn()
        },
      ]);

      expect(wrapper.find('.rc-dropdown-item').attributes('aria-label')).toBe('Do C action');
    });
  });

  describe('empty actions', () => {
    it('should render nothing when actions array is empty', () => {
      const wrapper = createWrapper([]);

      expect(wrapper.findAll('.rc-button')).toHaveLength(0);
      expect(wrapper.find('.rc-dropdown').exists()).toBe(false);
    });
  });
});
