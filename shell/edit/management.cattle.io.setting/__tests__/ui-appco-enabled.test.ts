import { shallowMount } from '@vue/test-utils';
import UiAppcoEnabled from '@shell/edit/management.cattle.io.setting/ui-appco-enabled.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({ getters: { 'i18n/t': (key: string) => key } }),
}));

describe('component: ui-appco-enabled setting', () => {
  const select = (settingValue?: string) => shallowMount(UiAppcoEnabled, { props: { settingValue } })
    .findComponent(LabeledSelect);

  it('should offer the True, False and None options', () => {
    expect(select('true').props('options')).toStrictEqual([
      { label: 'advancedSettings.edit.trueOption', value: 'true' },
      { label: 'advancedSettings.edit.falseOption', value: 'false' },
      { label: 'advancedSettings.none', value: 'none' },
    ]);
  });

  it.each([
    ['true', 'true'],
    ['false', 'false'],
    ['', 'none'],
    [undefined, 'none'],
  ])('should select the option for the setting value %p', (settingValue, expected) => {
    expect(select(settingValue).props('value')).toBe(expected);
  });

  it.each([
    ['true', 'true'],
    ['false', 'false'],
    ['none', ''],
  ])('should emit the setting value when %p is selected', async(option, expected) => {
    const wrapper = shallowMount(UiAppcoEnabled, { props: { settingValue: 'true' } });

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', option);

    expect(wrapper.emitted('update:settingValue')).toStrictEqual([[expected]]);
  });
});
