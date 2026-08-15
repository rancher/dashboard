import { shallowMount } from '@vue/test-utils';
import HelmOpTargetOptionsSection from '@shell/components/fleet/HelmOpTargetOptionsSection.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpTargetOptionsSection', () => {
  const props = {
    value: { spec: { serviceAccount: 'sa-1', namespace: 'ns-1' } },
    mode:  _EDIT,
  };

  // The compact layout is a RcContentGroup, a wrapper div with no logic of its
  // own. Stubbing it would swallow the content this suite is about.
  const global = { stubs: { RcContentGroup: false } };

  it('should match snapshot with default props', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props, global });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should match snapshot in compact mode', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: true }, global });

    expect(wrapper.element).toMatchSnapshot();
  });

  it('should show description text when compact is true', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: true }, global });

    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('should not show description text when compact is false', () => {
    const wrapper = shallowMount(HelmOpTargetOptionsSection, { props: { ...props, compact: false }, global });

    expect(wrapper.find('p').exists()).toBe(false);
  });
});
