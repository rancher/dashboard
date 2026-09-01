import { mount } from '@vue/test-utils';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';

describe('component: ContainerResourceLimit', () => {
  it.each([
    ['limitsCpu', 'cpu-limit', '111m', '111'],
    ['limitsMemory', 'memory-limit', '111Mi', '111'],
    ['requestsCpu', 'cpu-reservation', '111m', '111'],
    ['requestsMemory', 'memory-reservation', '111Mi', '111'],
    // ['limitsGpu', 'gpu-limit', 1000], // Input does not work atm
  ])('given value prop key %p as %p should display value %p', (key, id, value, expectation) => {
    const wrapper = mount(ContainerResourceLimit, { propsData: { value: { [key]: value } } });

    const element = wrapper.find(`[data-testid="${ id }"]`).element as HTMLInputElement;

    expect(element.value).toBe(expectation);
  });

  describe.each([
    'cpu-reservation',
    'memory-reservation',
    'cpu-limit',
    'memory-limit',
  ])('given input %p', (id) => {
    it.each(['input', 'blur'])('on %p 123 should display input value 123', async(trigger) => {
      const wrapper = mount(ContainerResourceLimit);
      const input = wrapper.find(`[data-testid="${ id }"]`);

      await input.setValue('123');
      await input.trigger(trigger);

      expect((input.element as HTMLInputElement).value).toBe('123');
    });
  });
});
