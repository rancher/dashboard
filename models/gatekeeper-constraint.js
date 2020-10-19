export default {
  doneOverride() {
    return () => {
      this.currentRouter().replace({ name: 'c-cluster-gatekeeper-constraints' });
    };
  },

  detailLocation() {
    return {
      name:   'c-cluster-gatekeeper-constraints-resource-id',
      params: {
        resource: this.type,
        id:       this.id
      }
    };
  }
};
