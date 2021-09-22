export default function() {
  this.nuxt.hook('vue-renderer:ssr:context', (context) => {
    if ( context.nuxt.data ) {
      recurse(context.nuxt.data);
    }

    if ( context.nuxt.fetch ) {
      recurse(context.nuxt.fetch);
    }

    function recurse(obj, parent, key) {
      if ( Array.isArray(obj) && obj.__rehydrateAll ) {
        parent[`__rehydrateAll__${ key }`] = obj.__rehydrateAll;
      } else if ( obj && typeof obj === 'object' ) {
        if ( obj.toJSON ) {
          obj = obj.toJSON();
          parent[key] = obj;
        }

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
