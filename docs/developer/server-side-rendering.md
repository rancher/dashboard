
# SSR (Server Side Rendering)

SSR causes certain NUXT component functions to execute server side, for example `async fetch`, `asyncData` and `nuxtServerInit`. State returned by these and the core Vuex store is transferred back to the client by the `window.__NUXT__` property. As these contain resources that should be Proxy objects the Dashboard rehydrates them as such via `plugins/steve/index.js`. There you can see any resource tagged with `__rehydrate` or array with  `__rehydrateAll__<x>` will be converted into back into a Proxy object in the client.