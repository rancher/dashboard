import { Component } from 'vue';
import { SlideInApi, SlideInConfig } from '@shell/apis/intf/shell';
import { Store } from 'vuex';

const DEPRECATION_PREFIX = '[SlideIn API]';

export class SlideInApiImpl implements SlideInApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  private warnDeprecated(config: SlideInConfig): void {
    if (!process.env.dev) {
      return;
    }

    if (config.top !== undefined) {
      console.warn(`${ DEPRECATION_PREFIX } "top" is deprecated. It is now automatically managed based on "panelHeight". Full deprecation expected in Rancher 2.17.`); // eslint-disable-line no-console
    }

    if (config.showHeader !== undefined) {
      console.warn(`${ DEPRECATION_PREFIX } "showHeader" is deprecated. Header visibility is now inferred from the presence of "title". Full deprecation expected in Rancher 2.17.`); // eslint-disable-line no-console
    }
  }

  /**
   * Opens a slide in panel in Rancher UI
   *
   * Example:
   * ```ts
   * import { useShell } from '@shell/apis';
   * import MyDrawer from '@/components/MyDrawer.vue';
   *
   * const shell = useShell();
   *
   * shell.slideIn.open(MyDrawer, {
   *   width: 'wide',
   *   props: { resource }
   * });
   * ```
   *
   * Make `RcDrawer` from `@components/RcDrawer` the root of the component, and leave `title` out so
   * it is not wrapped in a second drawer. The panel closes when the component emits `close`:
   *
   * ```ts
   * const emit = defineEmits<{ close: [] }>();
   *
   * emit('close');
   * ```
   *
   * Closing on `close` is new in Rancher 2.16. Before that nothing listens for it, so an extension
   * that also runs on older versions passes a handler with the props:
   * `props: { resource, onClose: () => store.commit('slideInPanel/close') }`.
   *
   * @param component - A Vue component (imported SFC, functional component, etc.) to be rendered in the panel.
   * @param config - Slide-In configuration object
   */
  public open(component: Component, config?: SlideInConfig): void {
    const props = config?.props || {};

    if (config) {
      this.warnDeprecated(config);
    }

    delete config?.props;

    this.store.commit('slideInPanel/open', {
      component,
      componentProps: { ...(config || {}), ...props }
    });
  }
}
