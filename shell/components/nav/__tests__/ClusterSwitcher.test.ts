import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';
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
  it.each([19, 0])('uses the one "jump to" placeholder (count: %s)', (clusterCount) => {
    const wrapper = mountSwitcher({ clusterCount });

    expect((wrapper.vm as any).placeholder).toBe('nav.switcher.jumpTo');
  });

  // WCAG 2.5.3 (Label in Name). The box has no visible label — the placeholder is the only text a sighted
  // user sees — so the accessible name has to CONTAIN those words, or a speech-input user saying "jump to"
  // matches nothing. Asserted against the real translations, since the two strings are what the rule is
  // about: wiring the keys up proves nothing on its own.
  it('names the search box with text that contains its visible placeholder', () => {
    const input = mountSwitcher().find('input.switcher-search-input');

    // The suite renders keys rather than copy (the global i18n stub wraps them in `%…%`), so match on the
    // key each attribute resolves to; the strings themselves are checked against the translations below.
    expect(input.attributes('aria-label')).toContain('nav.switcher.aria.search');
    expect(input.attributes('placeholder')).toContain('nav.switcher.jumpTo');

    const en = load(readFileSync(resolve(__dirname, '../../../assets/translations/en-us.yaml'), 'utf8')) as any;
    const { jumpTo, aria } = en.nav.switcher;
    // Trim the placeholder's trailing ellipsis: it is a typographic hint, not part of the spoken label.
    const visible = jumpTo.replace(/\.+$/, '').toLowerCase();

    expect(aria.search.toLowerCase()).toContain(visible);
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
    it('orders the panel search, local, caption, list', () => {
      const wrapper = mountSwitcher({
        local: cluster('local'), all: [cluster('p1')], clusterCount: 7
      });
      const html = wrapper.html();
      const at = (cls: string) => html.indexOf(cls);

      // Template `t` renders through the global test stub (`%key%`), unlike the composable mocked above.
      expect(wrapper.find('.switcher-group-label').text()).toBe('%nav.switcher.allClusters% 7');
      expect(at('switcher-search')).toBeLessThan(at('switcher-local'));
      expect(at('switcher-local')).toBeLessThan(at('switcher-group-label'));
      expect(at('switcher-group-label')).toBeLessThan(at('switcher-scroll'));
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
    // above the search door yet is keyboard-reachable — and, being first, it is what Enter answers
    // with on a fresh open.
    it('opens with the cursor on the fixed local tile, the directory one keystroke below', async() => {
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

      // On open the cursor lands on local, so Enter goes straight to the management cluster.
      vm.setOpen(true);
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');

      // ArrowUp has nowhere above local to go...
      vm.onKeydown({ key: 'ArrowUp', preventDefault() {} });
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');

      // ...and Enter explores it.
      vm.onKeydown({ key: 'Enter', preventDefault() {} });
      expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'local' });

      // One ArrowDown reaches the first directory row.
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p1');
    });

    // A search takes the fixed tile down: while one is running `local` is not a pinned shortcut, it is
    // a cluster like any other and has to earn a place in the results. So the cursor follows the matches,
    // and `local` only appears when it actually matches.
    it('takes the local tile down while searching and lets local match like any other cluster', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), all: [cluster('p1'), cluster('p2')], clusterCount: 2
      });
      const vm = wrapper.vm as any;
      const input = () => wrapper.find('input.switcher-search-input');

      vm.setOpen(true);
      await nextTick();
      expect(vm.localTile?.id).toBe('local');

      // Typing: the skeleton is on screen, so nothing is highlighted and the search box keeps the user.
      await wrapper.setProps({ search: 'm', searchLoading: true });
      await nextTick();
      expect(vm.localTile).toBeNull();
      expect(vm.localOffset).toBe(0);
      expect(input().attributes('aria-activedescendant')).toBeUndefined();

      // Results arrive: the cursor lands on the first MATCH, so Enter opens it.
      // `cluster()` is the suite's minimal row stub, not a full TopLevelMenuCluster — the component only
      // reads the handful of fields it sets, so cast rather than pad every fixture.
      await wrapper.setProps({ searchLoading: false, searchResults: [cluster('m1'), cluster('m2')] } as any);
      await nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-m1');

      vm.onKeydown({ key: 'Enter', preventDefault() {} });
      expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'm1' });

      // Searching for it finds `local` in the results, with no fixed tile duplicating it above.
      await wrapper.setProps({ search: 'local', searchResults: [cluster('local')] } as any);
      await nextTick();
      expect(vm.localTile).toBeNull();
      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['local']);
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');

      // Search over: the tile is back and the cursor rests on it again.
      await wrapper.setProps({ search: '', searchResults: [] } as any);
      await nextTick();
      expect(vm.localTile?.id).toBe('local');
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');
    });

    // A cursor the user drove themselves is theirs — a later page of results must not take it back.
    it('leaves a user-moved cursor where it is when more results arrive', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), searchResults: [cluster('m1'), cluster('m2')], search: 'm'
      });
      const vm = wrapper.vm as any;

      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> m2, deliberately
      await nextTick();

      await wrapper.setProps({ searchResults: [cluster('m1'), cluster('m2'), cluster('m3')] } as any);
      await nextTick();

      expect(vm.activeIndex).toBe(1);
      expect(vm.navRows[vm.activeIndex].id).toBe('m2');
    });

    // A cold open (nothing pinned, no visit history) has an empty directory, so the only row is the fixed
    // `local` tile. Page 1 landing must not take the cursor off it — a cold open and a warm one have to
    // answer the same keystroke with the same cluster.
    it('keeps the cursor on local when the directory lands after a cold open', async() => {
      const wrapper = mountSwitcher({ local: cluster('local'), all: [] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();
      expect(vm.navRows[vm.activeIndex].id).toBe('local');

      await wrapper.setProps({ all: [cluster('a'), cluster('b')] } as any);
      await nextTick();

      expect(vm.activeIndex).toBe(0);
      expect(vm.navRows[vm.activeIndex].id).toBe('local');
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

    // Alt+P is advertised to screen readers via aria-keyshortcuts, but the pin control itself is
    // aria-hidden inside the option — so without an announcement the toggle has no perceivable result.
    it('announces the pin toggle through the live region', async() => {
      const p1 = cluster('p1');
      const wrapper = mountSwitcher({ all: [p1], clusterCount: 1 });
      const vm = wrapper.vm as any;
      const status = () => wrapper.find('[role=\'status\']').text();
      const altP = () => vm.onKeydown({
        key: 'p', code: 'KeyP', altKey: true, preventDefault() {}
      });

      expect(status()).toContain('nav.switcher.aria.results');

      altP();
      await nextTick();
      expect(status()).toContain('nav.switcher.aria.pinnedCluster');

      p1.pinned = true;
      altP();
      await nextTick();
      expect(status()).toContain('nav.switcher.aria.unpinnedCluster');

      // Typing again is a new result set — the count has to take the region back over.
      await wrapper.setProps({ search: 'p' });
      await nextTick();
      expect(status()).toContain('nav.switcher.aria');
      expect(status()).not.toContain('pinnedCluster');
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
      const tab = (shiftKey = false) => {
        const preventDefault = jest.fn();

        vm.onKeydown({
          key: 'Tab', shiftKey, preventDefault
        });

        return preventDefault;
      };

      // The search box is the only tabbable control in the popover, so Tab has to wrap straight back to
      // it rather than letting focus escape the scrim — in both directions.
      input.focus();
      expect(tab()).toHaveBeenCalledWith();
      expect(document.activeElement).toBe(input);

      tab(true);
      expect(document.activeElement).toBe(input);

      wrapper.unmount();
    });

    // Focus is what keeps the keyboard alive: `@keydown` sits on the flyout div, but a mousedown on the
    // popover's non-interactive chrome would move focus to floating-vue's popper ROOT — an ancestor —
    // and every later ↑/↓, Enter and Alt+P would miss the handler entirely.
    it('keeps the caret in the search box when the popover chrome is clicked', async() => {
      const wrapper = mountSwitcher({
        all: [cluster('p1')], search: 'p', clusterCount: 1
      }, document.body);
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      const mousedown = (target: HTMLElement) => {
        const e = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

        target.dispatchEvent(e);

        return e.defaultPrevented;
      };

      // Chrome (the flyout itself, captions, padding): focus must not move off the search box.
      expect(mousedown(wrapper.find('.cluster-switcher-flyout').element as HTMLElement)).toBe(true);

      // A real control still takes focus the way the user aimed it. (The clear X is not checked here: it
      // carries its own `@mousedown.prevent`, for the same reason.)
      expect(mousedown(wrapper.find('input.switcher-search-input').element as HTMLElement)).toBe(false);

      wrapper.unmount();
    });
  });
});
