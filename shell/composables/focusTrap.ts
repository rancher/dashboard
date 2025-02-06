/**
 * focusTrap is a composable based on the "focus-trap" package that allows us to implement focus traps
 * on components for keyboard navigation is a safe and reusable way
 */
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { createFocusTrap, FocusTrap } from 'focus-trap';

<<<<<<< HEAD
<<<<<<< HEAD
export const DEFAULT_FOCUS_TRAP_OPTS = { escapeDeactivates: true, allowOutsideClick: true };

export function useBasicSetupFocusTrap(focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;

  onMounted(() => {
    focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

    focusTrapInstance = createFocusTrap(focusEl, opts);
=======
export function basicSetupFocusTrap(containerSelector: string, opts:any = { escapeDeactivates: true, allowOutsideClick: true }) {
=======
export const DEFAULT_FOCUS_TRAP_OPTS = { escapeDeactivates: true, allowOutsideClick: true };

export function basicSetupFocusTrap(containerSelector: string, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
>>>>>>> 165b47368b (fix lingering issues with namespace filter and focus trap on resource search modal)
  let focusTrapInstance = {} as FocusTrap;

  onMounted(() => {
    focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, opts);
>>>>>>> 9c1267ee62 (header keyboard nav work save)

    nextTick(() => {
      focusTrapInstance.activate();
    });
  });

  onBeforeUnmount(() => {
    if (Object.keys(focusTrapInstance).length) {
      focusTrapInstance.deactivate();
    }
  });
}

<<<<<<< HEAD
<<<<<<< HEAD
export function useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar:any, focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;
=======
export function watcherBasedSetupFocusTrapWithDestroyIncluded(watchVar:any, containerSelector: string, opts:any = { escapeDeactivates: true, allowOutsideClick: true }) {
=======
export function watcherBasedSetupFocusTrapWithDestroyIncluded(watchVar:any, containerSelector: string, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
>>>>>>> 165b47368b (fix lingering issues with namespace filter and focus trap on resource search modal)
  let focusTrapInstance = {} as FocusTrap;
>>>>>>> 9c1267ee62 (header keyboard nav work save)

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
<<<<<<< HEAD
        focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

        focusTrapInstance = createFocusTrap(focusEl, opts);
=======
        focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, opts);
>>>>>>> 9c1267ee62 (header keyboard nav work save)

        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    } else if (!neu && Object.keys(focusTrapInstance).length) {
      focusTrapInstance.deactivate();
    }
  });
}

<<<<<<< HEAD
<<<<<<< HEAD
export function useWatcherBasedSetupFocusTrap(watchVar:any, focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;
=======
export function watcherBasedSetupFocusTrap(watchVar:any, containerSelector: string, opts:any = { escapeDeactivates: true, allowOutsideClick: true }) {
=======
export function watcherBasedSetupFocusTrap(watchVar:any, containerSelector: string, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
>>>>>>> 165b47368b (fix lingering issues with namespace filter and focus trap on resource search modal)
  let focusTrapInstance = {} as FocusTrap;
>>>>>>> 9c1267ee62 (header keyboard nav work save)

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
<<<<<<< HEAD
        focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

        focusTrapInstance = createFocusTrap(focusEl, opts);
=======
        focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, opts);
>>>>>>> 9c1267ee62 (header keyboard nav work save)
        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (Object.keys(focusTrapInstance).length) {
      focusTrapInstance.deactivate();
    }
  });
}
