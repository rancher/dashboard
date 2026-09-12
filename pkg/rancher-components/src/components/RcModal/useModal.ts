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
 * Owns the visibility `RcModal` deliberately does not.
 *
 * The modal is stateless: it takes `show` and emits `close`. That is the right
 * shape for the component, but it leaves every consumer writing the same ref
 * and the same two handlers. This writes them once.
 *
 * `modal` is the whole wiring, so a consumer spreads it and supplies content:
 *
 * ```vue
 * <script setup lang="ts">
 * const { open, modal } = useModal();
 * </script>
 *
 * <template>
 *   <RcButton @click="open">Delete</RcButton>
 *   <RcModal v-bind="modal" :title="t('promptRemove.title')" size="small">
 *     <p>{{ t('promptRemove.body') }}</p>
 *   </RcModal>
 * </template>
 * ```
 *
 * Opening with a value carries it to the modal's content, which is what a
 * modal opened from a list row needs:
 *
 * ```ts
 * const { open, payload, modal } = useModal<Namespace>();
 *
 * open(namespace);
 * // <p>Delete {{ payload?.nameDisplay }}?</p>
 * ```
 *
 * To refuse a close, say so rather than reaching for the ref:
 *
 * ```ts
 * const { modal } = useModal({ onClose: () => !saving.value });
 * ```
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
