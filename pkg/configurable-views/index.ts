import type { Store } from 'vuex';
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { fetchTemplatingConfigMaps, toggleTemplating } from './templating/template-engine';
import routing from './routing/index';
import { PAGINATED_RESOURCES } from './templating/widget-catalog';
import Home from './pages/Home.vue';
import ClusterDashboard from './pages/ClusterDashboard.vue';

/**
 * What the shell leaves on `window` that this file uses: the running app, for the store the
 * shortcut toggles, and the shortcut's own once-only flag.
 */
interface ShellWindow extends Window {
  $globalApp?: { $store?: Store<unknown> };
  __configurableViewsShortcut?: boolean;
}

const shellWindow = window as ShellWindow;

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

  // The two pages this package makes configurable, each replacing the stock one in place.
  //
  // The Home, under the home layout. A cluster's dashboard, as the child of the layout it already
  // lives in ('default') - same name, same path, so the stock route is replaced and every link to a
  // cluster's dashboard lands here. Registered at init, so they are in place before the first page
  // resolves. Neither page leaves Rancher's own behind: each can show it, as one of its views.
  plugin.setHomePage(Home);
  plugin.addRoute('default', {
    name:      'c-cluster-explorer',
    path:      '/c/:cluster/explorer',
    component: ClusterDashboard,
  });

  installShortcut();
}
