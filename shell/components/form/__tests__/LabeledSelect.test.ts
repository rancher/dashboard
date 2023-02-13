import { mount } from '@vue/test-utils';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

describe('component: LabeledSelect', () => {
  it('should automatically pick option for given value', () => {
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

  it('should update the displayed label if options are changed', async() => {
    const newLabel = 'Baz';
    const oldLabel = 'Foo';
    const value = 'foo';
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
});
