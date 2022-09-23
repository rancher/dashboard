
/**
 * Some plugins won't be bundled with the dashboard build but loaded on demand at run time.
 * This file allows 'manager' style plugins to defined how to determine if a unknown route
 * belongs to one of their associated plugins and how that plugin can be loaded
 */
class DynamicPluginLoader {
  dynamicPluginLoaders = [];

  register(reg) {
    this.dynamicPluginLoaders.push(reg);
  }

  async check({ route, store }) {
    for (const dpl of this.dynamicPluginLoaders) {
      // Check that the route is valid and then load the plugin associated with it
      const res = await dpl.load({ route, store });

      if (res) {
        return res;
      }
    }
  }
}

const dynamicPluginLoader = new DynamicPluginLoader();

export default dynamicPluginLoader;
