import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher.vue';

// The component pulls `t` from the useI18n composable (not the old `this.t` global), so mock it here.
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string, args?: any) => (args ? `${ key }:${ JSON.stringify(args) }` : key) }) }));

// jsdom has no layout and no `scrollIntoView`, so the listbox never really scrolls. What these tests
// can check is which option the keyboard cursor asked to bring into view.
const scrollIntoView = jest.fn();

Element.prototype.scrollIntoView = scrollIntoView;

const cluster = (id: string, ready = true) => ({
  id, label: id, ready, pinned: false, isLocal: id === 'local', pin: jest.fn(), unpin: jest.fn()
});

// `attachTo` puts the options in the real document, which the cursor-reveal look-up needs (the flyout is
// teleported to <body> in the app, so it resolves its options by id off `document`).
const mountSwitcher = (props = {}, attachTo?: HTMLElement) => shallowMount(ClusterSwitcher, {
  props: {
    all: [], searchResults: [], clusterCount: 0, currentClusterId: '', search: '', ...props
  },
  attachTo,
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

  // The flyout is now the ONLY search in the nav and it always searches the whole
  // estate, so the placeholder is one fixed string — it no longer varies with the count.
  it.each([19, 0])('uses the one "search all clusters" placeholder (count: %s)', (clusterCount) => {
    const wrapper = mountSwitcher({ clusterCount });

    expect((wrapper.vm as any).placeholder).toBe('nav.switcher.searchAllClusters');
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

  it('keeps the keyboard cursor on screen as it moves', async() => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')], clusterCount: 3 }, document.body);
    const vm = wrapper.vm as any;

    scrollIntoView.mockClear();
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect((scrollIntoView.mock.instances[0] as HTMLElement).id).toBe('cluster-switcher-opt-p2');

    wrapper.unmount();
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

  it('closing hands focus back to whatever opened the flyout', () => {
    const trigger = document.createElement('button');

    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mountSwitcher();
    const vm = wrapper.vm as any;

    vm.setOpen(true);
    // The flyout owns focus while open (the real one focuses its search input on the popper's apply-show).
    document.body.focus();

    vm.setOpen(false);
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('closing does not steal focus from an outside click', () => {
    const trigger = document.createElement('button');
    const elsewhere = document.createElement('button');

    document.body.append(trigger, elsewhere);
    trigger.focus();

    const wrapper = mountSwitcher();
    const vm = wrapper.vm as any;

    vm.setOpen(true);
    // Clicking another control auto-hides the flyout, but focus is already where the user put it.
    elsewhere.focus();

    vm.setOpen(false);
    expect(document.activeElement).toBe(elsewhere);

    trigger.remove();
    elsewhere.remove();
  });

  // The ALL CLUSTERS / MATCHES caption sits ABOVE the search box, not inside the
  // scrolling list, and the flyout forwards the Option/Alt cue to every row.
  describe('layout', () => {
    it('puts the ALL CLUSTERS caption above the search box', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1')], clusterCount: 7 });
      const html = wrapper.html();

      // Template `t` renders through the global test stub (`%key%`), unlike the composable mocked above.
      expect(wrapper.find('.switcher-group-label').text()).toBe('%nav.switcher.allClusters% 7');
      expect(html.indexOf('switcher-group-label')).toBeLessThan(html.indexOf('switcher-search'));
    });

    it('swaps the caption for MATCHES + the match total while searching', () => {
      const wrapper = mountSwitcher({
        searchResults: [cluster('m1')], searchCount: 3, search: 'm'
      });

      expect(wrapper.find('.switcher-group-label').text()).toBe('%nav.switcher.matches% 3');
    });

    it('forwards the route-combo cue to every row', () => {
      const wrapper = mountSwitcher({
        local: cluster('local'), all: [cluster('p1'), cluster('p2')], clusterCount: 2, routeCombo: true
      });
      const rows = wrapper.findAllComponents({ name: 'ClusterSwitcherRow' });

      expect(rows).toHaveLength(3);
      rows.forEach((row) => expect(row.props('routeCombo')).toBe(true));
    });
  });

  describe('accessibility (WAI-ARIA combobox + listbox)', () => {
    it('the search input is a combobox that controls the results listbox', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1')], clusterCount: 1 });
      const input = () => wrapper.find('input.switcher-search-input');

      expect(input().attributes('role')).toBe('combobox');
      expect(input().attributes('aria-autocomplete')).toBe('list');
      expect(input().attributes('aria-haspopup')).toBe('listbox');
      expect(input().attributes('aria-controls')).toBe('cluster-switcher-listbox');
      expect(wrapper.find('#cluster-switcher-listbox').attributes('role')).toBe('listbox');

      // aria-expanded is bound to `open`, not hard-coded, so it can't drift from the state it describes
      // if the popper is ever mounted while the flyout is closed.
      expect(input().attributes('aria-expanded')).toBe('false');

      (wrapper.vm as any).setOpen(true);
      await wrapper.vm.$nextTick();

      expect(input().attributes('aria-expanded')).toBe('true');
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

    // The fixed `local` tile heads the nav model and the combobox owns its listbox, so it stays
    // above the search door yet is keyboard-reachable.
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

    // The pin stays out of the tab order (a focusable control inside `role="option"` is invalid ARIA),
    // so the combobox has to own the keyboard path — otherwise the flyout, the only surface where a
    // cluster outside PINNED/RECENT can be pinned, is mouse-only. WCAG 2.2 2.1.1 (Level A).
    it('Alt+P pins and unpins the row under the keyboard cursor', () => {
      const p1 = cluster('p1');
      const p2 = cluster('p2');
      const wrapper = mountSwitcher({ all: [p1, p2] });
      const vm = wrapper.vm as any;
      const altP = () => vm.onKeydown({
        key: 'p', code: 'KeyP', altKey: true, preventDefault() {}
      });

      altP();
      expect(p1.pin).toHaveBeenCalledTimes(1);

      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> p2
      p2.pinned = true;
      altP();
      expect(p2.unpin).toHaveBeenCalledTimes(1);
      expect(p2.pin).not.toHaveBeenCalled();
    });

    // `p` without Alt is a search character, and `local` is never pinnable.
    it('Alt+P is inert without Alt, and on the local row', () => {
      const local = cluster('local');
      const p1 = cluster('p1');
      const wrapper = mountSwitcher({ local, all: [p1] });
      const vm = wrapper.vm as any;

      vm.onKeydown({
        key: 'p', code: 'KeyP', altKey: false, preventDefault() {}
      });
      expect(p1.pin).not.toHaveBeenCalled();

      vm.onKeydown({ key: 'ArrowUp', preventDefault() {} }); // cursor -> local
      vm.onKeydown({
        key: 'p', code: 'KeyP', altKey: true, preventDefault() {}
      });
      expect(local.pin).not.toHaveBeenCalled();
    });

    // The flyout puts up a full-page scrim, so Tab must not walk focus out onto content that scrim
    // covers and click-blocks.
    it('contains Tab and Shift+Tab inside the popover', async() => {
      const wrapper = mountSwitcher({
        all: [cluster('p1')], search: 'p', clusterCount: 1
      }, document.body);
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      const input = wrapper.find('input.switcher-search-input').element as HTMLElement;
      const clear = wrapper.find('button.switcher-clear').element as HTMLElement;
      const tab = (shiftKey = false) => {
        const preventDefault = jest.fn();

        vm.onKeydown({
          key: 'Tab', shiftKey, preventDefault
        });

        return preventDefault;
      };

      input.focus();
      expect(tab()).toHaveBeenCalledWith();
      expect(document.activeElement).toBe(clear);

      // Tab off the LAST control wraps back to the first rather than escaping the scrim.
      tab();
      expect(document.activeElement).toBe(input);

      // ...and the same backwards.
      tab(true);
      expect(document.activeElement).toBe(clear);

      wrapper.unmount();
    });
  });
});
