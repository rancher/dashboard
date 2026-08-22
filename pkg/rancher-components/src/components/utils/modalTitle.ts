import { inject, InjectionKey, provide, useId } from 'vue';

export type ClaimModalTitleId = () => string | undefined;

/**
 * Provided by a modal wrapper (see AppModal) so that the descendant rendering
 * the modal's visible title can be pointed at by the dialog's `aria-labelledby`.
 *
 * The injected function hands out the id once and returns `undefined` on every
 * subsequent call, so nested or sibling titles within the same modal can't end
 * up sharing an id.
 */
export const MODAL_TITLE_ID: InjectionKey<ClaimModalTitleId> = Symbol('modal-title-id');

/**
 * Make a title id available to a modal's descendants.
 *
 * Handing out the id is only half of it - the modal itself has to confirm the
 * id made it into the DOM before referencing it, since an `aria-labelledby`
 * pointing at an element that doesn't exist leaves the dialog with no
 * accessible name at all.
 */
export function provideModalTitleId(): string {
  const titleId = useId();
  let claimed = false;

  provide(MODAL_TITLE_ID, () => {
    if (claimed) {
      return undefined;
    }

    claimed = true;

    return titleId;
  });

  return titleId;
}

/**
 * Claim the enclosing modal's title id, to be bound to the element holding the
 * modal's visible title.
 *
 * Returns `undefined` when not rendered inside a modal, or when another element
 * has already claimed it.
 */
export function useModalTitleId(): string | undefined {
  return inject(MODAL_TITLE_ID, null)?.();
}
