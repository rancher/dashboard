import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterBadgeIcon from '@shell/components/formatter/ClusterBadgeIcon.vue';

describe('component: ClusterBadgeIcon', () => {
  const mountBadge = (row: any) => mount(ClusterBadgeIcon as any, {
    props:  { row },
    global: { plugins: [createStore({})] },
  });

  it('should show the chip the app bar shows, abbreviating the cluster name', () => {
    const wrapper = mountBadge({ nameDisplay: 'world-wide-web', canExplore: true });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('wwb');
  });

  it('should take the custom icon text over the abbreviation, as the app bar does', () => {
    const wrapper = mountBadge({
      nameDisplay: 'production', canExplore: true, badge: { iconText: 'PRD' }
    });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('PRD');
  });

  it('should colour the chip with the cluster colour', () => {
    const wrapper = mountBadge({
      nameDisplay: 'prod', canExplore: true, iconColor: 'rgb(255, 0, 0)'
    });

    expect(wrapper.find('.custom-color-decoration').attributes('style')).toContain('rgb(255, 0, 0)');
  });

  it.each([
    ['the custom icon text', {
      nameDisplay: 'production', canExplore: true, badge: { iconText: 'PRD' }
    }, 'PRD'],
    ['the abbreviation, as the chip draws it', { nameDisplay: 'world-wide-web', canExplore: true }, 'WWB'],
    ['the local cluster', {
      nameDisplay: 'local', canExplore: true, isLocal: true
    }, 'nav.ariaLabel.localClusterIcon'],
  ])('should name the cell after %s', (_label, row, expected) => {
    const wrapper = mountBadge(row);

    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toContain(expected);
  });

  it('should leave the pin to the name column', () => {
    const wrapper = mountBadge({
      nameDisplay: 'prod', canExplore: true, pinned: true
    });

    expect(wrapper.find('.cluster-pin-icon').exists()).toBe(false);
  });

  it('should read a provisioning row through to its management cluster', () => {
    const wrapper = mountBadge({ nameDisplay: 'prov', mgmt: { nameDisplay: 'world-wide-web', canExplore: true } });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('wwb');
  });

  it.each([
    ['an imported cluster that can be explored, which has no machines', { ready: 0, canExplore: true }, false],
    ['a cluster with ready machines that cannot be explored', { ready: 2, canExplore: false }, true],
  ])('should dim the chip of %s only when the side nav does', (_label, mgmt, dimmed) => {
    const wrapper = mountBadge({ nameDisplay: 'prov', mgmt: { nameDisplay: 'world-wide-web', ...mgmt } });

    expect(wrapper.find('.cluster-badge-logo').classes('disabled')).toBe(dimmed);
  });

  it('should dim the chip of a provisioning cluster with no management cluster yet', () => {
    const wrapper = mountBadge({ nameDisplay: 'new' });

    expect(wrapper.find('.cluster-badge-logo').classes('disabled')).toBe(true);
  });
});
