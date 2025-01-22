/**
 * useClickOutside is based on onClickOutside from VueUse (https://github.com/vueuse/vueuse/blob/main/packages/core/onClickOutside/index.ts)
 *
 * This was originally reimplemented due to a resolution bug found in Yarn 1.x
 * that involves mapping a html-webpack-plugin-5 alias to html-webpack-plugin.
 * This bug is unrelated to VueUse, but would break vue/vue-cli as they rely on
 * an un-aliased version of html-webpack-plugin.
 *
 * @note Although there are minor differences between this implementation and
 * the original, we can easily replace this implementation with VueUse if we
 * find that we will benefit from importing the library in the future.
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
      console.log('destroy');
      focusTrapInstance.deactivate();
    }
  });
}

export function watcherBasedSetupFocusTrap(watchVar:any, containerSelector: string) {
  let focusTrapInstance = {} as FocusTrap;

  console.error('****** watcherBasedSetupFocusTrap!!!!!! ******', focusTrapInstance);

  watch(watchVar, (neu) => {
    if (neu) {
      console.warn('SHOWMODAL YES!!!!!', neu, document.querySelector(containerSelector));

      nextTick(() => {
        console.warn('******* activating focus trap with watcher!!!', document.querySelector(containerSelector));

        focusTrapInstance = createFocusTrap(document.querySelector(containerSelector) as HTMLElement, {
          escapeDeactivates: true,
          allowOutsideClick: true,
        });
        nextTick(() => {
          focusTrapInstance.activate();
        });
      });
    } else if (!neu && focusTrapInstance) {
      console.error('destroy focus trap!');
      focusTrapInstance.deactivate();
    }
  });
}
