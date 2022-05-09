import { NORMAN } from '@/config/types';

export default {
  methods: {
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
};
