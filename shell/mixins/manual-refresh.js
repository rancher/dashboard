import { mapGetters } from 'vuex';
import { COUNT, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  data() {
    // fetching the settings related to manual refresh from global settings
    const perfSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORNMANCE);
    let perfConfig = {};

    if (perfSetting && perfSetting.value) {
      try {
        perfConfig = JSON.parse(perfSetting.value);
      } catch (e) {
        console.warn('ui-performance setting contains invalid data'); // eslint-disable-line no-console
      }
    }

    return {
      perfConfig,
      init:              false,
      counts:            {},
      dataKey:           null,
      isDataGrouped:     false,
      multipleResources: []
    };
  },

  computed: { ...mapGetters({ requestData: 'manual-refresh/requestData' }) },
  watch:    {
    requestData(neu) {
      // this is where the data assignment will trigger the update of the list view...
      if (this.init && neu) {
        console.log('*** MIXIN ::: data update is triggered!!!! ***', neu);

        if (this.isDataGrouped) {
          const data = neu.map(item => item.value);

          this[`${ this.dataKey }`] = data;
        } else {
          neu.forEach((res) => {
            this[`${ res.dataKey }`] = res.value;
          });
        }
      }
    }
  },
  methods:  {
    getCountForResource(resourceName) {
      let resourceCount;

      if (this.counts[`${ resourceName }`]) {
        resourceCount = this.counts[`${ resourceName }`].summary?.count;
      }

      return resourceCount || 0;
    },
    gatherManualRefreshData(dataKey, multipleResources = [], isDataGrouped) {
      // flag to prevent a first data update being triggered from the requestData watcher
      this.init = true;

      // settings config
      const manualDataRefresh = this.perfConfig?.manualRefresh.enabled;
      const manualDataThreshold = parseInt(this.perfConfig?.manualRefresh?.threshold || '0', 10);

      // other vars
      const resourceName = this.resource;
      const inStore = this.$store.getters['currentStore'](resourceName);
      let resourceCount = 0;
      let watch = true;
      let isTooManyItemsToAutoUpdate = false;

      this.multipleResources = multipleResources;
      this.dataKey = dataKey;

      // for the special case of workload where this.resources = array with array of data
      this.isDataGrouped = isDataGrouped;

      console.log('************* MIXIN ::: MANUAL REFRESH LOAD !!!! *************', resourceName);
      console.log('*** MIXIN ::: dataKey ***', dataKey);
      console.log('*** MIXIN ::: resourceCount ***', resourceCount);
      console.log('*** MIXIN ::: isDataGrouped ***', isDataGrouped);
      console.log('*** MIXIN ::: multipleResources ***', multipleResources);

      // get resource counts
      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        this.counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        if (this.multipleResources.length) {
          this.multipleResources.forEach((item) => {
            resourceCount = resourceCount + this.getCountForResource(item.resourceName);
          });
        } else {
          resourceCount = this.getCountForResource(resourceName);
        }
      }

      console.log('*** MIXIN ::: resourceCount ***', resourceCount);
      console.log('*** MIXIN ::: manualDataRefresh ***', manualDataRefresh);
      console.log('*** MIXIN ::: manualDataThreshold ***', manualDataThreshold);

      // here we check if resource count is bigger than the threshold so that we disable the watch of this data coming from the BE
      if (manualDataRefresh && resourceCount >= manualDataThreshold) {
        watch = false;
        isTooManyItemsToAutoUpdate = true;
      }

      console.log('*** MIXIN ::: isTooManyItemsToAutoUpdate ***', isTooManyItemsToAutoUpdate);
      console.log('*** MIXIN ::: watch ***', watch);

      if (!multipleResources.length) {
        // update the manual fetch store with the data needed to perform the request when we click on refresh
        this.$store.dispatch('manual-refresh/updateRefreshData', {
          refreshData: [{
            resourceName,
            inStore,
            dataKey,
          }],
          isTooManyItemsToAutoUpdate
        });
      } else {
        // special case for workloads and equivalent list views
        this.$store.dispatch('manual-refresh/updateRefreshData', {
          refreshData: multipleResources,
          isTooManyItemsToAutoUpdate,
        });
      }

      return watch;
    },
  },

  beforeDestroy() {
    this.$store.dispatch('manual-refresh/clearData');
  },

};
