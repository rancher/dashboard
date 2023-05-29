import { importTypes } from '@rancher/auto-import';
import { MANAGEMENT } from '@shell/config/types';
import { IPlugin, OnNavAwayFromPackage, OnNavToPackage } from '@shell/core/types';
import epinioRoutes from './routing/epinio-routing';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioStore from './store/epinio-store';

const semanticVersionRegex = /v(?:(\d+)\.)?(?:(\d+)\.)?(?:(\d+)\.\d+)/;

const onEnter: OnNavToPackage = async(store, config) => {
  await store.dispatch(`${ epinioMgmtStore.config.namespace }/loadManagement`);

  const serverVersionSettings = store.getters['management/byId'](MANAGEMENT.SETTING, 'server-version');
  const res = await store.dispatch(`epinio/request`, { opt: { url: `/api/v1/info` } });

  store.commit('epinio/info', res);

  await store.dispatch('management/load', {
    data: {
      ...serverVersionSettings,
      type:  MANAGEMENT.SETTING,
      value: res.version.match(semanticVersionRegex)?.[0] ?? 'v1.7.0'
    }
  });
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // The dashboard retains the previous cluster info until another cluster is loaded, this helps when returning to the same cluster.
  // We need to forget epinio cluster info
  // - The polling is pretty brutal
  // - The nav path through to the same epinio cluster is fraught with danger (nav from previous cluster id to blank cluster, required to switch epinio clusters)
  await store.dispatch(`${ epinioStore.config.namespace }/unsubscribe`);
  await store.commit(`${ epinioStore.config.namespace }/reset`);
};

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  // Add Vuex stores
  plugin.addDashboardStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addDashboardStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  // Add Vue Routes
  plugin.addRoutes(epinioRoutes);

  // Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
