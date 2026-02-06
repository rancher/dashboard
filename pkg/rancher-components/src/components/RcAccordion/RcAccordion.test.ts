import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import RcAccordion from './RcAccordion.vue';

describe('rcAccordion.vue', () => {
  const isBodyVisible = (wrapper: ReturnType<typeof mount>) => {
    const body = wrapper.find('.rc-accordion-body');

    return body.attributes('style') !== 'display: none;';
  };

  it('renders with the correct variant class', () => {
    const wrapper = mount(RcAccordion, { props: { variant: 'primary' } });

    expect(wrapper.classes()).toContain('primary');
  });

  it('renders with secondary variant class', () => {
    const wrapper = mount(RcAccordion, { props: { variant: 'secondary' } });

    expect(wrapper.classes()).toContain('secondary');
  });

  it('displays the title when provided', () => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test Title' } });

    expect(wrapper.find('.rc-accordion-title').text()).toBe('Test Title');
  });

  it('starts collapsed by default', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await nextTick();
    expect(isBodyVisible(wrapper)).toBe(false);
  });

  it('starts expanded when modelValue is true', async() => {
    const wrapper = mount(RcAccordion, {
      props: {
        title:      'Test',
        modelValue: true
      },
    });

    await nextTick();
    expect(isBodyVisible(wrapper)).toBe(true);
  });

  it('manages its own state when no v-model is provided', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await nextTick();
    expect(isBodyVisible(wrapper)).toBe(false);

    // Click to expand
    await wrapper.find('.rc-accordion-header').trigger('click');
    await nextTick();
    await flushPromises();
    expect(isBodyVisible(wrapper)).toBe(true);

    // Click to collapse
    await wrapper.find('.rc-accordion-header').trigger('click');
    await nextTick();
    await flushPromises();
    expect(isBodyVisible(wrapper)).toBe(false);
  });

  it('toggles expanded state on header click', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await nextTick();
    expect(isBodyVisible(wrapper)).toBe(false);

    await wrapper.find('.rc-accordion-header').trigger('click');
    await nextTick();
    await flushPromises();

    expect(isBodyVisible(wrapper)).toBe(true);
  });

  it('emits update:modelValue when toggled', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await wrapper.find('.rc-accordion-header').trigger('click');
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toStrictEqual([true]);
  });

  it('respects modelValue prop for controlled state', async() => {
    const wrapper = mount(RcAccordion, {
      props: {
        title:      'Test',
        modelValue: true
      },
    });

    await nextTick();
    expect(isBodyVisible(wrapper)).toBe(true);

    await wrapper.setProps({ modelValue: false });
    await nextTick();

    expect(isBodyVisible(wrapper)).toBe(false);
  });

  it('sets aria-expanded attribute correctly', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await nextTick();
    expect(wrapper.find('.rc-accordion-toggle-button').attributes('aria-expanded')).toBe('false');

    await wrapper.find('.rc-accordion-header').trigger('click');
    await nextTick();
    await flushPromises();

    expect(wrapper.find('.rc-accordion-toggle-button').attributes('aria-expanded')).toBe('true');
  });

  it('toggles on toggle button click', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await wrapper.find('.rc-accordion-toggle-button').trigger('click');
    await nextTick();
    await flushPromises();

    expect(isBodyVisible(wrapper)).toBe(true);
  });

  it('toggles back to collapsed on second toggle button click', async() => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    await wrapper.find('.rc-accordion-toggle-button').trigger('click');
    await nextTick();
    await flushPromises();

    expect(isBodyVisible(wrapper)).toBe(true);

    await wrapper.find('.rc-accordion-toggle-button').trigger('click');
    await nextTick();
    await flushPromises();

    expect(isBodyVisible(wrapper)).toBe(false);
  });

  it('renders slot content in body', async() => {
    const wrapper = mount(RcAccordion, {
      props: {
        title:      'Test',
        modelValue: true
      },
      slots: { default: '<p>Slot content</p>' },
    });

    await nextTick();
    expect(wrapper.find('.rc-accordion-body').html()).toContain('Slot content');
  });

  it('renders notifications slot content', () => {
    const wrapper = mount(RcAccordion, {
      props: { title: 'Test' },
      slots: { notifications: '<span class="badge">2</span>' },
    });

    expect(wrapper.find('.rc-accordion-header-notifications').html()).toContain('badge');
  });

  it('renders actions slot content', () => {
    const wrapper = mount(RcAccordion, {
      props: { title: 'Test' },
      slots: { actions: '<button>Action</button>' },
    });

    expect(wrapper.find('.rc-accordion-header-actions').html()).toContain('Action');
  });

  it('defaults to primary variant when not specified', () => {
    const wrapper = mount(RcAccordion, { props: { title: 'Test' } });

    expect(wrapper.classes()).toContain('primary');
  });
});
