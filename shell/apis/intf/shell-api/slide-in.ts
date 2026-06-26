import { Component } from 'vue';

/**
 * Standard width presets for the Slide-In panel.
 *
 * - `'default'` — 33% of the viewport width
 * - `'wide'` — 73% of the viewport width
 */
export type SlideInWidth = 'default' | 'wide';

/**
 * Standard height presets for the Slide-In panel.
 *
 * - `'default'` — positioned below the header bar, filling the remaining viewport height
 * - `'full'` — full viewport height (100vh), covering the header and side menu
 */
export type SlideInHeight = 'default' | 'full';

/**
 *
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 */
export interface SlideInConfig {
  /**
   *
   * title for the Slide-In panel.
   * When set, a header bar with the title and a close button is displayed.
   * When omitted, no header is shown.
   *
   */
  title?: string;
  /**
   *
   * Width preset for the Slide-In panel. Defaults to `'default'` (33%).
   *
   * - `'default'` — 33% of the viewport width
   * - `'wide'` — 73% of the viewport width
   *
   */
  width?: SlideInWidth;
  /**
   *
   * Height preset for the Slide-In panel. Defaults to `'default'` (below header).
   * When set to `'full'`, the panel covers the full viewport height and the z-index
   * is automatically elevated above the side menu.
   *
   * - `'default'` — positioned below the header bar, filling the remaining viewport height
   * - `'full'` — full viewport height (100vh), covering the header and side menu
   *
   */
  height?: SlideInHeight;
  /**
   *
   * When `true`, disables the focus trap on the Slide-In panel.
   * Useful for panels with no focusable elements or custom focus management.
   *
   */
  disableFocusTrap?: boolean;
  /**
   *
   * Array of route properties to watch. When any of them change, the Slide-In closes.
   * Defaults to `['name', 'params', 'hash', 'query']`.
   * @ignore
   *
   */
  closeOnRouteChange?: string[];
  /**
   *
   * CSS selector for the element that should receive focus when the Slide-In closes.
   * @ignore
   *
   */
  returnFocusSelector?: string;
  /**
   *
   * We can pass variable (value) to "force" focus trap to initialize "on-demand"
   * @ignore
   *
   */
  focusTrapWatcherBasedVariable?: boolean;
  /**
   *
   * Vue Props to pass directly to the component rendered inside the slide in panel in an object format as "props=..."
   *
   * Useful for passing additional information or context to the component rendered inside the Slide-In window
   *
   */
  props?: {
    [key: string]: any;
  };
  /**
   * @deprecated No longer needed — automatically managed based on `panelHeight`. Full deprecation expected in Rancher 2.17.
   */
  top?: string;
  /**
   * @deprecated No longer needed — header visibility is inferred from the presence of `title`. Full deprecation expected in Rancher 2.17.
   */
  showHeader?: boolean;
}

/**
 * API for displaying Slide-In panels in Rancher UI
 * * ![slidein Example](/img/slidein.png)
 */
export interface SlideInApi {
  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import { useShell } from '@shell/apis';
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * const shell = useShell();
   *
   * shell.slideIn.open(MyCustomSlideIn, {
   *   title: 'Hello from SlideIn panel!'
   * });
   * ```
   *
   * @param component
   * The Vue component to be displayed inside the slide in panel.
   * This can be any SFC (Single-File Component) imported and passed in as a `Component`.
   *
   * @param config Slide-In configuration object
   *
   */
  open(component: Component, config?: SlideInConfig): void;
}
