import {
  computed, nextTick, onMounted, Ref, ref
} from 'vue';

/**
 * Pointer and keyboard handlers for a separator between two columns of a container.
 *
 * `percent` is the width of the first column, as a percentage of the container width,
 * so the split keeps its ratio when the window resizes.
 * `minPx` and `maxPercent` limit the width. The css that uses `percent` applies them, e.g. in
 * clamp() in grid-template-columns, from the `limits` custom properties.
 * After each drag or key press `percent` is re-read from the separator position, so it matches the limited width.
 */
export const useSplitResize = (container: Ref<HTMLElement | null | undefined>, {
  initial = 25, step = 2, minPx = 200, maxPercent = 60
} = {}) => {
  const percent = ref(initial);
  const resizing = ref(false);

  // read with the separator position, the minimum width as a percentage depends on it
  const containerWidth = ref(0);

  // distance from the left edge of the separator to the pointer, kept constant while dragging
  let grabOffset = 0;

  const measure = () => {
    containerWidth.value = container.value?.getBoundingClientRect().width || 0;
  };

  // custom properties for the clamp() in the css
  const limits = { '--split-min': `${ minPx }px`, '--split-max': `${ maxPercent }%` };

  const minPercent = computed(() => (containerWidth.value ? Math.min(maxPercent, minPx / containerWidth.value * 100) : 0));

  // `percent` limited as the css limits the width, for aria-valuenow
  const valueNow = computed(() => Math.min(maxPercent, Math.max(minPercent.value, percent.value)));

  const toPercent = (x: number) => {
    const rect = container.value?.getBoundingClientRect();

    if (!rect?.width) {
      return percent.value;
    }

    containerWidth.value = rect.width;

    return (x - rect.left) / rect.width * 100;
  };

  // the left edge of the separator is the right edge of the first column
  const settle = async(handle: HTMLElement) => {
    await nextTick();
    percent.value = toPercent(handle.getBoundingClientRect().left);
  };

  const onPointerdown = (event: PointerEvent) => {
    const handle = event.currentTarget as HTMLElement;

    grabOffset = event.clientX - handle.getBoundingClientRect().left;
    // pointermove and pointerup go to the separator while the pointer is outside it
    // the capture is released by the browser after pointerup or pointercancel
    handle.setPointerCapture(event.pointerId);
    resizing.value = true;
  };

  const onPointermove = (event: PointerEvent) => {
    if (resizing.value) {
      percent.value = toPercent(event.clientX - grabOffset);
    }
  };

  const onPointerup = (event: PointerEvent) => {
    if (!resizing.value) {
      return;
    }

    resizing.value = false;
    settle(event.currentTarget as HTMLElement);
  };

  const onKeydown = (event: KeyboardEvent) => {
    const direction = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];

    if (!direction) {
      return;
    }

    event.preventDefault();

    const handle = event.currentTarget as HTMLElement;

    percent.value = toPercent(handle.getBoundingClientRect().left) + direction * step;
    settle(handle);
  };

  // the window can resize between interactions, so the width is read again when a screen reader reaches the separator
  const onFocus = measure;

  onMounted(measure);

  return {
    percent, resizing, limits, minPercent, maxPercent, valueNow, onPointerdown, onPointermove, onPointerup, onKeydown, onFocus
  };
};
