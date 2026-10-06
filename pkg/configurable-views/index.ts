import type { Store } from 'vuex';
import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin, type Action } from '@shell/core/types';
import type { ShellApi } from '@shell/apis';
import { NotificationLevel } from '@shell/types/notifications';
import { fetchTemplatingConfigMaps, toggleTemplating } from './templating/template-engine';
import routing from './routing/index';
import Home from './pages/Home.vue';
import ClusterDashboard from './pages/ClusterDashboard.vue';
import { toggleViewBar, viewBarLocked, viewBarVisible } from './composables/useViewBarVisibility';

/** What a header action runs with as `this`: the header, with the store and the shell API on it. */
interface HeaderContext {
  $store: Store<unknown>;
  $shell: ShellApi;
}

// The kill switch's shortcut, Cmd/Ctrl + Shift + . - a header action with no button, on every page.
// The shell binds a shortcut by the character the browser reports, which differs by platform: on a Mac
// Cmd is held, and the key comes through unshifted ('.'); elsewhere Shift applies, and Shift + . is
// '>' on US and UK keyboards.
const killSwitch: Action = {
  labelKey: 'configurableViews.toggle.title',
  hidden:   true,
  shortcut: { windows: ['ctrl', 'shift', '>'], mac: ['meta', 'shift', '.'] },
  invoke(this: HeaderContext) {
    const store = this.$store;
    const t = store.getters['i18n/t'];

    toggleTemplating(store).then((now) => {
      this.$shell.notification.send(NotificationLevel.Success, t('configurableViews.toggle.title'), now ? t('configurableViews.toggle.turnedOn') : t('configurableViews.toggle.turnedOff'));
    }).catch(() => {
      this.$shell.notification.send(NotificationLevel.Error, t('configurableViews.toggle.failed'));
    });
  },
};

// Init the package
export default function(plugin: IPlugin): void {
  importTypes(plugin);

  plugin.metadata = require('./package.json');

  plugin.addProduct(require('./product'));
  plugin.addRoutes(routing);

  plugin.addNavHooks({ onEnter: (store) => fetchTemplatingConfigMaps(store) });

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

  // The view bar is hidden until asked for: a header button on each configurable page shows and
  // hides it, and Cmd/Ctrl + Shift + V does the same - V for views, beside the kill switch's
  // Cmd/Ctrl + Shift + . The shell ignores the shortcut while the focus is in a text field, where it
  // pastes without formatting.
  const toggleBar: Action = {
    labelKey:           'configurableViews.bar.toggle',
    tooltipKey:         'configurableViews.bar.toggle',
    disabledTooltipKey: 'configurableViews.bar.toggleLocked',
    icon:               'icon-list-flat',
    shortcut:           { windows: ['ctrl', 'shift', 'v'], mac: ['meta', 'shift', 'v'] },
    ariaExpanded:       () => viewBarVisible.value,
    // While a view is being edited the bar holds the way out of the editor, so the button is
    // disabled, and its tooltip says why. Read reactively by the header, and again at every click
    enabled:            () => !viewBarLocked.value,
    invoke:             () => toggleViewBar(),
  };

  plugin.addAction(ActionLocation.HEADER, {}, killSwitch);
  plugin.addAction(ActionLocation.HEADER, { product: ['home'] }, toggleBar);
  plugin.addAction(ActionLocation.HEADER, { product: ['explorer'], path: [{ urlPath: '/explorer', endsWith: true }] }, toggleBar);
}
