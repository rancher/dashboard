import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';
import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ClusterSwitcher from '@shell/components/nav/ClusterSwitcher.vue';
import ClusterSwitcherSkeleton from '@shell/components/nav/ClusterSwitcherSkeleton.vue';

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
// Every wrapper this suite mounts, so each test starts with no other flyout listening. An open flyout
// takes the keys it owns at the WINDOW and consumes them, so one left mounted swallows the next test's.
const mounted: any[] = [];

const mountSwitcher = (props = {}, attachTo?: HTMLElement) => trackWrapper(shallowMount(ClusterSwitcher, {
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
}));

// Generic, so tracking a wrapper does not erase its type for the assertions that follow.
function trackWrapper<T>(wrapper: T): T {
  mounted.push(wrapper);

  return wrapper;
}

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
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

    // Nothing is highlighted until a key says so.
    expect(vm.activeIndex).toBe(-1);
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
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

  // One list serves both states — the estate at rest, the matches while searching — so what an EMPTY one
  // means depends on which it is: no answer to the query, or page 1 not landed yet.
  describe('the estate list when it has no rows', () => {
    it('says no matches while searching', async() => {
      const wrapper = mountSwitcher({
        search: 'zzz', searchResults: [], clusterCount: 7
      });

      await nextTick();

      expect(wrapper.find('.switcher-empty').exists()).toBe(true);
      expect(wrapper.findAllComponents(ClusterSwitcherSkeleton)).toHaveLength(0);
    });

    // An estate cannot really be empty here — the switcher only renders at all for a non-zero browsable
    // count — so an empty one means the request is still out, and the skeleton says so.
    it('shows the skeleton at rest, not the empty state', () => {
      const wrapper = mountSwitcher({ all: [], clusterCount: 7 });

      expect(wrapper.find('.switcher-empty').exists()).toBe(false);
      expect(wrapper.findAllComponents(ClusterSwitcherSkeleton).length).toBeGreaterThan(0);
    });
  });

  // RECENTLY USED sits between the fixed tile and the estate: a shortcut to where the user just was.
  describe('recently used', () => {
    const recent = [cluster('r1'), cluster('r2')];

    it('renders between the local tile and ALL CLUSTERS, and the cursor walks all three in order', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent, all: [cluster('p1')], clusterCount: 1
      });
      const vm = wrapper.vm as any;

      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['local', 'r1', 'r2', 'p1']);
      // The estate's rows are offset by the whole head, not just the tile.
      expect(vm.resultsOffset).toBe(3);

      const order = [];

      vm.setOpen(true);
      await nextTick();

      for (let i = 0; i < 4; i++) {
        vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
        order.push(vm.navRows[vm.activeIndex].id);
      }

      expect(order).toStrictEqual(['local', 'r1', 'r2', 'p1']);

      vm.setOpen(false);
    });

    // It is fetched on open rather than kept live, so it shimmers like the estate below instead of popping
    // in beside it.
    it('shows the skeleton while it is being fetched', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent, all: [cluster('p1')]
      });
      const vm = wrapper.vm as any;

      await wrapper.setProps({ recentLoading: true } as any);

      expect(vm.showRecent).toBe(true);
      // Rows are stubbed here, so count them by their option ids.
      expect(wrapper.findAll('[id^="cluster-switcher-opt-recent-"]')).toHaveLength(0);
      expect(wrapper.findAllComponents(ClusterSwitcherSkeleton).length).toBeGreaterThan(0);
      // Nothing to point the cursor at while it is a skeleton.
      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['local', 'p1']);

      await wrapper.setProps({ recentLoading: false } as any);
      expect(wrapper.findAll('[id^="cluster-switcher-opt-recent-"]')).toHaveLength(2);
    });

    // Same rule as the tile: the results ARE the answer to the query, and a shortcut list beside them is
    // just noise to scroll past.
    it('goes down while searching, and comes back when the box is cleared', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent, all: [cluster('p1')]
      });
      const vm = wrapper.vm as any;

      expect(vm.recentRows).toHaveLength(2);

      await wrapper.setProps({ search: 'm', searchResults: [cluster('m1')] } as any);
      expect(vm.recentRows).toHaveLength(0);
      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['m1']);

      await wrapper.setProps({ search: '', searchResults: [] } as any);
      expect(vm.recentRows).toHaveLength(2);
    });

    // A recent cluster may also BE the fixed tile or a row of the estate. Two elements answering to one id
    // would make `aria-activedescendant` ambiguous and hand Vue duplicate keys.
    it('gives its options ids of their own, so a repeated cluster cannot collide', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent: [cluster('local'), cluster('p1')], all: [cluster('p1')], clusterCount: 1
      });
      const vm = wrapper.vm as any;
      const ids = wrapper.findAll('[id^="cluster-switcher-opt"]').map((el: any) => el.attributes('id'));

      expect(ids).toStrictEqual([...new Set(ids)]);
      expect(ids).toContain('cluster-switcher-opt-recent-local');
      expect(ids).toContain('cluster-switcher-opt-local');

      // And the cursor points at the row it is actually on, not at its twin.
      vm.setOpen(true);
      await nextTick();
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // the tile
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // the same cluster, under RECENTLY USED
      await nextTick();

      expect(wrapper.find('input.switcher-search-input').attributes('aria-activedescendant')).toBe('cluster-switcher-opt-recent-local');

      vm.setOpen(false);
    });

    // The scrolling region IS the listbox, and the sections are GROUPS inside it — a listbox may contain
    // groups, but not other listboxes, and one composite widget is also what the combobox points at.
    it('sits in the one listbox the combobox owns, as a group', () => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent, all: [cluster('p1')]
      });

      expect(wrapper.find('input.switcher-search-input').attributes('aria-controls')).toBe('cluster-switcher-listbox');
      expect(wrapper.find('.switcher-scroll').attributes('role')).toBe('listbox');
      expect(wrapper.find('.switcher-scroll').attributes('id')).toBe('cluster-switcher-listbox');
      expect(wrapper.findAll('.switcher-scroll [role="listbox"]')).toHaveLength(0);
      expect(wrapper.find('.switcher-local').attributes('role')).toBe('group');
      expect(wrapper.find('.switcher-recent').attributes('role')).toBe('group');
    });
  });

  // Clicking the panel's own chrome parks focus on floating-vue's popper ROOT, which is an ANCESTOR of
  // the flyout element — so a `keydown` bound there never sees the key. The panel takes its keys at the
  // window instead, and answers them wherever focus has drifted to.
  describe('keys reach the panel wherever focus sits', () => {
    const press = (key: string, over: any = {}) => {
      const e = new KeyboardEvent('keydown', {
        key, code: key, cancelable: true, bubbles: true, ...over
      });

      window.dispatchEvent(e);

      return e;
    };

    it('moves the cursor on ↑/↓ with focus outside the flyout', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      press('ArrowDown');
      expect(vm.navRows[vm.activeIndex].id).toBe('p1');

      press('ArrowDown');
      expect(vm.navRows[vm.activeIndex].id).toBe('p2');

      press('ArrowUp');
      expect(vm.navRows[vm.activeIndex].id).toBe('p1');

      vm.setOpen(false);
    });

    it('explores the highlighted row on Enter', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      press('ArrowDown');
      press('Enter');

      expect((wrapper.emitted('select')?.[0]?.[0] as any)?.id).toBe('p1');

      vm.setOpen(false);
    });

    // A character typed at the panel belongs in the search box, wherever focus drifted to.
    it('sends a typed character back to the search box', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1')] }, document.body);
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      const input = wrapper.find('input.switcher-search-input').element as HTMLInputElement;

      (document.body as HTMLElement).focus();
      expect(document.activeElement).not.toBe(input);

      press('a');
      expect(document.activeElement).toBe(input);

      vm.setOpen(false);
      wrapper.unmount();
    });

    it('gives the keys up once it closes', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();
      vm.setOpen(false);
      await nextTick();

      press('ArrowDown');

      expect(vm.activeIndex).toBe(-1);
    });
  });

  // One highlight, whoever moved last. The pointer drives the same cursor ↑/↓ do, rather than painting a
  // second highlight of its own, so the list never shows two rows and Enter is never ambiguous.
  describe('the pointer and the keyboard share one cursor', () => {
    // `mousemove` delegated at the panel, so the fixture is a move whose target sits inside a row.
    const moveOver = (id: string) => ({ target: { closest: (sel: string) => (sel === '.cluster-switcher-row' ? { id: `cluster-switcher-opt-${ id }` } : null) } });

    it('moves the cursor to the row under the pointer', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')] });
      const vm = wrapper.vm as any;

      expect(vm.activeIndex).toBe(-1);

      vm.onPointerMove(moveOver('p2'));
      expect(vm.activeIndex).toBe(1);

      vm.onPointerMove(moveOver('r1'));
      expect(vm.activeIndex).toBe(2);
    });

    // The whole point of the shared cursor: ↑/↓ pick up from where the pointer left it.
    it('continues from the pointer when the keyboard takes over', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')] });
      const vm = wrapper.vm as any;

      vm.onPointerMove(moveOver('p2'));
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });

      expect(vm.navRows[vm.activeIndex].id).toBe('r1');
    });

    it('ignores a move that is not over a row', () => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
      const vm = wrapper.vm as any;

      vm.onPointerMove(moveOver('p2'));
      vm.onPointerMove({ target: { closest: () => null } });

      expect(vm.activeIndex).toBe(1);
    });
  });

  it('keeps the keyboard cursor on screen as it moves', async() => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2'), cluster('r1')], clusterCount: 3 }, document.body);
    const vm = wrapper.vm as any;

    scrollIntoView.mockClear();
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // into the list, at p1
    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // on to p2
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect((scrollIntoView.mock.instances.at(-1) as HTMLElement).id).toBe('cluster-switcher-opt-p2');

    wrapper.unmount();
  });

  it('Enter explores the active row', () => {
    const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
    const vm = wrapper.vm as any;

    vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // into the list, at p1
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

  // Escape peels one layer: it clears a query first and only closes the panel once the box is empty.
  // One press is two events, so the keyup is swallowed on the strength of what the keydown did — a flag
  // that outlives the close it was set before, and would then eat the NEXT press's keyup.
  it('does not swallow the next press after a close between keydown and keyup', async() => {
    const wrapper = mountSwitcher({ search: 'foo' });
    const vm = wrapper.vm as any;
    const esc = (type: string) => {
      const e = new KeyboardEvent(type, {
        key: 'Escape', cancelable: true, bubbles: true
      });

      window.dispatchEvent(e);

      return e;
    };

    vm.setOpen(true);
    await nextTick();
    // The query is cleared and the press consumed, so floating-vue never sees it and the panel stays open.
    expect(esc('keydown').defaultPrevented).toBe(true);

    // The flyout closes before the keyup for that press lands (auto-repeat, or focus leaving the window).
    vm.setOpen(false);
    await wrapper.setProps({ search: '' });
    await nextTick();
    esc('keyup');

    // Next time it opens there is no query, so nothing should be consumed — the panel has to close.
    vm.setOpen(true);
    await nextTick();
    esc('keydown');
    expect(esc('keyup').defaultPrevented).toBe(false);
  });

  // The ALL CLUSTERS / MATCHES caption sits ABOVE the search box, not inside the
  // scrolling list, and the flyout forwards the Option/Alt cue to every row.
  describe('layout', () => {
    // Search box, then everything else inside the ONE scrolling region: the tile, RECENTLY USED and the
    // estate all travel together rather than a strip scrolling under fixed headings.
    it('orders the panel search, then local, recent and the list inside the scroller', () => {
      const wrapper = mountSwitcher({
        local: cluster('local'), recent: [cluster('r1')], all: [cluster('p1')], clusterCount: 7
      });
      const html = wrapper.html();
      // On the class attribute, not the bare name: the listbox IDS contain the same words.
      const at = (cls: string) => html.indexOf(`class="${ cls }"`);

      expect(wrapper.find('.switcher-scroll .switcher-group-label').exists()).toBe(true);
      expect(at('switcher-search')).toBeLessThan(at('switcher-scroll'));
      expect(at('switcher-scroll')).toBeLessThan(at('switcher-local'));
      expect(at('switcher-local')).toBeLessThan(at('switcher-recent'));
      expect(at('switcher-recent')).toBeLessThan(at('switcher-group'));
      // The scroller holds them all, so one scrollbar moves the whole panel body.
      expect(wrapper.findAll('.switcher-scroll .switcher-local, .switcher-scroll .switcher-recent, .switcher-scroll .switcher-group')).toHaveLength(3);
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

      // Nothing is pointed at until a key moves the cursor into the list.
      expect(input().attributes('aria-activedescendant')).toBeUndefined();

      (wrapper.vm as any).onKeydown({ key: 'ArrowDown', preventDefault() {} });
      await wrapper.vm.$nextTick();
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

    // The fixed `local` tile heads the nav model and the combobox owns its listbox, so it stays above the
    // search door yet is keyboard-reachable — the first ↓ lands on it.
    it('opens with nothing highlighted, and enters the list at the local tile', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), all: [cluster('p1'), cluster('p2')], clusterCount: 2
      });
      const vm = wrapper.vm as any;
      const input = () => wrapper.find('input.switcher-search-input');

      // local heads the navigation model, but the visible results listbox still renders only the directory.
      expect(vm.navRows.map((c: any) => c.id)).toStrictEqual(['local', 'p1', 'p2']);
      expect(vm.rows.map((c: any) => c.id)).toStrictEqual(['p1', 'p2']);
      // One listbox, holding the tile and the estate as groups — that is what the combobox owns.
      expect(input().attributes('aria-controls')).toBe('cluster-switcher-listbox');

      // Opening highlights nothing — a highlight nobody asked for reads as a selection, and Enter would
      // act on it — so Enter is inert until the user has driven the cursor.
      vm.setOpen(true);
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBeUndefined();

      vm.onKeydown({ key: 'Enter', preventDefault() {} });
      expect(wrapper.emitted('select')).toBeUndefined();

      // ↓ enters the list at the top, which is the local tile...
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-local');

      // ...and Enter explores it.
      vm.onKeydown({ key: 'Enter', preventDefault() {} });
      expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'local' });

      // One more ↓ reaches the first directory row.
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} });
      await vm.$nextTick();
      expect(input().attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p1');
    });

    // The other way into the list: from nothing highlighted, ↑ starts at the bottom.
    it('enters the list at the last row on ArrowUp', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await vm.$nextTick();

      vm.onKeydown({ key: 'ArrowUp', preventDefault() {} });
      await vm.$nextTick();

      expect(wrapper.find('input.switcher-search-input').attributes('aria-activedescendant')).toBe('cluster-switcher-opt-p2');
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
      await wrapper.setProps({ search: 'm', listLoading: true });
      await nextTick();
      expect(vm.localTile).toBeNull();
      expect(vm.localOffset).toBe(0);
      expect(input().attributes('aria-activedescendant')).toBeUndefined();

      // Results arrive: the cursor lands on the first MATCH, so Enter opens it.
      // `cluster()` is the suite's minimal row stub, not a full TopLevelMenuCluster — the component only
      // reads the handful of fields it sets, so cast rather than pad every fixture.
      await wrapper.setProps({ listLoading: false, searchResults: [cluster('m1'), cluster('m2')] } as any);
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

      // Search over: the tile is back, and the cursor goes away with the query.
      await wrapper.setProps({ search: '', searchResults: [] } as any);
      await nextTick();
      expect(vm.localTile?.id).toBe('local');
      expect(input().attributes('aria-activedescendant')).toBeUndefined();
    });

    // A cursor the user drove themselves is theirs — a later page of results must not take it back.
    it('leaves a user-moved cursor where it is when more results arrive', async() => {
      const wrapper = mountSwitcher({
        local: cluster('local'), searchResults: [cluster('m1'), cluster('m2')], search: 'm'
      });
      const vm = wrapper.vm as any;

      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // into the list, at m1
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> m2, deliberately
      await nextTick();

      await wrapper.setProps({ searchResults: [cluster('m1'), cluster('m2'), cluster('m3')] } as any);
      await nextTick();

      expect(vm.activeIndex).toBe(1);
      expect(vm.navRows[vm.activeIndex].id).toBe('m2');
    });

    // Opening the flyout, and clearing the search box, both refetch the whole directory. The rows already
    // on screen are about to be replaced wholesale, so they give way to the skeleton rather than sitting
    // there looking current until the swap.
    it('shows the skeleton while the resting list is being refetched', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1'), cluster('p2')], clusterCount: 2 });

      expect(wrapper.findAllComponents(ClusterSwitcherSkeleton)).toHaveLength(0);
      expect(wrapper.find('.switcher-scroll').attributes('aria-busy')).toBe('false');

      await wrapper.setProps({ listLoading: true } as any);

      expect(wrapper.findAll('.switcher-group')).toHaveLength(0);
      expect(wrapper.findAllComponents(ClusterSwitcherSkeleton).length).toBeGreaterThan(0);
      expect(wrapper.find('.switcher-scroll').attributes('aria-busy')).toBe('true');
    });

    // A cold open (nothing pinned, no visit history) has an empty directory, and page 1 lands a moment
    // later. That arrival must not conjure a highlight the user never asked for — a cold open and a warm
    // one both start with nothing selected.
    it('stays unhighlighted when the directory lands after a cold open', async() => {
      const wrapper = mountSwitcher({ local: cluster('local'), all: [] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();
      expect(vm.activeIndex).toBe(-1);

      await wrapper.setProps({ all: [cluster('a'), cluster('b')] } as any);
      await nextTick();

      expect(vm.activeIndex).toBe(-1);
    });

    // The pin stays out of the tab order (a focusable control inside `role="option"` is invalid ARIA),
    // so the combobox has to own the keyboard path — otherwise the flyout, the only surface where a
    // cluster outside PINNED/RECENT can be pinned, is mouse-only. WCAG 2.2 2.1.1 (Level A).
    // Taken at the WINDOW while the flyout is open, so nothing else — the header's binding for the same
    // combo included — can act on it. Both combos are accepted on either platform, the way the header's
    // `v-shortkey` binding registers both of its platform variants.
    it.each([
      ['Cmd+Shift+P', { metaKey: true, shiftKey: true }],
      ['Alt+P', { altKey: true }],
    ])('%s pins and unpins the row under the keyboard cursor', async(_label, mods) => {
      const p1 = cluster('p1');
      const p2 = cluster('p2');
      const wrapper = mountSwitcher({ all: [p1, p2] });
      const vm = wrapper.vm as any;
      const pinKey = () => window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'p', code: 'KeyP', ...mods, cancelable: true, bubbles: true
      }));

      vm.setOpen(true);
      await nextTick();
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> p1

      pinKey();
      expect(p1.pin).toHaveBeenCalledTimes(1);

      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> p2
      p2.pinned = true;
      pinKey();
      expect(p2.unpin).toHaveBeenCalledTimes(1);
      expect(p2.pin).not.toHaveBeenCalled();

      vm.setOpen(false);
    });

    // The flyout silences the app's shortcuts while it is open — the binding that opened it included — so
    // it has to close itself.
    it('closes on the shortcut that opened it, taken at the window', async() => {
      const wrapper = mountSwitcher({ all: [cluster('p1')] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();

      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j', code: 'KeyJ', metaKey: true, cancelable: true, bubbles: true
      }));
      await nextTick();

      expect(vm.open).toBe(false);
    });

    // Closed, the flyout has no claim on the key: it belongs to the header's binding for the cluster on
    // screen, and this listener must be gone.
    it('gives the shortcut up when it closes', async() => {
      const p1 = cluster('p1');
      const wrapper = mountSwitcher({ all: [p1] });
      const vm = wrapper.vm as any;

      vm.setOpen(true);
      await nextTick();
      vm.setOpen(false);
      await nextTick();

      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'p', code: 'KeyP', metaKey: true, shiftKey: true, cancelable: true, bubbles: true
      }));

      expect(p1.pin).not.toHaveBeenCalled();
    });

    // The shortcut is advertised to screen readers via aria-keyshortcuts, but the pin control itself is
    // aria-hidden inside the option — so without an announcement the toggle has no perceivable result.
    it('announces the pin toggle through the live region', async() => {
      const p1 = cluster('p1');
      const wrapper = mountSwitcher({ all: [p1], clusterCount: 1 });
      const vm = wrapper.vm as any;
      const status = () => wrapper.find('[role=\'status\']').text();
      const pinKey = () => window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'p', code: 'KeyP', altKey: true, cancelable: true, bubbles: true
      }));

      vm.setOpen(true);
      await nextTick();
      vm.onKeydown({ key: 'ArrowDown', preventDefault() {} }); // cursor -> p1

      expect(status()).toContain('nav.switcher.aria.results');

      pinKey();
      await nextTick();
      expect(status()).toContain('nav.switcher.aria.pinnedCluster');

      p1.pinned = true;
      pinKey();
      await nextTick();
      expect(status()).toContain('nav.switcher.aria.unpinnedCluster');

      // Typing again is a new result set — the count has to take the region back over.
      await wrapper.setProps({ search: 'p' });
      await nextTick();
      expect(status()).toContain('nav.switcher.aria');
      expect(status()).not.toContain('pinnedCluster');
    });

    // A bare `p` is a search character, and `local` is never pinnable.
    it('the pin shortcut is inert without its modifiers, and on the local row', () => {
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
    // and every later ↑/↓, Enter and pin shortcut would miss the handler entirely.
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
