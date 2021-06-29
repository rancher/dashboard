export default {

  nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  },

  provider() {
    return 'digitalocean';
  },

  providerLocation() {
    return this.spec.template.spec.region ;
  },

  providerSize() {
    return this.spec.template.spec.size;
  }
};
