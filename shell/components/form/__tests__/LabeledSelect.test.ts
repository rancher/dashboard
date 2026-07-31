import { mount } from '@vue/test-utils';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { defineComponent } from 'vue';

describe('component: LabeledSelect', () => {
  describe('should display correct label', () => {
    it('given an existing value and option', () => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
        props: {
          value,
          options: [
            { label, value },
          ],
        }
      });

      // Component is from a library and class is not going to be changed
      expect(wrapper.find('.vs__selected').text()).toBe(label);
    });

    it('using value as label if no options', () => {
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
        props: {
          value,
          options: [],
        }
      });

      // Component is from a library and class is not going to be changed
      expect(wrapper.find('.vs__selected').text()).toBe(value);
    });

    it('using custom key as label for option object', () => {
      const value = 'foo';
      const label = 'Foo';
      const customLabelKey = 'bananas';
      const wrapper = mount(LabeledSelect, {
        props: {
          value,
          optionLabel: customLabelKey,
          options:     [{
            [customLabelKey]: label,
            value
          }],
        }
      });

      // Component is from a library and class is not going to be changed
      expect(wrapper.find('.vs__selected').text()).toBe(label);
    });

    it('translating localized cases', () => {
      const value = 'foo';
      const translation = 'bananas';
      const wrapper = mount(LabeledSelect, {
        props: {
          localizedLabel: true,
          value,
          options:        [{ label: 'whatever', value }],
        },
        global: { mocks: { $store: { getters: { 'i18n/t': () => translation } } } }
      });

      // Component is from a library and class is not going to be changed
      expect(wrapper.find('.vs__selected').text()).toBe(translation);
    });

    describe('updating the value on options change', () => {
      it('using new label', async() => {
        const value = 'foo';
        const oldLabel = 'Foo';
        const newLabel = 'Baz';
        const wrapper = mount(LabeledSelect, {
          props: {
            value,
            options: [
              { label: oldLabel, value },
            ],
          }
        });

        await wrapper.setProps({
          options: [
            { label: newLabel, value },
          ]
        });

        // Component is from a library and class is not going to be changed
        expect(wrapper.find('.vs__selected').text()).toBe(newLabel);
      });

      it('using values only and no labels', async() => {
        const value = 'foo';
        const newValue = 'bananas';
        const wrapper = mount(LabeledSelect, {
          props: {
            value,
            options: [value],
          }
        });

        await wrapper.setProps({ options: [newValue] });

        // Component is from a library and class is not going to be changed
        expect(wrapper.find('.vs__selected').text()).toBe(value);
      });

      it('using translated value', async() => {
        const value = 'foo';
        const oldLabel = 'Foo';
        const newLabel = 'Baz';
        const translation = 'bananas';
        const i18nMap: Record<string, string> = { [newLabel]: translation };
        const wrapper = mount(LabeledSelect, {
          props: {
            value,
            localizedLabel: true,
            options:        [
              { label: oldLabel, value },
            ],
          },
          global: { mocks: { $store: { getters: { 'i18n/t': (text: string) => i18nMap[text] } } } }
        });

        await wrapper.setProps({
          options: [
            { label: newLabel, value },
          ]
        });

        // Component is from a library and class is not going to be changed
        expect(wrapper.find('.vs__selected').text()).toBe(translation);
      });
    });
  });

  describe(`given {'disabled', 'mode', 'loading'} options`, () => {
    it.each([
      ['open', false, _EDIT, false, true],
      ['open', false, _CREATE, false, true],
      ['not open', false, _VIEW, false, false],
      ['not open', false, _EDIT, true, false],
      ['not open', true, _EDIT, false, false],
    ])('should %p dropdown element if options are { disabled: %p, mode: %p, loading: %p }', async(
      _,
      disabled,
      mode,
      loading,
      isOpen
    ) => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
        props: {
          value,
          options: [
            { label, value },
          ],
          disabled,
          mode,
          loading
        }
      });

      await wrapper.trigger('click');

      const dropdownOpen = wrapper.vm.isOpen;

      expect(dropdownOpen).toBe(isOpen);
    });
  });

  describe('given attributes from parent element', () => {
    it('should not pass classes to the select element', () => {
      const customClass = 'bananas';
      const ParentComponent = defineComponent({
        components: { LabeledSelect },
        template:   `<LabeledSelect class="${ customClass }" />`,
      });
      const wrapper = mount(ParentComponent);
      const input = wrapper.find('.v-select');

      expect(input.classes).not.toContain(customClass);
    });

    it.each([
      [true, ['bananas']],
      [false, 'bananas'],
    ])('given multiple as %p, should emit %p', async(multiple, expectation) => {
      const ParentComponent = defineComponent({
        components: { LabeledSelect },
        template:   `
          <LabeledSelect
            v-model:value="myValue"
            :multiple="${ multiple }"
            :options="options"
            :appendToBody="false"
          />`,
        data: () => ({
          myValue: [],
          options: ['bananas']
        })
      });
      const wrapper = mount(ParentComponent);

      // https://test-utils.vuejs.org/guide/essentials/event-handling#Asserting-the-arguments-of-the-event
      await wrapper.trigger('click');
      await wrapper.find('input').trigger('focus');
      await wrapper.find('.vs__dropdown-option').trigger('click');

      expect(wrapper.vm.$data.myValue).toStrictEqual(expectation);
    });
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const label = 'Foo';
    const value = 'foo';
    const ariaDescribedById = 'some-described-by-id';
    const itemLabel = 'some-label';

    const wrapper = mount(LabeledSelect, {
      props: {
        value,
        label:   itemLabel,
        options: [
          { label, value },
        ],
        required: true
      },
      attrs: { 'aria-describedby': ariaDescribedById }
    });

    const labeledSelectContainer = wrapper.find('.labeled-select');
    const ariaExpanded = labeledSelectContainer.attributes('aria-expanded');
    const ariaDescribedBy = labeledSelectContainer.attributes('aria-describedby');
    const ariaRequired = labeledSelectContainer.attributes('aria-required');
    const containerId = labeledSelectContainer.attributes('id');
    const labelFor = wrapper.find('label').attributes('for');

    const vSelectInput = wrapper.find('.v-select');

    expect(ariaExpanded).toBe('false');
    expect(ariaDescribedBy).toBe(ariaDescribedById);
    expect(ariaRequired).toBe('true');
    expect(containerId).toBe(wrapper.vm.labeledSelectLabelId);
    expect(labelFor).toBe(wrapper.vm.labeledSelectLabelId);

    // make sure it's hardcoded to a "neutral" value so that
    // in the current architecture of the component
    // screen readers won't pick up the default "Select option" aria-label
    // from the library
    expect(vSelectInput.attributes('aria-label')).toBe(`- ${ value }`);
  });

  it('pressing space key while focused on search should not prevent event propagation', async() => {
    const value = 'value-1';
    const options = [
      { label: 'label-1', value: 'value-1' },
      { label: 'label-2', value: 'value-2' },
    ];

    const wrapper = mount(LabeledSelect, {
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

    const input = wrapper.find('.labeled-select');

    // open labeled-select first
    await input.trigger('keydown.enter');

    // mimic pressing space on search box inside v-select
    const search = input.find('input');

    await search.trigger('keydown.space', mockEvent);

    // eslint-disable-next-line
    expect(spyFocus).toHaveBeenCalled();
    expect(spyPreventDefault).not.toHaveBeenCalled();
  });

  describe('function: closeOnSelecting', () => {
    it('should not throw when called with undefined', () => {
      const wrapper = mount(LabeledSelect, { props: { options: [{ label: 'Foo', value: 'foo' }], value: 'foo' } });

      expect(() => wrapper.vm.closeOnSelecting(undefined)).not.toThrow();
    });

    it('should emit selecting event even when called with undefined', () => {
      const wrapper = mount(LabeledSelect, { props: { options: [{ label: 'Foo', value: 'foo' }], value: 'foo' } });

      wrapper.vm.closeOnSelecting(undefined);

      expect(wrapper.emitted('selecting')).toBeTruthy();
      expect(wrapper.emitted('selecting')![0]).toStrictEqual([undefined]);
    });

    it('should close dropdown when selected option value matches current value', async() => {
      const value = 'foo';
      const wrapper = mount(LabeledSelect, { props: { options: [{ label: 'Foo', value }], value } });

      await wrapper.trigger('click');
      expect(wrapper.vm.isOpen).toBe(true);

      wrapper.vm.closeOnSelecting({ value });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(false);
    });

    it('should not close dropdown when selected option value does not match current value', async() => {
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
        props: {
          options: [{ label: 'Foo', value }, { label: 'Bar', value: 'bar' }],
          value
        }
      });

      await wrapper.trigger('click');
      expect(wrapper.vm.isOpen).toBe(true);

      wrapper.vm.closeOnSelecting({ value: 'bar' });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should emit selecting event with the given option', () => {
      const value = 'foo';
      const option = { label: 'Foo', value };
      const wrapper = mount(LabeledSelect, { props: { options: [option], value } });

      wrapper.vm.closeOnSelecting(option);

      expect(wrapper.emitted('selecting')).toBeTruthy();
      expect(wrapper.emitted('selecting')![0]).toStrictEqual([option]);
    });
  });

  describe('size prop', () => {
    it.each([
      ['small'],
      ['medium'],
      ['large'],
    ])('should apply ls-%s class to root element when size is "%s"', (size) => {
      const wrapper = mount(LabeledSelect, {
        props: {
          options: ['Option1'],
          size,
        }
      });

      expect(wrapper.find('.labeled-select').classes()).toContain(`ls-${ size }`);
    });

    it('should default to ls-large class when no size prop is provided', () => {
      const wrapper = mount(LabeledSelect, { props: { options: ['Option1'] } });

      expect(wrapper.find('.labeled-select').classes()).toContain('ls-large');
    });
  });

  describe('function: clickSelect', () => {
    it('should open dropdown when clickSelect is called and not disabled', async() => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
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
      const wrapper = mount(LabeledSelect, {
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
      const wrapper = mount(LabeledSelect, {
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
      const wrapper = mount(LabeledSelect, {
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
      const wrapper = mount(LabeledSelect, {
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
      const wrapper = mount(LabeledSelect, {
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

  describe('vue-select-overrides (enter key selection)', () => {
    it('should not select non-selectable options when hitting Enter', () => {
      const wrapper = mount(LabeledSelect, {
        props: {
          value:   'foo',
          options: [
            {
              label: 'Choose an existing secret:',
              value: 'header',
              kind:  'group'
            }
          ],
        }
      });

      const mappedKeysFn = wrapper.vm.mappedKeys;
      const defaultMap = {};

      const mockVm = {
        open:             true,
        typeAheadPointer: 0,
        filteredOptions:  [
          {
            label: 'Choose an existing secret:',
            value: 'header',
            kind:  'group'
          }
        ],
        selectable:       wrapper.vm.selectable,
        isOptionSelected: jest.fn().mockReturnValue(false),
        optionExists:     jest.fn().mockReturnValue(false),
        updateValue:      jest.fn(),
        $emit:            jest.fn(),
      };

      const keys = mappedKeysFn(defaultMap, mockVm);
      const enterHandler = keys[13]; // 13 is Enter

      expect(enterHandler).toBeDefined();

      enterHandler(new Event('keydown'));

      // Expect that selection was not triggered and updateValue was not called
      expect(mockVm.$emit).not.toHaveBeenCalledWith('option:selecting', {
        label: 'Choose an existing secret:',
        value: 'header',
        kind:  'group'
      });
      expect(mockVm.updateValue).not.toHaveBeenCalledWith({
        label: 'Choose an existing secret:',
        value: 'header',
        kind:  'group'
      });
    });

    it('should select selectable options when hitting Enter', () => {
      const wrapper = mount(LabeledSelect, {
        props: {
          value:   'foo',
          options: [
            {
              label: 'My Secret',
              value: 'my-secret'
            }
          ],
        }
      });

      const mappedKeysFn = wrapper.vm.mappedKeys;
      const defaultMap = {};

      const mockVm = {
        open:             true,
        typeAheadPointer: 0,
        filteredOptions:  [
          {
            label: 'My Secret',
            value: 'my-secret'
          }
        ],
        selectable:          wrapper.vm.selectable,
        isOptionSelected:    jest.fn().mockReturnValue(false),
        optionExists:        jest.fn().mockReturnValue(false),
        updateValue:         jest.fn(),
        $emit:               jest.fn(),
        multiple:            false,
        closeOnSelect:       true,
        clearSearchOnSelect: true,
        search:              'some-search',
      };

      const keys = mappedKeysFn(defaultMap, mockVm);
      const enterHandler = keys[13];

      enterHandler(new Event('keydown'));

      expect(mockVm.$emit).toHaveBeenCalledWith('option:selecting', {
        label: 'My Secret',
        value: 'my-secret'
      });
      expect(mockVm.updateValue).toHaveBeenCalledWith({
        label: 'My Secret',
        value: 'my-secret'
      });
    });
  });

  describe('function: filterOptions', () => {
    it('should return all options when search query is empty', () => {
      const options = [
        {
          label: 'Choose an existing secret:', value: 'header', kind: 'group'
        },
        { label: 'My Secret', value: 'my-secret' },
        { kind: 'divider' }
      ];
      const wrapper = mount(LabeledSelect, {
        props: {
          value: 'foo',
          options
        }
      });

      const result = wrapper.vm.filterOptions(options, '');

      expect(result).toStrictEqual(options);
    });

    it('should filter out group and divider options when search query is not empty but retain group headers that contain matching child options', () => {
      const options = [
        {
          label: 'Choose an existing secret:', value: 'header', kind: 'group'
        },
        { label: 'My Secret', value: 'my-secret' },
        { kind: 'divider' },
        { label: 'Another Secret', value: 'another-secret' }
      ];
      const wrapper = mount(LabeledSelect, {
        props: {
          value: 'foo',
          options
        }
      });

      const result = wrapper.vm.filterOptions(options, 'secret');

      expect(result).toStrictEqual([
        {
          label: 'Choose an existing secret:', value: 'header', kind: 'group'
        },
        { label: 'My Secret', value: 'my-secret' },
        { label: 'Another Secret', value: 'another-secret' }
      ]);
    });

    it('should filter out title options when empty but keep them if they contain matching child options, while keeping standard disabled options searchable', () => {
      const options = [
        {
          label:    'Choose an existing secret:',
          kind:     'title',
          disabled: true,
        },
        { label: 'My Secret', value: 'my-secret' },
        { kind: 'divider' },
        {
          label:    'Disabled Option',
          value:    'disabled-opt',
          disabled: true,
        }
      ];
      const wrapper = mount(LabeledSelect, {
        props: {
          value: 'foo',
          options
        }
      });

      const result = wrapper.vm.filterOptions(options, 'secret');

      expect(result).toStrictEqual([
        {
          label:    'Choose an existing secret:',
          kind:     'title',
          disabled: true,
        },
        { label: 'My Secret', value: 'my-secret' }
      ]);

      const resultWithDisabled = wrapper.vm.filterOptions(options, 'disabled');

      expect(resultWithDisabled).toStrictEqual([
        {
          label:    'Disabled Option',
          value:    'disabled-opt',
          disabled: true,
        }
      ]);
    });

    it('should match case-insensitively', () => {
      const options = [
        { label: 'My Secret', value: 'my-secret' }
      ];
      const wrapper = mount(LabeledSelect, {
        props: {
          value: 'foo',
          options
        }
      });

      const result = wrapper.vm.filterOptions(options, 'MY SECRET');

      expect(result).toStrictEqual([
        { label: 'My Secret', value: 'my-secret' }
      ]);
    });
  });
});
