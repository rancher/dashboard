import { useStore } from 'vuex';

export interface ConfirmOptions {
  title: string;
  body: string;
  /** Which of the shell's button labels to use: 'continue', 'apply', 'delete', 'remove', … */
  applyMode?: string;
  /** 'bg-error role-primary' marks a destructive action. */
  actionColor?: string;
}

/**
 * Ask, in a real modal - the shell's own GenericPrompt, the confirm dialog every other part of
 * Rancher uses, so these read like the rest of the product instead of like the browser.
 *
 * Resolves true on the action, false on anything else. GenericPrompt reports a decision through its
 * `confirm` callback, but a modal closed another way (Esc) never calls it, and an unresolved promise
 * would silently drop the action; the store subscription is that backstop - the modal closing with
 * no decision resolves false.
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const store = useStore();

  return ({
    title, body, applyMode = 'continue', actionColor = 'role-primary'
  }) => new Promise((resolve) => {
    let settled = false;
    let stop: () => void = () => {};

    const done = (ok: boolean) => {
      if (!settled) {
        settled = true;
        stop();
        resolve(!!ok);
      }
    };

    stop = store.subscribe((m) => {
      if (m.type === 'action-menu/togglePromptModal' && !m.payload) {
        done(false);
      }
    });

    store.dispatch('management/promptModal', {
      component:      'GenericPrompt',
      componentProps: {
        title, body, applyMode, actionColor, confirm: done
      },
    });
  });
}
