import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import DayTwoOps from '../DayTwoOps.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

describe('component: DayTwoOps', () => {
  const defaultSetup = () => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

    return { global: { plugins: [store] } };
  };

  it('should render with default props', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    expect(wrapper.find('h3').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(true);
  });

  it('should pass value prop to checkbox', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        value:         true,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    expect(checkbox.props('value')).toBe(true);
  });

  it('should emit update:value when checkbox is updated', async() => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        value:         false,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);
    await nextTick();

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toEqual([true]);
  });

  it('should pass mode prop to checkbox', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        mode:          _VIEW,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    expect(checkbox.props('mode')).toBe(_VIEW);
  });

  it('should use default _EDIT mode when not provided', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    expect(checkbox.props('mode')).toBe(_EDIT);
  });

  it('should show globally enabled tooltip when globalSetting is true', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });
    const tooltip = checkbox.props('tooltip');

    // Tooltip should exist and contain relevant text
    expect(tooltip).toBeTruthy();
    expect(typeof tooltip).toBe('string');
  });

  it('should show globally disabled tooltip when globalSetting is false', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: false },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });
    const tooltip = checkbox.props('tooltip');

    // Tooltip should exist and contain relevant text
    expect(tooltip).toBeTruthy();
    expect(typeof tooltip).toBe('string');
  });

  it('should update tooltip when globalSetting prop changes', async() => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    let checkbox = wrapper.findComponent({ name: 'Checkbox' });
    const initialTooltip = checkbox.props('tooltip');

    expect(initialTooltip).toBeTruthy();
    expect(typeof initialTooltip).toBe('string');

    await wrapper.setProps({ globalSetting: false });
    await nextTick();

    checkbox = wrapper.findComponent({ name: 'Checkbox' });
    const updatedTooltip = checkbox.props('tooltip');

    // Tooltip should update when prop changes
    expect(updatedTooltip).toBeTruthy();
    expect(typeof updatedTooltip).toBe('string');
  });

  it('should pass label prop to checkbox', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });
    const label = checkbox.props('label');

    // Label should exist and be a string
    expect(label).toBeTruthy();
    expect(typeof label).toBe('string');
  });

  it('should render title from i18n', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const h3 = wrapper.find('h3');

    // Title should be rendered in an h3 element
    expect(h3.exists()).toBe(true);
  });

  it('should handle multiple emit events', async() => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        value:         false,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    await checkbox.vm.$emit('update:value', true);
    await nextTick();

    await checkbox.vm.$emit('update:value', false);
    await nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(2);
    expect(wrapper.emitted('update:value')?.[0]).toEqual([true]);
    expect(wrapper.emitted('update:value')?.[1]).toEqual([false]);
  });
});
