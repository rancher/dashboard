import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import {
  RcDropdown, RcDropdownItem, RcDropdownItemCheckbox, RcDropdownItemRadio, RcDropdownSubmenu
} from '@components/RcDropdown';

/** Draws its popper into its container, as floating-vue does, so key presses bubble the same way */
const vDropdownMock = defineComponent({
  props:    { shown: Boolean, container: { type: Object, default: null } },
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
