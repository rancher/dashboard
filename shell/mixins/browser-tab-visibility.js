import { EXT } from '@shell/config/types';
import { mapGetters } from 'vuex';

export default {
  computed: { ...mapGetters(['isSingleProduct']) },
  methods:  {
    setTabVisibilityListener(isAdd) {
      if ((!this.isSingleProduct || this.isSingleProduct?.enableSessionCheck) && this.$config.rancherEnv !== 'desktop') {
        const method = isAdd ? 'addEventListener' : 'removeEventListener';

        document[method]('visibilitychange', this.visibilityChange, true);
      }
    },

    async visibilityChange() {
      if (!document.hidden) {
        await this.$store.dispatch('management/request', {
          url:    `/v1/${ EXT.SELFUSER }`,
          method: 'POST',
          data:   {}
        });
      }
    },
  },

  mounted() {
    this.setTabVisibilityListener(true);
  },
  beforeUnmount() {
    this.setTabVisibilityListener(false);
  },
};
