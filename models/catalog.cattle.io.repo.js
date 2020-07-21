export default {
  isRancher() {
    return !!(this.spec?.url || '').match(/^https?:\/\/[^\/]*\.rancher\.io\//);
  },
};
