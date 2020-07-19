export default {
  nameDisplay() {
    let out = this.spec?.displayName || this.metadata?.name || this.id || '';

    out = out.replace(/^sh\.helm\.release\.v1\./, '');

    return out;
  },
};
