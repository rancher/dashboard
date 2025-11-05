import { SlideInApi, SlideInConfig } from '@shell/apis/intf/shell';
import { Store } from 'vuex';

export class SlideInApiImpl implements SlideInApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  /**
   * Opens the slide-in panel with the specified component and props.
   *
   * This method commits the `open` mutation to the `slideInPanel` Vuex module,
   * which sets the current component to be rendered and its associated props.
   * The slide-in panel becomes visible after the mutation.
   *
   * @param config - The configuration object for the slide-in panel.
   *
   * Example Usage:
   * ```ts
   * import MyComponent from '@/components/MyComponent.vue';
   *
   * this.$shell.slideIn.open({
   *   component: MyComponent,
   *   componentProps: { foo: 'bar' }
   * });
   * ```
   *
   * @param config.component - A Vue component (imported SFC, functional component, etc.) to be rendered in the panel.
   * @param config.componentProps - (Optional) Props to pass to the component. These should align with the component's defined props.
   */
  public open(config: SlideInConfig): void {
    this.store.commit('slideInPanel/open', {
      component:      config.component,
      componentProps: config.componentProps || {}
    });
  }
}
