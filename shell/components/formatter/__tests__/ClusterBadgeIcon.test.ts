import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterBadgeIcon from '@shell/components/formatter/ClusterBadgeIcon.vue';

describe('component: ClusterBadgeIcon', () => {
  const mountBadge = (row: any) => mount(ClusterBadgeIcon as any, {
    props:  { row },
    global: { plugins: [createStore({})] },
  });

  it('should show the chip the app bar shows, abbreviating the cluster name', () => {
    const wrapper = mountBadge({ nameDisplay: 'world-wide-web', ready: true });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('wwb');
  });

  it('should take the custom icon text over the abbreviation, as the app bar does', () => {
    const wrapper = mountBadge({
      nameDisplay: 'production', ready: true, badge: { iconText: 'PRD' }
    });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('PRD');
  });

  it('should colour the chip with the cluster colour', () => {
    const wrapper = mountBadge({
      nameDisplay: 'prod', ready: true, iconColor: 'rgb(255, 0, 0)'
    });

    expect(wrapper.find('.custom-color-decoration').attributes('style')).toContain('rgb(255, 0, 0)');
  });

  it.each([
    ['the custom icon text', {
      nameDisplay: 'production', ready: true, badge: { iconText: 'PRD' }
    }, 'PRD'],
    ['the abbreviation, as the chip draws it', { nameDisplay: 'world-wide-web', ready: true }, 'WWB'],
    ['the local cluster', {
      nameDisplay: 'local', ready: true, isLocal: true
    }, 'nav.ariaLabel.localClusterIcon'],
  ])('should name the cell after %s', (_label, row, expected) => {
    const wrapper = mountBadge(row);

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toContain(expected);
  });

  it('should leave the pin to the name column', () => {
    const wrapper = mountBadge({
      nameDisplay: 'prod', ready: true, pinned: true
    });

    expect(wrapper.find('.cluster-pin-icon').exists()).toBe(false);
  });

  it('should read a provisioning row through to its management cluster', () => {
    const wrapper = mountBadge({ nameDisplay: 'prov', mgmt: { nameDisplay: 'world-wide-web', ready: true } });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('wwb');
  });
});
