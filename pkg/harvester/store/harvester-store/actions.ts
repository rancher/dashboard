import { ClusterNotFoundError } from '@shell/utils/error';
import { SETTING } from '@shell/config/settings';
import { COUNT, NAMESPACE, MANAGEMENT } from '@shell/config/types';
import { HCI } from '../../types';
import { allHash } from '@shell/utils/promise';
import { NAMESPACE_FILTERS } from '@shell/store/prefs';
import { NAMESPACE_FILTER_ALL_USER as ALL_USER } from '@shell/utils/namespace-filter';

export default {
  async loadCluster({
    state, commit, dispatch, getters, rootGetters, rootState
  }: any, { id }: any) {
    // This is a workaround for a timing issue where the mgmt cluster schema may not be available
    // Try and wait until the schema exists before proceeding
    await dispatch('management/waitForSchema', { type: MANAGEMENT.CLUSTER }, { root: true });

    // See if it really exists
    const cluster = await dispatch('management/find', {
      type: MANAGEMENT.CLUSTER,
      id,
      opt:  { url: `${ MANAGEMENT.CLUSTER }s/${ escape(id) }` }
    }, { root: true });

    let virtualBase = `/k8s/clusters/${ escape(id) }/v1/harvester`;

    if (id === 'local') {
      virtualBase = `/v1/harvester`;
    }

    if ( !cluster ) {
      commit('clusterId', null, { root: true });
      commit('applyConfig', { baseUrl: null });
      throw new ClusterNotFoundError(id);
    }

    // Update the Steve client URLs
    commit('applyConfig', { baseUrl: virtualBase });

    await Promise.all([
      dispatch('loadSchemas', true),
    ]);

    dispatch('subscribe');

    const projectArgs = {
      type: MANAGEMENT.PROJECT,
      opt:  {
        url:            `${ MANAGEMENT.PROJECT }/${ escape(id) }`,
        watchNamespace: id
      }
    };

    const fetchProjects = async() => {
      let limit = 30000;
      const sleep = 100;

      while ( limit > 0 && !rootState.managementReady ) {
        await setTimeout(() => {}, sleep);
        limit -= sleep;
      }

      if ( rootGetters['management/schemaFor'](MANAGEMENT.PROJECT) ) {
        return dispatch('management/findAll', projectArgs, { root: true });
      }
    };

    if (id !== 'local' && getters['schemaFor'](MANAGEMENT.SETTING)) { // multi-cluster
      const settings = await dispatch('findAll', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.SYSTEM_NAMESPACES,
        opt:  { url: `${ virtualBase }/${ MANAGEMENT.SETTING }s/`, force: true }
      });

      const systemNamespaces = settings?.find((x: any) => x.id === SETTING.SYSTEM_NAMESPACES);

      if (systemNamespaces) {
        const namespace = (systemNamespaces.value || systemNamespaces.default)?.split(',');

        commit('setSystemNamespaces', namespace, { root: true });
      }
    }

    const hash: { [key: string]: Promise<any>} = {
      projects:          fetchProjects(),
      virtualCount:      dispatch('findAll', { type: COUNT }),
      virtualNamespaces: dispatch('findAll', { type: NAMESPACE }),
      settings:          dispatch('findAll', { type: HCI.SETTING }),
    };

    if (getters['schemaFor'](HCI.UPGRADE)) {
      hash.upgrades = dispatch('findAll', { type: HCI.UPGRADE });
    }

    const res: { [key: string]: any} = await allHash(hash);

    await dispatch('cleanNamespaces', null, { root: true });

    const filters = rootGetters['prefs/get'](NAMESPACE_FILTERS)?.[id];

    commit('updateNamespaces', {
      filters: filters || [ALL_USER],
      all:     res.virtualNamespaces,
      ...getters
    }, { root: true });
  },
};
