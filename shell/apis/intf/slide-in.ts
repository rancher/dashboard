import { Component } from 'vue';

/**
 *
 * Configuration object for opening a Slide-In panel. Here's what a Slide-In looks like in Rancher UI:
 *
 */
export interface SlideInConfig {
  /**
   *
   * Width of the Slide-In panel in percentage, related to the window width. Defaults to `33%`
   *
   */
  width?: string;
  /**
   *
   * Height of the Slide-In panel. Can be percentage or vh. Defaults to (window - header) height.
   * Can be set as `33%` or `80vh`
   *
   */
  height?: string;
  /**
   *
   * CSS Top position for the Slide-In panel, string using px, as `0px` or `20px`. Default is right below header height
   *
   */
  top?: string;
  /**
   *
   * title for the Slide-In panel
   *
   */
  title?: string;
  /**
   *
   * Wether Slide-In header is displayed or not
   *
   */
  showHeader?: boolean;
  /**
   *
   * Array of props to watch out for in route, when they change, closes Slide-In
   * @ignore
   *
   */
  closeOnRouteChange?: [string];
  /**
   *
   * Return focus selector for focus trap
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
   * import MyCustomSlideIn from '@/components/MyCustomSlideIn.vue';
   *
   * this.$shell.slideIn.open(MyCustomSlideIn, {
   *   title: 'Hello from SlideIn panel!'
   * });
   * ```
   *
   * For usage with the Composition API check usage guide [here](../../shell-api#using-composition-api-in-vue).
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
