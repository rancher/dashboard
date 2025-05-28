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

      const dropdownOpen = wrapper.find('.vs--open');

      expect(dropdownOpen.exists()).toBe(isOpen);
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
      await wrapper.find('input').trigger('focus');
      await wrapper.find('.vs__dropdown-option').trigger('click');

      expect(wrapper.vm.$data.myValue).toStrictEqual(expectation);
    });
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
        searchable: true
      }
    });

    const mockEvent = { preventDefault: jest.fn() };
    const spyFocus = jest.spyOn(wrapper.vm, 'focusSearch');
    const spyPreventDefault = jest.spyOn(mockEvent, 'preventDefault');

    const input = wrapper.find('.labeled-select');

    // open labeled-select first
    await input.trigger('keydown.enter');

    // mimic pressing space on search box inside v-select
    await input.trigger('keydown.space', mockEvent);

    // eslint-disable-next-line
    expect(spyFocus).toHaveBeenCalled();
    expect(spyPreventDefault).not.toHaveBeenCalled();
  });
});
