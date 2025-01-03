import { shallowMount } from '@vue/test-utils';
import ClusterBadge from '@shell/components/ClusterBadge.vue';

describe('component: ClusterBadge', () => {
  it('should render component with the correct data applied', () => {
    const clusterProp = {
      badge: {
        color:     'red',
        textColor: 'blue',
        text:      'some-text',
      }
    };

    const wrapper = shallowMount(ClusterBadge, { props: { cluster: clusterProp } });

    const elem = wrapper.find('div');

    expect(elem.classes()).toContain('cluster-badge');
    expect(elem.attributes().style).toBe('background-color: red; color: blue;');
    expect(elem.text()).toBe('some-text');
  });

  it('should NOT render component if there is no badge property in object', () => {
    const clusterProp = {};

    const wrapper = shallowMount(ClusterBadge, { props: { cluster: clusterProp } });

    const elem = wrapper.find('div');

    expect(elem.exists()).toBe(false);
  });
});
