import Vue from 'vue';

export default {
  applyDefaults() {
    return () => {
      if ( !this.spec ) {
        Vue.set(this, 'spec', { url: '' });
      }
    };
  },

  isRancher() {
    return !!(this.spec?.url || '').match(/^https?:\/\/[^\/]*\.rancher\.io(\/|$)/);
  },
};
