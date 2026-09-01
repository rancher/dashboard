import { shallowMount, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import Select from '@shell/components/form/Select.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const SelectComponent = Select as ReturnType<typeof defineComponent>;

describe('select.vue', () => {
  let consoleWarn: any;

  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    // eslint-disable-next-line no-console
    consoleWarn = console.warn;
  });

  // eslint-disable-next-line jest/no-hooks
  afterAll(() => {
    // eslint-disable-next-line no-console
    console.warn = consoleWarn;
  });

  it('does not throw a warning in the console', () => {
    jest.spyOn(console, 'warn').mockImplementation();

    shallowMount(SelectComponent);

    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const label = 'Foo';
    const value = 'foo';
    const ariaDescribedById = 'some-described-by-id';
    const ariaLabelText = 'some-aria-label';

    const wrapper = shallowMount(SelectComponent, {
      props: {
        value,
        options: [
          { label, value },
        ],
      },
      attrs: {
        'aria-describedby': ariaDescribedById,
        'aria-label':       ariaLabelText,
      }
    });

    const labeledSelectContainer = wrapper.find('.unlabeled-select');
    const ariaExpanded = labeledSelectContainer.attributes('aria-expanded');
    const ariaDescribedBy = labeledSelectContainer.attributes('aria-describedby');
    const ariaLabel = labeledSelectContainer.attributes('aria-label');

    const vSelectInput = wrapper.find('.inline');

    expect(ariaExpanded).toBe('false');
    expect(ariaDescribedBy).toBe(ariaDescribedById);
    expect(ariaLabel).toBe(ariaLabelText);

    // make sure it's hardcoded to a "neutral" value so that
    // in the current architecture of the component
    // screen readers won't pick up the default "Select option" aria-label
    // from the library
    expect(vSelectInput.attributes('aria-label')).toBe('-');
  });

  it('pressing space key while focused on search should not prevent event propagation', async() => {
    const value = 'value-1';
    const options = [
      { label: 'label-1', value: 'value-1' },
      { label: 'label-2', value: 'value-2' },
    ];

    const wrapper = mount(SelectComponent, {
      props: {
        value,
        label:      'some-label',
        options,
        searchable: true,
        loading:    false,
      }
    });

    const mockEvent = { preventDefault: jest.fn() };
    const spyFocus = jest.spyOn(wrapper.vm, 'focusSearch');
    const spyPreventDefault = jest.spyOn(mockEvent, 'preventDefault');

    const input = wrapper.find('.unlabeled-select');

    // open unlabeled-select first
    await input.trigger('keydown.enter');

    // mimic pressing space on search box inside v-select
    const search = input.find('input');

    await search.trigger('keydown.space', mockEvent);

    // eslint-disable-next-line
    expect(spyFocus).toHaveBeenCalled();
    expect(spyPreventDefault).not.toHaveBeenCalled();
  });

  describe('function: clickSelect', () => {
    it('should open dropdown when clickSelect is called and not disabled', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          disabled: false,
          loading:  false,
          mode:     _EDIT
        }
      });

      expect(wrapper.vm.isOpen).toBe(false);

      wrapper.vm.clickSelect();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should not open dropdown when clickSelect is called and disabled', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          disabled: true,
          loading:  false,
          mode:     _EDIT
        }
      });

      expect(wrapper.vm.isOpen).toBe(false);

      wrapper.vm.clickSelect();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should not open dropdown when loading is true', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          disabled: false,
          loading:  true,
          mode:     _EDIT
        }
      });

      expect(wrapper.vm.isOpen).toBe(false);

      wrapper.vm.clickSelect();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should not open dropdown when mode is _VIEW', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          disabled: false,
          loading:  false,
          mode:     _VIEW
        }
      });

      expect(wrapper.vm.isOpen).toBe(false);

      wrapper.vm.clickSelect();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should not clear value if disabled', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          multiple: true,
          disabled: true,
          mode:     _EDIT
        }
      });

      const clearBtn = wrapper.find('.vs__deselect');

      expect(clearBtn.exists()).toBe(true);

      await clearBtn.trigger('mousedown');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toBeUndefined();
      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should not open dropdown when remove button is clicked', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(Select, {
        props: {
          value,
          options:  [{ label, value }],
          multiple: true,
          mode:     _EDIT
        }
      });

      expect(wrapper.vm.isOpen).toBe(false);

      const clearBtn = wrapper.find('.vs__deselect');

      await clearBtn.trigger('mousedown');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toBeUndefined();
      expect(wrapper.vm.isOpen).toBe(false);
    });
  });
});
