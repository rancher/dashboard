import { COUNT, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

// Number of pages to fetch when loading incrementally
const PAGES = 4;

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

    return { fetchedResourceType: [], perfConfig };
  },

  methods: {
    /**
     * Fetch all resources for a given type, taking into consideraton the incremental loading configuration
     */
    $fetchType(type) {
      const inStore = this.$store.getters['currentStore'](COUNT);

      let incremental = 0;

      if (this.perfConfig?.incrementalLoading?.enabled) {
        const config = this.$getTypeFetchMetadata(type);

        const threshold = parseInt(this.perfConfig?.incrementalLoading?.threshold || '0', 10);

        if (threshold > 0 && config.total > threshold) {
          incremental = Math.ceil(config.total / PAGES);
        }
      }

      return this.$store.dispatch(`${ inStore }/findAll`, { type, opt: { incremental } });
    },

    $getTypeFetchMetadata(type) {
      const inStore = this.$store.getters['currentStore'](COUNT);
      const clusterCounts = this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts;
      const summary = clusterCounts?.[type]?.summary || {};
      // const total = summary.count || 0;

      return { total: summary.count || 0 };
    }
  },
};
