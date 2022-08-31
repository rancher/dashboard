---
sidebar_label: Server-side Rendering
---

# Server-side-Rendering (SSR)

> Update: From Rancher 2.6.6 SSR mode is disabled for devs by default

Nuxt supports server-side-rendering (SSR), where a node.js server runs the UI code on the server-side and responds with the fully-baked HTML of the desired page.  This allows it to make all the necessary API calls directly "to itself", with less latency, versus serving up an empty page which loads all the JS, then starts making API calls across the slower server<->user connection.

But actually using this mode would require a node.js process (with sometimes considerable overhead) running inside of every Rancher container, and coordination with Rancher to proxy requests that should be for the UI to it.  So we don't actually ship anything using this mode, Rancher releases use single-page-app (SPA) mode only.

We have no concrete plans for this, but can envision several situations where we might want to use SSR in the future, so maintaining the functionality is an engineering priority.  Therefore SSR is on by default for development, and you should keep it that way in general.  It is relatively easy to write something that will break in SSR, and if not exercised we'd end up with many different slightly broken things that add up to a large effort to ever get it running again if needed.

To disable it for the whole server for development, add `--spa`.  To disable it for a single page load, add `?spa` (or `&spa`) to the query string.  It is harder, but possible, to write something that works in SSR but breaks in SPA, so these are good for debugging issues.

SSR causes certain NUXT component functions to execute server side, for example `async fetch`, `asyncData` and `nuxtServerInit`. State returned by these and the core Vuex store is transferred back to the client by the `window.__NUXT__` property. As these contain resources that should be Proxy objects the Dashboard rehydrates them as such via `plugins/dashboard-store/index.js`. There you can see any resource tagged with `__rehydrate` or array with  `__rehydrateAll__<x>` will be converted into back into a Proxy object in the client.