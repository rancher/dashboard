export default {
  applyDefaults() {
    return () => {
      this.spec = { url: '' };
    };
  },

  isRancher() {
    return !!(this.spec?.url || '').match(/^https?:\/\/[^\/]*\.rancher\.io(\/|$)/);
  },
};
