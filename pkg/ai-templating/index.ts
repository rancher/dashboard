import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import HomeLayout from '@shell/components/templates/home.vue';
import { fetchTemplatingConfigMaps, toggleTemplating } from './templating/template-engine';
import { ensureInstalled } from './install/ensure';
import routing from './routing/index';
import Home from './pages/Home.vue';

// Take over the Home page under the REAL home layout.
//
// plugin.setHomePage() registers the /home route but the shell's (deprecated) layout auto-
// parenting wires it to the cluster-gated `default` layout, whose <main> never renders on /home
// (no cluster) — so the component never mounts. The home layout parent route is unnamed, so we
// can't target it via the extension API. Instead we add the route directly on the live router,
// nesting our Home under an imported copy of the home layout (templates/home.vue).
function installHomeRoute(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = (window as any).$globalApp?.$router;

  if (!router) {
    return false;
  }

  // Adding a route named 'home' removes the existing one, so ours (under the home layout) wins.
  router.addRoute({
    path:      '/',
    component: HomeLayout,
    children:  [{
      path: '/home', name: 'home', component: Home
    }],
  });

  // This runs at plugin-init, AFTER the initial route has resolved — so a hard load of /home
  // still shows the stock home. If we're currently on /home, force a re-resolve so ours renders.
  const cur = router.currentRoute?.value;

  if (cur && cur.path === '/home') {
    router.replace({ path: '/home', force: true }).catch(() => {});
  }

  return true;
}

// Global shortcut: Cmd/Ctrl + Shift + . toggles the templating kill switch. Extensions can't add a
// global mounted component, but plugin init runs in the browser, so a raw document keydown listener
// works. Matched on event.code === 'Period' (layout-independent). Registered once.
function installShortcut(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).__aiTemplatingShortcut) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__aiTemplatingShortcut = true;

  window.addEventListener('keydown', (e) => {
    if (!((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'Period')) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as any).$globalApp?.$store;

    if (store) {
      e.preventDefault();
      toggleTemplating(store).then((now) => {
        store.dispatch('growl/success', {
          title:   'AI templating',
          message: now ? 'Templating enabled.' : 'Templating disabled — showing stock Rancher.',
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin.addNavHooks({ onEnter: (store: any) => fetchTemplatingConfigMaps(store) });

  // Retry until the live router exists (plugin init can run before $globalApp is set).
  const tryInstall = () => {
    if (!installHomeRoute()) {
      setTimeout(tryInstall, 300);
    }
  };

  tryInstall();

  // Auto-install the extension's cluster dependencies (AIAgentConfig agents + a default Home
  // template + config) once the management store is ready. Idempotent + admin-gated (see
  // ensureInstalled). Then eagerly fetch the templating ConfigMaps so a hard load of /home has the
  // applied-Home config ready to render.
  const tryEnsure = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = (window as any).$globalApp;

    if (app?.$store?.state?.managementReady) {
      Promise.resolve(ensureInstalled(app.$store))
        .catch(() => {})
        .finally(() => fetchTemplatingConfigMaps(app.$store));
    } else {
      setTimeout(tryEnsure, 500);
    }
  };

  tryEnsure();

  installShortcut();
}
