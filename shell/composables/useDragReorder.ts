/**
 * Reorder a list by dragging one of its items along it.
 *
 * The item is not picked up on press - a press is far more often the start of a click - but once
 * the pointer has travelled DRAG_THRESHOLD with it held. From then on `order` is the keys in the
 * order the pointer has put them, so the list can follow it live, and dropping hands that order to
 * `onCommit` if it differs from where the drag began. Escape abandons it, and nothing is written.
 *
 * What differs between lists - which way they run, where their items sit, and what a new order
 * means - comes in through the options. Everything else is the same wherever a list is dragged,
 * so a drag feels the same wherever it is done.
 */
import { onBeforeUnmount, ref } from 'vue';

import { moveInOrder } from '@shell/utils/table-views/views';

/** How far the pointer travels with an item held before it counts as a drag rather than a click */
const DRAG_THRESHOLD = 4;

export interface DragReorderOptions {
  /** Which way the list runs, and so which way the pointer is read */
  axis: 'x' | 'y';
  /** The keys in their order as the drag begins */
  initialOrder: () => string[];
  /**
   * Measure where the items sit. Called once, as the drag begins: items displaced mid-drag are
   * moving, so reading them live reads the places they are passing through rather than the ones
   * they will settle in.
   */
  measure: () => void;
  /** Which place the pointer is at, from what `measure` took - or -1 for nowhere */
  indexAt: (pointer: number) => number;
  /** The first place an item may be dropped into, for lists whose head is held in place */
  firstMovable?: (order: string[]) => number;
  /** The drag ended somewhere other than where it began */
  onCommit: (order: string[]) => void;
  /** Anything else to do as the item is picked up */
  onBegin?: () => void;
  /** Anything else to undo as it is let go, whether or not it was dropped */
  onEnd?: () => void;
}

/**
 * Eat the click that a mouseup at the end of a drag is about to produce. It would land on
 * whatever the pointer finished over and act on it - a drag is not a click.
 */
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  window.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', swallow, true), 0);
}

export function useDragReorder(options: DragReorderOptions) {
  /** The item being carried, once it has been picked up */
  const heldId = ref<string | null>(null);
  /** The keys in the order the pointer has put them, while an item is carried */
  const order = ref<string[] | null>(null);
  /** Whether the pointer has travelled far enough for this to be a drag */
  const moved = ref(false);
  /** Where the pointer is along the list's axis */
  const pointer = ref(0);

  let armed: { key: string, at: number } | null = null;
  let startOrder: string[] | null = null;

  const along = (event: MouseEvent) => (options.axis === 'x' ? event.clientX : event.clientY);

  /** Put the held item where the pointer is, so the rest shuffle around it as it travels */
  const place = () => {
    const current = order.value;

    if (!current) {
      return;
    }

    const from = current.indexOf(heldId.value as string);
    const at = options.indexAt(pointer.value);

    if (from === -1 || at === -1) {
      return;
    }

    order.value = moveInOrder(current, from, Math.max(at, options.firstMovable ? options.firstMovable(current) : 0));
  };

  const begin = () => {
    if (moved.value || !armed) {
      return;
    }

    moved.value = true;
    heldId.value = armed.key;
    order.value = options.initialOrder();
    startOrder = [...order.value];
    options.measure();
    // The list's own items say `grabbing` in their CSS; this is for everywhere else the pointer
    // can go while it is still carrying one
    document.body.style.cursor = 'grabbing';
    options.onBegin?.();
  };

  const onMove = (event: MouseEvent) => {
    if (!armed) {
      return;
    }

    pointer.value = along(event);

    if (!moved.value && Math.abs(pointer.value - armed.at) < DRAG_THRESHOLD) {
      return;
    }

    begin();
    place();
  };

  const end = (commit: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.removeEventListener('mousemove', onMove, true);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.removeEventListener('mouseup', onUp, true);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    window.removeEventListener('keydown', onKey, true);

    const started = startOrder || [];
    const final = order.value;
    const changed = !!final && final.some((key, i) => key !== started[i]);

    if (moved.value) {
      swallowNextClick();
    }

    document.body.style.cursor = '';
    options.onEnd?.();

    armed = null;
    startOrder = null;
    heldId.value = null;
    moved.value = false;

    // Before the order is let go, so the list never draws the old arrangement in between
    if (commit && changed && final) {
      options.onCommit(final);
    }

    order.value = null;
  };

  function onUp() {
    end(moved.value);
  }

  /** Escape abandons the drag: the list snaps back, and nothing is written */
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      end(false);
    }
  }

  /** Press on an item: arm a possible drag of it */
  const start = (key: string, event: MouseEvent) => {
    armed = { key, at: along(event) };
    moved.value = false;

    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('keydown', onKey, true);
  };

  onBeforeUnmount(() => end(false));

  return {
    heldId, order, moved, pointer, start, end, place
  };
}
