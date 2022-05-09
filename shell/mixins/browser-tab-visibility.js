import { NORMAN } from '@/config/types';

export default {
  methods: {
    setTabVisibilityListener(isAdd) {
      const method = isAdd ? 'addEventListener' : 'removeEventListener';

      isAdd ? console.log('SETTING TAB VIS LISTENER') : console.log('REMOVING TAB VIS LISTENER');
      document[method]('visibilitychange', this.visibilityChange, true);
    },

    async visibilityChange() {
      console.log('VIS CHANGE TRIGGERED!');
      if (!document.hidden) {
        console.log('PINGING SERVER FROM TAB VISIBILITY LISTENER');
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
