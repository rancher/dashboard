export default function() {
  this.nuxt.hook('vue-renderer:ssr:context', (context) => {
    recurse(context.nuxt.data);

    function recurse(obj, parent, key) {
      if ( Array.isArray(obj) && obj.__rehydrateAll ) {
        parent[`__rehydrateAll__${ key }`] = obj.__rehydrateAll;
      } else if ( obj && typeof obj === 'object' ) {
        for ( const k of Object.keys(obj) ) {
          if ( k === '__rehydrate' || k === '__clone' ) {
            continue;
          }

          obj[k] = recurse(obj[k], obj, k);
        }
      }

      return obj;
    }
  });
}
