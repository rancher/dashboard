import { mapGetters } from 'vuex';
import { COUNT, MANAGEMENT } from '@shell/config/types';
import { SETTING, DEFAULT_PERF_SETTING } from '@shell/config/settings';

// Number of pages to fetch when loading incrementally
const PAGES = 4;

export default {
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
      counts:                     {},
      multipleResources:          [],
      // manual refresh vars
      hasManualRefresh:           false,
      watch:                      true,
      isTooManyItemsToAutoUpdate: false,
      force:                      false,
      // incremental loading vars
      incremental:                0,
      fetchedResourceType:        [],
    };
  },
  beforeDestroy() {
    // make sure this only runs once, for the initialized instance
    if (this.init) {
      // clear up the store to make sure we aren't storing anything that might interfere with the next rendered list view
      this.$store.dispatch('resource-fetch/clearData');

      const inStore = this.$store.getters['currentStore'](COUNT);

      this.fetchedResourceType.forEach((type) => {
        this.$store.dispatch(`${ inStore }/incrementLoadCounter`, type);
      });
    }
  },

  computed: {
    ...mapGetters({ refreshFlag: 'resource-fetch/refreshFlag' }),
    rows() {
      const inStore = this.$store.getters['currentStore'](this.resource);

      return this.$store.getters[`${ inStore }/all`](this.resource);
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
    $fetchType(type, multipleResources = []) {
      const inStore = this.$store.getters['currentStore'](COUNT);

      if (!this.init) {
        this.__gatherResourceFetchData(type, multipleResources);

        // make sure after init that, if we have a manual refresh, we always set the force = true
        if (!this.watch) {
          this.force = true;
        }

        if (this.isTooManyItemsToAutoUpdate) {
          this.hasManualRefresh = true;
        }
      }

      if (!this.fetchedResourceType.includes(type)) {
        this.fetchedResourceType.push(type);
      }

      return this.$store.dispatch(`${ inStore }/findAll`, {
        type,
        opt: {
          incremental:      this.incremental,
          watch:            this.watch,
          force:            this.force,
          hasManualRefresh: this.hasManualRefresh
        }
      });
    },
    __getCountForResource(resourceName) {
      let resourceCount;

      if (this.counts[`${ resourceName }`]) {
        resourceCount = this.counts[`${ resourceName }`].summary?.count;
      }

      return resourceCount || 0;
    },
    __gatherResourceFetchData(type, multipleResources) {
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
      const resourceName = type;
      const inStore = this.$store.getters['currentStore'](resourceName);
      let resourceCount = 0;

      // manual refresh vars
      let watch = true;
      let isTooManyItemsToAutoUpdate = false;

      // incremental loading vars
      let incremental = 0;

      // get resource counts
      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        this.counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        if (this.multipleResources.length) {
          this.multipleResources.forEach((item) => {
            resourceCount = resourceCount + this.__getCountForResource(item);
          });
        } else {
          resourceCount = this.__getCountForResource(resourceName);
        }
      }

      // manual refresh check
      if (manualDataRefreshEnabled && resourceCount >= manualDataRefreshThreshold) {
        watch = false;
        isTooManyItemsToAutoUpdate = true;
      }
      // manual refresh check
      if (incrementalLoadingEnabled && incrementalLoadingThreshold > 0 && resourceCount >= incrementalLoadingThreshold) {
        incremental = Math.ceil(resourceCount / PAGES);
      }

      // pass on the flag that controls the appearance of the manual refresh button on the sortable table
      this.$store.dispatch('resource-fetch/updateIsTooManyItems', isTooManyItemsToAutoUpdate);

      // set vars on mixin to be used on $fetchType
      this.watch = watch;
      this.isTooManyItemsToAutoUpdate = isTooManyItemsToAutoUpdate;
      this.incremental = incremental;
    },
  },
};
