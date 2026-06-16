
import { mount } from '@vue/test-utils';
import PopoverCard from '@shell/components/PopoverCard.vue';

const mockFocusTrap = jest.fn();

jest.mock('@shell/composables/focusTrap', () => ({
  ...jest.requireActual('@shell/composables/focusTrap'), // Keep DEFAULT_FOCUS_TRAP_OPTS
  useWatcherBasedSetupFocusTrapWithDestroyIncluded: (...args: any[]) => mockFocusTrap(...args),
}));

const VDropdownStub = {
  props:    ['shown'],
  template: `
    <div>
      <slot />
      <div v-if="shown">
        <slot name="popper" />
      </div>
    </div>
  `,
};

describe('component: PopoverCard.vue', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount(PopoverCard, {
      props: {
        cardTitle: 'Test Title',
        ...props,
      },
      slots,
      global: {
        stubs: {
          VDropdown: VDropdownStub,
          Card:      {
            template: `
              <div>
                <slot name="heading-action" />
                <slot />
              </div>
            `,
          },
          RcButton: { template: '<button><slot /></button>' },
        },
      }
    });
  };

  beforeEach(() => {
    mockFocusTrap.mockClear();
  });

  describe('props', () => {
    it('should use default props', () => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      expect(button.attributes('aria-label')).toBe('Show more');
    });

    it('should accept and render custom props', () => {
      const props = {
        cardTitle:            'My Custom Title',
        showPopoverAriaLabel: 'Click for details'
      };
      const wrapper = createWrapper(props);
      const button = wrapper.find('button');

      expect(button.attributes('aria-label')).toBe(props.showPopoverAriaLabel);
      // Note: cardTitle is passed to the Card component inside the popper,
      // which is only rendered when the popover is shown.
    });
  });

  describe('popover Visibility', () => {
    it('should not be visible initially', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[id="popover-card"]').exists()).toBe(false);
    });

    it('should show on mouseenter and hide on mouseleave', async() => {
      const wrapper = createWrapper();
      const target = wrapper.find('.popover-card-target');

      await target.trigger('mouseenter');
      expect(wrapper.vm.showPopover).toBe(true);

      const root = wrapper.find('.popover-card-base');

      await root.trigger('mouseleave');
      expect(wrapper.vm.showPopover).toBe(false);
    });

    it('should show on button click', async() => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('click');
      expect(wrapper.vm.showPopover).toBe(true);
      expect(wrapper.vm.focusOpen).toBe(true);
    });

    it('should hide on Escape keydown', async() => {
      const wrapper = createWrapper();

      // Open it first
      await wrapper.find('button').trigger('click');
      expect(wrapper.vm.showPopover).toBe(true);
      expect(wrapper.vm.focusOpen).toBe(true);

      // Trigger escape
      const root = wrapper.find('.popover-card-base');

      await root.trigger('keydown.escape');

      expect(wrapper.vm.showPopover).toBe(false);
      expect(wrapper.vm.focusOpen).toBe(false);
    });
  });

  describe('focus Trap', () => {
    it('should NOT setup focus trap on mouseenter', async() => {
      const wrapper = createWrapper();
      const target = wrapper.find('.popover-card-target');

      await target.trigger('mouseenter');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.focusOpen).toBe(false);
      expect(mockFocusTrap).not.toHaveBeenCalled();
    });

    it('should setup focus trap when opened via click', async() => {
      const wrapper = createWrapper({ fallbackFocus: '#my-fallback' });
      const button = wrapper.find('button');

      await button.trigger('click');
      await wrapper.vm.$nextTick(); // Let watcher for `card` run

      expect(wrapper.vm.focusOpen).toBe(true);
      expect(mockFocusTrap).toHaveBeenCalledTimes(1);

      // Check arguments passed to the composable
      const focusTrapOptions = mockFocusTrap.mock.calls[0][2];

      expect(focusTrapOptions.fallbackFocus).toBe('#my-fallback');
      expect(focusTrapOptions.setReturnFocus()).toBe('.focus-button');
    });
  });

  describe('slots', () => {
    it('should render the default slot content', () => {
      const wrapper = createWrapper({}, { default: '<span class="default-slot-content">Hello</span>' });

      expect(wrapper.find('.default-slot-content').exists()).toBe(true);
      expect(wrapper.find('.default-slot-content').text()).toBe('Hello');
    });

    it('should render the card-body slot content', async() => {
      const wrapper = createWrapper({}, { 'card-body': '<div class="card-body-content">Card Body</div>' });

      // Open popover to render the slot
      await wrapper.find('button').trigger('click');

      expect(wrapper.find('.card-body-content').exists()).toBe(true);
      expect(wrapper.find('.card-body-content').text()).toBe('Card Body');
    });

    it('should pass a close function to the heading-action slot', async() => {
      const wrapper = createWrapper({}, {
        'heading-action': `
          <template #heading-action="{ close }">
            <button class="close-button" @click="close">Close</button>
          </template>
        `
      });

      // Open popover
      await wrapper.find('button').trigger('click');
      expect(wrapper.vm.showPopover).toBe(true);
      expect(wrapper.vm.focusOpen).toBe(true);

      // Click the button that uses the `close` slot prop
      await wrapper.find('.close-button').trigger('click');

      // Due to the bug, this should be true, not false
      expect(wrapper.vm.showPopover).toBe(false);
      expect(wrapper.vm.focusOpen).toBe(false);
    });

    it('should allow overriding the entire card via the card slot', async() => {
      const wrapper = createWrapper({}, { card: '<div class="custom-card">My Custom Card</div>' });

      // Open popover
      await wrapper.find('button').trigger('click');

      expect(wrapper.find('.custom-card').exists()).toBe(true);
      expect(wrapper.find('.custom-card').text()).toBe('My Custom Card');
      // The default Card component should not be rendered
      expect(wrapper.find('[id="popover-card"]').exists()).toBe(false);
    });
  });
});
