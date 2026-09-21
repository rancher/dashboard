import { shallowMount } from '@vue/test-utils';
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

const mountRow = (props = {}) => shallowMount(ClusterSwitcherRow, { props: { cluster: cluster(), ...props } });

describe('component: ClusterSwitcherRow (accessibility)', () => {
  // The row is a list item holding TWO sibling controls. Nesting the pin inside the row's own button
  // would be invalid HTML and would hide it from assistive tech.
  it('is a list item whose controls are siblings, never nested', () => {
    const wrapper = mountRow({ id: 'cluster-switcher-opt-c1' });
    const row = wrapper.find('.cluster-switcher-row');

    expect(row.element.tagName).toBe('LI');
    expect(row.attributes('role')).toBeUndefined();
    expect(row.attributes('id')).toBe('cluster-switcher-opt-c1');
    expect(wrapper.find('.row-main').element.querySelector('.row-pin')).toBeNull();
  });

  it('labels the row control by name + meta, and hides the decorative badge', () => {
    const main = mountRow().find('.row-main');

    expect(main.attributes('aria-label')).toContain('Prod');
    expect(main.attributes('aria-label')).toContain('EKS');
    expect(mountRow().find('.row-badge').attributes('aria-hidden')).toBe('true');
  });

  // Roving tabindex: one row holds the tab stop, so Tab walks that row's two controls rather than every
  // cluster in the estate. `tabbable` is separate from `active` because Tab has to land somewhere before
  // the cursor has entered the list — the list hands the first row the tab stop until then.
  it('puts only the tabbable row in the tab order', () => {
    const tabindexes = (tabbable: boolean) => {
      const w = mountRow({ tabbable });

      return [w.find('.row-main').attributes('tabindex'), w.findComponent({ name: 'Pinned' }).props('tabOrder')];
    };

    expect(tabindexes(true)).toStrictEqual(['0', 0]);
    expect(tabindexes(false)).toStrictEqual(['-1', -1]);
  });

  // The highlight and the tab stop are independent: an unhighlighted first row still has to be reachable.
  it('can be tabbable without being the highlighted row', () => {
    const w = mountRow({ active: false, tabbable: true });

    expect(w.find('.cluster-switcher-row').classes()).not.toContain('active');
    expect(w.find('.row-main').attributes('tabindex')).toStrictEqual('0');
  });

  it('marks the explored cluster with aria-current', () => {
    expect(mountRow({ current: true }).find('.row-main').attributes('aria-current')).toBe('true');
    expect(mountRow({ current: false }).find('.row-main').attributes('aria-current')).toBeUndefined();
  });

  // The Option/Alt "keep this view" arrow used to light up only on the nav-bar rows.
  // The flyout rows advertise it too, so the cue is the same wherever the user is browsing.
  describe('route-combo (Option/Alt) arrow', () => {
    const badge = (props = {}) => mountRow(props).findComponent({ name: 'ClusterIconMenu' });

    it('shows the combo arrow on a ready row while Option is held', () => {
      expect(badge({ routeCombo: true }).props('routeCombo')).toBe(true);
    });

    it('is off by default', () => {
      expect(badge().props('routeCombo')).toBe(false);
    });

    it('stays off for a cluster you cannot jump to', () => {
      expect(badge({ cluster: cluster({ ready: false }), routeCombo: true }).props('routeCombo')).toBe(false);
    });
  });

  // The pin is now its own button with its own name and `aria-pressed`, so the row's label must NOT
  // restate the pin state — it would be announced twice, and by the control that does not own it.
  describe('pin state', () => {
    it('leaves the pinned state to the pin button', () => {
      const label = (over: any, props = {}) => mountRow({ cluster: cluster(over), ...props })
        .find('.row-main').attributes('aria-label');

      expect(label({ pinned: true })).not.toContain('nav.switcher.aria.pinned');
      expect(label({ pinned: false })).not.toContain('nav.switcher.aria.pinned');
    });

    it('renders the pin as a sibling control, reachable with the row', () => {
      const pin = mountRow({ tabbable: true }).findComponent({ name: 'Pinned' });

      expect(pin.exists()).toBe(true);
      expect(pin.props('tabOrder')).toStrictEqual(0);
      // No longer hidden from assistive tech: it is a real button that names itself.
      expect(pin.attributes('aria-hidden')).toBeUndefined();
    });

    it('omits the pin where a cluster cannot be pinned', () => {
      expect(mountRow({ pinnable: false }).findComponent({ name: 'Pinned' }).exists()).toBe(false);
    });
  });

  // `aria-disabled` rather than `disabled`, so ↑↓ and Tab still reach the row and announce why it cannot
  // be explored — a `disabled` button is skipped silently.
  it('marks a not-ready cluster aria-disabled, keeps it focusable, and does not emit select', () => {
    const wrapper = mountRow({ cluster: cluster({ ready: false }), tabbable: true });
    const main = wrapper.find('.row-main');

    expect(main.attributes('aria-disabled')).toBe('true');
    expect(main.attributes('disabled')).toBeUndefined();
    expect(main.attributes('tabindex')).toBe('0');

    main.trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('tells the list when one of its controls takes focus, so the cursor follows', async() => {
    const wrapper = mountRow();

    await wrapper.find('.row-main').trigger('focus');

    expect(wrapper.emitted('focus-row')?.length).toStrictEqual(1);
  });
});
