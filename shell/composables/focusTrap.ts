/**
 * focusTrap is a composable based on the "focus-trap" package that allows us to implement focus traps
 * on components for keyboard navigation is a safe and reusable way
 */
import { watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { createFocusTrap, FocusTrap } from 'focus-trap';

export function basicSetupFocusTrap(containerSelector: string) {
  let focusTrapInstance = {} as FocusTrap;

  onMounted(() => {
    focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, {
      escapeDeactivates: true,
      allowOutsideClick: true,
    });

    nextTick(() => {
      focusTrapInstance.activate();
    });
  });

  onBeforeUnmount(() => {
    if (focusTrapInstance) {
      focusTrapInstance.deactivate();
    }
  });
}

export function watcherBasedSetupFocusTrapWithDestroyIncluded(watchVar:any, containerSelector: string) {
  let focusTrapInstance = {} as FocusTrap;

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
        focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, {
          escapeDeactivates: true,
          allowOutsideClick: true,
        });
        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    } else if (!neu && focusTrapInstance) {
      focusTrapInstance.deactivate();
    }
  });
}

export function watcherBasedSetupFocusTrap(watchVar:any, containerSelector: string) {
  let focusTrapInstance = {} as FocusTrap;

  watch(watchVar, (neu) => {
    if (neu) {
      nextTick(() => {
        focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, {
          escapeDeactivates: true,
          allowOutsideClick: true,
        });
        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (focusTrapInstance) {
      focusTrapInstance.deactivate();
    }
  });
}
