import { inject, provide } from 'vue';

/**
 * How a drawer closes itself.
 *
 * Whatever is showing the drawer - the slide-in panel, in practice - provides
 * a closer, and RcDrawer and its content call it. That keeps closing off the
 * props and events surface entirely: a panel cannot break its own close button
 * by declaring an `onClose` prop, by declaring `emits`, or by rendering
 * something other than RcDrawer at its root.
 */
export const RC_DRAWER_CLOSE = Symbol('rc-drawer-close');

const NOOP = () => {};

/**
 * Provide the way to close the drawer rendered beneath this component.
 */
export const provideDrawerClose = (close: () => void): void => {
  provide(RC_DRAWER_CLOSE, close);
};

/**
 * The way to close the surrounding drawer. Use it to close from a drawer's own
 * content, for example after the user picks an action.
 *
 * Returns a no-op when the drawer is not inside anything that can close it, so
 * a drawer rendered inline (rather than in a slide-in) still works; that case
 * should bind the `close` event instead.
 */
export const useDrawerClose = (): (() => void) => {
  return inject<(() => void) | null>(RC_DRAWER_CLOSE, null) || NOOP;
};
