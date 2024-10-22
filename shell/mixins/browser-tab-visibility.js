import { NORMAN } from '@shell/config/types';
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
        await this.$store.dispatch('rancher/request', {
          type: NORMAN.USER,
          opt:  { url: '/v3/users?me=true' }
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
