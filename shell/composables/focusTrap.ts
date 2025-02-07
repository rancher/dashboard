/**
 * focusTrap is a composable based on the "focus-trap" package that allows us to implement focus traps
 * on components for keyboard navigation is a safe and reusable way
 */
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { createFocusTrap, FocusTrap } from 'focus-trap';

export const DEFAULT_FOCUS_TRAP_OPTS = { escapeDeactivates: true, allowOutsideClick: true };

export function useBasicSetupFocusTrap(focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;

  onMounted(() => {
    focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

    focusTrapInstance = createFocusTrap(focusEl, opts);

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

export function useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar:any, focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
        focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

        focusTrapInstance = createFocusTrap(focusEl, opts);

        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    } else if (!neu && Object.keys(focusTrapInstance).length) {
      focusTrapInstance.deactivate();
    }
  });
}

export function useWatcherBasedSetupFocusTrap(watchVar:any, focusElement: string | HTMLElement, opts:any = DEFAULT_FOCUS_TRAP_OPTS) {
  let focusTrapInstance: FocusTrap;
  let focusEl;

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
        focusEl = typeof focusElement === 'string' ? document.querySelector(focusElement) as HTMLElement : focusElement;

        focusTrapInstance = createFocusTrap(focusEl, opts);
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
