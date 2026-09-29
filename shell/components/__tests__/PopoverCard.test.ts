
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { compileStyle, parse } from '@vue/compiler-sfc';
import { mount } from '@vue/test-utils';
import PopoverCard from '@shell/components/PopoverCard.vue';

/**
 * PopoverCard.vue uses `<script setup>`, so `vue-tsc` cannot infer the exposed
 * refs as public instance members. Describe just the surface these tests drive.
 */
interface PopoverCardInstance {
  showPopover: boolean;
  focusOpen: boolean;
}

const asPopoverCard = (wrapper: { vm: unknown }): PopoverCardInstance => wrapper.vm as PopoverCardInstance;

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

// jsdom has no layout, so tests of how the component is laid out check its compiled CSS
const compileStyleRules = () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../PopoverCard.vue'), 'utf8');
  const { descriptor } = parse(source);
  const style = descriptor.styles[0];
  const { code, errors } = compileStyle({
    source:         style.content,
    filename:       'PopoverCard.vue',
    id:             'data-v-test',
    scoped:         style.scoped,
    preprocessLang: style.lang as 'scss',
  });

  if (errors.length) {
    throw errors[0];
  }

  const rules: { selector: string, decls: Record<string, string> }[] = [];

  postcss.parse(code).walkRules((rule) => {
    const decls: Record<string, string> = {};

    rule.walkDecls((decl) => {
      decls[decl.prop] = decl.value;
    });
    rule.selectors.forEach((selector) => rules.push({ selector, decls }));
  });

  return rules;
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
      expect(asPopoverCard(wrapper).showPopover).toBe(true);

      const root = wrapper.find('.popover-card-base');

      await root.trigger('mouseleave');
      expect(asPopoverCard(wrapper).showPopover).toBe(false);
    });

    it('should show on button click', async() => {
      const wrapper = createWrapper();
      const button = wrapper.find('button');

      await button.trigger('click');
      expect(asPopoverCard(wrapper).showPopover).toBe(true);
      expect(asPopoverCard(wrapper).focusOpen).toBe(true);
    });

    it('should hide on Escape keydown', async() => {
      const wrapper = createWrapper();

      // Open it first
      await wrapper.find('button').trigger('click');
      expect(asPopoverCard(wrapper).showPopover).toBe(true);
      expect(asPopoverCard(wrapper).focusOpen).toBe(true);

      // Trigger escape
      const root = wrapper.find('.popover-card-base');

      await root.trigger('keydown.escape');

      expect(asPopoverCard(wrapper).showPopover).toBe(false);
      expect(asPopoverCard(wrapper).focusOpen).toBe(false);
    });
  });

  describe('focus Trap', () => {
    it('should NOT setup focus trap on mouseenter', async() => {
      const wrapper = createWrapper();
      const target = wrapper.find('.popover-card-target');

      await target.trigger('mouseenter');
      await wrapper.vm.$nextTick();

      expect(asPopoverCard(wrapper).focusOpen).toBe(false);
      expect(mockFocusTrap).not.toHaveBeenCalled();
    });

    it('should setup focus trap when opened via click', async() => {
      const wrapper = createWrapper({ fallbackFocus: '#my-fallback' });
      const button = wrapper.find('button');

      await button.trigger('click');
      await wrapper.vm.$nextTick(); // Let watcher for `card` run

      expect(asPopoverCard(wrapper).focusOpen).toBe(true);
      expect(mockFocusTrap).toHaveBeenCalledTimes(1);

      // Check arguments passed to the composable
      const focusTrapOptions = mockFocusTrap.mock.calls[0][2];

      expect(focusTrapOptions.fallbackFocus).toBe('#my-fallback');
      expect(focusTrapOptions.setReturnFocus()).toStrictEqual(button.element);
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
      expect(asPopoverCard(wrapper).showPopover).toBe(true);
      expect(asPopoverCard(wrapper).focusOpen).toBe(true);

      // Click the button that uses the `close` slot prop
      await wrapper.find('.close-button').trigger('click');

      // Due to the bug, this should be true, not false
      expect(asPopoverCard(wrapper).showPopover).toBe(false);
      expect(asPopoverCard(wrapper).focusOpen).toBe(false);
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

describe('component: PopoverCard.vue hover bridge', () => {
  // The card closes on mouseleave of .popover-card-base. floating-vue leaves a gap between the link and the card, so
  // the card needs an invisible strip on the side facing the link, whichever side the card opens on

  it('should mount the card inside the element that closes it on mouseleave', async() => {
    const wrapper = mount(PopoverCard, {
      props:  { cardTitle: 'Test Title' },
      global: {
        stubs: {
          VDropdown: VDropdownStub, Card: true, RcButton: true
        }
      }
    });

    // The container is a template ref, so it's only passed down once the first render has set it
    await wrapper.vm.$nextTick();
    const container = wrapper.findComponent(VDropdownStub).vm.$attrs.container as HTMLElement;

    expect(container.classList.contains('popover-card-container')).toBe(true);
    expect(wrapper.find('.popover-card-base').element.contains(container)).toBe(true);
  });

  describe('styles', () => {
    const rules = compileStyleRules();

    // Declarations applied to the card's ::before, optionally only for one placement
    const bridgeDecls = (placement?: string) => rules
      .filter(({ selector }) => {
        const isCardBridge = selector.includes('.popover-card-container > .v-popper__popper') && selector.endsWith('::before');
        const placementMatch = selector.match(/\[data-popper-placement\^=['"]?(\w+)['"]?\]/);

        return isCardBridge && (placement ? placementMatch?.[1] === placement : !placementMatch);
      })
      .reduce((acc, { decls }) => ({ ...acc, ...decls }), {} as Record<string, string>);

    it('should render the bridge as an absolutely positioned pseudo-element', () => {
      expect(bridgeDecls()).toStrictEqual({ content: '""', position: 'absolute' });
    });

    // 7px = 1px card border + 5px floating-vue distance + 1px overlap on the link. Less leaves a hole next to the link
    it.each([
      ['bottom', {
        left: '0', right: '0', height: '7px', bottom: '100%'
      }],
      ['top', {
        left: '0', right: '0', height: '7px', top: '100%'
      }],
      ['left', {
        top: '0', bottom: '0', width: '7px', left: '100%'
      }],
      ['right', {
        top: '0', bottom: '0', width: '7px', right: '100%'
      }],
    ])('should put the bridge between the link and a card placed %p', (placement, expected) => {
      expect(bridgeDecls(placement)).toStrictEqual(expected);
    });
  });
});

describe('component: PopoverCard.vue keyboard button', () => {
  // The button only gets a width when it's focused. It mustn't take up space in the flow, or focusing it widens the
  // table cell the link is in and shifts the columns

  it('should render the button in an anchor after the default slot', () => {
    const wrapper = mount(PopoverCard, {
      props:  { cardTitle: 'Test Title' },
      slots:  { default: '<a class="link">name</a>' },
      global: {
        stubs: {
          VDropdown: VDropdownStub, Card: true, RcButton: { template: '<button><slot /></button>' }
        }
      }
    });
    const target = wrapper.find('.popover-card-target').element;
    const anchor = wrapper.find('.focus-button-anchor');

    expect(anchor.find('button').exists()).toBe(true);
    expect(target.children[0].classList.contains('link')).toBe(true);
    expect(target.children[1]).toBe(anchor.element);
  });

  describe('styles', () => {
    const rules = compileStyleRules();
    const decls = (className: string) => rules
      .filter(({ selector }) => selector.includes(className))
      .reduce((acc, { decls }) => ({ ...acc, ...decls }), {} as Record<string, string>);

    it('should give the anchor no width', () => {
      expect(decls('.focus-button-anchor')).toStrictEqual({
        position: 'relative', display: 'inline-block', width: '0', height: '100%', 'vertical-align': 'top'
      });
    });

    it('should lay the button out from the anchor instead of in the flow', () => {
      expect(decls('.rc-button.btn.focus-button')).toStrictEqual(expect.objectContaining({
        position: 'absolute', top: '50%', left: '4px', transform: 'translateY(-50%)'
      }));
    });
  });
});
