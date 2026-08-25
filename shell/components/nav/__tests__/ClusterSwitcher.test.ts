import { mount } from '@vue/test-utils';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher.vue';

// The component pulls `t` from the useI18n composable (not the old `this.t` global), so mock it here.
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: any) => (args ? `${ key }:${ JSON.stringify(args) }` : key) }) }));

const cluster = (id: string, ready = true) => ({
  id, label: id, ready, pinned: false, pin: jest.fn(), unpin: jest.fn()
});

const mountSwitcher = (props = {}) => mount(ClusterSwitcher, {
  props: {
    all: [], searchResults: [], clusterCount: 0, currentClusterId: '', search: '', ...props
  },
  global: {
    stubs: {
      'v-dropdown':       { template: '<div><slot /><slot name="popper" /></div>' },
      ClusterSwitcherRow: true,
    },
  },
});

describe('component: ClusterSwitcher', () => {
  it('rows = the ALL CLUSTERS directory when not searching', () => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')] });

    expect((wrapper.vm as any).searching).toBe(false);
    expect((wrapper.vm as any).rows.map((c: any) => c.id)).toStrictEqual(['p1', 'p2', 'r1']);
  });

  it('search collapses the directory into the flat match list', () => {
    const wrapper = mountSwitcher({
      all: [cluster('p1'), cluster('r1')], searchResults: [cluster('m1'), cluster('m2')], search: 'm'
    });

    expect((wrapper.vm as any).searching).toBe(true);
    expect((wrapper.vm as any).rows.map((c: any) => c.id)).toStrictEqual(['m1', 'm2']);
  });

  it('shows the estate size in the search placeholder', () => {
    const wrapper = mountSwitcher({ clusterCount: 19 });

    expect((wrapper.vm as any).placeholder).toBe('nav.switcher.searchPlaceholder:{"count":19}');
  });

  it('falls back to a simple placeholder when the count is unknown', () => {
    const wrapper = mountSwitcher({ clusterCount: 0 });

    expect((wrapper.vm as any).placeholder).toBe('nav.switcher.searchPlaceholderSimple');
  });

  it('↑/↓ move the cursor and clamp at the ends', () => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')] });
    const vm = wrapper.vm as any;

    expect(vm.activeIndex).toBe(0);
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
    expect(vm.activeIndex).toBe(2);
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // clamp at last
    expect(vm.activeIndex).toBe(2);
    vm.onKeydown({ key: 'ArrowUp', preventDefault() {} });
    vm.onKeydown({ key: 'ArrowUp', preventDefault() {} });
    vm.onKeydown({ key: 'ArrowUp', preventDefault() {} }); // clamp at first
    expect(vm.activeIndex).toBe(0);
  });

  it('Enter explores the active row', () => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
    const vm = wrapper.vm as any;

    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // active = p2
    vm.onKeydown({ key: 'Enter', preventDefault() {} });
    expect((wrapper.emitted('select')?.[0]?.[0] as any)?.id).toBe('p2');
  });

  it('does not explore a non-ready cluster', () => {
    const wrapper = mountSwitcher({ all: [cluster('p1', false)] });

    (wrapper.vm as any).explore(cluster('p1', false));
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('emits update:search as the user types', () => {
    const wrapper = mountSwitcher();

    (wrapper.vm as any).onInput({ target: { value: 'prod' } });
    expect(wrapper.emitted('update:search')?.[0]?.[0]).toBe('prod');
  });

  it('opening focuses search and emits update:open', () => {
    const wrapper = mountSwitcher();

    (wrapper.vm as any).setOpen(true);
    expect(wrapper.emitted('update:open')?.[0]?.[0]).toBe(true);
  });

  describe('accessibility (WAI-ARIA combobox + listbox)', () => {
    it('the search input is a combobox that controls the results listbox', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1')], clusterCount: 1 });
      const input = wrapper.find('input.switcher-search-input');

      expect(input.attributes('role')).toBe('combobox');
      expect(input.attributes('aria-autocomplete')).toBe('list');
      expect(input.attributes('aria-haspopup')).toBe('listbox');
      expect(input.attributes('aria-expanded')).toBe('true');
      expect(input.attributes('aria-controls')).toBe('cluster-switcher-listbox');
      expect(wrapper.find('#cluster-switcher-listbox').attributes('role')).toBe('listbox');
    });

    it('aria-activedescendant follows the ↑↓ cursor to the active option id', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')], clusterCount: 2 });
      const input = () => wrapper.find('input.switcher-search-input');

      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p1');

      (wrapper.vm as any).onKeydown({ key: 'ArrowDown', preventDefault() {} });
      await wrapper.vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p2');
    });

    it('gives every option row a stable id so aria-activedescendant can point at it', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')], clusterCount: 2 });
      const html = wrapper.html();

      expect(html).toContain('cluster-switcher-opt-p1');
      expect(html).toContain('cluster-switcher-opt-p2');
    });

    // the fixed `local` tile was keyboard-unreachable — its own listbox the combobox
    // didn't control, and `rows` filtered it out. It now heads the navigation model and the combobox owns
    // its listbox, while staying visually above the search door. SURE-8192.
    it('keeps the fixed local tile above the door yet keyboard-reachable via the combobox', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), all: [cluster('p1'), cluster('p2')], clusterCount: 2
      });
      const vm = wrapper.vm as any;
      const input = () => wrapper.find('input.switcher-search-input');

      // local heads the navigation model, but the visible results listbox still renders only the directory.
      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['local', 'p1', 'p2']);
      expect(vm.rows.map((c: any) => c.id)).toStrictEqual(['p1', 'p2']);
      // The combobox owns BOTH the local listbox and the results listbox.
      expect(input().attributes('aria-controls')).toBe('cluster-switcher-local-listbox cluster-switcher-listbox');

      // On open the cursor lands on the first REAL cluster (not local), so Enter opens a browsable cluster.
      vm.setOpen(true);
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p1');

      // ArrowUp now reaches the local row (previously mouse-only)...
      vm.onKeydown({ key: 'ArrowUp', preventDefault() {} });
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');

      // ...and Enter explores it.
      vm.onKeydown({ key: 'Enter', preventDefault() {} });
      expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'local' });
    });
  });
});
