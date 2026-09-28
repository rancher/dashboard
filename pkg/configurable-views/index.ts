import type { Router } from 'vue-router';
import type { Store } from 'vuex';
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import HomeLayout from '@shell/components/templates/home.vue';
import { fetchTemplatingConfigMaps, toggleTemplating } from './templating/template-engine';
import routing from './routing/index';
import { PAGINATED_RESOURCES } from './templating/widget-catalog';
import Home from './pages/Home.vue';
import ClusterDashboard from './pages/ClusterDashboard.vue';

/**
 * What the shell leaves on `window` that this file uses: the running app, for its router and store
 * (plugin init runs before either is handed to an extension), and the shortcut's own once-only flag.
 */
interface ShellWindow extends Window {
  $globalApp?: { $router?: Router; $store?: Store<unknown> };
  __configurableViewsShortcut?: boolean;
}

const shellWindow = window as ShellWindow;

// Take over the Home page under the REAL home layout.
//
// plugin.setHomePage() registers the /home route but the shell's (deprecated) layout auto-
// parenting wires it to the cluster-gated `default` layout, whose <main> never renders on /home
// (no cluster) — so the component never mounts. The home layout parent route is unnamed, so we
// can't target it via the extension API. Instead we add the route directly on the live router,
// nesting our Home under an imported copy of the home layout (templates/home.vue).
function installHomeRoute(router: Router): void {
  // COPY the stock route, swapping only the page. Read before adding: adding a route named 'home'
  // removes the existing one.
  //
  // The meta is the part that matters. The stock layout route carries `requiresAuthentication`,
  // and four navigation guards key off it - authentication, first login, the cluster/package
  // guard (which runs an extension's onLeave when you leave its pages) and runtime extension
  // routes. A route that only described the stock one left it out, so none of them ran on the
  // way to this Home. Copying the record means whatever the stock route carries, now or later,
  // this one carries too.
  const [layout, page] = router.resolve({ name: 'home' }).matched;

  router.addRoute({
    path:      layout?.path || '/',
    component: HomeLayout,
    meta:      { ...layout?.meta },
    children:  [{
      path: page?.path || '/home', name: 'home', component: Home, meta: { ...page?.meta }
    }],
  });
}

const CLUSTER_DASHBOARD_ROUTE = 'c-cluster-explorer';
const CLUSTER_DASHBOARD_LAYOUT = 'default';

// Take over a cluster's dashboard the same way, with one difference: its layout route is NAMED
// ('default'), so the page can be replaced in place as that route's child - no copy of the layout.
// The stock child's path and meta are copied, and adding a route with its name replaces it.
function installClusterDashboardRoute(router: Router): void {
  const stock = router.getRoutes().find((r) => r.name === CLUSTER_DASHBOARD_ROUTE);

  router.addRoute(CLUSTER_DASHBOARD_LAYOUT, {
    path:      stock?.path || '/c/:cluster/explorer',
    name:      CLUSTER_DASHBOARD_ROUTE,
    component: ClusterDashboard,
    meta:      { ...stock?.meta },
  });
}

function installRoutes(): boolean {
  const router = shellWindow.$globalApp?.$router;

  if (!router) {
    return false;
  }

  installHomeRoute(router);
  installClusterDashboardRoute(router);

  // This runs at plugin-init, AFTER the initial route has resolved — so a hard load of either page
  // still shows the stock one. If we are on one of them now, force a re-resolve so ours renders.
  const cur = router.currentRoute.value;

  if (cur.name === 'home' || cur.name === CLUSTER_DASHBOARD_ROUTE) {
    router.replace({ path: cur.fullPath, force: true }).catch(() => {});
  }

  return true;
}

// Global shortcut: Cmd/Ctrl + Shift + . toggles the kill switch. Extensions can't add a global
// mounted component, but plugin init runs in the browser, so a raw document keydown listener works.
// Matched on event.code === 'Period' (layout-independent). Registered once.
function installShortcut(): void {
  if (shellWindow.__configurableViewsShortcut) {
    return;
  }
  shellWindow.__configurableViewsShortcut = true;

  window.addEventListener('keydown', (e) => {
    if (!((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'Period')) {
      return;
    }

    const store = shellWindow.$globalApp?.$store;

    if (store) {
      e.preventDefault();
      toggleTemplating(store).then((now) => {
        store.dispatch('growl/success', {
          title:   'Configurable Views',
          message: now ? 'The configurable Home is on.' : 'The configurable Home is off — showing the stock Home.',
        }, { root: true });
      }).catch(() => {});
    }
  });
}

// Init the package
export default function(plugin: IPlugin): void {
  importTypes(plugin);

  plugin.metadata = require('./package.json');

  plugin.addProduct(require('./product'));
  plugin.addRoutes(routing);

  plugin.addNavHooks({ onEnter: (store) => fetchTemplatingConfigMaps(store) });

  // Let this extension's tables be paged by the BACKEND rather than fetched whole.
  //
  // Every entry names our own context, so this turns paging on for our widgets and for nothing
  // else. The same types are listed elsewhere with other contexts - the cluster list in the side
  // bar, on the Home, in Cluster Management - and those are untouched by this.
  //
  // Optional-chained because the API arrived in 2.12: on an older Rancher the call is skipped and
  // the tables simply fetch as they did before.
  plugin.enableServerSidePagination?.({ management: { resources: { enableSome: { enabled: PAGINATED_RESOURCES, generic: false } } } });

  // Retry until the live router exists (plugin init can run before $globalApp is set).
  const tryInstall = () => {
    if (!installRoutes()) {
      setTimeout(tryInstall, 300);
    }
  };

  tryInstall();
  installShortcut();
}
