/**
 * Reorder a list by dragging an item along it. The item is picked up once the pointer travels
 * DRAG_THRESHOLD, so a press is still a click. Escape abandons the drag
 */
import { onBeforeUnmount, ref } from 'vue';

import { moveInOrder } from '../templating/view-model';

const DRAG_THRESHOLD = 4;

export interface DragReorderOptions {
  axis: 'x' | 'y';
  initialOrder: () => string[];
  /** Called once as the drag begins: displaced items are mid-transition afterwards */
  measure: () => void;
  /** -1 for nowhere */
  indexAt: (pointer: number) => number;
  /** For lists whose head is held in place */
  firstMovable?: (order: string[]) => number;
  onCommit: (order: string[]) => void;
  onBegin?: () => void;
  onEnd?: () => void;
}

/** The click that ends a drag would act on whatever the pointer is over */
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  window.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', swallow, true), 0);
}

export function useDragReorder(options: DragReorderOptions) {
  const heldId = ref<string | null>(null);
  const order = ref<string[] | null>(null);
  const moved = ref(false);
  const pointer = ref(0);

  let armed: { key: string, at: number } | null = null;
  let startOrder: string[] | null = null;

  const along = (event: MouseEvent) => (options.axis === 'x' ? event.clientX : event.clientY);

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

    // Before the order is cleared, so the old arrangement is never drawn in between
    if (commit && changed && final) {
      options.onCommit(final);
    }

    order.value = null;
  };

  function onUp() {
    end(moved.value);
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      end(false);
    }
  }

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
