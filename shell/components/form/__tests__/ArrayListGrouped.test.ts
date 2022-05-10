import { mount } from '@vue/test-utils';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';

describe('component: ArrayListGrouped', () => {
  it('should display enabled add button', () => {
    const wrapper = mount(ArrayListGrouped);
    const button = wrapper.find('[data-testid^="add-item"]').element as HTMLInputElement;

    expect(button.disabled).toBe(false);
  });

  it('should add more items', async() => {
    const wrapper = mount(ArrayListGrouped, {
      mocks: { propsData: { value: ['a', 'b'] } },
      slots: { default: '<div id="test"/>' }
    });
    const button = wrapper.find('[data-testid^="add-item"]');

    await button.trigger('click');
    await button.trigger('click');
    const elements = wrapper.findAll('#test');

    expect(elements).toHaveLength(2);
  });

  it('should allow to remove items', async() => {
    const wrapper = mount(ArrayListGrouped, {
      mocks: { propsData: { value: ['a', 'b'] } },
      slots: { default: '<div id="test"/>' }
    });

    await wrapper.find('[data-testid^="add-item"]').trigger('click');
    await wrapper.find('[data-testid^="remove-item"]').trigger('click');

    const elements = wrapper.findAll('#test');

    expect(elements).toHaveLength(0);
  });
});
