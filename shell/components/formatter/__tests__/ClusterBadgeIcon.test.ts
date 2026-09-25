import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterBadgeIcon from '@shell/components/formatter/ClusterBadgeIcon.vue';

describe('component: ClusterBadgeIcon', () => {
  // The chip names itself through i18n, which reads the store.
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

  // The chip is the cell's only content, so without a name the Badge column reads as empty cells to a
  // screen reader — and a custom icon text says something the name column does not.
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

  // The name column carries the pin, so the chip's own overlay would say it twice.
  it('should leave the pin to the name column', () => {
    const wrapper = mountBadge({
      nameDisplay: 'prod', ready: true, pinned: true
    });

    expect(wrapper.find('.cluster-pin-icon').exists()).toBe(false);
  });

  // A cluster management row is a provisioning cluster, which keeps its appearance on the management
  // cluster behind it.
  it('should read a provisioning row through to its management cluster', () => {
    const wrapper = mountBadge({ nameDisplay: 'prov', mgmt: { nameDisplay: 'world-wide-web', ready: true } });

    expect(wrapper.find('.cluster-badge-logo-text').text()).toBe('wwb');
  });
});
