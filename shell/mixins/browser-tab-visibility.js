import { NORMAN } from '@shell/config/types';
import { mapGetters } from 'vuex';

export default {
  computed: { ...mapGetters(['isSingleProduct']) },
  methods:  {
    setTabVisibilityListener(isAdd) {
      const method = isAdd ? 'addEventListener' : 'removeEventListener';

      document[method]('visibilitychange', this.visibilityChange, true);
    },

    async visibilityChange() {
      if (!document.hidden) {
        await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.USER,
          opt:  {
            url:    '/v3/users',
            filter: { me: true },
            force:  true
          }
        });
      }
    },
  },

  mounted() {
    if ((!this.isSingleProduct || this.isSingleProduct?.enableSessionCheck) && this.$config.rancherEnv !== 'desktop') {
      this.setTabVisibilityListener(true);
    }
  },
  beforeDestroy() {
    if ((!this.isSingleProduct || this.isSingleProduct?.enableSessionCheck) && this.$config.rancherEnv !== 'desktop') {
      this.setTabVisibilityListener(false);
    }
  },
};
