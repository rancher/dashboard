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
      multipleResources: []
    };
  },

  computed: { ...mapGetters({ refreshFlag: 'manual-refresh/refreshFlag' }) },
  watch:    {
    refreshFlag(neu) {
      // this is where the data assignment will trigger the update of the list view...
      if (this.init && neu) {
        console.log('*** MIXIN ::: data update triggered ***', neu);
        this.$fetch();
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
    gatherManualRefreshData(multipleResources = []) {
      // flag to prevent a first data update being triggered from the requestData watcher
      this.init = true;

      // settings config
      const manualDataRefresh = this.perfConfig?.manualRefresh.enabled;
      const manualDataThreshold = parseInt(this.perfConfig?.manualRefresh?.threshold || '0', 10);

      // other vars
      this.multipleResources = multipleResources;
      const resourceName = this.resource;
      const inStore = this.$store.getters['currentStore'](resourceName);
      let resourceCount = 0;
      let watch = true;
      let isTooManyItemsToAutoUpdate = false;

      console.log('************* MIXIN ::: MANUAL REFRESH LOAD !!!! *************', resourceName);
      // get resource counts
      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        this.counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        if (this.multipleResources.length) {
          this.multipleResources.forEach((item) => {
            resourceCount = resourceCount + this.getCountForResource(item);
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

      // pass on the flag that controls the appearance of the manual refresh button on the sortable table
      this.$store.dispatch('manual-refresh/updateIsTooManyItems', isTooManyItemsToAutoUpdate);

      return watch;
    },
  },

  beforeDestroy() {
    // clear up the store to make sure we aren't storing anything that might interfere with the next rendered list view
    this.$store.dispatch('manual-refresh/clearData');
  },

};
