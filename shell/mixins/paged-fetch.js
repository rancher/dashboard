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

  beforeDestroy() {
    const inStore = this.$store.getters['currentStore'](COUNT);

    this.fetchedResourceType.forEach((type) => {
      this.$store.dispatch(`${ inStore }/incrementLoadCounter`, type);
    });
  },

  methods: {
    /**
     * Fetch all resources for a given type, taking into consideraton the incremental loading configuration
     */
    $fetchType(type) {
      const inStore = this.$store.getters['currentStore'](COUNT);
      const { incremental } = this.$getTypeFetchMetadata(type);

      this.fetchedResourceType.push(type);

      return this.$store.dispatch(`${ inStore }/findAll`, { type, opt: { incremental } });
    },

    $getTypeFetchMetadata(type) {
      if (this.perfConfig?.incrementalLoading?.enabled) {
        const inStore = this.$store.getters['currentStore'](COUNT);
        const clusterCounts = this.$store.getters[`${ inStore }/all`](COUNT)?.[0]?.counts;
        const summary = clusterCounts?.[type]?.summary || {};
        const threshold = parseInt(this.perfConfig?.incrementalLoading?.threshold || '0', 10);
        const total = summary.count || 0;
        let incremental = 0;

        if (threshold > 0 && total > threshold) {
          incremental = Math.ceil(total / PAGES);
        }

        return {
          enabled: true,
          total,
          incremental,
          threshold,
        };
      }

      return {
        enabled:     false,
        incremental: 0,
        total:       0,
        threshold:   0
      };
    }
  },
};
