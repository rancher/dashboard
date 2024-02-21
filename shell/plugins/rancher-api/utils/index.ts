import { VueConstructor } from 'vue';
import { Store } from 'vuex';

export interface PluginOptions {
  store: Store<any>;
  className: any;
  prototypeName: string;
}

/**
 * Initializes the supplied class as a prototype onto the VueConstructor.
 *
 * @param Vue `VueConstructor`
 * @param options `store, className, prototypeName`
 */
export function installPlugin(Vue: VueConstructor, options: PluginOptions): void {
  for ( const optionKey of Object.keys(options) as (keyof PluginOptions)[] ) {
    if ( options[optionKey] === undefined || !options[optionKey] ) {
      throw new Error(`Must provide ${ optionKey } as an argument for the plugin.`);
    }
  }

  const { store, className, prototypeName } = options;

  const initializedClass = new className({ store });

  // Add Class to Vue prototype
  Vue.prototype[prototypeName] = initializedClass;
}
