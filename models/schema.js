export default {
  groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  },

  canGetCollection() {
    return !!this?.collectionMethods.find(x => x.toLowerCase() === 'get') && !!this.links?.collection;
  },

};
