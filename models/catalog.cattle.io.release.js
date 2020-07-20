export default {
  nameDisplay() {
    const out = this.spec?.name || this.metadata?.name || this.id || '';

    return out;
  },
};
