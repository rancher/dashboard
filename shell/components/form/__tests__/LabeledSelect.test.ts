import { mount } from '@vue/test-utils';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

describe('component: LabeledSelect', () => {
  describe('should display correct label', () => {
    it('given an existing value and option', () => {
      const label = 'Foo';
      const value = 'foo';
      const wrapper = mount(LabeledSelect, {
        propsData: {
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
        propsData: {
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
        propsData: {
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
        propsData: {
          localizedLabel: true,
          value,
          options:        [{ label: 'whatever', value }],
        },
        mocks: { $store: { getters: { 'i18n/t': () => translation } } }
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
          propsData: {
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
          propsData: {
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
          propsData: {
            value,
            localizedLabel: true,
            options:        [
              { label: oldLabel, value },
            ],
          },
          mocks: { $store: { getters: { 'i18n/t': (text: string) => i18nMap[text] } } }
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
});
