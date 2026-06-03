import { shallowMount } from '@vue/test-utils';
import AppCoVersionSelect from '@shell/components/fleet/AppCoVersionSelect.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: AppCoVersionSelect', () => {
  const options = [
    { label: '1.2.0', value: '1.2.0', date: 'Jan 1, 2025' },
    { label: '1.1.0', value: '1.1.0', date: 'Dec 1, 2024' },
  ];

  it('should match snapshot', () => {
    const wrapper = shallowMount(AppCoVersionSelect, {
      props: {
        value: '1.2.0', options, mode: _EDIT
      }
    });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should emit update:value when selection changes', () => {
    const wrapper = shallowMount(AppCoVersionSelect, {
      props: {
        value: '1.2.0', options, mode: _EDIT
      }
    });

    wrapper.findComponent({ name: 'LabeledSelect' }).vm.$emit('update:value', '1.1.0');

    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['1.1.0']);
  });
});
