import { useShell } from '@shell/apis';
import ConfirmDialog from '../components/ConfirmDialog.vue';

export interface ConfirmOptions {
  title: string;
  body: string;
  /** The action button's label, named for what it does: "Publish", "Discard". */
  action: string;
  /** Marks an action that takes something away. */
  danger?: boolean;
}

/**
 * Ask, in the product's own modal: ConfirmDialog, opened through the shell's modal API like any
 * other dialog. Resolves true on the action, false on anything else - Cancel, Esc or the backdrop.
 *
 * Call it during setup: the shell's API is looked up there.
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const shell = useShell();

  return (options) => new Promise((resolve) => {
    let settled = false;

    const settle = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };

    shell.modal.open(ConfirmDialog, { props: { ...options, settle } });
  });
}
