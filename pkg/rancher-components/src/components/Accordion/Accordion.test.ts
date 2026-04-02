import { shallowMount } from '@vue/test-utils';
import { Accordion } from './index';

describe('component: Accordion', () => {
  it('is closed initially by default', () => {
    const title = 'Test Title';

    const wrapper = shallowMount(Accordion, { propsData: { title } });

    expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(false);
    expect(wrapper.find('[data-testid="accordion-header"]').text()).toBe(title);
  });

  it('is opened initially when openInitially prop is true', () => {
    const wrapper = shallowMount(Accordion, { propsData: { openInitially: true } });

    expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(true);
  });

  it('when closed, opens when the header is clicked', async() => {
    const wrapper = shallowMount(Accordion, { });

    await wrapper.find('[data-testid="accordion-header"]').trigger('click');
    expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(true);
  });

  it('when open, closes when the header is clicked', async() => {
    const wrapper = shallowMount(Accordion, { propsData: { openInitially: true } });

    await wrapper.find('[data-testid="accordion-header"]').trigger('click');
    expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(false);
  });

  it('displays a chevron when closed', async() => {
    const wrapper = shallowMount(Accordion, { propsData: { } });

    expect(wrapper.find('[data-testid="accordion-header"] .icon-chevron-up').exists()).toBe(true);
  });

  it('displays an inverted chevron when open', async() => {
    const wrapper = shallowMount(Accordion, { propsData: { openInitially: true } });

    expect(wrapper.find('[data-testid="accordion-header"] .icon-chevron-down').exists()).toBe(true);
  });

  describe('lazyMount', () => {
    it('does not render body when closed and lazyMount is true', () => {
      const wrapper = shallowMount(Accordion, { propsData: { lazyMount: true } });

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(false);
    });

    it('renders body when opened and lazyMount is true', () => {
      const wrapper = shallowMount(Accordion, { propsData: { lazyMount: true, openInitially: true } });

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(true);
    });

    it('mounts body on click when lazyMount is true', async() => {
      const wrapper = shallowMount(Accordion, { propsData: { lazyMount: true } });

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(false);

      await wrapper.find('[data-testid="accordion-header"]').trigger('click');

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="accordion-body"]').isVisible()).toBe(true);
    });

    it('unmounts body on close when lazyMount is true', async() => {
      const wrapper = shallowMount(Accordion, { propsData: { lazyMount: true, openInitially: true } });

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(true);

      await wrapper.find('[data-testid="accordion-header"]').trigger('click');

      expect(wrapper.find('[data-testid="accordion-body"]').exists()).toBe(false);
    });
  });
});
