export default {

  nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  },

  provider() {
    return 'azure';
  },

  providerLocation() {
    return this.spec.template.spec.location ;
  },

  providerSize() {
    return this.spec.template.spec.size;
  }
};
