import { mapGetters } from 'vuex';
import { COUNT, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  data() {
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
      init:    false,
      dataKey: null
    };
  },

  computed: { ...mapGetters({ requestData: 'manual-refresh/requestData' }) },
  watch:    {
    requestData(neu) {
      if (this.init && neu) {
        console.log('*** MIXIN ::: data update is triggered!!!! ***', neu);
        this[`${ this.dataKey }`] = neu;
      }
    }
  },
  methods:  {
    gatherManualRefreshData(dataKey) {
      this.init = true;

      const manualDataRefresh = this.perfConfig?.manualRefresh.enabled;
      const manualDataThreshold = parseInt(this.perfConfig?.manualRefresh?.threshold || '0', 10);
      const resourceName = this.resource;
      const inStore = this.$store.getters['currentStore'](resourceName);
      let resourceCount = 0;
      let watch = true;
      let isTooManyItemsToAutoUpdate = false;

      this.dataKey = dataKey;

      console.log('************* MIXIN ::: MANUAL REFRESH LOAD !!!! *************', resourceName);

      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        const counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        if (counts[`${ resourceName }`]) {
          resourceCount = counts[`${ resourceName }`].summary?.count;
        }
      }

      console.log('*** MIXIN ::: resourceCount ***', resourceCount);
      console.log('*** MIXIN ::: manualDataRefresh ***', manualDataRefresh);
      console.log('*** MIXIN ::: manualDataThreshold ***', manualDataThreshold);

      if (manualDataRefresh && resourceCount >= manualDataThreshold) {
        watch = false;
        isTooManyItemsToAutoUpdate = true;
      }

      console.log('*** MIXIN ::: isTooManyItemsToAutoUpdate ***', isTooManyItemsToAutoUpdate);
      console.log('*** MIXIN ::: watch ***', watch);

      this.$store.dispatch('manual-refresh/updateRefreshData', {
        resourceName,
        inStore,
        isTooManyItemsToAutoUpdate,
      });

      return watch;
    },
  }

};
