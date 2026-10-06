# The `/dashboard/` URL prefix

The URL prefix is configured at build time, not discovered from the browser URL or stored as a separate Vuex setting. The existing router configuration handles it; components do not need additional runtime checks for `/dashboard/`.

## Navigation and assets use separate bases

In [shell/vue.config.js](../../shell/vue.config.js):

- `ROUTER_BASE` sets the application's navigation base. It defaults to `/` and is injected into the bundle as `process.env.routerBase`.
- `RESOURCE_BASE` sets Vue CLI's `publicPath`, which controls where built assets such as JavaScript and images are loaded from. It defaults to an empty value, leaving the Vue CLI default in place. A trailing slash is added when needed.

The build scripts set these values for each deployment:

| Build | Navigation base | Asset base |
| --- | --- | --- |
| [Embedded](../../scripts/build-embedded) | `/dashboard/` | `/dashboard/` |
| [Hosted](../../scripts/build-hosted) | `/dashboard/` | `https://releases.rancher.com/dashboard/<version-or-branch>/` by default |

For example, to build with both navigation and assets under `/dashboard/`:

```bash
ROUTER_BASE=/dashboard/ RESOURCE_BASE=/dashboard/ yarn build
```

These settings generate URLs; they do not configure the web server. The server must serve the assets at the configured asset base and return the application's HTML for navigation URLs under the router base, including direct visits and page reloads. For hosted builds, Rancher's `ui-dashboard-index` points to the hosted index, while navigation remains under `/dashboard/` on the Rancher origin.

## Handling URLs in application code

[shell/config/router/index.js](../../shell/config/router/index.js) passes `process.env.routerBase` to Vue Router's `createWebHistory`. The router handles the base when reading browser URLs and generating navigation links. During startup, [getLocation](../../shell/initialize/app-extended.js) also removes the base before resolving the initial route.

- Use `router-link`, `router.push` or `router.replace` with named routes or app-relative paths such as `/auth/verify`. Do **not** prepend `/dashboard/`: the router adds the configured base.
- Route paths such as `route.path` and `route.fullPath` do not include the base. The browser's `window.location.pathname` does.
- When a browser URL is needed outside router navigation, use `router.resolve(location).href`, which includes the base. For example, resolving `/auth/verify` produces `/dashboard/auth/verify` when the router base is `/dashboard/`.
- Authentication return URLs already account for the router base in [shell/utils/auth.js](../../shell/utils/auth.js).

The asset base is independent of the navigation base: a CDN URL for assets does not change where users navigate. Neither base should be prepended to Rancher API paths such as `/v3`.

### Reading the prefix when needed

If code really needs the navigation prefix, read it from the router. In an Options API component:

```js
const base = this.$router.options.base;
```

Code without a router instance can read the build-time value:

```js
const base = process.env.routerBase || '/';
```

`process.env.routerBase` is replaced at build time by webpack; it is not a browser environment variable. For the embedded and hosted builds above, the value is `/dashboard/`; the default is `/`. These values describe the navigation base, not the asset base. Prefer the router helpers above for generating URLs rather than concatenating the prefix manually.
