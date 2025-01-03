import { CATALOG } from '@shell/config/types';
import { state, getters, actions, mutations } from '../catalog';
import { createStore } from 'vuex';

const clusterRepo = { _key: 'testClusterRepo' };
const repoChartName = 'abc';
const repoChart = {
  name:     repoChartName,
  type:     'namespaced',
  version:  1,
  metadata: { name: repoChartName }
};
const repoCharts = [repoChart];
const repo = {
  metadata:   { name: 'testRepo' },
  _key:       'testRepo',
  links:      { index: 'fetchindex' },
  canLoad:    true,
  followLink: () => ({ entries: { [repoChartName]: repoCharts } })
};

const catalogStoreName = 'catalog';
const clusterStore = 'cluster';

const expectedChartKey = `namespace/${ repo._key }/${ repoChartName }`;
const initialVersionInfo = { junk: true };
const initialRawChartName = 'cde';
const initialRawChart = {
  id:       `namespace/${ repo._key }/${ initialRawChartName }`,
  repoKey:  repo._key,
  type:     'namespaced',
  name:     initialRawChartName,
  version:  1,
  metadata: { name: initialRawChartName }
};
const initialRawCharts = { [initialRawChart.id]: initialRawChart };
const initialLoadedInfo = { [repo._key]: true };

describe('catalog', () => {
  describe('load', () => {
    const constructStore = () => {
      const catalogStore = {
        state: state(),
        getters,
        mutations,
        actions,
      };

      return {
        modules: {
          i18n: {
            namespaced: true,
            getters:    { withFallback: (state: any) => () => '' }
          },
          [catalogStoreName]: {
            namespaced: true,
            state:      {
              ...catalogStore.state,
              // Set initial state
              // - repos have been loaded
              // - some charts exist
              // - some chart version info has been fetched
              loaded:       initialLoadedInfo,
              charts:       initialRawCharts,
              versionInfos: initialVersionInfo,
            },
            mutations: catalogStore.mutations,
            actions:   catalogStore.actions,
            getters:   catalogStore.getters
          },
          [clusterStore]: {
            namespaced: true,
            getters:    { schemaFor: (state: any) => (schema: string) => ({}) },
            actions:    {
              findAll: (ctx: any, ...args: any[]) => {
                if (args[0].type === CATALOG.CLUSTER_REPO) {
                  return Promise.resolve([clusterRepo]);
                }
                if (args[0].type === CATALOG.REPO) {
                  return Promise.resolve([repo]);
                }

                return Promise.resolve([]);
              },
            }
          }
        },
        state: {
          $plugin:            { getDynamic: () => require(`@shell/models/chart`) },
          [catalogStoreName]: { } as { [key: string]: any},
        },
        getters: {
          currentCluster: () => ({ }),
          currentProduct: () => ({ inStore: clusterStore }),
        },
        mutations: { },
        actions:   { }
      };
    };

    it('no force', async() => {
      const store = createStore(constructStore());

      // Validate initial state of store
      expect(store.getters[`${ catalogStoreName }/rawCharts`]).toStrictEqual(initialRawCharts);
      expect(store.getters[`${ catalogStoreName }/charts`]).toStrictEqual([]);

      // Make the request
      await store.dispatch(`${ catalogStoreName }/load`, {
        force: false,
        reset: false
      });

      // Basics should always be ok
      expect(store.getters[`${ catalogStoreName }/inStore`]).toStrictEqual(clusterStore);
      expect(store.getters[`${ catalogStoreName }/errors`]).toStrictEqual([]);
      expect(store.getters[`${ catalogStoreName }/repos`]).toStrictEqual([clusterRepo, repo]);
      expect(store.state[catalogStoreName].loaded).toStrictEqual(initialLoadedInfo);

      // Store should still be in it's initial state (but charts populated)
      expect(store.getters[`${ catalogStoreName }/rawCharts`]).toStrictEqual(initialRawCharts);
      expect(store.getters[`${ catalogStoreName }/charts`]).toStrictEqual([initialRawChart]);

      // We haven't reset the version info, so it should be unchanged
      expect(store.state[catalogStoreName].versionInfos).toStrictEqual(initialVersionInfo);
    });

    it('force', async() => {
      const store = createStore(constructStore());

      // Validate initial state of store
      let rawCharts = store.getters[`${ catalogStoreName }/rawCharts`];

      expect(store.getters[`${ catalogStoreName }/rawCharts`]).toStrictEqual(initialRawCharts);
      expect(rawCharts[initialRawChart.id]).toBeDefined();
      expect(rawCharts[initialRawChart.id].id).toBe(initialRawChart.id);

      expect(store.getters[`${ catalogStoreName }/charts`]).toStrictEqual([]);

      // Make the request
      await store.dispatch(`${ catalogStoreName }/load`, {
        force: true, // Force such that we should get some values
        reset: false
      });

      rawCharts = store.getters[`${ catalogStoreName }/rawCharts`];
      const charts = store.getters[`${ catalogStoreName }/charts`];

      // Basics should always be ok
      expect(store.getters[`${ catalogStoreName }/inStore`]).toStrictEqual(clusterStore);
      expect(store.getters[`${ catalogStoreName }/errors`]).toStrictEqual([]);
      expect(store.getters[`${ catalogStoreName }/repos`]).toStrictEqual([clusterRepo, repo]);
      expect(store.state[catalogStoreName].loaded).toStrictEqual(initialLoadedInfo);

      // Store should have it's initial chart... and the new one
      expect(rawCharts[initialRawChart.id]).toBeDefined();
      expect(rawCharts[initialRawChart.id].id).toBe(initialRawChart.id);
      expect(rawCharts[expectedChartKey]).toBeDefined();
      expect(rawCharts[expectedChartKey].id).toBe(expectedChartKey);
      expect(rawCharts[expectedChartKey].versions[0].version).toBe(repoChart.version);
      expect(charts[0]).toBeDefined();
      expect(charts[0].id).toBe(initialRawChart.id);
      expect(charts[1]).toBeDefined();
      expect(charts[1].id).toBe(expectedChartKey);

      // Version info should be unchanged
      expect(store.state[catalogStoreName].versionInfos).toStrictEqual(initialVersionInfo);
    });

    it('force + reset', async() => {
      const store = createStore(constructStore());

      // Validate initial state of store
      expect(store.getters[`${ catalogStoreName }/rawCharts`]).toStrictEqual(initialRawCharts);
      expect(store.getters[`${ catalogStoreName }/charts`]).toStrictEqual([]);

      // Make the request
      await store.dispatch(`${ catalogStoreName }/load`, {
        force: true,
        reset: true
      });

      const rawCharts = store.getters[`${ catalogStoreName }/rawCharts`];
      const charts = store.getters[`${ catalogStoreName }/charts`];

      // Basics should always be ok
      expect(store.getters[`${ catalogStoreName }/inStore`]).toStrictEqual(clusterStore);
      expect(store.getters[`${ catalogStoreName }/errors`]).toStrictEqual([]);
      expect(store.getters[`${ catalogStoreName }/repos`]).toStrictEqual([clusterRepo, repo]);
      expect(store.state[catalogStoreName].loaded).toStrictEqual(initialLoadedInfo);

      // Store should NOT have it's initial chart... and should have the new one
      expect(rawCharts[initialRawChart.id]).not.toBeDefined();
      expect(rawCharts[expectedChartKey]).toBeDefined();
      expect(rawCharts[expectedChartKey].id).toBe(expectedChartKey);
      expect(rawCharts[expectedChartKey].versions[0].version).toBe(repoChart.version);

      expect(charts).toHaveLength(1);
      expect(charts[0]).toBeDefined();
      expect(charts[0].id).toBe(expectedChartKey);
      expect(charts[0].versions[0].version).toBe(repoChart.version);

      // Version info should be changed (it's now empty given reset)
      expect(store.state[catalogStoreName].versionInfos).toStrictEqual({ });
    });
  });
});
