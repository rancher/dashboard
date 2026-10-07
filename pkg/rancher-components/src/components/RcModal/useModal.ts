import { computed, ref, type Ref } from 'vue';

export interface UseModalOptions<T> {
  /**
   * Whether the modal starts open. Defaults to false.
   */
  open?: boolean;

  /**
   * Called when the modal asks to close, with whatever `open()` was given.
   * Return false to keep it open, which is what a modal does while a form is
   * invalid or a request is still in flight.
   */
  onClose?: (payload: T | undefined) => boolean | void;
}

/**
 * Owns the visibility `RcModal` deliberately does not, so a consumer spreads
 * `modal` onto the component and supplies content instead of writing the same
 * ref and handlers. `open(value?)` remembers `value` as `payload`, and an
 * `onClose` that returns false keeps the modal open.
 */
export const useModal = <T = void>(options: UseModalOptions<T> = {}) => {
  const isOpen = ref(!!options.open);
  const payload = ref<T | undefined>() as Ref<T | undefined>;

  const open = (value?: T) => {
    payload.value = value;
    isOpen.value = true;
  };

  const close = () => {
    if (options.onClose?.(payload.value) === false) {
      return;
    }

    isOpen.value = false;
  };

  return {
    /**
     * Whether the modal is open. Writable, for the cases that do not go through
     * `open()` and `close()`.
     */
    isOpen,

    /**
     * Whatever the last `open()` was given.
     */
    payload,

    open,
    close,

    /**
     * `show` and the `close` handler together, to spread onto `RcModal`.
     */
    modal: computed(() => ({
      show:    isOpen.value,
      onClose: close,
    })),
  };
};
