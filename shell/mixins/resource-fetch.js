import { mapGetters } from 'vuex';
import { COUNT, MANAGEMENT } from '@shell/config/types';
import { SETTING, DEFAULT_PERF_SETTING } from '@shell/config/settings';
import ResourceFetchNamespaced from '@shell/mixins/resource-fetch-namespaced';

// Number of pages to fetch when loading incrementally
const PAGES = 4;

export default {

  mixins: [ResourceFetchNamespaced],

  data() {
    // fetching the settings related to manual refresh from global settings
    const perfSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORMANCE);
    let perfConfig = {};

    if (perfSetting && perfSetting.value) {
      try {
        perfConfig = JSON.parse(perfSetting.value);
      } catch (e) {
        console.warn('ui-performance setting contains invalid data'); // eslint-disable-line no-console
      }
    } else {
      perfConfig = DEFAULT_PERF_SETTING;
    }

    return {
      perfConfig,
      init:                       false,
      multipleResources:          [],
      loadResources:              [this.resource],
      // manual refresh vars
      hasManualRefresh:           false,
      watch:                      true,
      isTooManyItemsToAutoUpdate: false,
      force:                      false,
      // incremental loading vars
      incremental:                false,
      fetchedResourceType:        [],
      // force ns filtering
      forceNsFilter:              {
        ...perfConfig.forceNsFilter,
        threshold: parseInt(perfConfig?.forceNsFilter?.threshold || '0', 10)
      }
    };
  },
  beforeDestroy() {
    // make sure this only runs once, for the initialized instance
    if (this.init) {
      // clear up the store to make sure we aren't storing anything that might interfere with the next rendered list view
      this.$store.dispatch('resource-fetch/clearData');

      this.fetchedResourceType.forEach((item) => {
        this.$store.dispatch(`${ item.currStore }/incrementLoadCounter`, item.type);
      });
    }
  },

  computed: {
    ...mapGetters({ refreshFlag: 'resource-fetch/refreshFlag' }),
    rows() {
      const currResource = this.fetchedResourceType.find(item => item.type === this.resource);

      if (currResource) {
        return this.$store.getters[`${ currResource.currStore }/all`](this.resource);
      } else {
        return [];
      }
    },
    loading() {
      return this.rows.length ? false : this.$fetchState.pending;
    },
  },
  watch: {
    refreshFlag(neu) {
      // this is where the data assignment will trigger the update of the list view...
      if (this.init && neu) {
        this.$fetch();
      }
    }
  },
  methods: {
    // this defines all the flags needed for the mechanism
    // to work. They should be defined based on the main list view
    // resource that is to be displayed. The secondary resources
    // fetched should follow what was defined (if it is manual and/or incremental)
    $initializeFetchData(type, multipleResources = [], storeType) {
      if (!this.init) {
        const currStore = storeType || this.$store.getters['currentStore']();

        this.__gatherResourceFetchData(type, multipleResources, currStore);

        // make sure after init that, if we have a manual refresh, we always set the force = true
        if (!this.watch) {
          this.force = true;
        }

        if (this.isTooManyItemsToAutoUpdate) {
          this.hasManualRefresh = true;
        }
      }
    },
    // data fetching for the mechanism
    $fetchType(type, multipleResources = [], storeType) {
      const currStore = storeType || this.$store.getters['currentStore']();

      this.$initializeFetchData(type, multipleResources, currStore);

      if (!this.fetchedResourceType.find(item => item.type === type)) {
        this.fetchedResourceType.push({
          type,
          currStore
        });
      }

      let incremental = 0;

      if (this.incremental) {
        const resourceCount = this.__getCountForResources([type], this.namespaceFilter, currStore);

        incremental = Math.ceil(resourceCount / PAGES);
      }

      const opt = {
        incremental,
        watch:            this.watch,
        force:            this.force,
        hasManualRefresh: this.hasManualRefresh
      };

      const schema = this.$store.getters[`${ currStore }/schemaFor`](type);

      if (schema?.attributes?.namespaced) { // Is this specific resource namespaced (could be primary or secondary resource)?
        opt.namespaced = this.namespaceFilter; // namespaceFilter will only be populated if applicable for primary resource
      }

      return this.$store.dispatch(`${ currStore }/findAll`, {
        type,
        opt
      });
    },

    __getCountForResources(resourceNames, namespace, storeType) {
      const currStore = storeType || this.$store.getters['currentStore']();

      return resourceNames.reduce((res, type) => res + this.__getCountForResource(type, namespace, currStore), 0);
    },

    __getCountForResource(resourceName, namespace, storeType) {
      const resourceCounts = this.$store.getters[`${ storeType }/all`](COUNT)[0]?.counts[`${ resourceName }`]; // NB `rancher` store behaves differently, lacks counts but has resource
      const resourceCount = namespace && resourceCounts?.namespaces ? resourceCounts?.namespaces[namespace]?.count : resourceCounts?.summary?.count;

      return resourceCount || 0;
    },

    __gatherResourceFetchData(resourceName, multipleResources, currStore) {
      // flag to prevent a first data update being triggered from the requestData watcher
      this.init = true;

      // manual refresh settings config
      const manualDataRefreshEnabled = this.perfConfig?.manualRefresh?.enabled;
      const manualDataRefreshThreshold = parseInt(this.perfConfig?.manualRefresh?.threshold || '0', 10);

      // incremental loading settings config
      const incrementalLoadingEnabled = this.perfConfig?.incrementalLoading?.enabled;
      const incrementalLoadingThreshold = parseInt(this.perfConfig?.incrementalLoading?.threshold || '0', 10);

      // other vars
      this.multipleResources = multipleResources;
      let resourceCount = 0;

      // manual refresh vars
      let watch = true;
      let isTooManyItemsToAutoUpdate = false;

      // incremental loading vars
      let incremental = false;

      // get resource counts
      const resourcesForCount = this.multipleResources.length ? this.multipleResources : [resourceName];

      resourceCount = this.__getCountForResources(resourcesForCount, this.namespaceFilter, currStore);

      // manual refresh check
      if (manualDataRefreshEnabled && resourceCount >= manualDataRefreshThreshold) {
        watch = false;
        isTooManyItemsToAutoUpdate = true;
      }

      // incremental loading check
      incremental = incrementalLoadingEnabled && incrementalLoadingThreshold > 0 && resourceCount >= incrementalLoadingThreshold;

      // pass on the flag that controls the appearance of the manual refresh button on the sortable table
      this.$store.dispatch('resource-fetch/updateIsTooManyItems', isTooManyItemsToAutoUpdate);

      // set vars on mixin to be used on $fetchType
      this.watch = watch;
      this.isTooManyItemsToAutoUpdate = isTooManyItemsToAutoUpdate;
      this.incremental = incremental;
    },
  },
};
