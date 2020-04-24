export default {
  groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  },
};
