import { mount } from '@vue/test-utils';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import { SECTION_TYPE } from '@components/RcSection';

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

  describe('rcCompatible', () => {
    it('should not render an RcSection when rcCompatible is false', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: false } });

      expect(wrapper.findComponent({ name: 'RcSection' }).exists()).toBe(false);
    });

    it('should render the fields inside an RcSection with the default title and the secondary type when rcCompatible is true', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: true } });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.exists()).toBe(true);
      expect(section.props('title')).toBe('%containerResourceLimit.label%');
      expect(section.props('type')).toBe(SECTION_TYPE.SECONDARY);
    });

    it('should use a caller-provided title over the default when rcCompatible is true', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: true, title: 'Custom Title' } });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('title')).toBe('Custom Title');
    });

    it('should use a caller-provided sectionType over the default when rcCompatible is true', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: true, sectionType: SECTION_TYPE.PRIMARY } });

      const section = wrapper.findComponent({ name: 'RcSection' });

      expect(section.props('type')).toBe(SECTION_TYPE.PRIMARY);
    });

    it('should still render the field inputs inside the RcSection', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: true, value: { requestsCpu: '111m' } } });

      const element = wrapper.find('[data-testid="cpu-reservation"]').element as HTMLInputElement;

      expect(element.value).toBe('111');
    });

    it('should render the default helper text in the banner slot when showTip is true and no slot content is given', () => {
      const wrapper = mount(ContainerResourceLimit, { propsData: { rcCompatible: true, showTip: true } });

      expect(wrapper.find('.helper-text').exists()).toBe(true);
    });

    it('should render caller-provided banner slot content instead of the default helper text', () => {
      const wrapper = mount(ContainerResourceLimit, {
        propsData: { rcCompatible: true, showTip: true },
        slots:     { banner: '<div class="custom-banner">Custom banner</div>' }
      });

      expect(wrapper.find('.custom-banner').exists()).toBe(true);
      expect(wrapper.find('.helper-text').exists()).toBe(false);
    });
  });
});
