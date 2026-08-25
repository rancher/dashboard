import { mount } from '@vue/test-utils';
import ClusterSwitcherRow from '@shell/components/nav/ClusterSwitcherRow.vue';

// The row pulls `t` from the useI18n composable — return the key (or the interpolated meta bits it joins).
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const cluster = (over = {}): any => ({
  id:                'c1',
  label:             'Prod',
  ready:             true,
  pinned:            false,
  providerDisplay:   'EKS',
  kubernetesVersion: 'v1.31',
  ...over,
});

const mountRow = (props = {}) => mount(ClusterSwitcherRow, {
  props:  { cluster: cluster(), ...props },
  global: { stubs: { ClusterIconMenu: true, Pinned: true } },
});

describe('component: ClusterSwitcherRow (accessibility)', () => {
  it('is an option, labelled by name + meta, with the decorative badge hidden', () => {
    const row = mountRow({ id: 'cluster-switcher-opt-c1' }).find('.cluster-switcher-row');

    expect(row.attributes('role')).toBe('option');
    expect(row.attributes('id')).toBe('cluster-switcher-opt-c1');
    // name + meta are folded into a single aria-label (badge/pin are not read individually).
    expect(row.attributes('aria-label')).toContain('Prod');
    expect(row.attributes('aria-label')).toContain('EKS');
    // ClusterIconMenu badge is decorative.
    expect(mountRow().find('.row-badge').attributes('aria-hidden')).toBe('true');
  });

  it('reflects keyboard highlight via aria-selected', () => {
    expect(mountRow({ active: true }).find('.cluster-switcher-row').attributes('aria-selected')).toBe('true');
    expect(mountRow({ active: false }).find('.cluster-switcher-row').attributes('aria-selected')).toBe('false');
  });

  it('marks the explored cluster with aria-current', () => {
    expect(mountRow({ current: true }).find('.cluster-switcher-row').attributes('aria-current')).toBe('true');
    expect(mountRow({ current: false }).find('.cluster-switcher-row').attributes('aria-current')).toBeUndefined();
  });

  it('marks a not-ready cluster aria-disabled and does not emit select', () => {
    const wrapper = mountRow({ cluster: cluster({ ready: false }) });

    expect(wrapper.find('.cluster-switcher-row').attributes('aria-disabled')).toBe('true');
    wrapper.find('.cluster-switcher-row').trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });
});
