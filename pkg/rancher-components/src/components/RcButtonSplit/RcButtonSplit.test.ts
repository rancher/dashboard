import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import RcButtonSplit from './RcButtonSplit.vue';
import { ButtonVariant, ButtonSize } from '@components/RcButton/types';

// v-dropdown is provided by floating-vue and must be mocked in unit tests.
// The default slot is the trigger anchor; the popper slot is the dropdown content.
const vDropdownMock = defineComponent({
  template: `
    <div>
      <slot />
      <slot name="popper" />
    </div>
  `,
});

const globalConfig = { global: { components: { 'v-dropdown': vDropdownMock } } };

// RcButton and RcDropdownTrigger both use single-root attribute inheritance, so
// the class added to the component falls through to the rendered <button> element.
// Selectors like '.rc-button-split-action' refer directly to the <button> element.

describe('rcButtonSplit.vue', () => {
  it('renders the main action button', () => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    expect(wrapper.find('.rc-button-split-action').exists()).toBe(true);
  });

  it('renders the dropdown trigger', () => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    expect(wrapper.find('.rc-button-split-trigger').exists()).toBe(true);
  });

  it('emits click when the main action button is clicked', async() => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    await wrapper.find('.rc-button-split-action').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('click')![0][0]).toBeInstanceOf(MouseEvent);
  });

  it('does not emit click when the dropdown trigger is clicked', async() => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    await wrapper.find('.rc-button-split-trigger').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  describe('variant prop', () => {
    it.each([
      ['primary', 'variant-primary'],
      ['secondary', 'variant-secondary'],
      ['tertiary', 'variant-tertiary'],
    ] as [ButtonVariant, string][])('applies %s variant class to the action button', (variant, className) => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { variant } });

      expect(wrapper.find('.rc-button-split-action').classes()).toContain(className);
    });

    it.each([
      ['primary', 'variant-primary'],
      ['secondary', 'variant-secondary'],
      ['tertiary', 'variant-tertiary'],
    ] as [ButtonVariant, string][])('applies %s variant class to the dropdown trigger button', (variant, className) => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { variant } });

      expect(wrapper.find('.rc-button-split-trigger').classes()).toContain(className);
    });
  });

  describe('size prop', () => {
    it.each([
      ['small', 'btn-small'],
      ['medium', 'btn-medium'],
      ['large', 'btn-large'],
    ] as [ButtonSize, string][])('applies %s size class to the action button', (size, className) => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { size } });

      expect(wrapper.find('.rc-button-split-action').classes()).toContain(className);
    });

    it.each([
      ['small', 'btn-small'],
      ['medium', 'btn-medium'],
      ['large', 'btn-large'],
    ] as [ButtonSize, string][])('applies %s size class to the dropdown trigger button', (size, className) => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { size } });

      expect(wrapper.find('.rc-button-split-trigger').classes()).toContain(className);
    });
  });

  describe('slots', () => {
    it('renders default slot content in the main button', () => {
      const wrapper = mount(RcButtonSplit, {
        ...globalConfig,
        slots: { default: 'Save' },
      });

      expect(wrapper.find('.rc-button-split-action').text()).toContain('Save');
    });

    it('renders before slot content in the main button', () => {
      const wrapper = mount(RcButtonSplit, {
        ...globalConfig,
        slots: {
          default: 'Save',
          before:  '<span class="before-content">Before</span>',
        },
      });

      expect(wrapper.find('.rc-button-split-action .before-content').exists()).toBe(true);
    });

    it('renders after slot content in the main button', () => {
      const wrapper = mount(RcButtonSplit, {
        ...globalConfig,
        slots: {
          default: 'Save',
          after:   '<span class="after-content">After</span>',
        },
      });

      expect(wrapper.find('.rc-button-split-action .after-content').exists()).toBe(true);
    });

    it('renders dropdownCollection slot content', () => {
      const wrapper = mount(RcButtonSplit, {
        ...globalConfig,
        slots: { dropdownCollection: '<div class="dropdown-item-test">Item 1</div>' },
      });

      expect(wrapper.find('.dropdown-item-test').exists()).toBe(true);
      expect(wrapper.find('.dropdown-item-test').text()).toStrictEqual('Item 1');
    });
  });

  it('dropdown trigger has aria-haspopup="menu" attribute', () => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    expect(wrapper.find('.rc-button-split-trigger').attributes('aria-haspopup')).toBe('menu');
  });

  it('emits update:open when dropdown open state changes', async() => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    await wrapper.findComponent({ name: 'RcDropdown' }).vm.$emit('update:open', true);

    expect(wrapper.emitted('update:open')).toHaveLength(1);
    expect(wrapper.emitted('update:open')![0]).toStrictEqual([true]);
  });

  it('applies default variant "primary" when no variant is provided', () => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    expect(wrapper.find('.rc-button-split-action').classes()).toContain('variant-primary');
  });

  it('applies default size "medium" when no size is provided', () => {
    const wrapper = mount(RcButtonSplit, globalConfig);

    expect(wrapper.find('.rc-button-split-action').classes()).toContain('btn-medium');
  });

  describe('aria label props', () => {
    it('ariaLabel is applied to the action button', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { ariaLabel: 'Save document' } });

      expect(wrapper.find('.rc-button-split-action').attributes('aria-label')).toBe('Save document');
    });

    it('ariaLabel is absent from the trigger button', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { ariaLabel: 'Save document' } });

      expect(wrapper.find('.rc-button-split-trigger').attributes('aria-label')).toBeUndefined();
    });

    it('ariaLabelTrigger is applied to the trigger button', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { ariaLabelTrigger: 'More save options' } });

      expect(wrapper.find('.rc-button-split-trigger').attributes('aria-label')).toBe('More save options');
    });

    it('ariaLabelTrigger is absent from the action button', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { ariaLabelTrigger: 'More save options' } });

      expect(wrapper.find('.rc-button-split-action').attributes('aria-label')).toBeUndefined();
    });

    it('ariaLabelDropdown is forwarded to RcDropdown', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { ariaLabelDropdown: 'Save actions' } });

      expect(wrapper.findComponent({ name: 'RcDropdown' }).props('ariaLabel')).toBe('Save actions');
    });
  });

  describe('items prop', () => {
    const items = [
      { id: 'draft', label: 'Save as Draft' },
      { id: 'template', label: 'Save as Template' },
      { id: 'discard', label: 'Discard Changes' },
    ];

    it('renders an RcDropdownItem for each entry in items', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { items } });

      const dropdownItems = wrapper.findAllComponents({ name: 'RcDropdownItem' });

      expect(dropdownItems).toHaveLength(3);
    });

    it('renders each item\'s label text', () => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { items } });

      const dropdownItems = wrapper.findAllComponents({ name: 'RcDropdownItem' });

      expect(dropdownItems[0].text()).toContain('Save as Draft');
      expect(dropdownItems[1].text()).toContain('Save as Template');
      expect(dropdownItems[2].text()).toContain('Discard Changes');
    });

    it('emits select with the item id when a prop item is clicked', async() => {
      const wrapper = mount(RcButtonSplit, { ...globalConfig, props: { items } });

      await wrapper.findAllComponents({ name: 'RcDropdownItem' })[0].trigger('click');

      expect(wrapper.emitted('select')).toHaveLength(1);
      expect(wrapper.emitted('select')![0]).toStrictEqual(['draft']);
    });

    it('does not emit select when no items prop is provided', async() => {
      const wrapper = mount(RcButtonSplit, globalConfig);

      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it('renders both prop items and dropdownCollection slot content when both are supplied', () => {
      const wrapper = mount(RcButtonSplit, {
        ...globalConfig,
        props: { items: [{ id: 'draft', label: 'Save as Draft' }] },
        slots: { dropdownCollection: '<div class="slot-item">Slot Item</div>' },
      });

      expect(wrapper.findAllComponents({ name: 'RcDropdownItem' })).toHaveLength(1);
      expect(wrapper.find('.slot-item').exists()).toBe(true);
      expect(wrapper.find('.slot-item').text()).toStrictEqual('Slot Item');
    });
  });
});
