import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import DayTwoOps from '../DayTwoOps.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { DEFAULT } from '@pkg/imported/util/shared.ts';

describe('component: DayTwoOps', () => {
  const defaultSetup = () => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

    return { global: { plugins: [store] } };
  };

  it('should render the title and radio group with default props', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    expect(wrapper.find('h3').exists()).toBe(true);
    expect(radioGroup.exists()).toBe(true);
    expect(radioGroup.props('value')).toBe(DEFAULT);
    expect(radioGroup.props('mode')).toBe(_EDIT);
  });

  it('should pass the correct options to the radio group when the global setting is enabled', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    expect(radioGroup.props('options')).toStrictEqual([
      { value: DEFAULT, label: 'imported.basics.dayTwoOpsEnabled.globalEnabledDefault' },
      { value: 'true', label: 'imported.basics.dayTwoOpsEnabled.enabled' },
      { value: 'false', label: 'imported.basics.dayTwoOpsEnabled.disabled' },
    ]);
  });

  it('should pass the correct options to the radio group when the global setting is disabled', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: false },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    expect(radioGroup.props('options')).toStrictEqual([
      { value: DEFAULT, label: 'imported.basics.dayTwoOpsEnabled.globalDisabledDefault' },
      { value: 'true', label: 'imported.basics.dayTwoOpsEnabled.enabled' },
      { value: 'false', label: 'imported.basics.dayTwoOpsEnabled.disabled' },
    ]);
  });

  it('should emit update:value when the radio group is updated', async() => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        value:         DEFAULT,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    await radioGroup.vm.$emit('update:value', 'true');
    await nextTick();

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['true']);
  });

  it('should pass the mode prop to the radio group', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        mode:          _VIEW,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    expect(radioGroup.props('mode')).toBe(_VIEW);
  });

  it('should render the global summary text for enabled global setting', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: true },
      ...defaultSetup()
    });

    expect(wrapper.text()).toContain('imported.basics.dayTwoOpsEnabled.globallyEnabled');
  });

  it('should render the global summary text for disabled global setting', () => {
    const wrapper = shallowMount(DayTwoOps, {
      props: { globalSetting: false },
      ...defaultSetup()
    });

    expect(wrapper.text()).toContain('imported.basics.dayTwoOpsEnabled.globallyDisabled');
  });

  it.each([
    [{ globalSetting: false, value: DEFAULT }, 'imported.basics.dayTwoOpsEnabled.summary.canEnable'],
    [{ globalSetting: true, value: 'true' }, 'imported.basics.dayTwoOpsEnabled.summary.willEnable'],
    [{ globalSetting: true, value: 'false' }, 'imported.basics.dayTwoOpsEnabled.summary.willDisable'],
  ])('should render the expected cluster summary text', (props, expectedText) => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        oldValue: DEFAULT,
        ...props,
      },
      ...defaultSetup()
    });

    expect(wrapper.text()).toContain(expectedText);
  });

  it.each([
    [{
      oldValue: DEFAULT, value: 'true', mode: _EDIT
    }, 'imported.basics.dayTwoOpsEnabled.banner.edit.defaultToNonDefault'],
    [{
      oldValue: 'true', value: DEFAULT, mode: _EDIT
    }, 'imported.basics.dayTwoOpsEnabled.banner.edit.nonDefaultToDefault'],
  ])('should show the edit banner when switching to or from the default value', (props, expectedText) => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        globalSetting: true,
        ...props,
      },
      ...defaultSetup()
    });

    const banner = wrapper.find('[data-testid="day-two-ops-banner"]');

    expect(banner.exists()).toBe(true);
    expect(wrapper.vm.dayTwoOpsInfo).toBe(expectedText);
  });

  it.each([
    {
      oldValue: DEFAULT, value: DEFAULT, mode: _EDIT
    },
    {
      oldValue: 'true', value: 'false', mode: _EDIT
    },
    {
      oldValue: DEFAULT, value: 'true', mode: _CREATE
    },
  ])('should not show the banner when the change does not involve the default state in edit mode', (props) => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        globalSetting: true,
        ...props,
      },
      ...defaultSetup()
    });

    expect(wrapper.find('[data-testid="day-two-ops-banner"]').exists()).toBe(false);
  });

  it('should handle multiple emit events', async() => {
    const wrapper = shallowMount(DayTwoOps, {
      props: {
        value:         DEFAULT,
        globalSetting: true,
      },
      ...defaultSetup()
    });

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' });

    await radioGroup.vm.$emit('update:value', 'true');
    await nextTick();

    await radioGroup.vm.$emit('update:value', DEFAULT);
    await nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(2);
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['true']);
    expect(wrapper.emitted('update:value')?.[1]).toStrictEqual([DEFAULT]);
  });
});
