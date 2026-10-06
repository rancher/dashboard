import {
  nextTick, onBeforeUnmount, ref, watch, Ref
} from 'vue';
import { recomputeAllPoppers } from 'floating-vue';
import { DropdownSubmenu } from './types';

/** How far a submenu's popper keeps from the edges of the page */
const EDGE_GAP = 16;

/** The part of the window the menu shows in, eg below a fixed header. The body stands for the window */
const visibleArea = (el: Element) => {
  let top = 0;
  let bottom = window.innerHeight;

  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    if (/auto|scroll|hidden|clip/.test(getComputedStyle(node).overflowY)) {
      const rect = node.getBoundingClientRect();

      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
  }

  return { top, bottom };
};

/**
 * Where an RcDropdown's submenu sits beside its menu. It keeps the size it opens with and moves only as
 * the menu does, raised above the menu's top to fit the page: only up, and no further than where its
 * foot meets the row it opened from. Worked out again whenever the menu moves, as if opening anew.
 *
 * Left to the popper, it would be kept on screen at any cost, and stay behind as the menu scrolls away.
 *
 * @param menuBox the menu's popper, which the submenu is placed against
 */
export const useSubmenuPlacement = (
  menuBox: () => Element | null | undefined,
  shownSubmenu: Ref<DropdownSubmenu | null>,
  submenuTarget: Ref<HTMLElement | null>
) => {
  /** How far the submenu is raised above the menu's top: its popper's skidding, negated */
  const submenuLift = ref(0);

  const parts = () => {
    const box = menuBox();
    const row = shownSubmenu.value?.row();
    const popper = (submenuTarget.value?.closest('.v-popper__popper') as HTMLElement | null) || submenuTarget.value;

    return box && row && popper ? {
      box, row, popper
    } : null;
  };

  /**
   * No taller than it can show once raised: from the area's top to the window's foot, or to its row's
   * when that is lower, as raising stops there. Set as it opens and as the window changes, not as the
   * page scrolls; its items scroll past that
   */
  const size = () => {
    const found = parts();

    if (!found) {
      return;
    }

    const area = visibleArea(found.popper);
    const foot = Math.max(area.bottom - EDGE_GAP, found.row.getBoundingClientRect().bottom);

    found.popper.querySelector<HTMLElement>('.v-popper__inner')?.style.setProperty('max-height', `${ foot - area.top - EDGE_GAP }px`);
  };

  const lift = () => {
    const found = parts();

    if (!found) {
      submenuLift.value = 0;

      return;
    }

    const area = visibleArea(found.popper);
    const { top } = found.box.getBoundingClientRect();
    const { height } = found.popper.getBoundingClientRect();

    submenuLift.value = Math.max(0, Math.min(
      top + height + EDGE_GAP - area.bottom,
      top + height - found.row.getBoundingClientRect().bottom
    ));
  };

  const place = () => {
    size();
    lift();
  };

  let resizeFrame = 0;

  // The menu takes its new place a moment after the window changes; the submenu is placed again from there
  const onWindowResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      place();
      recomputeAllPoppers();
    });
  };

  const stop = () => {
    cancelAnimationFrame(resizeFrame);
    document.removeEventListener('scroll', lift, true);
    window.removeEventListener('resize', onWindowResize);
  };

  /** As the submenu shows: placed, then kept in place as the menu moves, with any box scrolling it */
  const start = () => {
    place();
    stop();
    // A scroll doesn't bubble, but is captured
    document.addEventListener('scroll', lift, { capture: true, passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });
  };

  onBeforeUnmount(stop);

  // Another submenu takes over the open one's popper, at a height of its own
  watch(shownSubmenu, (submenu, was) => {
    if (submenu && was) {
      nextTick(place);
    }
  });

  return {
    submenuLift, start, stop
  };
};
