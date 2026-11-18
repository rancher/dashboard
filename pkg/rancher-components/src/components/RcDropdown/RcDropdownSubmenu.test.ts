import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { recomputeAllPoppers } from 'floating-vue';
import {
  RcDropdown, RcDropdownItem, RcDropdownItemCheckbox, RcDropdownItemRadio, RcDropdownSubmenu
} from '@components/RcDropdown';

jest.mock('floating-vue', () => ({ ...jest.requireActual('floating-vue'), recomputeAllPoppers: jest.fn() }));

/** Draws its popper into its container, as floating-vue does, so key presses bubble the same way */
const vDropdownMock = defineComponent({
  props: {
    shown: Boolean, container: { type: Object, default: null }, skidding: { type: Number, default: 0 }, shift: { type: Boolean, default: true }
  },
  template: `
    <div class="v-popper">
      <slot />
      <Teleport v-if="container" :to="container">
        <div class="v-popper__wrapper" :data-shown="shown">
          <slot name="popper" />
        </div>
      </Teleport>
    </div>
  `,
});

const Menu = defineComponent({
  components: {
    RcDropdown, RcDropdownItem, RcDropdownItemCheckbox, RcDropdownItemRadio, RcDropdownSubmenu
  },
  props:    { open: Boolean },
  emits:    ['update:open', 'pick'],
  template: `
    <button id="outside">Outside</button>
    <rc-dropdown :open="open" @update:open="$emit('update:open', $event)">
      <template #dropdownCollection>
        <rc-dropdown-item id="command" @click="$emit('pick', 'command')">Command</rc-dropdown-item>
        <rc-dropdown-submenu id="group" side="left">
          Group By
          <template #after>None</template>
          <template #submenu>
            <rc-dropdown-item-radio id="radio-a" checked @click="$emit('pick', 'a')">A</rc-dropdown-item-radio>
            <rc-dropdown-item-radio id="radio-b" @click="$emit('pick', 'b')">B</rc-dropdown-item-radio>
            <rc-dropdown-item-checkbox id="check" indicator="checkmark" :model-value="true">Shown</rc-dropdown-item-checkbox>
            <rc-dropdown-item id="reset" acts-on-checkable-items @click="$emit('pick', 'reset')">Reset</rc-dropdown-item>
          </template>
        </rc-dropdown-submenu>
        <rc-dropdown-submenu id="other">
          Other
          <template #submenu>
            <rc-dropdown-item id="other-item">Other item</rc-dropdown-item>
          </template>
        </rc-dropdown-submenu>
      </template>
    </rc-dropdown>
  `,
});

const byId = (id: string) => document.getElementById(id) as HTMLElement;

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

/** The menu's popper, then the submenu's */
const poppers = (wrapper: VueWrapper) => wrapper.findAllComponents(vDropdownMock);

describe('component: RcDropdownSubmenu.vue', () => {
  let wrapper: VueWrapper;

  // jsdom has no layout; items scroll themselves into view as they take the focus
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  const openMenu = async() => {
    wrapper = mount(Menu, {
      attachTo: document.body,
      props:    { open: true },
      global:   { components: { 'v-dropdown': vDropdownMock } },
    });
    await nextTick();
    // The container refs are set once mounted, so the poppers draw on the next render
    await nextTick();
  };

  afterEach(() => wrapper?.unmount());

  it('should announce a submenu, and open it with a click', async() => {
    await openMenu();

    const row = byId('group');

    expect(row.getAttribute('role')).toBe('menuitem');
    expect(row.getAttribute('aria-haspopup')).toBe('menu');
    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(poppers(wrapper)).toHaveLength(2);
    expect(poppers(wrapper)[1].props('shown')).toBe(false);

    row.click();
    await nextTick();

    expect(row.getAttribute('aria-expanded')).toBe('true');
    expect(poppers(wrapper)[1].props('shown')).toBe(true);

    const submenu = byId(row.getAttribute('aria-controls') as string);

    expect(submenu.getAttribute('role')).toBe('menu');
    // Named by the item's label, without its value
    expect(byId(submenu.getAttribute('aria-labelledby') as string).textContent?.trim()).toBe('Group By');
    expect(submenu.contains(byId('radio-a'))).toBe(true);
    expect(byId('command').closest('[dropdown-menu-collection]')).not.toBe(submenu);
    // Beside the menu's popper, not inside it, where scrolling would clip it
    expect(byId('command').closest('.v-popper__wrapper')?.contains(submenu)).toBe(false);
  });

  describe('raised to fit the page', () => {
    const innerHeight = window.innerHeight;

    afterEach(() => {
      Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
    });

    /** Lays out the menu's top, the row's foot and the submenu's height, as jsdom has no layout */
    const openAt = async({
      menuTop, rowBottom, height, windowHeight
    }: { menuTop: number, rowBottom: number, height: number, windowHeight: number }) => {
      await openMenu();
      Object.defineProperty(window, 'innerHeight', { value: windowHeight, configurable: true });

      const row = byId('group');
      const menu = byId('command').closest('[dropdown-menu-collection]') as HTMLElement;
      const rect = (top: number, bottom: number) => (() => ({
        top, bottom, height: bottom - top
      })) as unknown as () => DOMRect;

      menu.getBoundingClientRect = rect(menuTop, menuTop + 100);
      row.getBoundingClientRect = rect(rowBottom - 30, rowBottom);
      row.click();
      await nextTick();
      byId(row.getAttribute('aria-controls') as string).getBoundingClientRect = rect(0, height);
      poppers(wrapper)[1].vm.$emit('apply-show');
      await nextTick();

      return poppers(wrapper)[1];
    };

    it('should rise just enough to fit, and not be kept on screen as the page scrolls', async() => {
      const submenu = await openAt({
        menuTop: 500, rowBottom: 540, height: 400, windowHeight: 700
      });

      // 500 + 400 + the 16px edge gap is 216px past the page's foot
      expect(submenu.props('skidding')).toBe(-216);
      expect(submenu.props('shift')).toBe(false);
    });

    it('should rise no further than where its foot meets its own row', async() => {
      const submenu = await openAt({
        menuTop: 300, rowBottom: 390, height: 100, windowHeight: 350
      });

      expect(submenu.props('skidding')).toBe(-10);
    });

    it('should keep fitting as the page scrolls, until it closes', async() => {
      const submenu = await openAt({
        menuTop: 100, rowBottom: 140, height: 400, windowHeight: 700
      });

      expect(submenu.props('skidding') || 0).toBe(0);

      // The page scrolls the menu down to 500: it now runs 216px past the page's foot
      const menu = byId('command').closest('[dropdown-menu-collection]') as HTMLElement;
      const row = byId('group');

      menu.getBoundingClientRect = (() => ({ top: 500, bottom: 600 })) as unknown as () => DOMRect;
      row.getBoundingClientRect = (() => ({ top: 510, bottom: 540 })) as unknown as () => DOMRect;
      document.dispatchEvent(new Event('scroll'));
      await nextTick();

      expect(submenu.props('skidding')).toBe(-216);

      submenu.vm.$emit('apply-hide');
      menu.getBoundingClientRect = (() => ({ top: 100, bottom: 200 })) as unknown as () => DOMRect;
      document.dispatchEvent(new Event('scroll'));
      await nextTick();

      expect(submenu.props('skidding')).toBe(-216);
    });

    it('should be placed again once the menu has moved with the window', async() => {
      await openAt({
        menuTop: 100, rowBottom: 140, height: 200, windowHeight: 900
      });
      (recomputeAllPoppers as jest.Mock).mockClear();

      window.dispatchEvent(new Event('resize'));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(recomputeAllPoppers).toHaveBeenCalledTimes(1);
    });

    it('should keep its height once raised to its row, however short the window gets', async() => {
      await openAt({
        menuTop: 100, rowBottom: 290, height: 150, windowHeight: 300
      });

      // Where the popper caps its height
      const inner = document.createElement('div');

      inner.className = 'v-popper__inner';
      byId(byId('group').getAttribute('aria-controls') as string).appendChild(inner);

      const resize = async(windowHeight: number) => {
        Object.defineProperty(window, 'innerHeight', { value: windowHeight, configurable: true });
        window.dispatchEvent(new Event('resize'));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        return inner.style.maxHeight;
      };

      // Raised to its row, whose foot is below the window's less the edge gap: from the top to the row
      expect(await resize(300)).toBe('274px');
      expect(await resize(280)).toBe('274px');
      // With room below its row, the window's foot is the limit
      expect(await resize(700)).toBe('668px');
    });

    it('should stay at the menu\'s top when it fits, never lower', async() => {
      const submenu = await openAt({
        menuTop: 100, rowBottom: 140, height: 200, windowHeight: 900
      });

      expect(submenu.props('skidding') || 0).toBe(0);
    });
  });

  it('should open toward its side from the keyboard, focusing its first item, and close back to its row', async() => {
    await openMenu();

    const row = byId('group');

    row.focus();
    key(row, 'ArrowLeft');
    await nextTick();
    poppers(wrapper)[1].vm.$emit('apply-show');
    await nextTick();

    expect(document.activeElement).toBe(byId('radio-a'));

    key(byId('radio-a'), 'ArrowDown');
    expect(document.activeElement).toBe(byId('radio-b'));

    key(byId('radio-b'), 'Escape');
    await nextTick();

    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(row);
    expect(poppers(wrapper)[0].props('shown')).toBe(true);
  });

  it('should name each submenu after its own item', async() => {
    await openMenu();

    byId('other').click();
    await nextTick();

    const submenu = byId(byId('other').getAttribute('aria-controls') as string);

    expect(byId(submenu.getAttribute('aria-labelledby') as string).textContent?.trim()).toBe('Other');
    expect(submenu.contains(byId('other-item'))).toBe(true);
  });

  it('should leave an arrow pressed with a modifier to the consumer', async() => {
    await openMenu();

    byId('group').click();
    await nextTick();
    byId('radio-a').focus();
    byId('radio-a').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', altKey: true, bubbles: true
    }));
    byId('radio-a').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowLeft', altKey: true, bubbles: true
    }));
    await nextTick();

    expect(document.activeElement).toBe(byId('radio-a'));
    expect(byId('group').getAttribute('aria-expanded')).toBe('true');
  });

  it('should move one item with Shift and an arrow, as with the arrow alone', async() => {
    await openMenu();
    // The menu learns its items once shown
    poppers(wrapper)[0].vm.$emit('apply-show');
    await nextTick();

    byId('command').focus();
    byId('command').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', shiftKey: true, bubbles: true
    }));

    expect(document.activeElement).toBe(byId('group'));
  });

  it.each(['ctrlKey', 'altKey', 'metaKey'])('should not move the focus for an arrow with %s, nor jump to an end', async(modifier) => {
    await openMenu();
    poppers(wrapper)[0].vm.$emit('apply-show');
    await nextTick();

    byId('group').focus();
    byId('group').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown', [modifier]: true, bubbles: true
    }));
    await nextTick();
    byId('group').dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowUp', [modifier]: true, bubbles: true
    }));
    await nextTick();

    expect(document.activeElement).toBe(byId('group'));
  });

  it('should not draw a submenu inside a submenu, and say why', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const Nested = defineComponent({
      components: {
        RcDropdown, RcDropdownItem, RcDropdownSubmenu
      },
      template: `
        <rc-dropdown :open="true">
          <template #dropdownCollection>
            <rc-dropdown-submenu id="outer">
              Outer
              <template #submenu>
                <rc-dropdown-item id="outer-item">Outer item</rc-dropdown-item>
                <rc-dropdown-submenu id="inner">
                  Inner
                  <template #submenu>
                    <rc-dropdown-item id="inner-item">Inner item</rc-dropdown-item>
                  </template>
                </rc-dropdown-submenu>
              </template>
            </rc-dropdown-submenu>
          </template>
        </rc-dropdown>
      `,
    });

    wrapper = mount(Nested, { attachTo: document.body, global: { components: { 'v-dropdown': vDropdownMock } } });
    await nextTick();
    await nextTick();
    byId('outer').click();
    await nextTick();

    expect(byId('outer-item')).not.toBeNull();
    expect(byId('inner')).toBeNull();
    expect(byId('inner-item')).toBeNull();
    expect(byId('outer').getAttribute('aria-expanded')).toBe('true');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('one level deep'));
    warn.mockRestore();
  });

  it('should close with the arrow back toward its menu', async() => {
    await openMenu();

    const row = byId('group');

    row.focus();
    key(row, 'Enter');
    await nextTick();
    poppers(wrapper)[1].vm.$emit('apply-show');
    await nextTick();
    key(byId('radio-a'), 'ArrowRight');
    await nextTick();

    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(row);
  });

  it('should keep the menu open for a choice, and say which is checked', async() => {
    await openMenu();

    byId('group').click();
    await nextTick();

    expect(byId('radio-a').getAttribute('role')).toBe('menuitemradio');
    expect(byId('radio-a').getAttribute('aria-checked')).toBe('true');
    expect(byId('radio-b').getAttribute('aria-checked')).toBe('false');
    expect(byId('check').getAttribute('role')).toBe('menuitemcheckbox');
    expect(byId('check').getAttribute('aria-checked')).toBe('true');
    expect(byId('check').querySelector('.icon-checkmark')).not.toBeNull();

    byId('radio-b').click();
    await nextTick();

    expect(wrapper.emitted('pick')).toStrictEqual([['b']]);
    expect(wrapper.emitted('update:open')?.flat()).not.toContain(false);
  });

  it('should keep the menu open for a command that changes its checkable items', async() => {
    await openMenu();

    byId('group').click();
    await nextTick();
    byId('reset').click();
    await nextTick();

    expect(wrapper.emitted('pick')).toStrictEqual([['reset']]);
    expect(wrapper.emitted('update:open')?.flat()).not.toContain(false);
    expect(byId('group').getAttribute('aria-expanded')).toBe('true');
  });

  it('should close the menu for a command, returning the focus to what had it when opened', async() => {
    // From the button, as a menu without a trigger is
    wrapper = mount(Menu, {
      attachTo: document.body,
      props:    { open: false },
      global:   { components: { 'v-dropdown': vDropdownMock } },
    });
    await nextTick();
    byId('outside').focus();
    key(byId('outside'), 'Enter');
    await wrapper.setProps({ open: true });
    await nextTick();
    poppers(wrapper)[0].vm.$emit('apply-show');
    await nextTick();

    expect(document.activeElement).toBe(byId('command'));

    byId('command').click();
    await nextTick();

    expect(wrapper.emitted('update:open')?.pop()).toStrictEqual([false]);
    expect(document.activeElement).toBe(byId('outside'));
  });

  it('should switch submenus on hover only after a moment, and close one when the pointer moves to another item', async() => {
    jest.useFakeTimers();
    await openMenu();

    const row = byId('group');

    row.dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();
    expect(row.getAttribute('aria-expanded')).toBe('true');

    byId('command').dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();
    expect(row.getAttribute('aria-expanded')).toBe('true');

    jest.advanceTimersByTime(300);
    await nextTick();
    expect(row.getAttribute('aria-expanded')).toBe('false');
    jest.useRealTimers();
  });
});
