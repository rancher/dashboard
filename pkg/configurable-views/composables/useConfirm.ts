import { ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  body: string;
  /** The action button's label, named for what it does: "Publish", "Discard". */
  action: string;
  /** Marks an action that takes something away. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/** The question on screen, if any. One at a time: a second one answers the first with no. */
export const pendingConfirm = ref<PendingConfirm | null>(null);

/** Answer the question on screen. Closing the modal any other way (Esc, the backdrop) is a no. */
export function settleConfirm(ok: boolean): void {
  const pending = pendingConfirm.value;

  pendingConfirm.value = null;
  pending?.resolve(ok);
}

/**
 * Ask, in the product's own modal - the one ConfirmModal renders, laid out like the other AppModal
 * dialogs - rather than the browser's. Resolves true on the action, false on anything else.
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return (options) => new Promise((resolve) => {
    settleConfirm(false);
    pendingConfirm.value = { ...options, resolve };
  });
}
