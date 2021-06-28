export default {

  nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  },

  provider() {
    return 'linode';
  },

  providerLocation() {
    return this.spec.template.spec.region ;
  },

  providerSize() {
    return this.spec.template.spec.instanceType;
  }
};
