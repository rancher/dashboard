const MAX_DEPTH = 20;

export default function() {
  // In the rehydration process, a block of JSON from the server
  // is converted into classes.
  this.nuxt.hook('vue-renderer:ssr:context', (context) => {
    if ( context.nuxt.data ) {
      recurse(context.nuxt.data);
    }

    if ( context.nuxt.fetch ) {
      recurse(context.nuxt.fetch);
    }

    function recurse(obj, parent, key, depth = 0, path = '') {
      if ( depth >= MAX_DEPTH ) {
        return obj;
      }

      if ( key === '_error' ) {
        return null;
      }

      if ( Array.isArray(obj) && obj.__rehydrateAll ) {
        parent[`__rehydrateAll__${ key }`] = obj.__rehydrateAll;
      } else if ( obj && typeof obj === 'object' ) {
        if ( obj.toJSON ) {
          obj = obj.toJSON();
          parent[key] = obj;
        }

        for ( const k of Object.keys(obj) ) {
          if ( k === '__rehydrate' || k === '__clone') {
            continue;
          }

          obj[k] = recurse(obj[k], obj, k, depth + 1, (path ? `${ path }.${ k }` : k));
        }
      }

      return obj;
    }
  });
}
