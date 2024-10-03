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
import { onMounted, onBeforeUnmount } from 'vue';

export interface OnClickOutsideOptions {
  /**
   * List of elements that should not trigger the event.
   */
  ignore?: string[]
}

export const useClickOutside = <T extends OnClickOutsideOptions>(
  component: any,
  callback: any,
  options: T = {} as T,
) => {
  const { ignore = [] } = options;

  let shouldListen = true;

  const shouldIgnore = (event: PointerEvent) => {
    return ignore.some((target) => {
      if (typeof target === 'string') {
        return Array.from(window.document.querySelectorAll(target))
          .some((el) => el === event.target || event.composedPath().includes(el));
      } else {
        const el = target;

        return el && (event.target === el || event.composedPath().includes(el));
      }
    });
  };

  const listener = (event: PointerEvent) => {
    const el = component.value;

    if (!el || el === event.target || event.composedPath().includes(el)) {
      return;
    }

    if (event.detail === 0) {
      shouldListen = !shouldIgnore(event);
    }

    if (!shouldListen) {
      shouldListen = true;

      return;
    }

    if (typeof callback === 'function') {
      callback();
    }
  };

  const setShouldListen = (e: any) => {
    const el = component.value;

    shouldListen = !shouldIgnore(e) && !!(el && !e.composedPath().includes(el));
  };

  onMounted(() => {
    window.addEventListener('click', listener as any);
    window.addEventListener('pointerdown', setShouldListen);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('click', listener as any);
    window.removeEventListener('pointerDown', setShouldListen);
  });
};
