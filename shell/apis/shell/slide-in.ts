import { Component } from 'vue';
import { SlideInApi, SlideInConfig } from '@shell/apis/intf/shell';
import { Store } from 'vuex';

export class SlideInApiImpl implements SlideInApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

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
   * @param component - A Vue component (imported SFC, functional component, etc.) to be rendered in the panel.
   * @param config - Slide-In configuration object
   */
  public open(component: Component, config?: SlideInConfig): void {
    const props = config?.props || {};

    delete config?.props;

    this.store.commit('slideInPanel/open', {
      component,
      componentProps: { ...(config || {}), ...props }
    });
  }
}
