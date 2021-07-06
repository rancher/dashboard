export default {

  nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  },

  provider() {
    return 'amazonec2';
  },

  providerLocation() {
    return `${ this.spec.template.spec.region }${ this.spec.template.spec.zone }`;
  },

  providerSize() {
    return this.spec.template.spec.instanceType;
  }
};
