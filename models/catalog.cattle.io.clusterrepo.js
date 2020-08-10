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
    const re = /^(git|https?):\/\/[^\/]*\.rancher\.io(\/|$)/i;

    if ( (this.spec?.url || '').match(re) ) {
      return true;
    }

    if ( (this.spec?.gitRepo || '').match(re) ) {
      return true;
    }

    return false;
  },

  canLoad() {
    return this.metadata?.state?.name === 'active';
  },

  displayType() {
    if ( this.spec.gitRepo ) {
      return 'git';
    } else {
      return 'http';
    }
  },

  displayUrl() {
    return this.status?.url || this.spec.gitRepo || this.spec.url;
  },
};
