import { shallowMount } from '@vue/test-utils';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpTargetOptionsSection', () => {
  const props = {
    value: { spec: { serviceAccount: 'sa-1', namespace: 'ns-1' } },
    mode:  _EDIT,
  };

  it('should match snapshot with default props', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot in compact mode', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: true } });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should show description text when compact is true', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: true } });

    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('should not show description text when compact is false', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: false } });

    expect(wrapper.find('p').exists()).toBe(false);
  });
});
