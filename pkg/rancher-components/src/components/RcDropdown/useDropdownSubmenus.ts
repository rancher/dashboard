import {
  defineComponent, nextTick, onBeforeUnmount, provide, ref, shallowRef, watch, PropType, Ref
} from 'vue';
import { DropdownContext, DropdownSubmenu } from './types';

/** Time to cross the items between one that opened a submenu and the submenu, before another takes over */
const SUBMENU_GRACE_MS = 300;

let submenuHosts = 0;

/**
 * The submenus of one RcDropdown. They share one popper, drawn beside the menu: two blinked when
 * moving between them, one closing and the other being placed not happening at once.
 *
 * One level deep: a submenu inside a submenu isn't drawn.
 */
export const useDropdownSubmenus = (isMenuOpen: Ref<boolean>, closeMenu: () => void) => {
  const submenuId = `rc-dropdown-submenu-${ ++submenuHosts }`;

  const submenus = shallowRef<DropdownSubmenu[]>([]);

  const activeSubmenu = shallowRef<DropdownSubmenu | null>(null);

  /** Follows `activeSubmenu` in but not out, so a closing submenu keeps its items rather than collapsing for a frame */
  const shownSubmenu = shallowRef<DropdownSubmenu | null>(null);

  /** The submenu's `role="menu"` element */
  const submenuTarget = ref<HTMLElement | null>(null);

  const submenuItems = ref<Element[]>([]);

  let switchTimer: ReturnType<typeof setTimeout> | undefined;

  let focusWhenShown = false;

  /** Read again before each key press is handled: the items can change, or be reordered, while it is open */
  const refreshSubmenuItems = () => {
    submenuItems.value = Array.from(submenuTarget.value?.querySelectorAll('[dropdown-menu-item]') || []);
  };

  const focusSubmenuItem = (which: 'first' | 'last') => {
    refreshSubmenuItems();

    const items = submenuItems.value;

    (items[which === 'first' ? 0 : items.length - 1] as HTMLElement | undefined)?.focus();
  };

  const setSubmenu = (submenu: DropdownSubmenu | null) => {
    clearTimeout(switchTimer);

    // The focus leaves with its submenu, or it would be left in a hidden popper
    if (activeSubmenu.value && activeSubmenu.value !== submenu && submenuTarget.value?.contains(document.activeElement)) {
      activeSubmenu.value.row()?.focus();
    }

    activeSubmenu.value = submenu;

    if (submenu) {
      shownSubmenu.value = submenu;
    }
  };

  const openSubmenu = (submenu: DropdownSubmenu, focusFirst: boolean) => {
    setSubmenu(submenu);

    if (!focusFirst) {
      return;
    }

    // Already on screen, the popper takes the new items in place; otherwise they can't take the
    // focus until it is
    nextTick(() => {
      focusSubmenuItem('first');
      focusWhenShown = !submenuTarget.value?.contains(document.activeElement);
    });
  };

  const closeSubmenu = () => {
    const row = activeSubmenu.value?.row();

    setSubmenu(null);
    row?.focus();
  };

  /** Opening is immediate; switching away from an open one waits, see SUBMENU_GRACE_MS */
  const hoverSubmenu = (submenu: DropdownSubmenu | null) => {
    clearTimeout(switchTimer);

    if (activeSubmenu.value === submenu) {
      return;
    }

    if (!activeSubmenu.value) {
      if (submenu) {
        setSubmenu(submenu);
      }

      return;
    }

    switchTimer = setTimeout(() => setSubmenu(submenu), SUBMENU_GRACE_MS);
  };

  const cancelSubmenuSwitch = () => clearTimeout(switchTimer);

  const registerSubmenu = (submenu: DropdownSubmenu) => {
    submenus.value = [...submenus.value, submenu];

    return () => {
      submenus.value = submenus.value.filter((s) => s !== submenu);

      if (activeSubmenu.value === submenu) {
        setSubmenu(null);
      }

      if (shownSubmenu.value === submenu) {
        shownSubmenu.value = null;
      }
    };
  };

  /** A tick later, as the menu's own focus is: the popper is still hidden when it says it is shown */
  const onSubmenuShown = () => {
    if (focusWhenShown) {
      focusWhenShown = false;
      nextTick(() => focusSubmenuItem('first'));
    }
  };

  /** Keys that reach the submenu: its items handle the arrows up and down themselves */
  const onSubmenuKeydown = (e: KeyboardEvent) => {
    const submenu = activeSubmenu.value;

    // An arrow with a modifier is the consumer's, eg to move an item
    if (!submenu || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    // Left closes one either way, as menus do; one on the left closes toward its menu too
    const backToMenu = e.key === 'ArrowLeft' || (submenu.side === 'left' && e.key === 'ArrowRight');

    if (e.key === 'Escape' || backToMenu) {
      e.preventDefault();
      e.stopPropagation();
      closeSubmenu();
    } else if (e.key === 'Tab') {
      closeMenu();
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target === submenuTarget.value) {
      e.preventDefault();
      focusSubmenuItem(e.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  watch(isMenuOpen, (open) => {
    if (!open) {
      clearTimeout(switchTimer);
      focusWhenShown = false;
      activeSubmenu.value = null;
    }
  });

  onBeforeUnmount(() => clearTimeout(switchTimer));

  /** Draws a submenu's items, as items of the submenu rather than of the menu it opens from */
  const makeSubmenuContent = (menuContext: DropdownContext) => defineComponent({
    name:  'RcDropdownSubmenuContent',
    props: { submenu: { type: Object as PropType<DropdownSubmenu>, required: true } },
    setup(props) {
      provide<DropdownContext>('dropdownContext', {
        ...menuContext,
        dropdownItems:     submenuItems,
        focusFirstElement: () => focusSubmenuItem('first'),
        // Within its own submenu, the pointer is where it should be
        hoverSubmenu:      () => cancelSubmenuSwitch(),
        // One level: a submenu here would take over this one's popper
        registerSubmenu:   () => () => null,
        openSubmenu:       () => null,
        inSubmenu:         true,
      });

      return () => props.submenu.render();
    }
  });

  return {
    submenuId,
    submenus,
    activeSubmenu,
    shownSubmenu,
    submenuTarget,
    registerSubmenu,
    openSubmenu,
    hoverSubmenu,
    cancelSubmenuSwitch,
    refreshSubmenuItems,
    onSubmenuShown,
    onSubmenuKeydown,
    makeSubmenuContent,
  };
};
