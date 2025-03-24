import { Store } from 'vuex';

interface PluginContext {
  store: Store<any>;
  [key: string]: any;
}

export default function(context: PluginContext, inject: (key: string, value: any) => void) {
  const { store } = context;

  // Load all API modules
  const apiContext = (require as any).context(
    '@shell/plugins/internal-api', // the base directory
    true, // whether to search subdirectories
    /\.api\.ts$/ // only .api.ts files
  );

  apiContext.keys().forEach((relativePath: string) => {
    const mod = apiContext(relativePath);
    const ApiClass = mod.default;

    if (typeof ApiClass === 'function') {
      // Check for a static `apiName` property, or fallback to filename
      let apiName: string = ApiClass.apiName();

      if (!apiName) {
        // fallback to filename (strip leading ‘./’ and extension)
        apiName = `$${ relativePath.replace(/^\.\//, '').replace(/\.\w+$/, '') }`;
      }

      const instance = new ApiClass(store);

      // The inject() method automatically adds the `$` prefix
      inject(apiName, instance);
    }
  });
}
